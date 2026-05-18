import { useEffect, useRef, useState } from "react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import StatCard from "@/components/shared/StatCard";
import { BarChart3, FilePieChart, Printer, Download, TrendingUp, Loader2 } from "lucide-react";
import { reportsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

// ─── Print helpers ────────────────────────────────────────────────────────────

function rateColor(v: number) {
  if (v >= 80) return "#0e6b72";
  if (v >= 60) return "#d4a017";
  return "#e53e3e";
}

function buildReportHTML(detail: any, reportName: string): string {
  const { circle, students, sessions, summary, generatedAt } = detail;
  const circleName   = circle?.name ?? "—";
  const murabbiName  = circle?.murabbi?.fullName ?? "—";
  const neighbourhood = circle?.neighbourhood?.name ?? "—";
  const city         = circle?.neighbourhood?.city ? `, ${circle.neighbourhood.city}` : "";
  const dateStr      = new Date(generatedAt).toLocaleDateString("en-PK", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const sessionRows = sessions.map((s: any) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;">#${s.sessionNumber}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">
        ${s.sessionDate ? new Date(s.sessionDate).toLocaleDateString("en-PK", { day:"numeric", month:"short", year:"numeric" }) : "—"}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${s.topic}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${s.present}/${s.total}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;color:${rateColor(s.attendanceRate)};">
        ${s.attendanceRate}%
      </td>
    </tr>
  `).join("");

  const studentRows = students.map((s: any) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:500;">${s.fullName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;">${s.fatherName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${s.present}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${s.total - s.present}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;color:${rateColor(s.attendanceRate)};">
        ${s.attendanceRate}%
      </td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${reportName}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color:#1a202c; background:#fff; padding:32px; font-size:13px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0e6b72; padding-bottom:20px; margin-bottom:24px; }
    .org { font-size:22px; font-weight:700; color:#0e6b72; letter-spacing:-0.5px; }
    .org-sub { font-size:11px; color:#64748b; margin-top:2px; }
    .report-meta { text-align:right; }
    .report-title { font-size:16px; font-weight:700; color:#1a202c; }
    .report-date { font-size:11px; color:#64748b; margin-top:4px; }
    .info-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:24px; }
    .info-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; }
    .info-label { font-size:10px; font-weight:700; text-transform:uppercase; color:#64748b; letter-spacing:0.5px; margin-bottom:4px; }
    .info-value { font-size:15px; font-weight:700; color:#1a202c; }
    .stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:28px; }
    .stat-box { background:#f0fdfa; border:1px solid #99f6e4; border-radius:8px; padding:12px; text-align:center; }
    .stat-val { font-size:24px; font-weight:800; color:#0e6b72; }
    .stat-label { font-size:10px; color:#64748b; margin-top:2px; }
    h2 { font-size:14px; font-weight:700; color:#0e6b72; margin-bottom:12px; border-left:3px solid #0e6b72; padding-left:10px; }
    table { width:100%; border-collapse:collapse; margin-bottom:28px; }
    thead tr { background:#f1f5f9; }
    th { padding:10px 12px; text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; }
    tbody tr:hover { background:#f8fafc; }
    .footer { margin-top:32px; border-top:1px solid #e2e8f0; padding-top:16px; display:flex; justify-content:space-between; font-size:10px; color:#94a3b8; }
    @media print {
      body { padding:16px; }
      .no-print { display:none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="org">Noor Circle</div>
      <div class="org-sub">Circle Performance Report</div>
    </div>
    <div class="report-meta">
      <div class="report-title">${reportName}</div>
      <div class="report-date">Generated: ${dateStr}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="info-label">Circle</div>
      <div class="info-value">${circleName}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Murabbi</div>
      <div class="info-value">${murabbiName}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Neighbourhood</div>
      <div class="info-value">${neighbourhood}${city}</div>
    </div>
  </div>

  <div class="stat-grid">
    <div class="stat-box">
      <div class="stat-val">${summary.totalStudents}</div>
      <div class="stat-label">Active Students</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">${summary.sessionsCompleted}</div>
      <div class="stat-label">Sessions Held</div>
    </div>
    <div class="stat-box">
      <div class="stat-val" style="color:${rateColor(summary.avgAttendanceRate)}">${summary.avgAttendanceRate}%</div>
      <div class="stat-label">Avg. Attendance</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">${summary.totalPresent}</div>
      <div class="stat-label">Total Attended</div>
    </div>
  </div>

  <h2>Session-wise Attendance</h2>
  ${sessions.length === 0 ? '<p style="color:#94a3b8;margin-bottom:24px;">No sessions recorded yet.</p>' : `
  <table>
    <thead><tr>
      <th>Session</th><th>Date</th><th>Topic</th><th style="text-align:center;">Present/Total</th><th style="text-align:center;">Rate</th>
    </tr></thead>
    <tbody>${sessionRows}</tbody>
  </table>`}

  <h2>Student Attendance Summary</h2>
  ${students.length === 0 ? '<p style="color:#94a3b8;margin-bottom:24px;">No students enrolled.</p>' : `
  <table>
    <thead><tr>
      <th>Student Name</th><th>Father's Name</th><th style="text-align:center;">Present</th><th style="text-align:center;">Absent</th><th style="text-align:center;">Rate</th>
    </tr></thead>
    <tbody>${studentRows}</tbody>
  </table>`}

  <div class="footer">
    <span>Noor Circle — Confidential Report</span>
    <span>Printed on ${new Date().toLocaleDateString("en-PK")}</span>
  </div>
</body>
</html>`;
}

function openPrintWindow(html: string) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MurabbiReports() {
  const { toast } = useToast();
  const [report, setReport]       = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    reportsService.getMurabbiReport()
      .then((res) => setReport(res.data.data))
      .catch(() => toast({ variant: "destructive", title: "Failed to load report" }))
      .finally(() => setLoading(false));
  }, []);

  const summary  = report?.summary        || {};
  const reports  = report?.reports        || [];
  const insights = report?.visualInsights || {};

  const handleGenerate = async (r: any, mode: "print" | "pdf") => {
    if (r.status !== "Generated") {
      toast({ title: "No data yet — complete at least one session for this circle." });
      return;
    }
    setGenerating(r.id + mode);
    try {
      const res = await reportsService.getCircleReportDetail(r.id.toString());
      const detail = res.data.data;
      const html = buildReportHTML(detail, r.name);
      openPrintWindow(html);
    } catch {
      toast({ variant: "destructive", title: "Failed to generate report." });
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="page-animate">
      <SectionTitle title="My Reports" subtitle="Track your circle's performance and view analytics." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="My Students"    value={summary.totalStudents    ?? "—"} meta="Active students"   color="teal"   />
        <StatCard label="Sessions Done"  value={summary.sessionsCompleted ?? "—"} meta="Year 1"            color="green"  />
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
            ) : reports.length === 0 ? (
              <div className="text-center py-12 text-nc-muted text-sm">No reports available yet.</div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      {["Report Name", "Date", "Type", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-[11px] font-bold text-nc-muted uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reports.map((r: any) => {
                      const isLoading = generating === r.id + "print" || generating === r.id + "pdf";
                      return (
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
                            <NcBadge variant={r.status === "Generated" ? "green" : "amber"}>
                              {r.status}
                            </NcBadge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 justify-end">
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-nc-muted" />
                              ) : (
                                <>
                                  <button
                                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 bg-teal/10 hover:bg-teal/20 text-teal border border-teal/30 rounded-md transition-colors disabled:opacity-40"
                                    onClick={() => handleGenerate(r, "print")}
                                    disabled={r.status !== "Generated"}
                                    title="Print Report"
                                  >
                                    <Printer className="h-3.5 w-3.5" /> Print
                                  </button>
                                  <button
                                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-md transition-colors disabled:opacity-40"
                                    onClick={() => handleGenerate(r, "pdf")}
                                    disabled={r.status !== "Generated"}
                                    title="Download as PDF"
                                  >
                                    <Download className="h-3.5 w-3.5" /> PDF
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
                  { label: "Student Engagement",     val: insights.studentEngagement   || 0, color: "bg-green-500",  display: `${insights.studentEngagement || 0}%` },
                  { label: "Curriculum Completion",  val: insights.curriculumCompletion || 0, color: "bg-primary",    display: `${insights.curriculumCompletion || 0}%` },
                  { label: "Parent Feedback Score",  val: Number(insights.parentFeedbackScore || 0) * 20, color: "bg-gold", display: `${insights.parentFeedbackScore || "0.0"}/5` },
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