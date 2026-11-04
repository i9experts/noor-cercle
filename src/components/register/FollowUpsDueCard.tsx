import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, ChevronRight } from "lucide-react";
import { unwrap } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { DueList, FOLLOW_UP_META, NOTE_KIND_LABEL, RegisterType, dayLabel, registerService } from "@/lib/register";

const TYPE_LABEL: Record<RegisterType, string> = { murabbi: "Murabbi", parent: "Parent", host: "Host" };
const PAGE: Record<RegisterType, string> = { murabbi: "murabbis", parent: "parents", host: "hosts" };

/** Dashboard: follow-ups due today or overdue across the three registers (admin only). */
export default function FollowUpsDueCard({ onOpen }: { onOpen?: (page: string, tab?: string) => void }) {
  const [d, setD] = useState<DueList | null>(null);
  useEffect(() => { registerService.due().then((r) => setD(unwrap<DueList>(r))).catch(() => setD(null)); }, []);
  if (!d) return null;
  const total = d.today + d.overdue;
  const go = (t: RegisterType) => onOpen?.(PAGE[t], "register");

  return (
    <section className="mb-6 rounded-lg border border-border bg-card shadow-nc">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
        <CalendarClock className="h-5 w-5 text-plum" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-nc-dark">Follow-ups due</h3>
          <p className="text-[12.5px] text-nc-muted">
            {total === 0 ? "Nothing due today. Set next dates in the registers to see them here." : <>
              {d.today} due today{d.overdue > 0 && <> · <span className="font-semibold text-nc-red">{d.overdue} overdue</span></>}
            </>}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["murabbi", "parent", "host"] as RegisterType[]).map((t) => (
            <button key={t} onClick={() => go(t)} className="rounded-full border border-border px-2.5 py-1 text-[12px] text-nc-muted hover:border-plum hover:text-plum">
              {TYPE_LABEL[t]}s {d.byType[t] > 0 && <b className="text-plum">{d.byType[t]}</b>}
            </button>
          ))}
        </div>
      </div>
      {total > 0 && (
        <ul className="divide-y divide-border">
          {d.items.slice(0, 8).map((i) => (
            <li key={`${i.subjectType}-${i.subject}`}>
              <button onClick={() => go(i.subjectType)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/40 sm:px-5">
                <span className={cn("w-[72px] flex-shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-medium", i.overdue ? "bg-nc-red-lt text-nc-red" : "bg-nc-amber-lt text-nc-amber")}>
                  {i.overdue ? <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{dayLabel(i.nextDate)}</span> : "Today"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-nc-dark">{i.name}</span>
                  <span className="text-[12px] text-nc-muted"> · {TYPE_LABEL[i.subjectType]} · {FOLLOW_UP_META[i.status]?.label ?? i.status}</span>
                  {i.lastNote && <span className="block truncate text-[12px] text-nc-muted">{NOTE_KIND_LABEL[i.lastNote.kind]}: {i.lastNote.text}</span>}
                </span>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-nc-muted" />
              </button>
            </li>
          ))}
          {d.items.length > 8 && <li className="px-4 py-2 text-[12px] text-nc-muted sm:px-5">and {d.items.length - 8} more…</li>}
        </ul>
      )}
    </section>
  );
}
