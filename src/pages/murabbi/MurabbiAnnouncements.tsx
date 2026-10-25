import { useEffect, useState } from "react";
import SectionTitle from "@/components/shared/SectionTitle";
import NcCard from "@/components/shared/NcCard";
import { announcementsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { Calendar, GraduationCap, Heart, Info, Bell, Search, X } from "lucide-react";

type AnnouncementIcon = "session" | "training" | "donor" | "info";

interface Announcement {
  _id      : string;
  title    : string;
  body     : string;
  icon     : AnnouncementIcon;
  createdBy: { fullName: string } | null;
  createdAt: string;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

const ICON_CONFIG: Record<AnnouncementIcon, { Icon: React.ElementType; bg: string; text: string; label: string }> = {
  session  : { Icon: Calendar,      bg: "bg-teal/10",     text: "text-teal",     label: "Session"  },
  training : { Icon: GraduationCap, bg: "bg-gold/10",     text: "text-gold-dim",     label: "Training" },
  donor    : { Icon: Heart,         bg: "bg-nc-green/10", text: "text-nc-green", label: "Donor"    },
  info     : { Icon: Info,          bg: "bg-nc-muted/10", text: "text-nc-muted", label: "Info"     },
};

export default function MurabbiAnnouncements() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<"All" | AnnouncementIcon>("All" as any);

  useEffect(() => {
    announcementsService.getAll()
      .then((res) => setAnnouncements(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load announcements" }))
      .finally(() => setLoading(false));
  }, []);

  const FILTER_TABS = ["All", "session", "training", "donor", "info"] as const;

  const filtered = announcements.filter((a) => {
    if (filter !== "All" && a.icon !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="page-animate">
      <SectionTitle
        title="Announcements"
        subtitle="Stay up to date with the latest updates from the admin team."
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nc-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-lg bg-card focus:border-teal focus:shadow-[0_0_0_3px_rgba(105,28,70,0.12)] outline-none transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-nc-muted hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Type tabs */}
        <div className="flex bg-muted rounded-lg p-1 gap-0.5 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as typeof filter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-nc-muted hover:text-foreground"
              }`}
            >
              {tab === "All" ? "All" : ICON_CONFIG[tab as AnnouncementIcon]?.label ?? tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-nc-muted text-sm animate-pulse">Loading announcements...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <Bell className="h-6 w-6 text-nc-muted" />
          </div>
          <p className="text-nc-muted text-sm font-medium">
            {announcements.length === 0 ? "No announcements yet." : "No announcements match your filters."}
          </p>
          <p className="text-nc-muted text-[12px]">Check back later for updates from the admin team.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((a) => {
            const cfg = ICON_CONFIG[a.icon] || ICON_CONFIG.info;
            const IconComp = cfg.Icon;
            return (
              <NcCard key={a._id} className="hover:border-teal/30 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <IconComp className={`h-5 w-5 ${cfg.text}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="text-[15px] font-bold text-foreground leading-snug">{a.title}</h3>
                      <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-[13px] text-nc-muted leading-relaxed">{a.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-nc-muted">
                      <span>By {a.createdBy?.fullName || "Admin"}</span>
                      <span>·</span>
                      <span>{timeAgo(a.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </NcCard>
            );
          })}
        </div>
      )}
    </div>
  );
}