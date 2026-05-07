import { useEffect, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import QuranBox from "@/components/shared/QuranBox";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import Timeline from "@/components/shared/Timeline";
import { adminService } from "@/services/api.service";
import { reportsService } from "@/services/api.service";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getDashboard(),
      reportsService.getAttendanceTrend(),
    ])
      .then(([dashRes, trendRes]) => {
        setStats(dashRes.data.data);
        const trendData = trendRes.data.data || [];
        setTrend(trendData.map((t: any) => t.attendanceRate || 0));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-animate flex items-center justify-center h-64">
        <div className="text-nc-muted text-sm animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  const attData = trend.length > 0 ? trend : [72, 75, 79, 82, 85, 84, 87, 86, 88, 89, 91, 88, 90, 92, 91, 87];

  return (
    <div className="page-animate">
      <QuranBox
        arabic="فَأَقِمْ وَجْهَكَ لِلدِّينِ حَنِيفًا ۚ فِطْرَتَ اللَّهِ الَّتِي فَطَرَ النَّاسَ عَلَيْهَا"
        translation='"The fitrah of Allah upon which He has created all people."'
        reference="SURAH AR-RUM · 30:30"
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Total Students" value={stats?.totalStudents ?? "—"} meta="Enrolled students" color="teal" />
        <StatCard label="Active Circles" value={stats?.activeCircles ?? "—"} meta="Across neighbourhoods" color="gold" />
        <StatCard label="Certified Murabbis" value={stats?.totalMurabbis ?? "—"} meta="Registered murabbis" color="green" />
        <StatCard label="Avg. Attendance" value={stats ? `${stats.avgAttendanceRate ?? 0}%` : "—"} meta="All circles" color="purple" />
        <StatCard label="Sessions Completed" value={stats?.sessionsCompleted ?? "—"} meta="Year 1" color="teal" />
        <StatCard label="Parent Engagement" value={stats ? `${stats.parentEngagement ?? 0}%` : "—"} meta="This month" color="gold" />
      </div>

      {/* Attendance Chart */}
      <NcCard className="mt-5">
        <CardHeader>
          <CardTitle sub={`Sessions 1–${attData.length} · Year 1`}>Attendance Trend — All Circles</CardTitle>
        </CardHeader>
        <div className="h-40 bg-muted rounded-sm flex items-end p-3 px-2 gap-1 overflow-hidden relative">
          {attData.map((v, i) => (
            <div
              key={i}
              className="flex-1 bg-teal-lt rounded-t hover:bg-teal transition-colors cursor-pointer relative"
              style={{ height: `${v}%` }}
              title={`Session ${i + 1}: ${v}%`}
            >
              {i === attData.length - 1 && (
                <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[9px] text-nc-muted whitespace-nowrap">{v}%</div>
              )}
            </div>
          ))}
        </div>
      </NcCard>
    </div>
  );
}