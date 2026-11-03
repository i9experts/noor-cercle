import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, BookOpen, Copy, Download, Printer, Search, Sparkles, Star, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StatCard from "@/components/shared/StatCard";
import NcCard from "@/components/shared/NcCard";
import Modal, { FormGroup, FormTextarea } from "@/components/shared/Modal";
import { cn } from "@/lib/utils";
import { apiError, apiMessage, formatDate, unwrap } from "@/lib/finance";
import { hasUrdu } from "@/lib/course";
import {
  JOURNAL_STATUS_META, journalService, momentDate, monthName, printJournal, printJournalReport,
  type JournalAdminData, type JournalAdminMoment, type JournalField, type JournalInsights as Insights, type JournalStatus,
} from "@/lib/journal";

/** "3 days ago", or the date once it's more than a month back. */
function ago(d: string | null) {
  if (!d) return "—";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 31) return `${days} days ago`;
  return formatDate(d);
}

function Urdu({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div dir="rtl" lang="ur" className={cn("urdu text-right", className)}>{children}</div>;
}

function StatusChip({ status }: { status: JournalStatus }) {
  const m = JOURNAL_STATUS_META[status];
  return <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", m?.cls ?? "bg-muted text-nc-muted")}>{m?.label ?? status}</span>;
}

function ReflectionChip({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-nc-muted">—</span>;
  const meta: Record<string, [string, string]> = {
    submitted: ["To review", "bg-teal-lt text-teal"],
    approved : ["Approved", "bg-nc-green-lt text-nc-green"],
    revision : ["Revising", "bg-nc-amber-lt text-nc-amber"],
  };
  const [label, cls] = meta[status] ?? [status, "bg-muted text-nc-muted"];
  return <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", cls)}>{label}</span>;
}

const SELECT = "h-9 rounded-md border border-input bg-card px-2.5 text-[13px] focus:border-primary focus:outline-none";

/** Admin insights into the Noor Journal: who is writing, where they stop, reminders and moments of light. */
export default function JournalInsights() {
  const { toast } = useToast();
  const [data, setData] = useState<Insights | null>(null);
  const [moments, setMoments] = useState<JournalAdminMoment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cluster, setCluster] = useState("");
  const [status, setStatus] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [remindIds, setRemindIds] = useState<string[] | null>(null);
  const [readId, setReadId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [i, m] = await Promise.all([journalService.insights(), journalService.moments()]);
      setData(unwrap<Insights>(i));
      setMoments(unwrap<JournalAdminMoment[]>(m) ?? []);
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not load the journal insights.") });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => (data?.murabbis ?? [])
    .filter((r) => !cluster || r.clusters.includes(cluster))
    .filter((r) => !status || r.status === status)
    .filter((r) => {
      const q = search.trim().toLowerCase();
      return !q || [r.user.fullName, r.user.email].some((v) => v?.toLowerCase().includes(q));
    }), [data, cluster, status, search]);

  const toggle = (id: string) => setPicked((p) => {
    const n = new Set(p);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const allPicked = rows.length > 0 && rows.every((r) => picked.has(r.user._id));
  const pickAll = () => setPicked(allPicked ? new Set() : new Set(rows.map((r) => r.user._id)));

  async function feature(m: JournalAdminMoment, featured: boolean) {
    try {
      const r = await journalService.feature(m._id, featured);
      toast({ title: apiMessage(r, featured ? "Moment featured." : "Removed from featured.") });
      setMoments((list) => list?.map((x) => (x._id === m._id ? { ...x, featured, featuredAt: featured ? new Date().toISOString() : null } : x)) ?? list);
      setData((d) => (d?.summary ? { ...d, summary: { ...d.summary, featured: d.summary.featured + (featured ? 1 : -1) } } : d));
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not change this moment.") });
    }
  }

  if (loading) return <NcCard><div className="py-16 text-center text-sm text-nc-muted">Loading…</div></NcCard>;
  if (!data?.summary) return <NcCard><div className="py-16 text-center text-[13px] text-nc-muted">The Asaas training isn’t set up yet.</div></NcCard>;

  const s = data.summary;
  const n = s.murabbis;
  const pct = (x: number) => (n ? (x / n) * 100 : 0);
  const featuredList = (moments ?? []).filter((m) => m.featured);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-[12.5px] text-nc-muted">
          What murabbis write in their Noor Journal, read by the Noor Circles team to support them. Supervisors and other murabbis can’t see it.
        </p>
        <button className="btn-outline !py-2 text-[12.5px]" onClick={() => printJournalReport(data, featuredList)}>
          <Download className="h-3.5 w-3.5" /> Download PDF report
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:gap-4">
        <StatCard label="Murabbis" value={s.murabbis} meta="Given the training" color="purple" />
        <StatCard label="Writing" value={s.writing} meta="At least one page" color="teal" />
        <StatCard label="Average pages" value={s.avgPages} meta={`of ${s.totalPages}`} color="gold" />
        <StatCard label="Behind" value={s.behind} meta="2+ pages waiting" color="red" />
        <StatCard label="Not started" value={s.notStarted} meta="Pages open, none written" color="red" />
        <StatCard label="Complete" value={s.complete} meta="Every page" color="green" />
        <StatCard label="Moments" value={s.momentsThisMonth} meta={`This month · ${s.moments} in all`} color="gold" />
        <StatCard label="Featured" value={s.featured} meta="Moments of light" color="purple" />
      </div>

      {/* Where murabbis stop */}
      <NcCard className="p-4 sm:p-6">
        <div className="mb-1 text-[14px] font-semibold text-nc-dark">Where murabbis stop</div>
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-nc-muted">
          <span>Out of {n} murabbi{n === 1 ? "" : "s"}:</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-plum" /> Written</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gold" /> Open, waiting</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-muted" /> Not open yet</span>
        </div>
        <ul className="space-y-3">
          {data.pages.map((p) => {
            const notOpen = Math.max(0, n - p.open);
            return (
              <li key={p.key} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2 sm:grid-cols-[1.5rem_minmax(0,16rem)_minmax(0,1fr)] sm:items-center sm:gap-x-4">
                <span className="pt-0.5 text-[13px] font-semibold text-plum">{p.number}</span>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-medium text-nc-dark">{p.titleEn}</div>
                  <Urdu className="truncate text-[13px] leading-[1.9] text-nc-muted">{p.titleUr}</Urdu>
                </div>
                <div className="col-start-2 min-w-0 sm:col-start-auto">
                  <div className="flex h-3 overflow-hidden rounded-full bg-muted" title={`${p.done} written · ${p.waiting} waiting · ${notOpen} not open`}>
                    <div className="h-full bg-plum" style={{ width: `${pct(p.done)}%` }} />
                    <div className="h-full bg-gold" style={{ width: `${pct(p.waiting)}%` }} />
                  </div>
                  <div className="mt-1 text-[11px] text-nc-muted">
                    <span className="font-semibold text-nc-dark">{p.done}</span> written · {p.waiting} waiting{p.started ? ` (${p.started} started)` : ""} · {notOpen} not open
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </NcCard>

      {/* Murabbis */}
      <NcCard className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-nc-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email…" aria-label="Search murabbis"
              className="h-9 w-52 max-w-full rounded-md border border-input bg-card pl-8 pr-3 text-[13px] focus:border-primary focus:outline-none" />
          </div>
          {data.clusters.length > 0 && (
            <select value={cluster} onChange={(e) => setCluster(e.target.value)} aria-label="Cluster" className={SELECT}>
              <option value="">All clusters</option>
              {data.clusters.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className={SELECT}>
            <option value="">All statuses</option>
            {Object.entries(JOURNAL_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button className="btn-primary ml-auto !py-2 text-[12.5px]" disabled={!picked.size} onClick={() => setRemindIds([...picked])}>
            <BellRing className="h-3.5 w-3.5" /> Remind selected ({picked.size})
          </button>
        </div>

        {!data.murabbis.length ? (
          <div className="py-14 text-center text-[13px] text-nc-muted">No murabbis have been given the training yet.</div>
        ) : rows.length === 0 ? (
          <div className="py-14 text-center text-[13px] text-nc-muted">No murabbis match.</div>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[1080px] text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-nc-muted">
                  <th className="px-3 py-2">
                    <input type="checkbox" checked={allPicked} onChange={pickAll} aria-label="Select all" className="accent-[hsl(var(--teal))]" />
                  </th>
                  <th className="px-3 py-2 font-medium">Murabbi</th>
                  <th className="px-3 py-2 font-medium">Clusters</th>
                  <th className="px-3 py-2 font-medium">Pages</th>
                  <th className="px-3 py-2 font-medium">Waiting</th>
                  <th className="px-3 py-2 font-medium">Moments</th>
                  <th className="px-3 py-2 font-medium">Reflection</th>
                  <th className="px-3 py-2 font-medium">Last written</th>
                  <th className="px-3 py-2 font-medium">Last reminder</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const id = r.user._id;
                  return (
                    <tr key={id} className={cn("border-b border-border/60", picked.has(id) && "bg-teal-lt/40")}>
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={picked.has(id)} onChange={() => toggle(id)} aria-label={`Select ${r.user.fullName}`} className="accent-[hsl(var(--teal))]" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-nc-dark">{r.user.fullName}</div>
                        <div className="text-[11.5px] text-nc-muted">{r.user.email}</div>
                      </td>
                      <td className="px-3 py-3 text-[12px] text-nc-dark">{r.clusters.join(", ") || <span className="text-nc-muted">—</span>}</td>
                      <td className="px-3 py-3">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-plum" style={{ width: `${r.totalPages ? (r.pagesDone / r.totalPages) * 100 : 0}%` }} />
                        </div>
                        <div className={cn("mt-1 text-[11.5px]", r.pagesDone === r.totalPages ? "font-semibold text-nc-green" : "text-nc-muted")}>
                          {r.pagesDone}/{r.totalPages}
                        </div>
                      </td>
                      <td className="px-3 py-3" title={r.nextPage ? `Next: ${r.nextPage}` : undefined}>
                        <span className={cn(r.waiting >= 2 ? "font-semibold text-nc-amber" : "text-nc-dark")}>{r.waiting}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-nc-dark">
                        {r.moments}{r.momentsThisMonth ? <span className="text-[11.5px] text-nc-muted"> · {r.momentsThisMonth} this month</span> : null}
                      </td>
                      <td className="px-3 py-3"><ReflectionChip status={r.reflection} /></td>
                      <td className="whitespace-nowrap px-3 py-3 text-nc-dark" title={r.lastWrittenAt ? formatDate(r.lastWrittenAt) : undefined}>{ago(r.lastWrittenAt)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-[12px] text-nc-muted">
                        {r.lastReminderAt ? <>{ago(r.lastReminderAt)}{r.reminders > 1 ? ` · ${r.reminders}×` : ""}</> : "—"}
                      </td>
                      <td className="px-3 py-3"><StatusChip status={r.status} /></td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        <button className="inline-flex items-center gap-1 text-[12px] font-medium text-teal hover:underline" onClick={() => setReadId(id)}>
                          <BookOpen className="h-3.5 w-3.5" /> Read journal
                        </button>
                        <button className="ml-3 inline-flex items-center gap-1 text-[12px] font-medium text-teal hover:underline" onClick={() => setRemindIds([id])}>
                          <BellRing className="h-3.5 w-3.5" /> Send reminder
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[11.5px] text-nc-muted">
          Behind: two or more open pages not yet written. Reminders are sent by email only when you press the button, at most once a day per murabbi.
        </p>
      </NcCard>

      <MomentsPanel moments={moments ?? []} months={data.months} onFeature={feature} />

      {remindIds && (
        <RemindModal
          names={remindIds.map((id) => data.murabbis.find((r) => r.user._id === id)?.user.fullName ?? "").filter(Boolean)}
          userIds={remindIds}
          onClose={() => setRemindIds(null)}
          onSent={() => { setRemindIds(null); setPicked(new Set()); load(); }}
        />
      )}
      {readId && <ReadJournal userId={readId} onClose={() => setReadId(null)} />}
    </div>
  );
}

// ── Reminders ───────────────────────────────────────────────────────────────

function RemindModal({ userIds, names, onClose, onSent }: { userIds: string[]; names: string[]; onClose: () => void; onSent: () => void }) {
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const one = userIds.length === 1;

  async function send() {
    setSending(true);
    try {
      const r = await journalService.remind({ userIds, note: note.trim() || undefined });
      toast({ title: apiMessage(r, "Reminder sent.") });
      onSent();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not send the reminder.") });
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={one ? `Remind ${names[0] ?? "this murabbi"}` : `Remind ${userIds.length} murabbis`}
      subtitle="An email with how far they’ve got and the next page waiting for them. Each murabbi gets at most one a day.">
      {!one && names.length > 0 && (
        <div className="mb-4 max-h-24 overflow-y-auto text-[12.5px] text-nc-dark">{names.join(", ")}</div>
      )}
      <FormGroup label="Note (optional)">
        <FormTextarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="e.g. We’d love to read your next page before Friday’s circle." />
      </FormGroup>
      <button className="btn-primary w-full justify-center" disabled={sending} onClick={send}>
        <BellRing className="h-3.5 w-3.5" /> {sending ? "Sending…" : one ? "Send reminder" : `Send ${userIds.length} reminders`}
      </button>
    </Modal>
  );
}

// ── Moments of light ────────────────────────────────────────────────────────

function MomentsPanel({ moments, months, onFeature }: {
  moments: JournalAdminMoment[]; months: Insights["months"]; onFeature: (m: JournalAdminMoment, featured: boolean) => void;
}) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"all" | "featured">("all");
  const [limit, setLimit] = useState(30);
  const list = tab === "featured" ? moments.filter((m) => m.featured) : moments;
  const max = Math.max(1, ...months.map((m) => m.moments));

  async function copy(m: JournalAdminMoment) {
    try {
      await navigator.clipboard.writeText(`${m.text.trim()}\n— ${m.byline}`);
      toast({ title: "Copied with its byline." });
    } catch {
      toast({ variant: "destructive", title: "Couldn’t copy. Select the text and copy it manually." });
    }
  }

  return (
    <NcCard className="p-4 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold-dim"><Sparkles className="h-4 w-4" /></span>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-nc-dark">Moments of light</div>
          <div className="text-[12px] text-nc-muted">
            Feature a moment for the newsletter. Its byline shows the murabbi’s name only if they agreed to it.
          </div>
        </div>
      </div>

      <div className="mb-5 space-y-1.5">
        {months.map((m) => (
          <div key={m.month} className="flex items-center gap-3 text-[12px]">
            <span className="w-16 flex-shrink-0 text-nc-muted">{monthName(m.month)}</span>
            <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gold" style={{ width: `${(m.moments / max) * 100}%` }} />
            </div>
            <span className="w-8 flex-shrink-0 text-right font-semibold text-nc-dark"
              title={Object.entries(m.clusters).map(([k, v]) => `${k}: ${v}`).join("\n") || undefined}>{m.moments}</span>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        {([["all", `All (${moments.length})`], ["featured", `Featured (${moments.filter((m) => m.featured).length})`]] as const).map(([k, label]) => (
          <button key={k} onClick={() => { setTab(k); setLimit(30); }}
            className={cn("rounded-full px-3 py-1 text-[12.5px] font-medium", tab === k ? "bg-teal text-white" : "bg-muted text-nc-dark hover:bg-teal-lt")}>
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="py-10 text-center text-[13px] text-nc-muted">{tab === "featured" ? "No moments featured yet." : "No moments of light written yet."}</div>
      ) : (
        <ul className="space-y-3">
          {list.slice(0, limit).map((m) => (
            <li key={m._id} className={cn("rounded-lg border border-border border-l-[3px] px-4 py-3", m.featured ? "border-l-gold bg-gold/5" : "border-l-border")}>
              <div className="mb-1 flex flex-wrap items-start gap-x-3 gap-y-1">
                <div className="min-w-0 flex-1 text-[11.5px] text-nc-muted">
                  <span className="font-semibold uppercase tracking-wide text-gold-dim">{momentDate(m.date)}</span>
                  {" · "}<span className="font-medium text-nc-dark">{m.murabbi?.fullName ?? "Murabbi"}</span>
                  {m.circle || m.cluster ? ` · ${[m.circle, m.cluster].filter(Boolean).join(", ")}` : ""}
                </div>
                <button onClick={() => onFeature(m, !m.featured)}
                  className={cn("inline-flex flex-shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium",
                    m.featured ? "border-gold bg-gold/20 text-gold-dim" : "border-border text-nc-dark hover:border-gold hover:text-gold-dim")}>
                  <Star className={cn("h-3 w-3", m.featured && "fill-current")} /> {m.featured ? "Unfeature" : "Feature"}
                </button>
              </div>
              <p dir="auto" className={cn("whitespace-pre-wrap break-words text-nc-dark", hasUrdu(m.text) ? "urdu text-[15px] leading-[2.2]" : "text-[13.5px] leading-relaxed")}>{m.text}</p>
              {m.featured && (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gold/25 pt-2 text-[12px]">
                  <span className="min-w-0 flex-1 italic text-plum">— {m.byline}</span>
                  {!m.shareName && <span className="text-[11px] text-nc-muted">Name not shared</span>}
                  <button className="inline-flex items-center gap-1 font-medium text-teal hover:underline" onClick={() => copy(m)}>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {list.length > limit && (
        <div className="mt-4 text-center">
          <button className="btn-outline !py-1.5 text-[12.5px]" onClick={() => setLimit((l) => l + 30)}>Show more ({list.length - limit})</button>
        </div>
      )}
    </NcCard>
  );
}

// ── Reading one murabbi's journal ───────────────────────────────────────────

function fieldAnswer(f: JournalField, value?: string) {
  if (!value?.trim()) return null;
  if (f.kind === "choice") {
    const o = f.options?.find((x) => x.value === value);
    return o ? { en: o.en, ur: o.ur } : { en: value, ur: "" };
  }
  return { en: value, ur: "" };
}

function Answer({ text }: { text: string }) {
  return (
    <p dir="auto" className={cn("mt-1 whitespace-pre-wrap break-words border-l-2 border-gold pl-3 text-nc-dark",
      hasUrdu(text) ? "urdu text-[15px] leading-[2.2]" : "text-[13.5px] leading-relaxed")}>{text}</p>
  );
}

function ReadJournal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { toast } = useToast();
  const [d, setD] = useState<JournalAdminData | null>(null);

  useEffect(() => {
    journalService.murabbi(userId)
      .then((r) => setD(unwrap<JournalAdminData>(r)))
      .catch((err) => { toast({ variant: "destructive", title: apiError(err, "Could not open this journal.") }); onClose(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex justify-end bg-black/45" role="dialog" aria-modal="true" aria-label="Noor Journal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex h-full w-full max-w-3xl flex-col bg-card shadow-xl">
        <div className="flex items-start gap-3 border-b border-border px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="truncate font-serif text-[20px] text-nc-dark">{d?.user.fullName ?? "Loading…"}</div>
            <div className="truncate text-[12px] text-nc-muted">
              {d ? <>{d.user.email} · {d.progress.done} of {d.progress.total} pages · {d.moments.list.length} moment{d.moments.list.length === 1 ? "" : "s"}</> : "Noor Journal"}
            </div>
          </div>
          {d && (
            <button className="btn-outline flex-shrink-0 !px-3 !py-1.5 text-[12px]" onClick={() => printJournal({ ...d, owner: d.owner || d.user.fullName })}>
              <Printer className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Print this journal</span><span className="sm:hidden">Print</span>
            </button>
          )}
          <button className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-nc-muted hover:bg-teal-lt" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#fffdf8] px-4 py-5 sm:px-6">
          {!d ? <div className="py-16 text-center text-sm text-nc-muted">Loading…</div> : (
            <div className="space-y-5">
              {!d.assigned && (
                <div className="rounded-md border border-nc-amber/30 bg-nc-amber-lt px-3 py-2 text-[12.5px] text-nc-dark">The Asaas training isn’t assigned to this murabbi.</div>
              )}
              {d.pages.map((p) => (
                <section key={p.key} className="rounded-lg border border-gold/30 bg-white/60 p-4">
                  <div className="mb-3 flex items-start gap-3 border-b border-gold/30 pb-2">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-plum text-[13px] font-semibold text-white">{p.number}</span>
                    <div className="min-w-0 flex-1">
                      <Urdu className="text-[16px] leading-[2] text-plum">{p.titleUr}</Urdu>
                      <div className="text-[13px] font-semibold text-nc-dark">{p.titleEn}</div>
                    </div>
                    <span className={cn("flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      p.done ? "bg-nc-green-lt text-nc-green" : p.open ? "bg-nc-amber-lt text-nc-amber" : "bg-muted text-nc-muted")}>
                      {p.done ? "Written" : p.open ? "Waiting" : "Not open"}
                    </span>
                  </div>
                  {p.updatedAt && <div className="-mt-1 mb-2 text-[11px] text-nc-muted">Last saved {formatDate(p.updatedAt)}</div>}
                  {p.kind === "reflection" ? (
                    <div>
                      {p.prompt?.trim() && <p dir="auto" className="mb-2 rounded-md bg-gold/10 px-3 py-2 text-[12.5px] text-nc-dark">{p.prompt}</p>}
                      {p.reflection ? (
                        <>
                          <div className="flex items-center gap-2 text-[12px] text-nc-muted">
                            Reflection <ReflectionChip status={p.reflection.status} />
                            {p.reflection.submittedAt && <span>· {formatDate(p.reflection.submittedAt)}</span>}
                          </div>
                          <Answer text={p.reflection.text} />
                          {p.reflection.feedback && <p className="mt-2 text-[12px] text-nc-muted">Feedback: {p.reflection.feedback}</p>}
                        </>
                      ) : <p className="text-[12.5px] text-nc-muted">Not submitted yet.</p>}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {p.fields.map((f) => {
                        const a = fieldAnswer(f, p.answers?.[f.key]);
                        return (
                          <div key={f.key}>
                            <Urdu className="text-[13px] leading-[2] text-nc-dark">{f.labelUr}</Urdu>
                            <div className="text-[12px] font-semibold text-nc-dark">{f.labelEn}</div>
                            {!a ? <p className="mt-1 text-[12.5px] italic text-nc-muted">Not written</p>
                              : f.kind === "choice" ? (
                                <div className="mt-1 border-l-2 border-gold pl-3">
                                  {a.ur && <Urdu className="text-[14px] leading-[2] text-plum">{a.ur}</Urdu>}
                                  <div className="text-[13px] font-medium text-plum">{a.en}</div>
                                </div>
                              ) : <Answer text={a.en} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              ))}

              <section className="rounded-lg border border-gold/30 bg-white/60 p-4">
                <div className="mb-3 flex items-center gap-3 border-b border-gold/30 pb-2">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold-dim"><Sparkles className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <Urdu className="text-[16px] leading-[2] text-plum">روشن لمحے</Urdu>
                    <div className="text-[13px] font-semibold text-nc-dark">Moments of light</div>
                  </div>
                </div>
                {!d.moments.list.length ? <p className="text-[12.5px] text-nc-muted">{d.moments.open ? "No moments yet." : "Not open yet."}</p> : (
                  <ul className="space-y-3">
                    {d.moments.list.map((m) => (
                      <li key={m._id}>
                        <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
                          <span className="font-semibold uppercase tracking-wide text-gold-dim">{momentDate(m.date)}</span>
                          {m.circle && <span className="text-nc-muted">· {m.circle.name}</span>}
                          {m.featured && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10.5px] font-semibold text-gold-dim">Featured</span>}
                          <span className="text-[10.5px] text-nc-muted">{m.shareName ? "Name may be used" : "Name not shared"}</span>
                        </div>
                        <Answer text={m.text} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
