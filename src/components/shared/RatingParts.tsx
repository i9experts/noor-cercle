import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { scoreTone } from "@/lib/finance";

export interface RatingComponent { key: string; label: string; weight: number; score: number | null; detail: string }

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-3.5 w-3.5", value >= i - 0.25 ? "fill-gold text-gold" : value >= i - 0.75 ? "fill-gold/50 text-gold" : "text-pale")} />
      ))}
    </span>
  );
}

/** Component bars — shared with the Murabbi dashboard. */
export function ComponentBars({ components }: { components: RatingComponent[] }) {
  return (
    <div className="space-y-2.5">
      {components.map((c) => (
        <div key={c.key}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-[12px]">
            <span className="text-nc-dark">{c.label} <span className="text-nc-muted">· {c.weight}%</span></span>
            <span className={cn("font-semibold", c.score === null ? "text-nc-muted" : scoreTone(c.score).text)}>
              {c.score === null ? "n/a" : c.score}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            {c.score !== null && <div className={cn("h-full rounded-full", scoreTone(c.score).bg)} style={{ width: `${c.score}%` }} />}
          </div>
          <div className="mt-0.5 text-[11px] text-nc-muted">{c.detail}</div>
        </div>
      ))}
    </div>
  );
}
