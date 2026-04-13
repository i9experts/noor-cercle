import NcBadge from "@/components/shared/NcBadge";
import { circles, getInitials } from "@/data/mockData";

export default function CirclesPage({ onNewCircle }: { onNewCircle: () => void }) {
  return (
    <div className="page-animate">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-serif text-lg text-foreground">All Circles</div>
          <div className="text-xs text-nc-muted mt-0.5">9 active across 4 neighbourhoods</div>
        </div>
        <button className="btn-gold" onClick={onNewCircle}>+ New Circle</button>
      </div>
      <div className="grid grid-cols-3 gap-[18px]">
        {circles.map((c) => (
          <div key={c.name} className="bg-card border border-border rounded-lg p-5 transition-all cursor-pointer hover:border-teal hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(14,107,114,0.1)]">
            <div className="flex justify-between items-start mb-3.5">
              <div>
                <div className="font-semibold text-[15px] text-foreground">{c.name}</div>
                <div className="text-xs text-nc-muted mt-0.5">{c.nbh}</div>
              </div>
              <NcBadge variant={c.status === 'active' ? 'green' : 'amber'}>{c.status === 'active' ? 'Active' : 'Review'}</NcBadge>
            </div>
            <div className="text-xs text-nc-muted mb-3.5">Murabbi: {c.murabbi}</div>
            <div className="grid grid-cols-3 gap-2 mt-3.5">
              {[
                { val: c.students, label: 'Students' },
                { val: `${c.session}/40`, label: 'Sessions' },
                { val: `${c.att}%`, label: 'Attendance' },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-2 bg-muted rounded-lg">
                  <div className="text-lg font-bold text-teal font-serif">{stat.val}</div>
                  <div className="text-[10px] text-nc-muted uppercase tracking-wide mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
