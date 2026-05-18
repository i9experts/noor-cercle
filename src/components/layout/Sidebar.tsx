import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { adminService } from "@/services/api.service";

interface NavItem {
  icon : string;
  label: string;
  page : string;
  badgeKey?: "students" | "murabbis";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { icon: '⬡', label: 'Dashboard',           page: 'dashboard' },
      { icon: '◎', label: 'Noor Circles World',   page: 'world'     },
    ],
  },
  {
    label: 'People',
    items: [
      { icon: '◈', label: 'Students', page: 'students', badgeKey: 'students' },
      { icon: '◉', label: 'Murabbis', page: 'murabbis', badgeKey: 'murabbis' },
      { icon: '◌', label: 'Parents',  page: 'parents'  },
    ],
  },
  {
    label: 'Programme',
    items: [
      { icon: '◑', label: 'Circles',              page: 'circles'    },
      { icon: '◐', label: 'Attendance',            page: 'attendance' },
      { icon: '◒', label: 'Sessions & Curriculum', page: 'sessions'   },
    ],
  },
  {
    label: 'Formation',
    items: [
      { icon: '◈', label: 'Performance & Reviews', page: 'performance' },
      { icon: '◍', label: 'Incentives & Awards',   page: 'incentives'  },
    ],
  },
  {
    label: 'Operations',
    items: [
      { icon: '◎', label: 'Murabbi Training',    page: 'training'       },
      { icon: '⬡', label: 'Neighbourhoods',      page: 'neighbourhoods' },
      { icon: '◉', label: 'Reports & Analytics', page: 'reports'        },
    ],
  },
  {
    label: 'System',
    items: [
      { icon: '◌', label: 'Settings', page: 'settings' },
    ],
  },
];

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

function loadSeen(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem('sidebar_seen') || '{}'); } catch { return {}; }
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [seen,   setSeen]   = useState<Record<string, number>>(loadSeen);

  useEffect(() => {
    adminService.getDashboard()
      .then((r) => {
        const d = r.data.data || r.data;
        setCounts({
          students: d.totalStudents ?? 0,
          murabbis: d.totalMurabbis ?? 0,
        });
      })
      .catch(() => {});
  }, []);

  // When the active page changes, mark its badge as seen
  useEffect(() => {
    const item = navGroups.flatMap((g) => g.items).find((i) => i.page === activePage);
    if (!item?.badgeKey) return;
    const key = item.badgeKey;
    if (counts[key] === undefined) return;
    setSeen((prev) => {
      const next = { ...prev, [key]: counts[key] };
      localStorage.setItem('sidebar_seen', JSON.stringify(next));
      return next;
    });
  }, [activePage, counts]);

  function handleNavigate(page: string) {
    const item = navGroups.flatMap((g) => g.items).find((i) => i.page === page);
    if (item?.badgeKey) {
      const key = item.badgeKey;
      setSeen((prev) => {
        const next = { ...prev, [key]: counts[key] ?? prev[key] };
        localStorage.setItem('sidebar_seen', JSON.stringify(next));
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
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-sm cursor-pointer transition-all mb-0.5 text-[13.5px] font-normal",
                    activePage === item.page
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  onClick={() => handleNavigate(item.page)}
                >
                  <span className="w-[18px] h-[18px] opacity-70 flex-shrink-0 text-[15px] text-center">
                    {item.icon}
                  </span>
                  {item.label}
                  {showBadge && (
                    <span className="ml-auto bg-teal-md text-primary-foreground text-[10px] font-semibold px-[7px] py-px rounded-full">
                      {current}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-sidebar-border text-xs text-white/30">
        TDW Portal v1.0 · 2025
      </div>
    </nav>
  );
}
