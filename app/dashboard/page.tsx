"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MoreVertical,
  Wallet,
  PieChart,
  Briefcase,
  Layers,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import NotificationCenter from "../components/NotificationCenter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

export default function DashboardPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [jobs, setJobs] = useState<CrawlJob[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("sa_token") : null;

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

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const pendingJobs = jobs.filter((j) => j.status !== "completed" && j.status !== "failed").length;
  const failedJobs = jobs.filter((j) => j.status === "failed").length;
  const completionRate = totalJobs ? Math.round((completedJobs / totalJobs) * 1000) / 10 : 0;

  const monthlyBars = useMemo(() => {
    const now = new Date();
    const months: { label: string; count: number }[] = [];
    for (let i = 8; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: d.toLocaleString("default", { month: "short" }), count: 0 });
    }
    const monthIndex = (date: Date) => {
      const diffMonths = (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth());
      return 8 + diffMonths;
    };
    jobs.forEach((job) => {
      const idx = monthIndex(new Date(job.created_at));
      if (idx >= 0 && idx < months.length) months[idx].count += 1;
    });
    const max = Math.max(1, ...months.map((m) => m.count));
    return months.map((m) => ({ ...m, height: Math.max(8, Math.round((m.count / max) * 90)) }));
  }, [jobs]);

  return (
    <main className="min-h-screen bg-[#f4f6fa] relative overflow-visible text-slate-800 font-sans p-4 md:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-pink-100/60 blur-[100px] rounded-full mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] bg-orange-100/60 blur-[100px] rounded-full mix-blend-multiply" />
        <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-100/60 blur-[100px] rounded-full mix-blend-multiply" />
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

          <div className="flex items-center bg-white/70 backdrop-blur-xl rounded-full p-1.5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-white flex-1 max-w-[600px] justify-between px-2 hidden md:flex mx-4">
            <Link href="/dashboard" className="px-6 py-2.5 text-sm font-semibold bg-white rounded-full shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] text-slate-800">
              Dashboard
            </Link>
            <Link href="/documents" className="px-6 py-2.5 text-sm font-medium hover:text-slate-800 transition-colors">
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

        <h1 className="text-[1.75rem] font-bold text-slate-800 mb-8 tracking-tight">Good morning, {user?.email || "User"}!</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<Wallet size={22} />} value={docs.length.toLocaleString()} title="Documents in workspace" />
          <StatCard icon={<PieChart size={22} />} value={pendingJobs.toLocaleString()} title="Jobs in progress" />
          <StatCard icon={<Briefcase size={22} />} value={completedJobs.toLocaleString()} title="Jobs completed" />
          <StatCard icon={<Layers size={22} />} value={groups.length.toLocaleString()} title="Active groups" />
        </div>

        <div className="grid lg:grid-cols-[1fr,340px] gap-6 pb-12">
          <div className="space-y-6 flex flex-col min-w-0">
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-[1.15rem] font-bold text-slate-800 mb-1">Crawl Activity</h3>
                  <p className="text-slate-400 text-xs font-medium">Job volume over the last 9 months</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-xs font-semibold text-slate-600 border border-slate-100 shadow-sm transition-colors">
                  Current Month <ChevronDown size={14} />
                </button>
              </div>

              <div className="flex gap-16 mb-12">
                <div>
                  <p className="text-slate-400 text-xs font-medium mb-1">Completed</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-slate-800">{completedJobs.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-white bg-[#4cd964] px-2 py-1 rounded-md">{totalJobs ? `${Math.round((completedJobs / totalJobs) * 100)}%` : "0%"}</span>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-medium mb-1">In progress</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-slate-800">{pendingJobs.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-white bg-[#ff5b5b] px-2 py-1 rounded-md">{totalJobs ? `${Math.round((pendingJobs / totalJobs) * 100)}%` : "0%"}</span>
                  </div>
                </div>
              </div>

              <div className="relative h-[200px] w-full flex items-end justify-between gap-2 mt-auto">
                <div className="absolute left-0 bottom-0 h-full flex flex-col justify-between text-[10px] font-medium text-slate-400 pb-8 pr-4 w-10 text-right">
                  <span>12</span>
                  <span>10</span>
                  <span>8</span>
                  <span>6</span>
                  <span>4</span>
                  <span>2</span>
                  <span>0</span>
                </div>
                <div className="flex-1 flex items-end justify-between pl-10 h-full pb-8 pt-4 gap-4">
                  {monthlyBars.map((m, i) => (
                    <div key={m.label} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                      <div className={`w-full max-w-[48px] rounded-[0.7rem] transition-all cursor-pointer relative shadow-sm ${m.count ? "bg-[#7a6dfa] hover:brightness-110" : "bg-[#e4e7fa] hover:bg-[#d6d9f5]"}`} style={{ height: `${m.height}%` }}>
                        {m.count > 0 && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-[1rem] px-3 py-2 text-[10px] font-bold border border-slate-50 min-w-max text-center">
                            <div className="flex items-center gap-1.5 text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-[#7a6dfa]" /> {m.count} jobs</div>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium absolute -bottom-6">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] flex-1">
              <h3 className="text-[1.15rem] font-bold text-slate-800 mb-6">Recent jobs</h3>
              <div className="space-y-1 text-sm">
                {jobs.slice(0, 2).map((job) => (
                  <div key={job.id} className="grid grid-cols-[1fr,auto,auto] items-center gap-4 py-2 border-b border-slate-50 last:border-0">
                    <span className="font-medium text-slate-700 truncate" title={job.url}>{job.url}</span>
                    <span className="text-slate-500 font-medium capitalize">{job.status}</span>
                    <span className="text-slate-400 text-xs">{new Date(job.created_at).toLocaleString()}</span>
                  </div>
                ))}
                {jobs.length === 0 && <p className="text-slate-500 text-sm">No crawl jobs yet.</p>}
              </div>
            </div>
          </div>

          <div className="space-y-6 flex flex-col">
            <div className="relative bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] p-7 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] group">
              <button className="absolute top-6 right-6 w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors bg-white shadow-sm" aria-label="Open">
                <ArrowUpRight size={14} />
              </button>

              <h3 className="text-base font-bold text-slate-800 mb-1">Formation status</h3>
              <p className="text-xs font-medium text-slate-500 mb-5">{pendingJobs > 0 ? "In progress" : "Idle"}</p>

              <div className="flex h-7 w-full rounded-full bg-slate-100/50 border border-slate-50 overflow-hidden mb-6 p-1 gap-1">
                <div className="h-full bg-[#a39df5] rounded-full shadow-sm" style={{ width: `${Math.min(completionRate, 100)}%` }} />
                <div className="h-full bg-white rounded-full shadow-sm" style={{ width: `${Math.max(0, 100 - Math.min(completionRate, 100))}%` }} />
              </div>

              <div className="mb-6">
                <h4 className="font-bold text-slate-800 text-sm mb-1">Estimated Processing</h4>
                <p className="text-slate-500 text-xs font-medium">{pendingJobs} job(s) waiting · {failedJobs} failed</p>
              </div>

              <button className="w-full py-3.5 bg-white hover:bg-slate-50 border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] rounded-2xl text-slate-700 font-bold text-sm transition-colors">
                View status
              </button>
            </div>

            <div className="relative bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] p-7 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] group flex-1 flex flex-col">
              <button className="absolute top-6 right-6 w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors bg-white shadow-sm" aria-label="Open">
                <ArrowUpRight size={14} />
              </button>

              <h3 className="text-base font-bold text-slate-800 mb-1">Success Rate</h3>
              <p className="text-xs font-medium text-slate-400 mb-8">Completion vs total jobs</p>

              <div className="relative flex justify-center mb-8 mt-2">
                <svg className="w-[180px] h-[100px]" viewBox="0 0 100 50">
                  {[...Array(19)].map((_, i) => {
                    const angle = (i / 18) * 180;
                    const threshold = Math.round((completionRate / 100) * 18);
                    const isFilled = i < threshold;
                    return (
                      <line
                        key={i}
                        x1="15"
                        y1="50"
                        x2="23"
                        y2="50"
                        transform={`rotate(${angle - 180} 50 50)`}
                        stroke={isFilled ? "#a39df5" : "#f1f1f5"}
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
                <div className="absolute bottom-1 flex flex-col items-center">
                  <div className="text-2xl font-black text-slate-800 tracking-tight">{completionRate.toFixed(1)}%</div>
                  <div className="text-[10px] font-bold text-slate-400 mt-1">{completedJobs} done</div>
                </div>

                <div className="absolute -top-1 left-2 bg-white border border-slate-50 shadow-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a39df5]" /> {completionRate.toFixed(1)}%
                </div>
              </div>

              <p className="text-[11px] text-center text-slate-500 font-medium leading-relaxed mb-auto mt-2 px-2">
                {totalJobs ? `${completedJobs} of ${totalJobs} jobs finished. Keep crawling!` : "Start a crawl to see progress."}
              </p>

              <div className="flex justify-between items-center px-2 mt-6">
                <div className="text-center flex-1">
                  <p className="text-[11px] text-slate-400 font-medium mb-1">Jobs</p>
                  <p className="font-bold text-slate-800 text-sm">{totalJobs}</p>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="text-center flex-1">
                  <p className="text-[11px] text-slate-400 font-medium mb-1">Documents</p>
                  <p className="font-bold text-slate-800 text-sm">{docs.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] border border-white/60 flex flex-col relative group transition-all">
      <button className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors" aria-label="More">
        <MoreVertical size={16} />
      </button>
      <div className="flex items-start mb-4">
        <div className="w-11 h-11 rounded-[12px] bg-white shadow-sm flex items-center justify-center text-slate-700 border border-slate-50">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">{value}</h3>
        <p className="text-slate-400 text-xs font-medium max-w-[160px] leading-tight">{title}</p>
      </div>
    </div>
  );
}
