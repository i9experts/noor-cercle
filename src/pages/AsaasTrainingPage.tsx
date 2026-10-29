import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2, Headphones, Pencil, Plus, Search, Trash2, Upload, UserPlus, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { courseService, murabbisService } from "@/services/api.service";
import StatCard from "@/components/shared/StatCard";
import NcCard from "@/components/shared/NcCard";
import Modal, { FormGroup, FormInput, FormTextarea } from "@/components/shared/Modal";
import CertifiedBadge from "@/components/course/CertifiedBadge";
import { cn } from "@/lib/utils";
import { apiError, apiMessage, downloadCsv, formatDate, unwrap } from "@/lib/finance";
import { ASAAS_KEY, BAND_META, STATUS_META, clock, hasUrdu, minutesLabel, practicalBand, titleProps } from "@/lib/course";

type Tab = "progress" | "reflections" | "content" | "questions" | "settings";
const TABS: { key: Tab; label: string }[] = [
  { key: "progress",    label: "Murabbis & progress" },
  { key: "reflections", label: "Reflections" },
  { key: "content",     label: "Lessons & audio" },
  { key: "questions",   label: "Assessment" },
  { key: "settings",    label: "Settings" },
];

export default function AsaasTrainingPage() {
  const { toast } = useToast();
  const [tab, setTab]           = useState<Tab>("progress");
  const [outline, setOutline]   = useState<any>(null);
  const [report, setReport]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  async function load() {
    try {
      const [o, r] = await Promise.all([courseService.outline(ASAAS_KEY), courseService.progress(ASAAS_KEY)]);
      setOutline(unwrap(o));
      setReport(unwrap(r));
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not load the training.") });
    } finally {
      setLoading(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const s = report?.stats;
  const st = outline?.stats;

  return (
    <div className="page-animate">
      <div className="mb-6">
        <h2 className="font-serif text-[26px] text-nc-dark">Asaas Training</h2>
        <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
          The Asaas Murabbi audio course{outline?.course.trainer ? ` by ${outline.course.trainer}` : ""}. Assign it to murabbis,
          follow their listening, review reflections and enter practical scores. Completing everything issues the Tier 1
          certificate and the <span className="font-semibold text-nc-dark">{outline?.course.badge ?? "Certified Asaas Murabbi"}</span> badge.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:gap-4">
        <StatCard label="Assigned" value={s?.assigned ?? "—"} meta={s ? `${s.notStarted} not started` : "Murabbis"} color="purple" />
        <StatCard label="Listening" value={s?.inProgress ?? "—"} meta={s?.overdue ? `${s.overdue} overdue` : "In progress"} color="teal" />
        <StatCard label="Lessons done" value={s?.listened ?? "—"} meta="Assessment / reflection next" color="gold" />
        <StatCard label="Certified" value={s?.certified ?? "—"} meta="Badge earned" color="green" />
        <StatCard label="Reflections" value={s?.reflectionsToReview ?? "—"} meta="Waiting for review" color="red" />
      </div>

      {st && st.withAudio < st.lessons && (
        <div className="mb-4 rounded-md border border-nc-amber/30 bg-nc-amber-lt px-4 py-2.5 text-[12.5px] text-nc-dark">
          {st.lessons - st.withAudio} of {st.lessons} lessons don’t have audio yet.{" "}
          <button className="font-semibold underline" onClick={() => setTab("content")}>Upload the MP3 files</button>
        </div>
      )}

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={cn("-mb-px whitespace-nowrap border-b-2 px-3.5 py-2 text-[13px] font-medium transition-colors",
              tab === t.key ? "border-teal text-teal" : "border-transparent text-nc-muted hover:text-nc-dark")}>
            {t.label}
            {t.key === "reflections" && s?.reflectionsToReview ? (
              <span className="ml-1.5 rounded-full bg-nc-red px-1.5 text-[10.5px] font-semibold text-white">{s.reflectionsToReview}</span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <NcCard><div className="py-16 text-center text-sm text-nc-muted">Loading…</div></NcCard>
      ) : !outline ? null : tab === "progress" ? (
        <ProgressTab report={report} outline={outline} onChanged={load} />
      ) : tab === "reflections" ? (
        <ReflectionsTab onChanged={load} />
      ) : tab === "content" ? (
        <ContentTab outline={outline} onChanged={load} />
      ) : tab === "questions" ? (
        <QuestionsTab outline={outline} onChanged={load} />
      ) : (
        <SettingsTab outline={outline} onChanged={load} />
      )}
    </div>
  );
}

// ── Progress ────────────────────────────────────────────────────────────────

function ProgressTab({ report, outline, onChanged }: { report: any; outline: any; onChanged: () => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const rows: any[] = (report?.rows ?? [])
    .filter((r: any) => !status || r.status === status || (status === "overdue" && r.overdue))
    .filter((r: any) => {
      const q = search.trim().toLowerCase();
      return !q || [r.user.fullName, r.user.email].some((v) => v?.toLowerCase().includes(q));
    });

  function exportCsv() {
    downloadCsv("asaas-training-progress.csv", [
      ["Murabbi", "Email", "Status", "Lessons heard", "Lessons total", "% heard", "Minutes listened", "Last active", "Due", "Best score", "Attempts", "Reflection", "Practical", "Certificate"],
      ...rows.map((r) => [
        r.user.fullName, r.user.email, STATUS_META[r.status]?.label ?? r.status, r.lessonsCompleted, r.lessonsTotal, r.percentHeard,
        r.listenMinutes, r.lastActive ? formatDate(r.lastActive) : "", r.dueDate ?? "", r.assessment?.best ?? "", r.assessment?.attempts ?? 0,
        r.reflection ?? "", r.practical ? `${r.practical.total}/18` : "", r.certificate?.number ?? "",
      ]),
    ]);
  }

  return (
    <NcCard className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-nc-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email…" aria-label="Search murabbis"
            className="h-9 w-52 rounded-md border border-input bg-card pl-8 pr-3 text-[13px] focus:border-primary focus:outline-none" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"
          className="h-9 rounded-md border border-input bg-card px-2.5 text-[13px] focus:border-primary focus:outline-none">
          <option value="">All statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          <option value="overdue">Overdue</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button className="btn-outline !py-2 text-[12.5px]" onClick={exportCsv} disabled={!rows.length}>Export CSV</button>
          <button className="btn-primary flex items-center gap-1.5 !py-2 text-[12.5px]" onClick={() => setAssignOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Assign murabbis
          </button>
        </div>
      </div>

      {!report?.rows.length ? (
        <div className="py-14 text-center">
          <Headphones className="mx-auto mb-3 h-9 w-9 text-pale" strokeWidth={1.5} />
          <div className="text-sm font-medium text-nc-dark">No one has been assigned the training yet</div>
          <div className="mt-1 text-[12.5px] text-nc-muted">Assign murabbis and they’ll see it under Training when they sign in.</div>
        </div>
      ) : rows.length === 0 ? (
        <div className="py-14 text-center text-[13px] text-nc-muted">No murabbis match.</div>
      ) : (
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[880px] text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-nc-muted">
                <th className="px-3 py-2 font-medium">Murabbi</th>
                <th className="px-3 py-2 font-medium">Listening</th>
                <th className="px-3 py-2 font-medium">Assessment</th>
                <th className="px-3 py-2 font-medium">Reflection</th>
                {outline.course.requirePractical && <th className="px-3 py-2 font-medium">Practical</th>}
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pct = r.lessonsTotal ? Math.round((r.lessonsCompleted / r.lessonsTotal) * 100) : 0;
                return (
                  <tr key={r.user._id} className="cursor-pointer border-b border-border/60 hover:bg-muted/50" onClick={() => setDetailId(r.user._id)}>
                    <td className="px-3 py-3">
                      <div className="font-medium text-nc-dark">{r.user.fullName}</div>
                      <div className="text-[11.5px] text-nc-muted">{r.lastActive ? `Last listened ${formatDate(r.lastActive)}` : "Hasn’t started"}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="h-2 w-36 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-plum" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-1 text-[11.5px] text-nc-muted">{r.lessonsCompleted}/{r.lessonsTotal} lessons · {minutesLabel(r.listenMinutes)}</div>
                    </td>
                    <td className="px-3 py-3 text-nc-dark">
                      {r.assessment ? (
                        <>{r.assessment.best}% <span className="text-[11.5px] text-nc-muted">{r.assessment.passed ? "passed" : `${r.assessment.attempts} tries`}</span></>
                      ) : <span className="text-nc-muted">—</span>}
                    </td>
                    <td className="px-3 py-3"><ReflectionChip status={r.reflection} /></td>
                    {outline.course.requirePractical && (
                      <td className="px-3 py-3">
                        {r.practical ? (
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", BAND_META[r.practical.band]?.cls)}>{r.practical.total}/18</span>
                        ) : <span className="text-nc-muted">—</span>}
                      </td>
                    )}
                    <td className="px-3 py-3">
                      {r.status === "certified" ? <CertifiedBadge label="Certified" /> : (
                        <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_META[r.status]?.cls)}>
                          {STATUS_META[r.status]?.label}
                        </span>
                      )}
                    </td>
                    <td className={cn("whitespace-nowrap px-3 py-3", r.overdue ? "font-semibold text-nc-red" : "text-nc-dark")}>
                      {r.dueDate ? formatDate(r.dueDate) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AssignModal open={assignOpen} assigned={new Set((report?.rows ?? []).map((r: any) => r.user._id))}
        onClose={() => setAssignOpen(false)} onDone={() => { setAssignOpen(false); onChanged(); }} />
      {detailId && (
        <DetailModal userId={detailId} requirePractical={outline.course.requirePractical}
          onClose={() => setDetailId(null)} onChanged={onChanged} />
      )}
    </NcCard>
  );
}

function ReflectionChip({ status }: { status: string | null }) {
  if (!status) return <span className="text-nc-muted">—</span>;
  const meta: Record<string, [string, string]> = {
    submitted: ["To review", "bg-teal-lt text-teal"],
    approved : ["Approved", "bg-nc-green-lt text-nc-green"],
    revision : ["Revising", "bg-nc-amber-lt text-nc-amber"],
  };
  const [label, cls] = meta[status] ?? [status, "bg-muted text-nc-muted"];
  return <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", cls)}>{label}</span>;
}

function AssignModal({ open, assigned, onClose, onDone }: { open: boolean; assigned: Set<string>; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [murabbis, setMurabbis] = useState<any[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPicked(new Set());
    murabbisService.getAll()
      .then((r) => setMurabbis((unwrap<any[]>(r) || []).filter((m) => m.isActive !== false)))
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load murabbis.") }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const list = murabbis.filter((m) => {
    const q = search.trim().toLowerCase();
    return !q || [m.fullName, m.email].some((v) => v?.toLowerCase().includes(q));
  });
  const unassigned = list.filter((m) => !assigned.has(m._id));

  const toggle = (id: string) => setPicked((p) => {
    const n = new Set(p);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  async function save() {
    setSaving(true);
    try {
      const r = await courseService.assign(ASAAS_KEY, { userIds: [...picked], dueDate: dueDate || undefined, note: note.trim() || undefined });
      toast({ title: apiMessage(r, "Training assigned.") });
      onDone();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not assign the training.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Assign the Asaas training" subtitle="Each murabbi gets a notification and finds the course under Training.">
      <div className="mb-2 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-nc-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search murabbis…" aria-label="Search murabbis"
            className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-[13px] focus:border-primary focus:outline-none" />
        </div>
        <button className="btn-outline !py-1.5 text-[12px]" onClick={() => setPicked(new Set(unassigned.map((m) => m._id)))} disabled={!unassigned.length}>
          Select all new
        </button>
      </div>
      <div className="mb-4 max-h-[260px] divide-y divide-border overflow-y-auto rounded-md border border-border">
        {list.length === 0 ? (
          <div className="py-8 text-center text-[12.5px] text-nc-muted">No murabbis found.</div>
        ) : list.map((m) => (
          <label key={m._id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/40">
            <input type="checkbox" checked={picked.has(m._id)} onChange={() => toggle(m._id)} className="accent-[hsl(var(--teal))]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-nc-dark">{m.fullName}</span>
              <span className="block truncate text-[11.5px] text-nc-muted">{m.email}</span>
            </span>
            {assigned.has(m._id) && <span className="text-[11px] text-nc-muted">Assigned</span>}
          </label>
        ))}
      </div>
      <FormGroup label="Complete by (optional)">
        <FormInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </FormGroup>
      <FormGroup label="Note to murabbis (optional)">
        <FormTextarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="e.g. Please finish before the new term starts." />
      </FormGroup>
      <p className="mb-4 text-[11.5px] text-nc-muted">Choosing someone who already has the training updates their due date and note.</p>
      <button className="btn-primary w-full" disabled={saving || !picked.size} onClick={save}>
        {saving ? "Assigning…" : `Assign to ${picked.size || ""} murabbi${picked.size === 1 ? "" : "s"}`}
      </button>
    </Modal>
  );
}

function DetailModal({ userId, requirePractical, onClose, onChanged }: { userId: string; requirePractical: boolean; onClose: () => void; onChanged: () => void }) {
  const { toast } = useToast();
  const [d, setD] = useState<any>(null);
  const [scores, setScores] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const r = unwrap(await courseService.userDetail(ASAAS_KEY, userId));
      setD(r);
      if (r.practical) { setScores(r.practical.scores); setNotes(r.practical.notes ?? ""); }
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not load this murabbi’s progress.") });
      onClose();
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [userId]);

  async function savePractical() {
    setSaving(true);
    try {
      const r = await courseService.practical(ASAAS_KEY, userId, { scores, notes: notes.trim() || undefined });
      const data = unwrap(r);
      toast({ title: apiMessage(r, "Practical score saved."), description: data?.certificate ? `Certified: ${data.certificate.number}` : undefined });
      await load();
      onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save the score.") });
    } finally {
      setSaving(false);
    }
  }

  async function unassign() {
    if (!window.confirm(`Remove the training from ${d.user.fullName}? Their listening history is kept.`)) return;
    try {
      const r = await courseService.unassign(ASAAS_KEY, userId);
      toast({ title: apiMessage(r, "Training unassigned.") });
      onChanged();
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not unassign.") });
    }
  }

  const total = scores.reduce((a, b) => a + b, 0);
  const complete = scores.every((x) => x >= 1);

  return (
    <Modal open onClose={onClose} title={d?.user.fullName ?? "Loading…"} subtitle={d?.user.email}>
      {!d ? <div className="py-10 text-center text-sm text-nc-muted">Loading…</div> : (
        <div className="space-y-6">
          <section>
            <div className="mb-2 text-[13px] font-semibold text-nc-dark">Listening by module</div>
            <div className="space-y-3">
              {d.sections.map((s: any) => {
                const done = s.lessons.filter((l: any) => l.completed).length;
                return (
                  <div key={s._id}>
                    <div className="mb-1 flex items-center justify-between text-[12px]">
                      <span className="truncate text-nc-dark">{s.title}</span>
                      <span className="flex-shrink-0 text-nc-muted">{done}/{s.lessons.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {s.lessons.map((l: any) => (
                        <span key={l._id}
                          title={`${l.code} · ${l.title}: ${l.completed ? "completed" : `${l.percent}% heard`}${l.lastActive ? ` · ${formatDate(l.lastActive)}` : ""}`}
                          className={cn("h-3.5 w-3.5 rounded-sm", l.completed ? "bg-nc-green" : l.percent > 0 ? "bg-teal/40" : "bg-muted")} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-nc-muted">Each square is a lesson: green heard, light started. Hover for details.</p>
          </section>

          <section>
            <div className="mb-1 text-[13px] font-semibold text-nc-dark">Assessment attempts</div>
            {d.attempts.length === 0 ? <div className="text-[12.5px] text-nc-muted">No attempts yet.</div> : (
              <ul className="space-y-1 text-[12.5px]">
                {d.attempts.map((a: any) => (
                  <li key={a._id} className="flex justify-between">
                    <span className="text-nc-muted">{new Date(a.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                    <span className={a.passed ? "font-semibold text-nc-green" : "text-nc-dark"}>{a.scorePercent}% ({a.correct}/{a.total}){a.passed ? " · passed" : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-nc-dark">Reflection <ReflectionChip status={d.reflection?.status ?? null} /></div>
            {d.reflection ? (
              <>
                <p dir="auto" className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md border border-border px-3 py-2 text-[13px] leading-relaxed text-nc-dark">{d.reflection.text}</p>
                {d.reflection.status === "submitted" && <ReviewActions id={d.reflection._id} onDone={() => { load(); onChanged(); }} />}
                {d.reflection.feedback && <p className="mt-2 text-[12px] text-nc-muted">Feedback sent: {d.reflection.feedback}</p>}
              </>
            ) : <div className="text-[12.5px] text-nc-muted">Not submitted yet.</div>}
          </section>

          <section>
            <div className="mb-1 text-[13px] font-semibold text-nc-dark">
              Practical score {requirePractical ? "(required for the certificate)" : "(optional)"}
            </div>
            <p className="mb-2 text-[11.5px] text-nc-muted">After observing a circle: 1 needs work, 2 developing, 3 strong. 12+ pass, 8–11 conditional pass, under 8 one more practice session.</p>
            <div className="space-y-1.5">
              {d.criteria.map((c: string, i: number) => (
                <div key={c} className="flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="text-nc-dark">{c}</span>
                  <div className="flex flex-shrink-0 gap-1" role="radiogroup" aria-label={c}>
                    {[1, 2, 3].map((v) => (
                      <button key={v} role="radio" aria-checked={scores[i] === v}
                        onClick={() => setScores((s) => s.map((x, k) => (k === i ? v : x)))}
                        className={cn("h-7 w-7 rounded-md border text-[12px] font-semibold",
                          scores[i] === v ? "border-teal bg-teal text-white" : "border-border hover:bg-muted")}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <FormTextarea className="mt-3" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} placeholder="Notes for the murabbi (optional)" />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[12.5px] text-nc-muted">
                {complete ? <>Total <span className="font-semibold text-nc-dark">{total}/18</span> · {BAND_META[practicalBand(total)].label}</> : "Score all six skills"}
              </span>
              <button className="btn-primary !py-2 text-[12.5px]" disabled={!complete || saving} onClick={savePractical}>
                {saving ? "Saving…" : "Save score"}
              </button>
            </div>
          </section>

          <div className="border-t border-border pt-4">
            <button className="flex items-center gap-1.5 text-[12.5px] font-medium text-nc-red hover:underline" onClick={unassign}>
              <Trash2 className="h-3.5 w-3.5" /> Unassign the training
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ReviewActions({ id, onDone }: { id: string; onDone: () => void }) {
  const { toast } = useToast();
  const [feedback, setFeedback] = useState("");
  const [revising, setRevising] = useState(false);
  const [saving, setSaving] = useState(false);

  async function send(status: "approved" | "revision") {
    setSaving(true);
    try {
      const r = await courseService.review(id, { status, feedback: feedback.trim() || undefined });
      const data = unwrap(r);
      toast({ title: apiMessage(r, "Saved."), description: data?.certificate ? `Certificate issued: ${data.certificate.number}` : undefined });
      onDone();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save the review.") });
    } finally {
      setSaving(false);
    }
  }

  return revising ? (
    <div className="mt-2">
      <FormTextarea value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={2000} placeholder="What should they add or change?" />
      <div className="mt-2 flex gap-2">
        <button className="btn-primary !py-1.5 text-[12px]" disabled={saving || !feedback.trim()} onClick={() => send("revision")}>Send back</button>
        <button className="btn-outline !py-1.5 text-[12px]" onClick={() => setRevising(false)}>Cancel</button>
      </div>
    </div>
  ) : (
    <div className="mt-2 flex gap-2">
      <button className="btn-primary flex items-center gap-1.5 !py-1.5 text-[12px]" disabled={saving} onClick={() => send("approved")}>
        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
      </button>
      <button className="btn-outline !py-1.5 text-[12px]" onClick={() => setRevising(true)}>Ask for a revision</button>
    </div>
  );
}

// ── Reflections queue ───────────────────────────────────────────────────────

function ReflectionsTab({ onChanged }: { onChanged: () => void }) {
  const { toast } = useToast();
  const [status, setStatus] = useState("submitted");
  const [items, setItems] = useState<any[] | null>(null);

  async function load() {
    try {
      setItems(unwrap(await courseService.reflections(ASAAS_KEY, status || undefined)) || []);
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not load reflections.") });
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setItems(null); load(); }, [status]);

  return (
    <NcCard className="p-4 sm:p-6">
      <div className="mb-4 flex gap-2">
        {[["submitted", "To review"], ["revision", "Sent back"], ["approved", "Approved"], ["", "All"]].map(([k, label]) => (
          <button key={k} onClick={() => setStatus(k)}
            className={cn("rounded-full px-3 py-1 text-[12.5px] font-medium", status === k ? "bg-teal text-white" : "bg-muted text-nc-dark hover:bg-teal-lt")}>
            {label}
          </button>
        ))}
      </div>
      {!items ? <div className="py-12 text-center text-sm text-nc-muted">Loading…</div>
        : items.length === 0 ? <div className="py-12 text-center text-[13px] text-nc-muted">Nothing here.</div>
        : (
          <div className="space-y-4">
            {items.map((r) => (
              <div key={r._id} className="rounded-lg border border-border p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[13.5px] font-semibold text-nc-dark">{r.user?.fullName ?? "Murabbi"}</span>
                    <span className="ml-2 text-[11.5px] text-nc-muted">{formatDate(r.submittedAt)}</span>
                  </div>
                  <ReflectionChip status={r.status} />
                </div>
                <p dir="auto" className="whitespace-pre-wrap text-[13px] leading-relaxed text-nc-dark">{r.text}</p>
                {r.feedback && <p className="mt-2 text-[12px] text-nc-muted">Feedback: {r.feedback}{r.reviewedBy ? ` (${r.reviewedBy.fullName})` : ""}</p>}
                {r.status === "submitted" && <ReviewActions id={r._id} onDone={() => { load(); onChanged(); }} />}
              </div>
            ))}
          </div>
        )}
    </NcCard>
  );
}

// ── Lessons and audio ───────────────────────────────────────────────────────

function ContentTab({ outline, onChanged }: { outline: any; onChanged: () => void }) {
  const { toast } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);
  const [preview, setPreview] = useState<{ id: string; url: string } | null>(null);
  const st = outline.stats;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files];
    // Upload in batches so one slow connection doesn't time out the whole set.
    const batches: File[][] = [];
    let cur: File[] = [];
    let size = 0;
    for (const f of list) {
      if (cur.length && (size + f.size > 40 * 1024 * 1024 || cur.length >= 30)) { batches.push(cur); cur = []; size = 0; }
      cur.push(f);
      size += f.size;
    }
    if (cur.length) batches.push(cur);

    const summary = { matched: [] as string[], unmatched: [] as string[], rejected: [] as any[], missing: [] as string[] };
    setUploading(0);
    try {
      for (let i = 0; i < batches.length; i++) {
        const r = unwrap(await courseService.uploadAudio(ASAAS_KEY, batches[i], (p) => setUploading(Math.round(((i + p / 100) / batches.length) * 100))));
        summary.matched.push(...r.matched);
        summary.unmatched.push(...r.unmatched);
        summary.rejected.push(...r.rejected);
        summary.missing = r.missing;
      }
      setResult(summary);
      toast({ title: `${summary.matched.length} audio file${summary.matched.length === 1 ? "" : "s"} uploaded.` });
    } catch (err) {
      setResult(summary.matched.length ? summary : null);
      toast({ variant: "destructive", title: apiError(err, "Upload failed. Files already sent are saved; try the rest again.") });
    } finally {
      setUploading(null);
      if (input.current) input.current.value = "";
      onChanged();
    }
  }

  async function play(lessonId: string) {
    if (preview?.id === lessonId) { setPreview(null); return; }
    try {
      setPreview({ id: lessonId, url: unwrap(await courseService.play(lessonId)).audioUrl });
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not play this lesson.") });
    }
  }

  return (
    <div className="space-y-6">
      <NcCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[14px] font-semibold text-nc-dark">Lesson audio</div>
            <div className="text-[12.5px] text-nc-muted">
              {st.withAudio} of {st.lessons} lessons have audio · {minutesLabel(st.totalMinutes)} in total.
              Select all the MP3 files at once; each is matched to its lesson by name (e.g. <span className="font-mono">m4-01.mp3</span>).
              Uploading a file again replaces that lesson’s audio.
            </div>
          </div>
          <input ref={input} type="file" accept=".mp3,audio/mpeg" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
          <button className="btn-primary flex items-center gap-1.5 !py-2 text-[12.5px]" disabled={uploading != null} onClick={() => input.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> {uploading != null ? `Uploading… ${uploading}%` : "Upload MP3 files"}
          </button>
        </div>
        {uploading != null && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-teal transition-all" style={{ width: `${uploading}%` }} /></div>
        )}
        {result && (
          <div className="mt-4 space-y-1 rounded-md bg-muted px-4 py-3 text-[12.5px] text-nc-dark">
            <div><span className="font-semibold">{result.matched.length}</span> uploaded.</div>
            {result.unmatched.length > 0 && <div>Not matched to a lesson: {result.unmatched.join(", ")}</div>}
            {result.rejected.length > 0 && <div>Rejected: {result.rejected.map((r: any) => `${r.file} (${r.reason})`).join(", ")}</div>}
            {result.missing.length > 0 && <div>Still without audio: {result.missing.join(", ")}</div>}
          </div>
        )}
      </NcCard>

      {outline.sections.map((s: any) => (
        <NcCard key={s._id} className="!p-0">
          <div className="border-b border-border px-5 py-3">
            <div className="text-[13.5px] font-semibold text-nc-dark">{s.title}</div>
            {s.titleUr && <div dir="rtl" className="urdu text-right text-[14px] text-nc-muted">{s.titleUr}</div>}
          </div>
          <ul className="divide-y divide-border/70">
            {s.lessons.map((l: any) => (
              <li key={l._id} className="px-5 py-2.5">
                <div className="flex items-center gap-3 text-[12.5px]">
                  <span className="w-14 flex-shrink-0 font-mono text-[11.5px] text-nc-muted">{l.code}</span>
                  <span {...titleProps(l.title)} className="min-w-0 flex-1 truncate text-start text-nc-dark" title={l.trainerNotes || undefined}>{l.title}</span>
                  <span className="flex-shrink-0 text-nc-muted">{clock(l.durationSec)}</span>
                  {l.hasAudio ? (
                    <button className="flex-shrink-0 text-[12px] font-medium text-teal hover:underline" onClick={() => play(l._id)}>
                      {preview?.id === l._id ? "Close" : "Play"}
                    </button>
                  ) : <span className="flex-shrink-0 rounded-full bg-nc-amber-lt px-2 py-0.5 text-[11px] font-semibold text-nc-amber">No audio</span>}
                </div>
                {preview?.id === l._id && <audio src={preview.url} controls autoPlay className="mt-2 w-full" />}
              </li>
            ))}
          </ul>
        </NcCard>
      ))}
    </div>
  );
}

// ── Assessment questions ────────────────────────────────────────────────────

const emptyQuestion = () => ({ question: "", questionEn: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", module: "", sourceLesson: "" });

function QuestionsTab({ outline, onChanged }: { outline: any; onChanged: () => void }) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<any[]>(() => outline.course.questions.map((q: any) => ({ ...q })));
  const [editing, setEditing] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const byModule = useMemo(() => {
    const m = new Map<string, number>();
    questions.forEach((q) => m.set(q.module || "Other", (m.get(q.module || "Other") ?? 0) + 1));
    return [...m.entries()];
  }, [questions]);

  function update(i: number, q: any) {
    setQuestions((qs) => (i === qs.length ? [...qs, q] : qs.map((x, k) => (k === i ? q : x))));
    setDirty(true);
    setEditing(null);
  }

  function remove(i: number) {
    if (!window.confirm("Delete this question?")) return;
    setQuestions((qs) => qs.filter((_, k) => k !== i));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      const clean = questions.map(({ _id, ...q }) => ({ ...q, options: q.options.map((o: string) => o.trim()) }));
      const r = await courseService.questions(ASAAS_KEY, clean);
      toast({ title: apiMessage(r, "Questions saved.") });
      setDirty(false);
      onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save the questions.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <NcCard className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[12.5px] text-nc-muted">
          {questions.length} questions · pass mark {outline.course.passingScore}% · {byModule.map(([m, n]) => `${m.replace(/:.*/, "")} ${n}`).join(" · ")}
          <div className="mt-0.5">Murabbis see the questions and options only; the correct answers and explanations appear after they pass.</div>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline flex items-center gap-1.5 !py-2 text-[12.5px]" onClick={() => setEditing(questions.length)}>
            <Plus className="h-3.5 w-3.5" /> Add question
          </button>
          <button className="btn-primary !py-2 text-[12.5px]" disabled={!dirty || saving} onClick={save}>{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
      <ol className="space-y-3">
        {questions.map((q, i) => (
          <li key={i} className="rounded-lg border border-border p-4">
            <div className="mb-1 flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-nc-muted">
              <span>Q{i + 1}{q.module ? ` · ${q.module}` : ""}{q.sourceLesson ? ` · from ${q.sourceLesson}` : ""}</span>
              <span className="flex gap-2 normal-case">
                <button className="text-teal hover:underline" onClick={() => setEditing(i)} aria-label={`Edit question ${i + 1}`}><Pencil className="h-3.5 w-3.5" /></button>
                <button className="text-nc-red hover:underline" onClick={() => remove(i)} aria-label={`Delete question ${i + 1}`}><Trash2 className="h-3.5 w-3.5" /></button>
              </span>
            </div>
            <p dir="auto" className={cn("text-nc-dark", hasUrdu(q.question) ? "urdu text-right text-[15px] leading-[2.1]" : "text-[13.5px] font-medium")}>{q.question}</p>
            {q.questionEn && <p className="mt-1 text-[12px] italic text-nc-muted">{q.questionEn}</p>}
            <ul className="mt-2 space-y-1">
              {q.options.map((o: string, j: number) => (
                <li key={j} dir="auto" className={cn("rounded px-2 py-1", j === q.correctIndex ? "bg-nc-green-lt font-medium text-nc-green" : "text-nc-dark",
                  hasUrdu(o) ? "urdu text-[14px] leading-[2]" : "text-[12.5px]")}>
                  {o}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      {editing != null && (
        <QuestionModal question={questions[editing] ?? emptyQuestion()} isNew={editing === questions.length}
          onClose={() => setEditing(null)} onSave={(q) => update(editing, q)} />
      )}
    </NcCard>
  );
}

function QuestionModal({ question, isNew, onClose, onSave }: { question: any; isNew: boolean; onClose: () => void; onSave: (q: any) => void }) {
  const [q, setQ] = useState(() => ({ ...emptyQuestion(), ...question, options: [...question.options] }));
  const valid = q.question.trim() && q.options.filter((o: string) => o.trim()).length === q.options.length && q.options.length >= 2;
  const set = (patch: object) => setQ((x: any) => ({ ...x, ...patch }));

  return (
    <Modal open onClose={onClose} title={isNew ? "New question" : "Edit question"}>
      <FormGroup label="Question" required>
        <FormTextarea dir="auto" value={q.question} onChange={(e) => set({ question: e.target.value })} />
      </FormGroup>
      <FormGroup label="English translation (for admins)">
        <FormInput value={q.questionEn} onChange={(e) => set({ questionEn: e.target.value })} />
      </FormGroup>
      <div className="mb-[18px]">
        <div className="mb-1.5 text-[13px] font-medium text-slate">Options (choose the correct one)</div>
        <div className="space-y-2">
          {q.options.map((o: string, j: number) => (
            <div key={j} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={q.correctIndex === j} onChange={() => set({ correctIndex: j })} aria-label={`Option ${j + 1} is correct`} className="accent-[hsl(var(--teal))]" />
              <FormInput dir="auto" value={o} onChange={(e) => set({ options: q.options.map((x: string, k: number) => (k === j ? e.target.value : x)) })} />
              {q.options.length > 2 && (
                <button aria-label="Remove option" className="text-nc-muted hover:text-nc-red"
                  onClick={() => set({ options: q.options.filter((_: string, k: number) => k !== j), correctIndex: q.correctIndex === j ? 0 : q.correctIndex > j ? q.correctIndex - 1 : q.correctIndex })}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {q.options.length < 6 && (
          <button className="mt-2 text-[12.5px] font-medium text-teal hover:underline" onClick={() => set({ options: [...q.options, ""] })}>+ Add option</button>
        )}
      </div>
      <FormGroup label="Explanation (shown after passing)">
        <FormTextarea dir="auto" value={q.explanation} onChange={(e) => set({ explanation: e.target.value })} />
      </FormGroup>
      <div className="grid grid-cols-2 gap-4">
        <FormGroup label="Module"><FormInput value={q.module} onChange={(e) => set({ module: e.target.value })} /></FormGroup>
        <FormGroup label="Source lesson"><FormInput value={q.sourceLesson} onChange={(e) => set({ sourceLesson: e.target.value })} placeholder="e.g. M3-08" /></FormGroup>
      </div>
      <button className="btn-primary w-full" disabled={!valid} onClick={() => onSave(q)}>Done</button>
      <p className="mt-2 text-center text-[11.5px] text-nc-muted">Remember to press “Save changes” afterwards.</p>
    </Modal>
  );
}

// ── Settings ────────────────────────────────────────────────────────────────

function SettingsTab({ outline, onChanged }: { outline: any; onChanged: () => void }) {
  const { toast } = useToast();
  const c = outline.course;
  const [f, setF] = useState({
    completion: Math.round(c.completionThreshold * 100), sequential: c.sequential, passingScore: c.passingScore,
    maxFailedAttemptsPerDay: c.maxFailedAttemptsPerDay, requirePractical: c.requirePractical,
    reflectionPrompt: c.reflectionPrompt, reflectionMinChars: c.reflectionMinChars,
    lesson: c.points?.lesson ?? 10, section: c.points?.section ?? 25, assessment: c.points?.assessment ?? 100,
  });
  const [saving, setSaving] = useState(false);
  const set = (patch: object) => setF((x) => ({ ...x, ...patch }));
  const num = (v: string) => (v === "" ? 0 : Number(v));

  async function save() {
    setSaving(true);
    try {
      const r = await courseService.settings(ASAAS_KEY, {
        completionThreshold: f.completion / 100, sequential: f.sequential, passingScore: f.passingScore,
        maxFailedAttemptsPerDay: f.maxFailedAttemptsPerDay, requirePractical: f.requirePractical,
        reflectionPrompt: f.reflectionPrompt, reflectionMinChars: f.reflectionMinChars,
        points: { lesson: f.lesson, section: f.section, assessment: f.assessment },
      });
      toast({ title: apiMessage(r, "Settings saved.") });
      onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save the settings.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <NcCard className="max-w-2xl">
      <div className="grid gap-x-6 sm:grid-cols-2">
        <FormGroup label="A lesson counts as heard at (%)">
          <FormInput type="number" min={50} max={100} value={f.completion} onChange={(e) => set({ completion: num(e.target.value) })} />
        </FormGroup>
        <FormGroup label="Assessment pass mark (%)">
          <FormInput type="number" min={0} max={100} value={f.passingScore} onChange={(e) => set({ passingScore: num(e.target.value) })} />
        </FormGroup>
        <FormGroup label="Failed attempts allowed per day">
          <FormInput type="number" min={1} max={10} value={f.maxFailedAttemptsPerDay} onChange={(e) => set({ maxFailedAttemptsPerDay: num(e.target.value) })} />
        </FormGroup>
        <FormGroup label="Reflection minimum length (characters)">
          <FormInput type="number" min={0} max={5000} value={f.reflectionMinChars} onChange={(e) => set({ reflectionMinChars: num(e.target.value) })} />
        </FormGroup>
      </div>
      <label className="mb-3 flex cursor-pointer items-start gap-2.5 text-[13px] text-nc-dark">
        <input type="checkbox" checked={f.sequential} onChange={(e) => set({ sequential: e.target.checked })} className="mt-0.5 accent-[hsl(var(--teal))]" />
        <span>Lessons open in order <span className="block text-[12px] text-nc-muted">Each lesson unlocks once the one before it has been heard.</span></span>
      </label>
      <label className="mb-5 flex cursor-pointer items-start gap-2.5 text-[13px] text-nc-dark">
        <input type="checkbox" checked={f.requirePractical} onChange={(e) => set({ requirePractical: e.target.checked })} className="mt-0.5 accent-[hsl(var(--teal))]" />
        <span>Require a practical score for the certificate <span className="block text-[12px] text-nc-muted">A trainer observes the murabbi leading a circle and enters a score of at least 8/18.</span></span>
      </label>
      <FormGroup label="Reflection question">
        <FormTextarea dir="auto" value={f.reflectionPrompt} onChange={(e) => set({ reflectionPrompt: e.target.value })} />
      </FormGroup>
      <div className="mb-1.5 text-[13px] font-medium text-slate">Training points</div>
      <div className="grid grid-cols-3 gap-4">
        <FormGroup label="Per lesson"><FormInput type="number" min={0} value={f.lesson} onChange={(e) => set({ lesson: num(e.target.value) })} /></FormGroup>
        <FormGroup label="Per module"><FormInput type="number" min={0} value={f.section} onChange={(e) => set({ section: num(e.target.value) })} /></FormGroup>
        <FormGroup label="Passing the assessment"><FormInput type="number" min={0} value={f.assessment} onChange={(e) => set({ assessment: num(e.target.value) })} /></FormGroup>
      </div>
      <button className="btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save settings"}</button>
    </NcCard>
  );
}
