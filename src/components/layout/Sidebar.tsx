import { useEffect, useState } from "react";
import {
  Award, BarChart3, BookOpen, CircleDot, ClipboardCheck, Globe2, GraduationCap,
  HeartHandshake, LayoutDashboard, MapPin, School, Settings, TrendingUp, Users,
} from "lucide-react";
import { adminService } from "@/services/api.service";
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
        setCounts({ students: d.totalStudents ?? 0, murabbis: d.totalMurabbis ?? 0 });
      })
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
