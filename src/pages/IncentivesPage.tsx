import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import { students, getInitials } from "@/data/mockData";
import { useMemo } from "react";
import { Award, Crown, HandHeart, Medal, Sparkles, Trophy } from "lucide-react";

export default function IncentivesPage({ onAwardPoints }: { onAwardPoints: () => void }) {
  const leaderboard = useMemo(() => {
    return [...students].sort((a, b) => (b.char * 2.5 + b.att * 1.2) - (a.char * 2.5 + a.att * 1.2)).slice(0, 8);
  }, []);

  return (
    <div className="page-animate">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-serif text-[22px] text-foreground">Noor Points System</div>
          <div className="text-xs text-nc-muted mt-0.5">Character-based incentives for students and recognition for Murabbis</div>
        </div>
        <button className="btn-gold" onClick={onAwardPoints}>+ Award Points</button>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="bg-gradient-to-br from-nc-dark to-teal-dk rounded-lg p-5 text-primary-foreground relative overflow-hidden">
          <Sparkles className="absolute right-4 top-3 h-8 w-8 text-sidebar-primary/20" />
          <div className="font-serif text-lg text-sidebar-primary mb-1 flex items-center gap-2"><Award className="h-4 w-4" /> Noor Star</div>
          <div className="text-[13px] text-white/65">50+ points in one session — exemplary character, courage, or service</div>
          <div className="font-serif text-4xl mt-2.5">50 <span className="text-sm font-normal text-white/50">pts</span></div>
        </div>
        <div className="bg-gradient-to-br from-teal-dk to-teal rounded-lg p-5 text-primary-foreground relative overflow-hidden">
          <Sparkles className="absolute right-4 top-3 h-8 w-8 text-sidebar-primary/20" />
          <div className="font-serif text-lg mb-1 flex items-center gap-2"><Crown className="h-4 w-4" /> Circle Champion</div>
          <div className="text-[13px] text-white/65">100% attendance for one full month — consistency is character</div>
          <div className="font-serif text-4xl mt-2.5">100 <span className="text-sm font-normal text-white/50">pts</span></div>
        </div>
        <div className="bg-gradient-to-br from-[#1A4A2E] to-nc-green rounded-lg p-5 text-primary-foreground relative overflow-hidden">
          <Sparkles className="absolute right-4 top-3 h-8 w-8 text-sidebar-primary/20" />
          <div className="font-serif text-lg text-sidebar-primary mb-1 flex items-center gap-2"><HandHeart className="h-4 w-4" /> Sadaqah Hero</div>
          <div className="text-[13px] text-white/65">Completed a community service act beyond the session requirement</div>
          <div className="font-serif text-4xl mt-2.5">75 <span className="text-sm font-normal text-white/50">pts</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <NcCard>
          <CardHeader><CardTitle sub="Top 10 by Noor Points — Month 4">Student Leaderboard</CardTitle></CardHeader>
          {leaderboard.map((s, i) => (
            <div key={s.name} className="flex items-center gap-2.5 py-[9px] border-b border-border last:border-b-0">
              <span className={`${i < 3 ? 'text-lg' : 'text-sm'} w-6 text-center flex items-center justify-center`}>
                {i === 0 && <Trophy className="h-4 w-4 text-gold" />}
                {i === 1 && <Medal className="h-4 w-4 text-slate" />}
                {i === 2 && <Award className="h-4 w-4 text-nc-amber" />}
                {i > 2 && i + 1}
              </span>
              <div className="w-[30px] h-[30px] rounded-lg bg-teal-lt flex items-center justify-center text-[11px] font-bold text-teal">{getInitials(s.name)}</div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-foreground">{s.name}</div>
                <div className="text-[11px] text-nc-muted">{s.circle}</div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold font-serif text-gold">{Math.floor(s.char * 2.5 + s.att * 1.2)}</div>
                <div className="text-[10px] text-nc-muted">pts</div>
              </div>
            </div>
          ))}
        </NcCard>

        <NcCard>
          <CardHeader><CardTitle sub="Performance-based recognition system">Murabbi Recognition</CardTitle></CardHeader>
          <div className="flex flex-col gap-3">
            <div className="p-3.5 bg-gold-lt rounded-sm border border-gold/20">
              <div className="font-semibold text-sm text-foreground flex items-center gap-1.5"><Trophy className="h-4 w-4 text-gold" /> Murabbi of the Month</div>
              <div className="text-xs text-nc-muted mt-0.5">Based on attendance, reviews, and parent feedback</div>
              <div className="mt-2.5 p-2.5 bg-gold/10 rounded-lg flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-primary-foreground font-bold text-sm">UA</div>
                <div>
                  <div className="font-semibold text-[13px] text-foreground">Umm Aisha</div>
                  <div className="text-[11px] text-nc-muted">Gulshan Circle 1 · April 2025</div>
                </div>
              </div>
            </div>
            <div className="p-3.5 bg-teal-lt rounded-sm">
              <div className="font-semibold text-sm text-teal mb-2">Recognition Criteria</div>
              <div className="flex flex-col gap-1.5 text-[12.5px] text-slate">
                {[
                  ['Circle attendance rate above 85%', '+20 pts'],
                  ['All session reviews submitted on time', '+15 pts'],
                  ['Parent evening hosted', '+25 pts'],
                  ['Zero missed sessions (whole month)', '+30 pts'],
                  ['Peer group attendance', '+10 pts'],
                ].map(([label, pts]) => (
                  <div key={label} className="flex justify-between"><span>{label}</span><NcBadge variant="teal">{pts}</NcBadge></div>
                ))}
              </div>
            </div>
          </div>
        </NcCard>
      </div>
    </div>
  );
}
