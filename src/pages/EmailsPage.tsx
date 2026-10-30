import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Mail, RotateCcw, Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { circlesService, emailService, neighbourhoodsService } from "@/services/api.service";
import StatCard from "@/components/shared/StatCard";
import NcCard from "@/components/shared/NcCard";
import { cn } from "@/lib/utils";
import { apiError, apiMessage, unwrap } from "@/lib/finance";

type Tab = "compose" | "sent" | "log" | "automatic";
const TABS: { key: Tab; label: string }[] = [
  { key: "compose",   label: "Write an email" },
  { key: "sent",      label: "Sent & scheduled" },
  { key: "log",       label: "Email log" },
  { key: "automatic", label: "Automatic emails" },
];

const AUDIENCES = [
  { type: "murabbis",              label: "All active murabbis" },
  { type: "murabbis-tier",         label: "Murabbis of one tier" },
  { type: "murabbis-training",     label: "Murabbis by Asaas training status" },
  { type: "parents",               label: "All parents (with an email)" },
  { type: "parents-circle",        label: "Parents in chosen circles" },
  { type: "parents-neighbourhood", label: "Parents in chosen neighbourhoods" },
];

const STATUS_CLS: Record<string, string> = {
  sent: "bg-nc-green-lt text-nc-green",
  queued: "bg-teal-lt text-teal",
  sending: "bg-teal-lt text-teal",
  failed: "bg-nc-red-lt text-nc-red",
  skipped: "bg-muted text-nc-muted",
  cancelled: "bg-muted text-nc-muted",
  scheduled: "bg-nc-amber-lt text-nc-amber",
};

const KIND_LABELS: Record<string, string> = {
  "account.welcome": "Welcome", "account.reset": "Password reset", "account.approved": "Approved", "account.declined": "Declined",
  "account.blocked": "Sign-in paused", "account.restored": "Sign-in restored", "account.password-changed": "Password changed",
  "interest.thanks": "Interest thank-you", "interest.alert": "Interest alert", "training.assigned": "Training assigned",
  "training.reminder": "Training reminder", "training.lessons-done": "Lessons done", "training.assessment": "Assessment",
  "training.reflection": "Reflection", "training.practical": "Practical", "training.certified": "Certified",
  "family.welcome": "Family welcome", "contribution.pledge": "Pledge", "contribution.receipt": "Receipt", campaign: "Group email",
};

const when = (d?: string | null) => (d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—");

export default function EmailsPage() {
  const [tab, setTab] = useState<Tab>("compose");
  const [logCampaign, setLogCampaign] = useState<string | null>(null);

  return (
    <div className="page-animate">
      <div className="mb-6">
        <h2 className="font-serif text-[26px] text-nc-dark">Emails</h2>
        <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
          Everything the portal emails from <span className="font-semibold text-nc-dark">support@noorcircles.com</span>. Write to a group of
          murabbis or parents, see what was sent and whether it arrived, and preview the automatic emails. Replies come to the support inbox.
        </p>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => { setTab(t.key); if (t.key !== "log") setLogCampaign(null); }}
            className={cn("-mb-px whitespace-nowrap border-b-2 px-3.5 py-2 text-[13px] font-medium transition-colors",
              tab === t.key ? "border-teal text-teal" : "border-transparent text-nc-muted hover:text-nc-dark")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "compose" ? <ComposeTab onSent={() => setTab("sent")} />
        : tab === "sent" ? <SentTab onOpenLog={(id) => { setLogCampaign(id); setTab("log"); }} />
        : tab === "log" ? <LogTab campaign={logCampaign} onClearCampaign={() => setLogCampaign(null)} />
        : <AutomaticTab />}
    </div>
  );
}

// ── Preview frame ───────────────────────────────────────────────────────────

function EmailFrame({ html, height = 640 }: { html: string; height?: number }) {
  // Sandboxed: no scripts, links open in a new tab.
  return <iframe title="Email preview" sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={html.replace("<head>", '<head><base target="_blank">')}
    className="w-full rounded-md border border-border bg-[#f4ede4]" style={{ height }} />;
}

function PreviewModal({ subject, html, onClose }: { subject: string; html: string; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:p-6" role="dialog" aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-lg bg-card p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-nc-muted">Subject</div>
            <div dir="auto" className="text-[14px] font-semibold text-nc-dark">{subject}</div>
          </div>
          <button className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted hover:bg-teal-lt" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <EmailFrame html={html} height={680} />
      </div>
    </div>
  );
}

