"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Phone,
  Video,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Send,
  Trash2,
  Loader2,
  Info,
  MoreVertical,
} from "lucide-react";
import NotificationCenter from "../components/NotificationCenter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Group = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
};

type Member = {
  id: string;
  email: string;
  role?: string;
};

type Message = {
  id: string;
  user_email: string;
  message: string;
  created_at: string;
};

type CurrentUser = {
  id: string;
  email: string;
};

type Attachment = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

type ParsedMessage = {
  text: string;
  attachments: Attachment[];
  system?: boolean;
};

type DocumentItem = {
  id: string;
  title: string;
  source_url: string;
  pdf_path: string;
  created_at: string;
  shared_by_email?: string;
  shared_at?: string;
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callModal, setCallModal] = useState(false);
  const [videoModal, setVideoModal] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const [sending, setSending] = useState(false);
  const [sharedDocs, setSharedDocs] = useState<DocumentItem[]>([]);
  const [createModal, setCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupImage, setNewGroupImage] = useState<string | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [participantModal, setParticipantModal] = useState(false);
  const [participantInput, setParticipantInput] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [infoTab, setInfoTab] = useState<"search" | "media" | "docs" | "members">("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [imageViewer, setImageViewer] = useState<{ open: boolean; src: string; name?: string; zoom: number }>({ open: false, src: "", name: "", zoom: 1 });

  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const token = typeof window !== "undefined" ? localStorage.getItem("sa_token") : null;
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const typingSourceRef = useRef<EventSource | null>(null);

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [groups]);

  const parseMessage = (content: string): ParsedMessage => {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object" && (parsed.text || parsed.attachments)) {
        return {
          text: parsed.text || "",
          attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [],
          system: Boolean((parsed as any).system),
        };
      }
    } catch (_) {
      /* plain string */
    }
    return { text: content, attachments: [] };
  };

  const highlightText = (text: string, term: string) => {
    if (!term) return text;
    const regex = new RegExp(`(${term.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi");
    return text.split(regex).map((part, idx) =>
      idx % 2 === 1 ? (
        <mark key={`${part}-${idx}`} className="bg-amber-200 text-slate-900 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        <span key={`${part}-${idx}`}>{part}</span>
      )
    );
  };

  const scrollToItem = (id: string) => {
    const target = itemRefs.current[id];
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const loadUser = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      setUser({ id: data.id, email: data.email });
    }
  };

  const loadGroups = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/groups`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        if (!selectedGroup && data.length) setSelectedGroup(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (groupId: string) => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/groups/${groupId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      setMembers(data);
    }
  };

  const loadMessages = async (groupId: string) => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/groups/${groupId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  };


  useEffect(() => {
    loadUser();
    loadGroups();
  }, [token]);

  useEffect(() => {
    if (!selectedGroup) return;
    loadMembers(selectedGroup.id);
    loadMessages(selectedGroup.id);
    if (token) {
      fetch(`${API_BASE}/documents/shared/${selectedGroup.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => (res.ok ? res.json() : []))
        .then(setSharedDocs)
        .catch(() => {});
    }
    const interval = setInterval(() => {
      loadMessages(selectedGroup.id);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedGroup]);

  const mergedFeed = useMemo(() => {
    const mappedMessages = messages.map((m) => ({
      type: "message" as const,
      id: m.id,
      created_at: m.created_at,
      payload: m,
    }));
    const mappedShared = sharedDocs.map((d) => ({
      type: "shared" as const,
      id: d.id,
      created_at: d.shared_at || d.created_at,
      payload: d,
    }));
    return [...mappedMessages, ...mappedShared].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [messages, sharedDocs]);

  useEffect(() => {
    if (selectedGroup) {
      setEditName(selectedGroup.name);
      setEditDescription(selectedGroup.description || "");
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedGroup || !token) return;
    if (typingSourceRef.current) {
      typingSourceRef.current.close();
    }
    const src = new EventSource(`${API_BASE}/groups/${selectedGroup.id}/typing/stream?token=${token}`);
    typingSourceRef.current = src;
    src.onmessage = (event) => {
      if (!event.data) return;
      try {
        const payload = JSON.parse(event.data);
        if (payload?.user_email && payload.user_email !== user?.email) {
          setTypingUsers((prev) => ({ ...prev, [payload.user_email]: Date.now() }));
        }
      } catch (_) {}
    };
    src.onerror = () => {
      src.close();
    };
    return () => src.close();
  }, [selectedGroup, token, user?.email]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const next: Record<string, number> = {};
        Object.entries(prev).forEach(([email, ts]) => {
          if (now - ts < 4000) next[email] = ts;
        });
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const sendTyping = (isTyping: boolean) => {
    if (!selectedGroup || !token) return;
    fetch(`${API_BASE}/groups/${selectedGroup.id}/typing`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_typing: isTyping }),
    }).catch(() => {});
  };

  const handleInputChange = (val: string) => {
    setNewMessage(val);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    sendTyping(true);
    typingTimeout.current = setTimeout(() => sendTyping(false), 1500);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const allowed = Array.from(files).filter((file) => {
      if (file.type.startsWith("video/")) {
        setError("Video uploads are not allowed for research mode.");
        return false;
      }
      const isImage = file.type.startsWith("image/");
      const isDoc = file.type === "application/pdf" || file.type.includes("msword") || file.type.includes("officedocument");
      return isImage || isDoc;
    });

    allowed.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGroupImage = (file: File | null) => {
    if (!file) {
      setNewGroupImage(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setNewGroupImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const openImageViewer = (src: string, name?: string) => {
    setImageViewer({ open: true, src, name, zoom: 1 });
  };

  const adjustZoom = (delta: number) => {
    setImageViewer((prev) => ({ ...prev, zoom: Math.max(0.5, Math.min(3, prev.zoom + delta)) }));
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newGroupName.trim()) return;
    setCreatingGroup(true);
    setError(null);
    const res = await fetch(`${API_BASE}/groups`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newGroupName.trim(), description: newGroupDescription.trim() || undefined }),
    }).catch(() => null);
    setCreatingGroup(false);
    if (!res || !res.ok) {
      setError("Failed to create group");
      return;
    }
    const group = await res.json();
    setGroups((prev) => [group, ...prev]);
    setSelectedGroup(group);
    setCreateModal(false);
    setNewGroupName("");
    setNewGroupDescription("");
    setNewGroupImage(null);
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedGroup) return;
    setError(null);
    const res = await fetch(`${API_BASE}/groups/${selectedGroup.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: editName.trim() || selectedGroup.name, description: editDescription.trim() || null }),
    }).catch(() => null);
    if (!res || !res.ok) {
      setError("Failed to update group");
      return;
    }
    const updated = await res.json();
    setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setSelectedGroup(updated);
    setEditModal(false);
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedGroup || !participantInput.trim()) return;
    setError(null);
    const res = await fetch(`${API_BASE}/groups/${selectedGroup.id}/members`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_identifier: participantInput.trim() }),
    }).catch(() => null);
    if (!res || !res.ok) {
      setError("Failed to add participant");
      return;
    }
    setParticipantModal(false);
    setParticipantInput("");
    loadMembers(selectedGroup.id);
  };

  const handleDeleteGroup = async () => {
    if (!token || !selectedGroup) return;
    setError(null);
    const res = await fetch(`${API_BASE}/groups/${selectedGroup.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
    if (!res || !res.ok) {
      setError("Failed to delete group");
      return;
    }
    setGroups((prev) => prev.filter((g) => g.id !== selectedGroup.id));
    const next = sortedGroups.filter((g) => g.id !== selectedGroup.id)[0] || null;
    setSelectedGroup(next);
    setMembers([]);
    setMessages([]);
    setDeleteModal(false);
  };


  const handleLeaveGroup = async () => {
    if (!token || !selectedGroup) return;
    setError(null);
    const res = await fetch(`${API_BASE}/groups/${selectedGroup.id}/leave`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
    if (!res || !res.ok) {
      setError("Failed to leave group");
      return;
    }
    await res.json();
    setGroups((prev) => prev.filter((g) => g.id !== selectedGroup.id));
    const next = sortedGroups.filter((g) => g.id !== selectedGroup.id)[0] || null;
    setSelectedGroup(next);
    setMembers([]);
    setMessages([]);
    setSharedDocs([]);
    setMoreOpen(false);
  };

  const handleSend = async () => {
    if (!selectedGroup || !token) return;
    if (!newMessage.trim() && attachments.length === 0) return;
    setSending(true);
    setError(null);
    const payload = JSON.stringify({ text: newMessage.trim(), attachments });
    const res = await fetch(`${API_BASE}/groups/${selectedGroup.id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: payload }),
    }).catch(() => null);

    setSending(false);
    if (!res || !res.ok) {
      setError("Failed to send message");
      return;
    }
    const msg = await res.json();
    setMessages((prev) => [...prev, msg]);
    setNewMessage("");
    setAttachments([]);
    sendTyping(false);
  };

  const handleUnsend = async (messageId: string) => {
    if (!selectedGroup || !token) return;
    const res = await fetch(`${API_BASE}/groups/${selectedGroup.id}/messages/${messageId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
    if (res && res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  const typingDisplay = Object.keys(typingUsers).filter((email) => email !== user?.email);

  const mediaItems = useMemo(() => {
    const items: { id: string; name: string; dataUrl: string; type: string }[] = [];
    messages.forEach((m) => {
      const parsed = parseMessage(m.message);
      parsed.attachments
        .filter((a) => a.type.startsWith("image/"))
        .forEach((a, idx) => items.push({ id: `${m.id}-${idx}`, name: a.name, dataUrl: a.dataUrl, type: a.type }));
    });
    return items;
  }, [messages]);

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [] as { id: string; type: string; snippet: string }[];
    return mergedFeed
      .map((item) => {
        if (item.type === "message") {
          const parsed = parseMessage((item.payload as Message).message);
          const text = parsed.text || "";
          if (text.toLowerCase().includes(term)) {
            return { id: item.id, type: "Message", snippet: text };
          }
          return null;
        }
        const doc = item.payload as DocumentItem;
        const blob = `${doc.title} ${doc.source_url}`;
        if (blob.toLowerCase().includes(term)) {
          return { id: item.id, type: "Document", snippet: doc.title };
        }
        return null;
      })
      .filter(Boolean) as { id: string; type: string; snippet: string }[];
  }, [mergedFeed, searchTerm]);

  return (
    <main className="min-h-screen bg-[#f4f6fa] relative overflow-visible text-slate-800 font-sans p-4 md:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-pink-100/60 blur-[100px] rounded-full mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] bg-orange-100/60 blur-[100px] rounded-full mix-blend-multiply" />
        <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-100/60 blur-[100px] rounded-full mix-blend-multiply" />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10 space-y-6">
        <nav className="relative z-50 flex flex-wrap items-center justify-between gap-4 text-slate-600 overflow-visible">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#7a6dfa] rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <div className="w-3 h-3 bg-white rounded-full relative">
                <div className="absolute -right-1 -top-1 w-2 h-2 bg-indigo-300 rounded-full" />
              </div>
            </div>
          </div>

          <div className="flex items-center bg-white/70 backdrop-blur-xl rounded-full p-1.5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-white flex-1 max-w-[640px] justify-between px-2 hidden md:flex mx-4">
            <Link href="/dashboard" className="px-6 py-2.5 text-sm font-medium hover:text-slate-800 transition-colors">
              Dashboard
            </Link>
            <Link href="/documents" className="px-6 py-2.5 text-sm font-medium hover:text-slate-800 transition-colors">
              Documents
            </Link>
            <Link href="/groups" className="px-6 py-2.5 text-sm font-semibold bg-white rounded-full shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] text-slate-800">
              Groups
            </Link>
            <Link href="/workspace" className="px-6 py-2.5 text-sm font-medium hover:text-slate-800 transition-colors">
              Workspace
            </Link>
          </div>

          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xl rounded-full px-3 py-2 border border-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] relative">
            <NotificationCenter token={token} onInvitationHandled={() => loadGroups()} />
            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-slate-200">
              <button className="flex items-center gap-2" onClick={() => setMenuOpen((v) => !v)} aria-label="User menu">
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shadow-sm flex items-center justify-center text-xs font-semibold text-slate-700">
                  {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs text-slate-400">Signed in</span>
                  <span className="text-sm font-semibold text-slate-700 truncate max-w-[160px]">{user?.email || "User"}</span>
                </div>
                <ChevronDown size={14} className="text-slate-500" />
              </button>
              {menuOpen && (
                <div className="absolute top-full right-0 mt-3 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 text-sm z-50">
                  <div className="px-2 py-2 rounded-xl bg-slate-50 mb-2">
                    <p className="text-xs text-slate-500">User ID</p>
                    <p className="text-xs font-semibold text-slate-800 break-all">{user?.id || "—"}</p>
                  </div>
                  <button className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-50 font-medium text-slate-700" onClick={() => (window.location.href = "/account")}>
                    Account settings
                  </button>
                  <button
                    className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-50 font-medium text-red-600"
                    onClick={() => {
                      localStorage.removeItem("sa_token");
                      window.location.href = "/auth/login";
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: rightOpen ? "320px 1fr 340px" : "320px 1fr" }}
        >
          {/* Left rail: chat list */}
          <aside className="rounded-3xl bg-white shadow-[0_18px_48px_-18px_rgba(0,0,0,0.12)] border border-slate-100 p-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-semibold">{user?.email ? user.email[0].toUpperCase() : "U"}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{user?.email || "User"}</p>
                <span className="text-xs text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">available</span>
              </div>
              <Bell size={18} className="text-slate-500" />
            </div>

            <div className="relative">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="Search chats"
              />
              <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Last chats</span>
              <button className="p-1 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50" onClick={() => setCreateModal(true)} aria-label="Add group">＋</button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1 max-h-[60vh]">
              {sortedGroups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroup(g)}
                  className={`w-full rounded-2xl border flex items-center gap-3 px-3 py-3 text-left transition ${
                    selectedGroup?.id === g.id ? "border-emerald-200 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-emerald-100"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-700">{g.name[0]?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{g.name}</p>
                    <p className="text-xs text-slate-500 truncate">{g.description || "Last activity"}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">{new Date(g.created_at).toLocaleDateString()}</span>
                </button>
              ))}
              {sortedGroups.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 text-center">No groups yet</div>
              )}
            </div>
          </aside>

          {/* Middle: chat */}
          <section className="rounded-3xl bg-white border border-slate-100 shadow-[0_18px_48px_-18px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden min-h-[75vh] max-h-[75vh]">
            <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selectedGroup?.name || "Group Chat"}</h2>
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> {members.length} collaborators
                </p>
              </div>
              <div className="flex items-center gap-2 relative">
                <button className="w-9 h-9 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setCallModal(true)}>
                  <Phone className="w-4 h-4 mx-auto" />
                </button>
                <button className="w-9 h-9 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setVideoModal(true)}>
                  <Video className="w-4 h-4 mx-auto" />
                </button>
                <button className={`w-9 h-9 rounded-full border ${rightOpen ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-700"} hover:bg-slate-50`} onClick={() => setRightOpen((v) => !v)} aria-label="Toggle info panel">
                  <Info className="w-4 h-4 mx-auto" />
                </button>
                <button className="w-9 h-9 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setMoreOpen((v) => !v)} aria-label="More actions">
                  <MoreVertical className="w-4 h-4 mx-auto" />
                </button>
                {moreOpen && (
                  <div className="absolute right-0 top-12 w-52 rounded-2xl bg-white border border-slate-100 shadow-2xl p-2 text-sm z-20">
                    <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50" onClick={() => { setMoreOpen(false); setEditModal(true); }}>
                      Edit group name
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50" onClick={() => { setMoreOpen(false); setParticipantModal(true); }}>
                      Add participants
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 text-amber-700" onClick={() => { setMoreOpen(false); handleLeaveGroup(); }}>
                      Leave group
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600" onClick={() => { setMoreOpen(false); setDeleteModal(true); }}>
                      Delete group chat
                    </button>
                  </div>
                )}
              </div>
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4 bg-slate-50">
              {mergedFeed.map((item) => {
                if (item.type === "message") {
                  const msg = item.payload as Message;
                  const parsed = parseMessage(msg.message);
                  const isMine = msg.user_email.toLowerCase() === (user?.email || "").toLowerCase();

                  if (parsed.system) {
                    return (
                      <div key={`msg-${msg.id}`} ref={(el) => (itemRefs.current[msg.id] = el)} className="flex justify-center">
                        <div className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                          {highlightText(parsed.text || `${msg.user_email} left the group`, searchTerm)}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={`msg-${msg.id}`} ref={(el) => (itemRefs.current[msg.id] = el)} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[72%] rounded-2xl px-4 py-3 border shadow-sm ${
                          isMine ? "bg-emerald-500 text-white border-emerald-400" : "bg-white text-slate-900 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold ${isMine ? "text-white/90" : "text-slate-700"}`}>{msg.user_email}</span>
                          <span className={`text-[11px] ${isMine ? "text-white/75" : "text-slate-500"}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </span>
                          {isMine && (
                            <button className="ml-auto text-[11px] flex items-center gap-1 text-white/85 hover:text-white" onClick={() => handleUnsend(msg.id)} title="Unsend">
                              <Trash2 className="w-3 h-3" /> Unsend
                            </button>
                          )}
                        </div>
                        {parsed.text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{highlightText(parsed.text, searchTerm)}</p>}
                        {parsed.attachments?.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {parsed.attachments.map((file, idx) => {
                              const isImage = file.type.startsWith("image/");
                              return (
                                <div key={idx} className={`rounded-xl border ${isMine ? "border-white/30 bg-white/10" : "border-slate-200 bg-slate-50"} p-3`}>
                                  <div className={`flex items-center justify-between text-xs font-medium ${isMine ? "text-white/80" : "text-slate-700"}`}>
                                    <span className={isMine ? "text-white" : "text-slate-800"}>{file.name}</span>
                                    <a className={isMine ? "underline text-white" : "underline text-indigo-600"} href={file.dataUrl} download={file.name} target="_blank" rel="noreferrer">
                                      Download
                                    </a>
                                  </div>
                                  {isImage && (
                                    <button
                                      type="button"
                                      onClick={() => openImageViewer(file.dataUrl, file.name)}
                                      className={`mt-2 overflow-hidden rounded-lg border ${isMine ? "border-white/30" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-emerald-200`}
                                    >
                                      <img src={file.dataUrl} alt={file.name} className="max-h-52 w-full object-cover" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                const doc = item.payload as DocumentItem;
                const sharer = doc.shared_by_email || "Someone";
                return (
                  <div key={`shared-${doc.id}`} ref={(el) => (itemRefs.current[doc.id] = el)} className="flex justify-start">
                    <div className="max-w-[72%] rounded-2xl px-4 py-3 border shadow-sm bg-indigo-50 text-slate-900 border-indigo-100">
                      <div className="flex items-center gap-2 mb-1 text-indigo-700 text-xs font-semibold">
                        <FileText className="w-4 h-4" /> Shared PDF · {sharer}
                        {doc.shared_at && (
                          <span className="text-[11px] text-slate-500">{new Date(doc.shared_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-800 truncate" title={doc.title}>{highlightText(doc.title, searchTerm)}</p>
                      <p className="text-[11px] text-slate-500 truncate" title={doc.source_url}>{highlightText(doc.source_url, searchTerm)}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <a
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold shadow-sm hover:bg-emerald-600"
                          href={doc.pdf_path.startsWith("http") ? doc.pdf_path : `${API_BASE}${doc.pdf_path}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open PDF
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
              {typingDisplay.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {typingDisplay.join(", ")} is typing...
                </div>
              )}
            </div>

            <footer className="border-t border-slate-100 bg-white px-5 py-4 space-y-3">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, idx) => (
                    <div key={`${file.name}-${idx}`} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-sm text-slate-700">
                      <Paperclip className="w-4 h-4" />
                      <span className="truncate max-w-[160px]">{file.name}</span>
                      <button className="text-slate-500 hover:text-slate-800" onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                  <Info className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-3 py-2 border border-slate-200 focus-within:border-emerald-200 focus-within:ring-2 focus-within:ring-emerald-100">
                <label className="p-2 hover:bg-white rounded-xl cursor-pointer text-slate-600" title="Attach file">
                  <Paperclip className="w-4 h-4" />
                  <input type="file" className="hidden" multiple onChange={(e) => handleFiles(e.target.files)} />
                </label>
                <label className="p-2 hover:bg-white rounded-xl cursor-pointer text-slate-600" title="Attach image">
                  <ImageIcon className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" multiple onChange={(e) => handleFiles(e.target.files)} />
                </label>
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => sendTyping(true)}
                    onBlur={() => sendTyping(false)}
                    className="w-full bg-transparent outline-none text-sm py-2 px-2 resize-none max-h-28 text-slate-800 placeholder:text-slate-500"
                    placeholder="Write your message..."
                    rows={1}
                  />
                </div>
                <button
                  className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md hover:bg-emerald-600 disabled:opacity-50"
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </footer>
          </section>

          {rightOpen && (
            <aside className="rounded-3xl bg-white border border-slate-100 shadow-[0_18px_48px_-18px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden min-h-[75vh] max-h-[75vh]">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Workspace</p>
                  <h3 className="text-sm font-semibold text-slate-800">Search, media, and members</h3>
                </div>
                <button className="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50" onClick={() => setRightOpen(false)} aria-label="Close info panel">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="p-3">
                <div className="grid grid-cols-4 gap-1 bg-slate-50 rounded-2xl p-1 text-xs font-semibold text-slate-600">
                  {["search", "media", "docs", "members"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setInfoTab(tab as typeof infoTab)}
                      className={`px-2 py-2 rounded-xl capitalize ${infoTab === tab ? "bg-white shadow-sm text-slate-900" : "hover:bg-white/70"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
                {infoTab === "search" && (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        placeholder="Search in conversation"
                      />
                      <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{searchResults.length} matches</p>
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                      {searchResults.map((res) => (
                        <button
                          key={res.id}
                          onClick={() => scrollToItem(res.id)}
                          className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/60"
                        >
                          <p className="text-xs font-semibold text-emerald-700">{res.type}</p>
                          <p className="text-sm text-slate-800 line-clamp-2">{highlightText(res.snippet, searchTerm)}</p>
                        </button>
                      ))}
                      {searchResults.length === 0 && <p className="text-sm text-slate-500">No results yet. Try another keyword.</p>}
                    </div>
                  </div>
                )}

                {infoTab === "media" && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-800">Images shared ({mediaItems.length})</p>
                    <div className="grid grid-cols-2 gap-3">
                      {mediaItems.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => openImageViewer(m.dataUrl, m.name)}
                          className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 text-left shadow-sm hover:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        >
                          <img src={m.dataUrl} alt={m.name} className="h-28 w-full object-cover" />
                          <div className="p-2 text-xs text-slate-700 truncate" title={m.name}>{m.name}</div>
                        </button>
                      ))}
                      {mediaItems.length === 0 && <p className="text-sm text-slate-500">No images yet.</p>}
                    </div>
                  </div>
                )}

                {infoTab === "docs" && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-800">Shared docs ({sharedDocs.length})</p>
                    <div className="space-y-2">
                      {sharedDocs.map((doc) => (
                        <div key={doc.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50">
                          <p className="text-sm font-semibold text-slate-800 truncate" title={doc.title}>{doc.title}</p>
                          <p className="text-[11px] text-slate-500 truncate" title={doc.source_url}>{doc.source_url}</p>
                          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                            <span>{doc.shared_by_email || "Shared"}</span>
                            <a
                              className="text-emerald-600 font-semibold hover:underline"
                              href={doc.pdf_path.startsWith("http") ? doc.pdf_path : `${API_BASE}${doc.pdf_path}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open
                            </a>
                          </div>
                        </div>
                      ))}
                      {sharedDocs.length === 0 && <p className="text-sm text-slate-500">No shared documents.</p>}
                    </div>
                  </div>
                )}

                {infoTab === "members" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">Members ({members.length})</p>
                      <button className="text-xs text-emerald-600 font-semibold" onClick={() => setParticipantModal(true)}>
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{m.email}</p>
                            <p className="text-[11px] text-slate-500">{m.role || "member"}</p>
                          </div>
                        </div>
                      ))}
                      {members.length === 0 && <p className="text-sm text-slate-500">No members loaded.</p>}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}

        </div>
      </div>

      {createModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Add group chat</h3>
                <p className="text-sm text-slate-500">Set a name and optional image.</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setCreateModal(false)} aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreateGroup}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Group name</label>
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  placeholder="e.g. Real estate deals"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description (optional)</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
                  rows={3}
                  placeholder="What is this group for?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Group image (optional)</label>
                <label className="flex items-center gap-3 p-3 border border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-200 hover:bg-emerald-50/40">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                    {newGroupImage ? <img src={newGroupImage} alt="Preview" className="w-full h-full object-cover" /> : <Paperclip className="w-4 h-4 text-slate-500" />}
                  </div>
                  <div className="text-sm text-slate-600">
                    <p className="font-semibold">Upload image</p>
                    <p className="text-xs text-slate-500">PNG/JPG, optional</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleGroupImage(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setCreateModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold shadow-md hover:bg-emerald-600 disabled:opacity-60"
                >
                  {creatingGroup ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Edit group</h3>
                <p className="text-sm text-slate-500">Update the name or description.</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setEditModal(false)} aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleUpdateGroup}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Group name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold shadow-md hover:bg-emerald-600">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {participantModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Add participant</h3>
                <p className="text-sm text-slate-500">Enter email or user ID to invite.</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setParticipantModal(false)} aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleAddParticipant}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email or user ID</label>
                <input
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setParticipantModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold shadow-md hover:bg-emerald-600">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Delete group chat?</h3>
            <p className="text-sm text-slate-600">This will remove the group, messages, tasks, and members.</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setDeleteModal(false)}>
                No
              </button>
              <button className="px-4 py-2 rounded-xl bg-rose-500 text-white font-semibold shadow-md hover:bg-rose-600" onClick={handleDeleteGroup}>
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}

      {imageViewer.open && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 text-white text-sm">
            <div className="flex items-center gap-3">
              <button className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20" onClick={() => adjustZoom(0.2)} aria-label="Zoom in">＋</button>
              <button className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20" onClick={() => adjustZoom(-0.2)} aria-label="Zoom out">－</button>
              <span className="text-xs opacity-80">{Math.round(imageViewer.zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              {imageViewer.name && <span className="text-xs opacity-80 truncate max-w-[260px]" title={imageViewer.name}>{imageViewer.name}</span>}
              <button className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20" onClick={() => setImageViewer((prev) => ({ ...prev, open: false }))} aria-label="Close viewer">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center px-6 pb-10" onClick={() => setImageViewer((prev) => ({ ...prev, open: false }))}>
            <div className="max-h-full max-w-6xl overflow-auto" onClick={(e) => e.stopPropagation()}>
              <img
                src={imageViewer.src}
                alt={imageViewer.name || "Preview"}
                style={{ transform: `scale(${imageViewer.zoom})`, transformOrigin: "center center" }}
                className="max-h-[80vh] max-w-[90vw] rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {(callModal || videoModal) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Feature under development</h3>
                <p className="text-sm text-slate-600">Calls and video conferencing are coming soon.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded-xl border border-slate-200" onClick={() => { setCallModal(false); setVideoModal(false); }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
