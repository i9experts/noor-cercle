import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import ProgressBar from "@/components/shared/ProgressBar";
import { Star } from "lucide-react";

const charIndicators = [
  { name: 'Honesty & Trust (Sidq)', value: 82, color: 'teal' as const },
  { name: 'Gratitude (Shukr)', value: 79, color: 'teal' as const },
  { name: 'Empathy & Listening', value: 71, color: 'gold' as const },
  { name: 'Muslim Identity Confidence', value: 88, color: 'teal' as const },
  { name: 'Family Relationship Quality', value: 75, color: 'green' as const },
  { name: 'Consistency (Istiqamah)', value: 64, color: 'gold' as const },
];

const reviews = [
  { murabbi: 'Umm Aisha — Gulshan Circle 1', session: 'Session 16', text: '"Nadia showed remarkable courage in the circle today — she shared something vulnerable for the first time. The group responded beautifully. Three children used the journal independently this week without being reminded."', stars: 5, alert: false },
  { murabbi: 'Br. Hassan — DHA Circle 1', session: 'Session 15', text: '"The gratitude letter activity was the most powerful session so far. Two children delivered letters to their parents and reported back — both parents were moved to tears. Alhamdulillah."', stars: 5, alert: false },
  { murabbi: 'Sr. Maryam — Clifton Circle 1', session: 'Needs attention', text: '"Omar has been absent 3 consecutive sessions. His mother says he is resistant. Requesting supervisor visit and parent meeting to be scheduled before Session 17."', stars: 0, alert: true },
];

export default function PerformancePage() {
  return (
    <div className="page-animate">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Avg. Character Score" value="76%" meta="↑ 12% since Month 1" color="teal" metaUp />
        <StatCard label="Journal Compliance" value="68%" meta="Students journaling daily" color="gold" />
        <StatCard label="Home Card Completion" value="74%" meta="Weekly home action cards" color="green" />
        <StatCard label="Parent Satisfaction" value="91%" meta="From latest survey" color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <NcCard>
          <CardHeader><CardTitle sub="Measured monthly by Murabbi observation">Character Growth Indicators</CardTitle></CardHeader>
          <div className="flex flex-col gap-3.5">
            {charIndicators.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className={`font-semibold ${c.color === 'teal' ? 'text-teal' : c.color === 'gold' ? 'text-gold' : 'text-nc-green'}`}>{c.value}%</span>
                </div>
                <ProgressBar value={c.value} color={c.color} />
              </div>
            ))}
          </div>
        </NcCard>

        <NcCard>
          <CardHeader>
            <CardTitle>Murabbi Reviews & Notes</CardTitle>
            <button className="btn-primary">+ Add Review</button>
          </CardHeader>
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <div key={r.murabbi} className={`p-3 rounded-sm ${r.alert ? 'bg-nc-amber-lt border-l-[3px] border-nc-amber' : 'bg-muted'}`}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[13px] font-semibold text-foreground">{r.murabbi}</span>
                  <span className="text-[11px] text-nc-muted">{r.session}</span>
                </div>
                <div className="text-[12.5px] text-slate leading-relaxed">{r.text}</div>
                {r.stars > 0 && (
                  <div className="text-[13px] text-gold mt-1.5 flex items-center gap-0.5">
                    {Array.from({ length: r.stars }, (_, i) => <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />)}
                  </div>
                )}
                {r.alert && <NcBadge variant="amber" className="mt-1.5">Follow-up required</NcBadge>}
              </div>
            ))}
          </div>
        </NcCard>
      </div>
    </div>
  );
}
