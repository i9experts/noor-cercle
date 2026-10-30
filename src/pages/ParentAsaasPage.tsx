import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Eye, Lock, Printer, Search, Trash2, Unlock, Upload, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { courseService, parentCourseService, PARENT_COURSE_KEY } from "@/services/api.service";
import StatCard from "@/components/shared/StatCard";
import NcCard from "@/components/shared/NcCard";
import Modal from "@/components/shared/Modal";
import FlipChartSheet from "@/components/course/FlipChartSheet";
import { printParentCertificate } from "@/lib/parentCertificate";
import { cn } from "@/lib/utils";
import { apiError, apiMessage, formatDate, unwrap } from "@/lib/finance";
import { clock } from "@/lib/course";

type Tab = "progress" | "content";

const STATUS: Record<string, { label: string; cls: string }> = {
  "not-started": { label: "Not started", cls: "bg-muted text-nc-muted" },
  "in-progress": { label: "Listening", cls: "bg-teal-lt text-teal" },
  "heard-all":   { label: "Heard all", cls: "bg-gold/15 text-gold-dim" },
  certified:     { label: "Certified", cls: "bg-nc-green-lt text-nc-green" },
};

const QUIZ_LABEL = (k: string) => (k === "final" ? "Final check" : `Module ${k.slice(1)}`);

export default function ParentAsaasPage() {
  const { toast } = useToast();
  const [tab, setTab]         = useState<Tab>("progress");
  const [report, setReport]   = useState<any>(null);
  const [outline, setOutline] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [r, o] = await Promise.all([parentCourseService.progress(), courseService.outline(PARENT_COURSE_KEY)]);
      setReport(unwrap(r));
      setOutline(unwrap(o));
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not load Asaas for Parents.") });
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
        <h2 className="font-serif text-[26px] text-nc-dark">Asaas for Parents</h2>
        <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
          The parents’ 16-week audio course <span dir="rtl" lang="ur" className="urdu">(والدین کا Asaas)</span>. The Welcome and
          Module 1 open with the parent account, then a new module every fortnight. Progress here is visible to admins only,
          never to murabbis.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] sm:gap-4">
        <StatCard label="Enrolled" value={s?.enrolled ?? "—"} meta="Parent accounts" color="purple" />
        <StatCard label="Not started" value={s?.notStarted ?? "—"} meta="No clip heard yet" color="red" />
        <StatCard label="Listening" value={s?.inProgress ?? "—"} meta="In progress" color="teal" />
        <StatCard label="Heard all" value={s?.heardAll ?? "—"} meta="Checks / self-check next" color="gold" />
        <StatCard label="Certified" value={s?.certified ?? "—"} meta="Certificate to print" color="green" />
      </div>

      {st && st.withAudio < st.lessons && (
        <div className="mb-4 rounded-md border border-nc-amber/30 bg-nc-amber-lt px-4 py-2.5 text-[12.5px] text-nc-dark">
          {st.lessons - st.withAudio} of {st.lessons} clips don’t have audio yet.{" "}
          <button className="font-semibold underline" onClick={() => setTab("content")}>Upload the MP3 files</button>
        </div>
      )}

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
        {([["progress", "Parents & progress"], ["content", "Content & audio"]] as [Tab, string][]).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={cn("-mb-px whitespace-nowrap border-b-2 px-3.5 py-2 text-[13px] font-medium transition-colors",
              tab === k ? "border-teal text-teal" : "border-transparent text-nc-muted hover:text-nc-dark")}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <NcCard><div className="py-16 text-center text-sm text-nc-muted">Loading…</div></NcCard>
      ) : tab === "progress" ? (
        <ProgressTab report={report} onChanged={load} />
      ) : outline ? (
        <ContentTab outline={outline} onChanged={load} />
      ) : null}
    </div>
  );
}

// ── Progress ────────────────────────────────────────────────────────────────

