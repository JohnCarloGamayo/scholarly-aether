"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || "Signup failed");
      }

      const userData = await res.json();
      
      // Auto-login
      const body = new URLSearchParams({ username: email, password });
      const loginRes = await fetch(`${API_BASE}/auth/token`, { method: "POST", body });
      
      if (loginRes.ok) {
        const data = await loginRes.json();
        localStorage.setItem("sa_token", data.access_token);
        localStorage.setItem("sa_user_id", userData.id);
        localStorage.setItem("sa_user_email", userData.email);
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
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-heading font-extrabold text-ink leading-tight">Join Scholarly Aether</h1>
          <p className="text-slate text-lg">Create your research workspace and start collaborating with your team.</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white shadow-soft-card border border-slate/10 p-4">
              <svg className="w-8 h-8 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <p className="font-semibold text-ink">Firecrawl-ready</p>
              <p className="text-slate text-xs">Queue jobs via Redis/RQ</p>
            </div>
            <div className="rounded-xl bg-white shadow-soft-card border border-slate/10 p-4">
              <svg className="w-8 h-8 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              <p className="font-semibold text-ink">LLM chat</p>
              <p className="text-slate text-xs">AI-powered answers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-soft-card border border-slate/10 p-8 space-y-6">
          <div className="space-y-2">
            <Link href="/" className="inline-flex lg:hidden items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition mb-4">
              ← Back
            </Link>
            <p className="text-sm text-slate">Start for free</p>
            <h2 className="text-2xl font-heading font-extrabold text-ink">Create your account</h2>
          </div>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-slate block mb-2">Email Address</label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate/20 px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate block mb-2">Password</label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate/20 px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate block mb-2">Confirm Password</label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate/20 px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>
          
          <p className="text-sm text-slate text-center">
            Already have an account? <Link className="text-primary font-medium hover:text-primary-dark" href="/auth/login">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
