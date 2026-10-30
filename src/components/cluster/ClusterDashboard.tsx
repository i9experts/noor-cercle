import { useState } from "react";
import { AlertTriangle, ClipboardPen, Pencil, Search } from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import NcCard from "@/components/shared/NcCard";
import { cn } from "@/lib/utils";
import { STATUS_META, formatDay, scheduleLabel } from "@/lib/schedule";
import { ALERT_META, RATING_META, TRAINING_META } from "@/lib/cluster";

export interface ClusterDashboardData {
  totals: {
    circles: number; inactiveCircles: number; murabbis: number; students: number; families: number; waitingInterest: number;
    visits30: number; attendance28: number | null; behind: number; certifiedMurabbis: number;
  };
  circles: any[];
  alerts: { level: "red" | "amber" | "info"; kind: string; circleId: string; circleName: string; text: string }[];
}

/** A cluster at a glance: totals, what needs attention and every circle's health. Used by admins and supervisors. */
export default function ClusterDashboard({ data, onLogVisit, onEditCircle }: {
  data: ClusterDashboardData;
  onLogVisit?: (circleId: string) => void;
  onEditCircle?: (circle: any) => void;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const t = data.totals;
  const urgent = data.alerts.filter((a) => a.level !== "info");
  const info = data.alerts.filter((a) => a.level === "info");
  const q = search.trim().toLowerCase();
  const rows = data.circles
    .filter((c) => showInactive || c.isActive)
    .filter((c) => !q || [c.name, c.murabbi?.fullName, c.neighbourhood?.name].some((v: string | undefined) => v?.toLowerCase().includes(q)));

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] sm:gap-4">
        <StatCard label="Circles" value={t.circles} meta={t.inactiveCircles ? `${t.inactiveCircles} inactive` : "Active"} color="purple" />
        <StatCard label="Children" value={t.students} meta={`${t.families} famil${t.families === 1 ? "y" : "ies"} on file`} color="teal" />
        <StatCard label="Murabbis" value={t.murabbis} meta={`${t.certifiedMurabbis} Asaas certified`} color="gold" />
        <StatCard label="Attendance" value={t.attendance28 === null ? "—" : `${t.attendance28}%`} meta="Last four weeks" color="green" />
        <StatCard label="Visits" value={t.visits30} meta="Last 30 days" color="purple" />
        <StatCard label="Waiting" value={t.waitingInterest} meta="Website requests to follow up" color={t.waitingInterest ? "red" : "teal"} />
      </div>

      <NcCard className="mb-6 p-4 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-nc-amber" />
          <h3 className="text-[15px] font-semibold text-nc-dark">Needs attention</h3>
          <span className="text-[12px] text-nc-muted">{urgent.length ? `${urgent.length} item${urgent.length === 1 ? "" : "s"}` : "Nothing urgent"}</span>
        </div>
        {urgent.length === 0 && <p className="text-[13px] text-nc-muted">Every circle has met recently, attendance is healthy and no one is behind. Alhamdulillah.</p>}
        <div className="space-y-1.5">
          {[...urgent, ...(showInfo ? info : [])].map((a, i) => (
            <div key={i} className={cn("flex items-start gap-2.5 rounded-md border px-3 py-2", ALERT_META[a.level].cls)}>
              <span className={cn("mt-1.5 h-2 w-2 flex-shrink-0 rounded-full", ALERT_META[a.level].dot)} />
              <div className="min-w-0 flex-1 text-[13px]">
                <span className="font-semibold text-nc-dark">{a.circleName}</span>
                <span className="text-nc-dark"> · {a.text}</span>
              </div>
              {onLogVisit && (a.kind === "not-visited" || a.kind === "safeguarding") && (
                <button className="flex-shrink-0 text-[12px] font-medium text-teal hover:underline" onClick={() => onLogVisit(a.circleId)}>Log a visit</button>
              )}
            </div>
          ))}
        </div>
        {info.length > 0 && (
          <button className="mt-2 text-[12.5px] text-teal hover:underline" onClick={() => setShowInfo((v) => !v)}>
            {showInfo ? "Hide reminders" : `Show ${info.length} reminder${info.length === 1 ? "" : "s"} (visits due, training, follow-ups)`}
          </button>
        )}
      </NcCard>

      <NcCard className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h3 className="mr-auto text-[15px] font-semibold text-nc-dark">Circles</h3>
          <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-nc-muted">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="accent-[hsl(var(--teal))]" />
            Show inactive
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-nc-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Circle, murabbi, area…" aria-label="Search circles"
              className="h-9 w-48 rounded-md border border-input bg-card pl-8 pr-3 text-[13px] focus:border-primary focus:outline-none" />
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-nc-muted">No circles here yet.</div>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[920px] text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-nc-muted">
                  <th className="px-3 py-2 font-medium">Circle</th>
                  <th className="px-3 py-2 font-medium">Murabbi</th>
                  <th className="px-3 py-2 font-medium">Children</th>
                  <th className="px-3 py-2 font-medium">Last session</th>
                  <th className="px-3 py-2 font-medium">Attendance</th>
                  <th className="px-3 py-2 font-medium">Syllabus</th>
                  <th className="px-3 py-2 font-medium">Last visit</th>
                  {(onLogVisit || onEditCircle) && <th className="px-3 py-2" />}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const p = c.progress;
                  return (
                    <tr key={c._id} className={cn("border-b border-border/60", !c.isActive && "opacity-60")}>
                      <td className="px-3 py-3">
                        <div className="font-medium text-nc-dark">{c.name}{!c.isActive && <span className="ml-1.5 text-[11px] text-nc-muted">(inactive)</span>}</div>
                        <div className="text-[11.5px] text-nc-muted">{c.neighbourhood?.name ?? "—"} · {scheduleLabel(c)}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-nc-dark">{c.murabbi?.fullName ?? <span className="text-nc-red">None</span>}</div>
                        {c.murabbi && (
                          <span className={cn("mt-0.5 inline-block rounded-full px-2 py-px text-[10.5px] font-semibold", TRAINING_META[c.murabbiTraining]?.cls)}>
                            {TRAINING_META[c.murabbiTraining]?.label}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-nc-dark">{c.students}<span className="text-nc-muted">/{c.capacity}</span></td>
                      <td className="whitespace-nowrap px-3 py-3 text-nc-dark">{c.lastSession ? formatDay(c.lastSession) : <span className="text-nc-muted">None yet</span>}</td>
                      <td className="px-3 py-3">
                        {c.attendance28 === null ? <span className="text-nc-muted">—</span> : (
                          <span className={cn("font-semibold", c.attendance28 < 60 ? "text-nc-red" : c.attendance28 < 75 ? "text-nc-amber" : "text-nc-green")}>{c.attendance28}%</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {p ? (
                          <>
                            <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_META[p.status]?.cls)}>
                              {STATUS_META[p.status]?.label}{p.status === "behind" ? ` by ${p.behindBy}` : ""}
                            </span>
                            {p.total > 0 && <div className="mt-1 text-[11.5px] text-nc-muted">{p.covered}/{p.total} sessions</div>}
                          </>
                        ) : <span className="text-nc-muted">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        {c.lastVisit ? (
                          <>
                            <div className="whitespace-nowrap text-nc-dark">{formatDay(c.lastVisit.last)}</div>
                            <span className={cn("rounded-full px-2 py-px text-[10.5px] font-semibold", RATING_META[c.lastVisit.overall]?.cls)}>{RATING_META[c.lastVisit.overall]?.label}</span>
                            {c.openFollowUps > 0 && <div className="mt-0.5 text-[11px] text-nc-amber">{c.openFollowUps} open follow-up{c.openFollowUps === 1 ? "" : "s"}</div>}
                          </>
                        ) : <span className="text-nc-muted">Not visited</span>}
                      </td>
                      {(onLogVisit || onEditCircle) && (
                        <td className="whitespace-nowrap px-3 py-3 text-right">
                          {onLogVisit && c.isActive && (
                            <button className="mr-1 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[12px] text-nc-dark hover:border-teal hover:text-teal" onClick={() => onLogVisit(c._id)}>
                              <ClipboardPen className="h-3.5 w-3.5" /> Visit
                            </button>
                          )}
                          {onEditCircle && (
                            <button className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[12px] text-nc-dark hover:border-teal hover:text-teal" onClick={() => onEditCircle(c)} aria-label={`Edit ${c.name}`}>
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </NcCard>
    </div>
  );
}
