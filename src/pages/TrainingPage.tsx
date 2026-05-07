import { useEffect, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import { trainingService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

export default function TrainingPage() {
  const { toast } = useToast();
  const [modules, setModules] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([trainingService.getModules(), trainingService.getProgressSummary()])
      .then(([mRes, sRes]) => {
        setModules(mRes.data.data || []);
        setSummary(sRes.data.data || null);
      })
      .catch(() => toast({ variant: "destructive", title: "Failed to load training data" }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-animate">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Total Modules" value={summary?.total ?? modules.length} meta="Available modules" color="teal" />
        <StatCard label="Completed" value={summary?.completed ?? "—"} meta="Modules done" color="green" />
        <StatCard label="In Progress" value={summary?.inProgress ?? "—"} meta="Currently ongoing" color="gold" />
        <StatCard label="Overall Progress" value={summary?.overallPercent ? `${summary.overallPercent}%` : "—"} meta="Completion rate" color="purple" />
      </div>

      <div className="mt-2">
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 text-center py-20 text-nc-muted text-sm animate-pulse">Loading training modules...</div>
          ) : modules.length === 0 ? (
            <div className="col-span-2 text-center py-20 text-nc-muted text-sm">No training modules yet.</div>
          ) : (
            modules.map((m) => (
              <div key={m._id} className="border border-border rounded-lg overflow-hidden bg-card">
                <div className="p-4 px-5 flex items-center gap-3.5 border-b border-border">
                  <div className="w-10 h-10 bg-nc-dark rounded-xl flex items-center justify-center font-serif text-[18px] text-sidebar-primary flex-shrink-0">
                    {m.moduleNumber || m.order || "?"}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-foreground">{m.title}</div>
                    <div className="text-[11px] text-nc-muted mt-0.5">{m.scheduledTime} · {m.durationMinutes || "—"} mins · {m.totalLessons || "—"} lessons</div>
                  </div>
                  <NcBadge variant={m.status === "Available" ? "green" : m.status === "Upcoming" ? "amber" : "dark"}>
                    {m.status}
                  </NcBadge>
                </div>
                <div className="p-4 px-5">
                  <div className="text-[12.5px] text-slate leading-relaxed">{m.description}</div>
                  {m.progressPercent > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-nc-muted">Progress</span>
                        <span className="font-semibold text-teal">{m.progressPercent}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-teal rounded-full" style={{ width: `${m.progressPercent}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}