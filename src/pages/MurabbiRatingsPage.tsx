import { useEffect, useState } from "react";
import { Info, SlidersHorizontal, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { engagementService } from "@/services/api.service";
import StatCard from "@/components/shared/StatCard";
import NcCard from "@/components/shared/NcCard";
import Modal, { FormGroup, FormTextarea } from "@/components/shared/Modal";
import { cn } from "@/lib/utils";
import { scoreTone } from "@/lib/finance";
import { ComponentBars, RatingComponent, Stars } from "@/components/shared/RatingParts";
import { apiError, currentMonth, monthLabel, recentMonths, unwrap } from "@/lib/finance";

interface Rating {
  _id           : string;
  murabbi       : { _id: string; fullName: string; email: string; image?: string; tier?: number } | undefined;
  month         : string;
  components    : RatingComponent[];
  autoScore     : number;
  adjustment    : number;
  adjustmentNote: string;
  finalScore    : number;
  stars         : number;
  rank          : number;
}

export default function MurabbiRatingsPage() {
  const { toast } = useToast();
  const [month, setMonth]       = useState(currentMonth());
  const [ratings, setRatings]   = useState<Rating[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<Rating | null>(null);

  async function load(m = month) {
    setLoading(true);
    try {
      setRatings(unwrap(await engagementService.ratings(m)) || []);
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not load ratings.") });
    } finally {
      setLoading(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(month); }, [month]);

  const avg = ratings.length ? Math.round(ratings.reduce((s, r) => s + r.finalScore, 0) / ratings.length) : 0;
  const strong = ratings.filter((r) => r.finalScore >= 80).length;
  const needSupport = ratings.filter((r) => r.finalScore < 60).length;

  return (
    <div className="page-animate">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-[26px] text-nc-dark">Murabbi Ratings</h2>
          <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
            A monthly engagement score, calculated automatically from sessions, attendance, reviews, parent feedback and
            training. Admins can adjust it by up to ±20 with a note. The score decides each Murabbi's share of the reward pool.
          </p>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-9 rounded-md border border-input bg-card px-3 text-[13px] focus:border-primary focus:outline-none"
          aria-label="Month"
        >
          {recentMonths(12).map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:gap-4">
        <StatCard label="Murabbis rated" value={ratings.length} meta={monthLabel(month)} color="purple" />
        <StatCard label="Average score" value={avg} meta="out of 100" color="teal" />
        <StatCard label="Strong (80+)" value={strong} meta="Eligible for top rewards" color="green" />
        <StatCard label="Need support (<60)" value={needSupport} meta="Check in with them" color="red" />
      </div>

      <NcCard className="p-4 sm:p-6">
        <div className="mb-4 flex items-start gap-2 rounded-md bg-plum-lt/60 p-3 text-[12.5px] text-plum">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            Weights: sessions 25 · attendance 25 · reviews 20 · parent feedback 15 · training 15. A part with no data this
            month is left out and the others are rescaled, so nobody is penalised for something that didn't happen.
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-nc-muted">Calculating…</div>
        ) : ratings.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Users className="mb-3 h-9 w-9 text-pale" strokeWidth={1.5} />
            <div className="text-sm font-medium text-nc-dark">No active Murabbis</div>
          </div>
        ) : (
          <div className="space-y-2">
            {ratings.map((r) => {
              const tone = scoreTone(r.finalScore);
              const open = expanded === r._id;
              return (
                <div key={r._id} className="rounded-lg border border-border">
                  <button className="flex w-full items-center gap-3 p-3 text-left sm:p-4" onClick={() => setExpanded(open ? null : r._id)} aria-expanded={open}>
                    <span className="w-6 flex-shrink-0 text-center text-[13px] font-semibold text-nc-muted">#{r.rank}</span>
                    <div className={cn("flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[15px] font-bold", tone.lt, tone.text)}>
                      {r.finalScore}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-semibold text-nc-dark">{r.murabbi?.fullName ?? "—"}</div>
                      <div className="flex flex-wrap items-center gap-x-2 text-[11.5px] text-nc-muted">
                        <Stars value={r.stars} />
                        <span>auto {r.autoScore}</span>
                        {r.adjustment !== 0 && (
                          <span className={r.adjustment > 0 ? "text-nc-green" : "text-nc-red"}>
                            {r.adjustment > 0 ? "+" : ""}{r.adjustment} adjusted
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden items-end gap-1.5 md:flex" aria-hidden>
                      {r.components.map((c) => (
                        <div key={c.key} className="flex h-9 w-3 flex-col justify-end overflow-hidden rounded-[3px] bg-muted" title={`${c.label}: ${c.score ?? "n/a"}`}>
                          {c.score !== null && <div className={cn("w-full", scoreTone(c.score).bg)} style={{ height: `${c.score}%` }} />}
                        </div>
                      ))}
                    </div>
                  </button>
                  {open && (
                    <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-[1fr_auto]">
                      <ComponentBars components={r.components} />
                      <div className="flex flex-col items-start gap-2 sm:w-56">
                        {r.adjustmentNote && (
                          <div className="rounded-md bg-muted p-2.5 text-[12px] text-nc-dark">
                            <div className="mb-0.5 font-semibold">Adjustment note</div>{r.adjustmentNote}
                          </div>
                        )}
                        <button className="btn-outline inline-flex items-center gap-1.5" onClick={() => setAdjusting(r)}>
                          <SlidersHorizontal className="h-4 w-4" /> Adjust score
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </NcCard>

      <AdjustModal rating={adjusting} month={month} onClose={() => setAdjusting(null)} onSaved={() => load()} />
    </div>
  );
}

function AdjustModal({ rating, month, onClose, onSaved }: { rating: Rating | null; month: string; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [adj, setAdj]   = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (rating) { setAdj(rating.adjustment); setNote(rating.adjustmentNote ?? ""); }
  }, [rating]);

  if (!rating) return null;
  const final = Math.max(0, Math.min(100, rating.autoScore + adj));

  async function save() {
    if (!rating?.murabbi) return;
    setSaving(true);
    try {
      await engagementService.adjust(rating.murabbi._id, month, { adjustment: adj, note: note.trim() });
      toast({ title: "Rating adjusted." });
      onSaved();
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not adjust rating.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Adjust ${rating.murabbi?.fullName ?? ""}`} subtitle={`${monthLabel(month)} · automatic score ${rating.autoScore}`}>
      <FormGroup label={`Adjustment: ${adj > 0 ? "+" : ""}${adj}`}>
        <input type="range" min={-20} max={20} step={1} value={adj} onChange={(e) => setAdj(Number(e.target.value))} className="w-full accent-[hsl(327,58%,26%)]" aria-label="Adjustment" />
        <div className="flex justify-between text-[11px] text-nc-muted"><span>−20</span><span>0</span><span>+20</span></div>
      </FormGroup>
      <div className="mb-[18px] flex items-center gap-3 rounded-md bg-muted p-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-bold", scoreTone(final).lt, scoreTone(final).text)}>{final}</div>
        <div className="text-[12.5px] text-nc-dark">Final score<br /><Stars value={Math.round(final / 10) / 2} /></div>
      </div>
      <FormGroup label="Reason" required={adj !== 0}>
        <FormTextarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500}
          placeholder="e.g. Ran extra sessions during Ramadan; mentored a new Murabbi…" />
      </FormGroup>
      <div className="flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary disabled:opacity-50" disabled={saving || (adj !== 0 && !note.trim())} onClick={save}>
          {saving ? "Saving…" : "Save adjustment"}
        </button>
      </div>
    </Modal>
  );
}
