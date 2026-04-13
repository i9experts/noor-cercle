import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import ProgressBar from "@/components/shared/ProgressBar";

const reports = [
  { title: 'Q1 Programme Report', sub: 'For TDW leadership and donors' },
  { title: 'Monthly Attendance Report', sub: 'Per circle, per Murabbi' },
  { title: 'Student Character Progress', sub: 'Individual student report cards' },
  { title: 'Donor Impact Report', sub: 'Quarterly for all donors PKR 50k+' },
];

const metrics = [
  { label: 'Programme completion rate', value: '33% (Month 4/12)', pct: 33, color: 'teal' as const },
  { label: 'Murabbi certification target', value: '9/12 (75%)', pct: 75, color: 'teal' as const },
  { label: 'Fundraising target (PKR 600,000)', value: 'PKR 420,000 (70%)', pct: 70, color: 'gold' as const },
  { label: 'Student enrollment target (120)', value: '84/120 (70%)', pct: 70, color: 'green' as const },
];

export default function ReportsPage() {
  return (
    <div className="page-animate">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Report Period" value="Q1" meta="Jan – Mar 2025" color="teal" />
        <StatCard label="Total Sessions" value={162} meta="Across all circles" color="gold" />
        <StatCard label="Donor Reports Due" value={3} meta="Due this week" color="green" />
        <StatCard label="Impact Score" value="8.4" meta="Out of 10" color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <NcCard>
          <CardHeader><CardTitle>Available Reports</CardTitle></CardHeader>
          <div className="flex flex-col gap-2">
            {reports.map((r) => (
              <div key={r.title} className="p-3 px-3.5 border border-border rounded-sm flex justify-between items-center cursor-pointer transition-all hover:border-teal">
                <div>
                  <div className="text-[13px] font-semibold text-foreground">{r.title}</div>
                  <div className="text-[11px] text-nc-muted">{r.sub}</div>
                </div>
                <button className="btn-outline text-xs">Generate</button>
              </div>
            ))}
          </div>
        </NcCard>
        <NcCard>
          <CardHeader><CardTitle>Key Metrics — Year 1 Progress</CardTitle></CardHeader>
          <div className="flex flex-col gap-3">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-[13px] mb-1">
                  <span>{m.label}</span>
                  <span className={`font-semibold ${m.color === 'teal' ? 'text-teal' : m.color === 'gold' ? 'text-gold' : 'text-nc-green'}`}>{m.value}</span>
                </div>
                <ProgressBar value={m.pct} color={m.color} />
              </div>
            ))}
          </div>
        </NcCard>
      </div>
    </div>
  );
}
