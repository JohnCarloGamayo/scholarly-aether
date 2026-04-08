"use client";

import { useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://scholarly-aether-backend.onrender.com";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || "Failed to send reset code");
      }

      setMessage("If your email exists, we sent a 6-digit code.");
      setStep(2);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await fetch(`${API_BASE}/auth/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, code }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || "Invalid code");
      }

      setMessage("Code verified. You can now set a new password.");
      setStep(3);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, code, new_password: newPassword }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || "Failed to reset password");
      }

      setMessage("Password reset successful. You can now sign in.");
      setStep(1);
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
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
          <h1 className="text-4xl font-heading font-extrabold text-ink leading-tight">Recover your account</h1>
          <p className="text-slate text-lg">We will send a 6-digit code to your email before allowing you to set a new password.</p>
          <div className="rounded-xl bg-white shadow-soft-card border border-slate/10 p-4 text-sm text-slate">
            <p className="font-semibold text-ink">How it works</p>
            <p>1. Enter your email</p>
            <p>2. Verify the 6-digit code</p>
            <p>3. Set your new password</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-soft-card border border-slate/10 p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-slate">Password recovery</p>
            <h2 className="text-2xl font-heading font-extrabold text-ink">
              {step === 1 && "Forgot password"}
              {step === 2 && "Enter verification code"}
              {step === 3 && "Set new password"}
            </h2>
          </div>

          {step === 1 && (
            <form className="space-y-4" onSubmit={sendCode}>
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
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Sending code..." : "Send 6-digit code"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="space-y-4" onSubmit={verifyCode}>
              <div>
                <label className="text-sm font-medium text-slate">6-digit code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="mt-1 w-full rounded-xl border border-slate/20 px-4 py-3 tracking-[0.25em] text-center text-lg focus:border-primary focus:ring-primary"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify code"}
              </button>
            </form>
          )}

          {step === 3 && (
            <form className="space-y-4" onSubmit={resetPassword}>
              <div>
                <label className="text-sm font-medium text-slate">New password</label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-xl border border-slate/20 px-4 py-3 focus:border-primary focus:ring-primary"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate">Confirm new password</label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-xl border border-slate/20 px-4 py-3 focus:border-primary focus:ring-primary"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Updating password..." : "Reset password"}
              </button>
            </form>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-600">{message}</p>}

          <p className="text-sm text-slate text-center">
            Back to <Link className="text-primary font-medium hover:text-primary-dark" href="/auth/login">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
