import { useEffect, useMemo, useRef, useState } from "react";
import { Inbox, Bell, HandCoins, Gift, Check, X, Info, UserPlus, Trash2, Eye, Star, Award, AlertTriangle, BookOpen, Headphones } from "lucide-react";
import { notificationsService } from "@/services/api.service";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Modal from "@/components/shared/Modal";

// ─── helpers ────────────────────────────────────────────────────────────────

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function notifIcon(type: string) {
  if (type === "delete_request")      return <Trash2   className="h-4 w-4 text-red-500"    />;
  if (type === "student_assigned")    return <UserPlus className="h-4 w-4 text-teal"       />;
  if (type === "circle_assigned")     return <UserPlus className="h-4 w-4 text-nc-purple"  />;
  if (type === "performance_review")  return <Award    className="h-4 w-4 text-gold-dim"        />;
  if (type === "material_request")    return <BookOpen className="h-4 w-4 text-nc-green"   />;
  if (type === "interest_request")    return <Inbox    className="h-4 w-4 text-gold-dim"   />;
  if (type === "contribution")        return <HandCoins className="h-4 w-4 text-plum"     />;
  if (type === "reward")              return <Gift     className="h-4 w-4 text-gold-dim"   />;
  if (type === "training")            return <Headphones className="h-4 w-4 text-teal"    />;
  return <Info className="h-4 w-4 text-nc-muted" />;
}

const INDICATOR_LABELS: Record<string, string> = {
  honestyScore    : "Honesty",
  gratitudeScore  : "Gratitude",
  empathyScore    : "Empathy",
  identityScore   : "Identity",
  familyScore     : "Family",
  consistencyScore: "Consistency",
};

function rateColor(v: number) {
  return v >= 80 ? "text-teal" : v >= 60 ? "text-gold-dim" : "text-nc-red";
}

function PerformanceReviewModal({
  notification,
  onClose,
}: { notification: any; onClose: () => void }) {
  const p = notification?.payload ?? {};
  const scores = Object.entries(INDICATOR_LABELS).map(([key, label]) => ({
    label, value: Number(p[key] ?? 0),
  }));
  const overallScore = Number(p.overallScore ?? 0);

  return (
    <Modal
      open={!!notification}
      onClose={onClose}
      title="Performance Review"
      subtitle={`Session #${p.sessionNumber ?? "—"} · ${p.circleName ?? "—"}`}
    >
      {/* Overall + Stars */}
      <div className="flex items-center justify-between bg-muted/60 rounded-lg p-4 mb-4">
        <div>
          <p className="text-xs text-nc-muted mb-1">Overall Score</p>
          <p className={`text-3xl font-bold leading-none ${rateColor(overallScore)}`}>{overallScore}%</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-nc-muted mb-1.5">Session Rating</p>
          <div className="flex items-center gap-0.5 justify-end">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={16}
                className={s <= (p.stars ?? 0) ? "fill-gold text-gold" : "text-border"} />
            ))}
          </div>
          <p className="text-[11px] text-nc-muted mt-1">
            {new Date(notification?.createdAt).toLocaleDateString("en-PK", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Indicator scores */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {scores.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between bg-muted/40 rounded-md px-3 py-2">
            <span className="text-xs text-nc-muted">{label}</span>
            <span className={`text-xs font-bold ${rateColor(value)}`}>{value}%</span>
          </div>
        ))}
      </div>

      {/* Review text */}
      {p.reviewText && (
        <div className="bg-muted/40 rounded-lg px-4 py-3 mb-4">
          <p className="text-xs font-semibold text-nc-muted uppercase tracking-wide mb-1.5">Review Notes</p>
          <p className="text-[13px] text-slate leading-relaxed">{p.reviewText}</p>
        </div>
      )}

      {/* Follow-up flag */}
      {p.requiresFollowUp && (
        <div className="flex items-center gap-2 bg-nc-amber-lt border border-nc-amber/30 rounded-md px-3.5 py-2.5 text-sm text-nc-amber font-medium mb-4">
          <AlertTriangle size={15} />
          This review has been flagged for follow-up.
        </div>
      )}

      {/* From */}
      <p className="text-[11px] text-nc-muted">
        Submitted by: <span className="text-foreground font-medium">{notification?.sender?.fullName ?? "Admin"}</span>
      </p>

      <button onClick={onClose} className="mt-4 w-full py-2 text-sm bg-teal text-white rounded-md hover:bg-teal/90 transition-colors font-medium">
        Close
      </button>
    </Modal>
  );
}

// ─── Delete-request detail modal ────────────────────────────────────────────

