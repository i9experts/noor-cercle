import { useEffect, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import QuranBox from "@/components/shared/QuranBox";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import { murabbisService } from "@/services/api.service";

export default function MurabbiDashboard() {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    murabbisService.getDashboard()
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-animate flex items-center justify-center h-64">
      <div className="text-nc-muted text-sm animate-pulse">Loading dashboard...</div>
    </div>
  );

  const stats       = data?.stats       || {};
  const circles     = data?.circles     || [];
  const topStudents = data?.topStudents || [];

  return (
    <div className="page-animate">
      <SectionTitle
        title={`Assalam-o-Alaikum, ${user.fullName || "Murabbi"}!`}
        subtitle="Here is what's happening in your circles today."
      />
      <QuranBox
        arabic="اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ"
        translation='"Read in the name of your Lord who created."'
        reference="SURAH AL-ALAQ · 96:1"
      />

      {/* Stats row */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-7">
        <StatCard label="My Students"    value={stats.totalStudents  ?? "—"} meta={`${stats.activeStudents ?? 0} active`}    color="teal"   />
        <StatCard label="Active Students" value={stats.activeStudents ?? "—"} meta="Currently enrolled"                       color="green"  />
        <StatCard label="My Circles"     value={stats.circleCount    ?? "—"} meta={`${stats.activeCircles ?? 0} active`}     color="gold"   />
        <StatCard label="Active Circles" value={stats.activeCircles  ?? "—"} meta="Running circles"                          color="purple" />
      </div>

      {/* Assigned circles */}
      {circles.length > 0 && (
        <NcCard className="mb-6">
          <CardHeader>
            <CardTitle sub={`${circles.length} circle(s) assigned to you`}>My Circles</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {circles.map((c: any) => (
              <div key={c._id} className="flex items-center justify-between p-3.5 bg-muted/50 rounded-lg border border-border/50">
                <div>
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-[11px] text-nc-muted mt-0.5">
                    {c.neighbourhood?.name || "—"}{c.neighbourhood?.city ? ` · ${c.neighbourhood.city}` : ""} · Capacity: {c.capacity}
                  </div>
                </div>
                <NcBadge variant={c.isActive ? "green" : "amber"}>
                  {c.isActive ? "Active" : "Inactive"}
                </NcBadge>
              </div>
            ))}
          </div>
        </NcCard>
      )}

      {/* Recent students (top by enrollment) */}
      {topStudents.length > 0 && (
        <NcCard>
          <CardHeader>
            <CardTitle sub="Recently enrolled students">My Students</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3 mt-2">
            {topStudents.map((s: any) => (
              <div key={s._id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-lt flex items-center justify-center text-teal font-bold text-sm">
                    {s.fullName?.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{s.fullName}</div>
                    <div className="text-[11px] text-nc-muted">
                      {s.circle?.name || "—"} · Father: {s.fatherName || "—"}
                    </div>
                  </div>
                </div>
                <NcBadge variant={s.isActive ? "green" : "amber"}>
                  {s.isActive ? "Active" : "Inactive"}
                </NcBadge>
              </div>
            ))}
          </div>
        </NcCard>
      )}

      {circles.length === 0 && !loading && (
        <div className="text-center py-16 text-nc-muted text-sm">
          No circles assigned yet. Contact your admin to get assigned to a circle.
        </div>
      )}
    </div>
  );
}
