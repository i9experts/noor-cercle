import { useEffect, useState } from "react";
import NcBadge from "@/components/shared/NcBadge";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import ProgressBar from "@/components/shared/ProgressBar";
import { neighbourhoodsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

export default function NeighbourhoodsPage() {
  const { toast } = useToast();
  const [nbhs, setNbhs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    neighbourhoodsService.getAll()
      .then((res) => setNbhs(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load neighbourhoods" }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-animate">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-serif text-[22px] text-foreground">Neighbourhood Management</div>
          <div className="text-xs text-nc-muted mt-0.5">{nbhs.length} neighbourhoods</div>
        </div>
        <button className="btn-gold">+ Add Neighbourhood</button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-nc-muted text-sm animate-pulse">Loading...</div>
      ) : nbhs.length === 0 ? (
        <div className="text-center py-20 text-nc-muted text-sm">No neighbourhoods yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-[18px] mb-5">
          {nbhs.map((n) => (
            <div key={n._id} className="bg-card border border-border rounded-lg p-[18px] cursor-pointer transition-all hover:border-teal hover:shadow-[0_4px_16px_rgba(14,107,114,0.1)]">
              <div className="flex justify-between mb-3">
                <div>
                  <div className="font-semibold text-[15px] text-foreground">{n.name}</div>
                  <div className="text-xs text-nc-muted">{n.area}{n.mosques ? ` · ${n.mosques}` : ""}</div>
                </div>
                <NcBadge variant={n.status === "active" ? "green" : "amber"}>{n.status}</NcBadge>
              </div>
              <div className="text-xs text-nc-muted mt-2">
                Created: {new Date(n.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}