import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Award, CheckCircle2, ChevronDown, Headphones, Lock, NotebookPen, Printer, RotateCcw, Sparkles, Star, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PARENT_COURSE_KEY, parentCourseService } from "@/services/api.service";
import NcCard from "@/components/shared/NcCard";
import { LessonPlayer } from "@/components/course/LessonPlayer";
import FlipChartSheet from "@/components/course/FlipChartSheet";
import ParentCertificate from "@/components/course/ParentCertificate";
import { cn } from "@/lib/utils";
import { apiError, unwrap } from "@/lib/finance";
import { clock } from "@/lib/course";

// Asaas for Parents: the parent's own course page (Urdu first). Only the
// parent and admins see these answers; never murabbis.

const urDate = (d: string | null | undefined) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString("ur-PK", { day: "numeric", month: "long" }) : "";

const ur = "urdu leading-[2.1]";

export default function ParentCoursePage() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<{ status?: number; msg: string } | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<string | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const d = unwrap<any>(await parentCourseService.me());
      setData(d);
      setError(null);
      return d;
    } catch (err: any) {
      setError({ status: err?.response?.status, msg: apiError(err, "صفحہ نہیں کھل سکا۔ تھوڑی دیر بعد دوبارہ کوشش کریں۔") });
      return null;
    }
  }, []);

  useEffect(() => {
    document.title = "والدین کا Asaas · Noor Circles";
    load().then((d) => {
      if (!d) return;
      // Open the first section that still has something to do.
      const s = d.sections.find((x: any) => x.open && x.completed < x.total) ?? d.sections.find((x: any) => x.open);
      if (s) setOpenKey(s.key);
    });
  }, [load]);

  const openLessons = useMemo(
    () => (data?.sections ?? []).flatMap((s: any) => s.lessons.filter((l: any) => !l.locked)),
    [data],
  );
  const current = openLessons.find((l: any) => l._id === playing);
  const nextLesson = current ? openLessons[openLessons.indexOf(current) + 1] : undefined;
  const charts = (data?.flipCharts ?? []).filter((c: any) => c.lessons.some((l: any) => l._id === playing));

  function play(id: string, auto = true) {
    setPlaying(id);
    setAutoPlay(auto);
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl" lang="ur">
      <header className="bg-plum px-4 pb-10 pt-5 text-white sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-3">
            <img src="/brand/noor-circles-logo-horizontal-white.svg" alt="Noor Circles" className="h-9" />
            <Link to="/parent" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-white/20">
              <ArrowRight className="h-3.5 w-3.5" /> <span className="urdu leading-[1.6]">فیملی پیج</span>
            </Link>
          </div>
          <h1 className="urdu mt-5 text-[28px] leading-[2] sm:text-[34px]">والدین کا Asaas</h1>
          {data && (
            <p className="urdu text-[15px] leading-[2] text-white/85">
              السلام علیکم، {data.parent.name.split(" ")[0]}۔ بچے کا پہلا مربی… اس کا گھر ہے۔
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto -mt-6 max-w-3xl space-y-4 px-4 pb-12 sm:px-6">
        {error ? (
          <NcCard className="py-10 text-center">
            <Lock className="mx-auto mb-3 h-8 w-8 text-pale" />
            <p className={cn(ur, "text-[15px] text-nc-dark")}>
              {error.status === 403
                ? "ابھی آپ کے لیے Asaas نہیں کھولا گیا۔ Noor Circles team سے رابطہ کریں، وہ آپ کے account میں اسے کھول دیں گے۔"
                : error.msg}
            </p>
          </NcCard>
        ) : !data ? (
          <NcCard><div className={cn(ur, "py-12 text-center text-[14px] text-nc-muted")}>کھل رہا ہے…</div></NcCard>
        ) : (
          <>
            <Summary data={data} />

            {current && (
              <div ref={playerRef} className="scroll-mt-4 space-y-3" dir="ltr">
                <div className="flex justify-end">
                  <button className="inline-flex items-center gap-1 text-[12.5px] text-nc-muted hover:text-nc-dark" onClick={() => setPlaying(null)}>
                    <X className="h-3.5 w-3.5" /> <span className="urdu leading-[1.8]">بند کریں</span>
                  </button>
                </div>
                <LessonPlayer
                  key={current._id}
                  lessonId={current._id}
                  nextLesson={nextLesson}
                  threshold={data.course.completionThreshold}
                  autoPlay={autoPlay}
                  ur
                  onProgress={load}
                  onNext={(auto) => nextLesson && play(nextLesson._id, auto)}
                />
                {charts.map((c: any) => (
                  <ChartBlock key={c.key} chart={c} onOpenLesson={(id) => play(id)} />
                ))}
              </div>
            )}

            {data.sections.map((s: any) => (
              <SectionCard
                key={s.key}
                s={s}
                data={data}
                open={openKey === s.key}
                playing={playing}
                onToggle={() => setOpenKey((k) => (k === s.key ? null : s.key))}
                onPlay={play}
                onQuiz={setQuiz}
                onChanged={load}
              />
            ))}

            <p className={cn(ur, "px-2 text-center text-[12.5px] text-nc-muted")}>{data.privacy}</p>
          </>
        )}
      </main>

      {quiz && data && (
        <QuizModal
          quizKey={quiz}
          onClose={() => setQuiz(null)}
          onDone={() => { load(); }}
          onError={(m) => toast({ variant: "destructive", title: m })}
        />
      )}
    </div>
  );
}

// ── Top summary ─────────────────────────────────────────────────────────────

function Summary({ data }: { data: any }) {
  const fortnight = Math.min(8, Math.floor(data.day / 14) + 1);
  const pct = data.progress.lessonsTotal ? Math.round((data.progress.lessonsCompleted / data.progress.lessonsTotal) * 100) : 0;
  return (
    <NcCard className="!p-4 sm:!p-5">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="font-serif text-[24px] text-nc-dark" dir="ltr">{data.progress.lessonsCompleted}/{data.progress.lessonsTotal}</div>
          <div className={cn(ur, "text-[12.5px] text-nc-muted")}>clips سنی</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 font-serif text-[24px] text-nc-dark"><Star className="h-4 w-4 text-gold" />{data.points}</div>
          <div className={cn(ur, "text-[12.5px] text-nc-muted")}>points</div>
        </div>
        <div>
          <div className="font-serif text-[24px] text-nc-dark">{data.allOpen ? "✓" : fortnight}</div>
          <div className={cn(ur, "text-[12.5px] text-nc-muted")}>{data.allOpen ? "سب modules کھلے" : `fortnight (دن ${data.day + 1})`}</div>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" dir="rtl">
        <div className="h-full rounded-full bg-plum" style={{ width: `${pct}%` }} />
      </div>
      <p className={cn(ur, "mt-2 text-[13px] text-nc-muted")}>
        ہر fortnight کے پہلے دن ایک نیا module کھلتا ہے۔ Clips جب وقت ملے سنیں؛ ہر clip پوری سنیں، تبھی مکمل گنی جائے گی۔
      </p>
    </NcCard>
  );
}

// ── Section (Welcome, Module 1–8, Closing) ─────────────────────────────────

function SectionCard({ s, data, open, playing, onToggle, onPlay, onQuiz, onChanged }: {
  s: any; data: any; open: boolean; playing: string | null;
  onToggle: () => void; onPlay: (id: string) => void; onQuiz: (key: string) => void; onChanged: () => void;
}) {
  const done = s.completed === s.total;
  return (
    <section className={cn("overflow-hidden rounded-xl border bg-card shadow-nc", s.open ? "border-border" : "border-border/60 opacity-80")}>
      <button className="flex w-full items-center gap-3 px-4 py-3 text-right sm:px-5" onClick={onToggle} aria-expanded={open}>
        <span className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full",
          done ? "bg-nc-green-lt text-nc-green" : s.open ? "bg-plum/10 text-plum" : "bg-muted text-nc-muted")}>
          {done ? <CheckCircle2 className="h-5 w-5" /> : s.open ? <Headphones className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn(ur, "block text-[17px] text-nc-dark")}>{s.titleUr}</span>
          <span className="block truncate text-[11.5px] text-nc-muted" dir="ltr" style={{ textAlign: "right" }}>{s.title}</span>
        </span>
        <span className={cn(ur, "flex-shrink-0 text-[12.5px] text-nc-muted")}>
          {s.open ? <span dir="ltr">{s.completed}/{s.total}</span> : <>کھلے گا: {urDate(s.opensOn)}</>}
        </span>
        <ChevronDown className={cn("h-4 w-4 flex-shrink-0 text-nc-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border px-4 pb-5 pt-3 sm:px-5">
          {s.meta && <p className={cn(ur, "text-[12.5px] text-nc-muted")}>{s.meta}</p>}
          {!s.open && (
            <p className={cn(ur, "rounded-md bg-muted/60 px-3 py-2 text-[13.5px] text-nc-dark")}>
              یہ module {urDate(s.opensOn)} کو کھلے گا، ان شاء اللہ۔
            </p>
          )}
          <ul className="space-y-1.5">
            {s.lessons.map((l: any) => (
              <li key={l._id}>
                <button
                  disabled={l.locked || !l.hasAudio}
                  onClick={() => onPlay(l._id)}
                  className={cn("flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-right transition-colors",
                    playing === l._id ? "border-plum bg-plum/5" : "border-border hover:border-plum/50",
                    (l.locked || !l.hasAudio) && "cursor-not-allowed opacity-60 hover:border-border")}
                >
                  <span className="w-12 flex-shrink-0 font-mono text-[11px] text-nc-muted" dir="ltr">{l.code}</span>
                  <span className={cn(ur, "min-w-0 flex-1 text-[14.5px] text-nc-dark")}>{l.title}</span>
                  <span className="flex-shrink-0 text-[11.5px] text-nc-muted" dir="ltr">{clock(l.durationSec)}</span>
                  {l.completed ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-nc-green" aria-label="مکمل" />
                    : l.locked ? <Lock className="h-3.5 w-3.5 flex-shrink-0 text-nc-muted" />
                    : !l.hasAudio ? <span className={cn(ur, "flex-shrink-0 text-[11px] text-nc-muted")}>جلد</span>
                    : l.percent > 0 ? <span className="flex-shrink-0 text-[11px] text-teal" dir="ltr">{l.percent}%</span>
                    : <Headphones className="h-4 w-4 flex-shrink-0 text-plum" />}
                </button>
              </li>
            ))}
          </ul>

          {s.key === "welcome" && <SelfCheckBlock data={data} stage="start" onChanged={onChanged} />}
          {s.quiz && s.open && <QuizBlock q={s.quiz} onStart={() => onQuiz(s.quiz.key)} />}
          {s.target && s.open && <TargetCard t={s.target} onChanged={onChanged} />}
          {s.key === "closing" && s.open && <ClosingBlock data={data} onQuiz={onQuiz} onChanged={onChanged} />}
        </div>
      )}
    </section>
  );
}

