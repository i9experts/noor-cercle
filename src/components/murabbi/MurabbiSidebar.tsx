import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { murabbisService } from "@/services/api.service";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  icon    : string;
  label   : string;
  page    : string;
  badgeKey?: "students";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { icon: '⬡', label: 'Murabbi Dashboard', page: 'murabbi-dashboard' },
    ],
  },
  {
    label: 'My Teaching',
    items: [
      { icon: '◈', label: 'My Students', page: 'murabbi-students', badgeKey: 'students' },
      { icon: '◑', label: 'My Circles',  page: 'murabbi-circles'  },
    ],
  },
  {
    label: 'Activities',
    items: [
      { icon: '◐', label: 'Mark Attendance', page: 'murabbi-attendance' },
      { icon: '◒', label: 'Lesson Plans',    page: 'murabbi-lessons'    },
    ],
  },
  {
    label: 'Support',
    items: [
      { icon: '◎', label: 'Training Materials', page: 'murabbi-training'       },
      { icon: '◉', label: 'Reports',            page: 'murabbi-reports'        },
      { icon: '◆', label: 'Announcements',      page: 'murabbi-announcements'  },
    ],
  },
  {
    label: 'System',
    items: [
      { icon: '◌', label: 'Settings', page: 'settings' },
    ],
  },
];

function loadSeen(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem('murabbi_sidebar_seen') || '{}'); } catch { return {}; }
}

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].substring(0, 2).toUpperCase();
}

interface MurabbiSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function MurabbiSidebar({ activePage, onNavigate }: MurabbiSidebarProps) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [seen,   setSeen]   = useState<Record<string, number>>(loadSeen);

  useEffect(() => {
    murabbisService.getDashboard()
      .then((r) => {
        const d = r.data.data || r.data;
        setCounts({ students: d.stats?.totalStudents ?? 0 });
      })
      .catch(() => {});
  }, []);

  // Clear badge when active page changes
  useEffect(() => {
    const item = navGroups.flatMap((g) => g.items).find((i) => i.page === activePage);
    if (!item?.badgeKey) return;
    const key = item.badgeKey;
    if (counts[key] === undefined) return;
    setSeen((prev) => {
      const next = { ...prev, [key]: counts[key] };
      localStorage.setItem('murabbi_sidebar_seen', JSON.stringify(next));
      return next;
    });
  }, [activePage, counts]);

  function handleNavigate(page: string) {
    const item = navGroups.flatMap((g) => g.items).find((i) => i.page === page);
    if (item?.badgeKey) {
      const key = item.badgeKey;
      setSeen((prev) => {
        const next = { ...prev, [key]: counts[key] ?? prev[key] };
        localStorage.setItem('murabbi_sidebar_seen', JSON.stringify(next));
        return next;
      });
    }
    onNavigate(page);
  }

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-[260px] bg-sidebar flex flex-col z-[100]">
      {/* Logo */}
      <div className="bg-white border border-gray-200 flex justify-center shadow-sm p-4">
        <div className="flex items-center justify-center">
          <img
            src="/noor-circle-logo-white.png"
            alt="logo"
            className="h-32 sm:h-32 md:h-28 w-auto object-contain"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="text-[10px] tracking-[1.5px] uppercase text-white/25 px-3 py-2 pb-1.5 font-medium">
              {group.label}
            </div>
            {group.items.map((item) => {
              const current  = item.badgeKey ? (counts[item.badgeKey] ?? 0) : 0;
              const lastSeen = item.badgeKey ? (seen[item.badgeKey]   ?? 0) : 0;
              const showBadge = item.badgeKey && current > 0 && current !== lastSeen;
              return (
                <a
                  key={item.page}
                  onClick={() => handleNavigate(item.page)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-sm cursor-pointer transition-all mb-0.5 text-[13.5px] font-normal",
                    activePage === item.page
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className="text-lg opacity-80">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <span className="bg-[#6B5AFA] text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                      {current}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Profile Mini */}
      <div className="p-4 border-t border-white/5 bg-sidebar-accent/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
            {(user as any)?.image
              ? <img src={(user as any).image} alt={user?.fullName} className="w-full h-full object-cover" />
              : user?.fullName ? getInitials(user.fullName) : "M"
            }
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-white">{user?.fullName || "Murabbi"}</span>
            <span className="text-[10px] text-white/50">Murabbi</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
