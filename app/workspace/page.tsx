"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bot,
  CheckSquare,
  ChevronDown,
  ExternalLink,
  FileText,
  Library,
  Loader2,
  Send,
  Square,
  User,
} from "lucide-react";
import NotificationCenter from "../components/NotificationCenter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://scholarly-aether-backend.onrender.com";

type DocumentItem = {
  id: string;
  title: string;
  source_url: string;
  pdf_path: string;
  created_at: string;
};

type CurrentUser = {
  id: string;
  email: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export default function WorkspacePage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("sa_token") : null;

  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/documents`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: DocumentItem[]) => {
        setDocs(data);
        setSelectedDocIds(data.slice(0, 2).map((d) => d.id));
      })
      .catch(() => {});

    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((u) => u && setUser({ id: u.id, email: u.email }))
      .catch(() => {});
  }, [token]);

  const selectedDocCount = useMemo(() => selectedDocIds.length, [selectedDocIds]);
  const selectedDocs = useMemo(() => docs.filter((doc) => selectedDocIds.includes(doc.id)), [docs, selectedDocIds]);

  const normalizeAssistantText = (text: string) => {
    return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "").trim();
  };

  const toggleDoc = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const selectAllDocs = () => {
    setSelectedDocIds(docs.map((doc) => doc.id));
  };

  const clearDocSelection = () => {
    setSelectedDocIds([]);
  };

  const handleAskAI = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedQuestion = question.trim();

    if (!token) {
      setError("Please sign in first.");
      return;
    }
    if (!trimmedQuestion) {
      setError("Please type your question.");
      return;
    }
    if (selectedDocIds.length === 0) {
      setError("Select at least one source before asking AI.");
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmedQuestion,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setSending(true);

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: trimmedQuestion, document_ids: selectedDocIds }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || "AI request failed");
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: normalizeAssistantText(data.answer || "No answer returned."),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setQuestion("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI request failed";
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#edf1f7] p-3 md:p-6 text-slate-700">
      <div className="mx-auto mb-5 max-w-[1400px]">
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
            <Link href="/groups" className="px-6 py-2.5 text-sm font-medium hover:text-slate-800 transition-colors">
              Groups
            </Link>
            <Link href="/workspace" className="px-6 py-2.5 text-sm font-semibold bg-white rounded-full shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] text-slate-800">
              Workspace
            </Link>
          </div>

          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xl rounded-full px-3 py-2 border border-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] relative">
            <NotificationCenter token={token} onInvitationHandled={() => {}} />
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
                    <p className="text-xs font-semibold text-slate-800 break-all">{user?.id || "-"}</p>
                  </div>
                  <button className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-50 font-medium text-slate-700" onClick={() => (window.location.href = "/account")}>Account settings</button>
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
      </div>

      <div className="mx-auto max-w-[1500px] rounded-[26px] border border-[#dbe2ef] bg-[#f7f9fc] shadow-[0_25px_70px_-40px_rgba(28,36,54,0.5)]">
        <div className="grid min-h-[84vh] grid-cols-1 lg:grid-cols-[300px_1fr]">
          <aside className="border-r border-[#e2e8f4] bg-white/70 p-4 md:p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#6f79ea] text-white">
                <Library className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Context Library</p>
                <p className="text-[11px] text-slate-500">Select files for AI context</p>
              </div>
            </div>

            <div className="mb-3 flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllDocs}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700"
              >
                <CheckSquare className="h-3.5 w-3.5" /> Select all
              </button>
              <button
                type="button"
                onClick={clearDocSelection}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700"
              >
                <Square className="h-3.5 w-3.5" /> Clear
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1 max-h-[64vh]">
              {docs.map((doc) => {
                const selected = selectedDocIds.includes(doc.id);
                return (
                  <label
                    key={doc.id}
                    className={`flex cursor-pointer gap-2 rounded-xl border px-2.5 py-2.5 transition-colors ${
                      selected ? "border-[#cfd8fb] bg-[#eef2ff]" : "border-transparent bg-white hover:border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleDoc(doc.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">{doc.title}</p>
                      <a
                        href={doc.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700"
                      >
                        <ExternalLink className="h-3 w-3" /> Source
                      </a>
                    </div>
                  </label>
                );
              })}

              {docs.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
                  No documents yet. Crawl first in Documents page.
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-[84vh] flex-col bg-[#f7f9fc]">
            <div className="border-b border-[#e5eaf5] bg-white/80 px-5 py-4">
              <h1 className="text-lg font-bold text-slate-800">Research Assistant</h1>
              <p className="text-xs text-slate-500">ChatGPT-style workspace with document-grounded answers</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10 space-y-6">
              {messages.length === 0 && (
                <div className="mx-auto max-w-2xl rounded-2xl border border-[#dde4f1] bg-white p-5 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">Ready when you are.</p>
                  <p className="mt-2">Ask anything based on your selected PDFs. The AI will only use those documents as context.</p>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className="mx-auto max-w-3xl">
                  <div className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role === "assistant" && (
                      <div className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#6f79ea] text-white">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                        message.role === "user"
                          ? "max-w-[75%] bg-slate-800 text-white"
                          : "max-w-[85%] border border-[#e0e6f3] bg-white text-slate-700"
                      }`}
                    >
                      {message.content}
                    </div>
                    {message.role === "user" && (
                      <div className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="mx-auto max-w-3xl flex gap-3">
                  <div className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#6f79ea] text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl border border-[#e0e6f3] bg-white px-4 py-3 text-sm text-slate-600 inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#e5eaf5] bg-white/90 px-4 py-4 md:px-8">
              <div className="mx-auto max-w-3xl">
                {selectedDocs.length > 0 && (
                  <div className="mb-2.5 flex flex-wrap gap-1.5">
                    {selectedDocs.slice(0, 5).map((doc) => (
                      <span key={doc.id} className="inline-flex items-center gap-1 rounded-full bg-[#eef2ff] px-2.5 py-1 text-[11px] font-semibold text-[#5c68d2]">
                        <FileText className="h-3 w-3" /> {doc.title}
                      </span>
                    ))}
                    {selectedDocs.length > 5 && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        +{selectedDocs.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                <form onSubmit={handleAskAI} className="rounded-2xl border border-[#d5ddec] bg-white p-2 shadow-sm">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      rows={3}
                      placeholder="Message AI with selected sources..."
                      className="min-h-[58px] w-full resize-none rounded-xl border-none bg-transparent px-2 py-2 text-sm outline-none"
                    />
                    <button
                      type="submit"
                      disabled={sending}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#6f79ea] text-white disabled:bg-[#a0a7e8]"
                      aria-label="Send"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </form>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Active sources: {selectedDocCount}</span>
                  <span>Model: liquid/lfm-2.5-1.2b-thinking:free</span>
                </div>
                {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
