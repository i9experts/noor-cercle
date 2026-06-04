import { useEffect, useMemo, useState } from "react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import Modal from "@/components/shared/Modal";
import { Book, Download, PlayCircle, Search, X, ChevronRight, ListChecks, Tag, Clock, BookOpen, Send } from "lucide-react";
import { lessonsService, notificationsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

const STATUS_TABS = ["All", "Available", "Upcoming", "Draft"] as const;
type StatusTab = typeof STATUS_TABS[number];

// ─── Lesson Detail Modal ──────────────────────────────────────────────────────

function LessonModal({ lesson, onClose }: { lesson: any; onClose: () => void }) {
  const { toast } = useToast();
  if (!lesson) return null;
  return (
    <Modal
      open={!!lesson}
      onClose={onClose}
      title={lesson.title}
      subtitle={[lesson.module, lesson.level, lesson.duration].filter(Boolean).join(" · ")}
    >
      {/* Status + session row */}
      <div className="flex items-center gap-2 mb-4">
        <NcBadge variant={lesson.status === "Available" ? "green" : lesson.status === "Upcoming" ? "amber" : "dark"}>
          {lesson.status}
        </NcBadge>
        {lesson.sessionNumber && (
          <span className="text-[11px] font-semibold bg-teal/10 text-teal px-2 py-0.5 rounded-full">
            Session #{lesson.sessionNumber}
          </span>
        )}
      </div>

      {/* Description */}
      {lesson.description && (
        <div className="bg-muted/50 rounded-lg px-4 py-3 mb-4">
          <p className="text-[13px] text-slate leading-relaxed">{lesson.description}</p>
        </div>
      )}

      {/* Objectives */}
      {lesson.objectives?.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks className="h-4 w-4 text-teal" />
            <span className="text-[12px] font-bold uppercase tracking-wide text-nc-muted">Learning Objectives</span>
          </div>
          <ul className="space-y-1.5">
            {lesson.objectives.map((obj: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-slate">
                <ChevronRight className="h-3.5 w-3.5 text-teal mt-0.5 flex-shrink-0" />
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Topics */}
      {lesson.keyTopics?.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4 text-gold" />
            <span className="text-[12px] font-bold uppercase tracking-wide text-nc-muted">Key Topics</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lesson.keyTopics.map((t: string, i: number) => (
              <span key={i} className="text-[11px] bg-gold/10 text-gold border border-gold/30 px-2.5 py-1 rounded-full font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-5">
        <button
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal text-white text-sm font-bold rounded-md hover:bg-teal/90 transition-colors"
          onClick={() => lesson.pdfUrl
            ? window.open(lesson.pdfUrl, "_blank")
            : toast({ title: "PDF not available yet." })
          }
        >
          <Download className="h-4 w-4" /> Download PDF
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-muted text-foreground text-sm font-bold rounded-md hover:bg-muted/80 transition-colors"
          onClick={() => lesson.videoUrl
            ? window.open(lesson.videoUrl, "_blank")
            : toast({ title: "Video not available yet." })
          }
        >
          <PlayCircle className="h-4 w-4" /> Video Guide
        </button>
      </div>

      <button
        onClick={onClose}
        className="mt-3 w-full py-2 text-sm text-nc-muted hover:text-foreground transition-colors"
      >
        Close
      </button>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MurabbiLessons() {
  const { toast } = useToast();
  const [lessons, setLessons]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusTab, setStatusTab]       = useState<StatusTab>("All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [selected, setSelected]         = useState<any>(null);
  const [requesting, setRequesting]     = useState(false);

  const handleRequestMaterial = async () => {
    setRequesting(true);
    try {
      await notificationsService.requestMaterial();
      toast({ title: "Request sent!", description: "Admin team has been notified. You'll receive the material soon." });
    } catch {
      toast({ variant: "destructive", title: "Failed to send request", description: "Please try again." });
    } finally {
      setRequesting(false);
    }
  };

  useEffect(() => {
    lessonsService.getAll()
      .then((res) => setLessons(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load lessons" }))
      .finally(() => setLoading(false));
  }, []);

  const modules = useMemo(() => {
    const all = [...new Set(lessons.map((l) => l.module).filter(Boolean))];
    return ["All", ...all];
  }, [lessons]);

  const filtered = useMemo(() => {
    return lessons.filter((l) => {
      if (statusTab !== "All" && l.status !== statusTab) return false;
      if (moduleFilter !== "All" && l.module !== moduleFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return l.title?.toLowerCase().includes(q) ||
               l.description?.toLowerCase().includes(q) ||
               l.module?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [lessons, statusTab, moduleFilter, search]);

  const counts = useMemo(() => ({
    total    : lessons.length,
    available: lessons.filter((l) => l.status === "Available").length,
    upcoming : lessons.filter((l) => l.status === "Upcoming").length,
    draft    : lessons.filter((l) => l.status === "Draft").length,
  }), [lessons]);

  return (
    <div className="page-animate">
      <SectionTitle title="Lesson Plans" subtitle="Access curriculum materials and session guides for your circles." />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Lessons", val: counts.total,     color: "text-black"       },
          { label: "Available",     val: counts.available, color: "text-black"   },
          { label: "Upcoming",      val: counts.upcoming,  color: "text-black"       },
          { label: "Draft",         val: counts.draft,     color: "text-black"   },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold font-serif ${s.color}`}>{s.val}</div>
            <div className="text-[11px] text-nc-muted mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nc-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lessons…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-lg bg-card focus:border-teal focus:shadow-[0_0_0_3px_rgba(14,107,114,0.08)] outline-none transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-nc-muted hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex bg-muted rounded-lg p-1 gap-0.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                statusTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-nc-muted hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Module filter */}
        {modules.length > 2 && (
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:border-teal outline-none"
          >
            {modules.map((m) => <option key={m}>{m}</option>)}
          </select>
        )}
      </div>

      {/* Lesson grid */}
      {loading ? (
        <div className="text-center py-20 text-nc-muted text-sm animate-pulse">Loading lesson plans...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-nc-muted text-sm">
          {lessons.length === 0 ? "No lesson plans available yet." : "No lessons match your filters."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((lesson) => (
            <div
              key={lesson._id}
              className="border border-border rounded-xl bg-card hover:border-teal/40 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setSelected(lesson)}
            >
              <div className="p-5">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0 group-hover:bg-teal/20 transition-colors">
                      <BookOpen className="h-5 w-5 text-teal" />
                    </div>
                    <div>
                      <NcBadge
                        variant={lesson.status === "Available" ? "green" : lesson.status === "Upcoming" ? "amber" : "dark"}
                        className="mb-1"
                      >
                        {lesson.status}
                      </NcBadge>
                      {lesson.sessionNumber && (
                        <span className="ml-1 text-[10px] font-semibold bg-teal/10 text-teal px-1.5 py-0.5 rounded-full">
                          S#{lesson.sessionNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  {lesson.order > 0 && (
                    <span className="text-[11px] font-bold text-nc-muted bg-muted px-2 py-0.5 rounded-md flex-shrink-0">
                      #{lesson.order}
                    </span>
                  )}
                </div>

                {/* Title & meta */}
                <h3 className="font-bold text-[15px] text-foreground mb-1 leading-snug group-hover:text-teal transition-colors">
                  {lesson.title}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-nc-muted mb-2 flex-wrap">
                  {lesson.module   && <span className="flex items-center gap-1"><Book className="h-3 w-3" />{lesson.module}</span>}
                  {lesson.level    && <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{lesson.level}</span>}
                  {lesson.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{lesson.duration}</span>}
                </div>

                {/* Description preview */}
                {lesson.description && (
                  <p className="text-[12px] text-nc-muted leading-relaxed line-clamp-2 mb-3">{lesson.description}</p>
                )}

                {/* Objectives count */}
                {lesson.objectives?.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-teal font-medium mb-3">
                    <ListChecks className="h-3.5 w-3.5" /> {lesson.objectives.length} learning objective{lesson.objectives.length > 1 ? "s" : ""}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-auto pt-1">
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-teal text-white text-[11px] font-bold rounded-md hover:bg-teal/90 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      lesson.pdfUrl ? window.open(lesson.pdfUrl, "_blank") : toast({ title: "PDF not available yet." });
                    }}
                  >
                    <Download className="h-3.5 w-3.5" /> PDF Plan
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-muted text-foreground text-[11px] font-bold rounded-md hover:bg-muted/80 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      lesson.videoUrl ? window.open(lesson.videoUrl, "_blank") : toast({ title: "Video not available yet." });
                    }}
                  >
                    <PlayCircle className="h-3.5 w-3.5" /> Video
                  </button>
                  <button
                    className="px-3 py-1.5 bg-primary/10 text-primary text-[11px] font-bold rounded-md hover:bg-primary/20 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setSelected(lesson); }}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Material CTA */}
      <NcCard className="mt-8 bg-gold/5 border-gold/20">
        <div className="flex items-center gap-4">
          <div className="bg-gold p-3 rounded-full text-white flex-shrink-0">
            <Book className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gold-dim">Need Custom Materials?</h3>
            <p className="text-xs text-nc-muted mt-1">
              Can't find a lesson plan for your session? Request custom materials from the curriculum team.
            </p>
          </div>
          <button
            className="btn-gold text-xs px-4 flex-shrink-0 flex items-center gap-1.5"
            onClick={handleRequestMaterial}
            disabled={requesting}
          >
            <Send className="h-3.5 w-3.5" />
            {requesting ? "Sending…" : "Request Material"}
          </button>
        </div>
      </NcCard>

      {/* Lesson detail modal */}
      <LessonModal lesson={selected} onClose={() => setSelected(null)} />
    </div>
  );
}