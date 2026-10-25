import { useEffect, useState } from "react";
import NcBadge from "@/components/shared/NcBadge";
import { circlesService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, Pencil, Power, Trash2 } from "lucide-react";
import { EditCircleModal } from "@/components/modals/AllModals";
import DeleteConfirmModal from "@/components/shared/DeleteConfirmModal";
import { useRef } from "react";

const STATUS_VARIANT: Record<string, "green" | "amber" | "slate"> = {
  Active  : "green",
  active  : "green",
  review  : "amber",
  Review  : "amber",
  Inactive: "slate",
  inactive: "slate",
};

function ActionMenu({ isActive, onEdit, onToggleActive, onDelete }: {
  isActive: boolean; onEdit: () => void; onToggleActive: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button className="p-1 hover:bg-muted rounded-md text-nc-muted" onClick={() => setOpen((s) => !s)} aria-label="Circle actions">
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 w-36 bg-card border border-border rounded-lg shadow-lg z-50 py-1 text-[13px]">
          <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted" onClick={() => { setOpen(false); onEdit(); }}>
            <Pencil className="h-3.5 w-3.5 text-nc-muted" /> Edit
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted" onClick={() => { setOpen(false); onToggleActive(); }}>
            <Power className="h-3.5 w-3.5 text-nc-muted" /> {isActive ? "Deactivate" : "Reactivate"}
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-500" onClick={() => { setOpen(false); onDelete(); }}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function CirclesPage({
  onNewCircle, refreshKey,
}: { onNewCircle: () => void; refreshKey?: number }) {
  const { toast }                       = useToast();
  const [data, setData]                 = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [editCircle, setEditCircle]     = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  function load() {
    setLoading(true);
    circlesService.getPageData()
      .then((res) => setData(res.data.data || res.data))
      .catch(() => toast({ variant: "destructive", title: "Failed to load circles" }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [refreshKey]);

  async function toggleActive(c: any) {
    try {
      await circlesService.update(c._id, { isActive: !c.isActive });
      toast({ title: c.isActive ? `"${c.name}" deactivated. Its history is kept.` : `"${c.name}" is active again.` });
      load();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Update failed." });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await circlesService.remove(deleteTarget._id);
      toast({ title: `Circle "${deleteTarget.name}" deleted.` });
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Delete failed." });
    }
  }

  const circles = data?.circles || [];
  const stats   = data?.stats   || {};

  return (
    <div className="page-animate">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-semibold text-[22px]">All Circles</h1>
          <p className="text-[12.5px] text-nc-muted mt-0.5">
            {loading ? "…" : `${stats.active ?? 0} active across ${stats.neighbourhoods ?? 0} neighbourhood${stats.neighbourhoods !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button className="btn-gold" onClick={onNewCircle}>+ New Circle</button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-nc-muted text-sm animate-pulse">Loading circles…</div>
      ) : circles.length === 0 ? (
        <div className="text-center py-20 text-nc-muted text-sm border border-dashed border-border rounded-xl">
          No circles yet. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {circles.map((c: any) => {
            const nbh       = c.neighbourhood;
            const murabbi   = c.murabbi;
            const statusKey = c.isActive ? "active" : "inactive";
            const nbhStatus = nbh?.status || statusKey;
            const badgeKey  = nbhStatus === "review" ? "review" : statusKey;

            return (
              <div key={c._id} className="bg-card border border-border rounded-xl p-5 hover:border-teal/30 transition-colors">

                {/* Top row */}
                <div className="flex items-start justify-between mb-1">
                  <div className="font-semibold text-[15px] pr-2">{c.name}</div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <NcBadge variant={STATUS_VARIANT[badgeKey] || "green"}>
                      {badgeKey === "review" ? "Review" : c.isActive ? "Active" : "Inactive"}
                    </NcBadge>
                    <ActionMenu
                      isActive={!!c.isActive}
                      onEdit={() => setEditCircle(c)}
                      onToggleActive={() => toggleActive(c)}
                      onDelete={() => setDeleteTarget(c)}
                    />
                  </div>
                </div>

                {/* Neighbourhood */}
                <div className="text-[12.5px] text-teal font-medium mb-1">
                  {nbh?.name || "—"}
                </div>

                {/* Murabbi */}
                <div className="text-[12px] text-nc-muted mb-4">
                  {murabbi?.fullName ? `Murabbi: ${murabbi.fullName}` : "No murabbi assigned"}
                </div>

                {/* Stats boxes */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: c.studentCount      ?? 0,               label: "STUDENTS"   },
                    { val: `${c.sessionsCompleted ?? 0}/40`,         label: "SESSIONS"   },
                    { val: `${c.attendanceRate  ?? 0}%`,             label: "ATTENDANCE" },
                  ].map((s) => (
                    <div key={s.label} className="bg-muted/50 border border-border/50 rounded-lg p-2.5 text-center">
                      <div className="font-bold text-[17px] text-teal font-serif leading-none">{s.val}</div>
                      <div className="text-[9.5px] text-nc-muted font-semibold tracking-wide mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <EditCircleModal
        open={!!editCircle}
        circle={editCircle}
        onClose={() => setEditCircle(null)}
        onSuccess={() => { setEditCircle(null); load(); }}
      />
      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete Circle"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone. Circles that already have attendance or reviews can't be deleted; deactivate them instead.`}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
