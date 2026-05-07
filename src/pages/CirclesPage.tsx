import { useEffect, useState } from "react";
import NcBadge from "@/components/shared/NcBadge";
import { circlesService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

export default function CirclesPage({ onNewCircle }: { onNewCircle: () => void }) {
  const { toast } = useToast();
  const [circles, setCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    circlesService.getAll()
      .then((res) => setCircles(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load circles" }))
      .finally(() => setLoading(false));
  }, []);

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
            <div key={c._id} className="bg-card border border-border rounded-lg p-5 transition-all cursor-pointer hover:border-teal hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(14,107,114,0.1)]">
              <div className="flex justify-between items-start mb-3.5">
                <div>
                  <div className="font-semibold text-[15px] text-foreground">{c.name}</div>
                  <div className="text-xs text-nc-muted mt-0.5">{c.neighbourhood?.name || "—"}</div>
                </div>
                <NcBadge variant={c.status === "active" ? "green" : "amber"}>
                  {c.status === "active" ? "Active" : c.status}
                </NcBadge>
              </div>
              <div className="text-xs text-nc-muted mb-3.5">
                Murabbi: {c.murabbi?.fullName || "Unassigned"}
              </div>
              <div className="text-xs text-nc-muted mb-1">
                📅 {c.sessionDay || "—"} · {c.sessionTime || "—"}
              </div>
              <div className="text-xs text-nc-muted">
                📍 {c.venue || "—"}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3.5">
                {[
                  { val: c.maxStudents || "—", label: "Max Students" },
                  { val: c.status, label: "Status" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-2 bg-muted rounded-lg">
                    <div className="text-base font-bold text-teal font-serif">{stat.val}</div>
                    <div className="text-[10px] text-nc-muted uppercase tracking-wide mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}