import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import ProgressBar from "@/components/shared/ProgressBar";
import {
  CheckCircle2, Lock, Play, FileText, CheckCheck, CalendarDays,
  BookOpen, ArrowLeft, GraduationCap, Award, Download, XCircle, Sparkles,
} from "lucide-react";
import { trainingService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

function fmtDate(d?: string | null) {
  if (!d) return "TBD";
  try { return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return "TBD"; }
}

type View = "list" | "reading" | "exam" | "result";

export default function MurabbiTraining() {
  const { toast }                     = useToast();
  const [modules, setModules]         = useState<any[]>([]);
  const [activeBatch, setActiveBatch] = useState<any>(null);
  const [summary, setSummary]         = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [updating, setUpdating]       = useState<string | null>(null);
  const [sliders, setSliders]         = useState<Record<string, number>>({});

  const [view, setView]               = useState<View>("list");
  const [readingModule, setReadingModule] = useState<any>(null);

  const [exam, setExam]               = useState<any>(null);
  const [examLoading, setExamLoading] = useState(false);
  const [answers, setAnswers]         = useState<Record<number, number>>({});
  const [submitting, setSubmitting]   = useState(false);
  const [result, setResult]           = useState<any>(null);

  function loadData() {
    setLoading(true);
    trainingService.getModules()
      .then((res) => {
        const mods: any[] = res.data?.data || [];
        setModules(mods);
        const init: Record<string, number> = {};
        mods.forEach((m: any) => { init[m._id] = m.progressPercent ?? 0; });
        setSliders(init);
      })
      .catch(() => {});

    trainingService.getProgressSummary()
      .then((res) => setSummary(res.data?.data || null))
      .catch(() => {});

    trainingService.getMyCertificates()
      .then((res) => setCertificates(res.data?.data || []))
      .catch(() => {});

    if (typeof trainingService.getActiveBatch === "function") {
      trainingService.getActiveBatch()
        .then((res) => {
          const d = res.data?.data || res.data;
          setActiveBatch(d?.batch || null);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSaveProgress(moduleId: string) {
    const value = sliders[moduleId] ?? 0;
    setUpdating(moduleId);
    try {
      await trainingService.updateProgress(moduleId, value);
      toast({ title: value === 100 ? "Module completed!" : `Progress saved — ${value}%` });
      loadData();
    } catch {
      toast({ variant: "destructive", title: "Failed to save progress." });
    } finally { setUpdating(null); }
  }

  async function handleMarkComplete(moduleId: string) {
    setSliders((p) => ({ ...p, [moduleId]: 100 }));
    setUpdating(moduleId);
    try {
      await trainingService.updateProgress(moduleId, 100);
      toast({ title: "Module completed!" });
      loadData();
    } catch {
      toast({ variant: "destructive", title: "Failed to mark complete." });
    } finally { setUpdating(null); }
  }

  function openReading(m: any) {
    setReadingModule(m);
    setView("reading");
    window.scrollTo(0, 0);
  }

  async function openExam() {
    setView("exam");
    setResult(null);
    setAnswers({});
    setExamLoading(true);
    window.scrollTo(0, 0);
    try {
      const res = await trainingService.getExam();
      setExam(res.data?.data || null);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Assessment unavailable",
        description: e?.response?.data?.message || "Try again shortly.",
      });
      setView("list");
    } finally {
      setExamLoading(false);
    }
  }

  async function handleSubmitExam() {
    if (!exam) return;
    const answerArray = exam.questions.map((_: any, i: number) => answers[i]);
    if (answerArray.some((a: number | undefined) => a === undefined)) {
      toast({ variant: "destructive", title: "Please answer every question before submitting." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await trainingService.submitExam(answerArray);
      setResult(res.data?.data || null);
      setView("result");
      loadData();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Could not submit assessment",
        description: e?.response?.data?.message || "Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownloadCertificate(tier: number) {
    try {
      const res = await trainingService.downloadCertificate(tier);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `noor-circles-tier-${tier}-certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: "destructive", title: "Could not download certificate." });
    }
  }

  // Not assigned to any batch — show locked state
  if (!loading && !activeBatch) {
    return (
      <div className="page-animate flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-7 w-7 text-nc-muted" />
        </div>
        <div className="text-center">
          <div className="font-semibold text-[16px] mb-1">Not assigned to a training batch</div>
          <div className="text-[13px] text-nc-muted">
            Contact your admin to be added to an active training batch.
          </div>
        </div>
      </div>
    );
  }

  const allComplete = !!summary && summary.total > 0 && summary.completed === summary.total;
  const tier1Certificate = certificates.find((c: any) => c.tier === 1);

  // ── Reading view ────────────────────────────────────────────────────────────
  if (view === "reading" && readingModule) {
    const sliderVal   = sliders[readingModule._id] ?? readingModule.progressPercent ?? 0;
    const isCompleted = !!readingModule.completed || sliderVal >= 100;

    return (
      <div className="page-animate max-w-3xl mx-auto">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 text-[12.5px] text-nc-muted hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Modules
        </button>

        <NcCard>
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="font-serif text-[20px] font-semibold">{readingModule.title}</div>
            <NcBadge variant={isCompleted ? "green" : "teal"}>
              {isCompleted ? "Completed" : "In Progress"}
            </NcBadge>
          </div>
          <div className="text-[11.5px] text-nc-muted mb-6">
            {[readingModule.daySlot && `Day ${readingModule.daySlot}`, readingModule.timeSlot, readingModule.durationMinutes && `${readingModule.durationMinutes} min`]
              .filter(Boolean).join(" · ")}
          </div>

          {readingModule.content ? (
            <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-teal-dk prose-h2:text-[16px] prose-h2:mt-6 prose-h2:mb-2 prose-strong:text-foreground prose-p:text-[13.5px] prose-li:text-[13.5px] prose-table:text-[12.5px] prose-th:text-nc-muted">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{readingModule.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-[13px] text-nc-muted italic">Content for this module hasn't been added yet.</p>
          )}

          <div className="mt-8 pt-6 border-t border-border">
            {!isCompleted ? (
              <button
                className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold bg-nc-green-lt text-nc-green border border-nc-green/30 rounded-md hover:brightness-95 transition disabled:opacity-40"
                onClick={() => handleMarkComplete(readingModule._id)}
                disabled={updating === readingModule._id}
              >
                <CheckCheck className="h-4 w-4" />
                {updating === readingModule._id ? "Saving…" : "Mark as Read & Complete"}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-[13px] text-nc-green font-medium">
                <CheckCircle2 className="h-4 w-4" /> You've completed this module
              </div>
            )}
          </div>
        </NcCard>
      </div>
    );
  }

  // ── Exam view ────────────────────────────────────────────────────────────────
  if (view === "exam") {
    return (
      <div className="page-animate max-w-3xl mx-auto">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 text-[12.5px] text-nc-muted hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Modules
        </button>

        {examLoading && (
          <div className="text-center py-20 text-nc-muted text-sm animate-pulse">Loading assessment…</div>
        )}

        {!examLoading && exam && (
          <NcCard>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-11 h-11 rounded-xl bg-gold/15 text-gold flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-5.5 w-5.5" />
              </div>
              <div>
                <div className="font-serif text-[19px] font-semibold">{exam.title}</div>
                <div className="text-[11.5px] text-nc-muted">
                  {exam.questions.length} questions · {exam.passingScore}% required to pass
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {exam.questions.map((q: any, i: number) => (
                <div key={i} className="pb-6 border-b border-border last:border-0 last:pb-0">
                  <div className="font-medium text-[13.5px] mb-3">
                    <span className="text-nc-muted mr-1.5">{i + 1}.</span>{q.question}
                  </div>
                  <div className="space-y-2">
                    {q.options.map((opt: string, oi: number) => (
                      <label
                        key={oi}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer text-[13px] transition-colors ${
                          answers[i] === oi
                            ? "border-teal bg-teal-lt text-teal font-medium"
                            : "border-border hover:bg-muted/60"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${i}`}
                          className="accent-teal"
                          checked={answers[i] === oi}
                          onChange={() => setAnswers((p) => ({ ...p, [i]: oi }))}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              className="mt-6 w-full py-2.5 text-[13.5px] font-semibold bg-primary text-primary-foreground rounded-md hover:brightness-95 transition disabled:opacity-40"
              onClick={handleSubmitExam}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit Assessment"}
            </button>
          </NcCard>
        )}
      </div>
    );
  }

  // ── Result view ──────────────────────────────────────────────────────────────
  if (view === "result" && result) {
    return (
      <div className="page-animate max-w-2xl mx-auto">
        <NcCard className="text-center py-10">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-5 ${
            result.passed ? "bg-nc-green-lt text-nc-green" : "bg-nc-red-lt text-nc-red"
          }`}>
            {result.passed ? <Award className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
          </div>

          <div className="font-serif text-[24px] font-semibold mb-1">
            {result.passed ? "Congratulations!" : "Not quite there yet"}
          </div>
          <div className="text-[13.5px] text-nc-muted mb-6">
            {result.passed
              ? "You've passed the Tier 1 Asaas Certification Assessment."
              : "You didn't reach the passing score this time — review the modules and try again."}
          </div>

          <div className="text-[42px] font-bold font-serif mb-1">{result.scorePercent}%</div>
          <div className="text-[12px] text-nc-muted mb-8">
            {result.correctCount} of {result.totalQuestions} correct
          </div>

          {result.passed ? (
            <button
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold bg-gold text-white rounded-md hover:brightness-95 transition"
              onClick={() => handleDownloadCertificate(1)}
            >
              <Download className="h-4 w-4" /> Download Your Certificate
            </button>
          ) : (
            <button
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold bg-teal text-white rounded-md hover:brightness-95 transition"
              onClick={openExam}
            >
              Retake Assessment
            </button>
          )}

          <div>
            <button
              onClick={() => setView("list")}
              className="mt-5 text-[12.5px] text-nc-muted hover:text-foreground transition-colors"
            >
              Back to Modules
            </button>
          </div>
        </NcCard>
      </div>
    );
  }

  // ── List view (default) ───────────────────────────────────────────────────────
  return (
    <div className="page-animate">
      <div className="mb-6">
        <div className="font-serif text-[22px] font-semibold">Training Programme</div>
        <div className="text-[12.5px] text-nc-muted mt-0.5">Tier 1 Asaas — your path to becoming a certified Murabbi.</div>
      </div>

      {/* Certificate banner — already certified */}
      {tier1Certificate && (
        <NcCard className="mb-6 !bg-gold/[0.06] !border-gold/30">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gold/15 text-gold flex items-center justify-center flex-shrink-0">
                <Award className="h-5.5 w-5.5" />
              </div>
              <div>
                <div className="font-semibold text-[14px]">Tier 1 — Asaas Certified</div>
                <div className="text-[11.5px] text-nc-muted">
                  Certificate No. {tier1Certificate.certificateNumber} · Issued {fmtDate(tier1Certificate.issuedAt)}
                </div>
              </div>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold bg-gold text-white rounded-md hover:brightness-95 transition"
              onClick={() => handleDownloadCertificate(1)}
            >
              <Download className="h-3.5 w-3.5" /> Download Certificate
            </button>
          </div>
        </NcCard>
      )}

      {/* Assessment CTA — all modules done, not yet certified */}
      {!tier1Certificate && allComplete && (
        <NcCard className="mb-6 !bg-teal/[0.06] !border-teal/30">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-teal/15 text-teal flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5.5 w-5.5" />
              </div>
              <div>
                <div className="font-semibold text-[14px]">You've completed all modules!</div>
                <div className="text-[11.5px] text-nc-muted">Take the final assessment to earn your Tier 1 certificate.</div>
              </div>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold bg-teal text-white rounded-md hover:brightness-95 transition"
              onClick={openExam}
            >
              <GraduationCap className="h-3.5 w-3.5" /> Take Assessment
            </button>
          </div>
        </NcCard>
      )}

      {/* Progress summary */}
      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {([
            { label: "Total", val: summary.total },
            { label: "Done",  val: summary.completed },
            { label: "Active",val: summary.inProgress },
            { label: "%",     val: `${summary.overallPercent}%` },
          ] as { label: string; val: any }[]).map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold font-serif text-black">{s.val}</div>
              <div className="text-[11px] text-nc-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Modules */}
        <div className="lg:col-span-2 space-y-4">
          {loading && (
            <div className="text-center py-20 text-nc-muted text-sm animate-pulse">Loading...</div>
          )}
          {!loading && modules.length === 0 && (
            <div className="text-center py-20 text-nc-muted text-sm">No training modules available yet.</div>
          )}
          {!loading && modules.map((m: any) => {
            const isLocked    = m.status === "Locked";
            const sliderVal   = sliders[m._id] ?? m.progressPercent ?? 0;
            const isCompleted = !!m.completed || sliderVal >= 100;
            const isDirty     = sliderVal !== (m.progressPercent ?? 0);

            return (
              <NcCard key={String(m._id)} className={isLocked ? "opacity-60 pointer-events-none" : ""}>
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isCompleted ? "bg-nc-green-lt text-nc-green" : sliderVal > 0 ? "bg-teal/10 text-teal" : "bg-muted text-nc-muted"
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-7 w-7" />
                      : isLocked ? <Lock className="h-7 w-7" />
                      : <Play className="h-7 w-7" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <div>
                        <div className="font-bold text-[15px]">{m.title}</div>
                        <div className="text-[11px] text-nc-muted">
                          {[m.daySlot && `Day ${m.daySlot}`, m.timeSlot, m.durationMinutes && `${m.durationMinutes} min`]
                            .filter(Boolean).join(" · ") || "—"}
                        </div>
                      </div>
                      <NcBadge variant={isCompleted ? "green" : sliderVal > 0 ? "teal" : m.status === "Upcoming" ? "amber" : "slate"}>
                        {isCompleted ? "Completed" : sliderVal > 0 ? "In Progress" : (m.status || "—")}
                      </NcBadge>
                    </div>

                    {m.description && (
                      <p className="text-[12px] text-nc-muted mb-3 line-clamp-2">{m.description}</p>
                    )}

                    {!isLocked && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {m.content && (
                          <button
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-muted text-foreground/80 border border-border rounded-md hover:bg-muted/70 transition"
                            onClick={() => openReading(m)}
                          >
                            <BookOpen className="h-3.5 w-3.5" /> {isCompleted ? "Review Content" : "Read Content"}
                          </button>
                        )}
                      </div>
                    )}

                    {!isLocked && !isCompleted && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-nc-muted">Progress</span>
                          <span className="text-teal">{sliderVal}%</span>
                        </div>
                        <input type="range" min={0} max={100} step={5} value={sliderVal}
                          onChange={(e) => setSliders((p) => ({ ...p, [m._id]: +e.target.value }))}
                          className="w-full h-1.5 rounded-full appearance-none bg-muted accent-teal cursor-pointer"
                        />
                        <div className="flex gap-2">
                          <button className="flex-1 py-1.5 text-xs font-semibold bg-teal/10 text-teal border border-teal/30 rounded-md disabled:opacity-40"
                            onClick={() => handleSaveProgress(m._id)} disabled={!isDirty || updating === m._id}>
                            {updating === m._id ? "Saving…" : isDirty ? "Save Progress" : "No Changes"}
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-nc-green-lt text-nc-green border border-nc-green/30 rounded-md disabled:opacity-40"
                            onClick={() => handleMarkComplete(m._id)} disabled={updating === m._id}>
                            <CheckCheck className="h-3.5 w-3.5" /> Complete
                          </button>
                        </div>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="mt-2">
                        <ProgressBar value={100} color="green" />
                        <p className="text-[11px] text-nc-green mt-1">Module completed ✓</p>
                      </div>
                    )}
                  </div>
                </div>
              </NcCard>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">

          {/* Training schedule */}
          <NcCard>
            <CardHeader><CardTitle>Training Schedule</CardTitle></CardHeader>
            {!activeBatch ? (
              <p className="text-[12px] text-nc-muted text-center py-4 px-4">No active batch yet.</p>
            ) : (
              <div className="px-4 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-nc-muted">Batch {activeBatch.batchNumber}</span>
                  <NcBadge variant="teal">Active</NcBadge>
                </div>
                {[
                  { num: 1, title: activeBatch.day1Title, meta: activeBatch.day1Meta, date: activeBatch.day1Date },
                  { num: 2, title: activeBatch.day2Title, meta: activeBatch.day2Meta, date: activeBatch.day2Date },
                ].map((day) => (
                  <div key={day.num} className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarDays className="h-3.5 w-3.5 text-teal flex-shrink-0" />
                      <span className="font-semibold text-[12.5px] text-teal">Day {day.num} — {day.title}</span>
                    </div>
                    <p className="text-[11.5px] text-nc-muted pl-5">{day.meta}</p>
                    <p className="text-[11px] font-medium pl-5 mt-1">{fmtDate(day.date)}</p>
                  </div>
                ))}
              </div>
            )}
          </NcCard>

          {/* Resources */}
          <NcCard>
            <CardHeader><CardTitle>Resources</CardTitle></CardHeader>
            <div className="space-y-2 px-4 pb-4">
              {[
                { label: "Murabbi Handbook 2026.pdf" },
                { label: "Activity Ideas Booklet" },
              ].map((r) => (
                <a key={r.label} href="#"
                  className="flex items-center gap-3 p-2.5 hover:bg-muted rounded-lg transition-colors">
                  <FileText className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span className="text-[12.5px] font-medium">{r.label}</span>
                </a>
              ))}
            </div>
          </NcCard>

        </div>
      </div>
    </div>
  );
}
