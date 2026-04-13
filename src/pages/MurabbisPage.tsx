import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import ProgressBar from "@/components/shared/ProgressBar";
import { murabbis, getInitials } from "@/data/mockData";

export default function MurabbisPage({ onAddMurabbi }: { onAddMurabbi: () => void }) {
  return (
    <div className="page-animate">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Total Murabbis" value={9} meta="All Tier 1 Certified" color="teal" />
        <StatCard label="In Training" value={3} meta="Batch 3 · Starts Apr 20" color="gold" />
        <StatCard label="Tier 2 Candidates" value={2} meta="After Year 1 completion" color="green" />
        <StatCard label="Avg. Circle Health" value="88%" meta="Based on KPIs" color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <NcCard>
          <CardHeader>
            <CardTitle>Active Murabbis</CardTitle>
            <button className="btn-outline" onClick={onAddMurabbi}>+ Add Murabbi</button>
          </CardHeader>
          {murabbis.map((m) => (
            <div key={m.name} className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
              <div className="w-[38px] h-[38px] rounded-xl bg-teal-lt flex items-center justify-center text-sm font-bold text-teal flex-shrink-0">{getInitials(m.name)}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{m.name}</div>
                <div className="text-xs text-nc-muted mt-px">{m.circle} · {m.tier}</div>
              </div>
              <div className="text-right">
                <NcBadge variant={m.status === 'excellent' ? 'green' : 'amber'}>{m.status}</NcBadge>
                <div className="text-[11px] text-nc-muted mt-1">{m.att}% att · {m.students} students</div>
              </div>
            </div>
          ))}
        </NcCard>

        <NcCard>
          <CardHeader><CardTitle>Murabbi Certification Tiers</CardTitle></CardHeader>
          <div className="flex flex-col gap-3">
            <div className="p-3.5 bg-teal-lt rounded-sm border-l-4 border-teal">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-teal text-sm">Tier 1 — Asaas (Foundation)</div>
                  <div className="text-xs text-nc-muted mt-0.5">18 hours · 2-day training · Leads one circle</div>
                </div>
                <NcBadge variant="teal">9 certified</NcBadge>
              </div>
              <ProgressBar value={100} className="mt-2.5" />
            </div>
            <div className="p-3.5 bg-gold-lt rounded-sm border-l-4 border-gold">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-gold-dim text-sm">Tier 2 — Mutqin (Proficient)</div>
                  <div className="text-xs text-nc-muted mt-0.5">After 1 complete year · Mentors Tier 1 Murabbis</div>
                </div>
                <NcBadge variant="amber">0 certified</NcBadge>
              </div>
              <ProgressBar value={0} color="gold" className="mt-2.5" />
            </div>
            <div className="p-3.5 bg-muted rounded-sm border-l-4 border-slate">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate text-sm">Tier 3 — Mudarrib (Master Trainer)</div>
                  <div className="text-xs text-nc-muted mt-0.5">2 circles + Tier 2 · Trains other Murabbis</div>
                </div>
                <NcBadge variant="dark">0 certified</NcBadge>
              </div>
              <ProgressBar value={0} className="mt-2.5" />
            </div>
          </div>
        </NcCard>
      </div>
    </div>
  );
}
