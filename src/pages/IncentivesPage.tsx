import { useEffect, useState } from "react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import { incentivesService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Medal, Award, Star, Handshake, Sparkles, ShieldCheck } from "lucide-react";

// ── Award card config ──────────────────────────────────────────────────────────
const AWARD_CARDS = [
  {
    key    : "noor-star",
    icon   : <Star className="h-4 w-4" />,
    title  : "Noor Star",
    pts    : 50,
    desc   : "50+ points in one session — exemplary character, courage, or service",
    bg     : "bg-gold/8 border border-gold/20",
    accent : "text-gold",
    ptsCls : "text-gold",
  },
  {
    key    : "circle-champion",
    icon   : <Trophy className="h-4 w-4" />,
    title  : "Circle Champion",
    pts    : 100,
    desc   : "100% attendance for one full month — consistency is character",
    bg     : "bg-teal/8 border border-teal/20",
    accent : "text-teal",
    ptsCls : "text-teal",
  },
  {
    key    : "sadaqah-hero",
    icon   : <Handshake className="h-4 w-4" />,
    title  : "Sadaqah Hero",
    pts    : 75,
    desc   : "Completed a community service act beyond the session requirement",
    bg     : "bg-nc-green/8 border border-nc-green/20",
    accent : "text-nc-green",
    ptsCls : "text-nc-green",
  },
];

const ALL_AWARDS = [
  ...AWARD_CARDS,
  { key: "knowledge-seeker", icon: <Sparkles className="h-4 w-4" />, title: "Knowledge Seeker", pts: 25, desc: "Exceptional curiosity and love for learning", from: "", to: "", accent: "" },
  { key: "kindness-award",   icon: <Award className="h-4 w-4" />,    title: "Kindness Award",   pts: 30, desc: "Outstanding kindness to peers or family",        from: "", to: "", accent: "" },
  { key: "courage-award",    icon: <ShieldCheck className="h-4 w-4" />, title: "Courage Award", pts: 40, desc: "Displayed courage in sharing or standing for truth", from: "", to: "", accent: "" },
];

