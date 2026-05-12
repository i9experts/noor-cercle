import { useEffect, useState } from "react";
import NcBadge from "@/components/shared/NcBadge";
import { circlesService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

export default function CirclesPage({
  onNewCircle,
  refreshKey,
}: {
  onNewCircle: () => void;
  refreshKey?: number;
}) {
  const { toast }                   = useToast();
  const [circles, setCircles]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [deleting, setDeleting]     = useState<string | null>(null);

  function load() {
    setLoading(true);
    circlesService
      .getAll()
      .then((res) => setCircles(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load circles" }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [refreshKey]);

  async function handleDelete(c: any) {
    if (!confirm(`Delete circle "${c.name}"? This cannot be undone.`)) return;
    setDeleting(c._id);
    try {
      await circlesService.remove(c._id);
      toast({ title: `Circle "${c.name}" deleted.` });
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Delete failed.";
      toast({ variant: "destructive", title: msg });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="page-animate">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-serif text-lg text-foreground">All Circles</div>
          <div className="text-xs text-nc-muted mt-0.5">{circles.length} circles loaded</div>
        </div>
        <button className="btn-gold" onClick={onNewCircle}>+ New Circle</button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-nc-muted text-sm animate-pulse">Loading circles...</div>
      ) : circles.length === 0 ? (
        <div className="text-center py-20 text-nc-muted text-sm">No circles yet. Create one to get started.</div>
      ) : (
        <div className="grid grid-cols-3 gap-[18px]">
          {circles.map((c) => (
            <div
              key={c._id}
              className="bg-card border border-border rounded-lg p-5 transition-all hover:border-teal hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(14,107,114,0.1)]"
            >
              <div className="flex justify-between items-start mb-3.5">
                <div>
                  <div className="font-semibold text-[15px] text-foreground">{c.name}</div>
                  <div className="text-xs text-nc-muted mt-0.5">{c.neighbourhood?.name || "—"}</div>
                </div>
                <NcBadge variant={c.isActive ? "green" : "amber"}>
                  {c.isActive ? "Active" : "Inactive"}
                </NcBadge>
              </div>
              <div className="text-xs text-nc-muted mb-3.5">
                Murabbi: {c.murabbi?.fullName || "Unassigned"}
              </div>
              <div className="text-xs text-nc-muted mb-1">
                📍 {c.neighbourhood?.city || c.neighbourhood?.name || "—"}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3.5">
                <div className="text-center p-2 bg-muted rounded-lg">
                  <div className="text-base font-bold text-teal font-serif">{c.capacity ?? "—"}</div>
                  <div className="text-[10px] text-nc-muted uppercase tracking-wide mt-0.5">Capacity</div>
                </div>
                <div className="text-center p-2 bg-muted rounded-lg">
                  <div className="text-base font-bold text-teal font-serif">{c.isActive ? "Active" : "Off"}</div>
                  <div className="text-[10px] text-nc-muted uppercase tracking-wide mt-0.5">Status</div>
                </div>
              </div>
              <button
                className="btn-ghost text-xs text-red-500 hover:text-red-600 mt-3 w-full"
                onClick={() => handleDelete(c)}
                disabled={deleting === c._id}
              >
                {deleting === c._id ? "Deleting…" : "Delete Circle"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
