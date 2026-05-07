import { useEffect, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import ProgressBar from "@/components/shared/ProgressBar";
import { Star } from "lucide-react";
import { performanceService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

export default function PerformancePage() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([performanceService.getReviews(), performanceService.getIndicators()])
      .then(([rRes, iRes]) => {
        setReviews(rRes.data.data || []);
        setIndicators(iRes.data.data || null);
      })
      .catch(() => toast({ variant: "destructive", title: "Failed to load performance data" }))
      .finally(() => setLoading(false));
  }, []);

  const charData = indicators ? [
    { name: "Honesty & Trust (Sidq)", value: indicators.honestyScore, color: "teal" as const },
    { name: "Gratitude (Shukr)", value: indicators.gratitudeScore, color: "teal" as const },
    { name: "Empathy & Listening", value: indicators.empathyScore, color: "gold" as const },
    { name: "Muslim Identity Confidence", value: indicators.identityScore, color: "teal" as const },
    { name: "Family Relationship Quality", value: indicators.familyScore, color: "green" as const },
    { name: "Consistency (Istiqamah)", value: indicators.consistencyScore, color: "gold" as const },
  ] : [];

  const avgStars = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.stars || 0), 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="page-animate">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Total Reviews" value={reviews.length} meta="Session reviews submitted" color="teal" />
        <StatCard label="Avg. Stars" value={avgStars} meta="Out of 5" color="gold" />
        <StatCard label="Follow-ups" value={reviews.filter((r) => r.requiresFollowUp).length} meta="Requiring attention" color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <NcCard>
          <CardHeader><CardTitle sub="Average scores from all reviews">Character Growth Indicators</CardTitle></CardHeader>
          {loading ? (
            <div className="text-center py-8 text-nc-muted text-sm animate-pulse">Loading...</div>
          ) : charData.length === 0 ? (
            <div className="text-center py-8 text-nc-muted text-sm">No indicator data yet. Submit some reviews first.</div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {charData.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-[13px] mb-1.5">
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className={`font-semibold ${c.color === "teal" ? "text-teal" : c.color === "gold" ? "text-gold" : "text-nc-green"}`}>
                      {c.value}%
                    </span>
                  </div>
                  <ProgressBar value={c.value} color={c.color} />
                </div>
              ))}
            </div>
          )}
        </NcCard>

        <NcCard>
          <CardHeader>
            <CardTitle>Murabbi Reviews & Notes</CardTitle>
          </CardHeader>
          {loading ? (
            <div className="text-center py-8 text-nc-muted text-sm animate-pulse">Loading...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-nc-muted text-sm">No reviews submitted yet.</div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
              {reviews.map((r) => (
                <div key={r._id} className={`p-3 rounded-sm ${r.requiresFollowUp ? "bg-nc-amber-lt border-l-[3px] border-nc-amber" : "bg-muted"}`}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[13px] font-semibold">{r.murabbi?.fullName || "—"} — {r.circle?.name || "—"}</span>
                    <span className="text-[11px] text-nc-muted">Session #{r.sessionNumber}</span>
                  </div>
                  <div className="text-[12.5px] text-slate leading-relaxed">{r.reviewText}</div>
                  {r.stars > 0 && (
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {Array.from({ length: r.stars }, (_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
                      ))}
                    </div>
                  )}
                  {r.requiresFollowUp && (
                    <NcBadge variant="amber" className="mt-1.5">Follow-up required</NcBadge>
                  )}
                </div>
              ))}
            </div>
          )}
        </NcCard>
      </div>
    </div>
  );
}