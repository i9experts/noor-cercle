import { useEffect, useState } from "react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import { attendanceService, circlesService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import NcBadge from "@/components/shared/NcBadge";

export default function AttendancePage() {
  const { toast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([attendanceService.getAll(), circlesService.getAll()])
      .then(([aRes, cRes]) => {
        setRecords(aRes.data.data || []);
        setCircles(cRes.data.data || []);
      })
      .catch(() => toast({ variant: "destructive", title: "Failed to load attendance" }))
      .finally(() => setLoading(false));
  }, []);

  const presentRate = (rec: any) => {
    if (!rec.records?.length) return 0;
    const present = rec.records.filter((r: any) => r.status === "present").length;
    return Math.round((present / rec.records.length) * 100);
  };

  return (
    <div className="page-animate">
      <div className="flex items-center justify-between mb-5">
        <div className="text-lg font-semibold text-foreground">Attendance Management</div>
        <div className="flex gap-2.5">
          <span className="text-sm text-nc-muted self-center">{records.length} sessions recorded</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-nc-muted text-sm animate-pulse">Loading attendance records...</div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          <NcCard>
            <CardHeader>
              <CardTitle>All Attendance Records</CardTitle>
            </CardHeader>
            {records.length === 0 ? (
              <div className="text-center py-10 text-nc-muted text-sm">No attendance submitted yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13.5px]">
                  <thead>
                    <tr>
                      {["Circle", "Session #", "Date", "Topic", "Students", "Present %", "Murabbi"].map((h) => (
                        <th key={h} className="bg-muted px-3.5 py-2.5 text-left text-xs font-semibold text-nc-muted uppercase tracking-wide border-b border-border">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec) => (
                      <tr key={rec._id} className="hover:bg-teal-lt">
                        <td className="px-3.5 py-3 border-b border-border font-medium">{rec.circle?.name || "—"}</td>
                        <td className="px-3.5 py-3 border-b border-border text-center font-bold text-teal">#{rec.sessionNumber}</td>
                        <td className="px-3.5 py-3 border-b border-border text-nc-muted">
                          {new Date(rec.sessionDate).toLocaleDateString()}
                        </td>
                        <td className="px-3.5 py-3 border-b border-border text-slate max-w-[180px] truncate">{rec.topic}</td>
                        <td className="px-3.5 py-3 border-b border-border text-center">{rec.records?.length || 0}</td>
                        <td className="px-3.5 py-3 border-b border-border">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${presentRate(rec) >= 85 ? "bg-nc-green" : presentRate(rec) >= 70 ? "bg-gold" : "bg-nc-red"}`}
                                style={{ width: `${presentRate(rec)}%` }} />
                            </div>
                            <span className={`text-xs font-bold ${presentRate(rec) >= 85 ? "text-nc-green" : presentRate(rec) >= 70 ? "text-gold-dim" : "text-nc-red"}`}>
                              {presentRate(rec)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-3.5 py-3 border-b border-border text-nc-muted text-xs">{rec.murabbi?.fullName || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </NcCard>
        </div>
      )}
    </div>
  );
}