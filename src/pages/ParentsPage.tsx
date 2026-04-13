import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";

const feedback = [
  { parent: 'Uzma Tariq', child: 'Nadia', msg: 'She came home and immediately wrote in her journal for the first time without being asked. Alhamdulillah.', stars: 5 },
  { parent: 'Ahmed Ahmad', child: 'Zaid', msg: 'He delivered the gratitude letter to my mother. She cried. I cried. This programme is remarkable.', stars: 5 },
  { parent: 'Fatima Raza', child: 'Omar', msg: 'Omar is reluctant to come. He says it is boring. We are working on this at home.', stars: 3 },
];

export default function ParentsPage() {
  return (
    <div className="page-animate">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Registered Parents" value={76} meta="Out of 84 students" color="teal" />
        <StatCard label="Engagement Rate" value="72%" meta="↑ 8% this month" color="gold" metaUp />
        <StatCard label="Home Cards Completed" value="74%" meta="Weekly average" color="green" />
        <StatCard label="Parent Evenings" value={4} meta="Held this term" color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <NcCard>
          <CardHeader><CardTitle>Parent Engagement Tools</CardTitle></CardHeader>
          <div className="flex flex-col gap-2.5">
            <div className="p-3.5 bg-nc-green-lt rounded-sm flex justify-between items-center">
              <div>
                <div className="font-semibold text-sm text-nc-green">Weekly Home Action Card</div>
                <div className="text-xs text-nc-muted mt-0.5">Sent automatically every Friday after the circle</div>
              </div>
              <NcBadge variant="green">Active</NcBadge>
            </div>
            <div className="p-3.5 bg-teal-lt rounded-sm flex justify-between items-center">
              <div>
                <div className="font-semibold text-sm text-teal">Monthly Progress Report</div>
                <div className="text-xs text-nc-muted mt-0.5">Character growth report for each child</div>
              </div>
              <NcBadge variant="teal">Month 4 due</NcBadge>
            </div>
            <div className="p-3.5 bg-gold-lt rounded-sm flex justify-between items-center">
              <div>
                <div className="font-semibold text-sm text-gold-dim">Parent Evening</div>
                <div className="text-xs text-nc-muted mt-0.5">Quarterly gathering — next: Month 6</div>
              </div>
              <button className="btn-outline text-xs">Schedule</button>
            </div>
            <div className="p-3.5 bg-nc-purple-lt rounded-sm flex justify-between items-center">
              <div>
                <div className="font-semibold text-sm text-nc-purple">WhatsApp Updates</div>
                <div className="text-xs text-nc-muted mt-0.5">Post-session brief to parent groups</div>
              </div>
              <button className="btn-outline text-xs">Send now</button>
            </div>
          </div>
        </NcCard>

        <NcCard>
          <CardHeader><CardTitle>Parent Feedback — Session 15</CardTitle></CardHeader>
          <div className="flex flex-col gap-3">
            {feedback.map((f) => (
              <div key={f.parent} className="p-3 bg-muted rounded-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-[13px] font-semibold text-foreground">{f.parent} — about {f.child}</span>
                  <span className="text-sm">{'★'.repeat(f.stars)}{'☆'.repeat(5 - f.stars)}</span>
                </div>
                <div className="text-[12.5px] text-slate italic leading-relaxed">"{f.msg}"</div>
              </div>
            ))}
          </div>
        </NcCard>
      </div>
    </div>
  );
}
