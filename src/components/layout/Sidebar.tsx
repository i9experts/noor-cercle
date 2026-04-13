import { cn } from "@/lib/utils";
import { pageNames } from "@/data/mockData";

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
      { icon: '⬡', label: 'Dashboard', page: 'dashboard' },
      { icon: '◎', label: 'Noor Circles World', page: 'world' },
    ],
  },
  {
    label: 'People',
    items: [
      { icon: '◈', label: 'Students', page: 'students', badge: '84' },
      { icon: '◉', label: 'Murabbis', page: 'murabbis', badge: '9' },
      { icon: '◌', label: 'Parents', page: 'parents' },
    ],
  },
  {
    label: 'Programme',
    items: [
      { icon: '◑', label: 'Circles', page: 'circles' },
      { icon: '◐', label: 'Attendance', page: 'attendance' },
      { icon: '◒', label: 'Sessions & Curriculum', page: 'sessions' },
    ],
  },
  {
    label: 'Formation',
    items: [
      { icon: '◈', label: 'Performance & Reviews', page: 'performance' },
      { icon: '◍', label: 'Incentives & Awards', page: 'incentives' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { icon: '◎', label: 'Murabbi Training', page: 'training' },
      { icon: '⬡', label: 'Neighbourhoods', page: 'neighbourhoods' },
      { icon: '◉', label: 'Reports & Analytics', page: 'reports' },
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

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <nav className="fixed left-0 top-0 bottom-0 w-[260px] bg-sidebar flex flex-col z-[100]">
      <div className="px-6 pt-6 pb-5 border-b border-sidebar-border">

        {/* Logo */}
        <div className="px-5">

          {/* Outer soft container */}
          <div className="bg-white/10 border border-white/10 rounded-2xl p-3 flex justify-center">

            {/* Inner logo container */}
            <div className="bg-white rounded-xl p-1 flex items-center justify-center">
              <img
                src="/noor-circle-logo.jpeg"
                alt="logo"
                className="h-38"
              />
            </div>

          </div>
        </div>

      </div>
      <div className="flex-1 overflow-y-auto px-3 pt-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="text-[10px] tracking-[1.5px] uppercase text-white/25 px-3 py-2 pb-1.5 font-medium">{group.label}</div>
            {group.items.map((item) => (
              <a
                key={item.page}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-sm cursor-pointer transition-all mb-0.5 text-[13.5px] font-normal",
                  activePage === item.page
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                onClick={() => onNavigate(item.page)}
              >
                <span className="w-[18px] h-[18px] opacity-70 flex-shrink-0 text-[15px] text-center">{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-teal-md text-primary-foreground text-[10px] font-semibold px-[7px] py-px rounded-full">{item.badge}</span>
                )}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="px-5 py-4 border-t border-sidebar-border text-xs text-white/30">TDW Portal v1.0 · 2025</div>
    </nav>
  );
}
