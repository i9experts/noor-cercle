import { useEffect, useRef, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import { Star, Plus, MessageSquarePlus, Trash2, Loader2 } from "lucide-react";
import { parentsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { RegisterParentModal, AddParentFeedbackModal } from "@/components/modals/AllModals";

function StarRow({ stars }: { stars: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < stars ? "fill-gold text-gold" : "fill-border text-border"}`} />
      ))}
    </span>
  );
}

// ── Schedule Evening Modal ─────────────────────────────────────────────────────
function ScheduleEveningModal({ open, onClose, onSuccess }: {
  open: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const { toast }          = useToast();
  const [month, setMonth]  = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const m = parseInt(month);
    if (!m || m < 1 || m > 12) { toast({ variant: "destructive", title: "Enter a valid month (1–12)." }); return; }
    setSaving(true);
    try {
      await parentsService.scheduleEvening(m);
      toast({ title: `Parent evening scheduled for Month ${m}.` });
      setMonth(""); onClose(); onSuccess();
    } catch { toast({ variant: "destructive", title: "Failed to schedule evening." }); }
    finally { setSaving(false); }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-xl w-[340px] max-w-[calc(100vw-2rem)] p-6 border border-border">
        <h3 className="font-semibold text-[15px] mb-1">Schedule Parent Evening</h3>
        <p className="text-[12px] text-nc-muted mb-4">Enter the programme month number (1–12)</p>
        <input
          type="number" min={1} max={12}
          className="input w-full mb-4"
          placeholder="e.g. 6"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
        <div className="flex gap-2">
          <button className="btn-gold flex-1" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Schedule"}
          </button>
          <button className="btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Send WhatsApp Modal (SSE real-time progress) ──────────────────────────────
type ProgressItem = { name: string; status: "waiting" | "sending" | "sent" | "failed"; ms?: number; error?: string };

function SendWhatsappModal({ open, onClose, onSuccess }: {
  open: boolean; onClose: () => void; onSuccess: (count: number) => void;
}) {
  const { toast }                   = useToast();
  const [message, setMessage]       = useState("");
  const [phase, setPhase]           = useState<"compose" | "sending" | "done">("compose");
  const [items, setItems]           = useState<ProgressItem[]>([]);
  const [total, setTotal]           = useState(0);
  const [sentCount, setSentCount]   = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  function reset() { setPhase("compose"); setMessage(""); setItems([]); setTotal(0); setSentCount(0); setFailedCount(0); }

  function handleClose() {
    esRef.current?.close();
    reset();
    onClose();
  }

  async function handleSend() {
    // A one-time ticket keeps the access token out of the URL (and server logs).
    let ticket: string;
    try {
      const r = await parentsService.whatsappStreamTicket(message.trim());
      ticket = (r.data.data || r.data).ticket;
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Could not start the broadcast." });
      return;
    }

    const base = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
    const url  = `${base}/parents/engagement/whatsapp-stream?ticket=${encodeURIComponent(ticket)}`;

    setPhase("sending");
    setItems([]);

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "start") {
        setTotal(data.total);
        setItems(Array.from({ length: data.total }, (_, i) => ({ name: `Parent ${i + 1}`, status: "waiting" })));
      }

      if (data.type === "progress") {
        const idx = data.index - 1;
        setItems((prev) => {
          const next = [...prev];
          next[idx] = { name: data.name, status: data.status, ms: data.ms, error: data.error };
          return next;
        });
        if (data.status === "sent")   setSentCount((c) => c + 1);
        if (data.status === "failed") setFailedCount((c) => c + 1);
      }

      if (data.type === "complete") {
        setPhase("done");
        es.close();
        onSuccess(data.sentCount);
      }

      if (data.type === "error") {
        toast({ variant: "destructive", title: data.error });
        setPhase("compose");
        es.close();
      }
    };

    es.onerror = () => {
      toast({ variant: "destructive", title: "Connection lost. Check server." });
      setPhase("compose");
      es.close();
    };
  }

  if (!open) return null;

  const pct = total > 0 ? Math.round(((sentCount + failedCount) / total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-xl w-[460px] max-w-[calc(100vw-2rem)] border border-border overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h3 className="font-semibold text-[15px]">Send WhatsApp Update</h3>
          <p className="text-[12px] text-nc-muted mt-0.5">
            {phase === "compose" && "Message will be sent to all registered parents via WhatsApp."}
            {phase === "sending" && `Sending to ${total} parent(s)…`}
            {phase === "done"    && `Done — ${sentCount} sent${failedCount > 0 ? `, ${failedCount} failed` : ""}.`}
          </p>
        </div>

        {/* Compose phase */}
        {phase === "compose" && (
          <div className="px-5 pb-5">
            <textarea
              className="input w-full resize-none text-[13px] mb-4"
              rows={3}
              placeholder="Optional message (blank = default Noor Circle brief)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
            />
            <div className="flex gap-2">
              <button className="btn-gold flex-1" onClick={handleSend}>Send now</button>
              <button className="btn-outline" onClick={handleClose}>Cancel</button>
            </div>
          </div>
        )}

        {/* Sending / Done phase */}
        {(phase === "sending" || phase === "done") && (
          <>
            {/* Progress bar */}
            <div className="px-5 pb-2">
              <div className="flex justify-between text-[11px] text-nc-muted mb-1">
                <span>{sentCount + failedCount} / {total}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Live list */}
            <div className="max-h-[260px] overflow-y-auto divide-y divide-border mx-5 mb-4 border border-border rounded-lg">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 text-[12.5px]">
                  <div className="flex items-center gap-2">
                    {item.status === "waiting" && <span className="text-nc-muted">⏳</span>}
                    {item.status === "sending" && <Loader2 className="h-3.5 w-3.5 text-teal animate-spin" />}
                    {item.status === "sent"    && <span className="text-nc-green">✓</span>}
                    {item.status === "failed"  && <span className="text-red-500">✗</span>}
                    <span className={item.status === "waiting" ? "text-nc-muted" : "text-foreground font-medium"}>
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    {item.status === "sent"   && <span className="text-teal font-semibold">{item.ms}ms</span>}
                    {item.status === "failed" && <span className="text-red-400 text-[11px]">{item.error}</span>}
                    {item.status === "waiting"&& <span className="text-nc-muted text-[11px]">waiting…</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 pb-5">
              {phase === "done" ? (
                <button className="btn-gold w-full" onClick={handleClose}>Close</button>
              ) : (
                <button className="btn-outline w-full" onClick={handleClose}>Cancel</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ParentsPage() {
  const { toast } = useToast();
  const [data, setData]                         = useState<any>(null);
  const [engagement, setEngagement]             = useState<any>(null);
  const [loading, setLoading]                   = useState(true);
  const [search, setSearch]                     = useState("");
  const [registerOpen, setRegisterOpen]         = useState(false);
  const [feedbackTarget, setFeedbackTarget]     = useState<{ id: string; name: string } | null>(null);
  const [scheduleOpen, setScheduleOpen]         = useState(false);
  const [whatsappOpen, setWhatsappOpen]         = useState(false);
  const [toggling, setToggling]                 = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [pageRes, engRes] = await Promise.all([
        parentsService.getPageData(),
        parentsService.getEngagement(),
      ]);
      setData(pageRes.data.data || pageRes.data);
      setEngagement(engRes.data.data || engRes.data);
    } catch {
      toast({ variant: "destructive", title: "Failed to load parents data" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(id: string, name: string) {
    if (!confirm(`Remove ${name} from the system?`)) return;
    try {
      await parentsService.remove(id);
      toast({ title: "Parent removed." });
      load();
    } catch {
      toast({ variant: "destructive", title: "Failed to remove parent." });
    }
  }

  async function toggleWeeklyCard() {
    setToggling("weekly");
    try {
      const next = !(engagement?.weeklyCardActive ?? true);
      const res  = await parentsService.toggleWeeklyCard(next);
      setEngagement(res.data.data?.config || res.data?.config);
      toast({ title: `Weekly card ${next ? "enabled" : "disabled"}.` });
    } catch { toast({ variant: "destructive", title: "Action failed." }); }
    finally { setToggling(null); }
  }

  async function toggleWhatsappEnabled() {
    setToggling("whatsapp-toggle");
    try {
      const next = !(engagement?.whatsappEnabled ?? true);
      const res  = await parentsService.toggleWhatsapp(next);
      setEngagement(res.data.data?.config || res.data?.config);
      toast({ title: `WhatsApp updates ${next ? "enabled" : "disabled"}.` });
    } catch { toast({ variant: "destructive", title: "Action failed." }); }
    finally { setToggling(null); }
  }

  async function handleRecordEvening() {
    if (!confirm("Mark tonight's parent evening as held?")) return;
    try {
      const res = await parentsService.recordEveningHeld();
      setEngagement(res.data.data?.config || res.data?.config);
      toast({ title: "Parent evening recorded as held." });
      load();
    } catch { toast({ variant: "destructive", title: "Action failed." }); }
  }

  const stats          = data?.stats         || {};
  const recentFeedback = data?.recentFeedback || [];
  const allParents     = data?.parents        || [];
  const currentMonth   = stats.currentMonth  || 1;
  const latestSession  = stats.latestSession || 0;

  const weeklyCardActive   = engagement?.weeklyCardActive  ?? true;
  const whatsappEnabled    = engagement?.whatsappEnabled   ?? true;
  const scheduledMonth     = engagement?.scheduledEveningMonth ?? null;
  const eveningsHeld       = engagement?.parentEveningsHeld    ?? stats.parentEvenings ?? 0;
  const lastSent           = engagement?.lastWhatsappSentAt
    ? new Date(engagement.lastWhatsappSentAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })
    : null;

  const filtered = allParents.filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.fullName?.toLowerCase().includes(q) ||
      (p.students || []).some((s: any) => s.fullName?.toLowerCase().includes(q));
  });

  const TOOLS = [
    {
      key     : "weekly",
      title   : "Weekly Home Action Card",
      desc    : "Sent automatically every Friday after the circle",
      bg      : weeklyCardActive ? "bg-nc-green/10 border-nc-green/20" : "bg-muted border-border",
      titleCls: weeklyCardActive ? "text-nc-green" : "text-nc-muted",
      action  : (
        <button
          onClick={toggleWeeklyCard}
          disabled={toggling === "weekly"}
          className="flex-shrink-0"
        >
          {toggling === "weekly"
            ? <Loader2 className="h-4 w-4 animate-spin text-nc-muted" />
            : <NcBadge variant={weeklyCardActive ? "green" : "amber"}>
                {weeklyCardActive ? "Active" : "Inactive"}
              </NcBadge>
          }
        </button>
      ),
    },
    {
      key     : "report",
      title   : "Monthly Progress Report",
      desc    : "Character growth report for each child",
      bg      : "bg-teal/10 border-teal/20",
      titleCls: "text-teal",
      action  : <NcBadge variant="teal">Month {currentMonth} due</NcBadge>,
    },
    {
      key     : "evening",
      title   : "Parent Evening",
      desc    : scheduledMonth
        ? `Scheduled: Month ${scheduledMonth} · ${eveningsHeld} held this term`
        : `Quarterly gathering · ${eveningsHeld} held this term`,
      bg      : "bg-gold/10 border-gold/20",
      titleCls: "text-gold-dim",
      action  : (
        <div className="flex items-center gap-1.5">
          <button
            className="text-[12px] font-semibold border border-border rounded-md px-3 py-1.5 hover:bg-muted transition-colors"
            onClick={() => setScheduleOpen(true)}
          >
            {scheduledMonth ? `Month ${scheduledMonth} ✓` : "Schedule"}
          </button>
          {scheduledMonth && (
            <button
              className="text-[11px] text-nc-muted border border-border rounded-md px-2 py-1.5 hover:bg-muted"
              onClick={handleRecordEvening}
              title="Mark as held"
            >
              Held ✓
            </button>
          )}
        </div>
      ),
    },
    {
      key     : "whatsapp",
      title   : "WhatsApp Updates",
      desc    : lastSent ? `Last sent: ${lastSent}` : "Post-session brief to parent groups",
      bg      : whatsappEnabled ? "bg-purple-50 border-purple-200" : "bg-muted border-border",
      titleCls: whatsappEnabled ? "text-purple-600" : "text-nc-muted",
      action  : (
        <div className="flex items-center gap-1.5">
          {whatsappEnabled && (
            <button
              className="text-[12px] font-semibold border border-border rounded-md px-3 py-1.5 hover:bg-muted transition-colors"
              onClick={() => setWhatsappOpen(true)}
            >
              Send now
            </button>
          )}
          <button
            onClick={toggleWhatsappEnabled}
            disabled={toggling === "whatsapp-toggle"}
            title={whatsappEnabled ? "Disable WhatsApp updates" : "Enable WhatsApp updates"}
          >
            {toggling === "whatsapp-toggle"
              ? <Loader2 className="h-4 w-4 animate-spin text-nc-muted" />
              : <NcBadge variant={whatsappEnabled ? "purple" : "amber"}>
                  {whatsappEnabled ? "Enabled" : "Disabled"}
                </NcBadge>
            }
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-animate">

      {/* ── Stats row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:gap-4 mb-7">
        <StatCard
          label="Registered Parents"
          value={loading ? "—" : stats.totalParents ?? 0}
          meta={`Out of ${stats.totalStudents ?? "—"} students`}
          color="teal"
        />
        <StatCard
          label="Engagement Rate"
          value={loading ? "—" : `${stats.engagementRate ?? 0}%`}
          meta={`↑ ${stats.engagementRate ?? 0}% this month`}
          color="gold"
          metaUp={(stats.engagementRate ?? 0) > 0}
        />
        <StatCard
          label="Home Cards Completed"
          value={loading ? "—" : `${stats.homeCardsCompleted ?? 0}%`}
          meta="Weekly average"
          color="green"
        />
        <StatCard
          label="Parent Evenings"
          value={loading ? "—" : eveningsHeld}
          meta="Held this term"
          color="purple"
        />
      </div>

      {/* ── 2-col: Engagement Tools + Feedback ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* LEFT — Engagement Tools */}
        <NcCard>
          <CardHeader>
            <CardTitle>Parent Engagement Tools</CardTitle>
          </CardHeader>
          <div className="px-4 pb-4 flex flex-col gap-3">
            {TOOLS.map((tool) => (
              <div key={tool.key}
                className={`flex items-center justify-between rounded-xl border px-4 py-3.5 ${tool.bg}`}
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className={`font-semibold text-[13.5px] ${tool.titleCls}`}>{tool.title}</div>
                  <div className="text-[12px] text-nc-muted mt-0.5">{tool.desc}</div>
                </div>
                <div className="flex-shrink-0">{tool.action}</div>
              </div>
            ))}
          </div>
        </NcCard>

        {/* RIGHT — Parent Feedback */}
        <NcCard>
          <CardHeader>
            <CardTitle>
              Parent Feedback{latestSession > 0 ? ` — Session ${latestSession}` : ""}
            </CardTitle>
          </CardHeader>
          {recentFeedback.length === 0 ? (
            <div className="text-center py-10 text-nc-muted text-sm">No feedback recorded yet.</div>
          ) : (
            <div className="scroll-hover max-h-[320px] divide-y divide-border">
              {recentFeedback.map((f: any, i: number) => (
                <div key={i} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-[13px]">
                      {f.parentName} —{" "}
                      <span className="text-nc-muted font-normal">about {f.studentNames}</span>
                    </span>
                    <StarRow stars={f.stars} />
                  </div>
                  <p className="text-[12.5px] text-slate italic leading-relaxed">"{f.message}"</p>
                </div>
              ))}
            </div>
          )}
        </NcCard>
      </div>

      {/* ── Parent Directory ─────────────────────────────────────── */}
      <NcCard>
        <CardHeader>
          <CardTitle sub={`${filtered.length} registered`}>Parent Directory</CardTitle>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-muted border border-border rounded-sm px-3 w-[200px]">
              <span className="text-nc-muted text-sm">⌕</span>
              <input
                className="border-none bg-transparent outline-none text-[13.5px] flex-1 py-[8px] font-sans"
                placeholder="Search parents…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="btn-gold flex items-center gap-1.5" onClick={() => setRegisterOpen(true)}>
              <Plus className="h-4 w-4" /> Register Parent
            </button>
          </div>
        </CardHeader>

        {loading ? (
          <div className="text-center py-8 text-nc-muted text-sm animate-pulse">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-nc-muted text-sm">No parents registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["Parent", "Phone", "Children", "Feedback", "Status", "Actions"].map((h) => (
                    <th key={h} className="bg-muted px-3.5 py-2.5 text-left text-xs font-semibold text-nc-muted uppercase tracking-wide border-b border-border">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => (
                  <tr key={p._id} className="hover:bg-teal-lt">
                    <td className="px-3.5 py-3 border-b border-border">
                      <div className="font-semibold">{p.fullName}</div>
                      {p.email && <div className="text-[11px] text-nc-muted">{p.email}</div>}
                    </td>
                    <td className="px-3.5 py-3 border-b border-border text-nc-muted">{p.phone}</td>
                    <td className="px-3.5 py-3 border-b border-border">
                      {(p.students || []).length === 0
                        ? <span className="text-nc-muted">—</span>
                        : (p.students as any[]).map((s: any, i: number) => (
                          <span key={s._id || i} className="text-[12.5px]">
                            {s.fullName}
                            {s.circle?.name ? <span className="text-nc-muted"> ({s.circle.name})</span> : ""}
                            {i < p.students.length - 1 ? ", " : ""}
                          </span>
                        ))}
                    </td>
                    <td className="px-3.5 py-3 border-b border-border">
                      {p.feedback?.length > 0
                        ? <span className="text-[12px] text-nc-muted">{p.feedback.length} response{p.feedback.length !== 1 ? "s" : ""}</span>
                        : <span className="text-[12px] text-border">None</span>}
                    </td>
                    <td className="px-3.5 py-3 border-b border-border">
                      <NcBadge variant={p.isEngaged ? "green" : "amber"}>
                        {p.isEngaged ? "Engaged" : "No feedback"}
                      </NcBadge>
                    </td>
                    <td className="px-3.5 py-3 border-b border-border">
                      <div className="flex items-center gap-1.5">
                        <button className="p-1.5 hover:bg-muted rounded-md text-nc-muted"
                          title="Add feedback"
                          onClick={() => setFeedbackTarget({ id: p._id, name: p.fullName })}>
                          <MessageSquarePlus className="h-3.5 w-3.5" />
                        </button>
                        <button className="p-1.5 hover:bg-red-50 rounded-md text-red-400"
                          title="Remove parent"
                          onClick={() => handleRemove(p._id, p.fullName)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NcCard>

      {/* ── Modals ───────────────────────────────────────────────── */}
      <RegisterParentModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={() => { setRegisterOpen(false); load(); }}
      />
      {feedbackTarget && (
        <AddParentFeedbackModal
          open={!!feedbackTarget}
          onClose={() => setFeedbackTarget(null)}
          onSuccess={() => { setFeedbackTarget(null); load(); }}
          parentId={feedbackTarget.id}
          parentName={feedbackTarget.name}
        />
      )}
      <ScheduleEveningModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSuccess={() => { setScheduleOpen(false); load(); }}
      />
      <SendWhatsappModal
        open={whatsappOpen}
        onClose={() => setWhatsappOpen(false)}
        onSuccess={() => { setWhatsappOpen(false); }}
      />
    </div>
  );
}
