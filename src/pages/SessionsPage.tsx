import { useEffect, useState } from "react";
import {
  BookOpen, Calendar, CheckCircle2, Clock, Users,
} from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import ProgressBar from "@/components/shared/ProgressBar";
import { sessionsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
type Theme = {
  month: number; theme: string; title: string;
  description: string; color: string;
  status: "completed" | "current" | "upcoming";
};
type SessionRecord = {
  _id: string; sessionNumber: number; sessionDate: string; topic: string;
  circle?: { _id: string; name: string };
  submittedBy?: { _id: string; fullName: string };
  present: number; total: number; attendanceRate: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const THEME_CLR: Record<string, { bg: string; text: string }> = {
  teal  : { bg: "bg-teal-lt",      text: "text-teal"      },
  gold  : { bg: "bg-nc-amber-lt",  text: "text-gold"      },
  green : { bg: "bg-nc-green-lt",  text: "text-nc-green"  },
  purple: { bg: "bg-nc-purple-lt", text: "text-nc-purple" },
};

function rateColor(r: number) {
  return r >= 80 ? "text-teal" : r >= 60 ? "text-gold" : "text-nc-red";
}

// ── Month tile ────────────────────────────────────────────────────────────────
function MonthTile({
  theme, selected, onClick,
}: { theme: Theme; selected: boolean; onClick: () => void }) {
  const baseCls =
    theme.status === "completed" ? "bg-teal border-teal text-white shadow-sm" :
    theme.status === "current"   ? "bg-gold border-gold text-white shadow-sm" :
    "bg-muted border-border text-nc-muted";

  return (
    <button
      onClick={onClick}
      className={`relative p-3 rounded-xl text-left border-2 transition-all hover:scale-[1.02] ${baseCls} ${
        selected ? "ring-2 ring-offset-1 ring-black/20" : ""
      }`}
    >
      <div className="text-[10px] font-bold opacity-60 mb-0.5 leading-none">M{theme.month}</div>
      <div className="text-[12px] font-bold leading-tight">{theme.theme}</div>

      {theme.status === "completed" && (
        <CheckCircle2 size={9} className="absolute top-2 right-2 opacity-50" />
      )}
      {theme.status === "current" && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      )}
    </button>
  );
}

// ── Theme detail panel ────────────────────────────────────────────────────────
function ThemeDetail({ theme, stats }: { theme: Theme; stats: any }) {
  const clr = THEME_CLR[theme.color] ?? THEME_CLR.teal;
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${clr.bg}`}>
          <BookOpen size={20} className={clr.text} />
        </div>
        <div className="min-w-0">
          <div className={`text-[10px] font-bold uppercase tracking-widest ${clr.text}`}>
            Month {theme.month} · {
              theme.status === "current"   ? "In Progress" :
              theme.status === "completed" ? "Completed"   : "Upcoming"
            }
          </div>
          <h2 className="text-[17px] font-bold text-foreground leading-tight mt-0.5">{theme.theme}</h2>
          <p className="text-xs text-nc-muted mt-0.5">{theme.title}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-[13px] text-slate leading-relaxed mb-4">{theme.description}</p>

      {/* Live stats for current month */}
      {theme.status === "current" && stats && (
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-nc-muted font-medium">Year Progress</span>
            <span className="text-foreground font-semibold">{theme.month}/12 months</span>
          </div>
          <ProgressBar value={Math.round((theme.month / 12) * 100)} color="gold" />
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-muted/60 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-teal leading-none">{stats.sessionsCompleted ?? 0}</p>
              <p className="text-[10px] text-nc-muted mt-0.5">Sessions Done</p>
            </div>
            <div className={`bg-muted/60 rounded-lg p-2.5 text-center`}>
              <p className={`text-lg font-bold leading-none ${rateColor(stats.avgAttendance ?? 0)}`}>
                {stats.avgAttendance ?? 0}%
              </p>
              <p className="text-[10px] text-nc-muted mt-0.5">Avg Attendance</p>
            </div>
          </div>
        </div>
      )}

      {/* Status badge */}
      <div className="mt-auto pt-3 border-t border-border flex items-center gap-2">
        <NcBadge
          variant={
            theme.status === "completed" ? "green" :
            theme.status === "current"   ? "amber" : "slate"
          }
        >
          {theme.status === "completed" && <CheckCircle2 size={10} />}
          {theme.status === "current"   && (
            <span className="w-1.5 h-1.5 rounded-full bg-nc-amber animate-pulse inline-block" />
          )}
          {theme.status === "completed" ? "Completed" :
           theme.status === "current"   ? "In Progress" : "Upcoming"}
        </NcBadge>
        <span className="text-[11px] text-nc-muted">
          {theme.status === "completed"
            ? "This month's sessions have concluded."
            : theme.status === "current"
            ? "Currently running — sessions ongoing."
            : "Sessions begin in a future month."}
        </span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SessionsPage() {
  const { toast }  = useToast();
  const [curriculum, setCurriculum] = useState<{
    currentMonth: number; totalMonths: number; totalSessions: number; themes: Theme[];
  } | null>(null);
  const [stats,    setStats]    = useState<any>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      sessionsService.getCurriculum(),
      sessionsService.getStats(),
      sessionsService.getList(),
    ])
      .then(([curRes, statsRes, listRes]) => {
        const cur = curRes.data.data;
        setCurriculum(cur);
        setStats(statsRes.data.data);
        setSessions(listRes.data.data ?? []);
        // auto-select current month
        const current = cur?.themes?.find((t: Theme) => t.status === "current");
        if (current) setSelectedMonth(current.month);
      })
      .catch(() => toast({ variant: "destructive", title: "Failed to load sessions data." }))
      .finally(() => setLoading(false));
  }, []);

  const themes = curriculum?.themes ?? [];
  const activeTheme = selectedMonth
    ? themes.find((t) => t.month === selectedMonth)
    : themes.find((t) => t.status === "current");

  const completedCount = themes.filter((t) => t.status === "completed").length;

  if (loading) {
    return (
      <div className="page-animate flex items-center justify-center h-64">
        <div className="text-nc-muted text-sm animate-pulse">Loading sessions data…</div>
      </div>
    );
  }

  return (
    <div className="page-animate">

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-6">
        <StatCard
          label="Sessions Completed"
          value={stats?.sessionsCompleted ?? 0}
          meta={`Out of ${stats?.totalSessions ?? 40} planned`}
          color="teal"
        />
        <StatCard
          label="Avg. Attendance"
          value={stats?.avgAttendance != null ? `${stats.avgAttendance}%` : "—"}
          meta="Across all sessions"
          color="gold"
        />
        <StatCard
          label="Active Circles"
          value={stats?.activeCircles ?? "—"}
          meta="Currently running"
          color="green"
        />
        <StatCard
          label="Current Theme"
          value={stats?.currentTheme ?? "—"}
          meta={`Month ${stats?.currentMonth ?? "—"} of 12`}
          color="purple"
        />
      </div>

      {/* ── Curriculum Grid + Theme Detail ──────────────────────────── */}
      <div className="grid grid-cols-5 gap-5 mb-5">

        {/* Curriculum grid — 3 cols */}
        <NcCard className="col-span-3">
          <CardHeader>
            <CardTitle sub={`${completedCount} of 12 months completed`}>
              <span className="flex items-center gap-1.5">
                <BookOpen size={14} /> Year 1 Curriculum
              </span>
            </CardTitle>
            <div className="flex items-center gap-3 ml-auto">
              {[
                { label: "Completed", cls: "bg-teal" },
                { label: "Current",   cls: "bg-gold"  },
                { label: "Upcoming",  cls: "bg-border border border-border/80" },
              ].map(({ label, cls }) => (
                <span key={label} className="flex items-center gap-1 text-[10px] text-nc-muted">
                  <span className={`w-2.5 h-2.5 rounded-sm inline-block ${cls}`} />
                  {label}
                </span>
              ))}
            </div>
          </CardHeader>

          <div className="grid grid-cols-4 gap-2">
            {themes.map((t) => (
              <MonthTile
                key={t.month}
                theme={t}
                selected={selectedMonth === t.month}
                onClick={() => setSelectedMonth(prev => prev === t.month ? null : t.month)}
              />
            ))}
          </div>

          {/* Progress bar */}
          {completedCount > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-nc-muted">Annual progress</span>
                <span className="font-semibold text-foreground">{Math.round((completedCount / 12) * 100)}%</span>
              </div>
              <ProgressBar value={Math.round((completedCount / 12) * 100)} color="teal" />
            </div>
          )}
        </NcCard>

        {/* Theme detail — 2 cols */}
        <NcCard className="col-span-2">
          {activeTheme ? (
            <ThemeDetail theme={activeTheme} stats={stats} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-10 gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <BookOpen size={22} className="text-nc-muted/50" />
              </div>
              <p className="text-sm text-nc-muted text-center">
                Click a month tile to see its details.
              </p>
            </div>
          )}
        </NcCard>
      </div>

      {/* ── Session Records ──────────────────────────────────────────── */}
      <NcCard>
        <CardHeader>
          <CardTitle sub={`${sessions.length} session${sessions.length !== 1 ? "s" : ""} recorded`}>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> Session Records
            </span>
          </CardTitle>
          {sessions.length > 0 && (
            <NcBadge variant="teal">
              <Users size={10} />
              {sessions.reduce((s, r) => s + r.total, 0)} students tracked
            </NcBadge>
          )}
        </CardHeader>

        {sessions.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Clock size={26} className="text-nc-muted/40" />
            </div>
            <p className="text-sm text-nc-muted">No sessions recorded yet.</p>
            <p className="text-xs text-nc-muted/70 mt-1">
              Sessions appear here once attendance is submitted by a murabbi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["Session #", "Date", "Circle", "Topic", "Students", "Attendance", "Submitted By"].map((h) => (
                    <th
                      key={h}
                      className="bg-muted px-4 py-2.5 text-left text-[11px] font-semibold text-nc-muted uppercase tracking-wide border-b border-border first:rounded-tl-md last:rounded-tr-md"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s._id} className="hover:bg-teal-lt/40 transition-colors">
                    {/* Session # */}
                    <td className="px-4 py-3 border-b border-border">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-teal-lt text-teal font-bold text-xs">
                        {s.sessionNumber}
                      </span>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 border-b border-border text-nc-muted text-xs whitespace-nowrap">
                      {new Date(s.sessionDate).toLocaleDateString("en-PK", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    {/* Circle */}
                    <td className="px-4 py-3 border-b border-border font-medium text-foreground">
                      {s.circle?.name ?? "—"}
                    </td>
                    {/* Topic */}
                    <td className="px-4 py-3 border-b border-border text-nc-muted max-w-[200px] truncate">
                      {s.topic || "General Session"}
                    </td>
                    {/* Students */}
                    <td className="px-4 py-3 border-b border-border text-center">
                      <span className="font-semibold text-foreground">{s.present}</span>
                      <span className="text-nc-muted text-xs">/{s.total}</span>
                    </td>
                    {/* Attendance */}
                    <td className="px-4 py-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              s.attendanceRate >= 80 ? "bg-teal" :
                              s.attendanceRate >= 60 ? "bg-gold" : "bg-nc-red"
                            }`}
                            style={{ width: `${s.attendanceRate}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${rateColor(s.attendanceRate)}`}>
                          {s.attendanceRate}%
                        </span>
                      </div>
                    </td>
                    {/* Submitted by */}
                    <td className="px-4 py-3 border-b border-border text-nc-muted text-xs">
                      {s.submittedBy?.fullName ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NcCard>
    </div>
  );
}
