import { useEffect, useState } from "react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import ProgressBar from "@/components/shared/ProgressBar";
import { CheckCircle2, Lock, Play, FileText, Video, CheckCheck } from "lucide-react";
import { trainingService, liveSessionsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

export default function MurabbiTraining() {
  const { toast } = useToast();
  const [modules, setModules]     = useState<any[]>([]);
  const [summary, setSummary]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState<string | null>(null);
  // per-module local slider value: moduleId -> 0-100
  const [sliders, setSliders]         = useState<Record<string, number>>({});
  const [liveMeetings, setLiveMeetings] = useState<any[]>([]);

  const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  const load = () => {
    Promise.all([trainingService.getModules(), trainingService.getProgressSummary()])
      .then(([mRes, sRes]) => {
        const mods: any[] = mRes.data.data || [];
        setModules(mods);
        setSummary(sRes.data.data || null);
        // seed slider values from saved progress
        const init: Record<string, number> = {};
        mods.forEach((m) => { init[m._id] = m.progressPercent ?? 0; });
        setSliders(init);
      })
      .catch(() => toast({ variant: "destructive", title: "Failed to load training" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    liveSessionsService.getUpcoming()
      .then((res) => setLiveMeetings(res.data.data || []))
      .catch(() => {});
  }, []);

  const handleSaveProgress = async (moduleId: string) => {
    const value = sliders[moduleId] ?? 0;
    setUpdating(moduleId);
    try {
      await trainingService.updateProgress(moduleId, value);
      toast({ title: value === 100 ? "Module completed!" : `Progress saved — ${value}%` });
      load();
    } catch {
      toast({ variant: "destructive", title: "Failed to update progress" });
    } finally {
      setUpdating(null);
    }
  };

  const handleMarkComplete = async (moduleId: string) => {
    setSliders((prev) => ({ ...prev, [moduleId]: 100 }));
    setUpdating(moduleId);
    try {
      await trainingService.updateProgress(moduleId, 100);
      toast({ title: "Module marked as complete!" });
      load();
    } catch {
      toast({ variant: "destructive", title: "Failed to update progress" });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="page-animate">
      <SectionTitle title="Training Materials" subtitle="Enhance your skills as a Murabbi with curated training modules." />

      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Modules", val: summary.total },
            { label: "Completed",     val: summary.completed },
            { label: "In Progress",   val: summary.inProgress },
            { label: "Overall",       val: `${summary.overallPercent}%` },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold font-serif text-teal">{s.val}</div>
              <div className="text-[11px] text-nc-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module list */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="text-center py-20 text-nc-muted text-sm animate-pulse">Loading modules...</div>
          ) : modules.length === 0 ? (
            <div className="text-center py-20 text-nc-muted text-sm">No training modules available yet.</div>
          ) : (
            modules.map((m) => {
              const isLocked    = m.status === "Locked";
              const isCompleted = m.completed || (sliders[m._id] ?? m.progressPercent) >= 100;
              const sliderVal   = sliders[m._id] ?? m.progressPercent ?? 0;
              const isDirty     = sliderVal !== (m.progressPercent ?? 0);

              return (
                <NcCard key={m._id} className={isLocked ? "opacity-60 pointer-events-none" : ""}>
                  <div className="flex items-start gap-5">
                    {/* Status icon */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isCompleted ? "bg-green-100 text-green-600"
                      : sliderVal > 0 ? "bg-primary/10 text-primary"
                      : "bg-muted text-nc-muted"
                    }`}>
                      {isCompleted ? <CheckCircle2 className="h-7 w-7" />
                        : sliderVal > 0 ? <Play className="h-7 w-7 fill-current" />
                        : isLocked ? <Lock className="h-7 w-7" />
                        : <Play className="h-7 w-7" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <div className="font-bold text-[15px]">{m.title}</div>
                          <div className="text-[11px] text-nc-muted mt-0.5">
                            {[m.type, m.totalLessons && `${m.totalLessons} lessons`, m.durationMinutes && `${m.durationMinutes} mins`]
                              .filter(Boolean).join(" · ") || "—"}
                          </div>
                        </div>
                        <NcBadge variant={isCompleted ? "green" : sliderVal > 0 ? "purple" : "dark"}>
                          {isCompleted ? "Completed" : sliderVal > 0 ? "In Progress" : m.status}
                        </NcBadge>
                      </div>

                      {m.description && (
                        <p className="text-[12px] text-nc-muted leading-relaxed mb-3 line-clamp-2">{m.description}</p>
                      )}

                      {/* Progress slider */}
                      {!isLocked && !isCompleted && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-[11px] font-medium">
                            <span className="text-nc-muted">Progress</span>
                            <span className={sliderVal >= 100 ? "text-green-600" : sliderVal > 0 ? "text-teal" : "text-nc-muted"}>
                              {sliderVal}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0} max={100} step={5}
                            value={sliderVal}
                            onChange={(e) =>
                              setSliders((prev) => ({ ...prev, [m._id]: Number(e.target.value) }))
                            }
                            className="w-full h-1.5 rounded-full appearance-none bg-muted accent-teal cursor-pointer"
                          />
                          <div className="flex gap-2 mt-1">
                            <button
                              className="flex-1 py-1.5 text-xs font-semibold bg-teal/10 hover:bg-teal/20 text-teal border border-teal/30 rounded-md transition-colors disabled:opacity-40"
                              onClick={() => handleSaveProgress(m._id)}
                              disabled={!isDirty || updating === m._id}
                            >
                              {updating === m._id ? "Saving…" : isDirty ? "Save Progress" : "No Changes"}
                            </button>
                            <button
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-md transition-colors disabled:opacity-40"
                              onClick={() => handleMarkComplete(m._id)}
                              disabled={updating === m._id}
                            >
                              <CheckCheck className="h-3.5 w-3.5" /> Mark Complete
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Completed state — just show bar */}
                      {isCompleted && (
                        <div className="mt-2">
                          <ProgressBar value={100} color="green" />
                          <p className="text-[11px] text-green-600 font-medium mt-1">Module completed</p>
                        </div>
                      )}
                    </div>
                  </div>
                </NcCard>
              );
            })
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <NcCard>
            <CardHeader><CardTitle>Resources Library</CardTitle></CardHeader>
            <div className="space-y-3 mt-2">
              {[
                { icon: <FileText className="h-4 w-4" />, color: "bg-red-50 text-red-500",   label: "Murabbi Handbook 2026.pdf" },
                { icon: <Video    className="h-4 w-4" />, color: "bg-blue-50 text-blue-500",  label: "Teaching Techniques Video" },
                { icon: <FileText className="h-4 w-4" />, color: "bg-amber-50 text-amber-500", label: "Activity Ideas Booklet" },
              ].map((r) => (
                <a key={r.label} href="#" className="flex items-center gap-3 p-2.5 hover:bg-muted rounded-lg transition-colors group">
                  <div className={`p-2 rounded-md ${r.color}`}>{r.icon}</div>
                  <div className="text-[13px] font-medium group-hover:text-primary transition-colors">{r.label}</div>
                </a>
              ))}
            </div>
          </NcCard>

          <NcCard>
            <CardHeader><CardTitle>Upcoming Live Meetings</CardTitle></CardHeader>
            <div className="space-y-3 mt-2">
              {liveMeetings.length === 0 ? (
                <p className="text-[12px] text-nc-muted text-center py-4">No meetings scheduled.</p>
              ) : (
                liveMeetings.slice(0, 3).map((m) => {
                  const timeLabel = m.isRecurring && m.recurringDay != null && m.recurringTime
                    ? `Every ${DAY_NAMES[m.recurringDay]} at ${m.recurringTime}`
                    : m.scheduledAt
                      ? new Date(m.scheduledAt).toLocaleString("en-PK", {
                          weekday: "short", day: "numeric", month: "short",
                          hour: "2-digit", minute: "2-digit",
                        })
                      : "—";
                  return (
                    <div key={m._id} className="p-3 border border-border rounded-lg bg-muted/40">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-foreground leading-snug">{m.title}</span>
                        {m.isLive && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-green-500 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                            LIVE NOW
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-nc-muted mb-1">{timeLabel}</p>
                      <p className="text-[11px] text-nc-muted mb-2">{m.durationMinutes} mins</p>
                      {m.isLive ? (
                        <a
                          href={m.zoomLink}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-full text-center py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-md transition-colors"
                        >
                          Join Meeting
                        </a>
                      ) : (
                        <button
                          disabled
                          className="w-full py-1.5 bg-muted text-nc-muted text-xs font-semibold rounded-md cursor-not-allowed"
                        >
                          Not Started Yet
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </NcCard>
        </div>
      </div>
    </div>
  );
}