// ── Flip chart under the playing clip ──────────────────────────────────────

/** Prints only this chart: everything else is hidden while printing. */
function printOnly(el: HTMLElement | null) {
  if (!el) return;
  const style = document.createElement("style");
  style.textContent = `@media print {
    body * { visibility: hidden !important; }
    .pfc-print-target, .pfc-print-target * { visibility: visible !important; }
    .pfc-print-target { position: absolute; inset: 0 auto auto 0; width: 100%; }
  }`;
  document.head.appendChild(style);
  el.classList.add("pfc-print-target");
  const done = () => { el.classList.remove("pfc-print-target"); style.remove(); window.removeEventListener("afterprint", done); };
  window.addEventListener("afterprint", done);
  window.print();
  setTimeout(done, 1000);
}

function ChartBlock({ chart, onOpenLesson }: { chart: any; onOpenLesson: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2" dir="rtl">
        <span className={cn(ur, "text-[13px] text-nc-muted")}>Flip chart {chart.number}</span>
        {chart.printable && (
          <button className="btn-outline inline-flex items-center gap-1.5 !py-1 text-[12px]" onClick={() => printOnly(ref.current)}>
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        )}
      </div>
      <div ref={ref}>
        <FlipChartSheet
          set="parent"
          chartKey={chart.key}
          courseKey={PARENT_COURSE_KEY}
          lessons={chart.lessons}
          onOpenLesson={onOpenLesson}
          lessonsLabel="اس clip میں"
          listenLabel="سنیں"
        />
      </div>
    </div>
  );
}

