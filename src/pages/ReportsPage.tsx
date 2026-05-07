import { useEffect, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import ProgressBar from "@/components/shared/ProgressBar";
import { reportsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

export default function ReportsPage() {
  const { toast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsService.getAdminReport()
      .then((res) => setReport(res.data.data))
      .catch(() => toast({ variant: "destructive", title: "Failed to load report" }))
      .finally(() => setLoading(false));
  }, []);

  const overview = report?.overview || {};
  const incentiveBreakdown = report?.incentiveBreakdown || [];
  const monthlyEnrollments = report?.monthlyEnrollments || [];

  const metrics = [
    { label: "Total Students enrolled", value: overview.totalStudents ?? "—", pct: overview.totalStudents ? Math.min(100, Math.round((overview.totalStudents / 120) * 100)) : 0, color: "teal" as const },
    { label: "Active circles running", value: overview.activeCircles ?? "—", pct: overview.activeCircles ? Math.min(100, Math.round((overview.activeCircles / 12) * 100)) : 0, color: "teal" as const },
    { label: "Average attendance rate", value: overview.avgAttendanceRate ? `${overview.avgAttendanceRate}%` : "—", pct: overview.avgAttendanceRate || 0, color: "gold" as const },
    { label: "Total incentives awarded", value: overview.totalIncentivesAwarded ?? "—", pct: 100, color: "green" as const },
  ];

  return (
    <div className="page-animate">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Total Students" value={overview.totalStudents ?? "—"} meta="Enrolled" color="teal" />
        <StatCard label="Active Circles" value={overview.activeCircles ?? "—"} meta="Running" color="gold" />
        <StatCard label="Avg. Attendance" value={overview.avgAttendanceRate ? `${overview.avgAttendanceRate}%` : "—"} meta="All sessions" color="green" />
        <StatCard label="Awards Given" value={overview.totalIncentivesAwarded ?? "—"} meta="Total Noor Points" color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <NcCard>
          <CardHeader><CardTitle>Key Metrics — Year 1 Progress</CardTitle></CardHeader>
          {loading ? (
            <div className="text-center py-8 text-nc-muted text-sm animate-pulse">Loading...</div>
          ) : (
            <div className="flex flex-col gap-3">
              {metrics.map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="text-foreground">{m.label}</span>
                    <span className={`font-semibold ${m.color === "teal" ? "text-teal" : m.color === "gold" ? "text-gold" : "text-nc-green"}`}>
                      {m.value}
                    </span>
                  </div>
                  <ProgressBar value={m.pct} color={m.color} />
                </div>
              ))}
            </div>
          )}
        </NcCard>

        <NcCard>
          <CardHeader><CardTitle>Awards Breakdown</CardTitle></CardHeader>
          {loading ? (
            <div className="text-center py-8 text-nc-muted text-sm animate-pulse">Loading...</div>
          ) : incentiveBreakdown.length === 0 ? (
            <div className="text-center py-8 text-nc-muted text-sm">No awards given yet.</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {incentiveBreakdown.map((b: any) => (
                <div key={b._id} className="flex justify-between items-center p-2.5 bg-muted rounded-sm">
                  <div>
                    <div className="text-[13px] font-semibold">{b._id}</div>
                    <div className="text-[11px] text-nc-muted">{b.count} times · {b.totalPoints} total pts</div>
                  </div>
                  <span className="font-bold text-gold font-serif">{b.totalPoints}</span>
                </div>
              ))}
            </div>
          )}
        </NcCard>
      </div>

      {monthlyEnrollments.length > 0 && (
        <NcCard className="mt-5">
          <CardHeader><CardTitle sub="Last 6 months">Monthly Student Enrollments</CardTitle></CardHeader>
          <div className="h-32 bg-muted rounded-sm flex items-end p-3 gap-2 overflow-hidden">
            {monthlyEnrollments.map((m: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[9px] text-nc-muted">{m.count}</div>
                <div className="w-full bg-teal rounded-t" style={{ height: `${Math.max(4, (m.count / Math.max(...monthlyEnrollments.map((x: any) => x.count))) * 80)}px` }} />
                <div className="text-[9px] text-nc-muted">M{m._id?.month}</div>
              </div>
            ))}
          </div>
        </NcCard>
      )}
    </div>
  );
}