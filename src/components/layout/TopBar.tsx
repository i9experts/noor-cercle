
const pageNames: Record<string, string> = {
  dashboard          : 'Admin Dashboard',
  world              : 'Noor Circles World',
  students           : 'Student Management',
  murabbis           : 'Murabbi Management',
  parents            : 'Parent Network',
  interest           : 'Interest Requests',
  'parent-insights'  : 'Parent Insights',
  contributions      : 'Contributions',
  rewards            : 'Reward Pool',
  ratings            : 'Murabbi Ratings',
  syllabus           : 'Syllabus',
  'syllabus-progress': 'Syllabus Progress',
  calendar           : 'Calendar',
  'murabbi-agenda'   : 'Weekly Agenda',
  circles            : 'Circle Management',
  attendance         : 'Attendance Overview',
  sessions           : 'Sessions & Curriculum',
  performance        : 'Performance & Reviews',
  incentives         : 'Incentives & Awards',
  training           : 'Murabbi Training',
  asaas              : 'Asaas Training',
  emails             : 'Emails',
  neighbourhoods     : 'Neighbourhoods',
  reports            : 'Reports & Analytics',
  settings           : 'System Settings',
  'murabbi-dashboard': 'Dashboard',
  'murabbi-students' : 'My Students',
  'murabbi-circles'  : 'My Circles',
  'murabbi-attendance': 'Mark Attendance',
  'murabbi-lessons'  : 'Lesson Plans',
  'murabbi-training' : 'Training',
  'murabbi-course'   : 'Asaas Training',
  'murabbi-reports'  : 'My Reports',
  'murabbi-announcements': 'Announcements',
  'murabbi-profile'  : 'My Profile',
};
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, LayoutDashboard, Menu, Plus } from "lucide-react";
import NotificationBell from "@/components/shared/NotificationBell";

interface TopBarProps {
  activePage              : string;
  onEnroll                : () => void;
  /** Opens the navigation drawer (below the lg breakpoint). */
  onMenu                  : () => void;
  onAdminNav             ?: (page: string) => void;
  onMurabbiNav           ?: (page: string) => void;
  onApproveDeleteRequest ?: (studentId: string, notifId: string) => void;
}

export default function TopBar({ activePage, onEnroll, onMenu, onAdminNav, onMurabbiNav, onApproveDeleteRequest }: TopBarProps) {
  const title = pageNames[activePage] || activePage;
  const { user, logout } = useAuth();
  const isMurabbiPanel = window.location.pathname.includes('/murabbi');

  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const userInitials = user?.fullName ? getInitials(user.fullName) : "AA";

  return (
    <header className="bg-card/95 backdrop-blur border-b border-border px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sticky top-0 z-50">
      <div className="flex min-w-0 items-center gap-2">
        <button
          className="-ml-1.5 rounded-md p-2 text-nc-dark hover:bg-muted lg:hidden"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate font-serif text-[19px] text-nc-dark sm:text-[22px]">
          {title}
          {activePage === 'dashboard' && user?.fullName && (
            <span className="ml-2.5 hidden font-sans text-[13px] font-normal text-nc-muted md:inline">
              Welcome back, {user.fullName}
            </span>
          )}
        </h1>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
        <button className="btn-gold !px-3 sm:!px-[18px]" onClick={onEnroll} aria-label="Enroll student">
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          <span className="hidden sm:inline">Enroll Student</span>
        </button>

        <NotificationBell onApproveDeleteRequest={onApproveDeleteRequest} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 rounded-full bg-plum-lt flex items-center justify-center text-sm font-semibold text-plum cursor-pointer ring-1 ring-gold/50 hover:ring-gold transition overflow-hidden" title={user?.fullName} aria-label="Account menu">
              {user?.image
                ? <img src={user.image} alt={user.fullName} className="w-full h-full object-cover" />
                : userInitials
              }
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-[10px] leading-none text-gold-dim font-bold uppercase mt-1">
                  {user?.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isMurabbiPanel ? (
              <>
                <DropdownMenuItem className="cursor-pointer" onClick={() => onMurabbiNav?.('murabbi-profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => onMurabbiNav?.('murabbi-dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => onMurabbiNav?.('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem className="cursor-pointer" onClick={() => onAdminNav?.('dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => onAdminNav?.('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600 cursor-pointer" 
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
