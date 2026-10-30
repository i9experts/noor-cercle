import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { courseService } from "@/services/api.service";
import NcCard from "@/components/shared/NcCard";
import { cn } from "@/lib/utils";
import { apiError, unwrap } from "@/lib/finance";
import { clock, hasUrdu, titleProps } from "@/lib/course";

/** How often listening is reported while playing. */
const REPORT_EVERY_MS = 15_000;

const EN = {
  done: "Lesson complete", moduleDone: "Module complete too. Points added.", pointsAdded: "Points added to your training.",
  openError: "Could not open this lesson.", retry: "Try again", loading: "Loading lesson…", completed: "Completed",
  heard: (p: number) => `${p}% heard`, rule: (p: number) => `Counts as complete at ${p}% heard. Skipping ahead doesn’t count.`,
  autoNext: "Play the next lesson automatically", next: "Next",
};
const UR: typeof EN = {
  done: "Clip مکمل", moduleDone: "Module بھی مکمل۔ Points مل گئے۔", pointsAdded: "Points مل گئے۔",
  openError: "یہ clip نہیں کھل سکی۔", retry: "دوبارہ کوشش کریں", loading: "Clip کھل رہی ہے…", completed: "مکمل",
  heard: (p: number) => `${p}% سنی`, rule: (p: number) => `${p}% سننے پر مکمل گنی جائے گی۔ آگے skip کرنا نہیں گنا جاتا۔`,
  autoNext: "اگلی clip خود چلے", next: "اگلی",
};

/**
 * Plays a course clip with its transcript and reports what was actually
 * heard (contiguous stretches, ignoring jumps). Shared by the murabbi and
 * parent courses.
 */
