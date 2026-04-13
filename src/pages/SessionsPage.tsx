import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";

const months = ['Identity', 'Honesty', 'Family', 'Gratitude', 'Courage', 'Friendship', 'Patience', 'Generosity', 'Body', 'Knowledge', 'Community', 'Legacy'];
const currentMonth = 4;

export default function SessionsPage() {
  return (
    <div className="page-animate">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-serif text-[22px] text-foreground">Sessions & Curriculum</div>
          <div className="text-xs text-nc-muted mt-0.5">40 sessions · 12 months · All circles</div>
        </div>
        <div className="flex gap-2.5">
          <select className="px-3.5 py-[9px] border border-border rounded-sm text-sm bg-card text-foreground w-[200px]">
            <option>Gulshan Circle 1</option><option>All Circles</option>
          </select>
          <button className="btn-primary">View Session Guide</button>
        </div>
      </div>

      <NcCard>
        <CardHeader><CardTitle sub="Month 4 of 12 · Session 16 this week">Year Curriculum Overview</CardTitle></CardHeader>
        <div className="grid grid-cols-12 gap-1.5 mb-3">
          {months.map((m, i) => {
            const num = i + 1;
            const isCurrent = num === currentMonth;
            const isPast = num < currentMonth;
            return (
              <div
                key={m}
                className={`p-2.5 px-1.5 rounded-lg text-center cursor-pointer transition-all hover:scale-105 border ${
                  isPast ? 'bg-teal border-teal text-primary-foreground' :
                  isCurrent ? 'bg-gold border-gold text-primary-foreground' :
                  'bg-muted border-border text-nc-muted'
                }`}
              >
                <div className={`text-[11px] font-bold opacity-60`}>M{num}</div>
                <div className="text-[11px] font-semibold mt-0.5 leading-tight">{m}</div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 text-xs text-nc-muted">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-teal rounded-[2px] inline-block" />Completed</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-gold rounded-[2px] inline-block" />Current</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-border rounded-[2px] border border-border inline-block" />Upcoming</span>
        </div>
      </NcCard>
    </div>
  );
}
