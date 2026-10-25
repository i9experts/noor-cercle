import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { syllabusService } from "@/services/api.service";
import StatCard from "@/components/shared/StatCard";
import NcCard from "@/components/shared/NcCard";
import CircleSyllabusModal from "@/components/shared/CircleSyllabusModal";
import { cn } from "@/lib/utils";
import { apiError, downloadCsv, unwrap } from "@/lib/finance";
import { STATUS_META, THEMES, formatDay, scheduleLabel } from "@/lib/schedule";

export default function SyllabusProgressPage() {
  const { toast } = useToast();
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState("");
  const [search, setSearch]   = useState("");
  const [openId, setOpenId]   = useState<string | null>(null);

  useEffect(() => {
    syllabusService.progress()
      .then((r) => setData(unwrap(r)))
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load progress.") }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows: any[] = (data?.circles ?? [])
    .filter((r: any) => !status || r.progress.status === status || (status === "on-track" && ["ahead", "complete"].includes(r.progress.status)))
    .filter((r: any) => {
      const q = search.trim().toLowerCase();
      return !q || [r.circle.name, r.murabbi?.fullName, r.circle.neighbourhood?.name].some((v) => v?.toLowerCase().includes(q));
    })
    .sort((a: any, b: any) => (b.progress.behindBy ?? -99) - (a.progress.behindBy ?? -99));
  const s = data?.stats;

  function exportCsv() {
    downloadCsv("noor-circles-syllabus-progress.csv", [
      ["Circle", "Neighbourhood", "Murabbi", "Track", "Schedule", "Covered", "Total", "Expected", "Behind by", "Status", "Current session", "Last covered", "Next meeting"],
      ...rows.map((r) => [
        r.circle.name, r.circle.neighbourhood?.name ?? "", r.murabbi?.fullName ?? "", r.track?.name ?? "", scheduleLabel(r.circle),
        r.progress.covered, r.progress.total, r.progress.expected ?? "", r.progress.behindBy ?? "", STATUS_META[r.progress.status]?.label ?? "",
        r.progress.current ? `${r.progress.current.number}. ${r.progress.current.title}` : "",
        r.progress.lastCovered ? `${r.progress.lastCovered.number}. ${r.progress.lastCovered.title}` : "",
        r.progress.nextMeeting ?? "",
      ]),
    ]);
  }

  return (
    <div className="page-animate">
      <div className="mb-6">
        <h2 className="font-serif text-[26px] text-nc-dark">Syllabus Progress</h2>
        <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
          What each circle has covered and what remains. “Expected” counts the circle’s scheduled meetings so far,
          skipping holidays, so you can see who needs support.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:gap-4">
        <StatCard label="Active circles" value={s?.circles ?? "—"} meta="Following the syllabus" color="purple" />
        <StatCard label="On track" value={s?.onTrack ?? "—"} meta="Within a session of plan" color="green" />
        <StatCard label="Behind" value={s?.behind ?? "—"} meta="2+ sessions behind" color="red" />
        <StatCard label="Needs setup" value={s ? s.noTrack + s.notScheduled : "—"} meta="No track or schedule" color="gold" />
        <StatCard label="Sessions covered" value={s?.sessionsCovered ?? "—"} meta="Across all circles" color="teal" />
      </div>

      <NcCard className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-nc-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Circle, murabbi, area…" aria-label="Search circles"
              className="h-9 w-52 rounded-md border border-input bg-card pl-8 pr-3 text-[13px] focus:border-primary focus:outline-none" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"
            className="h-9 rounded-md border border-input bg-card px-2.5 text-[13px] focus:border-primary focus:outline-none">
            <option value="">All statuses</option>
            <option value="behind">Behind</option>
            <option value="on-track">On track</option>
            <option value="not-scheduled">No schedule</option>
            <option value="no-track">No syllabus</option>
          </select>
          <button className="btn-outline ml-auto !py-2 text-[12.5px]" onClick={exportCsv}>Export CSV</button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-nc-muted">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-nc-muted">No circles match.</div>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[860px] text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-nc-muted">
                  <th className="px-3 py-2 font-medium">Circle</th>
                  <th className="px-3 py-2 font-medium">Track</th>
                  <th className="px-3 py-2 font-medium">Progress</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">This week</th>
                  <th className="px-3 py-2 font-medium">Next meeting</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const p = r.progress;
                  const pct = p.total ? Math.round((p.covered / p.total) * 100) : 0;
                  const expPct = p.total && p.expected != null ? Math.min(100, Math.round((p.expected / p.total) * 100)) : null;
                  return (
                    <tr key={r.circle._id} className="cursor-pointer border-b border-border/60 hover:bg-muted/50" onClick={() => setOpenId(r.circle._id)}>
                      <td className="px-3 py-3">
                        <div className="font-medium text-nc-dark">{r.circle.name}</div>
                        <div className="text-[11.5px] text-nc-muted">{r.murabbi?.fullName ?? "—"} · {scheduleLabel(r.circle)}</div>
                      </td>
                      <td className="px-3 py-3 text-nc-dark">{r.track?.name ?? <span className="text-nc-muted">—</span>}</td>
                      <td className="px-3 py-3">
                        <div className="relative h-2 w-40 overflow-visible rounded-full bg-muted" title={`${p.covered} covered of ${p.total}${p.expected != null ? `, ${p.expected} expected` : ""}`}>
                          <div className="h-full rounded-full bg-plum" style={{ width: `${pct}%` }} />
                          {expPct != null && <div className="absolute -top-1 h-4 w-0.5 bg-gold" style={{ left: `${expPct}%` }} />}
                        </div>
                        <div className="mt-1 text-[11.5px] text-nc-muted">
                          {p.covered}/{p.total} covered{p.expected != null ? ` · ${p.expected} expected` : ""}{p.partial ? ` · ${p.partial} in progress` : ""}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_META[p.status]?.cls)}>
                          {STATUS_META[p.status]?.label}{p.status === "behind" ? ` by ${p.behindBy}` : ""}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {p.current ? (
                          <>
                            <div className="max-w-[220px] truncate text-nc-dark">{p.current.number}. {p.current.title}</div>
                            <div className="text-[11.5px] text-nc-muted">{THEMES[p.current.month - 1]}</div>
                          </>
                        ) : <span className="text-nc-muted">—</span>}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-nc-dark">{formatDay(p.nextMeeting)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-[11.5px] text-nc-muted"><span className="mr-1 inline-block h-3 w-0.5 bg-gold align-middle" /> marks where the circle should be by now.</p>
          </div>
        )}
      </NcCard>

      <CircleSyllabusModal circleId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
