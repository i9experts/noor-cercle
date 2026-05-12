import { pageNames } from "@/data/mockData";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, LayoutDashboard } from "lucide-react";

interface TopBarProps {
  activePage: string;
  onEnroll: () => void;
  onMurabbiNav?: (page: string) => void;
}

export default function TopBar({ activePage, onEnroll, onMurabbiNav }: TopBarProps) {
  const title = pageNames[activePage] || activePage;
  const navigate = useNavigate();
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
    <div className="bg-card border-b border-border px-8 h-16 flex items-center justify-between sticky top-0 z-50">
      <div>
        <div className="font-serif text-[22px] text-foreground">
          {title}
          {activePage === 'dashboard' && (
            <span className="font-sans text-[13px] text-nc-muted font-normal ml-2.5">
              Welcome back, {user?.fullName || "Atiq Sahib"}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {!isMurabbiPanel && (
          <button 
            className="text-xs font-medium text-primary hover:underline mr-4"
            onClick={() => navigate('/murabbi')}
          >
            Switch to Murabbi Panel →
          </button>
        )}
        {isMurabbiPanel && (
          <button 
            className="text-xs font-medium text-nc-muted hover:underline mr-4"
            onClick={() => navigate('/')}
          >
            ← Back to Admin
          </button>
        )}
        <div className="flex items-center gap-2.5 bg-muted border border-border rounded-sm px-3.5 w-[280px]">
          <span className="text-nc-muted text-sm">⌕</span>
          <input
            className="border-none bg-transparent outline-none text-[13.5px] text-foreground flex-1 py-[9px] font-sans"
            placeholder="Search students, circles, murabbis…"
          />
        </div>
        <button className="btn-gold" onClick={onEnroll}>+ Enroll Student</button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="w-9 h-9 rounded-full bg-teal-lt flex items-center justify-center text-sm font-semibold text-teal cursor-pointer hover:bg-teal-lt/80 transition-colors" title={user?.fullName}>
              {userInitials}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-[10px] leading-none text-teal font-bold uppercase mt-1">
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
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
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
    </div>
  );
}
