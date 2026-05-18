import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import StatCard from "@/components/shared/StatCard";
import QuranBox from "@/components/shared/QuranBox";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import { adminService, announcementsService, reportsService } from "@/services/api.service";
import {
  Users, BookOpen, Activity, Megaphone, Trash2, Plus, X,
  Calendar, GraduationCap, Info, Heart, TrendingUp, TrendingDown,
} from "lucide-react";

// ── Theme colour literals (used inside recharts, which can't read CSS vars) ──
const CLR = {
  teal      : "hsl(185, 78%, 25%)",
  tealLt    : "hsl(185, 40%, 93%)",
  gold      : "hsl(40, 88%, 42%)",
  green     : "hsl(150, 63%, 29%)",
  red       : "hsl(5, 65%, 46%)",
  border    : "#e5e7eb",
  mutedFg   : "#9ca3af",
};

function barFill(rate: number) {
  if (rate >= 80) return CLR.teal;
  if (rate >= 60) return CLR.gold;
  return CLR.red;
}

// ── Announcement icon map ─────────────────────────────────────────────────────
const ANN_ICONS: Record<string, React.ReactNode> = {
  session : <Calendar      size={15} className="text-teal"     />,
  training: <GraduationCap size={15} className="text-gold"     />,
  donor   : <Heart         size={15} className="text-nc-green" />,
  info    : <Info          size={15} className="text-nc-muted" />,
};
const ICON_OPTIONS = [
  { value: "info",     label: "Info"     },
  { value: "session",  label: "Session"  },
  { value: "training", label: "Training" },
  { value: "donor",    label: "Donor"    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 1)  return "just now";
  if (d < 60) return `${d}m ago`;
  if (d < 1440) return `${Math.floor(d / 60)}h ago`;
  return `${Math.floor(d / 1440)}d ago`;
}

function activityIcon(type: string) {
  if (type === "student_assigned") return <Users    size={13} className="text-teal"     />;
  if (type === "circle_assigned")  return <BookOpen size={13} className="text-gold"     />;
  return                                  <Activity size={13} className="text-nc-muted" />;
}