const RECOGNITION_CRITERIA = [
  { label: "Circle attendance rate above 85%",    pts: "+20 pts" },
  { label: "All session reviews submitted on time", pts: "+15 pts" },
  { label: "Parent evening hosted",               pts: "+25 pts" },
  { label: "Zero missed sessions (whole month)",  pts: "+30 pts" },
  { label: "Peer group attendance",               pts: "+10 pts" },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function IncentivesPage({ onAwardPoints }: { onAwardPoints: () => void }) {
  const { toast }              = useToast();
  const [data, setData]        = useState<any>(null);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    incentivesService.getPageData()
      .then((res) => setData(res.data.data || res.data))
      .catch(() => toast({ variant: "destructive", title: "Failed to load incentives" }))
      .finally(() => setLoading(false));
  }, []);

  const leaderboard    = data?.leaderboard    || [];
  const murabbiOfMonth = data?.murabbiOfMonth || null;
  const currentMonth   = data?.currentMonth   || "";

  return (
    <div className="page-animate">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-[22px] font-semibold text-foreground">Noor Points System</h1>
          <p className="text-[12.5px] text-nc-muted mt-0.5">
            Character-based incentives for students and recognition for Murabbis
          </p>
        </div>
        <button className="btn-gold" onClick={onAwardPoints}>+ Award Points</button>
      </div>

      {/* ── Top 3 Award Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {AWARD_CARDS.map((a) => (
          <div
            key={a.key}
            className={`${a.bg} rounded-xl p-5 relative overflow-hidden bg-card`}
          >
            {/* Decorative diamond */}
            <span className="absolute top-4 right-4 text-nc-muted/30 text-xl select-none">◆</span>

            <div className="flex items-center gap-2 font-semibold text-[14px] mb-1.5 text-foreground">
              <span className={a.accent}>{a.icon}</span>
              {a.title}
            </div>
            <p className="text-[11.5px] text-nc-muted leading-relaxed mb-3">{a.desc}</p>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-[42px] font-bold leading-none text-foreground">{a.pts}</span>
              <span className="text-[13px] text-nc-muted mb-1">pts</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── 2-col layout ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* LEFT — Student Leaderboard */}
        <NcCard>
          <CardHeader>
            <CardTitle sub={`Top 10 by Noor Points — ${currentMonth || "All time"}`}>
              Student Leaderboard
            </CardTitle>
          </CardHeader>

          {loading ? (
            <div className="text-center py-8 text-nc-muted text-sm animate-pulse">Loading…</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 text-nc-muted text-sm">No data yet. Award some points!</div>
          ) : (
            <div className="scroll-hover max-h-[420px] divide-y divide-border">
              {leaderboard.map((s: any, i: number) => (
                <div key={s._id} className="flex items-center gap-3 px-4 py-3 hover:bg-teal-lt transition-colors">

                  {/* Rank */}
                  <div className="w-6 flex items-center justify-center flex-shrink-0">
                    {i === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                    {i === 1 && <Medal  className="h-5 w-5 text-slate-400" />}
                    {i === 2 && <Award  className="h-5 w-5 text-amber-600" />}
                    {i > 2   && <span className="text-[13px] text-nc-muted font-medium">{i + 1}</span>}
                  </div>

                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-lg bg-teal-lt flex items-center justify-center text-[11px] font-bold text-teal flex-shrink-0">
                    {getInitials(s.fullName || "?")}
                  </div>

                  {/* Name + circle */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold truncate">{s.fullName}</div>
                    <div className="text-[11px] text-nc-muted">{s.circle?.name || "—"}</div>
                  </div>

                  {/* Points */}
                  <div className="text-right flex-shrink-0">
                    <span className="font-serif text-[18px] font-bold text-gold">{s.noorPoints}</span>
                    <span className="text-[10px] text-nc-muted ml-0.5">pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </NcCard>

        {/* RIGHT — Murabbi Recognition */}
        <div className="flex flex-col gap-4">

          {/* Murabbi of the Month */}
          <NcCard>
            <CardHeader>
              <CardTitle sub="Performance-based recognition system">Murabbi Recognition</CardTitle>
            </CardHeader>
            <div className="px-4 pb-4 flex flex-col gap-3">

              {/* Murabbi of Month card */}
              <div className="rounded-xl bg-gold/10 border border-gold/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 text-gold" />
                  <span className="font-semibold text-[13.5px] text-gold">Murabbi of the Month</span>
                </div>
                <p className="text-[11.5px] text-nc-muted mb-3">Based on attendance, reviews, and parent feedback</p>

                {!loading && murabbiOfMonth ? (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                      {murabbiOfMonth.image
                        ? <img src={murabbiOfMonth.image} alt="" className="w-full h-full object-cover" />
                        : getInitials(murabbiOfMonth.fullName)
                      }
                    </div>
                    <div>
                      <div className="font-semibold text-[13.5px]">{murabbiOfMonth.fullName}</div>
                      <div className="text-[11.5px] text-nc-muted">
                        {murabbiOfMonth.circle || "—"} · {murabbiOfMonth.month}
                        {murabbiOfMonth.attRate > 0 && (
                          <span className="ml-1.5 text-teal font-medium">{murabbiOfMonth.attRate}% att.</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[12px] text-nc-muted">
                    {loading ? "Loading…" : "No data yet — attendance sessions required."}
                  </div>
                )}
              </div>

              {/* Recognition Criteria */}
              <div className="rounded-xl bg-teal/8 border border-teal/15 p-4">
                <p className="font-semibold text-[13px] text-teal mb-3">Recognition Criteria</p>
                <div className="flex flex-col gap-2">
                  {RECOGNITION_CRITERIA.map((c) => (
                    <div key={c.label} className="flex items-center justify-between">
                      <span className="text-[12.5px] text-foreground">{c.label}</span>
                      <span className="text-[12px] font-semibold text-teal flex-shrink-0 ml-2">{c.pts}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </NcCard>

          {/* All Award Types (compact) */}
          <NcCard>
            <CardHeader><CardTitle>All Award Types</CardTitle></CardHeader>
            <div className="px-4 pb-4 flex flex-col gap-1.5">
              {ALL_AWARDS.map((a) => (
                <div key={a.key} className="flex items-center justify-between py-1.5 border-b border-border last:border-b-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-teal">{a.icon}</span>
                    <span className="text-[13px] font-medium">{a.title}</span>
                  </div>
                  <span className="font-serif text-[15px] font-bold text-gold">{a.pts} pts</span>
                </div>
              ))}
            </div>
          </NcCard>

        </div>
      </div>
    </div>
  );
}
