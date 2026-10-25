import { CalendarDays, PartyPopper, Sun, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDay, formatTime } from "@/lib/schedule";

export interface CalendarItem {
  type: "session" | "holiday" | "parent_evening" | "event";
  date: string; endDate?: string; time?: string | null; title: string;
  circleName?: string; sessionNumber?: number | null; notes?: string; cancelsSessions?: boolean;
}

const META = {
  session       : { Icon: Users,        cls: "bg-plum-lt text-plum",           label: "Circle" },
  holiday       : { Icon: Sun,          cls: "bg-gold-lt text-gold-dim",       label: "Holiday" },
  parent_evening: { Icon: PartyPopper,  cls: "bg-nc-green-lt text-nc-green",   label: "Parent evening" },
  event         : { Icon: CalendarDays, cls: "bg-muted text-nc-dark",          label: "Event" },
};

/** Calendar items grouped by day. Used by the admin calendar, the Murabbi agenda and the family page. */
export default function CalendarList({ items, showCircle = false, compact = false }: {
  items: CalendarItem[]; showCircle?: boolean; compact?: boolean;
}) {
  if (!items.length) {
    return <div className="py-8 text-center text-[12.5px] text-nc-muted">Nothing scheduled in this period.</div>;
  }
  const days = new Map<string, CalendarItem[]>();
  for (const i of items) days.set(i.date, [...(days.get(i.date) ?? []), i]);

  return (
    <div className={cn(compact ? "space-y-2" : "space-y-3")}>
      {[...days.entries()].map(([date, list]) => (
        <div key={date} className="flex gap-3">
          <div className={cn("flex-shrink-0 text-right", compact ? "w-[72px]" : "w-[84px]")}>
            <div className="text-[12.5px] font-semibold text-nc-dark">{formatDay(date)}</div>
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            {list.map((i, k) => {
              const m = META[i.type] ?? META.event;
              return (
                <div key={k} className="flex items-start gap-2.5 rounded-md border border-border/70 bg-card px-3 py-2">
                  <span className={cn("mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full", m.cls)}>
                    <m.Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] text-nc-dark">
                      {i.type === "session" && i.sessionNumber ? <span className="font-semibold">Session {i.sessionNumber}: </span> : null}
                      {i.title}
                    </span>
                    <span className="block text-[11.5px] text-nc-muted">
                      {i.type === "session"
                        ? [showCircle && i.circleName, formatTime(i.time)].filter(Boolean).join(" · ")
                        : [m.label !== i.title && m.label, i.endDate && i.endDate !== i.date ? `until ${formatDay(i.endDate)}` : "", i.cancelsSessions ? "no circle" : ""].filter(Boolean).join(" · ")}
                    </span>
                    {i.notes && <span className="mt-0.5 block text-[11.5px] text-nc-muted">{i.notes}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