// ── Custom recharts tooltip ───────────────────────────────────────────────────
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const fill = barFill(d.attendanceRate);
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-nc text-xs min-w-[130px]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: fill }} />
        <span className="font-semibold text-foreground">Session {d.sessionNumber}</span>
      </div>
      <div className="space-y-0.5 text-nc-muted">
        <div className="flex justify-between gap-4">
          <span>Attendance</span>
          <span className="font-medium text-foreground">{d.attendanceRate}%</span>
        </div>
        {d.total > 0 && (
          <div className="flex justify-between gap-4">
            <span>Present</span>
            <span>{d.present}/{d.total}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
type TrendPoint  = { sessionNumber: number; attendanceRate: number; present: number; total: number };
type CircleTrend = {
  circleId: string; circleName: string; murabbiName: string | null;
  sessions: TrendPoint[]; avgRate: number; sessionCount: number; bestRate: number;
};

// ── Rate colour helper (JSX) ──────────────────────────────────────────────────
function RateTag({ rate }: { rate: number }) {
  const cls = rate >= 80 ? "text-teal" : rate >= 60 ? "text-gold" : "text-nc-red";
  return <span className={`font-bold text-lg leading-none ${cls}`}>{rate}%</span>;
}

// ── Circle sparkline card ─────────────────────────────────────────────────────
function CircleSparkCard({ circle, selected, onClick }: { circle: CircleTrend; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        selected
          ? "border-teal bg-teal-lt shadow-nc"
          : "border-border bg-card hover:border-teal/40 hover:shadow-nc"
      }`}
    >
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{circle.circleName}</p>
          {circle.murabbiName && (
            <p className="text-[10px] text-nc-muted truncate">{circle.murabbiName}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <RateTag rate={circle.avgRate} />
          <p className="text-[9px] text-nc-muted mt-0.5">{circle.sessionCount} sessions</p>
        </div>
      </div>

      {circle.sessions.length > 0 ? (
        <ResponsiveContainer width="100%" height={44}>
          <BarChart data={circle.sessions} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap="20%">
            <Bar dataKey="attendanceRate" radius={[2, 2, 0, 0]} maxBarSize={14} isAnimationActive={false}>
              {circle.sessions.map((s, i) => (
                <Cell key={i} fill={selected ? barFill(s.attendanceRate) : CLR.tealLt} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-11 flex items-center justify-center">
          <span className="text-[10px] text-nc-muted">No sessions yet</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[9px] text-nc-muted">Avg rate</span>
        <span className="text-[9px] text-nc-muted">Best: {circle.bestRate}%</span>
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats,         setStats]         = useState<any>(null);
  const [extended,      setExtended]      = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [mainTrend,     setMainTrend]     = useState<TrendPoint[]>([]);
  const [circleCharts,  setCircleCharts]  = useState<CircleTrend[]>([]);
  const [activeCircle,  setActiveCircle]  = useState<string>("all");
  const [trendLoading,  setTrendLoading]  = useState(false);

  const [showForm,   setShowForm]   = useState(false);
  const [formTitle,  setFormTitle]  = useState("");
  const [formBody,   setFormBody]   = useState("");
  const [formIcon,   setFormIcon]   = useState("info");
  const [submitting, setSubmitting] = useState(false);

  const loadTrend = useCallback(async (circleId?: string) => {
    setTrendLoading(true);
    try {
      const res = await reportsService.getAttendanceTrend(circleId);
      setMainTrend(res.data.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setTrendLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      adminService.getDashboard(),
      adminService.getDashboardExtended(),
      reportsService.getAttendanceTrend(),
      reportsService.getAttendancePerCircle(),
    ])
      .then(([dashRes, extRes, trendRes, circleRes]) => {
        setStats(dashRes.data.data);
        setExtended(extRes.data.data);
        setMainTrend(trendRes.data.data ?? []);
        setCircleCharts(circleRes.data.data ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCircleTab = (id: string) => {
    setActiveCircle(id);
    loadTrend(id === "all" ? undefined : id);
  };

  const handleCreateAnnouncement = async () => {
    if (!formTitle.trim() || !formBody.trim()) return;
    setSubmitting(true);
    try {
      await announcementsService.create({ title: formTitle.trim(), body: formBody.trim(), icon: formIcon });
      setFormTitle(""); setFormBody(""); setFormIcon("info"); setShowForm(false);
      const ext = await adminService.getDashboardExtended();
      setExtended(ext.data.data);
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await announcementsService.remove(id);
      setExtended((p: any) => ({ ...p, announcements: p.announcements.filter((a: any) => a._id !== id) }));
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="page-animate flex items-center justify-center h-64">
        <div className="text-nc-muted text-sm animate-pulse">Loading dashboard…</div>
      </div>
    );
  }

  const circles       = extended?.activeCircles  ?? [];
  const activity      = extended?.recentActivity ?? [];
  const announcements = extended?.announcements  ?? [];

  const sessionCount = mainTrend.length;
  const avgRate      = sessionCount > 0
    ? Math.round(mainTrend.reduce((s, p) => s + p.attendanceRate, 0) / sessionCount)
    : 0;
  const lastTwo = mainTrend.slice(-2);
  const trendDir = lastTwo.length === 2
    ? lastTwo[1].attendanceRate - lastTwo[0].attendanceRate
    : 0;

  const activeCircleLabel =
    activeCircle === "all"
      ? "All Circles"
      : circleCharts.find((c) => c.circleId === activeCircle)?.circleName ?? "—";

  return (
    <div className="page-animate">
      <QuranBox
        arabic="فَأَقِمْ وَجْهَكَ لِلدِّينِ حَنِيفًا ۚ فِطْرَتَ اللَّهِ الَّتِي فَطَرَ النَّاسَ عَلَيْهَا"
        translation='"The fitrah of Allah upon which He has created all people."'
        reference="SURAH AR-RUM · 30:30"
      />

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-6">
        <StatCard label="Total Students"     value={stats?.totalStudents     ?? "—"} meta="Enrolled students"    color="teal"   />
        <StatCard label="Active Circles"     value={stats?.activeCircles     ?? "—"} meta="Across neighbourhoods" color="gold"  />
        <StatCard label="Certified Murabbis" value={stats?.totalMurabbis     ?? "—"} meta="Registered murabbis"  color="green"  />
        <StatCard label="Avg. Attendance"    value={stats ? `${stats.avgAttendanceRate ?? 0}%` : "—"} meta="All circles" color="purple" />
        <StatCard label="Sessions Completed" value={stats?.sessionsCompleted ?? "—"} meta="Year 1"               color="teal"   />
        <StatCard label="Parent Engagement"  value={stats ? `${stats.parentEngagement  ?? 0}%` : "—"} meta="This month" color="gold" />
      </div>

      {/* ── Attendance Trend ─────────────────────────────────────────────── */}
      <NcCard>
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Attendance Trend</h2>
            <p className="text-xs text-nc-muted mt-0.5">{activeCircleLabel}</p>
          </div>

          {/* Summary pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {sessionCount > 0 && (
              <>
                <span className="inline-flex items-center gap-1 text-xs bg-muted text-nc-muted px-2.5 py-1 rounded-full">
                  {sessionCount} session{sessionCount !== 1 ? "s" : ""}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                  avgRate >= 80 ? "bg-teal-lt text-teal" : avgRate >= 60 ? "bg-nc-amber-lt text-nc-amber" : "bg-nc-red-lt text-nc-red"
                }`}>
                  {avgRate}% avg
                </span>
                {trendDir !== 0 && (
                  <span className={`inline-flex items-center gap-0.5 text-xs px-2 py-1 rounded-full ${
                    trendDir > 0 ? "bg-nc-green-lt text-nc-green" : "bg-nc-red-lt text-nc-red"
                  }`}>
                    {trendDir > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(trendDir)}%
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Circle tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 border-b border-border">
          {(["all", ...circleCharts.map((c) => c.circleId)] as string[]).map((id) => {
            const label = id === "all" ? "All Circles" : circleCharts.find((c) => c.circleId === id)?.circleName ?? id;
            const active = activeCircle === id;
            return (
              <button
                key={id}
                onClick={() => handleCircleTab(id)}
                className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  active
                    ? "bg-teal text-white shadow-sm"
                    : "bg-muted text-nc-muted hover:bg-teal-lt hover:text-teal"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Chart */}
        {trendLoading ? (
          <div className="h-[220px] flex items-center justify-center">
            <span className="text-xs text-nc-muted animate-pulse">Loading chart…</span>
          </div>
        ) : sessionCount === 0 ? (
          <div className="h-[220px] flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Activity size={22} className="text-nc-muted/50" />
            </div>
            <p className="text-sm text-nc-muted">No attendance sessions recorded yet.</p>
            <p className="text-xs text-nc-muted/70">Sessions will appear here once submitted.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mainTrend} margin={{ top: 8, right: 12, left: -8, bottom: 0 }} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke={CLR.border} vertical={false} />
              <XAxis
                dataKey="sessionNumber"
                tick={{ fontSize: 10, fill: CLR.mutedFg }}
                tickLine={false}
                axisLine={false}
                label={{ value: "Session №", position: "insideBottomRight", offset: 0, fontSize: 9, fill: CLR.mutedFg }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 10, fill: CLR.mutedFg }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(185, 40%, 96%)", radius: 4 }} />
              <ReferenceLine
                y={75}
                stroke={CLR.mutedFg}
                strokeDasharray="4 3"
                strokeOpacity={0.6}
                label={{ value: "Target 75%", position: "insideTopRight", fontSize: 9, fill: CLR.mutedFg }}
              />
              <Bar dataKey="attendanceRate" radius={[5, 5, 0, 0]} maxBarSize={52} animationDuration={500}>
                {mainTrend.map((entry, i) => (
                  <Cell key={i} fill={barFill(entry.attendanceRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Legend */}
        {sessionCount > 0 && (
          <div className="flex items-center gap-5 pt-3 border-t border-border mt-2">
            <span className="text-[10px] text-nc-muted font-medium uppercase tracking-wide">Rate</span>
            <div className="flex items-center gap-4 ml-auto">
              {[
                { color: CLR.teal,  label: "≥ 80% Good"  },
                { color: CLR.gold,  label: "60–79% Fair"  },
                { color: CLR.red,   label: "< 60% Low"    },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-[10px] text-nc-muted">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
                  {label}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-[10px] text-nc-muted">
                <span className="w-5 border-t border-dashed border-nc-muted/60 inline-block" />
                Target 75%
              </span>
            </div>
          </div>
        )}
      </NcCard>

      {/* ── Per-Circle Performance Grid ──────────────────────────────────── */}
      {circleCharts.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">Circle Performance</h2>
              <p className="text-xs text-nc-muted">Click a circle to view its trend above</p>
            </div>
            <NcBadge variant="slate">{circleCharts.length} circles</NcBadge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {circleCharts.map((c) => (
              <CircleSparkCard
                key={c.circleId}
                circle={c}
                selected={activeCircle === c.circleId}
                onClick={() => handleCircleTab(c.circleId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom Three Panels ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">

        {/* Active Circles */}
        <NcCard className="lg:col-span-1">
          <CardHeader>
            <CardTitle sub={`${circles.length} active`}>Active Circles</CardTitle>
          </CardHeader>
          {circles.length === 0 ? (
            <p className="text-nc-muted text-sm py-6 text-center">No active circles yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {circles.map((c: any) => {
                const pct      = c.capacity > 0 ? Math.round((c.enrolledCount / c.capacity) * 100) : 0;
                const fillCls  = pct >= 90 ? "bg-nc-red" : pct >= 70 ? "bg-gold" : "bg-teal";
                return (
                  <li key={c._id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-foreground truncate max-w-[150px]">{c.name}</span>
                      <span className="text-xs text-nc-muted ml-2 shrink-0">{c.enrolledCount}/{c.capacity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${fillCls}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-nc-muted w-7 text-right shrink-0">{pct}%</span>
                    </div>
                    {c.neighbourhood && (
                      <p className="text-[10px] text-nc-muted mt-1 truncate">{c.neighbourhood.name}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </NcCard>

        {/* Announcements */}
        <NcCard className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle sub="Post updates for the team">
                <span className="flex items-center gap-1.5"><Megaphone size={14} />Announcements</span>
              </CardTitle>
              <button
                onClick={() => setShowForm((p) => !p)}
                className="flex items-center gap-1 text-xs text-teal hover:text-teal/80 transition-colors font-medium"
              >
                {showForm ? <X size={12} /> : <Plus size={12} />}
                {showForm ? "Cancel" : "New"}
              </button>
            </div>
          </CardHeader>

          {showForm && (
            <div className="mb-4 space-y-2 p-3 bg-muted/60 rounded-lg border border-border">
              <input
                className="w-full text-sm border border-border rounded-md px-3 py-1.5 bg-card focus:outline-none focus:ring-1 focus:ring-teal"
                placeholder="Title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                maxLength={120}
              />
              <textarea
                className="w-full text-sm border border-border rounded-md px-3 py-1.5 bg-card focus:outline-none focus:ring-1 focus:ring-teal resize-none"
                placeholder="Body"
                rows={2}
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                maxLength={300}
              />
              <div className="flex items-center gap-2">
                <select
                  className="flex-1 text-xs border border-border rounded-md px-2.5 py-1.5 bg-card focus:outline-none"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                >
                  {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button
                  onClick={handleCreateAnnouncement}
                  disabled={submitting || !formTitle.trim() || !formBody.trim()}
                  className="px-4 py-1.5 text-xs bg-teal text-white rounded-md hover:bg-teal/90 disabled:opacity-50 transition-colors font-medium"
                >
                  {submitting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          )}

          {announcements.length === 0 ? (
            <div className="py-8 text-center">
              <Megaphone size={24} className="text-nc-muted/30 mx-auto mb-2" />
              <p className="text-sm text-nc-muted">No announcements yet.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {announcements.map((a: any) => (
                <li key={a._id} className="flex gap-3 group">
                  <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                    {ANN_ICONS[a.icon] ?? ANN_ICONS.info}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug">{a.title}</p>
                    <p className="text-xs text-nc-muted mt-0.5 leading-snug">{a.body}</p>
                    <p className="text-[10px] text-nc-muted/60 mt-1">{timeAgo(a.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteAnnouncement(a._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-nc-muted hover:text-nc-red shrink-0 mt-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </NcCard>

        {/* Recent Activity */}
        <NcCard className="lg:col-span-1">
          <CardHeader>
            <CardTitle sub="Latest system events">
              <span className="flex items-center gap-1.5"><Activity size={14} />Recent Activity</span>
            </CardTitle>
          </CardHeader>
          {activity.length === 0 ? (
            <div className="py-8 text-center">
              <Activity size={24} className="text-nc-muted/30 mx-auto mb-2" />
              <p className="text-sm text-nc-muted">No recent activity.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {activity.map((n: any) => (
                <li key={n._id} className="flex gap-3">
                  <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                    {activityIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground leading-snug">{n.title}</p>
                    <p className="text-[11px] text-nc-muted mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {n.sender?.fullName && (
                        <NcBadge variant="slate" className="text-[10px]">{n.sender.fullName}</NcBadge>
                      )}
                      <span className="text-[10px] text-nc-muted/60">{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </NcCard>

      </div>
    </div>
  );
}
