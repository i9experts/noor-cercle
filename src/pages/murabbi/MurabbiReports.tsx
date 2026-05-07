import { useEffect, useState } from "react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import StatCard from "@/components/shared/StatCard";
import { BarChart3, FilePieChart, FileSpreadsheet, TrendingUp } from "lucide-react";
import { reportsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

export default function MurabbiReports() {
  const { toast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsService.getMurabbiReport()
      .then((res) => setReport(res.data.data))
      .catch(() => toast({ variant: "destructive", title: "Failed to load report" }))
      .finally(() => setLoading(false));
  }, []);

  const summary = report?.summary || {};
  const reports = report?.reports || [];
  const insights = report?.visualInsights || {};

  return (
    <div className="page-animate">
      <SectionTitle title="My Reports" subtitle="Track your circle's performance and view analytics." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="My Students" value={summary.totalStudents ?? "—"} meta="Active students" color="teal" />
        <StatCard label="Sessions Done" value={summary.sessionsCompleted ?? "—"} meta="Year 1" color="green" />
        <StatCard label="Attendance Rate" value={summary.avgAttendanceRate ? `${summary.avgAttendanceRate}%` : "—"} meta="All sessions" color="gold" />
        <StatCard label="Points Awarded" value={summary.totalPointsAwarded ?? "—"} meta="Total Noor Points" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NcCard>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            {loading ? (
              <div className="text-center py-8 text-nc-muted text-sm animate-pulse">Loading...</div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      {["Report Name", "Date", "Type", "Status", "Action"].map((h) => (
                        <th key={h} className="px-4 py-3 text-[11px] font-bold text-nc-muted uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reports.map((r: any) => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/5 text-primary rounded-md">
                              <FilePieChart className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-nc-muted">{r.date}</td>
                        <td className="px-4 py-4 text-xs font-medium">{r.type}</td>
                        <td className="px-4 py-4">
                          <NcBadge variant={r.status === "Generated" ? "green" : "amber"}>{r.status}</NcBadge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button className="text-primary hover:text-primary/80" disabled={r.status !== "Generated"}>
                            <FileSpreadsheet className="h-4 w-4 inline-block" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </NcCard>
        </div>

        <div className="space-y-6">
          <NcCard>
            <CardHeader><CardTitle>Visual Insights</CardTitle></CardHeader>
            {loading ? (
              <div className="text-center py-8 text-nc-muted animate-pulse text-sm">Loading...</div>
            ) : (
              <div className="mt-4 space-y-5">
                {[
                  { label: "Student Engagement", val: insights.studentEngagement || 0, color: "bg-green-500", display: `${insights.studentEngagement || 0}%` },
                  { label: "Curriculum Completion", val: insights.curriculumCompletion || 0, color: "bg-primary", display: `${insights.curriculumCompletion || 0}%` },
                  { label: "Parent Feedback Score", val: Number(insights.parentFeedbackScore || 0) * 20, color: "bg-gold", display: `${insights.parentFeedbackScore || "0.0"}/5` },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-nc-muted font-medium">{item.label}</span>
                      <span className="font-bold flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" /> {item.display}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${Math.min(100, item.val)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </NcCard>

          <NcCard className="bg-muted/50 border-dashed border-2">
            <div className="text-center py-4">
              <BarChart3 className="h-8 w-8 text-nc-muted mx-auto mb-2 opacity-50" />
              <p className="text-[11px] text-nc-muted px-4">
                Detailed analytics for {new Date().toLocaleString("default", { month: "long" })} will be available on the 1st of next month.
              </p>
            </div>
          </NcCard>
        </div>
      </div>
    </div>
  );
}