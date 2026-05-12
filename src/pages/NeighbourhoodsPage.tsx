import { useEffect, useState } from "react";
import NcBadge from "@/components/shared/NcBadge";
import { neighbourhoodsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2 } from "lucide-react";
import { AddNeighbourhoodModal, EditNeighbourhoodModal } from "@/components/modals/AllModals";

export default function NeighbourhoodsPage() {
  const { toast }                             = useToast();
  const [nbhs, setNbhs]                       = useState<any[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [showAdd, setShowAdd]                 = useState(false);
  const [editNbh, setEditNbh]                 = useState<any>(null);
  const [deleting, setDeleting]               = useState<string | null>(null);

  function load() {
    setLoading(true);
    neighbourhoodsService.getAll()
      .then((res) => setNbhs(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load neighbourhoods" }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(n: any) {
    if (!confirm(`Delete "${n.name}"? This will fail if circles exist in it.`)) return;
    setDeleting(n._id);
    try {
      await neighbourhoodsService.remove(n._id);
      toast({ title: `"${n.name}" deleted.` });
      load();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Delete failed." });
    } finally { setDeleting(null); }
  }

  return (
    <div className="page-animate">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-serif text-[22px] text-foreground">Neighbourhood Management</div>
          <div className="text-xs text-nc-muted mt-0.5">{nbhs.length} neighbourhoods</div>
        </div>
        <button className="btn-gold" onClick={() => setShowAdd(true)}>+ Add Neighbourhood</button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-nc-muted text-sm animate-pulse">Loading...</div>
      ) : nbhs.length === 0 ? (
        <div className="text-center py-20 text-nc-muted text-sm">No neighbourhoods yet. Add one to get started.</div>
      ) : (
        <div className="grid grid-cols-2 gap-[18px] mb-5">
          {nbhs.map((n) => (
            <div
              key={n._id}
              className="bg-card border border-border rounded-lg p-[18px] transition-all hover:border-teal hover:shadow-[0_4px_16px_rgba(14,107,114,0.1)]"
            >
              <div className="flex justify-between mb-3">
                <div>
                  <div className="font-semibold text-[15px] text-foreground">{n.name}</div>
                  <div className="text-xs text-nc-muted">{n.city || "No city specified"}</div>
                </div>
                <NcBadge variant={n.isActive ? "green" : "amber"}>
                  {n.isActive ? "Active" : "Inactive"}
                </NcBadge>
              </div>
              <div className="text-xs text-nc-muted mt-2">
                Created: {new Date(n.createdAt).toLocaleDateString()}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 btn-ghost text-xs"
                  onClick={() => setEditNbh(n)}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 btn-ghost text-xs text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(n)}
                  disabled={deleting === n._id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting === n._id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddNeighbourhoodModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={load} />
      <EditNeighbourhoodModal
        open={!!editNbh}
        neighbourhood={editNbh}
        onClose={() => setEditNbh(null)}
        onSuccess={() => { setEditNbh(null); load(); }}
      />
    </div>
  );
}
