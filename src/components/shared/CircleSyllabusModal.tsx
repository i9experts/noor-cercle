import { useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, CircleDot } from "lucide-react";
import Modal from "@/components/shared/Modal";
import { syllabusService } from "@/services/api.service";
import { titleProps, urduCls } from "@/lib/course";
import { cn } from "@/lib/utils";
import { apiError, unwrap } from "@/lib/finance";
import { PARTS, STATUS_META, THEMES, formatDay, scheduleLabel } from "@/lib/schedule";

/** Session-by-session view of one circle: covered, in progress, remaining. */
export default function CircleSyllabusModal({ circleId, onClose }: { circleId: string | null; onClose: () => void }) {
  const [data, setData]   = useState<any>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "covered" | "remaining">("all");

  useEffect(() => {
    if (!circleId) return;
    setData(null); setError("");
    syllabusService.circleProgress(circleId)
      .then((r) => setData(unwrap(r)))
      .catch((err) => setError(apiError(err, "Could not load the syllabus progress.")));
  }, [circleId]);

  if (!circleId) return null;
  const p = data?.progress;
  const sessions: any[] = (data?.sessions ?? []).filter((s: any) =>
    filter === "all" || (filter === "covered" ? s.state === "covered" : s.state !== "covered"));

  return (
    <Modal open onClose={onClose} title={data?.circle?.name ?? "Syllabus progress"}
      subtitle={data ? `${data.circle.track?.name ?? "No syllabus track"} · ${scheduleLabel(data.circle)}` : "Loading…"}>
      {error ? (
        <div className="py-8 text-center text-[13px] text-nc-red">{error}</div>
      ) : !data ? (
        <div className="py-10 text-center text-sm text-nc-muted">Loading…</div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-muted p-3"><div className="text-[11px] text-nc-muted">Covered</div><div className="text-[17px] font-semibold text-nc-dark">{p.covered}<span className="text-[12px] font-normal text-nc-muted"> / {p.total}</span></div></div>
            <div className="rounded-md bg-muted p-3"><div className="text-[11px] text-nc-muted">Expected by now</div><div className="text-[17px] font-semibold text-nc-dark">{p.expected ?? "—"}</div></div>
            <div className="rounded-md bg-muted p-3"><div className="text-[11px] text-nc-muted">Status</div>
              <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_META[p.status]?.cls)}>{STATUS_META[p.status]?.label}</span>
            </div>
          </div>

          <div className="mb-3 flex gap-1.5">
            {(["all", "covered", "remaining"] as const).map((k) => (
              <button key={k} onClick={() => setFilter(k)}
                className={cn("rounded-full px-3 py-1 text-[12px] font-medium", filter === k ? "bg-primary text-primary-foreground" : "bg-muted text-nc-muted")}>
                {k === "all" ? "All" : k === "covered" ? "Covered" : "Remaining"}
              </button>
            ))}
          </div>

          <div className="max-h-[50vh] space-y-1.5 overflow-y-auto pr-1">
            {sessions.map((s) => {
              const Icon = s.state === "covered" ? CheckCircle2 : s.state === "partial" ? CircleDot : CircleDashed;
              const done = s.coverage?.parts?.filter((x: any) => x.done).map((x: any) => x.key) ?? [];
              return (
                <div key={s._id} className={cn("rounded-md border px-3 py-2", s.state === "covered" ? "border-nc-green/30 bg-nc-green-lt/40" : "border-border")}>
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("h-4 w-4 flex-shrink-0", s.state === "covered" ? "text-nc-green" : s.state === "partial" ? "text-gold-dim" : "text-pale")} />
                    <span className="w-6 text-[12px] font-semibold text-nc-muted">{s.number}</span>
                    <span className="min-w-0 flex-1">
                      <span {...titleProps(s.title)} className={cn("block truncate text-nc-dark", urduCls(s.title) ? "urdu text-right text-[14px] leading-[2]" : "text-[13px]")}>{s.title}</span>
                      <span className="text-[11px] text-nc-muted">{THEMES[s.month - 1]}{s.coverage ? ` · ${formatDay(s.coverage.date, true)}` : ""}</span>
                    </span>
                    {s.state === "partial" && <span className="text-[11px] text-gold-dim">{done.length}/6 parts</span>}
                  </div>
                  {s.state === "partial" && (
                    <div className="ml-[52px] mt-1 text-[11px] text-nc-muted">
                      Not yet: {PARTS.filter((x) => !done.includes(x.key)).map((x) => x.label).join(", ")}
                    </div>
                  )}
                  {s.coverage?.notes && <div className="ml-[52px] mt-1 text-[11.5px] italic text-nc-muted">“{s.coverage.notes}”</div>}
                </div>
              );
            })}
            {sessions.length === 0 && <div className="py-6 text-center text-[12.5px] text-nc-muted">Nothing here.</div>}
          </div>
        </>
      )}
    </Modal>
  );
}