// ── Knowledge check ─────────────────────────────────────────────────────────

function QuizBlock({ q, onStart, final }: { q: any; onStart: () => void; final?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <NotebookPen className={cn("h-5 w-5 flex-shrink-0", q.passed ? "text-nc-green" : "text-plum")} />
        <div className="min-w-0 flex-1">
          <div className={cn(ur, "text-[15px] font-semibold text-nc-dark")}>{final ? "آخری knowledge check" : "Knowledge check"}</div>
          <div className={cn(ur, "text-[12.5px] text-nc-muted")}>
            {q.passed ? <>ماشاءاللہ، پاس! ({q.best}/{q.questions})</>
              : !q.open ? (final ? "آخری closing clip سننے کے بعد کھلے گا۔" : `کھلے گا: ${urDate(q.opensOn)}`)
              : q.attemptsLeft === 0 ? "دونوں کوششیں ہو گئیں۔ کوئی بات نہیں، اپنے مربی یا Noor Circles team سے بات کریں۔"
              : <>{q.questions} سوال · پاس ہونے کے لیے {q.passMark} · {q.attempts ? "ایک بار دوبارہ دے سکتے ہیں" : "یہ امتحان نہیں، ہر جواب سمجھایا جائے گا"}</>}
          </div>
        </div>
        {q.open && !q.passed && q.attemptsLeft > 0 && (
          <button className="btn-primary !py-1.5 text-[12.5px]" onClick={onStart}>
            <span className="urdu leading-[1.8]">{q.attempts ? "دوبارہ کوشش" : "شروع کریں"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

function QuizModal({ quizKey, onClose, onDone, onError }: { quizKey: string; onClose: () => void; onDone: () => void; onError: (m: string) => void }) {
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const start = useCallback(async () => {
    setResult(null);
    try {
      const q = unwrap<any>(await parentCourseService.quiz(quizKey));
      setQuiz(q);
      setAnswers(q.questions.map(() => null));
      setLoadErr(null);
    } catch (err) {
      setLoadErr(apiError(err, "Knowledge check نہیں کھل سکا۔"));
    }
  }, [quizKey]);

  useEffect(() => { start(); }, [start]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);

  async function submit() {
    setBusy(true);
    try {
      const r = unwrap<any>(await parentCourseService.submitQuiz(quizKey, answers as number[]));
      setResult(r);
      onDone();
      document.getElementById("quiz-top")?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      onError(apiError(err, "جواب جمع نہیں ہو سکے۔"));
    } finally {
      setBusy(false);
    }
  }

  const all = answers.length > 0 && answers.every((a) => a !== null);
  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:p-6" role="dialog" aria-modal="true" dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-xl bg-card p-4 sm:p-6">
        <div id="quiz-top" className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className={cn(ur, "text-[19px] text-plum")}>{quizKey === "final" ? "آخری knowledge check" : `Module ${quizKey.slice(1)}: knowledge check`}</div>
            {quiz && !result && <div className={cn(ur, "text-[12.5px] text-nc-muted")}>کوشش {quiz.attempt} / {quiz.maxAttempts} · پاس: {quiz.passMark} / {quiz.questions.length}</div>}
          </div>
          <button className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted hover:bg-teal-lt" onClick={onClose} aria-label="بند کریں"><X className="h-4 w-4" /></button>
        </div>

        {loadErr ? <p className={cn(ur, "py-6 text-center text-[14px] text-nc-dark")}>{loadErr}</p>
          : !quiz ? <p className={cn(ur, "py-8 text-center text-[14px] text-nc-muted")}>کھل رہا ہے…</p>
          : (
            <>
              {result && (
                <div className={cn("mb-4 rounded-lg p-4 text-center", result.passed ? "bg-nc-green-lt" : "bg-gold/10")}>
                  <div className="font-serif text-[30px] text-nc-dark" dir="ltr">{result.correct} / {result.total}</div>
                  <div className={cn(ur, "text-[15px] text-nc-dark")}>
                    {result.passed ? "ماشاءاللہ! آپ پاس ہو گئے۔ Points مل گئے۔"
                      : result.retakeLeft ? `پاس ہونے کے لیے ${result.passMark} چاہیے تھے۔ نیچے صحیح جواب دیکھ لیں، پھر ایک بار دوبارہ کوشش کر سکتے ہیں۔`
                      : "اس بار پاس نہیں ہو سکے۔ نیچے صحیح جواب اور وضاحت پڑھ لیں۔"}
                  </div>
                  {result.certificate && <div className={cn(ur, "mt-1 text-[14px] text-plum")}>آپ کا certificate تیار ہے!</div>}
                  {result.retakeLeft && (
                    <button className="btn-primary mx-auto mt-3 inline-flex items-center gap-1.5 !py-1.5 text-[12.5px]" onClick={start}>
                      <RotateCcw className="h-3.5 w-3.5" /> <span className="urdu leading-[1.8]">دوبارہ کوشش</span>
                    </button>
                  )}
                </div>
              )}
              <ol className="space-y-4">
                {quiz.questions.map((q: any, i: number) => {
                  const rev = result?.review?.[i];
                  return (
                    <li key={i} className="rounded-lg border border-border p-3">
                      <p className={cn(ur, "text-[15.5px] font-semibold text-nc-dark")}><span className="ml-1 text-gold-dim">{i + 1}۔</span>{q.question}</p>
                      <div className="mt-2 space-y-1.5">
                        {q.options.map((o: string, j: number) => {
                          const chosen = answers[i] === j;
                          const right = rev && rev.correctIndex === j;
                          const wrongPick = rev && chosen && !right;
                          return (
                            <label key={j} className={cn("flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-1.5",
                              right ? "border-nc-green bg-nc-green-lt" : wrongPick ? "border-nc-red/50 bg-nc-red/5" : chosen ? "border-plum bg-plum/5" : "border-border",
                              rev && "cursor-default")}>
                              <input type="radio" name={`q${i}`} checked={chosen} disabled={!!rev} className="mt-2 accent-[hsl(var(--teal))]"
                                onChange={() => setAnswers((a) => a.map((x, k) => (k === i ? j : x)))} />
                              <span className={cn(ur, "flex-1 text-[14.5px] text-nc-dark")}>{o}{right && " ✓"}</span>
                            </label>
                          );
                        })}
                      </div>
                      {rev && <p className={cn(ur, "mt-2 rounded-md bg-gold/10 px-3 py-1.5 text-[13.5px] text-nc-dark")}><b>وضاحت:</b> {rev.explanation}</p>}
                    </li>
                  );
                })}
              </ol>
              {!result && (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className={cn(ur, "text-[12.5px] text-nc-muted")}>{answers.filter((a) => a !== null).length} / {answers.length} جواب</span>
                  <button className="btn-primary !py-2 text-[13px]" disabled={!all || busy} onClick={submit}>
                    <span className="urdu leading-[1.8]">{busy ? "جمع ہو رہا ہے…" : "جواب جمع کریں"}</span>
                  </button>
                </div>
              )}
              {result && <button className="btn-outline mx-auto mt-4 flex !py-1.5 text-[12.5px]" onClick={onClose}><span className="urdu leading-[1.8]">بند کریں</span></button>}
            </>
          )}
      </div>
    </div>
  );
}

// ── Target card ─────────────────────────────────────────────────────────────

function TargetCard({ t, onChanged }: { t: any; onChanged: () => void }) {
  const { toast } = useToast();
  const [ticks, setTicks] = useState<number[]>(t.ticks);
  const [lighter, setLighter] = useState<boolean>(t.lighter);
  const [met, setMet] = useState<boolean>(t.met);
  useEffect(() => { setTicks(t.ticks); setLighter(t.lighter); setMet(t.met); }, [t]);
  const need = lighter && t.lighterNeeded ? t.lighterNeeded : t.needed;

  async function toggle(slot: number) {
    const on = !ticks.includes(slot);
    const before = ticks;
    setTicks(on ? [...ticks, slot] : ticks.filter((x) => x !== slot));
    try {
      const r = unwrap<any>(await parentCourseService.tick(t.module, slot, on));
      setTicks(r.ticks);
      if (r.met && !met) { toast({ title: "Target پورا! ماشاءاللہ" }); onChanged(); }
      setMet(r.met);
    } catch (err) {
      setTicks(before);
      toast({ variant: "destructive", title: apiError(err, "Tick محفوظ نہیں ہو سکا۔") });
    }
  }

  async function toggleLighter() {
    try {
      const r = unwrap<any>(await parentCourseService.lighter(t.module, !lighter));
      setLighter(r.lighter);
      setMet(r.met);
      if (r.met && !met) onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "تبدیلی محفوظ نہیں ہو سکی۔") });
    }
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-gold/70 bg-gold/[0.06] p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold tracking-wide text-gold-dim" dir="ltr" style={{ textAlign: "right" }}>TARGET CARD</div>
          <div className={cn(ur, "text-[16px] font-semibold text-plum")}>{t.title}</div>
        </div>
        {met && <span className={cn(ur, "rounded-full bg-nc-green-lt px-3 text-[12.5px] text-nc-green")}>✓ Target پورا!</span>}
      </div>
      <p className={cn(ur, "mt-1 text-[14px] text-nc-dark")}>{t.what}</p>
      <p className={cn(ur, "mt-2 text-[13px] text-nc-muted")}>
        یہ boxes آپ نہیں، آپ کا بچہ tick کرے گا: <b className="text-nc-dark">"{t.tickLabel}"</b>
      </p>
      <div className={cn("mt-3 grid gap-1.5", t.kind === "daily" ? "grid-cols-7" : "grid-cols-4 sm:grid-cols-8")}>
        {Array.from({ length: t.slots }, (_, i) => {
          const on = ticks.includes(i);
          const future = t.kind === "daily" && t.today != null && i > t.today;
          const today = t.kind === "daily" && t.today === i;
          return (
            <button key={i} disabled={future} onClick={() => toggle(i)} aria-pressed={on}
              aria-label={t.kind === "daily" ? `دن ${i + 1}` : `${i + 1}`}
              className={cn("flex h-10 flex-col items-center justify-center rounded-md border text-[11px] transition-colors",
                on ? "border-nc-green bg-nc-green text-white" : "border-border bg-card text-nc-muted hover:border-plum",
                today && !on && "border-2 border-plum text-plum",
                future && "cursor-not-allowed opacity-40 hover:border-border")}>
              {on ? <CheckCircle2 className="h-4 w-4" /> : null}
              <span dir="ltr">{t.kind === "daily" ? i + 1 : on ? "" : i + 1}</span>
            </button>
          );
        })}
      </div>
      <div className={cn(ur, "mt-2 text-[12.5px] text-nc-muted")}>
        <span dir="ltr">{ticks.length}</span> / {need} {t.kind === "daily" ? "دن (چودہ میں سے)" : ""}
      </div>
      {t.lighterNeeded ? (
        <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-md bg-card px-3 py-2">
          <input type="checkbox" checked={lighter} onChange={toggleLighter} className="mt-2 accent-[hsl(var(--teal))]" />
          <span className={cn(ur, "text-[13px] text-nc-dark")}><b>ہلکا target:</b> {t.lighterText}</span>
        </label>
      ) : null}
    </div>
  );
}

// ── Self-check ──────────────────────────────────────────────────────────────

function SelfCheckForm({ sc, stage, onSaved }: { sc: any; stage: "start" | "end"; onSaved: (start: number[] | null) => void }) {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<(number | null)[]>(() => sc.items.map(() => null));
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      const r = unwrap<any>(await parentCourseService.selfCheck(stage, answers as number[]));
      toast({ title: "Self-check محفوظ ہو گیا۔ جزاک اللہ خیر" });
      onSaved(r.start ?? null);
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "محفوظ نہیں ہو سکا۔") });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      <p className={cn(ur, "text-[13.5px] text-nc-dark")}>{sc.intro}</p>
      {sc.items.map((item: string, i: number) => (
        <div key={i} className="rounded-md border border-border p-2.5">
          <p className={cn(ur, "text-[14px] text-nc-dark")}><span className="ml-1 text-gold-dim">{i + 1}۔</span>{item}</p>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {sc.scale.map((label: string, v: number) => (
              <button key={v} type="button" aria-pressed={answers[i] === v}
                onClick={() => setAnswers((a) => a.map((x, k) => (k === i ? v : x)))}
                className={cn("rounded-full border px-2 text-[12.5px]", ur,
                  answers[i] === v ? "border-plum bg-plum text-white" : "border-border text-nc-dark hover:border-plum/60")}>
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button className="btn-primary !py-2 text-[13px]" disabled={busy || answers.some((a) => a === null)} onClick={save}>
        <span className="urdu leading-[1.8]">{busy ? "محفوظ ہو رہا ہے…" : "Self-check جمع کریں"}</span>
      </button>
    </div>
  );
}

function Comparison({ sc, start, end }: { sc: any; start: number[]; end: number[] }) {
  return (
    <div className="space-y-2">
      <p className={cn(ur, "text-[13.5px] text-nc-dark")}>{sc.endNote}</p>
      <ul className="space-y-1.5">
        {sc.items.map((item: string, i: number) => {
          const diff = end[i] - start[i];
          return (
            <li key={i} className="rounded-md border border-border p-2.5">
              <p className={cn(ur, "text-[13.5px] text-nc-dark")}>{item}</p>
              <div className={cn(ur, "mt-1 flex flex-wrap items-center gap-x-3 text-[12.5px]")}>
                <span className="text-nc-muted">پہلا دن: {sc.scale[start[i]]}</span>
                <span className="text-nc-muted">←</span>
                <span className="font-semibold text-nc-dark">آج: {sc.scale[end[i]]}</span>
                {diff > 0 && <span className="rounded-full bg-nc-green-lt px-2 text-nc-green">بہتری ✓</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SelfCheckBlock({ data, stage, onChanged }: { data: any; stage: "start" | "end"; onChanged: () => void }) {
  const sc = data.selfCheck;
  const mine = sc[stage];
  const [show, setShow] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <Sparkles className={cn("h-5 w-5 flex-shrink-0", mine ? "text-nc-green" : "text-plum")} />
        <div className="min-w-0 flex-1">
          <div className={cn(ur, "text-[15px] font-semibold text-nc-dark")}>{stage === "start" ? "پہلے دن کا self-check" : "آخری self-check"}</div>
          <div className={cn(ur, "text-[12.5px] text-nc-muted")}>
            {mine ? `مکمل · ${urDate(mine.on)}` : stage === "end" && !sc.endOpen ? "آخری closing clip سننے کے بعد کھلے گا۔" : "صرف آپ کے لیے، کوئی صحیح یا غلط جواب نہیں۔"}
          </div>
        </div>
        {!mine && (stage === "start" || sc.endOpen) && !show && (
          <button className="btn-primary !py-1.5 text-[12.5px]" onClick={() => setShow(true)}><span className="urdu leading-[1.8]">پُر کریں</span></button>
        )}
      </div>
      {!mine && show && <div className="mt-3"><SelfCheckForm sc={sc} stage={stage} onSaved={() => { setShow(false); onChanged(); }} /></div>}
      {stage === "end" && sc.start && sc.end && <div className="mt-3"><Comparison sc={sc} start={sc.start.answers} end={sc.end.answers} /></div>}
    </div>
  );
}

// ── Closing: final check, self-check, pledge, certificate ──────────────────

function ClosingBlock({ data, onQuiz, onChanged }: { data: any; onQuiz: (key: string) => void; onChanged: () => void }) {
  const c = data.certificate;
  const req = c.requirements;
  const items: [boolean, string][] = [
    [req.lessons, "تمام 52 clips پوری سنی"],
    [req.quizzes, "آٹھوں modules کے knowledge checks پاس"],
    [req.final, "آخری knowledge check پاس"],
    [req.selfCheck, "آخری self-check پُر کیا"],
  ];
  return (
    <div className="space-y-4">
      <QuizBlock q={data.finalQuiz} final onStart={() => onQuiz("final")} />
      <SelfCheckBlock data={data} stage="end" onChanged={onChanged} />
      {data.pledge && (
        <div className="rounded-xl bg-plum px-5 py-5 text-center text-white">
          <div className={cn(ur, "mb-2 text-[18px] text-gold")}>والدین کا وعدہ</div>
          {data.pledge.map((line: string, i: number) => (
            <p key={i} className="urdu text-[18px] leading-[2.2] sm:text-[20px]">{line}</p>
          ))}
          <p className={cn(ur, "mt-2 text-[13px] text-white/75")}>اگر ممکن ہو تو یہ وعدہ اپنے بچے کے سامنے دہرائیں۔</p>
        </div>
      )}
      {c.number ? (
        <ParentCertificate data={{ ...c, name: data.parent.name }} printLabel="Print" />
      ) : (
        <div className="rounded-lg border border-border p-3.5">
          <div className={cn(ur, "flex items-center gap-2 text-[15px] font-semibold text-nc-dark")}><Award className="h-5 w-5 text-gold" /> Certificate کے لیے</div>
          <ul className="mt-2 space-y-1">
            {items.map(([ok, label]) => (
              <li key={label} className={cn(ur, "flex items-center gap-2 text-[13.5px]", ok ? "text-nc-green" : "text-nc-dark")}>
                {ok ? <CheckCircle2 className="h-4 w-4" /> : <span className="inline-block h-4 w-4 rounded-full border border-border" />} {label}
              </li>
            ))}
          </ul>
          <p className={cn(ur, "mt-2 text-[12.5px] text-nc-muted")}>Certificate اور تحفہ آپ کے بچے کے ہاتھ، حلقے سے گھر آئے گا۔</p>
        </div>
      )}
    </div>
  );
}
