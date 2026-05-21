import { useEffect, useRef, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import { adminService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, Pencil, UserCheck, UserX, Trash2 } from "lucide-react";
import { EditMurabbiModal } from "@/components/modals/AllModals";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function ActionMenu({ murabbi, onEdit, onToggle, onDelete }: {
  murabbi: any;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="p-1.5 hover:bg-muted rounded-md text-nc-muted"
        onClick={() => setOpen((s) => !s)}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-44 bg-card border border-border rounded-lg shadow-lg z-50 py-1 text-[13px]">
          <button
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-muted text-left"
            onClick={() => { setOpen(false); onEdit(); }}
          >
            <Pencil className="h-3.5 w-3.5 text-nc-muted" /> Edit
          </button>
          <button
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-muted text-left"
            onClick={() => { setOpen(false); onToggle(); }}
          >
            {murabbi.isActive
              ? <><UserX className="h-3.5 w-3.5 text-amber-500" /> Deactivate</>
              : <><UserCheck className="h-3.5 w-3.5 text-green-600" /> Activate</>}
          </button>
          <div className="border-t border-border my-1" />
          <button
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-50 text-red-600 text-left"
            onClick={() => { setOpen(false); onDelete(); }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function MurabbisPage({
  onAddMurabbi, refreshKey,
}: { onAddMurabbi: () => void; refreshKey?: number }) {
  const { toast }                         = useToast();
  const [murabbis, setMurabbis]           = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [editMurabbi, setEditMurabbi]     = useState<any>(null);

  function load() {
    setLoading(true);
    adminService.getMurabbis()
      .then((res) => setMurabbis(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load murabbis" }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [refreshKey]);

  const active   = murabbis.filter((m) => m.isActive);
  const inactive = murabbis.filter((m) => !m.isActive);

  async function toggleStatus(m: any) {
    try {
      if (m.isActive) { await adminService.deactivateMurabbi(m._id); toast({ title: `${m.fullName} deactivated.` }); }
      else             { await adminService.activateMurabbi(m._id);   toast({ title: `${m.fullName} activated.` }); }
      load();
    } catch { toast({ variant: "destructive", title: "Action failed." }); }
  }

  async function handleDelete(m: any) {
    if (!confirm(`Delete ${m.fullName}? This cannot be undone.`)) return;
    try {
      await adminService.deleteMurabbi(m._id);
      toast({ title: "Murabbi deleted." });
      load();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Delete failed." });
    }
  }

  return (
    <div className="page-animate">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Total Murabbis" value={murabbis.length}  meta="All registered"   color="teal"  />
        <StatCard label="Active"         value={active.length}    meta="Currently active" color="green" />
        <StatCard label="Inactive"       value={inactive.length}  meta="Deactivated"      color="gold"  />
      </div>

      <NcCard>
        <CardHeader>
          <CardTitle>All Murabbis</CardTitle>
          <button className="btn-outline" onClick={onAddMurabbi}>+ Add Murabbi</button>
        </CardHeader>

        {loading ? (
          <div className="text-center py-10 text-nc-muted text-sm animate-pulse">Loading murabbis...</div>
        ) : murabbis.length === 0 ? (
          <div className="text-center py-10 text-nc-muted text-sm">No murabbis found. Add one to get started.</div>
        ) : (
          <div className="scroll-hover max-h-[224px]">
          {murabbis.map((m) => (
            <div key={m._id} className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
              <div className="w-[38px] h-[38px] rounded-xl bg-teal-lt flex items-center justify-center text-sm font-bold text-teal flex-shrink-0">
                {getInitials(m.fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{m.fullName}</div>
                <div className="text-xs text-nc-muted mt-px truncate">{m.email}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <NcBadge variant={m.isActive ? "green" : "amber"}>
                  {m.isActive ? "Active" : "Inactive"}
                </NcBadge>
                <ActionMenu
                  murabbi={m}
                  onEdit={() => setEditMurabbi(m)}
                  onToggle={() => toggleStatus(m)}
                  onDelete={() => handleDelete(m)}
                />
              </div>
            </div>
          ))}
          </div>
        )}
      </NcCard>

      <EditMurabbiModal
        open={!!editMurabbi}
        murabbi={editMurabbi}
        onClose={() => setEditMurabbi(null)}
        onSuccess={() => { setEditMurabbi(null); load(); }}
      />
    </div>
  );
}
