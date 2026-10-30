import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supervisorService } from "@/services/api.service";
import NcCard from "@/components/shared/NcCard";
import Modal from "@/components/shared/Modal";
import CalendarList from "@/components/shared/CalendarList";
import { cn } from "@/lib/utils";
import { apiError, apiMessage, unwrap } from "@/lib/finance";
import { addDays, formatDay, pkToday } from "@/lib/schedule";
import type { SupervisorShared } from "./SupervisorIndex";

const inputCls = "h-10 w-full rounded-md border border-input bg-card px-3 text-[13.5px] focus:border-primary focus:outline-none";
const EVENT_TYPES = [
  { value: "parent_evening", label: "Parent evening" },
  { value: "event", label: "Event" },
  { value: "holiday", label: "Break (no circle)" },
];

// ── Calendar ────────────────────────────────────────────────────────────────

export function SupervisorCalendar({ shared }: { shared: SupervisorShared }) {
  const { toast } = useToast();
  const [weeks, setWeeks] = useState(8);
  const [data, setData] = useState<any>(null);
  const [editing, setEditing] = useState<any | null>(null);

  const load = useCallback(() => {
    const from = pkToday();
    supervisorService.calendar(from, addDays(from, weeks * 7)).then((r) => setData(unwrap(r)))
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load the calendar.") }));
  }, [weeks, toast]);
  useEffect(load, [load]);

  async function remove(e: any) {
    if (!window.confirm(`Remove “${e.title}”?`)) return;
    try { toast({ title: apiMessage(await supervisorService.deleteEvent(e._id), "Removed.") }); load(); }
    catch (err) { toast({ variant: "destructive", title: apiError(err, "Could not remove.") }); }
  }

  return (
    <div className="page-animate">
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h2 className="font-serif text-[26px] text-nc-dark">Calendar</h2>
          <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
            Every circle meeting in your cluster with the session it should cover. Add parent evenings, events or breaks for your circles;
            holidays for everyone are set by the admin team.
          </p>
        </div>
        <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} aria-label="Period"
          className="h-10 rounded-md border border-input bg-card px-3 text-[13.5px]">
          {[4, 8, 12, 26].map((w) => <option key={w} value={w}>Next {w} weeks</option>)}
        </select>
        <button className="btn-primary" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> Add to calendar</button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <NcCard className="min-w-0 p-4 sm:p-6">
          {data ? <CalendarList items={data.items} showCircle /> : <div className="py-16 text-center text-sm text-nc-muted">Loading…</div>}
        </NcCard>
        <NcCard className="h-fit p-4 sm:p-5">
          <div className="mb-3 text-[14px] font-semibold text-nc-dark">Added for your circles</div>
          {!data?.events.length ? <p className="text-[12.5px] text-nc-muted">Nothing yet.</p> : data.events.map((e: any) => (
            <div key={e._id} className="flex items-start gap-2 border-b border-border/60 py-2 last:border-0">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-nc-dark">{e.title}</div>
                <div className="text-[11.5px] text-nc-muted">
                  {formatDay(e.startDate)}{e.endDate !== e.startDate ? ` – ${formatDay(e.endDate)}` : ""} · {e.circles.map((c: any) => c.name).join(", ")}
                </div>
              </div>
              <button className="text-[12px] text-teal hover:underline" onClick={() => setEditing(e)}>Edit</button>
              <button className="text-nc-muted hover:text-nc-red" onClick={() => remove(e)} aria-label={`Remove ${e.title}`}><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </NcCard>
      </div>
      <EventForm event={editing} circles={(shared.dashboard?.circles ?? []).filter((c) => c.isActive)} onClose={() => setEditing(null)} onSaved={load} />
    </div>
  );
}

function EventForm({ event, circles, onClose, onSaved }: { event: any | null; circles: any[]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const isNew = event && !event._id;

  useEffect(() => {
    if (!event) return;
    setF({
      title: event.title ?? "", type: event.type ?? "parent_evening", startDate: event.startDate ?? pkToday(), endDate: event.endDate ?? "",
      notes: event.notes ?? "", circleIds: (event.circles ?? []).map((c: any) => c._id ?? c),
    });
  }, [event]);

  if (!event) return null;
  const set = (k: string, v: unknown) => setF((x) => ({ ...x, [k]: v }));

  async function save() {
    setBusy(true);
    const body = {
      title: f.title, type: f.type, startDate: f.startDate, endDate: f.endDate || f.startDate, notes: f.notes, circleIds: f.circleIds,
      cancelsSessions: f.type === "holiday",
    };
    try {
      const r = isNew ? await supervisorService.createEvent(body) : await supervisorService.updateEvent(event._id, body);
      toast({ title: apiMessage(r, "Saved.") });
      onSaved();
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isNew ? "Add to the calendar" : "Edit"}>
      <label className="mb-3 block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Title *</span>
        <input dir="auto" value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} maxLength={150} placeholder="e.g. Parents’ evening" className={inputCls} /></label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Type</span>
          <select value={f.type ?? ""} onChange={(e) => set("type", e.target.value)} className={inputCls}>
            {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select></label>
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">From</span>
          <input type="date" value={f.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Until</span>
          <input type="date" value={f.endDate ?? ""} min={f.startDate} onChange={(e) => set("endDate", e.target.value)} className={inputCls} /></label>
      </div>
      {f.type === "holiday" && <p className="mt-2 text-[12px] text-nc-muted">The chosen circles won’t meet on these days, and their syllabus plan moves on a week.</p>}
      <div className="mb-1.5 mt-4 text-[12.5px] font-medium text-slate">Circles *</div>
      <div className="max-h-44 overflow-y-auto rounded-md border border-border">
        {circles.map((c) => (
          <label key={c._id} className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-[13px] hover:bg-muted/40">
            <input type="checkbox" checked={(f.circleIds ?? []).includes(c._id)} className="accent-[hsl(var(--teal))]"
              onChange={() => set("circleIds", (f.circleIds ?? []).includes(c._id) ? f.circleIds.filter((x: string) => x !== c._id) : [...(f.circleIds ?? []), c._id])} />
            {c.name}
          </label>
        ))}
      </div>
      <label className="mt-3 block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Notes</span>
        <textarea dir="auto" value={f.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} maxLength={1000}
          className="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-[13.5px] focus:border-primary focus:outline-none" /></label>
      <div className="mt-6 flex gap-2">
        <button className="btn-primary flex-1 justify-center" disabled={!f.title?.trim() || !f.startDate || !f.circleIds?.length || busy} onClick={save}>{busy ? "Saving…" : "Save"}</button>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

// ── Messages ────────────────────────────────────────────────────────────────

export function SupervisorMessages({ shared }: { shared: SupervisorShared }) {
  const { toast } = useToast();
  const [clusterId, setClusterId] = useState("");
  const [to, setTo] = useState<"parents" | "murabbis">("parents");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reach, setReach] = useState<any>(null);
  const [sent, setSent] = useState<any[]>([]);
  const [busy, setBusy] = useState<"" | "test" | "send">("");
  const reqId = useRef(0);

  useEffect(() => { if (!clusterId && shared.clusters[0]) setClusterId(shared.clusters[0]._id); }, [shared.clusters, clusterId]);

  const loadSent = useCallback(() => {
    supervisorService.messages().then((r) => setSent(unwrap<any>(r).messages)).catch(() => {});
  }, []);
  useEffect(loadSent, [loadSent]);

  useEffect(() => {
    setReach(null);
    if (!clusterId) return;
    const id = ++reqId.current;
    supervisorService.audience({ clusterId, to }).then((r) => { if (id === reqId.current) setReach(unwrap(r)); }).catch(() => {});
  }, [clusterId, to]);

  async function send(testOnly: boolean) {
    if (!testOnly && !window.confirm(`Send this email to ${reach?.count ?? "everyone"} ${reach?.count === 1 ? "person" : "people"} now?`)) return;
    setBusy(testOnly ? "test" : "send");
    try {
      toast({ title: apiMessage(await supervisorService.send({ clusterId, to, subject, body, testOnly }), "Sent.") });
      if (!testOnly) { setSubject(""); setBody(""); loadSent(); }
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not send.") });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="page-animate">
      <h2 className="font-serif text-[26px] text-nc-dark">Messages</h2>
      <p className="mb-5 mt-1 max-w-2xl text-[13.5px] text-nc-muted">Email the parents or murabbis of your cluster. Replies go to the Noor Circles support inbox.</p>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <NcCard className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-2">
            {shared.clusters.length > 1 && (
              <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Cluster</span>
                <select value={clusterId} onChange={(e) => setClusterId(e.target.value)} className={inputCls}>
                  {shared.clusters.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select></label>
            )}
            <div>
              <span className="mb-1 block text-[12.5px] font-medium text-slate">Send to</span>
              <div className="flex gap-1.5">
                {(["parents", "murabbis"] as const).map((t) => (
                  <button key={t} onClick={() => setTo(t)}
                    className={cn("h-10 flex-1 rounded-md border text-[13px]", to === t ? "border-plum bg-plum-lt font-semibold text-plum" : "border-border text-nc-dark")}>
                    {t === "parents" ? "Parents" : "Murabbis"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {reach && (
            <p className="mt-2 text-[12.5px] text-nc-muted">
              {reach.count} {reach.count === 1 ? "person" : "people"}{reach.withoutEmail ? ` · ${reach.withoutEmail} without an email address` : ""}{reach.optedOut ? ` · ${reach.optedOut} opted out` : ""}
            </p>
          )}
          <label htmlFor="sv-subject" className="mb-1.5 mt-4 block text-[13px] font-medium text-slate">Subject</label>
          <input id="sv-subject" dir="auto" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} className={inputCls} />
          <label htmlFor="sv-body" className="mb-1.5 mt-3 block text-[13px] font-medium text-slate">Message</label>
          <textarea id="sv-body" dir="auto" value={body} onChange={(e) => setBody(e.target.value)} rows={10} maxLength={20000}
            placeholder={"Assalam-o-Alaikum {name},\n\n…"}
            className="w-full resize-y rounded-md border border-input bg-card px-3 py-2.5 text-[14px] leading-relaxed focus:border-primary focus:outline-none" />
          <p className="mt-1.5 text-[11.5px] text-nc-muted"><code className="rounded bg-muted px-1">{"{name}"}</code> becomes each person’s first name. Urdu paragraphs show right to left.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-outline" disabled={!subject.trim() || !body.trim() || !!busy} onClick={() => send(true)}>{busy === "test" ? "Sending…" : "Send me a test"}</button>
            <button className="btn-primary" disabled={!subject.trim() || !body.trim() || !clusterId || !reach?.count || !!busy} onClick={() => send(false)}>
              <Send className="h-4 w-4" /> {busy === "send" ? "Sending…" : "Send"}
            </button>
          </div>
        </NcCard>
        <NcCard className="h-fit p-4 sm:p-5">
          <div className="mb-3 text-[14px] font-semibold text-nc-dark">Sent</div>
          {sent.length === 0 ? <p className="text-[12.5px] text-nc-muted">Nothing sent yet.</p> : sent.map((m) => (
            <div key={m._id} className="border-b border-border/60 py-2 last:border-0">
              <div dir="auto" className="text-[13px] text-nc-dark">{m.subject}</div>
              <div className="text-[11.5px] text-nc-muted">{m.audienceLabel} · {m.recipients} · {formatDay(m.createdAt)}</div>
            </div>
          ))}
        </NcCard>
      </div>
    </div>
  );
}