// ── Write an email ──────────────────────────────────────────────────────────

function ComposeTab({ onSent }: { onSent: () => void }) {
  const { toast } = useToast();
  const [type, setType] = useState("murabbis");
  const [tier, setTier] = useState(1);
  const [status, setStatus] = useState("not-started");
  const [ids, setIds] = useState<string[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [schedule, setSchedule] = useState(false);
  const [at, setAt] = useState("");
  const [reach, setReach] = useState<any>(null);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [busy, setBusy] = useState<"" | "test" | "send" | "preview">("");
  const reqId = useRef(0);

  useEffect(() => {
    circlesService.getAll().then((r) => setCircles(unwrap<any>(r)?.circles ?? unwrap<any[]>(r) ?? [])).catch(() => {});
    neighbourhoodsService.getAll().then((r) => setAreas(unwrap<any>(r)?.neighbourhoods ?? unwrap<any[]>(r) ?? [])).catch(() => {});
  }, []);

  const audience = useMemo(() => ({
    type,
    ...(type === "murabbis-tier" && { tier }),
    ...(type === "murabbis-training" && { status }),
    ...((type === "parents-circle" || type === "parents-neighbourhood") && { ids }),
  }), [type, tier, status, ids]);
  const needsIds = type === "parents-circle" || type === "parents-neighbourhood";

  useEffect(() => {
    setReach(null);
    if (needsIds && !ids.length) return;
    const id = ++reqId.current;
    const t = setTimeout(() => {
      emailService.audience(audience).then((r) => { if (id === reqId.current) setReach(unwrap(r)); }).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [audience, needsIds, ids.length]);

  const list = type === "parents-circle" ? circles : areas;
  const ready = subject.trim() && body.trim() && (!needsIds || ids.length) && (!schedule || at);

  async function doPreview() {
    setBusy("preview");
    try { setPreview(unwrap(await emailService.preview({ subject, body }))); }
    catch (err) { toast({ variant: "destructive", title: apiError(err, "Could not preview.") }); }
    finally { setBusy(""); }
  }

  async function send(testOnly: boolean) {
    if (!testOnly && !window.confirm(schedule
      ? `Schedule this email for ${new Date(at).toLocaleString("en-GB")}?`
      : `Send this email to ${reach?.count ?? "everyone in this group"} ${reach?.count === 1 ? "person" : "people"} now?`)) return;
    setBusy(testOnly ? "test" : "send");
    try {
      const r = await emailService.send({ subject, body, audience, testOnly, ...(schedule && !testOnly && { scheduledFor: new Date(at).toISOString() }) });
      toast({ title: apiMessage(r, "Sent.") });
      if (!testOnly) { setSubject(""); setBody(""); setSchedule(false); setAt(""); onSent(); }
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not send.") });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <NcCard className="min-w-0">
        <label className="mb-1.5 block text-[13px] font-medium text-slate">Send to</label>
        <select value={type} onChange={(e) => { setType(e.target.value); setIds([]); }} aria-label="Send to"
          className="mb-3 h-10 w-full rounded-md border border-input bg-card px-3 text-[13.5px] focus:border-primary focus:outline-none">
          {AUDIENCES.map((a) => <option key={a.type} value={a.type}>{a.label}</option>)}
        </select>
        {type === "murabbis-tier" && (
          <select value={tier} onChange={(e) => setTier(Number(e.target.value))} aria-label="Tier"
            className="mb-3 h-10 w-full rounded-md border border-input bg-card px-3 text-[13.5px]">
            {[1, 2, 3].map((t) => <option key={t} value={t}>Tier {t}</option>)}
          </select>
        )}
        {type === "murabbis-training" && (
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Training status"
            className="mb-3 h-10 w-full rounded-md border border-input bg-card px-3 text-[13.5px]">
            <option value="not-started">Assigned but not started</option>
            <option value="in-progress">Part-way through</option>
            <option value="not-certified">Not certified yet (everyone assigned)</option>
            <option value="certified">Certified</option>
          </select>
        )}
        {needsIds && (
          <div className="mb-3 max-h-48 overflow-y-auto rounded-md border border-border">
            {list.length === 0 ? <div className="px-3 py-4 text-[12.5px] text-nc-muted">Nothing to choose from yet.</div> : list.map((x: any) => (
              <label key={x._id} className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-[13px] hover:bg-muted/40">
                <input type="checkbox" checked={ids.includes(x._id)} className="accent-[hsl(var(--teal))]"
                  onChange={() => setIds((v) => (v.includes(x._id) ? v.filter((i) => i !== x._id) : [...v, x._id]))} />
                {x.name}
              </label>
            ))}
          </div>
        )}

        <label htmlFor="em-subject" className="mb-1.5 mt-2 block text-[13px] font-medium text-slate">Subject</label>
        <input id="em-subject" dir="auto" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="e.g. Eid gathering this Friday"
          className="mb-3 h-10 w-full rounded-md border border-input bg-card px-3 text-[14px] focus:border-primary focus:outline-none" />

        <label htmlFor="em-body" className="mb-1.5 block text-[13px] font-medium text-slate">Message</label>
        <textarea id="em-body" dir="auto" value={body} onChange={(e) => setBody(e.target.value)} rows={12} maxLength={20000}
          placeholder={"Assalam-o-Alaikum {name},\n\nWrite your message here. Leave a blank line between paragraphs.\n\nاردو پیراگراف دائیں سے بائیں دکھائے جائیں گے۔"}
          className="w-full resize-y rounded-md border border-input bg-card px-3 py-2.5 text-[14px] leading-relaxed focus:border-primary focus:outline-none" />
        <p className="mt-1.5 text-[11.5px] text-nc-muted">
          <code className="rounded bg-muted px-1">{"{name}"}</code> becomes each person’s first name. A blank line starts a new paragraph;
          Urdu paragraphs are shown right to left. Every email has the Noor Circles header, an unsubscribe link and replies go to support@.
        </p>

        <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-[13px] text-nc-dark">
          <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} className="accent-[hsl(var(--teal))]" />
          Schedule for later
        </label>
        {schedule && (
          <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} aria-label="Send at"
            className="mt-2 h-10 rounded-md border border-input bg-card px-3 text-[13.5px]" />
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn-outline" disabled={!subject.trim() || !body.trim() || !!busy} onClick={doPreview}>
            <Eye className="h-4 w-4" /> {busy === "preview" ? "Loading…" : "Preview"}
          </button>
          <button className="btn-outline" disabled={!subject.trim() || !body.trim() || !!busy} onClick={() => send(true)}>
            <Mail className="h-4 w-4" /> {busy === "test" ? "Sending…" : "Send a test to me"}
          </button>
          <button className="btn-primary ml-auto" disabled={!ready || !!busy || reach?.count === 0} onClick={() => send(false)}>
            <Send className="h-4 w-4" /> {busy === "send" ? "Sending…" : schedule ? "Schedule" : `Send${reach ? ` to ${reach.count}` : ""}`}
          </button>
        </div>
      </NcCard>

      <NcCard className="h-fit">
        <div className="text-[13px] font-semibold text-nc-dark">Who gets it</div>
        {needsIds && !ids.length ? (
          <p className="mt-1 text-[12.5px] text-nc-muted">Choose at least one {type === "parents-circle" ? "circle" : "neighbourhood"}.</p>
        ) : !reach ? (
          <p className="mt-1 text-[12.5px] text-nc-muted">Counting…</p>
        ) : (
          <>
            <div className="mt-1 font-serif text-[32px] leading-none text-nc-dark">{reach.count}</div>
            <div className="text-[12px] text-nc-muted">{reach.label}</div>
            {reach.sample?.length > 0 && <p className="mt-3 text-[12px] text-nc-dark">{reach.sample.join(", ")}{reach.count > reach.sample.length ? "…" : ""}</p>}
            {(reach.optedOut > 0 || reach.withoutEmail > 0) && (
              <ul className="mt-3 space-y-1 text-[11.5px] text-nc-muted">
                {reach.optedOut > 0 && <li>{reach.optedOut} unsubscribed from group emails (skipped)</li>}
                {reach.withoutEmail > 0 && <li>{reach.withoutEmail} parent{reach.withoutEmail === 1 ? " has" : "s have"} no email on file</li>}
              </ul>
            )}
          </>
        )}
        <p className="mt-4 border-t border-border pt-3 text-[11.5px] text-nc-muted">
          Emails go out one by one, a couple of seconds apart, to stay within the mailbox’s daily limit. Large groups take a few minutes.
        </p>
      </NcCard>

      {preview && <PreviewModal subject={preview.subject} html={preview.html} onClose={() => setPreview(null)} />}
    </div>
  );
}

// ── Sent & scheduled ────────────────────────────────────────────────────────

function SentTab({ onOpenLog }: { onOpenLog: (campaignId: string) => void }) {
  const { toast } = useToast();
  const [items, setItems] = useState<any[] | null>(null);

  async function load() {
    try { setItems(unwrap(await emailService.campaigns()) || []); }
    catch (err) { toast({ variant: "destructive", title: apiError(err, "Could not load sent emails.") }); }
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 10_000); // progress while a group email is going out
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cancel(c: any) {
    if (!window.confirm(`Cancel “${c.subject}”? Emails not yet sent won’t go out.`)) return;
    try { toast({ title: apiMessage(await emailService.cancel(c._id)) }); load(); }
    catch (err) { toast({ variant: "destructive", title: apiError(err, "Could not cancel.") }); }
  }

  if (!items) return <NcCard><div className="py-12 text-center text-sm text-nc-muted">Loading…</div></NcCard>;
  if (!items.length) return <NcCard><div className="py-12 text-center text-[13px] text-nc-muted">No group emails yet. Write one in the first tab.</div></NcCard>;
  return (
    <NcCard className="p-4 sm:p-6">
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[760px] text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-nc-muted">
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Delivery</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const total = c.sent + c.pending + c.failed;
              const pct = total ? Math.round((c.sent / total) * 100) : 0;
              const status = c.status === "scheduled" ? "scheduled" : c.status === "cancelled" ? "cancelled" : c.pending ? "sending" : "sent";
              return (
                <tr key={c._id} className="border-b border-border/60">
                  <td className="px-3 py-3">
                    <div dir="auto" className="font-medium text-nc-dark">{c.subject}</div>
                    <div className="text-[11.5px] text-nc-muted">{c.audienceLabel} · by {c.createdBy?.fullName ?? "admin"}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-nc-dark">{c.status === "scheduled" ? `Scheduled ${when(c.scheduledFor)}` : when(c.createdAt)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_CLS[status])}>{status === "sending" ? "Sending" : status[0].toUpperCase() + status.slice(1)}</span>
                      {c.status !== "scheduled" && total > 0 && (
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full bg-nc-green" style={{ width: `${pct}%` }} /></div>
                      )}
                    </div>
                    {c.status !== "scheduled" && (
                      <div className="mt-1 text-[11.5px] text-nc-muted">
                        {c.sent} sent{c.pending ? ` · ${c.pending} to go` : ""}{c.failed ? ` · ${c.failed} failed` : ""}{c.skipped ? ` · ${c.skipped} unsubscribed` : ""}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right">
                    {c.status !== "scheduled" && <button className="mr-3 text-[12px] font-medium text-teal hover:underline" onClick={() => onOpenLog(c._id)}>Who got it</button>}
                    {(c.status === "scheduled" || (c.status === "queued" && c.pending > 0)) && (
                      <button className="text-[12px] font-medium text-nc-red hover:underline" onClick={() => cancel(c)}>Cancel</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </NcCard>
  );
}

// ── Email log ───────────────────────────────────────────────────────────────

function LogTab({ campaign, onClearCampaign }: { campaign: string | null; onClearCampaign: () => void }) {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<{ subject: string; html: string } | null>(null);

  async function load() {
    try { setData(unwrap(await emailService.logs({ status: status || undefined, kind: kind || undefined, search: search.trim() || undefined, campaign: campaign || undefined, page }))); }
    catch (err) { toast({ variant: "destructive", title: apiError(err, "Could not load the email log.") }); }
  }
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, kind, search, page, campaign]);

  async function open(id: string) {
    try { const d = unwrap<any>(await emailService.log(id)); setView({ subject: d.subject, html: d.html }); }
    catch (err) { toast({ variant: "destructive", title: apiError(err, "Could not open the email.") }); }
  }
  async function retry(id: string) {
    try { toast({ title: apiMessage(await emailService.retry(id)) }); load(); }
    catch (err) { toast({ variant: "destructive", title: apiError(err, "Could not retry.") }); }
  }

  const s = data?.last30Days ?? {};
  return (
    <>
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:gap-4">
        <StatCard label="Sent today" value={data ? `${data.today.sent}` : "—"} meta={data ? `Daily limit ${data.today.limit}` : ""} color="teal" />
        <StatCard label="Sent (30 days)" value={s.sent ?? 0} meta="Delivered to the mail server" color="green" />
        <StatCard label="Waiting" value={(s.queued ?? 0) + (s.sending ?? 0)} meta="In the queue" color="gold" />
        <StatCard label="Failed" value={s.failed ?? 0} meta="After 3 tries" color="red" />
        <StatCard label="Skipped" value={s.skipped ?? 0} meta="Unsubscribed" color="purple" />
      </div>
      <NcCard className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Email, name or subject…" aria-label="Search"
            className="h-9 w-56 rounded-md border border-input bg-card px-3 text-[13px] focus:border-primary focus:outline-none" />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status" className="h-9 rounded-md border border-input bg-card px-2.5 text-[13px]">
            <option value="">All statuses</option>
            {["sent", "queued", "failed", "skipped", "cancelled"].map((x) => <option key={x} value={x}>{x[0].toUpperCase() + x.slice(1)}</option>)}
          </select>
          <select value={kind} onChange={(e) => { setKind(e.target.value); setPage(1); }} aria-label="Kind" className="h-9 rounded-md border border-input bg-card px-2.5 text-[13px]">
            <option value="">All kinds</option>
            {Object.entries(KIND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {campaign && (
            <button className="inline-flex items-center gap-1 rounded-full bg-teal-lt px-2.5 py-1 text-[12px] text-teal" onClick={onClearCampaign}>
              One group email <X className="h-3 w-3" />
            </button>
          )}
        </div>
        {!data ? <div className="py-12 text-center text-sm text-nc-muted">Loading…</div> : data.items.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-nc-muted">No emails match.</div>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-nc-muted">
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">To</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((l: any) => (
                  <tr key={l._id} className="border-b border-border/60">
                    <td className="whitespace-nowrap px-3 py-2.5 text-nc-muted">{when(l.sentAt ?? l.createdAt)}</td>
                    <td className="px-3 py-2.5">
                      <div className="text-nc-dark">{l.toName || l.to}</div>
                      {l.toName && <div className="text-[11.5px] text-nc-muted">{l.to}</div>}
                    </td>
                    <td className="max-w-[320px] px-3 py-2.5">
                      <div dir="auto" className="truncate text-nc-dark">{l.subject}</div>
                      <div className="text-[11.5px] text-nc-muted">{KIND_LABELS[l.kind] ?? l.kind}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span title={l.error || undefined} className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_CLS[l.status])}>{l.status}</span>
                      {l.error && <div className="mt-0.5 max-w-[200px] truncate text-[11px] text-nc-muted" title={l.error}>{l.error}</div>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right">
                      <button className="mr-3 text-[12px] font-medium text-teal hover:underline" onClick={() => open(l._id)}>View</button>
                      {l.status === "failed" && (
                        <button className="inline-flex items-center gap-1 text-[12px] font-medium text-teal hover:underline" onClick={() => retry(l._id)}>
                          <RotateCcw className="h-3 w-3" /> Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.pages > 1 && (
              <div className="mt-3 flex items-center justify-end gap-2 text-[12.5px]">
                <button className="btn-outline !py-1 text-[12px]" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <span className="text-nc-muted">Page {data.page} of {data.pages}</span>
                <button className="btn-outline !py-1 text-[12px]" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </div>
        )}
      </NcCard>
      {view && <PreviewModal subject={view.subject} html={view.html} onClose={() => setView(null)} />}
    </>
  );
}

// ── Automatic emails ────────────────────────────────────────────────────────

function AutomaticTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[] | null>(null);
  const [view, setView] = useState<any>(null);
  useEffect(() => {
    emailService.samples().then((r) => setItems(unwrap(r))).catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load.") }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!items) return <NcCard><div className="py-12 text-center text-sm text-nc-muted">Loading…</div></NcCard>;
  return (
    <NcCard className="p-4 sm:p-6">
      <p className="mb-4 text-[12.5px] text-nc-muted">
        These go out on their own when something happens in the portal. People can switch off the ones marked “optional” from the link at the bottom of
        the email or from their settings; the rest always go.
      </p>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {items.map((s) => (
          <button key={s.kind} onClick={() => setView(s)} className="rounded-md border border-border p-3 text-left hover:border-teal hover:bg-teal-lt/30">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold text-nc-dark">{s.title}</span>
              {s.optional && <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-nc-muted">Optional</span>}
              <span className="ml-auto text-[11px] text-nc-muted">{s.audience}</span>
            </div>
            <div className="mt-0.5 text-[12px] text-nc-muted">{s.when}</div>
          </button>
        ))}
      </div>
      {view && <PreviewModal subject={view.subject} html={view.html} onClose={() => setView(null)} />}
    </NcCard>
  );
}
