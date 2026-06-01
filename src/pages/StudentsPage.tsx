import { useEffect, useRef, useState, useMemo } from "react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import { adminService, circlesService, studentsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, Pencil, UserCheck, UserX, Trash2 } from "lucide-react";
import { EditStudentModal } from "@/components/modals/AllModals";

const STATUS_TABS = ["All", "Active", "Inactive"] as const;
type StatusTab = typeof STATUS_TABS[number];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function ActionMenu({ student, onEdit, onToggle, onDelete }: {
  student: any;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="p-1.5 hover:bg-muted rounded-md text-nc-muted"
        onClick={() => setOpen((s) => !s)}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-44 bg-card border border-border rounded-lg shadow-lg z-50 py-1 text-[13px]">
          <button
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-muted text-left"
            onClick={() => { setOpen(false); onEdit(); }}
          >
            <Pencil className="h-3.5 w-3.5 text-nc-muted" /> Edit
          </button>
          <button
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-muted text-left"
            onClick={() => { setOpen(false); onToggle(); }}
          >
            {student.isActive
              ? <><UserX className="h-3.5 w-3.5 text-amber-500" /> Deactivate</>
              : <><UserCheck className="h-3.5 w-3.5 text-green-600" /> Activate</>}
          </button>
          <div className="border-t border-border my-1" />
          <button
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-50 text-red-600 text-left"
            onClick={() => { setOpen(false); onDelete(); }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function StudentsPage({
  onEnroll, refreshKey,
}: { onEnroll: () => void; refreshKey?: number }) {
  const { toast } = useToast();
  const [students, setStudents]         = useState<any[]>([]);
  const [circles, setCircles]           = useState<any[]>([]);
  const [murabbis, setMurabbis]         = useState<any[]>([]);
  const [stats, setStats]               = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [circleFilter, setCircleFilter] = useState("");
  const [murabbiFilter, setMurabbiFilter] = useState("");
  const [statusTab, setStatusTab]       = useState<StatusTab>("All");
  const [editStudent, setEditStudent]   = useState<any>(null);

  function load() {
    setLoading(true);
    Promise.all([
      studentsService.getAll(),
      adminService.getDashboard(),
      circlesService.getAll(),
      adminService.getMurabbis(),
    ])
      .then(([sRes, dRes, cRes, mRes]) => {
        setStudents(sRes.data.data || []);
        setStats(dRes.data.data || null);
        setCircles(cRes.data.data || []);
        setMurabbis(mRes.data.data || []);
      })
      .catch(() => toast({ variant: "destructive", title: "Failed to load students" }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [refreshKey]);

  async function toggleStatus(s: any) {
    try {
      if (s.isActive) { await studentsService.deactivate(s._id); toast({ title: `${s.fullName} deactivated.` }); }
      else             { await studentsService.activate(s._id);   toast({ title: `${s.fullName} activated.` }); }
      load();
    } catch { toast({ variant: "destructive", title: "Action failed." }); }
  }

  async function handleDelete(s: any) {
    if (!confirm(`Delete ${s.fullName}? This cannot be undone.`)) return;
    try {
      await studentsService.remove(s._id);
      toast({ title: "Student deleted." });
      load();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Delete failed." });
    }
  }

  const filtered = useMemo(() => students.filter((s) => {
    if (statusTab === "Active"   && !s.isActive) return false;
    if (statusTab === "Inactive" &&  s.isActive) return false;
    if (circleFilter && (s.circle?._id || s.circle) !== circleFilter) return false;
    if (murabbiFilter) {
      const studentMurabbi = s.murabbi?._id || s.murabbi;
      if (studentMurabbi !== murabbiFilter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return s.fullName?.toLowerCase().includes(q) ||
             s.neighbourhood?.name?.toLowerCase().includes(q) ||
             s.circle?.name?.toLowerCase().includes(q);
    }
    return true;
  }), [students, statusTab, circleFilter, murabbiFilter, search]);

  return (
    <div className="page-animate">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Total Enrolled"  value={stats?.totalStudents ?? students.length} meta="All circles"      color="teal"   />
        <StatCard label="Active Students" value={stats?.activeStudents ?? "—"}             meta="Currently active" color="green"  />
        <StatCard label="Total Circles"   value={stats?.totalCircles  ?? "—"}              meta="Across all areas" color="gold"   />
        <StatCard label="Murabbis"        value={stats?.totalMurabbis ?? "—"}              meta="Registered"       color="purple" />
      </div>

      <NcCard>
        <CardHeader>
          <CardTitle sub={`${filtered.length} of ${students.length} enrolled`}>All Students</CardTitle>
          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Search */}
            <div className="flex items-center gap-2.5 bg-muted border border-border rounded-sm px-3.5 w-[200px]">
              <span className="text-nc-muted text-sm">⌕</span>
              <input
                className="border-none bg-transparent outline-none text-[13.5px] text-foreground flex-1 py-[9px] font-sans"
                placeholder="Search students…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status tabs */}
            <div className="flex bg-muted border border-border rounded-sm p-0.5 gap-0.5">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusTab(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
                    statusTab === tab
                      ? "bg-card text-foreground shadow-sm"
                      : "text-nc-muted hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Murabbi filter */}
            {murabbis.length > 0 && (
              <select
                className="border border-border bg-muted rounded-sm px-3 py-[9px] text-[13.5px] text-foreground outline-none cursor-pointer"
                value={murabbiFilter}
                onChange={(e) => setMurabbiFilter(e.target.value)}
              >
                <option value="">All Murabbis</option>
                {murabbis.map((m: any) => (
                  <option key={m._id} value={m._id}>{m.fullName}</option>
                ))}
              </select>
            )}

            {/* Circle filter */}
            <select
              className="border border-border bg-muted rounded-sm px-3 py-[9px] text-[13.5px] text-foreground outline-none cursor-pointer"
              value={circleFilter}
              onChange={(e) => setCircleFilter(e.target.value)}
            >
              <option value="">All Circles</option>
              {circles.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            <button className="btn-gold" onClick={onEnroll}>+ Enroll Student</button>
          </div>
        </CardHeader>

        {loading ? (
          <div className="text-center py-10 text-nc-muted text-sm animate-pulse">Loading students...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-nc-muted text-sm">No students found.</div>
        ) : (
          <div className="scroll-hover overflow-x-auto max-h-[280px]">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr>
                  {["Student", "Father", "Phone", "Circle", "Neighbourhood", "Enrolled", "Status", ""].map((h) => (
                    <th key={h} className="bg-muted px-3.5 py-2.5 text-left text-xs font-semibold text-nc-muted uppercase tracking-wide border-b border-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-teal-lt">
                    <td className="px-3.5 py-3 border-b border-border">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[34px] h-[34px] rounded-lg bg-teal-lt flex items-center justify-center text-xs font-bold text-teal">
                          {getInitials(s.fullName)}
                        </div>
                        <div>
                          <div className="font-semibold text-[13.5px]">{s.fullName}</div>
                          <div className="text-[11px] text-nc-muted">{s.email || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 border-b border-border text-[13px] text-slate">{s.fatherName || "—"}</td>
                    <td className="px-3.5 py-3 border-b border-border text-[13px] text-slate">{s.phone || "—"}</td>
                    <td className="px-3.5 py-3 border-b border-border text-[13px] text-slate">{s.circle?.name || "—"}</td>
                    <td className="px-3.5 py-3 border-b border-border text-[13px] text-slate">{s.neighbourhood?.name || "—"}</td>
                    <td className="px-3.5 py-3 border-b border-border text-[13px] text-slate">
                      {s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3.5 py-3 border-b border-border">
                      <NcBadge variant={s.isActive ? "green" : "amber"}>
                        {s.isActive ? "Active" : "Inactive"}
                      </NcBadge>
                    </td>
                    <td className="px-3.5 py-3 border-b border-border">
                      <ActionMenu
                        student={s}
                        onEdit={() => setEditStudent(s)}
                        onToggle={() => toggleStatus(s)}
                        onDelete={() => handleDelete(s)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NcCard>

      <EditStudentModal
        open={!!editStudent}
        student={editStudent}
        onClose={() => setEditStudent(null)}
        onSuccess={() => { setEditStudent(null); load(); }}
      />
    </div>
  );
}
