import { useEffect, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import QuranBox from "@/components/shared/QuranBox";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import SectionTitle from "@/components/shared/SectionTitle";
import { murabbisService } from "@/services/api.service";

export default function MurabbiDashboard() {
  const [data, setData] = useState<any>(null);
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

  const stats = data?.stats || {};
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
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-7">
        <StatCard label="My Students" value={stats.totalStudents ?? "—"} meta={`In ${stats.activeCircles ?? 0} circles`} color="teal" />
        <StatCard label="Attendance Rate" value={stats.attendanceRate ? `${stats.attendanceRate}%` : "—"} meta="All sessions" color="purple" metaUp />
        <StatCard label="Sessions Done" value={stats.sessionsCompleted ?? "—"} meta="Year 1" color="gold" />
        <StatCard label="Next Session" value={`#${stats.nextSessionNumber ?? "—"}`} meta="Upcoming" color="green" />
      </div>

      {topStudents.length > 0 && (
        <NcCard>
          <CardHeader>
            <CardTitle sub="Top students by Noor Points">My Top Students</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3 mt-2">
            {topStudents.map((s: any) => (
              <div key={s._id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {s.fullName?.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{s.fullName}</div>
                    <div className="text-[11px] text-nc-muted">{s.characterScore ?? 0} character score</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-gold-dim font-bold text-sm">{s.noorPoints ?? 0}</span>
                  <span className="text-[10px] text-nc-muted ml-1">pts</span>
                </div>
              </div>
            ))}
          </div>
        </NcCard>
      )}
    </div>
  );
}
