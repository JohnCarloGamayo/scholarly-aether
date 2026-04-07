"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  group_id?: string;
  membership_id?: string;
};

type InviteModalState = {
  open: boolean;
  notification: NotificationItem | null;
  submitting: boolean;
  error: string | null;
};

type Props = {
  token: string | null;
  onInvitationHandled?: () => void;
};

export default function NotificationCenter({ token, onInvitationHandled }: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [inviteModal, setInviteModal] = useState<InviteModalState>({ open: false, notification: null, submitting: false, error: null });
  const [mounted, setMounted] = useState(false);

  const loadNotifications = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/notifications`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      setNotifications(data);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [token]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => loadNotifications(), 15000);
    return () => clearInterval(interval);
  }, [token]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  const handleNotificationClick = (notification: NotificationItem) => {
    if (notification.type === "group_invitation") {
      setInviteModal({ open: true, notification, submitting: false, error: null });
    }
    setOpen(false);
  };

  const handleRespondInvitation = async (accept: boolean) => {
    if (!token || !inviteModal.notification) return;
    setInviteModal((prev) => ({ ...prev, submitting: true, error: null }));
    const res = await fetch(`${API_BASE}/notifications/${inviteModal.notification.id}/respond`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accept }),
    }).catch(() => null);
    if (!res || !res.ok) {
      setInviteModal((prev) => ({ ...prev, submitting: false, error: "Failed to respond or already handled." }));
      return;
    }
    setInviteModal({ open: false, notification: null, submitting: false, error: null });
    await loadNotifications();
    onInvitationHandled?.();
  };

  return (
    <div className="relative">
      <button
        className="p-2 hover:bg-slate-50 text-slate-500 rounded-full transition-colors relative"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-[2px] rounded-full bg-rose-500 text-white text-[10px] leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-2xl p-3 z-50 space-y-2 text-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Notifications</span>
            <button className="text-emerald-600 font-semibold" onClick={() => loadNotifications()}>
              Refresh
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-left p-3 rounded-2xl border ${n.is_read ? "border-slate-200 bg-slate-50" : "border-emerald-200 bg-emerald-50"}`}
              >
                <p className="text-xs font-semibold text-slate-700 flex justify-between items-center">
                  <span>{n.title}</span>
                  <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleDateString()}</span>
                </p>
                <p className="text-sm text-slate-600 line-clamp-2">{n.message}</p>
                {n.type === "group_invitation" && <span className="text-[11px] text-emerald-700 font-semibold">Tap to accept or decline</span>}
              </button>
            ))}
            {notifications.length === 0 && <p className="text-sm text-slate-500">No notifications.</p>}
          </div>
        </div>
      )}

      {mounted && inviteModal.open && inviteModal.notification &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[120] flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Group invitation</h3>
                  <p className="text-sm text-slate-600">{inviteModal.notification.message}</p>
                </div>
                <button
                  className="text-slate-400 hover:text-slate-600"
                  onClick={() => setInviteModal({ open: false, notification: null, submitting: false, error: null })}
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              {inviteModal.error && (
                <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl">
                  {inviteModal.error}
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => setInviteModal({ open: false, notification: null, submitting: false, error: null })}
                  disabled={inviteModal.submitting}
                >
                  Close
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white font-semibold shadow-md hover:bg-rose-600 disabled:opacity-60"
                  onClick={() => handleRespondInvitation(false)}
                  disabled={inviteModal.submitting}
                >
                  Decline
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold shadow-md hover:bg-emerald-600 disabled:opacity-60"
                  onClick={() => handleRespondInvitation(true)}
                  disabled={inviteModal.submitting}
                >
                  {inviteModal.submitting ? "Submitting..." : "Accept"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}