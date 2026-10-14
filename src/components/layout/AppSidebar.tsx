import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export interface SidebarNavItem {
  icon     : LucideIcon;
  label    : string;
  page     : string;
  badgeKey?: string;
}

export interface SidebarNavGroup {
  label: string;
  items: SidebarNavItem[];
}

interface AppSidebarProps {
  groups        : SidebarNavGroup[];
  activePage    : string;
  onNavigate    : (page: string) => void;
  /** Current totals for badge keys; a badge shows while it differs from what the user last saw. */
  counts        : Record<string, number>;
  /** localStorage key used to remember the last-seen badge counts. */
  seenStorageKey: string;
  portalLabel   : string;
  /** Mobile/tablet drawer state (always visible from lg up). */
  open          : boolean;
  onClose       : () => void;
}

function loadSeen(key: string): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
}

function getInitials(name?: string) {
  if (!name) return "NC";
  const parts = name.trim().split(/\s+/);
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2)).toUpperCase();
}

/**
 * Shared navigation for the admin and murabbi portals.
 * Fixed on large screens; an off-canvas drawer below `lg`.
 */
export default function AppSidebar({
  groups, activePage, onNavigate, counts, seenStorageKey, portalLabel, open, onClose,
}: AppSidebarProps) {
  const { user, logout } = useAuth();
  const [seen, setSeen] = useState<Record<string, number>>(() => loadSeen(seenStorageKey));

  const markSeen = (key: string) => {
    if (counts[key] === undefined) return;
    setSeen((prev) => {
      const next = { ...prev, [key]: counts[key] };
      localStorage.setItem(seenStorageKey, JSON.stringify(next));
      return next;
    });
  };

  // Clear the badge for whichever page is active once its count is known
  useEffect(() => {
    const item = groups.flatMap((g) => g.items).find((i) => i.page === activePage);
    if (item?.badgeKey) markSeen(item.badgeKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, counts]);

  // Esc closes the drawer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop (drawer mode only) */}
      <div
        className={cn(
          "fixed inset-0 z-[90] bg-nc-dark2/50 backdrop-blur-[1px] transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <nav
        aria-label="Main navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-[100] flex w-[264px] flex-col bg-sidebar text-sidebar-foreground",
          "transition-transform duration-200 ease-out lg:translate-x-0",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-sidebar-border px-5">
          <img
            src="/brand/noor-circles-logo-horizontal-white.svg"
            alt="Noor Circles"
            className="h-10 w-auto"
          />
          <button
            className="-mr-1.5 rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pt-3 text-[10px] font-semibold uppercase tracking-[1.6px] text-gold">
          {portalLabel}
        </div>

        <div className="scroll-hover flex-1 px-3 pb-4">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[1.4px] text-white/50">
                {group.label}
              </div>
              {group.items.map((item) => {
                const Icon      = item.icon;
                const isActive  = activePage === item.page;
                const current   = item.badgeKey ? (counts[item.badgeKey] ?? 0) : 0;
                const lastSeen  = item.badgeKey ? (seen[item.badgeKey] ?? 0) : 0;
                const showBadge = !!item.badgeKey && current > 0 && current !== lastSeen;
                return (
                  <button
                    key={item.page}
                    type="button"
                    onClick={() => {
                      if (item.badgeKey) markSeen(item.badgeKey);
                      onNavigate(item.page);
                    }}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative mb-px flex w-full items-center gap-3 rounded-md px-3 py-[7px] text-left text-[13.5px] transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                      isActive
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r before:bg-gold"
                        : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className="h-[17px] w-[17px] flex-shrink-0" strokeWidth={1.8} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {showBadge && (
                      <span className="min-w-[20px] rounded-full bg-gold px-1.5 py-px text-center text-[10.5px] font-semibold text-gold-foreground">
                        {current}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Signed-in user */}
        <div className="flex flex-shrink-0 items-center gap-3 border-t border-sidebar-border px-4 py-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xs font-semibold text-white ring-1 ring-gold/60">
            {user?.image
              ? <img src={user.image} alt="" className="h-full w-full object-cover" />
              : getInitials(user?.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-white">{user?.fullName || "Signed in"}</div>
            <div className="text-[11px] capitalize text-white/55">{user?.role || ""}</div>
          </div>
          <button
            className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            onClick={() => logout()}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </nav>
    </>
  );
}
