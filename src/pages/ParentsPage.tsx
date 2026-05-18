import { useEffect, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import { Star, Plus, MessageSquarePlus, Trash2 } from "lucide-react";
import { parentsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { RegisterParentModal, AddParentFeedbackModal } from "@/components/modals/AllModals";

export default function ParentsPage() {
  const { toast } = useToast();
  const [stats, setStats]           = useState<any>(null);
  const [parents, setParents]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");

  const [registerOpen, setRegisterOpen]             = useState(false);
  const [feedbackTarget, setFeedbackTarget]         = useState<{ id: string; name: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [sRes, pRes] = await Promise.all([parentsService.getStats(), parentsService.getAll()]);
      setStats(sRes.data.data || sRes.data);
      setParents(pRes.data.data || []);
    } catch {
      toast({ variant: "destructive", title: "Failed to load parents data" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(id: string, name: string) {
    if (!confirm(`Remove ${name} from the system?`)) return;
    try {
      await parentsService.remove(id);
      toast({ title: "Parent removed." });
      load();
    } catch {
      toast({ variant: "destructive", title: "Failed to remove parent." });
    }
  }

  const filtered = parents.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.fullName?.toLowerCase().includes(q) ||
      (p.students || []).some((s: any) => s.fullName?.toLowerCase().includes(q))
    );
  });

  // Collect all feedback entries across all parents for the feed
  const allFeedback = parents
    .flatMap((p) =>
      (p.feedback || []).map((f: any) => ({
        ...f,
        parentName : p.fullName,
        childName  : (p.students || []).map((s: any) => s.fullName).join(", ") || "—",
      }))
    )
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="page-animate">
      {/* Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard
          label="Registered Parents"
          value={loading ? "—" : (stats?.totalParents ?? 0)}
          meta={`Out of ${stats?.totalStudents ?? "—"} students`}
          color="teal"
        />
        <StatCard
          label="Engagement Rate"
          value={loading ? "—" : `${stats?.engagementRate ?? 0}%`}
          meta="Parents who gave feedback"
          color="gold"
          metaUp={(stats?.engagementRate ?? 0) > 50}
        />
        <StatCard
          label="Avg Feedback Stars"
          value={loading ? "—" : (stats?.avgStars ? `${stats.avgStars} ★` : "—")}
          meta="Across all feedback"
          color="green"
        />
        <StatCard
          label="Registration Rate"
          value={loading ? "—" : `${stats?.registrationRate ?? 0}%`}
          meta="Students with a parent"
          color="purple"
        />
      </div>

      <div className="flex items-center justify-between mb-5 gap-3">
        <input
          className="input flex-1 max-w-xs"
          placeholder="Search parents or students…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-gold flex items-center gap-1.5" onClick={() => setRegisterOpen(true)}>
          <Plus className="h-4 w-4" /> Register Parent
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Parents list */}
        <NcCard>
          <CardHeader><CardTitle>Parent Directory ({filtered.length})</CardTitle></CardHeader>
          {loading ? (
            <div className="text-center py-8 text-nc-muted text-sm animate-pulse">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-nc-muted text-sm">No parents registered yet.</div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
              {filtered.map((p) => (
                <div key={p._id} className="p-3 bg-muted rounded-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-sm text-foreground">{p.fullName}</div>
                      <div className="text-xs text-nc-muted mt-0.5">
                        {(p.students || []).length > 0 ? (
                          <span>
                            Children:{" "}
                            {(p.students as any[]).map((s, i) => (
                              <span key={s._id || i} className="text-foreground">
                                {s.fullName}{s.circle?.name ? ` (${s.circle.name})` : ""}
                                {i < p.students.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </span>
                        ) : <span>No students linked</span>}
                      </div>
                      <div className="text-xs text-nc-muted">{p.phone}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <NcBadge variant={p.isEngaged ? "green" : "slate"}>
                        {p.isEngaged ? "Engaged" : "No feedback"}
                      </NcBadge>
                      <button
                        className="btn-outline text-xs py-1 px-2 flex items-center gap-1"
                        title="Add feedback"
                        onClick={() => setFeedbackTarget({ id: p._id, name: p.fullName })}
                      >
                        <MessageSquarePlus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="btn-outline text-xs py-1 px-2 text-red-500 hover:border-red-400"
                        title="Remove parent"
                        onClick={() => handleRemove(p._id, p.fullName)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {(p.feedback?.length ?? 0) > 0 && (
                    <div className="text-xs text-nc-muted mt-1.5">
                      {p.feedback.length} feedback response{p.feedback.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </NcCard>

        {/* Recent feedback feed */}
        <NcCard>
          <CardHeader><CardTitle>Recent Parent Feedback</CardTitle></CardHeader>
          {allFeedback.length === 0 ? (
            <div className="text-center py-8 text-nc-muted text-sm">No feedback recorded yet.</div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
              {allFeedback.map((f: any, i: number) => (
                <div key={i} className="p-3 bg-muted rounded-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-[13px] font-semibold text-foreground">
                      {f.parentName} — about {f.childName}
                    </span>
                    <span className="text-sm flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, idx) => (
                        <Star
                          key={idx}
                          className={`h-3.5 w-3.5 ${idx < f.stars ? "fill-gold text-gold" : "text-border"}`}
                        />
                      ))}
                    </span>
                  </div>
                  <div className="text-[12.5px] text-slate italic leading-relaxed">"{f.message}"</div>
                  {f.sessionNumber && (
                    <div className="text-[11px] text-nc-muted mt-1">Session #{f.sessionNumber}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </NcCard>
      </div>

      {/* Engagement Tools (static, informational) */}
      <div className="mt-5">
        <NcCard>
          <CardHeader><CardTitle>Parent Engagement Tools</CardTitle></CardHeader>
          <div className="flex flex-col gap-2.5">
            <div className="p-3.5 bg-nc-green-lt rounded-sm flex justify-between items-center">
              <div>
                <div className="font-semibold text-sm text-nc-green">Weekly Home Action Card</div>
                <div className="text-xs text-nc-muted mt-0.5">Sent automatically every Friday after the circle</div>
              </div>
              <NcBadge variant="green">Active</NcBadge>
            </div>
            <div className="p-3.5 bg-teal-lt rounded-sm flex justify-between items-center">
              <div>
                <div className="font-semibold text-sm text-teal">Monthly Progress Report</div>
                <div className="text-xs text-nc-muted mt-0.5">Character growth report for each child</div>
              </div>
              <NcBadge variant="teal">Month 4 due</NcBadge>
            </div>
            <div className="p-3.5 bg-nc-purple-lt rounded-sm flex justify-between items-center">
              <div>
                <div className="font-semibold text-sm text-nc-purple">WhatsApp Updates</div>
                <div className="text-xs text-nc-muted mt-0.5">Post-session brief to parent groups</div>
              </div>
              <NcBadge variant="purple">Enabled</NcBadge>
            </div>
          </div>
        </NcCard>
      </div>

      <RegisterParentModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={() => { setRegisterOpen(false); load(); }}
      />

      {feedbackTarget && (
        <AddParentFeedbackModal
          open={!!feedbackTarget}
          onClose={() => setFeedbackTarget(null)}
          onSuccess={() => { setFeedbackTarget(null); load(); }}
          parentId={feedbackTarget.id}
          parentName={feedbackTarget.name}
        />
      )}
    </div>
  );
}
