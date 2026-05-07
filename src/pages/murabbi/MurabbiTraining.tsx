import { useEffect, useState } from "react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import ProgressBar from "@/components/shared/ProgressBar";
import { CheckCircle2, Lock, Play, FileText, Video } from "lucide-react";
import { trainingService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

export default function MurabbiTraining() {
  const { toast } = useToast();
  const [modules, setModules] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    Promise.all([trainingService.getModules(), trainingService.getProgressSummary()])
      .then(([mRes, sRes]) => {
        setModules(mRes.data.data || []);
        setSummary(sRes.data.data || null);
      })
      .catch(() => toast({ variant: "destructive", title: "Failed to load training" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleProgress = async (moduleId: string, current: number) => {
    const next = Math.min(100, current + 25);
    setUpdating(moduleId);
    try {
      await trainingService.updateProgress(moduleId, next);
      toast({ title: next === 100 ? "Module completed! 🎉" : `Progress updated to ${next}%` });
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
            { label: "Completed", val: summary.completed },
            { label: "In Progress", val: summary.inProgress },
            { label: "Overall", val: `${summary.overallPercent}%` },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold font-serif text-teal">{s.val}</div>
              <div className="text-[11px] text-nc-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="text-center py-20 text-nc-muted text-sm animate-pulse">Loading modules...</div>
          ) : modules.length === 0 ? (
            <div className="text-center py-20 text-nc-muted text-sm">No training modules available yet.</div>
          ) : (
            modules.map((m) => (
              <NcCard key={m._id} className={m.userStatus === "Locked" ? "opacity-60" : ""}>
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    m.completed ? "bg-green-100 text-green-600"
                    : m.progressPercent > 0 ? "bg-primary/10 text-primary"
                    : "bg-muted text-nc-muted"
                  }`}>
                    {m.completed ? <CheckCircle2 className="h-7 w-7" />
                      : m.progressPercent > 0 ? <Play className="h-7 w-7 fill-current" />
                      : <Lock className="h-7 w-7" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-[15px]">{m.title}</div>
                        <div className="text-[11px] text-nc-muted mt-0.5">{m.type} · {m.totalLessons || "—"} lessons · {m.durationMinutes || "—"} mins</div>
                      </div>
                      <NcBadge variant={m.completed ? "green" : m.progressPercent > 0 ? "purple" : "dark"}>
                        {m.completed ? "Completed" : m.progressPercent > 0 ? "In Progress" : m.status}
                      </NcBadge>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] font-medium mb-1.5">
                        <span className="text-nc-muted">Progress</span>
                        <span>{m.progressPercent}%</span>
                      </div>
                      <ProgressBar value={m.progressPercent} color={m.completed ? "green" : "teal"} />
                    </div>
                  </div>
                  {!m.completed && m.status === "Available" && (
                    <button
                      className="btn-ghost text-xs px-4 ml-2"
                      onClick={() => handleProgress(m._id, m.progressPercent)}
                      disabled={updating === m._id}
                    >
                      {updating === m._id ? "..." : m.progressPercent > 0 ? "Continue" : "Start"}
                    </button>
                  )}
                </div>
              </NcCard>
            ))
          )}
        </div>

        <div className="space-y-6">
          <NcCard>
            <CardHeader><CardTitle>Resources Library</CardTitle></CardHeader>
            <div className="space-y-3 mt-2">
              {[
                { icon: <FileText className="h-4 w-4" />, color: "bg-red-50 text-red-500", label: "Murabbi Handbook 2026.pdf" },
                { icon: <Video className="h-4 w-4" />, color: "bg-blue-50 text-blue-500", label: "Teaching Techniques Video" },
                { icon: <FileText className="h-4 w-4" />, color: "bg-amber-50 text-amber-500", label: "Activity Ideas Booklet" },
              ].map((r) => (
                <a key={r.label} href="#" className="flex items-center gap-3 p-2.5 hover:bg-muted rounded-lg transition-colors group">
                  <div className={`p-2 rounded-md ${r.color}`}>{r.icon}</div>
                  <div className="text-[13px] font-medium group-hover:text-primary transition-colors">{r.label}</div>
                </a>
              ))}
            </div>
          </NcCard>
          <NcCard className="bg-primary text-white">
            <h3 className="font-bold text-sm mb-2">Weekly Live Training</h3>
            <p className="text-xs text-white/80 leading-relaxed mb-4">Join senior Murabbis for a live Q&A every Saturday at 11:00 AM.</p>
            <button className="w-full py-2 bg-white text-primary text-xs font-bold rounded-md">Join Zoom Meeting</button>
          </NcCard>
        </div>
      </div>
    </div>
  );
}