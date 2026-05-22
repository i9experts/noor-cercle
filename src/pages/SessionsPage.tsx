import { useEffect, useState } from "react";
import {
  BookOpen, Calendar, CheckCircle2, Clock, Users,
  Plus, Pencil, Trash2, Tag, ListChecks,
} from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import ProgressBar from "@/components/shared/ProgressBar";
import Modal from "@/components/shared/Modal";
import { sessionsService, lessonsService } from "@/services/api.service";
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

function getApiError(e: unknown) {
  const m = (e as any)?.response?.data?.message;
  return typeof m === "string" && m ? m : null;
}

const STATUS_OPTIONS = ["Available", "Upcoming", "Draft"] as const;

const EMPTY_FORM = {
  title: "", description: "", module: "", level: "", duration: "",
  status: "Available", pdfUrl: "", videoUrl: "", order: 0,
  sessionNumber: "", objectives: "", keyTopics: "",
};

// ── Lesson Form Modal ─────────────────────────────────────────────────────────

function LessonFormModal({
  lesson,
  onClose,
  onSaved,
}: {
  lesson: any;
  onClose: () => void;
  onSaved: (l: any) => void;
}) {
  const { toast } = useToast();
  const isEdit = !!lesson._id;
  const [form, setForm] = useState({
    title        : lesson.title         || "",
    description  : lesson.description   || "",
    module       : lesson.module        || "",
    level        : lesson.level         || "",
    duration     : lesson.duration      || "",
    status       : lesson.status        || "Available",
    pdfUrl       : lesson.pdfUrl        || "",
    videoUrl     : lesson.videoUrl      || "",
    order        : lesson.order         ?? 0,
    sessionNumber: lesson.sessionNumber ?? "",
    objectives   : (lesson.objectives   || []).join("\n"),
    keyTopics    : (lesson.keyTopics    || []).join("\n"),
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ variant: "destructive", title: "Title is required" });
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      order        : Number(form.order) || 0,
      sessionNumber: form.sessionNumber !== "" ? Number(form.sessionNumber) : null,
      objectives   : form.objectives.split("\n").map((s: string) => s.trim()).filter(Boolean),
      keyTopics    : form.keyTopics.split("\n").map((s: string) => s.trim()).filter(Boolean),
      pdfUrl       : form.pdfUrl.trim()   || null,
      videoUrl     : form.videoUrl.trim() || null,
    };
    try {
      const res = isEdit
        ? await lessonsService.update(lesson._id, payload)
        : await lessonsService.create(payload);
      toast({ title: isEdit ? "Lesson updated!" : "Lesson created!" });
      onSaved(res.data?.data || res.data);
    } catch (e) {
      toast({ variant: "destructive", title: "Save failed", description: getApiError(e) || "Try again." });
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full px-3 py-2 border border-border rounded-md text-sm bg-card focus:border-teal outline-none";

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit Lesson" : "New Lesson Plan"}
      subtitle="Fill in the details for this lesson plan"
    >
      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">

        {/* Title + Order */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Title *</label>
            <input className={inp} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Understanding Muslim Identity" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Order #</label>
            <input type="number" min={0} className={inp} value={form.order} onChange={(e) => set("order", e.target.value)} />
          </div>
        </div>

        {/* Module + Level + Duration + Session# */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Module / Theme</label>
            <input className={inp} value={form.module} onChange={(e) => set("module", e.target.value)} placeholder="e.g. Identity" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Level</label>
            <input className={inp} value={form.level} onChange={(e) => set("level", e.target.value)} placeholder="e.g. Beginner" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Duration</label>
            <input className={inp} value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="e.g. 45 mins" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Session #</label>
            <input type="number" min={1} className={inp} value={form.sessionNumber} onChange={(e) => set("sessionNumber", e.target.value)} placeholder="Optional" />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Status</label>
          <select className={inp} value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Description</label>
          <textarea rows={3} className={inp} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief overview of this lesson…" />
        </div>

        {/* Objectives + Key Topics */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">
              Learning Objectives <span className="text-nc-muted/60 normal-case">(one per line)</span>
            </label>
            <textarea rows={4} className={inp} value={form.objectives} onChange={(e) => set("objectives", e.target.value)} placeholder={"Understand fitrah\nExplore Muslim identity"} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">
              Key Topics <span className="text-nc-muted/60 normal-case">(one per line)</span>
            </label>
            <textarea rows={4} className={inp} value={form.keyTopics} onChange={(e) => set("keyTopics", e.target.value)} placeholder={"Fitrah\nTawheed\nPurpose"} />
          </div>
        </div>

        {/* PDF + Video URLs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">PDF URL</label>
            <input className={inp} value={form.pdfUrl} onChange={(e) => set("pdfUrl", e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Video URL</label>
            <input className={inp} value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://…" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-5 pt-4 border-t border-border">
        <button onClick={onClose} className="flex-1 btn-outline">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary">
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Lesson"}
        </button>
      </div>
    </Modal>
  );
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

  // Lessons state
  const [lessons,       setLessons]       = useState<any[]>([]);
  const [lessonLoading, setLessonLoading] = useState(true);
  const [lessonForm,    setLessonForm]    = useState<any>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<any>(null);
  const [deleting,      setDeleting]      = useState(false);

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
        const current = cur?.themes?.find((t: Theme) => t.status === "current");
        if (current) setSelectedMonth(current.month);
      })
      .catch(() => toast({ variant: "destructive", title: "Failed to load sessions data." }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    lessonsService.getAll()
      .then((res) => setLessons(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load lessons." }))
      .finally(() => setLessonLoading(false));
  }, []);

  const handleLessonSaved = (saved: any) => {
    setLessons((prev) => {
      const idx = prev.findIndex((l) => l._id === saved._id);
      return idx >= 0
        ? prev.map((l) => l._id === saved._id ? saved : l)
        : [...prev, saved].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
    setLessonForm(null);
  };

  const handleLessonDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await lessonsService.remove(deleteTarget._id);
      setLessons((prev) => prev.filter((l) => l._id !== deleteTarget._id));
      toast({ title: "Lesson deleted." });
      setDeleteTarget(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Delete failed", description: getApiError(e) || "Try again." });
    } finally {
      setDeleting(false);
    }
  };

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

      {/* ── Lesson Plans Management ─────────────────────────────────── */}
      <NcCard className="mb-5">
        <CardHeader>
          <CardTitle sub={`${lessons.length} lesson plan${lessons.length !== 1 ? "s" : ""} in curriculum`}>
            <span className="flex items-center gap-1.5">
              <BookOpen size={14} /> Lesson Plans
            </span>
          </CardTitle>
          <button
            className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5"
            onClick={() => setLessonForm(EMPTY_FORM)}
          >
            <Plus size={13} /> Add Lesson
          </button>
        </CardHeader>

        {lessonLoading ? (
          <div className="text-center py-10 text-nc-muted text-sm animate-pulse">Loading lessons…</div>
        ) : lessons.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <BookOpen size={22} className="text-nc-muted/40" />
            </div>
            <p className="text-sm text-nc-muted">No lessons yet.</p>
            <p className="text-xs text-nc-muted/70 mt-1">Add lesson plans so murabbis can access them.</p>
            <button className="btn-primary mt-4 text-xs px-4" onClick={() => setLessonForm(EMPTY_FORM)}>
              <Plus size={12} className="inline mr-1" /> Create First Lesson
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["#", "Title", "Module", "Level", "Duration", "Status", "Objectives", ""].map((h) => (
                    <th key={h} className="bg-muted px-3.5 py-2.5 text-left text-[11px] font-semibold text-nc-muted uppercase tracking-wide border-b border-border whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lessons.map((l) => (
                  <tr key={l._id} className="hover:bg-teal-lt/40 transition-colors group">
                    <td className="px-3.5 py-3 border-b border-border text-nc-muted text-center font-mono text-xs">{l.order || "—"}</td>
                    <td className="px-3.5 py-3 border-b border-border font-semibold text-foreground max-w-[220px]">
                      <div className="truncate">{l.title}</div>
                      {l.sessionNumber && (
                        <span className="text-[10px] text-teal font-medium">Session #{l.sessionNumber}</span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 border-b border-border text-nc-muted text-xs">
                      {l.module ? (
                        <span className="flex items-center gap-1"><Tag size={10} />{l.module}</span>
                      ) : "—"}
                    </td>
                    <td className="px-3.5 py-3 border-b border-border text-nc-muted text-xs">{l.level || "—"}</td>
                    <td className="px-3.5 py-3 border-b border-border text-nc-muted text-xs whitespace-nowrap">
                      {l.duration ? <span className="flex items-center gap-1"><Clock size={10} />{l.duration}</span> : "—"}
                    </td>
                    <td className="px-3.5 py-3 border-b border-border">
                      <NcBadge variant={l.status === "Available" ? "green" : l.status === "Upcoming" ? "amber" : "dark"}>
                        {l.status}
                      </NcBadge>
                    </td>
                    <td className="px-3.5 py-3 border-b border-border text-center text-nc-muted text-xs">
                      {l.objectives?.length > 0 ? (
                        <span className="flex items-center gap-1 justify-center">
                          <ListChecks size={11} className="text-teal" />{l.objectives.length}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-3.5 py-3 border-b border-border">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setLessonForm(l)}
                          className="p-1.5 rounded-md hover:bg-teal/10 text-teal transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(l)}
                          className="p-1.5 rounded-md hover:bg-nc-red/10 text-nc-red transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NcCard>

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
          <div className="scroll-hover overflow-x-auto max-h-[280px]">
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

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {lessonForm !== null && (
        <LessonFormModal
          lesson={lessonForm}
          onClose={() => setLessonForm(null)}
          onSaved={handleLessonSaved}
        />
      )}

      {deleteTarget && (
        <Modal
          open
          onClose={() => setDeleteTarget(null)}
          title="Delete Lesson"
          subtitle="This action cannot be undone."
        >
          <p className="text-[13px] text-nc-muted mb-6">
            Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>?
            Murabbis will no longer be able to access this lesson plan.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 btn-outline">Cancel</button>
            <button
              onClick={handleLessonDelete}
              disabled={deleting}
              className="flex-1 py-2 px-4 rounded-md bg-nc-red text-white text-sm font-bold hover:bg-nc-red/90 transition-colors"
            >
              {deleting ? "Deleting…" : "Yes, Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
