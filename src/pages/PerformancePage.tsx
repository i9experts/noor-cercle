import { useEffect, useState } from "react";
import {
  Star, Plus, Trash2, CheckCircle, X, Award,
  AlertTriangle, Users, TrendingUp, ChevronDown,
} from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import ProgressBar from "@/components/shared/ProgressBar";
import { performanceService, adminService, circlesService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
type Review = {
  _id: string; murabbi?: { _id: string; fullName: string };
  circle?: { _id: string; name: string };
  sessionNumber: number; reviewText: string; stars: number;
  requiresFollowUp: boolean; createdAt: string;
  honestyScore: number; gratitudeScore: number; empathyScore: number;
  identityScore: number; familyScore: number; consistencyScore: number;
};

const INDICATORS = [
  { key: "honestyScore",     label: "Honesty & Trust",             color: "teal"   as const },
  { key: "gratitudeScore",   label: "Gratitude (Shukr)",           color: "teal"   as const },
  { key: "empathyScore",     label: "Empathy & Listening",         color: "gold"   as const },
  { key: "identityScore",    label: "Muslim Identity Confidence",  color: "teal"   as const },
  { key: "familyScore",      label: "Family Relationship Quality", color: "green"  as const },
  { key: "consistencyScore", label: "Consistency (Istiqamah)",     color: "gold"   as const },
];

function overallScore(d: Record<string, number>) {
  const vals = INDICATORS.map((i) => d[i.key] ?? 0);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function rateColor(v: number) {
  if (v >= 80) return "text-teal";
  if (v >= 60) return "text-gold-dim";
  return "text-nc-red";
}
function rateBg(v: number) {
  if (v >= 80) return "bg-teal-lt text-teal";
  if (v >= 60) return "bg-nc-amber-lt text-nc-amber";
  return "bg-nc-red-lt text-nc-red";
}

// ── Star Input ────────────────────────────────────────────────────────────────
function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button"
          onClick={() => onChange(s === value ? 0 : s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          <Star size={22}
            className={`transition-colors ${s <= (hover || value) ? "fill-gold text-gold" : "text-border hover:text-gold/50"}`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Score Slider ──────────────────────────────────────────────────────────────
function ScoreSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[12px] font-medium text-foreground">{label}</span>
        <span className={`text-[12px] font-bold ${rateColor(value)}`}>{value}%</span>
      </div>
      <input type="range" min={0} max={100} step={5} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-teal"
      />
    </div>
  );
}

// ── Submit Review Modal ───────────────────────────────────────────────────────
const EMPTY_FORM = {
  murabbiId: "", circleId: "", sessionNumber: 1, stars: 0, reviewText: "",
  honestyScore: 70, gratitudeScore: 70, empathyScore: 70,
  identityScore: 70, familyScore: 70, consistencyScore: 70,
  requiresFollowUp: false,
};

function SubmitReviewModal({ open, onClose, murabbis, circles, onSuccess }: {
  open: boolean; onClose: () => void;
  murabbis: any[]; circles: any[];
  onSuccess: (review: Review) => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const set = (patch: Partial<typeof EMPTY_FORM>) => setForm((f) => ({ ...f, ...patch }));

  const filteredCircles = form.murabbiId
    ? circles.filter((c) => {
        const mid = typeof c.murabbi === "object" ? c.murabbi?._id : c.murabbi;
        return mid === form.murabbiId;
      })
    : circles;

  const handleSubmit = async () => {
    if (!form.murabbiId || !form.circleId) {
      toast({ variant: "destructive", title: "Please select a murabbi and circle." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await performanceService.submitReview(form);
      onSuccess(res.data.data.review);
      toast({ title: "Review submitted successfully." });
      setForm(EMPTY_FORM);
      onClose();
    } catch (e: any) {
      toast({ variant: "destructive", title: e?.response?.data?.message ?? "Failed to submit review." });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Submit Performance Review</h2>
            <p className="text-xs text-nc-muted mt-0.5">Document session observations and character indicators</p>
          </div>
          <button onClick={onClose} className="text-nc-muted hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Murabbi + Circle */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wide">Murabbi *</label>
              <div className="relative">
                <select className="w-full appearance-none text-sm border border-border rounded-md px-3 py-2 pr-8 bg-background focus:outline-none focus:ring-1 focus:ring-teal"
                  value={form.murabbiId}
                  onChange={(e) => set({ murabbiId: e.target.value, circleId: "" })}
                >
                  <option value="">Select murabbi…</option>
                  {murabbis.map((m) => <option key={m._id} value={m._id}>{m.fullName}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nc-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wide">Circle *</label>
              <div className="relative">
                <select className="w-full appearance-none text-sm border border-border rounded-md px-3 py-2 pr-8 bg-background focus:outline-none focus:ring-1 focus:ring-teal"
                  value={form.circleId}
                  onChange={(e) => set({ circleId: e.target.value })}
                >
                  <option value="">Select circle…</option>
                  {filteredCircles.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nc-muted pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Session + Stars */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wide">Session Number *</label>
              <input type="number" min={1}
                className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-teal"
                value={form.sessionNumber}
                onChange={(e) => set({ sessionNumber: Math.max(1, Number(e.target.value)) })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wide">Session Rating</label>
              <StarInput value={form.stars} onChange={(stars) => set({ stars })} />
            </div>
          </div>

          {/* Review text */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wide">Review Notes</label>
            <textarea rows={3} maxLength={1000}
              className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-teal resize-none"
              placeholder="Observations about the session, murabbi conduct, student engagement…"
              value={form.reviewText}
              onChange={(e) => set({ reviewText: e.target.value })}
            />
            <p className="text-[10px] text-nc-muted mt-1 text-right">{form.reviewText.length}/1000</p>
          </div>

          {/* Character scores */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h3 className="text-[11px] font-bold text-foreground mb-4 uppercase tracking-wider">Character Growth Indicators</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <ScoreSlider label="Honesty & Trust (Sidq)"         value={form.honestyScore}     onChange={(v) => set({ honestyScore: v })}     />
              <ScoreSlider label="Gratitude (Shukr)"              value={form.gratitudeScore}   onChange={(v) => set({ gratitudeScore: v })}   />
              <ScoreSlider label="Empathy & Listening"            value={form.empathyScore}     onChange={(v) => set({ empathyScore: v })}     />
              <ScoreSlider label="Muslim Identity Confidence"     value={form.identityScore}    onChange={(v) => set({ identityScore: v })}    />
              <ScoreSlider label="Family Relationship Quality"    value={form.familyScore}      onChange={(v) => set({ familyScore: v })}      />
              <ScoreSlider label="Consistency (Istiqamah)"        value={form.consistencyScore} onChange={(v) => set({ consistencyScore: v })} />
            </div>
          </div>

          {/* Follow-up toggle */}
          <button type="button"
            onClick={() => set({ requiresFollowUp: !form.requiresFollowUp })}
            className={`w-full flex items-center gap-3 p-3.5 rounded-lg border-2 transition-all text-left ${
              form.requiresFollowUp
                ? "border-nc-amber bg-nc-amber-lt"
                : "border-border hover:border-nc-amber/50"
            }`}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              form.requiresFollowUp ? "bg-nc-amber border-nc-amber" : "border-border"
            }`}>
              {form.requiresFollowUp && <CheckCircle size={12} className="text-white" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Requires Follow-up</p>
              <p className="text-xs text-nc-muted">Flag this review for admin attention</p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0 bg-muted/30">
          <button onClick={onClose} className="px-4 py-2 text-sm text-nc-muted hover:text-foreground border border-border rounded-md hover:bg-card transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit}
            disabled={submitting || !form.murabbiId || !form.circleId}
            className="px-5 py-2 text-sm bg-teal text-white rounded-md hover:bg-teal/90 disabled:opacity-50 transition-colors font-medium"
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Review Item ───────────────────────────────────────────────────────────────
function ReviewItem({ review, onDelete, onResolve }: {
  review: Review;
  onDelete: (id: string) => void;
  onResolve: (id: string) => void;
}) {
  const scores = INDICATORS.map((i) => review[i.key as keyof Review] as number).filter((s) => s > 0);
  const avg    = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return (
    <div className={`p-4 rounded-lg border group transition-colors ${
      review.requiresFollowUp
        ? "border-nc-amber/50 bg-nc-amber-lt/20"
        : "border-border bg-muted/20 hover:bg-muted/40"
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-foreground">{review.murabbi?.fullName ?? "—"}</span>
            <span className="text-xs text-nc-muted">·</span>
            <span className="text-xs text-nc-muted">{review.circle?.name ?? "—"}</span>
            <NcBadge variant="slate">Session #{review.sessionNumber}</NcBadge>
          </div>
          {review.stars > 0 && (
            <div className="flex items-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={11} className={s <= review.stars ? "fill-gold text-gold" : "text-border"} />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {avg !== null && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rateBg(avg)}`}>{avg}%</span>
          )}
          {review.requiresFollowUp && (
            <button onClick={() => onResolve(review._id)}
              className="text-nc-amber hover:text-nc-green transition-colors"
              title="Mark as resolved">
              <CheckCircle size={16} />
            </button>
          )}
          <button onClick={() => onDelete(review._id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-nc-muted hover:text-nc-red">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Review text */}
      {review.reviewText && (
        <p className="text-xs text-slate leading-relaxed">{review.reviewText}</p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {review.requiresFollowUp && <NcBadge variant="amber"><AlertTriangle size={10} /> Follow-up required</NcBadge>}
        <span className="text-[10px] text-nc-muted ml-auto">
          {new Date(review.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}


// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PerformancePage() {
  const { toast } = useToast();
  const [reviews,     setReviews]     = useState<Review[]>([]);
  const [summary,     setSummary]     = useState<any>(null);
  const [murabbis,    setMurabbis]    = useState<any[]>([]);
  const [circles,     setCircles]     = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [filterMur,   setFilterMur]   = useState("");
  const [filterCir,   setFilterCir]   = useState("");

  const load = () =>
    Promise.all([
      performanceService.getReviews(),
      performanceService.getSummary(),
      adminService.getMurabbis(),
      circlesService.getAll(),
    ]).then(([revRes, sumRes, murRes, cirRes]) => {
      setReviews(revRes.data.data  ?? []);
      setSummary(sumRes.data.data  ?? null);
      setMurabbis(murRes.data.data ?? []);
      setCircles(cirRes.data.data  ?? []);
    });

  useEffect(() => {
    load().catch(() => toast({ variant: "destructive", title: "Failed to load performance data." }))
          .finally(() => setLoading(false));
  }, []);

  // Client-side filter
  const filtered = reviews.filter((r) => {
    if (filterMur && r.murabbi?._id !== filterMur) return false;
    if (filterCir && r.circle?._id  !== filterCir) return false;
    return true;
  });

  // Compute indicators from filtered set
  const indicators = filtered.length > 0
    ? Object.fromEntries(INDICATORS.map(({ key }) => [key, Math.round(filtered.reduce((s, r) => s + ((r as any)[key] || 0), 0) / filtered.length)]))
    : null;

  const avgStarsFiltered = filtered.length > 0
    ? (filtered.reduce((s, r) => s + r.stars, 0) / filtered.length).toFixed(1)
    : "—";

  const handleDelete = async (id: string) => {
    try {
      await performanceService.deleteReview(id);
      setReviews((p) => p.filter((r) => r._id !== id));
      setSummary((p: any) => p ? { ...p, totalReviews: Math.max(0, (p.totalReviews ?? 1) - 1) } : p);
      toast({ title: "Review deleted." });
    } catch {
      toast({ variant: "destructive", title: "Failed to delete review." });
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await performanceService.resolveFollowUp(id);
      setReviews((p) => p.map((r) => r._id === id ? { ...r, requiresFollowUp: false } : r));
      setSummary((p: any) => p ? { ...p, followUpCount: Math.max(0, (p.followUpCount ?? 1) - 1) } : p);
      toast({ title: "Follow-up resolved." });
    } catch {
      toast({ variant: "destructive", title: "Failed to resolve follow-up." });
    }
  };

  const handleNewReview = (review: Review) => {
    setReviews((p) => [review, ...p]);
    setSummary((p: any) => p ? { ...p, totalReviews: (p.totalReviews ?? 0) + 1 } : p);
  };

  if (loading) {
    return (
      <div className="page-animate flex items-center justify-center h-64">
        <div className="text-nc-muted text-sm animate-pulse">Loading performance data…</div>
      </div>
    );
  }


  return (
    <div className="page-animate">
      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Reviews"    value={summary?.totalReviews  ?? 0}                        meta="Session reviews"       color="teal"   />
        <StatCard label="Avg. Stars"       value={summary?.avgStars       ?? 0}                        meta="Out of 5.0"            color="gold"   />
        <StatCard label="Follow-ups"       value={summary?.followUpCount  ?? 0}                        meta="Requiring attention"   color="purple" />
        <StatCard label="Murabbis Tracked" value={summary?.murabbiCount   ?? 0}                        meta="With submitted reviews" color="green" />
      </div>

      {/* ── Filter Row ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <select value={filterMur} onChange={(e) => setFilterMur(e.target.value)}
            className="appearance-none text-xs border border-border rounded-md pl-3 pr-7 py-2 bg-card text-nc-muted focus:outline-none focus:ring-1 focus:ring-teal cursor-pointer">
            <option value="">All Murabbis</option>
            {murabbis.map((m) => <option key={m._id} value={m._id}>{m.fullName}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nc-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select value={filterCir} onChange={(e) => setFilterCir(e.target.value)}
            className="appearance-none text-xs border border-border rounded-md pl-3 pr-7 py-2 bg-card text-nc-muted focus:outline-none focus:ring-1 focus:ring-teal cursor-pointer">
            <option value="">All Circles</option>
            {circles.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nc-muted pointer-events-none" />
        </div>
        {(filterMur || filterCir) && (
          <button onClick={() => { setFilterMur(""); setFilterCir(""); }}
            className="text-xs text-nc-muted hover:text-nc-red flex items-center gap-1 transition-colors">
            <X size={12} /> Clear
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {filtered.length > 0 && (
            <span className="text-xs text-nc-muted">{filtered.length} review{filtered.length !== 1 ? "s" : ""}</span>
          )}
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal text-white text-sm rounded-md hover:bg-teal/90 transition-colors font-medium shadow-sm">
            <Plus size={14} /> Submit Review
          </button>
        </div>
      </div>

      {/* ── Main Two-Column ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* Character Indicators */}
        <NcCard className="xl:col-span-2">
          <CardHeader>
            <CardTitle sub={filterMur || filterCir ? "Filtered average" : "Average across all reviews"}>
              <span className="flex items-center gap-1.5"><TrendingUp size={14} /> Character Indicators</span>
            </CardTitle>
          </CardHeader>
          {!indicators ? (
            <div className="py-10 text-center">
              <Award size={28} className="text-nc-muted/30 mx-auto mb-2" />
              <p className="text-sm text-nc-muted">No reviews yet.</p>
              <p className="text-xs text-nc-muted/70 mt-1">Submit reviews to see indicators.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {INDICATORS.map(({ key, label, color }) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[13px] font-medium text-foreground">{label}</span>
                    <span className={`text-[13px] font-bold ${rateColor(indicators[key] ?? 0)}`}>
                      {indicators[key] ?? 0}%
                    </span>
                  </div>
                  <ProgressBar value={indicators[key] ?? 0} color={color} />
                </div>
              ))}

              {/* Overall score */}
              <div className="pt-3 mt-1 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Overall Score</span>
                  <span className={`text-lg font-bold ${rateColor(overallScore(indicators))}`}>
                    {overallScore(indicators)}%
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${overallScore(indicators) >= 80 ? "bg-teal" : overallScore(indicators) >= 60 ? "bg-gold" : "bg-nc-red"}`}
                      style={{ width: `${overallScore(indicators)}%` }}
                    />
                  </div>
                  <span className="text-xs text-nc-muted shrink-0">
                    ★ {avgStarsFiltered}
                  </span>
                </div>
              </div>
            </div>
          )}
        </NcCard>

        {/* Reviews List */}
        <NcCard className="xl:col-span-3">
          <CardHeader>
            <CardTitle sub={`${filtered.length} review${filtered.length !== 1 ? "s" : ""}`}>
              <span className="flex items-center gap-1.5"><Users size={14} /> Session Reviews</span>
            </CardTitle>
            {filtered.some((r) => r.requiresFollowUp) && (
              <NcBadge variant="amber">
                <AlertTriangle size={10} />
                {filtered.filter((r) => r.requiresFollowUp).length} pending
              </NcBadge>
            )}
          </CardHeader>
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Star size={28} className="text-nc-muted/30 mx-auto mb-2" />
              <p className="text-sm text-nc-muted">No reviews found.</p>
              <p className="text-xs text-nc-muted/70 mt-1">
                {filterMur || filterCir ? "Try clearing the filters." : "Submit the first review using the button above."}
              </p>
            </div>
          ) : (
            <div className="scroll-hover space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {filtered.map((r) => (
                <ReviewItem key={r._id} review={r} onDelete={handleDelete} onResolve={handleResolve} />
              ))}
            </div>
          )}
        </NcCard>
      </div>


      {/* ── Submit Modal ─────────────────────────────────────────────── */}
      <SubmitReviewModal
        open={showModal}
        onClose={() => setShowModal(false)}
        murabbis={murabbis}
        circles={circles}
        onSuccess={handleNewReview}
      />
    </div>
  );
}
