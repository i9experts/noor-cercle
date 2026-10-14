import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import { ComponentBars, RatingComponent, Stars } from "@/components/shared/RatingParts";
import { engagementService, rewardsService } from "@/services/api.service";
import { cn } from "@/lib/utils";
import { scoreTone } from "@/lib/finance";
import { formatPKR, monthLabel, unwrap } from "@/lib/finance";

interface MyRating { month: string; components: RatingComponent[]; autoScore: number; adjustment: number; adjustmentNote: string; finalScore: number; stars: number }
interface MyReward { _id: string; month: string; amount: number; status: "approved" | "paid"; paidAt: string | null }

/** Murabbi dashboard: this month's engagement score and rewards received. */
export default function MyEngagementCard() {
  const [rating, setRating]   = useState<MyRating | null>(null);
  const [rewards, setRewards] = useState<MyReward[]>([]);

  useEffect(() => {
    engagementService.my().then((r) => setRating(unwrap(r))).catch(() => {});
    rewardsService.my().then((r) => setRewards(unwrap(r) || [])).catch(() => {});
  }, []);

  if (!rating) return null;
  const tone = scoreTone(rating.finalScore);
  const received = rewards.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);

  return (
    <NcCard className="mb-6">
      <CardHeader>
        <CardTitle sub={`${monthLabel(rating.month)} · updates as you submit sessions and complete training`}>My engagement</CardTitle>
      </CardHeader>
      <div className="grid gap-6 md:grid-cols-[180px_1fr_220px]">
        <div className="flex flex-col items-center justify-center text-center">
          <div className={cn("flex h-20 w-20 items-center justify-center rounded-full text-[26px] font-bold", tone.lt, tone.text)}>{rating.finalScore}</div>
          <Stars value={rating.stars} className="mt-2" />
          <div className="mt-1 text-[11.5px] text-nc-muted">
            out of 100{rating.adjustment ? ` · includes ${rating.adjustment > 0 ? "+" : ""}${rating.adjustment} from admin` : ""}
          </div>
        </div>
        <ComponentBars components={rating.components} />
        <div className="rounded-lg bg-gold-lt/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-nc-dark"><Gift className="h-4 w-4 text-gold-dim" /> My rewards</div>
          <div className="text-[20px] font-semibold text-nc-dark">{formatPKR(received)}</div>
          <div className="mb-3 text-[11.5px] text-nc-muted">received so far</div>
          {rewards.length === 0 ? (
            <div className="text-[12px] text-nc-muted">Monthly rewards go to the most engaged Murabbis. Keep going!</div>
          ) : (
            <div className="space-y-1">
              {rewards.slice(0, 4).map((r) => (
                <div key={r._id} className="flex justify-between text-[12px]">
                  <span className="text-nc-dark">{monthLabel(r.month)}</span>
                  <span className={r.status === "paid" ? "font-medium text-nc-green" : "text-gold-dim"}>
                    {formatPKR(r.amount)}{r.status === "approved" ? " · coming" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </NcCard>
  );
}
