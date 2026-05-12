import { useEffect, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import { adminService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function MurabbisPage({
  onAddMurabbi,
  refreshKey,
}: {
  onAddMurabbi: () => void;
  refreshKey?: number;
}) {
  const { toast } = useToast();
  const [murabbis, setMurabbis] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  function load() {
    setLoading(true);
    adminService
      .getMurabbis()
      .then((res) => setMurabbis(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load murabbis" }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [refreshKey]);

  const active   = murabbis.filter((m) => m.isActive);
  const inactive = murabbis.filter((m) => !m.isActive);

  async function toggleStatus(m: any) {
    try {
      if (m.isActive) {
        await adminService.deactivateMurabbi(m._id);
        toast({ title: `${m.fullName} deactivated.` });
      } else {
        await adminService.activateMurabbi(m._id);
        toast({ title: `${m.fullName} activated.` });
      }
      load();
    } catch {
      toast({ variant: "destructive", title: "Action failed." });
    }
  }

  async function handleDelete(m: any) {
    if (!confirm(`Delete ${m.fullName}? This cannot be undone.`)) return;
    try {
      await adminService.deleteMurabbi(m._id);
      toast({ title: "Murabbi deleted." });
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Delete failed.";
      toast({ variant: "destructive", title: msg });
    }
  }

  return (
    <div className="page-animate">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Total Murabbis" value={murabbis.length}  meta="All registered"    color="teal"  />
        <StatCard label="Active"         value={active.length}    meta="Currently active"  color="green" />
        <StatCard label="Inactive"       value={inactive.length}  meta="Deactivated"       color="gold"  />
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
          murabbis.map((m) => (
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
                <button
                  className="btn-ghost text-xs"
                  onClick={() => toggleStatus(m)}
                >
                  {m.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  className="btn-ghost text-xs text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(m)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </NcCard>
    </div>
  );
}
