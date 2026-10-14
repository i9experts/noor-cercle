import { useEffect, useState } from "react";
import {
  Award, BarChart3, Gift, HandCoins, Star, BookOpen, CircleDot, ClipboardCheck, Globe2, GraduationCap,
  HeartHandshake, Inbox, LayoutDashboard, MapPin, School, Settings, TrendingUp, Users,
} from "lucide-react";
import { adminService, contributionsService, interestService } from "@/services/api.service";
import AppSidebar, { SidebarNavGroup } from "./AppSidebar";

const navGroups: SidebarNavGroup[] = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",          page: "dashboard" },
      { icon: Globe2,          label: "Noor Circles World", page: "world"     },
    ],
  },
  {
    label: "People",
    items: [
      { icon: GraduationCap,  label: "Students", page: "students", badgeKey: "students" },
      { icon: Users,          label: "Murabbis", page: "murabbis", badgeKey: "murabbis" },
      { icon: HeartHandshake, label: "Parents",  page: "parents" },
      { icon: Inbox,          label: "Interest Requests", page: "interest", badgeKey: "interest" },
    ],
  },
  {
    label: "Programme",
    items: [
      { icon: CircleDot,      label: "Circles",               page: "circles"    },
      { icon: ClipboardCheck, label: "Attendance",            page: "attendance" },
      { icon: BookOpen,       label: "Sessions & Curriculum", page: "sessions"   },
    ],
  },
  {
    label: "Formation",
    items: [
      { icon: TrendingUp, label: "Performance & Reviews", page: "performance" },
      { icon: Award,      label: "Incentives & Awards",   page: "incentives"  },
    ],
  },
  {
    label: "Finance",
    items: [
      { icon: HandCoins, label: "Contributions",   page: "contributions", badgeKey: "contributions" },
      { icon: Gift,      label: "Reward Pool",     page: "rewards"       },
      { icon: Star,      label: "Murabbi Ratings", page: "ratings"       },
    ],
  },
  {
    label: "Operations",
    items: [
      { icon: School,    label: "Murabbi Training",    page: "training"       },
      { icon: MapPin,    label: "Neighbourhoods",      page: "neighbourhoods" },
      { icon: BarChart3, label: "Reports & Analytics", page: "reports"        },
    ],
  },
  {
    label: "System",
    items: [{ icon: Settings, label: "Settings", page: "settings" }],
  },
];

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  open      : boolean;
  onClose   : () => void;
}

export default function Sidebar({ activePage, onNavigate, open, onClose }: SidebarProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    adminService.getDashboard()
      .then((r) => {
        const d = r.data.data || r.data;
        setCounts((c) => ({ ...c, students: d.totalStudents ?? 0, murabbis: d.totalMurabbis ?? 0 }));
      })
      .catch(() => {});
    // Badge = requests still waiting for a first contact
    interestService.getAll({ status: "new" })
      .then((r) => setCounts((c) => ({ ...c, interest: (r.data.data || r.data || []).length })))
      .catch(() => {});
    // Badge = website pledges waiting to be confirmed
    contributionsService.getContributors({ status: "pending" })
      .then((r) => setCounts((c) => ({ ...c, contributions: (r.data.data || r.data || []).length })))
      .catch(() => {});
  }, []);

  return (
    <AppSidebar
      groups={navGroups}
      activePage={activePage}
      onNavigate={onNavigate}
      counts={counts}
      seenStorageKey="sidebar_seen"
      portalLabel="Admin Portal"
      open={open}
      onClose={onClose}
    />
  );
}
