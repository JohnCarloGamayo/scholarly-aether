"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = new URLSearchParams({ username: email, password });
      const res = await fetch(`${API_BASE}/auth/token`, {
        method: "POST",
        body,
      });
      if (!res.ok) throw new Error("Login failed");
      const data = await res.json();
      localStorage.setItem("sa_token", data.access_token);
      
      // Fetch user info to store email and ID
      const userRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        localStorage.setItem("sa_user_email", userData.email);
        localStorage.setItem("sa_user_id", userData.id);
      }
      
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-white via-white to-primary/10">
      <div className="hidden lg:flex items-center justify-center p-12">
        <div className="max-w-lg space-y-6">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Scholarly Aether</span>
          <h1 className="text-4xl font-heading font-extrabold text-ink leading-tight">Sign in to your Living Manuscript</h1>
          <p className="text-slate text-lg">Resume your crawls, chat with summaries, and keep your research workspace in sync.</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white shadow-soft-card border border-slate/10 p-4">
              <p className="font-semibold text-ink">Secure access</p>
              <p className="text-slate">JWT auth backed by FastAPI.</p>
            </div>
            <div className="rounded-xl bg-white shadow-soft-card border border-slate/10 p-4">
              <p className="font-semibold text-ink">Strapi-powered UI</p>
              <p className="text-slate">Dynamic copy from CMS.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-soft-card border border-slate/10 p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-slate">Welcome back</p>
            <h2 className="text-2xl font-heading font-extrabold text-ink">Sign in</h2>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-slate">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-slate/20 px-4 py-3 focus:border-primary focus:ring-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate">Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-slate/20 px-4 py-3 focus:border-primary focus:ring-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="mt-2 text-right">
                <Link href="/auth/forgot-password" className="text-sm text-primary font-medium hover:text-primary-dark">
                  Forgot password?
                </Link>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="text-sm text-slate text-center">
            No account? <a className="text-primary" href="/auth/signup">Create one</a>
          </p>
        </div>
      </div>
    </main>
  );
}
