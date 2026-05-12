import { useEffect, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import { adminService, studentsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function StudentsPage({
  onEnroll,
  refreshKey,
}: {
  onEnroll: () => void;
  refreshKey?: number;
}) {
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats]       = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  function load() {
    setLoading(true);
    Promise.all([studentsService.getAll(), adminService.getDashboard()])
      .then(([sRes, dRes]) => {
        setStudents(sRes.data.data || []);
        setStats(dRes.data.data || null);
      })
      .catch(() => toast({ variant: "destructive", title: "Failed to load students" }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [refreshKey]);

  async function toggleStatus(s: any) {
    try {
      if (s.isActive) {
        await studentsService.deactivate(s._id);
        toast({ title: `${s.fullName} deactivated.` });
      } else {
        await studentsService.activate(s._id);
        toast({ title: `${s.fullName} activated.` });
      }
      load();
    } catch {
      toast({ variant: "destructive", title: "Action failed." });
    }
  }

  async function handleDelete(s: any) {
    if (!confirm(`Delete ${s.fullName}? This cannot be undone.`)) return;
    try {
      await studentsService.remove(s._id);
      toast({ title: "Student deleted." });
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Delete failed.";
      toast({ variant: "destructive", title: msg });
    }
  }

  const filtered = students.filter(
    (s) =>
      !search ||
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.neighbourhood?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.circle?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="page-animate">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Total Enrolled" value={stats?.totalStudents ?? students.length} meta="All circles"       color="teal"   />
        <StatCard label="Active Students" value={stats?.activeStudents ?? "—"}            meta="Currently active"  color="green"  />
        <StatCard label="Total Circles"   value={stats?.totalCircles  ?? "—"}             meta="Across all areas"  color="gold"   />
        <StatCard label="Murabbis"        value={stats?.totalMurabbis ?? "—"}             meta="Registered"        color="purple" />
      </div>

      <NcCard>
        <CardHeader>
          <CardTitle sub={`${students.length} enrolled`}>All Students</CardTitle>
          <div className="flex gap-2.5 items-center">
            <div className="flex items-center gap-2.5 bg-muted border border-border rounded-sm px-3.5 w-[220px]">
              <span className="text-nc-muted text-sm">⌕</span>
              <input
                className="border-none bg-transparent outline-none text-[13.5px] text-foreground flex-1 py-[9px] font-sans"
                placeholder="Search students…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="btn-gold" onClick={onEnroll}>+ Enroll Student</button>
          </div>
        </CardHeader>

        {loading ? (
          <div className="text-center py-10 text-nc-muted text-sm animate-pulse">Loading students...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-nc-muted text-sm">No students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr>
                  {["Student", "Father", "Phone", "Circle", "Neighbourhood", "Enrolled", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="bg-muted px-3.5 py-2.5 text-left text-xs font-semibold text-nc-muted uppercase tracking-wide border-b border-border"
                    >
                      {h}
                    </th>
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
                      <div className="flex gap-1.5">
                        <button className="btn-ghost text-xs" onClick={() => toggleStatus(s)}>
                          {s.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className="btn-ghost text-xs text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(s)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NcCard>
    </div>
  );
}
