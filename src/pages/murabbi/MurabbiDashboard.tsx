import { useEffect, useState } from "react";
import { Star, AlertTriangle, Bell, Calendar, GraduationCap, Heart, Info, CalendarDays } from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import QuranBox from "@/components/shared/QuranBox";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import { murabbisService, performanceService, announcementsService, trainingService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

const ICON_MAP: Record<string, { Icon: React.ElementType; bg: string; text: string }> = {
  session  : { Icon: Calendar,      bg: "bg-teal/10",     text: "text-teal"     },
  training : { Icon: GraduationCap, bg: "bg-gold/10",     text: "text-gold"     },
  donor    : { Icon: Heart,         bg: "bg-nc-green/10", text: "text-nc-green" },
  info     : { Icon: Info,          bg: "bg-nc-muted/10", text: "text-nc-muted" },
};

function timeAgo(date: string) {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

function rateColor(v: number) {
  return v >= 80 ? "text-teal" : v >= 60 ? "text-gold" : "text-nc-red";
}

export default function MurabbiDashboard() {
  const { toast } = useToast();
  const [data, setData]               = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [reviews, setReviews]             = useState<any[]>([]);
  const [activeBatch, setActiveBatch]     = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    murabbisService.getDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => toast({ variant: "destructive", title: "Failed to load dashboard." }))
      .finally(() => setLoading(false));

    performanceService.getMyReviews()
      .then((res) => setReviews(res.data.data || []))
      .catch(() => {});

    trainingService.getActiveBatch()
      .then((res) => setActiveBatch((res.data.data || res.data)?.batch || null))
      .catch(() => {});

    announcementsService.getAll()
      .then((res) => setAnnouncements((res.data.data || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  if (loading) return (
    <div className="page-animate flex items-center justify-center h-64">
      <div className="text-nc-muted text-sm animate-pulse">Loading dashboard...</div>
    </div>
  );

  const stats       = data?.stats       || {};
  const circles     = data?.circles     || [];
  const topStudents = data?.topStudents || [];

  return (
    <div className="page-animate">
      <SectionTitle
        title={`Assalam-o-Alaikum, ${user.fullName || "Murabbi"}!`}
        subtitle="Here is what's happening in your circles today."
      />
      <QuranBox
        arabic="اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ"
        translation='"Read in the name of your Lord who created."'
        reference="SURAH AL-ALAQ · 96:1"
      />

      {/* Training schedule widget */}
      {activeBatch && (
        <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 mb-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-teal/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CalendarDays className="h-5 w-5 text-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-teal mb-1">
              Tier 1 Training — Batch {activeBatch.batchNumber}
            </p>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="font-semibold text-[13px]">Day 1 — {activeBatch.day1Title}</p>
                <p className="text-[11.5px] text-nc-muted">{activeBatch.day1Meta}</p>
                <p className="text-[11.5px] font-medium text-foreground mt-0.5">
                  {activeBatch.day1Date ? new Date(activeBatch.day1Date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "TBD"}
                </p>
              </div>
              <div className="border-l border-border pl-4">
                <p className="font-semibold text-[13px]">Day 2 — {activeBatch.day2Title}</p>
                <p className="text-[11.5px] text-nc-muted">{activeBatch.day2Meta}</p>
                <p className="text-[11.5px] font-medium text-foreground mt-0.5">
                  {activeBatch.day2Date ? new Date(activeBatch.day2Date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "TBD"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-7">
        <StatCard label="My Students"    value={stats.totalStudents  ?? "—"} meta={`${stats.activeStudents ?? 0} active`}    color="teal"   />
        <StatCard label="Active Students" value={stats.activeStudents ?? "—"} meta="Currently enrolled"                       color="green"  />
        <StatCard label="My Circles"     value={stats.circleCount    ?? "—"} meta={`${stats.activeCircles ?? 0} active`}     color="gold"   />
        <StatCard label="Active Circles" value={stats.activeCircles  ?? "—"} meta="Running circles"                          color="purple" />
      </div>

      {/* Assigned circles */}
      {circles.length > 0 && (
        <NcCard className="mb-6">
          <CardHeader>
            <CardTitle sub={`${circles.length} circle(s) assigned to you`}>My Circles</CardTitle>
          </CardHeader>
          <div className="scroll-hover max-h-[340px] grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {circles.map((c: any) => (
              <div key={c._id} className="flex items-center justify-between p-3.5 bg-muted/50 rounded-lg border border-border/50">
                <div>
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-[11px] text-nc-muted mt-0.5">
                    {c.neighbourhood?.name || "—"}{c.neighbourhood?.city ? ` · ${c.neighbourhood.city}` : ""} · Capacity: {c.capacity}
                  </div>
                </div>
                <NcBadge variant={c.isActive ? "green" : "amber"}>
                  {c.isActive ? "Active" : "Inactive"}
                </NcBadge>
              </div>
            ))}
          </div>
        </NcCard>
      )}

      {/* Recent students (top by enrollment) */}
      {topStudents.length > 0 && (
        <NcCard>
          <CardHeader>
            <CardTitle sub="Recently enrolled students">My Students</CardTitle>
          </CardHeader>
          <div className="scroll-hover max-h-[360px] flex flex-col gap-3 mt-2">
            {topStudents.map((s: any) => (
              <div key={s._id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-lt flex items-center justify-center text-teal font-bold text-sm">
                    {s.fullName?.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{s.fullName}</div>
                    <div className="text-[11px] text-nc-muted">
                      {s.circle?.name || "—"} · Father: {s.fatherName || "—"}
                    </div>
                  </div>
                </div>
                <NcBadge variant={s.isActive ? "green" : "amber"}>
                  {s.isActive ? "Active" : "Inactive"}
                </NcBadge>
              </div>
            ))}
          </div>
        </NcCard>
      )}

      {/* Recent performance reviews */}
      {reviews.length > 0 && (
        <NcCard className="mt-6">
          <CardHeader>
            <CardTitle sub="Your latest performance reviews from admin">Recent Reviews</CardTitle>
          </CardHeader>
          <div className="scroll-hover max-h-[400px] flex flex-col gap-3 mt-2">
            {reviews.map((r: any) => {
              const scores = [
                r.honestyScore, r.gratitudeScore, r.empathyScore,
                r.identityScore, r.familyScore, r.consistencyScore,
              ].filter((s) => s !== undefined);
              const overall = scores.length
                ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
                : 0;
              return (
                <div key={r._id} className="p-3.5 bg-muted/50 rounded-lg border border-border/50">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-nc-muted">
                        Session #{r.sessionNumber}
                      </span>
                      <span className="mx-1.5 text-nc-muted">·</span>
                      <span className="text-[11px] text-nc-muted">{(r.circle as any)?.name ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12}
                          className={s <= (r.stars ?? 0) ? "fill-gold text-gold" : "text-border"} />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-xl font-bold leading-none ${rateColor(overall)}`}>{overall}%</span>
                    <span className="text-[11px] text-nc-muted">
                      {new Date(r.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  {r.reviewText && (
                    <p className="mt-2 text-[12px] text-nc-muted leading-relaxed line-clamp-2">{r.reviewText}</p>
                  )}

                  {r.requiresFollowUp && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-nc-amber font-medium">
                      <AlertTriangle size={12} /> Follow-up required
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </NcCard>
      )}

      {/* Latest Announcements */}
      {announcements.length > 0 && (
        <NcCard className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle sub="Latest updates from admin">Announcements</CardTitle>
              <Bell className="h-4 w-4 text-nc-muted" />
            </div>
          </CardHeader>
          <div className="scroll-hover max-h-[360px] flex flex-col gap-3 mt-2">
            {announcements.map((a: any) => {
              const cfg = ICON_MAP[a.icon] || ICON_MAP.INFO;
              const IconComp = cfg.Icon;
              return (
                <div key={a._id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <IconComp className={`h-4 w-4 ${cfg.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground leading-snug">{a.title}</p>
                    <p className="text-[12px] text-nc-muted mt-0.5 line-clamp-2">{a.body}</p>
                    <p className="text-[11px] text-nc-muted mt-1">{timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </NcCard>
      )}

      {circles.length === 0 && !loading && (
        <div className="text-center py-16 text-nc-muted text-sm">
          No circles assigned yet. Contact your admin to get assigned to a circle.
        </div>
      )}
    </div>
  );
}
