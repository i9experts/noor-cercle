import { useEffect, useState } from "react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import ProgressBar from "@/components/shared/ProgressBar";
import { CheckCircle2, Lock, Play, FileText, CheckCheck, CalendarDays } from "lucide-react";
import { trainingService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

function fmtDate(d?: string | null) {
  if (!d) return "TBD";
  try { return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return "TBD"; }
}

export default function MurabbiTraining() {
  const { toast }                     = useToast();
  const [modules, setModules]         = useState<any[]>([]);
  const [activeBatch, setActiveBatch] = useState<any>(null);
  const [summary, setSummary]         = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [updating, setUpdating]       = useState<string | null>(null);
  const [sliders, setSliders]         = useState<Record<string, number>>({});

  function loadData() {
    setLoading(true);
    trainingService.getModules()
      .then((res) => {
        const mods: any[] = res.data?.data || [];
        setModules(mods);
        const init: Record<string, number> = {};
        mods.forEach((m: any) => { init[m._id] = m.progressPercent ?? 0; });
        setSliders(init);
      })
      .catch(() => {});

    trainingService.getProgressSummary()
      .then((res) => setSummary(res.data?.data || null))
      .catch(() => {});

    if (typeof trainingService.getActiveBatch === "function") {
      trainingService.getActiveBatch()
        .then((res) => {
          const d = res.data?.data || res.data;
          setActiveBatch(d?.batch || null);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSaveProgress(moduleId: string) {
    const value = sliders[moduleId] ?? 0;
    setUpdating(moduleId);
    try {
      await trainingService.updateProgress(moduleId, value);
      toast({ title: value === 100 ? "Module completed!" : `Progress saved — ${value}%` });
      loadData();
    } catch {
      toast({ variant: "destructive", title: "Failed to save progress." });
    } finally { setUpdating(null); }
  }

  async function handleMarkComplete(moduleId: string) {
    setSliders((p) => ({ ...p, [moduleId]: 100 }));
    setUpdating(moduleId);
    try {
      await trainingService.updateProgress(moduleId, 100);
      toast({ title: "Module completed!" });
      loadData();
    } catch {
      toast({ variant: "destructive", title: "Failed to mark complete." });
    } finally { setUpdating(null); }
  }

  // Not assigned to any batch — show locked state
  if (!loading && !activeBatch) {
    return (
      <div className="page-animate flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-7 w-7 text-nc-muted" />
        </div>
        <div className="text-center">
          <div className="font-semibold text-[16px] mb-1">Not assigned to a training batch</div>
          <div className="text-[13px] text-nc-muted">
            Contact your admin to be added to an active training batch.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-animate">
      <div className="mb-6">
        <div className="font-serif text-[22px] font-semibold">Training Programme</div>
        <div className="text-[12.5px] text-nc-muted mt-0.5">Tier 1 Asaas — your path to becoming a certified Murabbi.</div>
      </div>

      {/* Progress summary */}
      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {([
            { label: "Total", val: summary.total },
            { label: "Done",  val: summary.completed },
            { label: "Active",val: summary.inProgress },
            { label: "%",     val: `${summary.overallPercent}%` },
          ] as { label: string; val: any }[]).map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold font-serif text-black">{s.val}</div>
              <div className="text-[11px] text-nc-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Modules */}
        <div className="lg:col-span-2 space-y-4">
          {loading && (
            <div className="text-center py-20 text-nc-muted text-sm animate-pulse">Loading...</div>
          )}
          {!loading && modules.length === 0 && (
            <div className="text-center py-20 text-nc-muted text-sm">No training modules available yet.</div>
          )}
          {!loading && modules.map((m: any) => {
            const isLocked    = m.status === "Locked";
            const sliderVal   = sliders[m._id] ?? m.progressPercent ?? 0;
            const isCompleted = !!m.completed || sliderVal >= 100;
            const isDirty     = sliderVal !== (m.progressPercent ?? 0);

            return (
              <NcCard key={String(m._id)} className={isLocked ? "opacity-60 pointer-events-none" : ""}>
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isCompleted ? "bg-green-100 text-green-600" : sliderVal > 0 ? "bg-teal/10 text-teal" : "bg-muted text-nc-muted"
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-7 w-7" />
                      : isLocked ? <Lock className="h-7 w-7" />
                      : <Play className="h-7 w-7" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <div>
                        <div className="font-bold text-[15px]">{m.title}</div>
                        <div className="text-[11px] text-nc-muted">
                          {[m.daySlot && `Day ${m.daySlot}`, m.timeSlot, m.durationMinutes && `${m.durationMinutes} min`]
                            .filter(Boolean).join(" · ") || "—"}
                        </div>
                      </div>
                      <NcBadge variant={isCompleted ? "green" : sliderVal > 0 ? "teal" : m.status === "Upcoming" ? "amber" : "slate"}>
                        {isCompleted ? "Completed" : sliderVal > 0 ? "In Progress" : (m.status || "—")}
                      </NcBadge>
                    </div>

                    {m.description && (
                      <p className="text-[12px] text-nc-muted mb-3 line-clamp-2">{m.description}</p>
                    )}

                    {!isLocked && !isCompleted && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-nc-muted">Progress</span>
                          <span className="text-teal">{sliderVal}%</span>
                        </div>
                        <input type="range" min={0} max={100} step={5} value={sliderVal}
                          onChange={(e) => setSliders((p) => ({ ...p, [m._id]: +e.target.value }))}
                          className="w-full h-1.5 rounded-full appearance-none bg-muted accent-teal cursor-pointer"
                        />
                        <div className="flex gap-2">
                          <button className="flex-1 py-1.5 text-xs font-semibold bg-teal/10 text-teal border border-teal/30 rounded-md disabled:opacity-40"
                            onClick={() => handleSaveProgress(m._id)} disabled={!isDirty || updating === m._id}>
                            {updating === m._id ? "Saving…" : isDirty ? "Save Progress" : "No Changes"}
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-md disabled:opacity-40"
                            onClick={() => handleMarkComplete(m._id)} disabled={updating === m._id}>
                            <CheckCheck className="h-3.5 w-3.5" /> Complete
                          </button>
                        </div>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="mt-2">
                        <ProgressBar value={100} color="green" />
                        <p className="text-[11px] text-green-600 mt-1">Module completed ✓</p>
                      </div>
                    )}
                  </div>
                </div>
              </NcCard>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">

          {/* Training schedule */}
          <NcCard>
            <CardHeader><CardTitle>Training Schedule</CardTitle></CardHeader>
            {!activeBatch ? (
              <p className="text-[12px] text-nc-muted text-center py-4 px-4">No active batch yet.</p>
            ) : (
              <div className="px-4 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-nc-muted">Batch {activeBatch.batchNumber}</span>
                  <NcBadge variant="teal">Active</NcBadge>
                </div>
                {[
                  { num: 1, title: activeBatch.day1Title, meta: activeBatch.day1Meta, date: activeBatch.day1Date },
                  { num: 2, title: activeBatch.day2Title, meta: activeBatch.day2Meta, date: activeBatch.day2Date },
                ].map((day) => (
                  <div key={day.num} className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarDays className="h-3.5 w-3.5 text-teal flex-shrink-0" />
                      <span className="font-semibold text-[12.5px] text-teal">Day {day.num} — {day.title}</span>
                    </div>
                    <p className="text-[11.5px] text-nc-muted pl-5">{day.meta}</p>
                    <p className="text-[11px] font-medium pl-5 mt-1">{fmtDate(day.date)}</p>
                  </div>
                ))}
              </div>
            )}
          </NcCard>

          {/* Resources */}
          <NcCard>
            <CardHeader><CardTitle>Resources</CardTitle></CardHeader>
            <div className="space-y-2 px-4 pb-4">
              {[
                { label: "Murabbi Handbook 2026.pdf" },
                { label: "Activity Ideas Booklet" },
              ].map((r) => (
                <a key={r.label} href="#"
                  className="flex items-center gap-3 p-2.5 hover:bg-muted rounded-lg transition-colors">
                  <FileText className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span className="text-[12.5px] font-medium">{r.label}</span>
                </a>
              ))}
            </div>
          </NcCard>

        </div>
      </div>
    </div>
  );
}