function DeleteRequestModal({
  notification,
  onClose,
  onApprove,
  onReject,
  acting,
}: {
  notification: any;
  onClose    : () => void;
  onApprove  : () => void;
  onReject   : () => void;
  acting     : boolean;
}) {
  const p = notification?.payload ?? {};

  return (
    <Modal
      open={!!notification}
      onClose={onClose}
      title="Delete Request"
      subtitle="Review this request from the murabbi"
    >
      {/* Details card */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span className="font-semibold text-red-700 text-sm">Student Delete Request</span>
        </div>

        <div className="space-y-1.5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-nc-muted">Student Name</span>
            <span className="font-semibold text-foreground">{p.targetName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-nc-muted">Requested By</span>
            <span className="font-semibold text-foreground">{notification?.sender?.fullName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-nc-muted">Time</span>
            <span className="text-foreground">{timeAgo(notification?.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="mt-3">
        <p className="text-[12.5px] text-nc-muted leading-relaxed">{notification?.message}</p>
      </div>

      {/* Warning */}
      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-md px-3.5 py-2.5 text-[12px] text-amber-800 leading-relaxed">
        <strong>Warning:</strong> Approving this request will permanently delete the student record.
        This action cannot be undone.
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 mt-4">
        <button
          className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded-md transition-colors disabled:opacity-50"
          onClick={onApprove}
          disabled={acting}
        >
          <Check className="h-4 w-4" />
          {acting ? "Processing…" : "Approve Delete"}
        </button>
        <button
          className="flex-1 btn-outline text-sm font-semibold py-2 disabled:opacity-50"
          onClick={onReject}
          disabled={acting}
        >
          <X className="h-4 w-4 inline mr-1" />
          Reject
        </button>
      </div>
    </Modal>
  );
}

// ─── Main bell component ─────────────────────────────────────────────────────

interface NotificationBellProps {
  onApproveDeleteRequest?: (studentId: string, notifId: string) => void;
}

export default function NotificationBell({ onApproveDeleteRequest }: NotificationBellProps = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen]             = useState(false);
  const [count, setCount]           = useState(0);
  const [notifications, setNotifs]  = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [acting, setActing]         = useState(false);
  const [viewNotif, setViewNotif]   = useState<any>(null);
  const [viewReview, setViewReview] = useState<any>(null);
  const ref = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, []);

  async function fetchCount() {
    try {
      const r = await notificationsService.getUnreadCount();
      setCount(r.data.data?.count ?? 0);
    } catch { /* non-critical: the bell refreshes on its next poll */ }
  }

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (!next) return;
    setLoading(true);
    try {
      const r = await notificationsService.getAll();
      const all = r.data.data || [];
      // only show unread and pending — read ones never appear again
      setNotifs(all.filter((n: any) => n.status === "unread" || n.status === "pending"));
      fetchCount();
    } catch {
      toast({ variant: "destructive", title: "Failed to load notifications" });
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await notificationsService.markRead(id);
      setNotifs((prev) => prev.filter((n) => n._id !== id));
      setCount((c) => Math.max(0, c - 1));
    } catch { /* non-critical: the bell refreshes on its next poll */ }
  }

  async function handleMarkReadGroup(ids: string[]) {
    try {
      await Promise.all(ids.map((id) => notificationsService.markRead(id)));
      setNotifs((prev) => prev.filter((n) => !ids.includes(n._id)));
      setCount((c) => Math.max(0, c - ids.length));
    } catch { /* non-critical: the bell refreshes on its next poll */ }
  }

  // Group same-type notifications from the same sender into one row.
  // delete_request and performance_review are never grouped — they need individual actions.
  const grouped = useMemo(() => {
    const map = new Map<string, any>();
    for (const n of notifications) {
      if (n.type === "delete_request" || n.type === "performance_review") {
        map.set(n._id, { ...n, ids: [n._id], count: 1 });
        continue;
      }
      const key = `${n.type}__${n.sender?._id ?? "unknown"}`;
      if (map.has(key)) {
        const g = map.get(key)!;
        g.ids.push(n._id);
        g.count += 1;
        if (new Date(n.createdAt) > new Date(g.createdAt)) g.createdAt = n.createdAt;
      } else {
        map.set(key, { ...n, ids: [n._id], count: 1 });
      }
    }
    return Array.from(map.values());
  }, [notifications]);

  async function handleMarkAllRead() {
    try {
      await notificationsService.markAllRead();
      setNotifs([]);
      setCount(0);
    } catch { /* non-critical: the bell refreshes on its next poll */ }
  }

  async function handleApprove() {
    if (!viewNotif) return;
    const studentId = viewNotif.payload?.targetId;
    if (!studentId) {
      toast({ variant: "destructive", title: "Student ID not found in request." });
      return;
    }
    setActing(true);
    try {
      setNotifs((prev) => prev.filter((n) => n._id !== viewNotif._id));
      setCount((c) => Math.max(0, c - 1));
      const notifId = viewNotif._id;
      setViewNotif(null);
      // Delegate to admin panel to open EditStudentModal + delete flow
      onApproveDeleteRequest?.(studentId, notifId);
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Action failed." });
    } finally { setActing(false); }
  }

  async function handleReject() {
    if (!viewNotif) return;
    setActing(true);
    try {
      await notificationsService.reject(viewNotif._id);
      setNotifs((prev) => prev.filter((n) => n._id !== viewNotif._id));
      setCount((c) => Math.max(0, c - 1));
      setViewNotif(null);
      toast({ title: "Request rejected — no changes made." });
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Action failed." });
    } finally { setActing(false); }
  }

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          className="relative p-2 hover:bg-muted rounded-lg transition-colors"
          onClick={handleOpen}
          title="Notifications"
        >
          <Bell className="h-5 w-5 text-nc-muted" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-12 w-[340px] max-w-[calc(100vw-1.5rem)] bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">Notifications</span>
                {count > 0 && (
                  <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                    {count} new
                  </span>
                )}
              </div>
              {count > 0 && (
                <button
                  className="text-xs text-nc-muted hover:text-foreground transition-colors"
                  onClick={handleMarkAllRead}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
              {loading ? (
                <div className="text-center py-10 text-nc-muted text-sm animate-pulse">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Bell className="h-5 w-5 text-nc-muted/40" />
                  </div>
                  <p className="text-sm text-nc-muted">You're all caught up!</p>
                  <p className="text-xs text-nc-muted/60">No new notifications.</p>
                </div>
              ) : grouped.map((n) => {
                const isUnread      = n.status === "unread";
                const isPending     = n.status === "pending";
                const isDeleteReq   = n.type === "delete_request";
                const isPerfReview  = n.type === "performance_review";
                const isGrouped     = n.count > 1;

                // Build display message — for grouped rows summarise the count
                const displayMessage = isGrouped
                  ? (() => {
                      if (n.type === "student_assigned")  return `${n.sender?.fullName ?? "Murabbi"} assigned ${n.count} students`;
                      if (n.type === "circle_assigned")   return `${n.sender?.fullName ?? "Murabbi"} was assigned to ${n.count} circles`;
                      if (n.type === "material_request")  return `${n.sender?.fullName ?? "Murabbi"} sent ${n.count} material requests`;
                      if (n.type === "interest_request")  return `${n.count} new interest requests from the website`;
                      if (n.type === "contribution")      return `${n.count} contribution updates from the website`;
                      if (n.type === "reward")            return `You received ${n.count} rewards`;
                      if (n.type === "training")          return `${n.count} training updates`;
                      return `${n.count} similar notifications from ${n.sender?.fullName ?? "Murabbi"}`;
                    })()
                  : n.message;

                return (
                  <div
                    key={isGrouped ? `${n.type}__${n.sender?._id}` : n._id}
                    className={`px-4 py-3 transition-colors ${isUnread || isPending ? "bg-muted/40" : ""}`}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                        {notifIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className={`text-[13px] leading-snug ${isUnread || isPending ? "font-semibold text-foreground" : "font-medium text-nc-muted"}`}>
                              {n.title}
                            </p>
                            {isGrouped && (
                              <span className="text-[10px] font-bold bg-teal/10 text-teal px-1.5 py-0.5 rounded-full leading-none">
                                ×{n.count}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-nc-muted whitespace-nowrap flex-shrink-0">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>

                        <p className="text-[12px] text-nc-muted mt-0.5 leading-relaxed line-clamp-2">
                          {displayMessage}
                        </p>

                        {!isGrouped && n.sender?.fullName && (
                          <p className="text-[11px] text-nc-muted mt-0.5">
                            From: <span className="text-foreground">{n.sender.fullName}</span>
                          </p>
                        )}

                        {/* View button for admin pending delete requests */}
                        {isAdmin && isPending && isDeleteReq && (
                          <button
                            className="mt-2 flex items-center gap-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-md transition-colors"
                            onClick={() => { setOpen(false); setViewNotif(n); }}
                          >
                            <Eye className="h-3.5 w-3.5" /> View Request
                          </button>
                        )}

                        {/* View button for performance reviews */}
                        {isPerfReview && (
                          <button
                            className="mt-2 flex items-center gap-1.5 text-xs font-semibold bg-nc-amber-lt hover:bg-gold/10 text-gold-dim border border-gold/30 px-2.5 py-1 rounded-md transition-colors"
                            onClick={() => {
                              setOpen(false);
                              setViewReview(n);
                              if (isUnread) handleMarkRead(n._id);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" /> View Review
                          </button>
                        )}

                        {/* Mark read — handles both single and grouped */}
                        {(isUnread || isGrouped) && !isPending && !isPerfReview && (
                          <button
                            className="text-[11px] text-nc-muted hover:text-foreground mt-1 transition-colors"
                            onClick={() => handleMarkReadGroup(n.ids)}
                          >
                            Mark as read{isGrouped ? ` (${n.count})` : ""}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete request detail modal — rendered outside the dropdown */}
      <DeleteRequestModal
        notification={viewNotif}
        onClose={() => setViewNotif(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        acting={acting}
      />

      {/* Performance review detail modal */}
      <PerformanceReviewModal
        notification={viewReview}
        onClose={() => setViewReview(null)}
      />

    </>
  );
}
