import { useState } from "react";
import { ChevronDown, ShieldAlert, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDay } from "@/lib/schedule";
import { RATING_META, Visit, scoreMeta, visitScore } from "@/lib/cluster";

/** Visit reports, newest first; each opens to show the checklist, notes and follow-ups. */
export default function VisitList({ visits, showCluster = false, canDelete, onFollowUp, onDelete }: {
  visits: Visit[];
  showCluster?: boolean;
  canDelete?: (v: Visit) => boolean;
  onFollowUp: (v: Visit, followUpId: string, done: boolean) => void;
  onDelete?: (v: Visit) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);

  if (!visits.length) return <div className="py-12 text-center text-[13px] text-nc-muted">No visits logged yet.</div>;

  return (
    <div className="space-y-2">
      {visits.map((v) => {
        const score = visitScore(v);
        const isOpen = open === v._id;
        const openFollowUps = v.followUps.filter((f) => !f.done).length;
        return (
          <div key={v._id} className={cn("rounded-lg border bg-card", v.safeguarding ? "border-nc-red/50" : "border-border")}>
            <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen(isOpen ? null : v._id)} aria-expanded={isOpen}>
              <div className="w-[84px] flex-shrink-0 text-[12.5px] font-semibold text-nc-dark">{formatDay(v.date)}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-medium text-nc-dark">
                  {v.circle?.name ?? "Circle removed"}
                  {v.safeguarding && <ShieldAlert className="ml-1.5 inline h-4 w-4 text-nc-red" aria-label="Safeguarding concern" />}
                </div>
                <div className="truncate text-[11.5px] text-nc-muted">
                  {[showCluster && v.cluster?.name, v.supervisor?.fullName, v.childrenPresent != null && `${v.childrenPresent} children`, openFollowUps && `${openFollowUps} open follow-up${openFollowUps === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}
                </div>
              </div>
              {score !== null && <span className="hidden text-[12px] text-nc-muted sm:inline">{score}%</span>}
              <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", RATING_META[v.overall]?.cls)}>{RATING_META[v.overall]?.label}</span>
              <ChevronDown className={cn("h-4 w-4 flex-shrink-0 text-nc-muted transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
              <div className="border-t border-border/70 px-4 py-3">
                {v.safeguarding && (
                  <p className="mb-3 flex items-center gap-1.5 rounded-md bg-nc-red-lt px-3 py-2 text-[12.5px] font-semibold text-nc-red">
                    <ShieldAlert className="h-4 w-4" /> A safeguarding concern was raised on this visit.
                  </p>
                )}
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {v.checklist.map((c) => {
                    const m = scoreMeta(c.score);
                    return (
                      <div key={c.key} className="flex items-start gap-2 text-[12.5px]">
                        <span className={cn("mt-px whitespace-nowrap rounded-full border px-2 py-px text-[10.5px] font-semibold", m.cls)}>{m.label}</span>
                        <span className="min-w-0">
                          <span className="text-nc-dark">{c.title}</span>
                          {c.note && <span dir="auto" className="block text-[11.5px] text-nc-muted">{c.note}</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {v.highlights && (
                  <div className="mt-3"><div className="text-[11px] font-semibold uppercase tracking-wide text-nc-green">What went well</div><p dir="auto" className="whitespace-pre-line text-[13px] text-nc-dark">{v.highlights}</p></div>
                )}
                {v.concerns && (
                  <div className="mt-3"><div className="text-[11px] font-semibold uppercase tracking-wide text-nc-red">Concerns</div><p dir="auto" className="whitespace-pre-line text-[13px] text-nc-dark">{v.concerns}</p></div>
                )}
                {v.followUps.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gold-dim">Follow-ups</div>
                    {v.followUps.map((f) => (
                      <label key={f._id} className="flex cursor-pointer items-start gap-2 py-0.5 text-[13px]">
                        <input type="checkbox" checked={f.done} onChange={(e) => onFollowUp(v, f._id, e.target.checked)} className="mt-0.5 accent-[hsl(var(--teal))]" />
                        <span dir="auto" className={cn(f.done ? "text-nc-muted line-through" : "text-nc-dark")}>{f.text}</span>
                        {f.done && f.doneAt && <span className="ml-auto whitespace-nowrap text-[11px] text-nc-muted">done {formatDay(f.doneAt)}</span>}
                      </label>
                    ))}
                  </div>
                )}
                {onDelete && canDelete?.(v) && (
                  <button className="mt-3 flex items-center gap-1 text-[12px] text-nc-muted hover:text-nc-red" onClick={() => onDelete(v)}>
                    <Trash2 className="h-3.5 w-3.5" /> Remove this report
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
