"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Search,
  Filter,
  ExternalLink,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Share2,
  X,
  Users,
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

type CrawlJob = {
  id: string;
  url: string;
  status: string;
  created_at: string;
};

type CurrentUser = {
  id: string;
  email: string;
};

type Group = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [jobs, setJobs] = useState<CrawlJob[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [sharingGroupId, setSharingGroupId] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("sa_token") : null;

  const ITEMS_PER_PAGE = 5;

  const pdfUrl = useMemo(() => {
    return (path: string) => (path.startsWith("http") ? path : `${API_BASE}${path}`);
  }, []);

  const loadGroups = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/groups`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      setGroups(data);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/documents`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then(setDocs)
      .catch(() => {});

    loadGroups();

    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((u) => u && setUser({ id: u.id, email: u.email }))
      .catch(() => {});

    const loadJobs = () => {
      fetch(`${API_BASE}/crawl`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => (res.ok ? res.json() : []))
        .then(setJobs)
        .catch(() => {});
    };
    loadJobs();
    const id = setInterval(loadJobs, 5000);
    return () => clearInterval(id);
  }, [token]);

  const filteredDocs = useMemo(() => {
    let filtered = [...docs];
    if (searchQuery) {
      filtered = filtered.filter((doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.source_url.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    filtered.sort((a, b) => {
      if (sortBy === "date") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return a.title.localeCompare(b.title);
    });
    return filtered;
  }, [docs, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / ITEMS_PER_PAGE));
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDocs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDocs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const filteredJobs = useMemo(() => {
    if (filterStatus === "all") return jobs;
    return jobs.filter((job) => job.status === filterStatus);
  }, [jobs, filterStatus]);

  const triggerCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setError("Please sign in first");
    setError(null);
    const res = await fetch(`${API_BASE}/crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      setError(detail.detail || "Failed to enqueue crawl");
      return;
    }
    const job = await res.json();
    setJobs((prev) => [job, ...prev]);
    setUrl("");
  };

  const handleDelete = async (id: string) => {
    if (!token) return setError("Please sign in first");
    const proceed = window.confirm("Delete this document from the library?");
    if (!proceed) return;

    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      setError(detail.detail || "Failed to delete document");
      return;
    }

    setDocs((prev) => prev.filter((doc) => doc.id !== id));
  };

  const handleShareClick = (docId: string) => {
    setSelectedDocId(docId);
    setShareModalOpen(true);
    setGroupSearchQuery("");
  };

  const handleShareToGroup = async (groupId: string) => {
    if (!token || !selectedDocId) return;
    
    setSharingGroupId(groupId);
    
    try {
      const res = await fetch(`${API_BASE}/documents/${selectedDocId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ group_id: groupId }),
      });

      setSharingGroupId(null);

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        setError(detail.detail || "Failed to share document");
        return;
      }

      const result = await res.json();
      console.log("Share result:", result);
      
      // Find group name
      const group = groups.find(g => g.id === groupId);
      const groupName = group?.name || "the group";
      
      // Show success modal
      setSuccessMessage(`Document successfully shared to "${groupName}"!`);
      setSuccessModalOpen(true);
      setShareModalOpen(false);
      setSelectedDocId(null);
      
      // Auto-close success modal after 3 seconds
      setTimeout(() => {
        setSuccessModalOpen(false);
      }, 3000);
    } catch (err) {
      setSharingGroupId(null);
      setError("Network error. Please try again.");
      console.error("Share error:", err);
    }
  };

  const filteredGroups = useMemo(() => {
    if (!groupSearchQuery) return groups;
    return groups.filter((group) =>
      group.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
    );
  }, [groups, groupSearchQuery]);

  return (
    <main className="min-h-screen bg-[#f4f6fa] relative overflow-visible text-slate-800 font-sans p-4 md:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-12%] left-[-10%] w-[55vw] h-[55vw] bg-purple-100/60 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[45vw] h-[45vw] bg-emerald-100/60 blur-[120px] rounded-full mix-blend-multiply" />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        <nav className="relative z-50 flex flex-wrap items-center justify-between gap-4 mb-10 text-slate-600 overflow-visible">
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
            <Link href="/documents" className="px-6 py-2.5 text-sm font-semibold bg-white rounded-full shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] text-slate-800">
              Documents
            </Link>
            <Link href="/groups" className="px-6 py-2.5 text-sm font-medium hover:text-slate-800 transition-colors">
              Groups
            </Link>
            <Link href="/workspace" className="px-6 py-2.5 text-sm font-medium hover:text-slate-800 transition-colors">
              Workspace
            </Link>
          </div>

          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xl rounded-full px-3 py-2 border border-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] relative">
            <NotificationCenter token={token} onInvitationHandled={() => loadGroups()} />
            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-slate-200">
              <button
                className="flex items-center gap-2"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="User menu"
              >
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

        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-slate-500">Your research library</p>
            <h1 className="text-[1.75rem] font-bold text-slate-800 tracking-tight">Documents</h1>
          </div>
          <span className="text-sm rounded-full bg-emerald-100 text-emerald-800 px-3 py-1.5 font-medium shadow-sm">
            {docs.length} files total
          </span>
        </div>

        <div className="grid lg:grid-cols-[1.1fr,360px] gap-8 pb-16">
          <div className="space-y-6 flex flex-col min-w-0">
            <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 p-4 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col md:flex-row gap-3 md:items-center">
                <label className="flex-1 flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white border border-slate-100 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-200">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents or sources..."
                    className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
                  />
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-100 text-sm font-medium text-slate-700 shadow-sm">
                    <Filter className="w-4 h-4" />
                    {sortBy === "date" ? "Sort: Newest" : "Sort: Title"}
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "date" | "title")}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-100 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-200 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="date">Newest first</option>
                    <option value="title">Title A–Z</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 p-6 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                    <FileText className="w-4 h-4" />
                  </span>
                  Library
                </h2>
                <span className="text-xs text-slate-500">{filteredDocs.length} shown</span>
              </div>

              <div className="space-y-3">
                {filteredDocs.length === 0 && (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mb-4">
                      <FileText className="w-7 h-7" />
                    </div>
                    <p className="text-slate-700 font-semibold">{searchQuery ? "No documents found" : "No documents yet"}</p>
                    <p className="text-slate-500 text-sm">{searchQuery ? "Try a different search" : "Crawl a URL to add your first PDF summary."}</p>
                  </div>
                )}

                {paginatedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="group rounded-2xl border border-slate-100 p-5 bg-gradient-to-br from-white to-slate-50/60 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-[1px] transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 text-lg leading-tight mb-1 group-hover:text-indigo-600 transition-colors truncate">
                          {doc.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1.5 truncate max-w-[320px]">
                            <ExternalLink className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate" title={doc.source_url}>{doc.source_url}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          href={doc.source_url}
                          target="_blank"
                          rel="noreferrer"
                          title="View source"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                        <button
                          className="p-2.5 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                          onClick={() => handleShareClick(doc.id)}
                          title="Share to group"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                        <a
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-[1px] transition-all flex items-center gap-2"
                          href={pdfUrl(doc.pdf_path)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Eye className="w-4 h-4" />
                          View PDF
                        </a>
                        <button
                          className="px-3 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                          onClick={() => handleDelete(doc.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredDocs.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                    <button
                      className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-6 h-fit">
            <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white/70 p-6 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">
                  <Search className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">Crawl New URL</h2>
              </div>

              <form onSubmit={triggerCrawl} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-2">Website URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white"
                    placeholder="https://example.com"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {error}
                    </p>
                  </div>
                )}

                <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-[1px] transition-all flex items-center justify-center gap-2">
                  <Search className="w-4 h-4" />
                  Start Crawl
                </button>
              </form>
            </div>

            <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white/70 p-6 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-indigo-500" />
                  Recent Crawls
                </h3>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-white"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="crawling">Crawling</option>
                  <option value="summarizing">Summarizing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredJobs.length === 0 && (
                  <div className="text-center py-10 text-slate-500 text-sm">No jobs {filterStatus === "all" ? "yet" : `in ${filterStatus}`}</div>
                )}

                {filteredJobs.slice(0, 10).map((job) => (
                  <div key={job.id} className="rounded-2xl border border-slate-100 p-4 bg-gradient-to-br from-white to-slate-50/60">
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 ${
                          job.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : job.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : job.status === "crawling"
                            ? "bg-blue-100 text-blue-700"
                            : job.status === "summarizing"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {job.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {job.status === "failed" && <XCircle className="w-3.5 h-3.5" />}
                        {(job.status === "crawling" || job.status === "summarizing") && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {job.status}
                      </span>
                      <span className="text-xs text-slate-500">{new Date(job.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-800 font-medium truncate" title={job.url}>{job.url}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-emerald-600" />
                  Share to Group
                </h3>
                <button
                  onClick={() => {
                    setShareModalOpen(false);
                    setSelectedDocId(null);
                    setGroupSearchQuery("");
                  }}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Select a group to share this document with all members
              </p>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-300">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    value={groupSearchQuery}
                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                    placeholder="Search groups..."
                    className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
                  />
                </label>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredGroups.length === 0 && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mb-4">
                      <Users className="w-7 h-7" />
                    </div>
                    <p className="text-slate-700 font-semibold">
                      {groupSearchQuery ? "No groups found" : "No groups yet"}
                    </p>
                    <p className="text-slate-500 text-sm">
                      {groupSearchQuery ? "Try a different search" : "Create a group first to share documents"}
                    </p>
                  </div>
                )}

                {filteredGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleShareToGroup(group.id)}
                    disabled={sharingGroupId === group.id}
                    className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                            {group.name}
                          </h4>
                          {group.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {sharingGroupId === group.id ? (
                        <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                      ) : (
                        <Share2 className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Success!</h3>
            <p className="text-slate-600">{successMessage}</p>
            <button
              onClick={() => setSuccessModalOpen(false)}
              className="mt-6 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
