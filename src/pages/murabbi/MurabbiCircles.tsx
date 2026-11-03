import { useEffect, useState } from "react";
import NcBadge from "@/components/shared/NcBadge";
import { murabbisService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { Home, Phone } from "lucide-react";
import { joinAddress } from "@/lib/host";

export default function MurabbiCircles() {
  const { toast }                 = useToast();
  const [circles, setCircles]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    murabbisService.getMyCircles()
      .then((res) => setCircles(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load circles" }))
      .finally(() => setLoading(false));
  }, []);

  const activeCount = circles.filter((c) => c.isActive).length;
  const nbhSet      = new Set(circles.map((c) => c.neighbourhood?._id).filter(Boolean));

  return (
    <div className="page-animate">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-semibold text-[22px]">My Circles</h1>
        <p className="text-[12.5px] text-nc-muted mt-0.5">
          {loading ? "…" : `${activeCount} active across ${nbhSet.size} neighbourhood${nbhSet.size !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-nc-muted text-sm animate-pulse">Loading circles…</div>
      ) : circles.length === 0 ? (
        <div className="text-center py-20 text-nc-muted text-sm border border-dashed border-border rounded-xl">
          No circles assigned yet. Contact your admin to get assigned.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {circles.map((c: any) => {
            const nbh     = c.neighbourhood;
            const nbhStat = nbh?.status;
            const badge   = !c.isActive ? "inactive" : nbhStat === "review" ? "review" : "active";

            return (
              <div key={c._id} className="bg-card border border-border rounded-xl p-5 hover:border-teal/30 transition-colors">

                {/* Top row */}
                <div className="flex items-start justify-between mb-1">
                  <div className="font-semibold text-[15px] pr-2">{c.name}</div>
                  <NcBadge variant={badge === "review" ? "amber" : badge === "inactive" ? "slate" : "green"}>
                    {badge === "review" ? "Review" : badge === "inactive" ? "Inactive" : "Active"}
                  </NcBadge>
                </div>

                {/* Neighbourhood */}
                <div className="text-[12.5px] text-teal font-medium mb-1">
                  {[nbh?.name, nbh?.area || nbh?.city].filter(Boolean).join(" · ") || "—"}
                </div>

                {/* Mosques */}
                {nbh?.mosques && (
                  <div className="text-[11.5px] text-nc-muted mb-3">{nbh.mosques}</div>
                )}

                {/* Capacity */}
                {!nbh?.mosques && (
                  <div className="text-[11.5px] text-nc-muted mb-3">
                    Capacity: {c.capacity}
                  </div>
                )}

                {/* Venue (a host's space) */}
                {c.venue && (
                  <div className="mb-3 rounded-lg border border-border/60 bg-plum-lt/30 px-3 py-2 text-[12px]">
                    <div className="flex items-start gap-1.5 font-medium text-nc-dark">
                      <Home className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-plum" />
                      <span className="min-w-0 break-words">{c.venue.name}</span>
                    </div>
                    {(c.venue.address || c.venue.area || c.venue.city) && (
                      <div className="mt-0.5 break-words pl-5 text-nc-muted">{joinAddress(c.venue.address, c.venue.area, c.venue.city)}</div>
                    )}
                    {c.venue.host && (
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 pl-5 text-nc-muted">
                        <span>Host: <span className="text-nc-dark">{c.venue.host.fullName}</span></span>
                        {c.venue.host.phone && (
                          <a href={`tel:${String(c.venue.host.phone).replace(/\s/g, "")}`} className="inline-flex items-center gap-1 font-medium text-teal hover:underline">
                            <Phone className="h-3 w-3" /> {c.venue.host.phone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Stats boxes */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: c.studentCount      ?? 0,       label: "STUDENTS"   },
                    { val: `${c.sessionsCompleted ?? 0}/40`, label: "SESSIONS"   },
                    { val: `${c.attendanceRate  ?? 0}%`,    label: "ATTENDANCE" },
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
    </div>
  );
}
