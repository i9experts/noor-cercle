import { useEffect, useState } from "react";
import {
  BarChart3, BookOpen, CircleDot, ClipboardCheck, GraduationCap, Headphones, ListChecks,
  LayoutDashboard, Megaphone, School, Settings,
} from "lucide-react";
import { murabbisService } from "@/services/api.service";
import AppSidebar, { SidebarNavGroup } from "@/components/layout/AppSidebar";

const navGroups: SidebarNavGroup[] = [
  {
    label: "Overview",
    items: [{ icon: LayoutDashboard, label: "Dashboard", page: "murabbi-dashboard" }],
  },
  {
    label: "My Teaching",
    items: [
      { icon: GraduationCap, label: "My Students", page: "murabbi-students", badgeKey: "students" },
      { icon: CircleDot,     label: "My Circles",  page: "murabbi-circles" },
    ],
  },
  {
    label: "Activities",
    items: [
      { icon: ListChecks,     label: "Weekly Agenda",   page: "murabbi-agenda"     },
      { icon: ClipboardCheck, label: "Mark Attendance", page: "murabbi-attendance" },
      { icon: BookOpen,       label: "Lesson Plans",    page: "murabbi-lessons"    },
    ],
  },
  {
    label: "Support",
    items: [
      { icon: Headphones, label: "Asaas Training", page: "murabbi-course"       },
      { icon: School,    label: "Training",      page: "murabbi-training"      },
      { icon: BarChart3, label: "Reports",       page: "murabbi-reports"       },
      { icon: Megaphone, label: "Announcements", page: "murabbi-announcements" },
    ],
  },
  {
    label: "System",
    items: [{ icon: Settings, label: "Settings", page: "settings" }],
  },
];

interface MurabbiSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  open      : boolean;
  onClose   : () => void;
}

export default function MurabbiSidebar({ activePage, onNavigate, open, onClose }: MurabbiSidebarProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    murabbisService.getDashboard()
      .then((r) => {
        const d = r.data.data || r.data;
        setCounts({ students: d.stats?.totalStudents ?? 0 });
      })
      .catch(() => {});
  }, []);

  return (
    <AppSidebar
      groups={navGroups}
      activePage={activePage}
      onNavigate={onNavigate}
      counts={counts}
      seenStorageKey="murabbi_sidebar_seen"
      portalLabel="Murabbi Portal"
      open={open}
      onClose={onClose}
    />
  );
}
