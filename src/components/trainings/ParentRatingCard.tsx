import { useEffect, useState } from "react";
import { Gift, Star } from "lucide-react";
import { parentRatingsService, rewardsService } from "@/services/api.service";
import NcCard from "@/components/shared/NcCard";
import { cn } from "@/lib/utils";
import { formatPKR, monthLabel, unwrap } from "@/lib/finance";

const PART_UR: Record<string, string> = {
  attendance: "بچے کی حاضری", training: "تربیت", targets: "گھر کے ہدف کارڈ", reflections: "عکاسی", engagement: "رابطہ",
};

/** A parent's own monthly rating (and its parts) and the rewards they've received. Urdu first. */
export default function ParentRatingCard() {
  const [rating, setRating] = useState<any>(null);
  const [rewards, setRewards] = useState<any[] | null>(null);

  useEffect(() => {
    parentRatingsService.me().then((r) => setRating(unwrap(r))).catch(() => setRating(false));
    rewardsService.my().then((r) => setRewards(unwrap<any[]>(r) ?? [])).catch(() => setRewards([]));
  }, []);

  const score = rating ? rating.finalScore : null;
  const ring = score == null ? 0 : Math.max(0, Math.min(100, score));
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]" dir="rtl" lang="ur">
      <NcCard className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Star className="h-4 w-4 text-gold" />
          <h3 className="urdu text-[17px] leading-[2] text-nc-dark">میری کارکردگی</h3>
          <span className="text-[12px] text-nc-muted" dir="ltr">My rating{rating ? ` · ${monthLabel(rating.month)}` : ""}</span>
        </div>
        {rating === null ? (
          <p className="urdu py-6 text-center text-[14px] text-nc-muted">کھل رہا ہے…</p>
        ) : rating === false ? (
          <p className="urdu py-6 text-center text-[14px] text-nc-muted">ابھی آپ کی کارکردگی نہیں دکھائی جا سکتی۔</p>
        ) : (
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="relative h-28 w-28 flex-shrink-0 rounded-full" aria-label={`${score} out of 100`}
              style={{ background: `conic-gradient(hsl(var(--plum)) ${ring * 3.6}deg, hsl(var(--muted)) 0)` }}>
              <div className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full bg-card">
                <span className="font-serif text-[30px] leading-none text-nc-dark" dir="ltr">{score}</span>
                <span className="text-[11px] text-nc-muted" dir="ltr">/ 100</span>
              </div>
            </div>
            <ul className="w-full min-w-0 flex-1 space-y-2">
              {rating.components.map((c: any) => (
                <li key={c.key}>
                  <div className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="urdu leading-[1.9] text-nc-dark">{PART_UR[c.key] ?? c.label}</span>
                    <span className="font-semibold text-nc-dark" dir="ltr">{c.score == null ? "—" : c.score}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${c.score ?? 0}%` }} />
                  </div>
                  <div className="mt-0.5 text-[11px] text-nc-muted" dir="ltr">{c.detail}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {rating && (
          <p className="urdu mt-4 text-[12.5px] leading-[2] text-nc-muted">
            ہر مہینے آپ کی کارکردگی بچے کی حاضری، تربیت، گھر کے ہدف کارڈ، عکاسی اور رابطے سے بنتی ہے۔ اچھی کارکردگی پر Noor Circles کی طرف سے انعام بھی دیا جاتا ہے۔
          </p>
        )}
      </NcCard>

      <NcCard className="h-fit p-5">
        <div className="mb-3 flex items-center gap-2">
          <Gift className="h-4 w-4 text-gold" />
          <h3 className="urdu text-[17px] leading-[2] text-nc-dark">میرے انعامات</h3>
          <span className="text-[12px] text-nc-muted" dir="ltr">My rewards</span>
        </div>
        {rewards === null ? (
          <p className="urdu text-[13px] text-nc-muted">کھل رہا ہے…</p>
        ) : rewards.length === 0 ? (
          <p className="urdu text-[13.5px] leading-[2] text-nc-muted">ابھی کوئی انعام نہیں۔ اپنی کارکردگی بہتر رکھیں، ان شاء اللہ!</p>
        ) : (
          <ul className="space-y-2">
            {rewards.map((r: any) => (
              <li key={r._id} className="flex items-center justify-between gap-2 rounded-md border border-border/70 px-3 py-2 text-[13px]">
                <span dir="ltr" className="text-nc-dark">{monthLabel(r.month)}</span>
                <span dir="ltr" className="font-semibold text-nc-dark">{formatPKR(r.amount)}</span>
                <span className={cn("urdu rounded-full px-2 text-[11.5px] leading-[1.9]", r.status === "paid" ? "bg-nc-green-lt text-nc-green" : "bg-gold-lt text-gold-dim")}>
                  {r.status === "paid" ? "مل گیا" : "منظور"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </NcCard>
    </div>
  );
}
