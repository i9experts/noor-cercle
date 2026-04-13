import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import { moduleData, getInitials } from "@/data/mockData";

const candidates = ['Sara Hussain', 'Khalid Mehmood', 'Ruqaiya Tariq', 'Hamza Sheikh', 'Noor Fatima', 'Bilal Akhtar'];

export default function TrainingPage() {
  return (
    <div className="page-animate">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Batches Completed" value={2} meta="18 Murabbis certified" color="teal" />
        <StatCard label="Batch 3 — Active" value={6} meta="Candidates registered" color="gold" />
        <StatCard label="Modules Available" value={6} meta="Day 1: M1–M3 · Day 2: M4–M6" color="green" />
        <StatCard label="Pass Rate" value="94%" meta="All cohorts combined" color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <NcCard>
          <CardHeader>
            <CardTitle>Tier 1 Training — Batch 3</CardTitle>
            <NcBadge variant="amber">Starting 20 Apr 2025</NcBadge>
          </CardHeader>
          <div className="flex flex-col gap-2.5">
            <div className="p-3 bg-muted rounded-sm">
              <div className="flex justify-between mb-1"><span className="text-[13px] font-semibold text-foreground">Day 1 — Foundation & Identity</span><span className="text-[11px] text-nc-muted">20 Apr 2025</span></div>
              <div className="text-xs text-nc-muted">9:00 AM – 3:00 PM · Modules 1, 2 & 3 · 5 hours</div>
            </div>
            <div className="p-3 bg-muted rounded-sm">
              <div className="flex justify-between mb-1"><span className="text-[13px] font-semibold text-foreground">Day 2 — Skill, Safety & The Year</span><span className="text-[11px] text-nc-muted">21 Apr 2025</span></div>
              <div className="text-xs text-nc-muted">8:45 AM – 3:00 PM · Modules 4, 5 & 6 · 5 hours</div>
            </div>
          </div>
        </NcCard>

        <NcCard>
          <CardHeader><CardTitle>Batch 3 Candidates</CardTitle></CardHeader>
          {candidates.map((c) => (
            <div key={c} className="flex items-center gap-2.5 py-2 border-b border-border last:border-b-0">
              <div className="w-8 h-8 rounded-lg bg-teal-lt flex items-center justify-center text-[11px] font-bold text-teal">{getInitials(c)}</div>
              <div className="flex-1 text-[13px] font-medium text-foreground">{c}</div>
              <NcBadge variant="amber">Registered</NcBadge>
            </div>
          ))}
        </NcCard>
      </div>

      <div className="mt-5">
        <SectionTitle>Training Modules — Tier 1 Asaas (18 hours)</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          {moduleData.map((m) => (
            <div key={m.n} className="border border-border rounded-lg overflow-hidden bg-card">
              <div className="p-4 px-5 flex items-center gap-3.5 border-b border-border">
                <div className="w-10 h-10 bg-nc-dark rounded-xl flex items-center justify-center font-serif text-[22px] text-sidebar-primary flex-shrink-0">{m.n}</div>
                <div>
                  <div className="font-semibold text-sm text-foreground">{m.title}</div>
                  <div className="text-[11px] text-nc-muted mt-0.5">{m.time}</div>
                </div>
                <NcBadge variant={m.complete ? 'green' : 'dark'} className="ml-auto">{m.complete ? 'Ready' : 'Upcoming'}</NcBadge>
              </div>
              <div className="p-4 px-5">
                <div className="text-[12.5px] text-slate leading-relaxed">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