export function LessonPlayer({ lessonId, nextLesson, threshold, autoPlay, onProgress, onNext, ur = false }: {
  lessonId: string; nextLesson?: any; threshold: number; autoPlay: boolean; onProgress: () => void; onNext: (play: boolean) => void;
  /** Urdu labels (parents). */
  ur?: boolean;
}) {
  const { toast } = useToast();
  const t = ur ? UR : EN;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [data, setData]       = useState<any>(null);
  const [percent, setPercent] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [autoNext, setAutoNext] = useState(() => {
    try { return localStorage.getItem("nc-course-autonext") !== "0"; } catch { return true; }
  });

  // What was actually played: contiguous stretches, ignoring jumps.
  const seg = useRef<[number, number] | null>(null);
  const pending = useRef<number[][]>([]);
  const lastT = useRef<number | null>(null);
  const sending = useRef(false);
  const endedRef = useRef(false);

  const closeSegment = () => {
    if (seg.current && seg.current[1] - seg.current[0] > 0.2) pending.current.push(seg.current);
    seg.current = null;
  };

  const report = useCallback(async () => {
    closeSegment();
    const a = audioRef.current;
    if (!pending.current.length) return;
    if (sending.current) { setTimeout(report, 1000); return; } // e.g. the lesson ended mid-report
    const segments = pending.current;
    pending.current = [];
    sending.current = true;
    try {
      const r = unwrap(await courseService.heartbeat(lessonId, { segments, position: a?.currentTime ?? 0 }));
      setPercent(r.percent);
      setCompleted(r.completed);
      if (r.justCompleted) {
        toast({ title: t.done, description: r.sectionCompleted ? t.moduleDone : t.pointsAdded });
        onProgress();
        if (endedRef.current && autoNext && nextLesson) onNext(true);
      }
    } catch {
      pending.current = [...segments, ...pending.current]; // try again with the next report
    } finally {
      sending.current = false;
    }
  }, [lessonId, autoNext, nextLesson, onNext, onProgress, toast, t]);

  const loadLesson = useCallback(async () => {
    try {
      const d = unwrap(await courseService.play(lessonId));
      setData(d);
      setPercent(d.progress.percent);
      setCompleted(d.progress.completed);
      setError(null);
      return d;
    } catch (err) {
      setError(apiError(err, t.openError));
      return null;
    }
  }, [lessonId, t]);

  useEffect(() => { loadLesson(); }, [loadLesson]);

  // Report every 15s while playing, and whatever is left when leaving the lesson.
  useEffect(() => {
    const t = setInterval(() => { if (audioRef.current && !audioRef.current.paused) report(); }, REPORT_EVERY_MS);
    return () => { clearInterval(t); report(); };
  }, [report]);

  useEffect(() => {
    const flush = () => { if (document.visibilityState === "hidden") report(); };
    document.addEventListener("visibilitychange", flush);
    return () => document.removeEventListener("visibilitychange", flush);
  }, [report]);

  function onTimeUpdate() {
    const a = audioRef.current!;
    const t = a.currentTime;
    const last = lastT.current;
    if (!a.paused && last != null && t >= last && t - last <= 2) {
      if (seg.current) seg.current[1] = t;
      else seg.current = [last, t];
    } else {
      closeSegment();
    }
    lastT.current = t;
  }

  function onLoaded() {
    const a = audioRef.current!;
    const pos = data?.progress.lastPosition ?? 0;
    if (pos > 5 && pos < a.duration - 5) a.currentTime = pos;
    if (autoPlay) a.play().catch(() => { /* the browser may block autoplay; the play button still works */ });
  }

  async function onAudioError() {
    // The play link lasts a few hours; get a fresh one and carry on from the same spot.
    const a = audioRef.current;
    const at = a?.currentTime ?? 0;
    const d = await loadLesson();
    if (d && a) {
      a.addEventListener("loadedmetadata", () => { a.currentTime = at; }, { once: true });
    }
  }

  function toggleAutoNext() {
    setAutoNext((v) => {
      try { localStorage.setItem("nc-course-autonext", v ? "0" : "1"); } catch { /* per-device preference only */ }
      return !v;
    });
  }

  if (error) {
    return (
      <NcCard className="py-12 text-center">
        <div className="text-[13px] text-nc-dark">{error}</div>
        <button className="btn-outline mx-auto mt-3 flex items-center gap-1.5 !py-1.5 text-[12.5px]" onClick={loadLesson}>
          <RotateCcw className="h-3.5 w-3.5" /> {t.retry}
        </button>
      </NcCard>
    );
  }
  if (!data) return <NcCard><div className="py-16 text-center text-sm text-nc-muted">{t.loading}</div></NcCard>;

  const l = data.lesson;
  return (
    <NcCard className="!p-0">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium uppercase tracking-wide text-nc-muted">{l.code}{l.topic ? ` · ${l.topic}` : ""}</div>
            <div {...titleProps(l.title)} className={cn("mt-0.5 text-nc-dark", hasUrdu(l.title) ? "urdu text-[19px] leading-[2]" : "font-serif text-[20px] leading-tight")}>{l.title}</div>
          </div>
          <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
            completed ? "bg-nc-green-lt text-nc-green" : "bg-teal-lt text-teal")}>
            {completed ? t.completed : t.heard(percent)}
          </span>
        </div>
        <audio
          ref={audioRef}
          src={data.audioUrl}
          controls
          preload="metadata"
          controlsList="nodownload"
          className="mt-4 w-full"
          onTimeUpdate={onTimeUpdate}
          onPlay={() => { lastT.current = audioRef.current!.currentTime; endedRef.current = false; }}
          onPause={report}
          onSeeking={() => { closeSegment(); lastT.current = null; }}
          onSeeked={() => { lastT.current = audioRef.current!.currentTime; }}
          onEnded={() => { endedRef.current = true; report(); }}
          onLoadedMetadata={onLoaded}
          onError={onAudioError}
        />
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-nc-muted">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {clock(l.durationSec)}</span>
          {!completed && <span>{t.rule(Math.round(threshold * 100))}</span>}
          <label className="ml-auto flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" checked={autoNext} onChange={toggleAutoNext} className="accent-[hsl(var(--teal))]" />
            {t.autoNext}
          </label>
        </div>
        {completed && nextLesson && (
          <button className="btn-primary mt-3 !py-2 text-[12.5px]" onClick={() => onNext(false)}>
            {t.next}: {nextLesson.code} · {nextLesson.title}
          </button>
        )}
      </div>
      <div className="max-h-[55vh] overflow-y-auto px-5 py-5 sm:px-8">
        <Transcript paras={l.transcript} />
      </div>
    </NcCard>
  );
}

/** Transcript text marks emphasis with <b>…</b>; show it bold (as React text, never as HTML). */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/<b>(.*?)<\/b>/g);
  return <>{parts.map((part, i) => (i % 2 ? <strong key={i} className="font-semibold text-plum">{part}</strong> : part.replace(/<\/?b>/g, "")))}</>;
}

export function Transcript({ paras }: { paras: { k: string; t: string }[] }) {
  if (!paras?.length) return <div className="text-[13px] text-nc-muted">—</div>;
  return (
    <div className="space-y-4">
      {paras.map((p, i) => p.k === "ar" ? (
        <p key={i} dir="rtl" lang="ar" className="arabic rounded-md bg-gold/[0.07] px-4 py-3 text-center text-[22px] leading-[2] text-nc-dark"><Rich text={p.t} /></p>
      ) : hasUrdu(p.t) ? (
        <p key={i} dir="rtl" lang="ur" className="urdu text-right text-[17px] leading-[2.3] text-nc-dark"><Rich text={p.t} /></p>
      ) : (
        <p key={i} className="text-[14px] leading-relaxed text-nc-dark"><Rich text={p.t} /></p>
      ))}
    </div>
  );
}
