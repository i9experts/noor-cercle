import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_META, STEPS } from "@/lib/host";

/** Offered → Visited → Approved → In use, with what happens next. */
export default function StatusSteps({ status }: { status: string }) {
  const at = STEPS.indexOf(status as never);
  return (
    <ol dir="rtl" className="flex items-start" aria-label="Progress">
      {STEPS.map((s, i) => {
        const done = at >= i;
        return (
          <li key={s} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && <span aria-hidden className={cn("absolute left-1/2 top-3 h-0.5 w-full -translate-y-1/2", at >= i ? "bg-plum" : "bg-border")} />}
            <span className={cn("relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-semibold",
              done ? "border-plum bg-plum text-white" : "border-border bg-card text-nc-muted", at === i && "ring-4 ring-plum/15")}>
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span lang="ur" className={cn("urdu mt-1 text-[12.5px] leading-[2]", done ? "text-plum" : "text-nc-muted")}>{STATUS_META[s].ur}</span>
            <span dir="ltr" className="text-[10.5px] leading-tight text-nc-muted">{STATUS_META[s].label}</span>
          </li>
        );
      })}
    </ol>
  );
}
