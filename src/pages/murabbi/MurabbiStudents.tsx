import { useEffect, useState } from "react";
import NcCard from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import { Search, Phone, MessageSquare, MoreVertical } from "lucide-react";
import { murabbisService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

export default function MurabbiStudents() {
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    murabbisService.getMyStudents()
      .then((res) => setStudents(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load students" }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(
    (s) => !search || s.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-animate">
      <SectionTitle title="My Students" subtitle="Manage and track progress of students in your circles." />
      <div className="flex gap-4 mb-6 justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nc-muted" />
          <input type="text" placeholder="Search students..." className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-md text-sm focus:outline-none"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <NcCard>
        {loading ? (
          <div className="text-center py-10 text-nc-muted text-sm animate-pulse">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  {["Student", "Circle", "Neighbourhood", "Phone", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-4 text-[13px] font-semibold text-nc-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {s.fullName?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{s.fullName}</div>
                          <div className="text-[11px] text-nc-muted">Father: {s.fatherName || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">{s.circle?.name || "—"}</td>
                    <td className="px-4 py-4 text-sm text-nc-muted">{s.neighbourhood?.name || "—"}</td>
                    <td className="px-4 py-4 text-sm">{s.phone || "—"}</td>
                    <td className="px-4 py-4">
                      <NcBadge variant={s.isActive ? "green" : "amber"}>
                        {s.isActive ? "Active" : "Inactive"}
                      </NcBadge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 hover:bg-muted rounded-md text-nc-muted" title="WhatsApp">
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 hover:bg-muted rounded-md text-nc-muted" title="Call Parent">
                          <Phone className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 hover:bg-muted rounded-md text-nc-muted">
                          <MoreVertical className="h-4 w-4" />
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