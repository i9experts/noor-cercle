import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, FileDown, MessageCircle, Phone, Printer, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiError, apiMessage, formatPKR, unwrap } from "@/lib/finance";
import { cn } from "@/lib/utils";
import {
  ASAAS_STAGE, AnyRow, FOLLOW_UP_META, FOLLOW_UP_STATUSES, FollowUp, FollowUpDetail, HostRow, MurabbiRow, NOTE_KINDS, NOTE_KIND_LABEL,
  ParentRow, RegisterType, SPACE_STATUS_LABEL, STAGE_LABEL, accountLabel, agoLabel, dayLabel, exportRegisterCsv, printRegister,
  registerService, shortDate, trainingStage, waNumber,
} from "@/lib/register";

const NOUN: Record<RegisterType, [string, string]> = { murabbi: ["murabbi", "murabbis"], parent: ["parent", "parents"], host: ["host", "hosts"] };
const pkToday = () => new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);
const addDays = (n: number) => new Date(Date.now() + 5 * 3600_000 + n * 86_400_000).toISOString().slice(0, 10);
const phoneOf = (type: RegisterType, r: AnyRow) => (type === "parent" ? (r as ParentRow).whatsapp || (r as ParentRow).phone : (r as MurabbiRow).phone);

type Filters = { q: string; cluster: string; area: string; stage: string; account: string; status: string; due: string };
const EMPTY: Filters = { q: "", cluster: "", area: "", stage: "", account: "", status: "", due: "" };

