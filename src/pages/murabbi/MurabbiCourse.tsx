import { useCallback, useEffect, useRef, useState } from "react";
import {
  Award, CheckCircle2, ChevronDown, Clock, Download, GraduationCap, Headphones, Lock, NotebookPen, PlayCircle,
  Presentation, RotateCcw, Sparkles, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { courseService, trainingService } from "@/services/api.service";
import NcCard from "@/components/shared/NcCard";
import StatCard from "@/components/shared/StatCard";
import CertifiedBadge from "@/components/course/CertifiedBadge";
import FlipChartSheet from "@/components/course/FlipChartSheet";
import { LessonPlayer } from "@/components/course/LessonPlayer";
import { cn } from "@/lib/utils";
import { apiError, apiMessage, formatDate, unwrap } from "@/lib/finance";
import { ASAAS_KEY, BAND_META, clock, hasUrdu, minutesLabel, titleProps } from "@/lib/course";

export default function MurabbiCourse() {
  const { toast } = useToast();
  const [me, setMe]               = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [notAssigned, setNotAssigned] = useState(false);
  const [lessonId, setLessonId]   = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [quizOpen, setQuizOpen]   = useState(false);
  const autoplay = useRef(false);
  const [chartOpen, setChartOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = unwrap(await courseService.me(ASAAS_KEY));
      setMe(d);
      return d;
    } catch (err: any) {
      if (err?.response?.status === 403) setNotAssigned(true);
      else toast({ variant: "destructive", title: apiError(err, "Could not load your training.") });
      return null;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load().then((d) => {
      if (!d) return;
      const next = d.progress.nextLessonId;
      const section = d.sections.find((s: any) => s.lessons.some((l: any) => l._id === next)) ?? d.sections[0];
      setOpenSection(section?._id ?? null);
      if (next) setLessonId(next);
    });
  }, [load]);

  const lessons: any[] = me?.sections.flatMap((s: any) => s.lessons) ?? [];
  const lesson = lessons.find((l) => l._id === lessonId);

  function selectLesson(l: any, play = false) {
    if (l.locked) {
      toast({ title: "Finish the previous lesson first.", description: "Lessons open one after another." });
      return;
    }
    if (!l.hasAudio) {
      toast({ title: "This lesson’s audio isn’t available yet." });
      return;
    }
    autoplay.current = play;
    setLessonId(l._id);
    if (!play) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function downloadCertificate() {
    try {
      const res = await trainingService.downloadCertificate(1);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "certified-asaas-murabbi.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: "destructive", title: "Could not download the certificate." });
    }
  }

  if (loading) return <NcCard><div className="py-16 text-center text-sm text-nc-muted">Loading…</div></NcCard>;

  if (notAssigned || !me) {
    return (
      <div className="page-animate">
        <PageHead />
        <NcCard className="py-14 text-center">
          <Headphones className="mx-auto mb-3 h-9 w-9 text-pale" strokeWidth={1.5} />
          <div className="text-sm font-medium text-nc-dark">The Asaas training hasn’t been assigned to you yet</div>
          <div className="mt-1 text-[12.5px] text-nc-muted">You’ll get a notification as soon as an admin assigns it.</div>
        </NcCard>
      </div>
    );
  }

  const p = me.progress;
  const pct = p.lessonsTotal ? Math.round((p.lessonsCompleted / p.lessonsTotal) * 100) : 0;
  const index = lessons.findIndex((l) => l._id === lessonId);
  const nextLesson = index >= 0 ? lessons[index + 1] : undefined;
  const lockedIds = new Set(lessons.filter((l) => l.locked).map((l) => l._id as string));
  const charts: any[] = me.flipCharts ?? [];
  const lessonCharts = lesson ? charts.filter((c) => c.lessons.some((x: any) => x._id === lesson._id)) : [];
  const openLessonById = (id: string) => { const l = lessons.find((x) => x._id === id); if (l) { setChartOpen(null); selectLesson(l); } };
  const onChartReport = (r: { justStudied?: boolean }) => {
    if (r?.justStudied) { toast({ title: "Flip chart studied", description: "It’s now ticked off in your Flip charts." }); load(); }
  };

  return (
    <div className="page-animate">
      <PageHead course={me.course} assignment={me.assignment} />

      {me.certificate && (
        <NcCard className="mb-6 !border-gold/30 !bg-gold/[0.06]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dim">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold">MashaAllah, you are certified</span>
                  <CertifiedBadge label={me.course.badge} />
                </div>
                <div className="text-[11.5px] text-nc-muted">
                  Certificate No. {me.certificate.number} · Issued {formatDate(me.certificate.issuedAt)}
                </div>
              </div>
            </div>
            <button className="btn-gold flex items-center gap-2 !py-2 text-[12.5px]" onClick={downloadCertificate}>
              <Download className="h-3.5 w-3.5" /> Download certificate
            </button>
          </div>
        </NcCard>
      )}

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:gap-4">
        <StatCard label="Lessons heard" value={`${p.lessonsCompleted}/${p.lessonsTotal}`} meta={`${pct}% complete`} color="purple" />
        <StatCard label="Listened" value={minutesLabel(p.listenMinutes)} meta={`of ${minutesLabel(p.totalMinutes)}`} color="teal" />
        <StatCard label="Training points" value={me.points} meta={`${me.course.points?.lesson ?? 10} per lesson`} color="gold" />
        <StatCard
          label="Assessment"
          value={me.assessment.passed ? `${me.assessment.best}%` : me.assessment.unlocked ? "Ready" : "Locked"}
          meta={me.assessment.passed ? "Passed" : `Pass mark ${me.course.passingScore}%`}
          color={me.assessment.passed ? "green" : "red"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {lesson ? (
            <LessonPlayer
              key={lesson._id}
              lessonId={lesson._id}
              nextLesson={nextLesson}
              threshold={me.course.completionThreshold}
              autoPlay={autoplay.current}
              onProgress={load}
              onNext={(play) => nextLesson && selectLesson({ ...nextLesson, locked: false }, play)}
            />
          ) : (
            <NcCard className="py-14 text-center">
              <Sparkles className="mx-auto mb-3 h-9 w-9 text-pale" strokeWidth={1.5} />
              <div className="text-sm font-medium text-nc-dark">
                {p.lessonsCompleted === p.lessonsTotal ? "You’ve heard every lesson" : "Choose a lesson to begin"}
              </div>
              <div className="mt-1 text-[12.5px] text-nc-muted">You can listen to any lesson you’ve finished again at any time.</div>
            </NcCard>
          )}

          {lessonCharts.map((c) => (
            <NcCard key={c.key} className="!p-4 sm:!p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Presentation className="h-4 w-4 text-plum" />
                <span className="text-[13.5px] font-semibold text-nc-dark">Flip chart {c.number} for this lesson</span>
                {c.studied && <span className="rounded-full bg-nc-green-lt px-2 py-0.5 text-[11px] font-semibold text-nc-green">Studied</span>}
                <span className="text-[12px] text-nc-muted">Look it over while you listen; your trainer draws or prepares this on paper.</span>
              </div>
              <FlipChartSheet chartKey={c.key} courseKey={me.course.key} lessons={c.lessons} lockedLessons={lockedIds}
                onOpenLesson={openLessonById} onReport={onChartReport} />
            </NcCard>
          ))}

          <FlipChartsCard charts={charts} onOpen={(c) => (c.locked
            ? toast({ title: "This flip chart opens with its lesson.", description: `Listen up to ${c.lessons[0]?.code ?? "its lesson"} first.` })
            : setChartOpen(c.key))} />

          <AssessmentCard me={me} onStart={() => setQuizOpen(true)} />
          <ReflectionCard me={me} onSaved={load} />
          {(me.course.requirePractical || me.practical) && <PracticalCard me={me} />}
        </div>

        <NcCard className="h-fit !p-0 lg:sticky lg:top-4">
          <div className="border-b border-border px-5 py-4">
            <div className="text-[14px] font-semibold text-nc-dark">Course outline</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-plum transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {me.sections.map((s: any) => {
              const open = openSection === s._id;
              return (
                <div key={s._id} className="border-b border-border/70 last:border-0">
                  <button
                    className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-muted/40"
                    onClick={() => setOpenSection(open ? null : s._id)}
                    aria-expanded={open}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-nc-dark">{s.title}</div>
                      <div className="text-[11.5px] text-nc-muted">{s.completed}/{s.total} lessons</div>
                    </div>
                    {s.completed === s.total
                      ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-nc-green" />
                      : <ChevronDown className={cn("h-4 w-4 flex-shrink-0 text-nc-muted transition-transform", open && "rotate-180")} />}
                  </button>
                  {open && (
                    <ul className="pb-2">
                      {s.lessons.map((l: any) => (
                        <li key={l._id}>
                          <button
                            onClick={() => selectLesson(l)}
                            className={cn(
                              "flex w-full items-center gap-2.5 px-5 py-2 text-left text-[12.5px]",
                              l._id === lessonId ? "bg-teal-lt" : "hover:bg-muted/40",
                              l.locked && "cursor-not-allowed opacity-55",
                            )}
                          >
                            <LessonIcon l={l} />
                            <span className="w-12 flex-shrink-0 font-mono text-[11px] text-nc-muted">{l.code}</span>
                            <span {...titleProps(l.title)} className="min-w-0 flex-1 truncate text-start text-nc-dark">{l.title}</span>
                            <span className="flex-shrink-0 text-[11px] text-nc-muted">{clock(l.durationSec)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </NcCard>
      </div>

      {quizOpen && <QuizModal me={me} onClose={() => setQuizOpen(false)} onDone={load} />}
      {chartOpen && (() => {
        const c = charts.find((x) => x.key === chartOpen);
        return c && (
          <FlipChartModal title={`Flip chart ${c.number} · ${c.module}`} onClose={() => setChartOpen(null)}>
            <FlipChartSheet chartKey={c.key} courseKey={me.course.key} lessons={c.lessons} lockedLessons={lockedIds}
              onOpenLesson={openLessonById} onReport={onChartReport} />
          </FlipChartModal>
        );
      })()}
    </div>
  );
}

function PageHead({ course, assignment }: { course?: any; assignment?: any }) {
  return (
    <div className="mb-6">
      <h2 className="font-serif text-[26px] text-nc-dark">{course?.title ?? "Asaas Murabbi Training"}</h2>
      <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
        {course?.trainer ? `Audio course by ${course.trainer}. ` : ""}
        Listen to every lesson, pass the assessment and share your reflection to earn your Tier 1 certificate
        and the {course?.badge ?? "Certified Asaas Murabbi"} badge.
        {assignment?.dueDate && <> Please finish by <span className="font-semibold text-nc-dark">{formatDate(assignment.dueDate)}</span>.</>}
      </p>
      {assignment?.note && <p className="mt-2 max-w-2xl rounded-md bg-muted px-3 py-2 text-[12.5px] text-nc-dark">{assignment.note}</p>}
    </div>
  );
}

function LessonIcon({ l }: { l: any }) {
  if (l.completed) return <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-nc-green" />;
  if (l.locked) return <Lock className="h-3.5 w-3.5 flex-shrink-0 text-nc-muted" />;
  if (l.percent > 0) {
    return (
      <span className="relative h-4 w-4 flex-shrink-0 rounded-full" title={`${l.percent}% heard`}
        style={{ background: `conic-gradient(hsl(var(--teal)) ${l.percent * 3.6}deg, hsl(var(--muted)) 0)` }}>
        <span className="absolute inset-[3px] rounded-full bg-card" />
      </span>
    );
  }
  return <PlayCircle className="h-4 w-4 flex-shrink-0 text-teal" />;
}

// ── Player with listening tracking ──────────────────────────────────────────

// ── Assessment, reflection, practical ───────────────────────────────────────

function FlipChartsCard({ charts, onOpen }: { charts: any[]; onOpen: (c: any) => void }) {
  if (!charts.length) return null;
  const studied = charts.filter((c) => c.studied).length;
  return (
    <NcCard>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dim">
          <Presentation className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-nc-dark">Flip charts</div>
          <div className="text-[12px] text-nc-muted">
            The {charts.length} charts the trainer uses, drawn as they look on paper. {studied} of {charts.length} studied.
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {charts.map((c) => (
          <button key={c.key} onClick={() => onOpen(c)}
            className={cn("flex items-center gap-3 rounded-md border border-border px-3 py-2 text-left hover:border-teal hover:bg-teal-lt/40",
              c.locked && "opacity-60")}>
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-plum/10 font-semibold text-plum text-[12.5px]">{c.number}</span>
            <span className="min-w-0 flex-1">
              <span dir="rtl" lang="ur" className="urdu block truncate text-start text-[14px] leading-[1.9] text-nc-dark">{c.title}</span>
              <span className="block truncate text-[11px] text-nc-muted">{c.module} · {c.lessons.map((l: any) => l.code).join(", ")}</span>
            </span>
            {c.studied ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-nc-green" aria-label="Studied" />
              : c.locked ? <Lock className="h-3.5 w-3.5 flex-shrink-0 text-nc-muted" aria-label="Locked" /> : null}
          </button>
        ))}
      </div>
    </NcCard>
  );
}

function FlipChartModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-3xl">
        <div className="mb-2 flex items-center justify-between text-white">
          <span className="text-[13px] font-semibold">{title}</span>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 hover:bg-white/25" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AssessmentCard({ me, onStart }: { me: any; onStart: () => void }) {
  const a = me.assessment;
  return (
    <NcCard>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl",
            a.passed ? "bg-nc-green-lt text-nc-green" : "bg-teal/15 text-teal")}>
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-nc-dark">Assessment</div>
            <div className="text-[12px] text-nc-muted">
              {a.passed ? `Passed with ${a.best}%.`
                : !a.unlocked ? `Opens once you’ve heard all ${me.progress.lessonsTotal} lessons.`
                : a.retryAt ? `You’ve used today’s attempts. Try again after ${new Date(a.retryAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.`
                : `${a.questionCount} questions · pass mark ${me.course.passingScore}% · ${a.attemptsLeftToday} attempt${a.attemptsLeftToday === 1 ? "" : "s"} left today${a.best ? ` · best so far ${a.best}%` : ""}`}
            </div>
          </div>
        </div>
        {a.unlocked && !a.passed && !a.retryAt && (
          <button className="btn-primary !py-2 text-[12.5px]" onClick={onStart}>Start assessment</button>
        )}
      </div>
    </NcCard>
  );
}

function ReflectionCard({ me, onSaved }: { me: any; onSaved: () => void }) {
  const { toast } = useToast();
  const r = me.reflection;
  const [text, setText] = useState(r.text ?? "");
  const [saving, setSaving] = useState(false);
  const editable = r.unlocked && r.status !== "approved" && r.status !== "submitted";
  const [editing, setEditing] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const res = await courseService.reflect(ASAAS_KEY, text);
      toast({ title: apiMessage(res, "Reflection submitted.") });
      setEditing(false);
      onSaved();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not submit your reflection.") });
    } finally {
      setSaving(false);
    }
  }

  const statusChip = r.status && (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold",
      r.status === "approved" ? "bg-nc-green-lt text-nc-green" : r.status === "revision" ? "bg-nc-amber-lt text-nc-amber" : "bg-teal-lt text-teal")}>
      {r.status === "approved" ? "Approved" : r.status === "revision" ? "Revision requested" : "Waiting for review"}
    </span>
  );

  return (
    <NcCard>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-plum/10 text-plum">
          <NotebookPen className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-nc-dark">Written reflection {statusChip}</div>
          <div className="text-[12px] text-nc-muted">
            {r.unlocked ? "An admin reads and approves it." : `Opens once you’ve heard all ${me.progress.lessonsTotal} lessons.`}
          </div>
        </div>
      </div>
      {r.unlocked && (
        <>
          {r.prompt && (
            <p dir={hasUrdu(r.prompt) ? "rtl" : "ltr"} className={cn("mb-3 rounded-md bg-muted px-4 py-3 text-nc-dark",
              hasUrdu(r.prompt) ? "urdu text-right text-[15px] leading-[2.2]" : "text-[13px]")}>
              {r.prompt}
            </p>
          )}
          {r.status === "revision" && r.feedback && (
            <p className="mb-3 rounded-md border border-nc-amber/30 bg-nc-amber-lt px-3 py-2 text-[12.5px] text-nc-dark">
              <span className="font-semibold">Feedback:</span> {r.feedback}
            </p>
          )}
          {editable || editing ? (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                dir="auto"
                rows={8}
                aria-label="Your reflection"
                placeholder="Write in Urdu or English…"
                className="w-full resize-y rounded-md border border-input bg-card px-3.5 py-2.5 text-[14px] leading-relaxed focus:border-primary focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className={cn("text-[11.5px]", text.trim().length < r.minChars ? "text-nc-muted" : "text-nc-green")}>
                  {text.trim().length} / {r.minChars} characters minimum
                </span>
                <button className="btn-primary !py-2 text-[12.5px]" disabled={saving || text.trim().length < r.minChars} onClick={submit}>
                  {saving ? "Submitting…" : r.status === "revision" ? "Submit revision" : "Submit reflection"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p dir="auto" className="whitespace-pre-wrap rounded-md border border-border px-4 py-3 text-[13.5px] leading-relaxed text-nc-dark">{r.text}</p>
              {r.status === "submitted" && (
                <button className="btn-outline mt-2 !py-1.5 text-[12px]" onClick={() => setEditing(true)}>Edit before review</button>
              )}
            </>
          )}
        </>
      )}
    </NcCard>
  );
}

function PracticalCard({ me }: { me: any }) {
  const pr = me.practical;
  return (
    <NcCard>
      <div className="text-[14px] font-semibold text-nc-dark">Practical (observed circle)</div>
      {!pr ? (
        <p className="mt-1 text-[12.5px] text-nc-muted">
          A trainer will observe you leading a circle and score six skills. Your score will appear here.
        </p>
      ) : (
        <>
          <div className="mt-1 flex items-center gap-2 text-[12.5px] text-nc-muted">
            Score <span className="font-semibold text-nc-dark">{pr.total}/18</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", BAND_META[pr.band]?.cls)}>{BAND_META[pr.band]?.label}</span>
          </div>
          <ul className="mt-3 space-y-1.5 text-[12.5px]">
            {pr.criteria.map((c: string, i: number) => (
              <li key={c} className="flex items-center justify-between gap-3">
                <span className="text-nc-dark">{c}</span>
                <span className="font-semibold text-nc-dark">{pr.scores[i]}/3</span>
              </li>
            ))}
          </ul>
          {pr.notes && <p className="mt-3 rounded-md bg-muted px-3 py-2 text-[12.5px] text-nc-dark">{pr.notes}</p>}
        </>
      )}
    </NcCard>
  );
}

function QuizModal({ me, onClose, onDone }: { me: any; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<any[] | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    courseService.assessment(ASAAS_KEY)
      .then((r) => {
        const d = unwrap(r);
        setQuestions(d.questions);
        setAnswers(d.questions.map(() => null));
      })
      .catch((err) => { toast({ variant: "destructive", title: apiError(err, "Could not open the assessment.") }); onClose(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const answered = answers.filter((a) => a != null).length;

  async function submit() {
    setSaving(true);
    try {
      const r = unwrap(await courseService.submit(ASAAS_KEY, answers as number[]));
      setResult(r);
      onDone();
      document.getElementById("quiz-top")?.scrollIntoView();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not submit your answers.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/45 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Assessment">
      <div className="relative w-full max-w-3xl rounded-lg bg-card p-5 sm:p-8">
        <div id="quiz-top" />
        <button className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-nc-muted hover:bg-teal-lt" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <div className="font-serif text-[22px] text-nc-dark">{me.course.title}: assessment</div>
        <div className="mb-6 text-[13px] text-nc-muted">Choose the best answer for each question. Pass mark {me.course.passingScore}%.</div>

        {result && (
          <div className={cn("mb-6 rounded-lg border px-5 py-4", result.passed ? "border-nc-green/30 bg-nc-green-lt" : "border-nc-amber/30 bg-nc-amber-lt")}>
            <div className="text-[16px] font-semibold text-nc-dark">
              {result.passed ? "MashaAllah, you passed" : "Not this time"}: {result.scorePercent}% ({result.correct}/{result.total})
            </div>
            <div className="mt-1 text-[12.5px] text-nc-dark">
              {result.passed
                ? result.certificate ? "Your certificate has been issued." : "Submit your reflection (if you haven’t already). Your certificate is issued once it’s approved."
                : `${result.attemptsLeftToday ? `${result.attemptsLeftToday} attempt${result.attemptsLeftToday === 1 ? "" : "s"} left today.` : "No attempts left today."} Listen again to the lessons you were unsure about.`}
            </div>
            <button className="btn-outline mt-3 !py-1.5 text-[12px]" onClick={onClose}>Close</button>
          </div>
        )}

        {!questions ? (
          <div className="py-16 text-center text-sm text-nc-muted">Loading…</div>
        ) : (
          <ol className="space-y-6">
            {questions.map((q, i) => {
              const review = result?.review?.[i];
              return (
                <li key={i} className="rounded-lg border border-border p-4">
                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-nc-muted">Question {i + 1}{q.module ? ` · ${q.module}` : ""}</div>
                  <p dir="auto" className={cn("text-nc-dark", hasUrdu(q.question) ? "urdu text-right text-[16px] leading-[2.2]" : "text-[14px] font-medium")}>{q.question}</p>
                  <div className="mt-3 space-y-2">
                    {q.options.map((o: string, j: number) => {
                      const picked = answers[i] === j;
                      const right = review && review.correctIndex === j;
                      const wrong = review && picked && !right;
                      return (
                        <label key={j} dir="auto"
                          className={cn("flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2",
                            right ? "border-nc-green bg-nc-green-lt" : wrong ? "border-nc-red bg-nc-red-lt" : picked ? "border-teal bg-teal-lt" : "border-border hover:bg-muted/50",
                            result && "cursor-default")}>
                          <input type="radio" name={`q${i}`} checked={picked} disabled={!!result}
                            onChange={() => setAnswers((a) => a.map((v, k) => (k === i ? j : v)))}
                            className="mt-2 accent-[hsl(var(--teal))]" />
                          <span className={cn("text-nc-dark", hasUrdu(o) ? "urdu text-[15px] leading-[2.1]" : "text-[13.5px]")}>{o}</span>
                        </label>
                      );
                    })}
                  </div>
                  {review?.explanation && (
                    <p dir="auto" className={cn("mt-3 rounded-md bg-muted px-3 py-2 text-nc-dark", hasUrdu(review.explanation) ? "urdu text-[14px] leading-[2.1]" : "text-[12.5px]")}>
                      {review.explanation}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        {questions && !result && (
          <div className="sticky bottom-0 -mx-5 mt-6 flex items-center justify-between gap-3 border-t border-border bg-card px-5 py-3 sm:-mx-8 sm:px-8">
            <span className="text-[12.5px] text-nc-muted">{answered} of {questions.length} answered</span>
            <button className="btn-primary !py-2 text-[13px]" disabled={saving || answered < questions.length} onClick={submit}>
              {saving ? "Submitting…" : "Submit answers"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
