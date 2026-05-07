import { useEffect, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import { adminService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function MurabbisPage({ onAddMurabbi }: { onAddMurabbi: () => void }) {
  const { toast } = useToast();
  const [murabbis, setMurabbis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getMurabbis()
      .then((res) => setMurabbis(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load murabbis" }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-animate">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Total Murabbis" value={murabbis.length} meta="All registered" color="teal" />
        <StatCard label="Active" value={murabbis.filter((m) => m.status === "active").length} meta="Currently active" color="green" />
        <StatCard label="Suspended" value={murabbis.filter((m) => m.status === "suspended").length} meta="Suspended accounts" color="gold" />
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
              <div className="flex-1">
                <div className="text-sm font-semibold">{m.fullName}</div>
                <div className="text-xs text-nc-muted mt-px">{m.email} · {m.phone || "No phone"}</div>
              </div>
              <div className="text-right">
                <NcBadge variant={m.status === "active" ? "green" : "amber"}>{m.status}</NcBadge>
                <div className="text-[11px] text-nc-muted mt-1">
                  {m.circleCount ?? 0} circles · {m.studentCount ?? 0} students
                </div>
              </div>
            </div>
          ))
        )}
      </NcCard>
    </div>
  );
}