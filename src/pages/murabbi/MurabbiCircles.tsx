import { useEffect, useState } from "react";
import NcCard from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import { Users } from "lucide-react";
import { murabbisService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

export default function MurabbiCircles() {
  const { toast } = useToast();
  const [circles, setCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    murabbisService.getMyCircles()
      .then((res) => setCircles(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load circles" }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-animate">
      <SectionTitle title="My Circles" subtitle="All circles assigned to you." />

      {loading ? (
        <div className="text-center py-10 text-nc-muted text-sm animate-pulse">Loading...</div>
      ) : circles.length === 0 ? (
        <div className="text-center py-16 text-nc-muted text-sm">
          No circles assigned yet. Contact your admin to get assigned to a circle.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {circles.map((c: any) => (
            <NcCard key={c._id} className="hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-lt flex items-center justify-center text-teal flex-shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-[15px]">{c.name}</div>
                    <div className="text-[11px] text-nc-muted mt-0.5">
                      {c.neighbourhood?.name || "—"}
                      {c.neighbourhood?.city ? ` · ${c.neighbourhood.city}` : ""}
                    </div>
                  </div>
                </div>
                <NcBadge variant={c.isActive ? "green" : "amber"}>
                  {c.isActive ? "Active" : "Inactive"}
                </NcBadge>
              </div>
              <div className="mt-4 flex items-center gap-4 text-[12px] text-nc-muted border-t border-border pt-3">
                <span>Capacity: <strong className="text-foreground">{c.capacity}</strong></span>
              </div>
            </NcCard>
          ))}
        </div>
      )}
    </div>
  );
}