/** A register of murabbis, parents or hosts, with follow-ups (admin only). */
export default function RegisterView({ type }: { type: RegisterType }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<AnyRow[] | null>(null);
  const [f, setF] = useState<Filters>(EMPTY);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    registerService.list(type)
      .then((r) => setRows(unwrap<AnyRow[]>(r) ?? []))
      .catch((err) => { setRows([]); toast({ variant: "destructive", title: apiError(err, "Could not load the register.") }); });
  }, [type, toast]);
  useEffect(load, [load]);

  const all = useMemo(() => rows ?? [], [rows]);
  const clusters = useMemo(() => [...new Set(all.map((r) => r.cluster).filter(Boolean) as string[])].sort(), [all]);
  const areas = useMemo(() => [...new Set(all.map((r) => r.area).filter(Boolean))].sort(), [all]);

  const shown = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return all.filter((r) => {
      if (q) {
        const hay = [r.fullName, (r as any).email, (r as any).phone, r.area, r.city, r.cluster,
          ...(type === "parent" ? (r as ParentRow).children.map((c) => c.fullName) : []),
          ...(type === "murabbi" ? (r as MurabbiRow).circles.map((c) => c.name) : []),
          ...(type === "host" ? (r as HostRow).spaces.map((s) => s.name) : [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (f.cluster && (f.cluster === "—" ? r.cluster : r.cluster !== f.cluster)) return false;
      if (f.area && r.area !== f.area) return false;
      if (f.stage && trainingStage(type, r) !== f.stage) return false;
      if (f.account && accountLabel(r.account) !== f.account) return false;
      if (f.status && r.followUp.status !== f.status) return false;
      if (f.due === "due" && !r.followUp.due) return false;
      if (f.due === "overdue" && r.followUp.due !== "overdue") return false;
      if (f.due === "none" && (r.followUp.nextDate || r.followUp.status === "done")) return false;
      return true;
    });
  }, [all, f, type]);

  const count = (s: string) => all.filter((r) => r.followUp.status === s).length;
  const overdue = all.filter((r) => r.followUp.due === "overdue").length;
  const today = all.filter((r) => r.followUp.due === "today").length;
  const set = (k: keyof Filters, v: string) => setF((x) => ({ ...x, [k]: v }));
  const filtered = Object.entries(f).some(([, v]) => v);
  const filterNote = filtered ? `Filtered: ${shown.length} of ${all.length}` : "";
  const open = all.find((r) => r._id === openId) ?? null;

  /** After a follow-up change, update the row in place (no full reload). */
  const patchRow = (id: string, fu: FollowUp) => setRows((rs) => rs && rs.map((r) => (r._id === id ? { ...r, followUp: fu } as AnyRow : r)));

  const pill = (label: string, n: number, on: boolean, click: () => void, tone = "") => (
    <button onClick={click} className={cn("flex min-w-[96px] flex-1 flex-col rounded-lg border px-3 py-2 text-left transition sm:flex-none",
      on ? "border-plum bg-plum/5" : "border-border bg-card hover:border-plum/40")}>
      <span className="text-[11px] uppercase tracking-wide text-nc-muted">{label}</span>
      <span className={cn("font-serif text-[22px] leading-tight text-nc-dark", tone)}>{n}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {pill(`All ${NOUN[type][1]}`, all.length, !filtered, () => setF(EMPTY))}
        {pill("Overdue", overdue, f.due === "overdue", () => setF({ ...EMPTY, due: f.due === "overdue" ? "" : "overdue" }), overdue ? "text-nc-red" : "")}
        {pill("Due today", today, false, () => setF({ ...EMPTY, due: "due" }), today ? "text-nc-amber" : "")}
        {pill("To contact", count("to-contact"), f.status === "to-contact", () => setF({ ...EMPTY, status: f.status === "to-contact" ? "" : "to-contact" }))}
        {pill("In progress", count("in-progress"), f.status === "in-progress", () => setF({ ...EMPTY, status: f.status === "in-progress" ? "" : "in-progress" }))}
        {pill("No response", count("no-response"), f.status === "no-response", () => setF({ ...EMPTY, status: f.status === "no-response" ? "" : "no-response" }))}
        {pill("Done", count("done"), f.status === "done", () => setF({ ...EMPTY, status: f.status === "done" ? "" : "done" }))}
      </div>

      <section className="min-w-0 rounded-lg border border-border bg-card shadow-nc">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-3 sm:px-4">
          <label className="relative min-w-[180px] flex-1 basis-[220px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-nc-muted" />
            <input value={f.q} onChange={(e) => set("q", e.target.value)} placeholder={`Search name, phone, area${type === "parent" ? ", child" : type === "host" ? ", space" : ", circle"}…`}
              className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-3 text-[13px] outline-none focus:border-plum" aria-label="Search" />
          </label>
          <Select label="Cluster" value={f.cluster} onChange={(v) => set("cluster", v)} options={[...clusters.map((c) => [c, c] as [string, string]), ["—", "No cluster"]]} />
          <Select label="Area" value={f.area} onChange={(v) => set("area", v)} options={areas.map((a) => [a, a])} />
          <Select label="Training" value={f.stage} onChange={(v) => set("stage", v)}
            options={(type === "host" ? ["not-started", "in-progress", "certified"] : ["not-enrolled", "not-started", "in-progress", "certified"]).map((s) => [s, STAGE_LABEL[s]])} />
          <Select label="Account" value={f.account} onChange={(v) => set("account", v)}
            options={["Active", "Never signed in", "Awaiting approval", "Access stopped", ...(type === "parent" ? ["No account"] : [])].map((s) => [s, s])} />
          <Select label="Follow-up" value={f.status} onChange={(v) => set("status", v)} options={FOLLOW_UP_STATUSES.map((s) => [s, FOLLOW_UP_META[s].label])} />
          <Select label="Next date" value={f.due} onChange={(v) => set("due", v)} options={[["due", "Due or overdue"], ["overdue", "Overdue"], ["none", "No date set"]]} />
          {filtered && <button className="text-[12.5px] text-plum hover:underline" onClick={() => setF(EMPTY)}>Clear</button>}
          <div className="ml-auto flex gap-2">
            <button className="btn-outline !py-1.5 text-[12.5px]" disabled={!shown.length} onClick={() => exportRegisterCsv(type, shown)}>
              <FileDown className="h-3.5 w-3.5" /> Excel
            </button>
            <button className="btn-outline !py-1.5 text-[12.5px]" disabled={!shown.length} onClick={() => printRegister(type, shown, filterNote)}>
              <Printer className="h-3.5 w-3.5" /> PDF
            </button>
          </div>
        </div>

        {!rows ? <div className="py-12 text-center text-sm text-nc-muted">Loading…</div> : shown.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-nc-muted">{all.length ? "No one matches these filters." : `No ${NOUN[type][1]} yet.`}</div>
        ) : (
          <>
            {filtered && <div className="px-4 pt-2 text-[12px] text-nc-muted">{shown.length} of {all.length}</div>}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-nc-muted">
                    <th className="px-4 py-2 font-medium">{NOUN[type][0]}</th>
                    <th className="px-3 py-2 font-medium">Account</th>
                    {type === "murabbi" && <><th className="px-3 py-2 font-medium">Circles</th><th className="px-3 py-2 font-medium">Asaas</th><th className="px-3 py-2 font-medium">Other</th><th className="px-3 py-2 font-medium">Rating</th></>}
                    {type === "parent" && <><th className="px-3 py-2 font-medium">Children</th><th className="px-3 py-2 font-medium">Profile</th><th className="px-3 py-2 font-medium">Asaas for Parents</th></>}
                    {type === "host" && <><th className="px-3 py-2 font-medium">Spaces</th><th className="px-3 py-2 font-medium">Host training</th></>}
                    <th className="px-3 py-2 font-medium">Follow-up</th>
                    <th className="px-3 py-2" aria-label="Contact" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r._id} onClick={() => setOpenId(r._id)}
                      className={cn("cursor-pointer border-b border-border/60 align-top last:border-0 hover:bg-muted/40", r.followUp.due === "overdue" && "bg-nc-red-lt/40")}>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-nc-dark">{r.fullName}</div>
                        <div className="text-[11.5px] text-nc-muted">{phoneOf(type, r) || (r as any).email}</div>
                        <div className="text-[11.5px] text-nc-muted">{[r.area, r.cluster].filter(Boolean).join(" · ") || "—"}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <AccountChip a={r.account} />
                        <div className="mt-0.5 text-[11.5px] text-nc-muted">Last in: {agoLabel(r.account.lastLoginAt)}</div>
                      </td>
                      {type === "murabbi" && <MurabbiCells r={r as MurabbiRow} />}
                      {type === "parent" && <ParentCells r={r as ParentRow} />}
                      {type === "host" && <HostCells r={r as HostRow} />}
                      <td className="px-3 py-2.5"><FollowUpCell fu={r.followUp} /></td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}><ContactButtons phone={phoneOf(type, r)} name={r.fullName} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {open && <RegisterDetail type={type} row={open} onClose={() => setOpenId(null)} onChanged={(fu) => patchRow(open._id, fu)} />}
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}
      className={cn("rounded-md border border-border bg-background px-2 py-2 text-[12.5px] outline-none focus:border-plum", value && "border-plum text-plum")}>
      <option value="">{label}: all</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function AccountChip({ a }: { a: AnyRow["account"] }) {
  const l = accountLabel(a);
  const cls = l === "Active" ? "bg-nc-green-lt text-nc-green" : l === "No account" ? "bg-muted text-nc-muted" : "bg-nc-amber-lt text-nc-amber";
  return <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium", cls)}>{l}</span>;
}

function StatusChip({ status }: { status: string }) {
  const m = FOLLOW_UP_META[status] ?? FOLLOW_UP_META.new;
  return <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium", m.cls)}>{m.label}</span>;
}

function FollowUpCell({ fu }: { fu: FollowUp }) {
  return (
    <div className="max-w-[220px]">
      <StatusChip status={fu.status} />
      {fu.nextDate && fu.status !== "done" && (
        <div className={cn("mt-0.5 flex items-center gap-1 text-[11.5px]", fu.due === "overdue" ? "font-semibold text-nc-red" : fu.due === "today" ? "font-semibold text-nc-amber" : "text-nc-muted")}>
          {fu.due === "overdue" ? <AlertTriangle className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
          {fu.due === "today" ? "Today" : dayLabel(fu.nextDate)}{fu.due === "overdue" && " · overdue"}
        </div>
      )}
      {fu.lastNote && <div className="mt-0.5 truncate text-[11.5px] text-nc-muted" title={fu.lastNote.text}>{NOTE_KIND_LABEL[fu.lastNote.kind]}: {fu.lastNote.text}</div>}
    </div>
  );
}

function ContactButtons({ phone, name }: { phone: string; name: string }) {
  const wa = waNumber(phone);
  if (!phone) return null;
  return (
    <div className="flex gap-1">
      <a href={`tel:${phone.replace(/\s/g, "")}`} className="rounded-md p-1.5 text-nc-muted hover:bg-muted hover:text-plum" aria-label={`Call ${name}`} title="Call"><Phone className="h-4 w-4" /></a>
      {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-nc-muted hover:bg-muted hover:text-nc-green" aria-label={`WhatsApp ${name}`} title="WhatsApp"><MessageCircle className="h-4 w-4" /></a>}
    </div>
  );
}

const Muted = ({ children }: { children: React.ReactNode }) => <div className="text-[11.5px] text-nc-muted">{children}</div>;

function MurabbiCells({ r }: { r: MurabbiRow }) {
  return (
    <>
      <td className="px-3 py-2.5">
        <div>{r.circles.length ? r.circles.map((c) => c.name).join(", ") : <span className="text-nc-muted">No circle</span>}</div>
        <Muted>{r.students} children · {r.sessions} sessions</Muted>
        <Muted>Last session: {r.lastSession ? agoLabel(r.lastSession) : "—"}</Muted>
      </td>
      <td className="px-3 py-2.5">
        {r.asaas ? <>
          <div className={cn(r.asaas.certificate && "text-nc-green", r.asaas.overdue && "text-nc-red")}>{ASAAS_STAGE[r.asaas.status] ?? r.asaas.status}</div>
          <Muted>{r.asaas.lessonsCompleted}/{r.asaas.lessonsTotal} lessons{r.asaas.assessment ? ` · best ${r.asaas.assessment.best}%` : ""}</Muted>
          {r.asaas.certificate && <Muted>{r.asaas.certificate}</Muted>}
        </> : <span className="text-nc-muted">Not enrolled</span>}
      </td>
      <td className="px-3 py-2.5 text-[12px]">
        <div>Intro {r.introduction ?? 0}%</div>
        <Muted>Journal {r.journal ? `${r.journal.pagesDone}/${r.journal.totalPages}` : "—"}</Muted>
        {r.otherCourses.assigned > 0 && <Muted>Courses {r.otherCourses.certified}/{r.otherCourses.assigned}</Muted>}
      </td>
      <td className="px-3 py-2.5">
        <div>{r.rating ?? <span className="text-nc-muted">—</span>}</div>
        {r.rewards.paid > 0 && <Muted>{formatPKR(r.rewards.paid)} paid</Muted>}
      </td>
    </>
  );
}

function ParentCells({ r }: { r: ParentRow }) {
  return (
    <>
      <td className="px-3 py-2.5">
        {r.children.length ? r.children.map((c) => (
          <div key={c._id}>
            {c.fullName}{c.age != null && <span className="text-nc-muted"> ({c.age})</span>}
            <span className="text-[11.5px] text-nc-muted"> · {c.circle?.name ?? "no circle"}{c.attendance?.percent != null && ` · ${c.attendance.percent}%`}</span>
          </div>
        )) : <span className="text-nc-muted">No child linked</span>}
      </td>
      <td className="px-3 py-2.5">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"><div className="h-full bg-plum" style={{ width: `${r.profile.percent}%` }} /></div>
        <Muted>{r.profile.percent}%</Muted>
      </td>
      <td className="px-3 py-2.5">
        {r.asaas ? <>
          <div className={cn(r.asaas.certificate && "text-nc-green")}>{ASAAS_STAGE[r.asaas.status] ?? r.asaas.status}</div>
          <Muted>{r.asaas.lessonsCompleted}/{r.asaas.lessonsTotal} clips · module {r.asaas.currentModule}</Muted>
        </> : <span className="text-nc-muted">Not enrolled</span>}
      </td>
    </>
  );
}

function HostCells({ r }: { r: HostRow }) {
  return (
    <>
      <td className="px-3 py-2.5">
        {r.spaces.length ? r.spaces.map((s) => (
          <div key={s._id}>{s.name} <span className="text-[11.5px] text-nc-muted">· {SPACE_STATUS_LABEL[s.status] ?? s.status}{s.circles.length > 0 && ` · ${s.circles.join(", ")}`}</span></div>
        )) : <span className="text-nc-muted">No space</span>}
      </td>
      <td className="px-3 py-2.5">
        {r.training ? <>
          <div className={cn(r.training.certificate && "text-nc-green")}>{r.training.done}/{r.training.total} modules</div>
          {r.training.certificate && <Muted>{r.training.certificate}</Muted>}
        </> : "—"}
      </td>
    </>
  );
}

// ── Detail drawer with follow-up ────────────────────────────────────────────

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-border/60 py-1.5 text-[13px] last:border-0">
      <div className="w-36 flex-shrink-0 text-nc-muted">{k}</div>
      <div className="min-w-0 flex-1 break-words text-nc-dark">{v || <span className="text-nc-muted">—</span>}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h4 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-plum">{title}</h4>
      {children}
    </section>
  );
}

function RegisterDetail({ type, row, onClose, onChanged }: { type: RegisterType; row: AnyRow; onClose: () => void; onChanged: (fu: FollowUp) => void }) {
  const { toast } = useToast();
  const [d, setD] = useState<FollowUpDetail | null>(null);
  const [kind, setKind] = useState("call");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    registerService.followUp(type, row._id).then((r) => setD(unwrap<FollowUpDetail>(r))).catch(() => setD(null));
  }, [type, row._id]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const apply = (res: any, fallback: string) => {
    const data = unwrap<FollowUpDetail>(res);
    setD(data);
    onChanged({ status: data.status, nextDate: data.nextDate, due: data.due, notes: data.notes, lastNote: data.lastNote });
    toast({ title: apiMessage(res, fallback) });
  };

  async function update(patch: { status?: string; nextDate?: string | null }) {
    setBusy(true);
    try { apply(await registerService.update(type, row._id, patch), "Follow-up updated."); }
    catch (err) { toast({ variant: "destructive", title: apiError(err, "Could not update the follow-up.") }); }
    finally { setBusy(false); }
  }
  async function addNote() {
    if (!text.trim()) return;
    setBusy(true);
    try { apply(await registerService.addNote(type, row._id, { kind, text: text.trim() }), "Note added."); setText(""); }
    catch (err) { toast({ variant: "destructive", title: apiError(err, "Could not add the note.") }); }
    finally { setBusy(false); }
  }

  const fu = d ?? row.followUp;
  const phone = phoneOf(type, row);

  return (
    <div className="fixed inset-0 z-[150] flex justify-end bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="flex h-full w-full max-w-2xl flex-col bg-card shadow-2xl" role="dialog" aria-modal="true" aria-label={row.fullName}>
        <div className="flex items-start gap-3 border-b border-border px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wide text-nc-muted">{NOUN[type][0]} register</div>
            <div className="break-words font-serif text-[22px] leading-tight text-nc-dark">{row.fullName}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2"><AccountChip a={row.account} /><StatusChip status={fu.status} /><ContactButtons phone={phone} name={row.fullName} /></div>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-nc-muted hover:bg-muted" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <Section title="Follow-up">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-[12px] text-nc-muted">Status
                <select value={fu.status} disabled={busy} onChange={(e) => update({ status: e.target.value })}
                  className="mt-1 block rounded-md border border-border bg-background px-2 py-1.5 text-[13px] text-nc-dark">
                  {FOLLOW_UP_STATUSES.map((s) => <option key={s} value={s}>{FOLLOW_UP_META[s].label}</option>)}
                </select>
              </label>
              <label className="text-[12px] text-nc-muted">Next follow-up
                <input type="date" value={fu.nextDate ?? ""} disabled={busy} onChange={(e) => update({ nextDate: e.target.value || null })}
                  className="mt-1 block rounded-md border border-border bg-background px-2 py-1.5 text-[13px] text-nc-dark" />
              </label>
              <div className="flex flex-wrap gap-1 pb-0.5">
                {[["Today", 0], ["+3 days", 3], ["+1 week", 7], ["+2 weeks", 14]].map(([l, n]) => (
                  <button key={l} disabled={busy} onClick={() => update({ nextDate: n === 0 ? pkToday() : addDays(n as number) })}
                    className="rounded-full border border-border px-2.5 py-1 text-[12px] hover:border-plum hover:text-plum">{l}</button>
                ))}
                {fu.nextDate && <button disabled={busy} onClick={() => update({ nextDate: null })} className="rounded-full px-2 py-1 text-[12px] text-nc-muted hover:text-nc-red">Clear</button>}
              </div>
            </div>
            {fu.due && <div className={cn("mt-2 text-[12.5px] font-medium", fu.due === "overdue" ? "text-nc-red" : "text-nc-amber")}>{fu.due === "overdue" ? `Overdue since ${dayLabel(fu.nextDate)}` : "Due today"}</div>}

            <div className="mt-3 rounded-lg border border-border p-3">
              <div className="mb-2 flex flex-wrap gap-1">
                {NOTE_KINDS.map(([k, l]) => (
                  <button key={k} onClick={() => setKind(k)} className={cn("rounded-full border px-2.5 py-0.5 text-[12px]", kind === k ? "border-plum bg-plum text-white" : "border-border text-nc-muted hover:border-plum")}>{l}</button>
                ))}
              </div>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={2000} placeholder="What was discussed, what was agreed, what's next…"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-plum" aria-label="Note" />
              <div className="mt-2 flex justify-end"><button className="btn-primary !py-1.5 text-[12.5px]" disabled={busy || !text.trim()} onClick={addNote}>Add note</button></div>
            </div>

            <ul className="mt-3 space-y-2">
              {!d ? <li className="text-[12.5px] text-nc-muted">Loading notes…</li> : d.log.length === 0 ? <li className="text-[12.5px] text-nc-muted">No notes yet.</li> : d.log.map((n) => (
                <li key={n._id} className="rounded-md bg-muted/50 px-3 py-2">
                  <div className="text-[11.5px] text-nc-muted"><b className="text-plum">{NOTE_KIND_LABEL[n.kind] ?? n.kind}</b> · {shortDate(n.at)} {new Date(n.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · {n.byName}</div>
                  <div className="whitespace-pre-wrap text-[13px] text-nc-dark" dir="auto">{n.text}</div>
                </li>
              ))}
            </ul>
          </Section>

          {type === "murabbi" && <MurabbiDetail r={row as MurabbiRow} />}
          {type === "parent" && <ParentDetail r={row as ParentRow} />}
          {type === "host" && <HostDetail r={row as HostRow} />}
        </div>
      </aside>
    </div>
  );
}

function ContactSection({ r, extra }: { r: AnyRow; extra?: React.ReactNode }) {
  const a = r.account;
  return (
    <>
      <Section title="Contact">
        <Row k="Phone" v={(r as any).phone} />
        {"whatsapp" in r && r.whatsapp !== r.phone && <Row k="WhatsApp" v={r.whatsapp} />}
        <Row k="Email" v={(r as any).email} />
        {"address" in r && r.address && r.address !== [r.area, r.city].filter(Boolean).join(", ") && <Row k="Address" v={r.address} />}
        <Row k="Area" v={[r.area, r.city].filter(Boolean).join(", ")} />
        <Row k="Cluster" v={r.cluster} />
        {extra}
      </Section>
      <Section title="Account">
        <Row k="Status" v={accountLabel(a)} />
        <Row k="Created" v={shortDate(a.createdAt)} />
        <Row k="Last sign-in" v={a.exists ? agoLabel(a.lastLoginAt) : ""} />
        {a.mustChangePassword && <Row k="Password" v="Still on the temporary password" />}
      </Section>
    </>
  );
}

function MurabbiDetail({ r }: { r: MurabbiRow }) {
  return (
    <>
      <ContactSection r={r} extra={<>
        <Row k="Background" v={r.background} />
        <Row k="Showed interest" v={shortDate(r.interestAt)} />
      </>} />
      <Section title="Circles">
        {r.circles.length ? r.circles.map((c) => <Row key={c._id} k={c.name} v={`${c.students} children${c.active ? "" : " · inactive"}`} />) : <Row k="Circles" v="No circle yet" />}
        <Row k="Sessions recorded" v={String(r.sessions)} />
        <Row k="Last session" v={r.lastSession ? `${shortDate(r.lastSession)} (${agoLabel(r.lastSession)})` : ""} />
      </Section>
      <Section title="Training">
        {r.asaas ? <>
          <Row k="Asaas stage" v={ASAAS_STAGE[r.asaas.status] ?? r.asaas.status} />
          <Row k="Lessons" v={`${r.asaas.lessonsCompleted} of ${r.asaas.lessonsTotal} (${r.asaas.percentHeard}% heard)`} />
          <Row k="Last listened" v={r.asaas.lastActive ? agoLabel(r.asaas.lastActive) : ""} />
          <Row k="Due date" v={r.asaas.dueDate ? `${dayLabel(r.asaas.dueDate)}${r.asaas.overdue ? " · overdue" : ""}` : ""} />
          <Row k="Assessment" v={r.asaas.assessment ? `Best ${r.asaas.assessment.best}% in ${r.asaas.assessment.attempts} ${r.asaas.assessment.attempts === 1 ? "try" : "tries"}${r.asaas.assessment.passed ? " · passed" : ""}` : "Not taken"} />
          <Row k="Reflection" v={r.asaas.reflection ?? "Not written"} />
          <Row k="Certificate" v={r.asaas.certificate} />
        </> : <Row k="Asaas" v="Not enrolled" />}
        {r.certificates.length > 0 && <Row k="Tier certificates" v={r.certificates.map((c) => `Tier ${c.tier}: ${c.number}`).join(", ")} />}
        <Row k="Other courses" v={r.otherCourses.assigned ? `${r.otherCourses.certified} of ${r.otherCourses.assigned} certified` : "None"} />
        <Row k="Introduction" v={r.introduction != null ? `${r.introduction}% complete` : "Not started"} />
        <Row k="Noor Journal" v={r.journal ? `${r.journal.pagesDone} of ${r.journal.totalPages} pages · ${r.journal.moments} moments` : ""} />
      </Section>
      <Section title="Rating and rewards">
        <Row k="This month" v={r.rating != null ? String(r.rating) : ""} />
        <Row k="Last rated" v={r.lastRating ? `${r.lastRating.score} (${r.lastRating.month})` : ""} />
        <Row k="Rewards paid" v={formatPKR(r.rewards.paid)} />
        {r.rewards.approved > 0 && <Row k="Approved, unpaid" v={formatPKR(r.rewards.approved)} />}
      </Section>
    </>
  );
}

function ParentDetail({ r }: { r: ParentRow }) {
  return (
    <>
      <ContactSection r={r} extra={<>
        <Row k="Added" v={shortDate(r.addedAt)} />
        <Row k="Engaged" v={r.engaged ? "Yes" : "No"} />
        {r.notes && <Row k="Notes" v={r.notes} />}
      </>} />
      <Section title="Children">
        {r.children.length ? r.children.map((c) => (
          <Row key={c._id} k={`${c.fullName}${c.age != null ? ` (${c.age})` : ""}`}
            v={<>{c.circle?.name ?? "No circle"}{c.murabbi && ` · ${c.murabbi}`}
              <div className="text-[12px] text-nc-muted">{c.attendance ? `Attendance ${c.attendance.percent ?? 0}% (${c.attendance.present}/${c.attendance.total}) · last ${shortDate(c.attendance.last)}` : "No attendance yet"}{!c.active && " · inactive"}</div></>} />
        )) : <Row k="Children" v="No child linked" />}
      </Section>
      <Section title="Family profile">
        <Row k="Answered" v={`${r.profile.answered} of ${r.profile.total} (${r.profile.percent}%)`} />
        <Row k="Updated" v={shortDate(r.profile.updatedAt)} />
      </Section>
      <Section title="Asaas for Parents">
        {r.asaas ? <>
          <Row k="Stage" v={ASAAS_STAGE[r.asaas.status] ?? r.asaas.status} />
          <Row k="Clips heard" v={`${r.asaas.lessonsCompleted} of ${r.asaas.lessonsTotal} · module ${r.asaas.currentModule}`} />
          <Row k="Checks passed" v={`${r.asaas.quizzesPassed}${r.asaas.finalPassed ? " · final passed" : ""}`} />
          <Row k="Last listened" v={r.asaas.lastActive ? agoLabel(r.asaas.lastActive) : ""} />
          <Row k="Certificate" v={r.asaas.certificate} />
        </> : <Row k="Asaas" v="Not enrolled" />}
      </Section>
      <Section title="Rating and rewards">
        <Row k="This month" v={r.rating != null ? String(r.rating) : ""} />
        <Row k="Rewards paid" v={formatPKR(r.rewards.paid)} />
      </Section>
    </>
  );
}

function HostDetail({ r }: { r: HostRow }) {
  return (
    <>
      <ContactSection r={r} extra={<Row k="Showed interest" v={shortDate(r.interestAt)} />} />
      <Section title="Spaces">
        {r.spaces.length ? r.spaces.map((s) => (
          <Row key={s._id} k={s.name} v={<>{SPACE_STATUS_LABEL[s.status] ?? s.status} · up to {s.capacity}<div className="text-[12px] text-nc-muted">{s.circles.length ? `Circles: ${s.circles.join(", ")}` : "No circle placed"}</div></>} />
        )) : <Row k="Spaces" v="No space yet" />}
      </Section>
      <Section title="Asaas for Hosts">
        <Row k="Modules passed" v={r.training ? `${r.training.done} of ${r.training.total}` : ""} />
        <Row k="Certificate" v={r.training?.certificate} />
      </Section>
    </>
  );
}
