import { useEffect, useState } from "react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import { incentivesService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { Award, Crown, HandHeart, Medal, Sparkles, Trophy } from "lucide-react";

export default function IncentivesPage({ onAwardPoints }: { onAwardPoints: () => void }) {
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    incentivesService.getLeaderboard()
      .then((res) => setLeaderboard(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load leaderboard" }))
      .finally(() => setLoading(false));
  }, []);

  const awardCards = [
    { icon: <Award className="h-4 w-4" />, title: "Noor Star", pts: 50, desc: "Exemplary character, courage, or service in a session" },
    { icon: <Crown className="h-4 w-4" />, title: "Circle Champion", pts: 100, desc: "100% attendance for one full month — consistency is character" },
    { icon: <HandHeart className="h-4 w-4" />, title: "Sadaqah Hero", pts: 75, desc: "Completed a community service act beyond session requirements" },
    { icon: <Sparkles className="h-4 w-4" />, title: "Knowledge Seeker", pts: 25, desc: "Showed exceptional curiosity and love for learning" },
    { icon: <Trophy className="h-4 w-4" />, title: "Kindness Award", pts: 30, desc: "Demonstrated outstanding kindness to peers or family" },
    { icon: <Medal className="h-4 w-4" />, title: "Courage Award", pts: 40, desc: "Displayed courage in sharing or standing up for the truth" },
  ];

  return (
    <div className="page-animate">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-serif text-[22px] text-foreground">Noor Points System</div>
          <div className="text-xs text-nc-muted mt-0.5">Character-based incentives for students</div>
        </div>
        <button className="btn-gold" onClick={onAwardPoints}>+ Award Points</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {awardCards.slice(0, 3).map((a) => (
          <div key={a.title} className="bg-gradient-to-br from-teal-lt to-card border border-teal/15 rounded-xl p-5 shadow-sm">
            <div className="font-serif text-base text-sidebar-primary mb-1 flex items-center gap-2">{a.icon} {a.title}</div>
            <div className="text-[12.5px] text-black/65 leading-relaxed">{a.desc}</div>
            <div className="font-serif text-4xl mt-2.5">{a.pts} <span className="text-sm font-normal text-black/50">pts</span></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <NcCard>
          <CardHeader><CardTitle sub="Top 10 students by Noor Points">Student Leaderboard</CardTitle></CardHeader>
          {loading ? (
            <div className="text-center py-8 text-nc-muted text-sm animate-pulse">Loading...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 text-nc-muted text-sm">No data yet. Award some points!</div>
          ) : (
            leaderboard.map((s, i) => (
              <div key={s._id} className="flex items-center gap-2.5 py-[9px] border-b border-border last:border-b-0">
                <span className="w-6 text-center flex items-center justify-center">
                  {i === 0 && <Trophy className="h-4 w-4 text-gold" />}
                  {i === 1 && <Medal className="h-4 w-4 text-slate" />}
                  {i === 2 && <Award className="h-4 w-4 text-nc-amber" />}
                  {i > 2 && <span className="text-sm">{i + 1}</span>}
                </span>
                <div className="w-[30px] h-[30px] rounded-lg bg-teal-lt flex items-center justify-center text-[11px] font-bold text-teal">
                  {s.fullName?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{s.fullName}</div>
                  <div className="text-[11px] text-nc-muted">{s.circle?.name || "—"}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold font-serif text-gold">{s.noorPoints}</div>
                  <div className="text-[10px] text-nc-muted">pts</div>
                </div>
              </div>
            ))
          )}
        </NcCard>

        <NcCard>
          <CardHeader><CardTitle>All Award Types</CardTitle></CardHeader>
          <div className="flex flex-col gap-2.5">
            {awardCards.map((a) => (
              <div key={a.title} className="flex justify-between items-center p-2.5 bg-muted rounded-sm">
                <div className="flex items-center gap-2">
                  <span className="text-teal">{a.icon}</span>
                  <div>
                    <div className="text-[13px] font-semibold">{a.title}</div>
                    <div className="text-[11px] text-nc-muted">{a.desc}</div>
                  </div>
                </div>
                <span className="font-bold text-gold font-serif text-lg ml-3">{a.pts}</span>
              </div>
            ))}
          </div>
        </NcCard>
      </div>
    </div>
  );
}