function ProgressTab({ report, onChanged }: { report: any; onChanged: () => void }) {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const rows: any[] = useMemo(() => report?.rows ?? [], [report]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? rows.filter((r) => [r.user.fullName, r.user.email, r.user.phone].some((v) => v?.toLowerCase().includes(t))) : rows;
  }, [rows, q]);

  async function run(key: string, fn: () => Promise<any>) {
    setBusy(key);
    try {
      const r = await fn();
      toast({ title: apiMessage(r, "Done.") });
      onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Something went wrong.") });
    } finally {
      setBusy(null);
    }
  }

  async function print(id: string) {
    setBusy(`print:${id}`);
    try {
      const d = unwrap<any>(await parentCourseService.detail(id));
      if (d.certificate) printParentCertificate(d.certificate);
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not load the certificate.") });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <NcCard className="mb-4 !p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nc-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search parents by name, email or phone"
              className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-[13px] focus:border-primary focus:outline-none" />
          </div>
          <button className="btn-primary inline-flex items-center gap-1.5 !py-2 text-[12.5px]" disabled={busy === "all"}
            onClick={() => {
              if (window.confirm("Open Asaas for Parents for every active parent account? Parents who already have it keep their progress; for new ones the first fortnight starts today.")) {
                run("all", () => parentCourseService.assign({ all: true }));
              }
            }}>
            <Users className="h-4 w-4" /> {busy === "all" ? "Opening…" : "Open for all parent accounts"}
          </button>
        </div>
      </NcCard>

      <NcCard className="!p-0">
        {shown.length === 0 ? (
          <div className="py-14 text-center text-[13px] text-nc-muted">
            {rows.length ? "No parents match your search." : "No parents enrolled yet. New parent accounts are enrolled automatically."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-[12.5px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-nc-muted">
                  <th className="px-4 py-2.5 font-medium">Parent</th>
                  <th className="px-3 py-2.5 font-medium">Started</th>
                  <th className="px-3 py-2.5 font-medium">Module</th>
                  <th className="px-3 py-2.5 font-medium">Clips</th>
                  <th className="px-3 py-2.5 font-medium">Checks</th>
                  <th className="px-3 py-2.5 font-medium">Targets</th>
                  <th className="px-3 py-2.5 font-medium">Self-check</th>
                  <th className="px-3 py-2.5 font-medium">Certificate</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const id = r.user._id;
                  const pct = r.lessonsTotal ? Math.round((r.lessonsCompleted / r.lessonsTotal) * 100) : 0;
                  const status = STATUS[r.status] ?? STATUS["not-started"];
                  return (
                    <tr key={id} className="border-b border-border/60 last:border-0 align-top">
                      <td className="px-4 py-3">
                        <div className="font-medium text-nc-dark">{r.user.fullName}</div>
                        <div className="text-[11.5px] text-nc-muted">{r.user.email}{r.user.phone ? ` · ${r.user.phone}` : ""}</div>
                        {!r.user.isActive && <div className="text-[11px] text-nc-red">Account paused</div>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <div className="text-nc-dark">{formatDate(r.startedOn)}</div>
                        <div className="text-[11.5px] text-nc-muted">Day {r.day + 1}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {r.currentModule ? `Module ${r.currentModule}` : "Welcome"}
                        {r.allOpen && <div className="text-[11px] text-gold-dim">All open</div>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="whitespace-nowrap text-nc-dark">{r.lessonsCompleted}/{r.lessonsTotal}</div>
                        <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {r.quizzesPassed}/8
                        {r.finalPassed && <span className="ml-1.5 text-nc-green" title="Final check passed">· final ✓</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{r.targetsMet}/8</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className={r.selfCheck.start ? "text-nc-green" : "text-nc-muted"}>Start {r.selfCheck.start ? "✓" : "—"}</span>
                        <span className={cn("ml-2", r.selfCheck.end ? "text-nc-green" : "text-nc-muted")}>End {r.selfCheck.end ? "✓" : "—"}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {r.certificate ? (
                          <>
                            <div className="font-mono text-[11.5px] text-nc-dark">{r.certificate.number}</div>
                            {r.certificate.issuedOn && <div className="text-[11px] text-nc-muted">{formatDate(r.certificate.issuedOn)}</div>}
                          </>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", status.cls)}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button className="btn-outline inline-flex items-center gap-1 !px-2 !py-1 text-[11.5px]" onClick={() => setDetailId(id)}>
                            <Eye className="h-3.5 w-3.5" /> Details
                          </button>
                          <button className="btn-outline inline-flex items-center gap-1 !px-2 !py-1 text-[11.5px]" disabled={busy === `open:${id}`}
                            onClick={() => run(`open:${id}`, () => parentCourseService.setAccess(id, !r.allOpen))}>
                            {r.allOpen ? <><Lock className="h-3.5 w-3.5" /> Back to fortnightly</> : <><Unlock className="h-3.5 w-3.5" /> Open all modules</>}
                          </button>
                          {r.certificate && (
                            <button className="btn-outline inline-flex items-center gap-1 !px-2 !py-1 text-[11.5px]" disabled={busy === `print:${id}`} onClick={() => print(id)}>
                              <Printer className="h-3.5 w-3.5" /> Certificate
                            </button>
                          )}
                          <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] text-nc-muted hover:bg-nc-red-lt hover:text-nc-red"
                            disabled={busy === `del:${id}`} aria-label={`Remove ${r.user.fullName}`}
                            onClick={() => {
                              if (window.confirm(`Remove ${r.user.fullName} from Asaas for Parents? Their listening and answers are kept.`)) {
                                run(`del:${id}`, () => parentCourseService.unassign(id));
                              }
                            }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </NcCard>

      {detailId && <DetailModal userId={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}

function DetailModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { toast } = useToast();
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    parentCourseService.detail(userId)
      .then((r) => setD(unwrap(r)))
      .catch((err) => { toast({ variant: "destructive", title: apiError(err, "Could not load this parent.") }); onClose(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const scale: string[] = d?.selfCheck.scale ?? [];
  return (
    <Modal open onClose={onClose} title={d?.user?.fullName ?? "Parent"}
      subtitle={d ? `${d.user?.email ?? ""} · started ${formatDate(d.startedOn)}${d.allOpen ? " · all modules open" : ""}` : "Loading…"}>
      {!d ? (
        <div className="py-10 text-center text-sm text-nc-muted">Loading…</div>
      ) : (
        <div className="space-y-6">
          {d.certificate && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-nc-green-lt px-3 py-2 text-[12.5px] text-nc-dark">
              <span><CheckCircle2 className="mr-1 inline h-4 w-4 text-nc-green" /> Certified · <span className="font-mono">{d.certificate.number}</span></span>
              <button className="btn-outline inline-flex items-center gap-1 !px-2 !py-1 text-[11.5px]" onClick={() => printParentCertificate(d.certificate)}>
                <Printer className="h-3.5 w-3.5" /> Print certificate
              </button>
            </div>
          )}

          <section>
            <h4 className="mb-2 text-[13px] font-semibold text-nc-dark">Clips</h4>
            <div className="space-y-2">
              {d.sections.map((s: any) => {
                const done = s.lessons.filter((l: any) => l.completed).length;
                return (
                  <details key={s.key} className="rounded-md border border-border px-3 py-2">
                    <summary className="flex cursor-pointer items-center gap-2 text-[12.5px]">
                      <span className="flex-1 font-medium text-nc-dark">{s.title}</span>
                      {!s.open && <Lock className="h-3.5 w-3.5 text-nc-muted" aria-label="Not open yet" />}
                      <span className="text-nc-muted">{done}/{s.lessons.length}</span>
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {s.lessons.map((l: any) => (
                        <li key={l.code} className="flex items-center gap-2 text-[12px]">
                          <span className="w-12 flex-shrink-0 font-mono text-[11px] text-nc-muted">{l.code}</span>
                          <span dir="rtl" lang="ur" className="urdu min-w-0 flex-1 truncate text-start text-[13px] leading-[1.9] text-nc-dark">{l.title}</span>
                          <span className={l.completed ? "text-nc-green" : "text-nc-muted"}>{l.completed ? "✓" : `${l.percent}%`}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                );
              })}
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-[13px] font-semibold text-nc-dark">Knowledge checks</h4>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] text-[12px]">
                <tbody>
                  {d.quizzes.map((qz: any) => (
                    <tr key={qz.key} className="border-b border-border/60 last:border-0">
                      <td className="py-1.5 pr-3 font-medium text-nc-dark">{QUIZ_LABEL(qz.key)}</td>
                      <td className="py-1.5 pr-3 text-nc-muted">pass {qz.passMark}/{qz.total}</td>
                      <td className="py-1.5">
                        {qz.attempts.length === 0 ? <span className="text-nc-muted">—</span> : qz.attempts.map((a: any, i: number) => (
                          <span key={i} className={cn("mr-2 inline-block rounded px-1.5", a.passed ? "bg-nc-green-lt text-nc-green" : "bg-muted text-nc-dark")}>
                            {a.correct}/{qz.total} · {formatDate(a.on)}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-[13px] font-semibold text-nc-dark">Self-check: start and end</h4>
            {!d.selfCheck.start && !d.selfCheck.end ? (
              <p className="text-[12px] text-nc-muted">Not filled in yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-[12px]">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-nc-muted">
                      <th className="py-1.5 pr-2 font-medium">Statement</th>
                      <th className="py-1.5 pr-2 font-medium">Start</th>
                      <th className="py-1.5 font-medium">End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.selfCheck.items.map((it: any, i: number) => {
                      const a = d.selfCheck.start?.[i];
                      const b = d.selfCheck.end?.[i];
                      const change = a != null && b != null ? b - a : 0;
                      return (
                        <tr key={i} className="border-b border-border/60 align-top last:border-0">
                          <td className="py-1.5 pr-2">
                            <div dir="rtl" lang="ur" className="urdu text-right text-[13px] leading-[2] text-nc-dark">{it.text}</div>
                            <div className="text-[11px] text-nc-muted">{it.en}</div>
                          </td>
                          <td dir="rtl" className="urdu whitespace-nowrap py-1.5 pr-2 text-[12.5px] leading-[2]">{a != null ? scale[a] : "—"}</td>
                          <td dir="rtl" className="urdu whitespace-nowrap py-1.5 text-[12.5px] leading-[2]">
                            {b != null ? scale[b] : "—"}
                            {change > 0 && <span className="mr-1 font-sans text-nc-green" aria-label="Up">↑</span>}
                            {change < 0 && <span className="mr-1 font-sans text-nc-red" aria-label="Down">↓</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h4 className="mb-2 text-[13px] font-semibold text-nc-dark">Targets</h4>
            <ul className="space-y-1 text-[12px]">
              {d.targets.map((t: any) => (
                <li key={t.module} className="flex items-center gap-2">
                  <span className="w-16 flex-shrink-0 text-nc-muted">Module {t.module}</span>
                  <span className="min-w-0 flex-1 truncate text-nc-dark">{t.title}</span>
                  <span className="whitespace-nowrap text-nc-muted">{t.ticks}/{t.needed}{t.lighter ? " · lighter" : ""}</span>
                  {t.met ? <CheckCircle2 className="h-4 w-4 text-nc-green" aria-label="Met" /> : <span className="w-4" />}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </Modal>
  );
}

// ── Content & audio ─────────────────────────────────────────────────────────

function ContentTab({ outline, onChanged }: { outline: any; onChanged: () => void }) {
  const { toast } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);
  const [chart, setChart] = useState<any>(null);
  const st = outline.stats;
  const charts: any[] = outline.course.flipCharts ?? [];

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
        const r = unwrap<any>(await courseService.uploadAudio(PARENT_COURSE_KEY, batches[i], (p) => setUploading(Math.round(((i + p / 100) / batches.length) * 100))));
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

  return (
    <div className="space-y-4">
      <NcCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[14px] font-semibold text-nc-dark">Clips and audio</div>
            <div className="text-[12px] text-nc-muted">
              {st.lessons} clips · {st.withAudio} with audio · about {st.totalMinutes} minutes. Files are matched by name (pw-01.mp3 … p8-06.mp3, pc-01.mp3).
            </div>
          </div>
          <label className={cn("btn-primary inline-flex cursor-pointer items-center gap-1.5 !py-2 text-[12.5px]", uploading != null && "pointer-events-none opacity-60")}>
            <Upload className="h-4 w-4" /> {uploading != null ? `Uploading ${uploading}%` : "Upload MP3 files"}
            <input ref={input} type="file" accept=".mp3,audio/mpeg" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
          </label>
        </div>
        {uploading != null && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-teal transition-all" style={{ width: `${uploading}%` }} /></div>
        )}
        {result && (
          <div className="mt-3 space-y-1 rounded-md bg-muted/50 px-3 py-2 text-[12px] text-nc-dark">
            <div><span className="font-semibold">{result.matched.length}</span> uploaded{result.matched.length ? `: ${result.matched.join(", ")}` : ""}</div>
            {result.unmatched.length > 0 && <div className="text-nc-red">Not matched to a clip: {result.unmatched.join(", ")}</div>}
            {result.rejected.length > 0 && <div className="text-nc-red">Rejected: {result.rejected.map((r: any) => `${r.file} (${r.reason})`).join(", ")}</div>}
            <div className="text-nc-muted">{result.missing.length ? `Still without audio: ${result.missing.join(", ")}` : "Every clip has audio."}</div>
          </div>
        )}
      </NcCard>

      {outline.sections.map((s: any) => (
        <NcCard key={s._id} className="!p-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold text-nc-dark">{s.title}</div>
              <div dir="rtl" lang="ur" className="urdu text-right text-[14px] leading-[2] text-nc-muted">{s.titleUr}</div>
            </div>
            <span className="text-[11.5px] text-nc-muted">{s.unlockDay ? `Opens on day ${s.unlockDay + 1}` : "Opens straight away"}</span>
          </div>
          <ul className="divide-y divide-border/60">
            {s.lessons.map((l: any) => (
              <li key={l._id} className="px-4 py-2.5 sm:px-5">
                <div className="flex items-center gap-3 text-[12.5px]">
                  <span className="w-12 flex-shrink-0 font-mono text-[11px] text-nc-muted">{l.code}</span>
                  <span dir="rtl" lang="ur" className="urdu min-w-0 flex-1 truncate text-start text-[14px] leading-[1.9] text-nc-dark">{l.title}</span>
                  <span className="text-[11.5px] text-nc-muted">{clock(l.durationSec)}</span>
                  {l.hasAudio
                    ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-nc-green" aria-label="Audio uploaded" />
                    : <span className="whitespace-nowrap text-[11px] text-nc-red">no audio</span>}
                </div>
                {l.trainerNotes?.length > 0 && (
                  <ul className="mt-1 space-y-0.5 pl-[60px]">
                    {l.trainerNotes.map((n: string, i: number) => (
                      <li key={i} dir="rtl" lang="ur" className="urdu text-right text-[12px] leading-[1.9] text-nc-muted">{n}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </NcCard>
      ))}

      <NcCard>
        <div className="mb-3 text-[14px] font-semibold text-nc-dark">Flip charts ({charts.length})</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {charts.map((c) => (
            <button key={c.key} onClick={() => setChart(c)}
              className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-left hover:border-teal hover:bg-teal-lt/40">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-plum/10 text-[11.5px] font-semibold text-plum">{c.number}</span>
              <span className="min-w-0 flex-1">
                <span dir="rtl" lang="ur" className="urdu block truncate text-start text-[14px] leading-[1.9] text-nc-dark">{c.title}</span>
                <span className="block truncate text-[11px] text-nc-muted">{c.subtitle} · {c.lessonCodes.join(", ")}</span>
              </span>
              {c.printable && <span className="flex-shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[10.5px] font-semibold text-gold-dim">Print</span>}
            </button>
          ))}
        </div>
      </NcCard>

      {chart && (
        <Modal open onClose={() => setChart(null)} title={`Flip chart ${chart.number}`} subtitle={`${chart.module} · ${chart.lessonCodes.join(", ")}`}>
          <FlipChartSheet chartKey={chart.key} set="parent" />
        </Modal>
      )}
    </div>
  );
}
