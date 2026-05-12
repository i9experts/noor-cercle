import { cn } from "@/lib/utils";

interface NavItem {
  icon: string;
  label: string;
  page: string;
  badge?: string;
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
      { icon: '◈', label: 'My Students', page: 'murabbi-students', badge: '12' },
      { icon: '◑', label: 'My Circles', page: 'murabbi-circles' },
    ],
  },
  {
    label: 'Activities',
    items: [
      { icon: '◐', label: 'Mark Attendance', page: 'murabbi-attendance' },
      { icon: '◒', label: 'Lesson Plans', page: 'murabbi-lessons' },
    ],
  },
  {
    label: 'Support',
    items: [
      { icon: '◎', label: 'Training Materials', page: 'murabbi-training' },
      { icon: '◉', label: 'Reports', page: 'murabbi-reports' },
    ],
  },
  {
    label: 'System',
    items: [
      { icon: '◌', label: 'Settings', page: 'settings' },
    ],
  },
];

interface MurabbiSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function MurabbiSidebar({ activePage, onNavigate }: MurabbiSidebarProps) {
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
            <div className="text-[10px] tracking-[1.5px] uppercase text-white/25 px-3 py-2 pb-1.5 font-medium">{group.label}</div>
            {group.items.map((item) => (
              <a
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-sm cursor-pointer transition-all mb-0.5 text-[13.5px] font-normal",
                  activePage === item.page
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                <span className="text-lg opacity-80">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="bg-[#6B5AFA] text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                    {item.badge}
                  </span>
                )}
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* User Profile Mini */}
      <div className="p-4 border-t border-white/5 bg-sidebar-accent/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
            M
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-white">Murabbi Ahmad</span>
            <span className="text-[10px] text-white/50">Senior Teacher</span>
          </div>
        </div>
      </div>
    </nav>
  );
}