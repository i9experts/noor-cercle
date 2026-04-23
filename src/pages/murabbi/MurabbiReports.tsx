import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import StatCard from "@/components/shared/StatCard";
import { BarChart3, FileSpreadsheet, FilePieChart, TrendingUp, Calendar } from "lucide-react";

export default function MurabbiReports() {
  const reports = [
    { id: 1, name: "Monthly Performance Report", date: "March 2026", type: "Performance", status: "Generated" },
    { id: 2, name: "Circle Attendance Summary", date: "Q1 2026", type: "Attendance", status: "Generated" },
    { id: 3, name: "Student Progress Review", date: "April 2026", type: "Progress", status: "Processing" },
    { id: 4, name: "Murabbi Evaluation Result", date: "Feb 2026", type: "Evaluation", status: "Generated" },
  ];

  return (
    <div className="page-animate">
      <SectionTitle 
        title="My Reports" 
        subtitle="Track your circle's performance and download detailed analytics."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Avg. Student Score" value="8.4" meta="Out of 10" color="teal" />
        <StatCard label="Circle Growth" value="+12%" meta="Since last month" color="green" metaUp />
        <StatCard label="Peer Review" value="4.9" meta="Top 5% Murabbis" color="gold" />
        <StatCard label="Reports Ready" value="3" meta="1 pending review" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NcCard>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <button className="text-primary text-xs font-bold">Request Custom Report</button>
            </CardHeader>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-[11px] font-bold text-nc-muted uppercase tracking-wider">Report Name</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-nc-muted uppercase tracking-wider">Date Range</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-nc-muted uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-nc-muted uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-nc-muted uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/5 text-primary rounded-md">
                            <FilePieChart className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">{report.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-nc-muted">{report.date}</td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-medium text-foreground">{report.type}</span>
                      </td>
                      <td className="px-4 py-4">
                        <NcBadge variant={report.status === 'Generated' ? 'green' : 'amber'}>
                          {report.status}
                        </NcBadge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button className="text-primary hover:text-primary/80" disabled={report.status !== 'Generated'}>
                          <FileSpreadsheet className="h-4 w-4 inline-block" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NcCard>
        </div>

        <div className="space-y-6">
          <NcCard>
            <CardHeader><CardTitle>Visual Insights</CardTitle></CardHeader>
            <div className="mt-4 space-y-5">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-nc-muted font-medium">Student Engagement</span>
                  <span className="text-green-600 font-bold flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> 88%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[88%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-nc-muted font-medium">Curriculum Completion</span>
                  <span className="text-primary font-bold">64%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[64%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-nc-muted font-medium">Parent Feedback Score</span>
                  <span className="text-gold-dim font-bold">9.2/10</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gold w-[92%]" />
                </div>
              </div>
            </div>
          </NcCard>

          <NcCard className="bg-muted/50 border-dashed border-2">
            <div className="text-center py-4">
              <BarChart3 className="h-8 w-8 text-nc-muted mx-auto mb-2 opacity-50" />
              <p className="text-[11px] text-nc-muted px-4">Detailed analytics for April will be available on the 1st of next month.</p>
            </div>
          </NcCard>
        </div>
      </div>
    </div>
  );
}
