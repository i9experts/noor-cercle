import { useEffect, useRef, useState } from "react";
import NcCard from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import Modal, { FormGroup, FormInput, FormRow } from "@/components/shared/Modal";
import { Search, Phone, MessageSquare, MoreVertical, Pencil, Trash2, Trophy } from "lucide-react";
import { murabbisService } from "@/services/api.service";
import { AwardPointsModal } from "@/components/modals/AllModals";
import { useToast } from "@/hooks/use-toast";

function EditStudentModal({
  open, onClose, onSuccess, student,
}: { open: boolean; onClose: () => void; onSuccess: () => void; student: any }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "", fatherName: "", phone: "", email: "", dateOfBirth: "", address: "",
  });

  useEffect(() => {
    if (!open || !student) return;
    setForm({
      fullName   : student.fullName    || "",
      fatherName : student.fatherName  || "",
      phone      : student.phone       || "",
      email      : student.email       || "",
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split("T")[0] : "",
      address    : student.address     || "",
    });
  }, [open, student]);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit() {
    if (!form.fullName || !form.fatherName || !form.phone) {
      toast({ variant: "destructive", title: "Full name, father name and phone are required." }); return;
    }
    setLoading(true);
    try {
      await murabbisService.updateStudent(student._id, {
        fullName   : form.fullName,
        fatherName : form.fatherName,
        phone      : form.phone,
        email      : form.email || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        address    : form.address || undefined,
      });
      toast({ title: "Student updated successfully!" });
      onClose(); onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Update failed." });
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Student" subtitle={`Editing: ${student?.fullName || ""}`}>
      <FormRow>
        <FormGroup label="Full Name" required>
          <FormInput value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </FormGroup>
        <FormGroup label="Father's Name" required>
          <FormInput value={form.fatherName} onChange={(e) => set("fatherName", e.target.value)} />
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Phone" required>
          <FormInput value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </FormGroup>
        <FormGroup label="Email">
          <FormInput type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Date of Birth">
          <FormInput type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
        </FormGroup>
        <FormGroup label="Address">
          <FormInput placeholder="Home address" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </FormGroup>
      </FormRow>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-gold flex-1" onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving…" : "Save Changes"}
        </button>
        <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </Modal>
  );
}

function ActionMenu({ student, onEdit, onRequestDelete }: { student: any; onEdit: () => void; onRequestDelete: () => void }) {
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
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-50 text-red-600 text-left"
            onClick={() => { setOpen(false); onRequestDelete(); }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Request Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function MurabbiStudents() {
  const { toast } = useToast();
  const [students, setStudents]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [editStudent, setEditStudent] = useState<any>(null);
  const [awardStudent, setAwardStudent] = useState<any>(null);

  async function handleRequestDelete(student: any) {
    if (!confirm(`Send delete request for "${student.fullName}" to admin for approval?`)) return;
    try {
      await murabbisService.requestDeleteStudent(student._id);
      toast({ title: "Delete request sent to admin for approval." });
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Failed to send request." });
    }
  }

  function load() {
    setLoading(true);
    murabbisService.getMyStudents()
      .then((res) => setStudents(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load students" }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = students.filter(
    (s) => !search || s.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-animate">
      <SectionTitle title="My Students" subtitle="Manage and track progress of students in your circles." />
      <div className="flex gap-4 mb-6 justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nc-muted" />
          <input
            type="text"
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-md text-sm focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <NcCard>
        {loading ? (
          <div className="text-center py-10 text-nc-muted text-sm animate-pulse">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-nc-muted text-sm">No students found.</div>
        ) : (
          <div className="scroll-hover overflow-x-auto max-h-[320px]">
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
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-muted rounded-md text-nc-muted" title="WhatsApp">
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 hover:bg-muted rounded-md text-nc-muted" title="Call Parent">
                          <Phone className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-muted rounded-md text-nc-muted"
                          title="Award Points"
                          onClick={() => setAwardStudent(s)}
                        >
                          <Trophy className="h-4 w-4" />
                        </button>
                        <ActionMenu student={s} onEdit={() => setEditStudent(s)} onRequestDelete={() => handleRequestDelete(s)} />
                      </div>
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

      <AwardPointsModal
        open={!!awardStudent}
        students={students}
        presetStudentId={awardStudent?._id}
        onClose={() => setAwardStudent(null)}
        onSuccess={() => { setAwardStudent(null); load(); }}
      />
    </div>
  );
}
