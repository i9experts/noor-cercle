import { useEffect, useRef } from "react";
import { Headphones, Lock } from "lucide-react";
import { FLIP_CHART_CSS, FLIP_CHART_SHEETS } from "@/content/flipCharts";
import { courseService } from "@/services/api.service";
import { clock } from "@/lib/course";

/** Adds the flip-chart styles to the page once. */
function useFlipChartStyles() {
  useEffect(() => {
    if (document.getElementById("fc-styles")) return;
    const el = document.createElement("style");
    el.id = "fc-styles";
    el.textContent = FLIP_CHART_CSS;
    document.head.appendChild(el);
  }, []);
}

/**
 * Reports how long a flip chart is actually on screen (at least half visible,
 * tab in front): every 15 seconds while visible, and when it leaves the screen.
 */
function useFlipChartTracking(courseKey: string | null, chartKey: string, onReport?: (r: { studied: boolean; justStudied?: boolean }) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const report = useRef(onReport);
  report.current = onReport;

  useEffect(() => {
    const el = ref.current;
    if (!courseKey || !el) return;
    let visible = false;
    let since = 0;
    let pending = 0;

    const tick = () => {
      if (visible && document.visibilityState === "visible") {
        const now = Date.now();
        pending += (now - since) / 1000;
        since = now;
      }
    };
    const send = () => {
      tick();
      const seconds = Math.round(pending);
      if (seconds < 2) return;
      pending = 0;
      courseService.flipChartView(courseKey, chartKey, seconds)
        .then((r) => report.current?.(r.data?.data ?? r.data))
        .catch(() => { /* tracking is best effort */ });
    };
    const io = new IntersectionObserver(([entry]) => {
      const now = entry.intersectionRatio >= 0.5;
      if (now && !visible) { visible = true; since = Date.now(); }
      else if (!now && visible) { tick(); visible = false; send(); }
    }, { threshold: [0, 0.5] });
    io.observe(el);
    const timer = setInterval(send, 15_000);
    const onVis = () => { if (document.visibilityState === "hidden") send(); else since = Date.now(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { io.disconnect(); clearInterval(timer); document.removeEventListener("visibilitychange", onVis); send(); };
  }, [courseKey, chartKey]);

  return ref;
}

export interface FlipChartLesson { _id: string; code: string; title: string; durationSec: number }

/**
 * One flip chart drawn as paper, with the lessons that explain it. Pass
 * `courseKey` to track time on screen (murabbis); leave it out for previews.
 */
export default function FlipChartSheet({ chartKey, lessons = [], courseKey = null, onOpenLesson, lockedLessons, onReport }: {
  chartKey: string;
  lessons?: FlipChartLesson[];
  courseKey?: string | null;
  onOpenLesson?: (lessonId: string) => void;
  lockedLessons?: Set<string>;
  onReport?: (r: { studied: boolean; justStudied?: boolean }) => void;
}) {
  useFlipChartStyles();
  const ref = useFlipChartTracking(courseKey, chartKey, onReport);
  const html = FLIP_CHART_SHEETS[chartKey];
  if (!html) return null;

  return (
    <div className="fc-scope" ref={ref}>
      <article className="sheet" dangerouslySetInnerHTML={{ __html: html }} />
      {lessons.length > 0 && (
        <div className="mt-3 rounded-lg border border-border bg-card px-4 py-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-nc-muted">Explained in</div>
          <ul className="space-y-1.5">
            {lessons.map((l) => {
              const locked = lockedLessons?.has(l._id);
              return (
                <li key={l._id} className="flex items-center gap-3 text-[13px]">
                  <span className="w-14 flex-shrink-0 font-mono text-[11.5px] text-nc-muted">{l.code}</span>
                  <span dir="auto" className="min-w-0 flex-1 truncate text-nc-dark">{l.title}</span>
                  <span className="text-[11.5px] text-nc-muted">{clock(l.durationSec)}</span>
                  {onOpenLesson && (
                    locked
                      ? <Lock className="h-3.5 w-3.5 text-nc-muted" aria-label="Locked" />
                      : (
                        <button className="inline-flex items-center gap-1 text-[12px] font-medium text-teal hover:underline" onClick={() => onOpenLesson(l._id)}>
                          <Headphones className="h-3.5 w-3.5" /> Listen
                        </button>
                      )
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
