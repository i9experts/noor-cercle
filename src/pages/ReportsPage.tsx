import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid,
} from "recharts";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import ProgressBar from "@/components/shared/ProgressBar";
import { reportsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CLR = {
  teal  : 'hsl(327, 58%, 26%)', // brand plum
  tealLt: 'hsl(36, 54%, 53%)',  // brand gold
  mutedFg: 'hsl(327, 8%, 50%)',
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-nc text-xs">
      <p className="font-semibold text-foreground mb-0.5">{label}</p>
      <p className="text-teal">{payload[0].value} student{payload[0].value !== 1 ? "s" : ""} enrolled</p>
    </div>
  );
}

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
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:gap-4 mb-7">
        <StatCard label="Total Students" value={overview.totalStudents ?? "—"} meta="Enrolled" color="teal" />
        <StatCard label="Active Circles" value={overview.activeCircles ?? "—"} meta="Running" color="gold" />
        <StatCard label="Avg. Attendance" value={overview.avgAttendanceRate ? `${overview.avgAttendanceRate}%` : "—"} meta="All sessions" color="green" />
        <StatCard label="Awards Given" value={overview.totalIncentivesAwarded ?? "—"} meta="Total Noor Points" color="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
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
                    <span className={`font-semibold ${m.color === "teal" ? "text-teal" : m.color === "gold" ? "text-gold-dim" : "text-nc-green"}`}>
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
            <div className="scroll-hover max-h-[220px] flex flex-col gap-2.5">
              {incentiveBreakdown.map((b: any) => (
                <div key={b._id} className="flex justify-between items-center p-2.5 bg-muted rounded-sm">
                  <div>
                    <div className="text-[13px] font-semibold">{b._id}</div>
                    <div className="text-[11px] text-nc-muted">{b.count} times · {b.totalPoints} total pts</div>
                  </div>
                  <span className="font-bold text-gold-dim font-serif">{b.totalPoints}</span>
                </div>
              ))}
            </div>
          )}
        </NcCard>
      </div>

      <NcCard className="mt-5">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle sub="New students enrolled per month">Monthly Student Enrollments</CardTitle>
            {!loading && (
              <span className="text-xs text-nc-muted">
                {monthlyEnrollments.length} month{monthlyEnrollments.length !== 1 ? "s" : ""} of data
              </span>
            )}
          </div>
        </CardHeader>
        {loading ? (
          <div className="h-[180px] flex items-center justify-center text-nc-muted text-sm animate-pulse">Loading…</div>
        ) : monthlyEnrollments.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center text-nc-muted text-sm">No enrollment data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={monthlyEnrollments.map((m: any) => ({
                month: MONTH_NAMES[(m._id?.month ?? 1) - 1] + (m._id?.year ? ` '${String(m._id.year).slice(2)}` : ''),
                count: m.count,
              }))}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              barCategoryGap="35%"
            >
              <CartesianGrid vertical={false} strokeDasharray="4 3" stroke="hsl(327,20%,92%)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: CLR.mutedFg }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: CLR.mutedFg }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(327,40%,96%)", radius: 4 }} />
              <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={48} animationDuration={500}>
                {monthlyEnrollments.map((_: any, i: number) => (
                  <Cell key={i} fill={CLR.teal} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </NcCard>
    </div>
  );
}