import { useEffect, useRef, useState } from "react";
import Modal, { FormGroup, FormInput, FormPasswordInput, FormSelect, FormTextarea, FormRow } from "@/components/shared/Modal";
import { adminService, attendanceService, circlesService, incentivesService, murabbisService, neighbourhoodsService, parentsService, studentsService as studentsApi, uploadService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Camera, Loader2 } from "lucide-react";

// ── Reusable image file picker ────────────────────────────────────────────────
function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Image must be under 5 MB." }); return;
    }
    setUploading(true);
    try {
      const res = await uploadService.image(file);
      const url = (res.data as any)?.url || (res.data as any)?.data?.url;
      if (!url) throw new Error("No URL returned");
      onChange(url);
    } catch {
      toast({ variant: "destructive", title: "Image upload failed. Try again." });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-16 h-16 rounded-full border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-teal transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 text-teal animate-spin" />
        ) : value ? (
          <img src={value} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <Camera className="h-5 w-5 text-nc-muted" />
        )}
      </div>
      <div className="flex-1">
        <button
          type="button"
          className="text-xs font-semibold text-teal hover:underline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : value ? "Change Photo" : "Upload Photo"}
        </button>
        <p className="text-[11px] text-nc-muted mt-0.5">JPG or PNG, max 5 MB</p>
        {value && (
          <button
            type="button"
            className="text-[11px] text-red-500 hover:underline mt-0.5"
            onClick={() => onChange("")}
          >
            Remove
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Enroll Student Modal  (murabbiMode = restrict to murabbi's own circles)
// ─────────────────────────────────────────────────────────────────────────────
export function EnrollModal({
  open, onClose, onSuccess, murabbiMode = false,
}: { open: boolean; onClose: () => void; onSuccess?: () => void; murabbiMode?: boolean }) {
  const { toast } = useToast();
  const [loading, setLoading]               = useState(false);
  const [neighbourhoods, setNeighbourhoods] = useState<any[]>([]);
  const [circles, setCircles]               = useState<any[]>([]);
  const [murabbis, setMurabbis]             = useState<any[]>([]);
  const [filteredCircles, setFilteredCircles] = useState<any[]>([]);

  const emptyForm = { fullName: "", fatherName: "", phone: "", email: "", enrollmentDate: "", address: "", murabbiId: "", circleId: "", neighbourhoodId: "" };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setFilteredCircles([]);
    if (murabbiMode) {
      murabbisService.getMyCircles()
        .then((r) => {
          const cData: any[] = r.data.data || [];
          setCircles(cData);
          setFilteredCircles(cData);
          const seen = new Set<string>();
          const nbhs = cData
            .map((c: any) => c.neighbourhood)
            .filter((n: any) => n && !seen.has(n._id) && seen.add(n._id));
          setNeighbourhoods(nbhs);
          if (cData.length === 1) {
            setForm((f) => ({ ...f, circleId: cData[0]._id, neighbourhoodId: cData[0].neighbourhood?._id || "" }));
          }
        })
        .catch(() => toast({ variant: "destructive", title: "Failed to load circles" }));
    } else {
      Promise.all([neighbourhoodsService.getAll(), circlesService.getAll(), adminService.getMurabbis()])
        .then(([nRes, cRes, mRes]) => {
          setNeighbourhoods(nRes.data.data || []);
          setCircles(cRes.data.data || []);
          setMurabbis(mRes.data.data || []);
        })
        .catch(() => toast({ variant: "destructive", title: "Failed to load data" }));
    }
  }, [open]);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  function handleMurabbiChange(murabbiId: string) {
    const mc = circles.filter((c: any) => (c.murabbi?._id || c.murabbi) === murabbiId);
    setFilteredCircles(mc);
    setForm((f) => ({
      ...f,
      murabbiId,
      circleId       : mc.length === 1 ? mc[0]._id : "",
      neighbourhoodId: mc.length === 1 ? (mc[0].neighbourhood?._id || "") : "",
    }));
  }

  function handleCircleChange(circleId: string) {
    const c = (murabbiMode ? circles : filteredCircles.length ? filteredCircles : circles).find((c: any) => c._id === circleId);
    setForm((f) => ({
      ...f,
      circleId,
      neighbourhoodId: c?.neighbourhood?._id || c?.neighbourhood || "",
    }));
  }

  const displayCircles = murabbiMode ? circles : (form.murabbiId ? filteredCircles : circles);

  async function handleSubmit() {
    if (!form.fullName || !form.fatherName || !form.phone || !form.circleId || !form.neighbourhoodId) {
      toast({ variant: "destructive", title: "Please fill all required fields." }); return;
    }
    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName, fatherName: form.fatherName, phone: form.phone,
        email: form.email || undefined, enrollmentDate: form.enrollmentDate || undefined,
        address: form.address || undefined, circleId: form.circleId, neighbourhoodId: form.neighbourhoodId,
      };
      if (murabbiMode) {
        await murabbisService.enrollStudent(payload);
      } else {
        await studentsApi.enroll(payload);
      }
      toast({ title: "Student enrolled successfully!" });
      setForm(emptyForm);
      onClose(); onSuccess?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Failed to enroll student." });
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Enroll New Student" subtitle="Register a child into a Noor Circle">
      <FormRow>
        <FormGroup label="Full Name" required><FormInput placeholder="Child's full name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></FormGroup>
        <FormGroup label="Father's Name" required><FormInput placeholder="Father's full name" value={form.fatherName} onChange={(e) => set("fatherName", e.target.value)} /></FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Phone" required><FormInput placeholder="+92 300 0000000" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></FormGroup>
        <FormGroup label="Enrollment Date"><FormInput type="date" value={form.enrollmentDate} onChange={(e) => set("enrollmentDate", e.target.value)} /></FormGroup>
      </FormRow>
      {!murabbiMode && (
        <FormGroup label="Assign Teacher (Murabbi)">
          <FormSelect value={form.murabbiId} onChange={(e) => handleMurabbiChange(e.target.value)}>
            <option value="">Select teacher…</option>
            {murabbis.map((m) => <option key={m._id} value={m._id}>{m.fullName} ({m.email})</option>)}
          </FormSelect>
        </FormGroup>
      )}
      <FormRow>
        <FormGroup label="Assign Circle" required>
          <FormSelect value={form.circleId} onChange={(e) => handleCircleChange(e.target.value)}>
            <option value="">Select circle…</option>
            {displayCircles.map((c: any) => <option key={c._id} value={c._id}>{c.name} ({c.neighbourhood?.name || "—"})</option>)}
          </FormSelect>
        </FormGroup>
        <FormGroup label="Neighbourhood" required>
          {/* Always the circle's neighbourhood: it follows the circle chosen. */}
          <FormSelect value={form.neighbourhoodId} disabled title="Set by the circle" className="opacity-80">
            <option value="">Chosen with the circle</option>
            {neighbourhoods.map((n) => <option key={n._id} value={n._id}>{n.name}{n.city ? ` — ${n.city}` : ""}</option>)}
          </FormSelect>
        </FormGroup>
      </FormRow>
      <FormGroup label="Email"><FormInput type="email" placeholder="student@example.com (optional)" value={form.email} onChange={(e) => set("email", e.target.value)} /></FormGroup>
      <FormGroup label="Address"><FormTextarea placeholder="Home address (optional)" value={form.address} onChange={(e) => set("address", e.target.value)} /></FormGroup>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-gold flex-1" onClick={handleSubmit} disabled={loading}>{loading ? "Enrolling…" : "Enroll Student"}</button>
        <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Edit Student Modal
// ─────────────────────────────────────────────────────────────────────────────
export function EditStudentModal({
  open, onClose, onSuccess, student,
}: { open: boolean; onClose: () => void; onSuccess?: () => void; student: any }) {
  const { toast } = useToast();
  const [loading, setLoading]             = useState(false);
  const [circles, setCircles]             = useState<any[]>([]);
  const [filteredCircles, setFilteredCircles] = useState<any[]>([]);
  const [nbhs, setNbhs]                   = useState<any[]>([]);
  const [murabbis, setMurabbis]           = useState<any[]>([]);
  const [form, setForm]                   = useState({
    fullName: "", fatherName: "", phone: "", email: "",
    dateOfBirth: "", address: "", murabbiId: "", circleId: "", neighbourhoodId: "",
  });

  useEffect(() => {
    if (!open || !student) return;
    const initialMurabbiId = student.murabbi?._id || student.murabbi || "";
    setForm({
      fullName       : student.fullName || "",
      fatherName     : student.fatherName || "",
      phone          : student.phone || "",
      email          : student.email || "",
      dateOfBirth    : student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split("T")[0] : "",
      address        : student.address || "",
      murabbiId      : initialMurabbiId,
      circleId       : student.circle?._id || student.circle || "",
      neighbourhoodId: student.neighbourhood?._id || student.neighbourhood || "",
    });
    Promise.all([circlesService.getAll(), neighbourhoodsService.getAll(), adminService.getMurabbis()])
      .then(([cRes, nRes, mRes]) => {
        const allCircles: any[] = cRes.data.data || [];
        setCircles(allCircles);
        setNbhs(nRes.data.data || []);
        setMurabbis(mRes.data.data || []);
        if (initialMurabbiId) {
          setFilteredCircles(allCircles.filter((c: any) => (c.murabbi?._id || c.murabbi) === initialMurabbiId));
        }
      })
      .catch(() => toast({ variant: "destructive", title: "Failed to load data" }));
  }, [open, student]);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  function handleMurabbiChange(murabbiId: string) {
    const mc = circles.filter((c: any) => (c.murabbi?._id || c.murabbi) === murabbiId);
    setFilteredCircles(mc);
    setForm((f) => ({
      ...f,
      murabbiId,
      circleId       : mc.length === 1 ? mc[0]._id : "",
      neighbourhoodId: mc.length === 1 ? (mc[0].neighbourhood?._id || "") : "",
    }));
  }

  function handleCircleChange(circleId: string) {
    const pool = form.murabbiId ? filteredCircles : circles;
    const c = pool.find((c: any) => c._id === circleId);
    setForm((f) => ({
      ...f,
      circleId,
      neighbourhoodId: c?.neighbourhood?._id || c?.neighbourhood || "",
    }));
  }

  const displayCircles = form.murabbiId ? filteredCircles : circles;

  async function handleSubmit() {
    if (!form.fullName || !form.fatherName || !form.phone) {
      toast({ variant: "destructive", title: "Full name, father name and phone are required." }); return;
    }
    setLoading(true);
    try {
      await studentsApi.update(student._id, {
        fullName   : form.fullName,
        fatherName : form.fatherName,
        phone      : form.phone,
        email      : form.email || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        address    : form.address || undefined,
      });
      const originalCircleId = student.circle?._id || student.circle || "";
      if (form.circleId && form.circleId !== originalCircleId) {
        await studentsApi.assignCircle(student._id, form.circleId);
      }
      toast({ title: "Student updated successfully!" });
      onClose(); onSuccess?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Update failed." });
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Student" subtitle={`Editing: ${student?.fullName || ""}`}>
      <FormRow>
        <FormGroup label="Full Name" required><FormInput value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></FormGroup>
        <FormGroup label="Father's Name" required><FormInput value={form.fatherName} onChange={(e) => set("fatherName", e.target.value)} /></FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Phone" required><FormInput value={form.phone} onChange={(e) => set("phone", e.target.value)} /></FormGroup>
        <FormGroup label="Email"><FormInput type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Date of Birth"><FormInput type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} /></FormGroup>
        <FormGroup label="Address"><FormInput placeholder="Home address" value={form.address} onChange={(e) => set("address", e.target.value)} /></FormGroup>
      </FormRow>
      <FormGroup label="Assign Teacher (Murabbi)">
        <FormSelect value={form.murabbiId} onChange={(e) => handleMurabbiChange(e.target.value)}>
          <option value="">Select teacher…</option>
          {murabbis.map((m) => <option key={m._id} value={m._id}>{m.fullName} ({m.email})</option>)}
        </FormSelect>
      </FormGroup>
      <FormRow>
        <FormGroup label="Circle">
          <FormSelect value={form.circleId} onChange={(e) => handleCircleChange(e.target.value)}>
            <option value="">Select circle…</option>
            {displayCircles.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </FormSelect>
        </FormGroup>
        <FormGroup label="Neighbourhood">
          {/* Always the circle's neighbourhood: it follows the circle chosen. */}
          <FormSelect value={form.neighbourhoodId} disabled title="Set by the circle" className="opacity-80">
            <option value="">Chosen with the circle</option>
            {nbhs.map((n) => <option key={n._id} value={n._id}>{n.name}</option>)}
          </FormSelect>
        </FormGroup>
      </FormRow>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>{loading ? "Saving…" : "Save Changes"}</button>
        <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  New Circle Modal
// ─────────────────────────────────────────────────────────────────────────────
export function NewCircleModal({
  open, onClose, onSuccess,
}: { open: boolean; onClose: () => void; onSuccess?: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading]               = useState(false);
  const [neighbourhoods, setNeighbourhoods] = useState<any[]>([]);
  const [murabbis, setMurabbis]             = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", neighbourhoodId: "", murabbiId: "", capacity: "30" });

  useEffect(() => {
    if (!open) return;
    Promise.all([neighbourhoodsService.getAll(), adminService.getMurabbis()])
      .then(([nRes, mRes]) => { setNeighbourhoods(nRes.data.data || []); setMurabbis(mRes.data.data || []); })
      .catch(() => toast({ variant: "destructive", title: "Failed to load data" }));
  }, [open]);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit() {
    if (!form.name || !form.neighbourhoodId || !form.murabbiId) {
      toast({ variant: "destructive", title: "Please fill all required fields." }); return;
    }
    setLoading(true);
    try {
      await circlesService.create({ name: form.name, neighbourhoodId: form.neighbourhoodId, murabbiId: form.murabbiId, capacity: Number(form.capacity) || 30 });
      toast({ title: "Circle created successfully!" });
      setForm({ name: "", neighbourhoodId: "", murabbiId: "", capacity: "30" });
      onClose(); onSuccess?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Failed to create circle." });
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create New Circle" subtitle="Set up a new Noor Circle in your neighbourhood">
      <FormRow>
        <FormGroup label="Circle Name" required><FormInput placeholder="e.g. Gulshan Circle 2" value={form.name} onChange={(e) => set("name", e.target.value)} /></FormGroup>
        <FormGroup label="Max Students"><FormInput type="number" min="1" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} /></FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Neighbourhood" required>
          <FormSelect value={form.neighbourhoodId} onChange={(e) => set("neighbourhoodId", e.target.value)}>
            <option value="">Select neighbourhood…</option>
            {neighbourhoods.map((n) => <option key={n._id} value={n._id}>{n.name}{n.city ? ` — ${n.city}` : ""}</option>)}
          </FormSelect>
        </FormGroup>
        <FormGroup label="Assign Murabbi" required>
          <FormSelect value={form.murabbiId} onChange={(e) => set("murabbiId", e.target.value)}>
            <option value="">Select murabbi…</option>
            {murabbis.map((m) => <option key={m._id} value={m._id}>{m.fullName} ({m.email})</option>)}
          </FormSelect>
        </FormGroup>
      </FormRow>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-gold flex-1" onClick={handleSubmit} disabled={loading}>{loading ? "Creating…" : "Create Circle"}</button>
        <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Edit Circle Modal
// ─────────────────────────────────────────────────────────────────────────────
export function EditCircleModal({
  open, onClose, onSuccess, circle,
}: { open: boolean; onClose: () => void; onSuccess?: () => void; circle: any }) {
  const { toast } = useToast();
  const [loading, setLoading]               = useState(false);
  const [neighbourhoods, setNeighbourhoods] = useState<any[]>([]);
  const [murabbis, setMurabbis]             = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", neighbourhoodId: "", murabbiId: "", capacity: "30" });

  useEffect(() => {
    if (!open || !circle) return;
    setForm({
      name: circle.name || "",
      neighbourhoodId: circle.neighbourhood?._id || circle.neighbourhood || "",
      murabbiId: circle.murabbi?._id || circle.murabbi || "",
      capacity: String(circle.capacity || 30),
    });
    Promise.all([neighbourhoodsService.getAll(), adminService.getMurabbis()])
      .then(([nRes, mRes]) => { setNeighbourhoods(nRes.data.data || []); setMurabbis(mRes.data.data || []); })
      .catch(() => toast({ variant: "destructive", title: "Failed to load data" }));
  }, [open, circle]);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit() {
    if (!form.name) { toast({ variant: "destructive", title: "Circle name is required." }); return; }
    setLoading(true);
    try {
      await circlesService.update(circle._id, {
        name: form.name,
        ...(form.neighbourhoodId && { neighbourhoodId: form.neighbourhoodId }),
        ...(form.murabbiId && { murabbiId: form.murabbiId }),
        capacity: Number(form.capacity) || 30,
      });
      toast({ title: "Circle updated!" });
      onClose(); onSuccess?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Update failed." });
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Circle" subtitle={`Editing: ${circle?.name || ""}`}>
      <FormRow>
        <FormGroup label="Circle Name" required><FormInput value={form.name} onChange={(e) => set("name", e.target.value)} /></FormGroup>
        <FormGroup label="Max Students"><FormInput type="number" min="1" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} /></FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Neighbourhood">
          <FormSelect value={form.neighbourhoodId} onChange={(e) => set("neighbourhoodId", e.target.value)}>
            <option value="">Select neighbourhood…</option>
            {neighbourhoods.map((n) => <option key={n._id} value={n._id}>{n.name}{n.city ? ` — ${n.city}` : ""}</option>)}
          </FormSelect>
        </FormGroup>
        <FormGroup label="Assign Murabbi">
          <FormSelect value={form.murabbiId} onChange={(e) => set("murabbiId", e.target.value)}>
            <option value="">Select murabbi…</option>
            {murabbis.map((m) => <option key={m._id} value={m._id}>{m.fullName}</option>)}
          </FormSelect>
        </FormGroup>
      </FormRow>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>{loading ? "Saving…" : "Save Changes"}</button>
        <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Add Murabbi Modal
// ─────────────────────────────────────────────────────────────────────────────
export function AddMurabbiModal({
  open, onClose, onSuccess,
}: { open: boolean; onClose: () => void; onSuccess?: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const EMPTY = { fullName: "", email: "", password: "", phone: "", address: "", image: "" };
  const [form, setForm] = useState(EMPTY);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit() {
    if (!form.fullName || !form.email || !form.password) {
      toast({ variant: "destructive", title: "Please fill all required fields." }); return;
    }
    setLoading(true);
    try {
      await adminService.createMurabbi({
        fullName: form.fullName,
        email   : form.email,
        password: form.password,
        ...(form.phone   && { phone:   form.phone }),
        ...(form.address && { address: form.address }),
        ...(form.image   && { image:   form.image }),
      });
      toast({ title: "Murabbi account created successfully!" });
      setForm(EMPTY);
      onClose(); onSuccess?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Failed to create murabbi." });
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add New Murabbi" subtitle="Create a Murabbi account — they can log in immediately">
      <FormRow>
        <FormGroup label="Full Name" required><FormInput placeholder="Full name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></FormGroup>
        <FormGroup label="Phone"><FormInput placeholder="+92 300 0000000" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></FormGroup>
      </FormRow>
      <FormGroup label="Email" required><FormInput type="email" placeholder="murabbi@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} /></FormGroup>
      <FormGroup label="Password" required><FormPasswordInput placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password} onChange={(e) => set("password", e.target.value)} /></FormGroup>
      <p className="text-[11px] text-nc-muted -mt-1">Password must be at least 8 characters with one uppercase letter and one number.</p>
      <FormGroup label="Address"><FormInput placeholder="Street, City" value={form.address} onChange={(e) => set("address", e.target.value)} /></FormGroup>
      <FormGroup label="Profile Photo"><ImageUpload value={form.image} onChange={(url) => set("image", url)} /></FormGroup>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>{loading ? "Creating…" : "Create Murabbi"}</button>
        <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Edit Murabbi Modal
// ─────────────────────────────────────────────────────────────────────────────
export function EditMurabbiModal({
  open, onClose, onSuccess, murabbi,
}: { open: boolean; onClose: () => void; onSuccess?: () => void; murabbi: any }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", address: "", image: "" });

  useEffect(() => {
    if (open && murabbi) {
      setForm({
        fullName: murabbi.fullName || "",
        phone   : murabbi.phone   || "",
        address : murabbi.address || "",
        image   : murabbi.image   || "",
      });
    }
  }, [open, murabbi]);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit() {
    if (!form.fullName.trim()) { toast({ variant: "destructive", title: "Full name is required." }); return; }
    setLoading(true);
    try {
      await adminService.updateMurabbi(murabbi._id, {
        fullName: form.fullName.trim(),
        phone   : form.phone,
        address : form.address,
        image   : form.image,
      });
      toast({ title: "Murabbi updated!" });
      onClose(); onSuccess?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Update failed." });
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Murabbi" subtitle={`Editing: ${murabbi?.fullName || ""}`}>
      <FormRow>
        <FormGroup label="Full Name" required><FormInput value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></FormGroup>
        <FormGroup label="Phone"><FormInput placeholder="+92 300 0000000" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></FormGroup>
      </FormRow>
      <FormGroup label="Email"><FormInput value={murabbi?.email || ""} readOnly className="text-nc-muted cursor-not-allowed" /></FormGroup>
      <FormGroup label="Address"><FormInput placeholder="Street, City" value={form.address} onChange={(e) => set("address", e.target.value)} /></FormGroup>
      <FormGroup label="Profile Photo"><ImageUpload value={form.image} onChange={(url) => set("image", url)} /></FormGroup>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>{loading ? "Saving…" : "Save Changes"}</button>
        <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Add Neighbourhood Modal
// ─────────────────────────────────────────────────────────────────────────────
export function AddNeighbourhoodModal({
  open, onClose, onSuccess,
}: { open: boolean; onClose: () => void; onSuccess?: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({ name: "", city: "" });

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit() {
    if (!form.name.trim()) { toast({ variant: "destructive", title: "Neighbourhood name is required." }); return; }
    setLoading(true);
    try {
      await neighbourhoodsService.create({ name: form.name.trim(), city: form.city.trim() || undefined });
      toast({ title: "Neighbourhood added successfully!" });
      setForm({ name: "", city: "" });
      onClose(); onSuccess?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Failed to add neighbourhood." });
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Neighbourhood" subtitle="Define a new area for Noor Circles">
      <FormGroup label="Neighbourhood Name" required><FormInput placeholder="e.g. Gulshan-e-Iqbal" value={form.name} onChange={(e) => set("name", e.target.value)} /></FormGroup>
      <FormGroup label="City"><FormInput placeholder="e.g. Karachi (optional)" value={form.city} onChange={(e) => set("city", e.target.value)} /></FormGroup>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-gold flex-1" onClick={handleSubmit} disabled={loading}>{loading ? "Adding…" : "Add Neighbourhood"}</button>
        <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Edit Neighbourhood Modal
// ─────────────────────────────────────────────────────────────────────────────
export function EditNeighbourhoodModal({
  open, onClose, onSuccess, neighbourhood,
}: { open: boolean; onClose: () => void; onSuccess?: () => void; neighbourhood: any }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({ name: "", city: "" });

  useEffect(() => {
    if (open && neighbourhood) setForm({ name: neighbourhood.name || "", city: neighbourhood.city || "" });
  }, [open, neighbourhood]);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit() {
    if (!form.name.trim()) { toast({ variant: "destructive", title: "Name is required." }); return; }
    setLoading(true);
    try {
      await neighbourhoodsService.update(neighbourhood._id, { name: form.name.trim(), city: form.city.trim() || undefined });
      toast({ title: "Neighbourhood updated!" });
      onClose(); onSuccess?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Update failed." });
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Neighbourhood" subtitle={`Editing: ${neighbourhood?.name || ""}`}>
      <FormGroup label="Name" required><FormInput value={form.name} onChange={(e) => set("name", e.target.value)} /></FormGroup>
      <FormGroup label="City"><FormInput placeholder="e.g. Karachi" value={form.city} onChange={(e) => set("city", e.target.value)} /></FormGroup>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>{loading ? "Saving…" : "Save Changes"}</button>
        <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Admin Attendance Modal  (admin marks attendance for any circle)
// ─────────────────────────────────────────────────────────────────────────────
type AttStatus = "present" | "absent" | "excused";

export function AdminAttendanceModal({
  open, onClose, onSuccess,
}: { open: boolean; onClose: () => void; onSuccess?: () => void }) {
  const { toast }                           = useToast();
  const [circles, setCircles]               = useState<any[]>([]);
  const [students, setStudents]             = useState<any[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<any>(null);
  const [records, setRecords]               = useState<Record<string, AttStatus>>({});
  const [topic, setTopic]                   = useState("");
  const [sessionNumber, setSessionNumber]   = useState(1);
  const [submitting, setSubmitting]         = useState(false);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([circlesService.getAll(), studentsApi.getAll()])
      .then(([cRes, sRes]) => {
        const c = cRes.data.data || [];
        setCircles(c);
        setStudents(sRes.data.data || []);
        if (c.length > 0) setSelectedCircle(c[0]);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const circleStudents = students.filter((s) =>
    selectedCircle && (s.circle?._id === selectedCircle._id || s.circle === selectedCircle._id)
  );

  const getStatus = (id: string): AttStatus => records[id] || "present";
  const toggle = (id: string) => setRecords((prev) => ({ ...prev, [id]: prev[id] === "present" ? "absent" : "present" }));
  const presentCount = circleStudents.filter((s) => getStatus(s._id) === "present").length;

  async function handleSubmit() {
    if (!selectedCircle) return;
    setSubmitting(true);
    try {
      await attendanceService.submit({
        circle: selectedCircle._id,
        sessionNumber,
        sessionDate: new Date().toISOString().split("T")[0],
        topic: topic || "General Session",
        records: circleStudents.map((s) => ({ student: s._id, status: getStatus(s._id), note: "" })),
      });
      toast({ title: "Attendance submitted!", description: `Session #${sessionNumber} recorded for ${selectedCircle.name}.` });
      setSessionNumber((n) => n + 1);
      setRecords({});
      onClose(); onSuccess?.();
    } catch {
      toast({ variant: "destructive", title: "Failed to submit attendance" });
    } finally { setSubmitting(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Mark Attendance" subtitle="Submit attendance for any circle">
      {loading ? (
        <div className="text-center py-8 text-nc-muted text-sm animate-pulse">Loading circles...</div>
      ) : (
        <>
          <div className="flex gap-3 mb-4">
            <FormSelect
              className="flex-1"
              value={selectedCircle?._id || ""}
              onChange={(e) => setSelectedCircle(circles.find((c) => c._id === e.target.value))}
            >
              {circles.map((c) => <option key={c._id} value={c._id}>{c.name} — {c.murabbi?.fullName || "—"}</option>)}
            </FormSelect>
            <FormInput
              type="number" min={1} value={sessionNumber}
              onChange={(e) => setSessionNumber(Number(e.target.value))}
              className="w-28"
              placeholder="Session #"
            />
            <FormInput
              value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic (optional)" className="flex-1"
            />
          </div>

          <div className="flex gap-2 mb-3">
            <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-700 rounded-full">{presentCount} Present</span>
            <span className="text-xs font-semibold px-2.5 py-1 bg-red-100 text-red-700 rounded-full">{circleStudents.length - presentCount} Absent</span>
          </div>

          {circleStudents.length === 0 ? (
            <div className="text-center py-6 text-nc-muted text-sm">No students in this circle.</div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {circleStudents.map((s) => (
                <div
                  key={s._id}
                  onClick={() => toggle(s._id)}
                  className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-all ${getStatus(s._id) === "present" ? "bg-green-50/40 border-green-200" : "bg-red-50/40 border-red-200"}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getStatus(s._id) === "present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {s.fullName?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{s.fullName}</span>
                  </div>
                  {getStatus(s._id) === "present"
                    ? <div className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold"><Check className="h-3 w-3" /> Present</div>
                    : <div className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold"><X className="h-3 w-3" /> Absent</div>
                  }
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2.5 mt-4">
            <button className="btn-primary flex-1" onClick={handleSubmit} disabled={submitting || circleStudents.length === 0}>
              {submitting ? "Submitting…" : "Submit Attendance"}
            </button>
            <button className="btn-outline" onClick={onClose} disabled={submitting}>Cancel</button>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Register Parent Modal
// ─────────────────────────────────────────────────────────────────────────────
export function RegisterParentModal({
  open, onClose, onSuccess,
}: { open: boolean; onClose: () => void; onSuccess?: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading]         = useState(false);
  const [students, setStudents]       = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", whatsappNumber: "", notes: "" });

  useEffect(() => {
    if (!open) return;
    setForm({ fullName: "", phone: "", email: "", whatsappNumber: "", notes: "" });
    setSelectedIds([]);
    setStudentSearch("");
    studentsApi.getAll()
      .then((r) => setStudents(r.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load students" }));
  }, [open]);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  function toggleStudent(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    if (!form.fullName || !form.phone || selectedIds.length === 0) {
      toast({ variant: "destructive", title: "Full name, phone, and at least one student are required." }); return;
    }
    setLoading(true);
    try {
      await parentsService.register({
        fullName      : form.fullName,
        phone         : form.phone,
        email         : form.email || undefined,
        whatsappNumber: form.whatsappNumber || undefined,
        studentIds    : selectedIds,
        notes         : form.notes || undefined,
      });
      toast({ title: "Parent registered successfully!" });
      onClose(); onSuccess?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Failed to register parent." });
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Register Parent" subtitle="Link a parent to their child's account">
      <FormRow>
        <FormGroup label="Parent Full Name" required><FormInput placeholder="Parent's full name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></FormGroup>
        <FormGroup label="Phone" required><FormInput placeholder="+92 300 0000000" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Email"><FormInput type="email" placeholder="parent@example.com (optional)" value={form.email} onChange={(e) => set("email", e.target.value)} /></FormGroup>
        <FormGroup label="WhatsApp Number"><FormInput placeholder="+92 300 0000000 (optional)" value={form.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} /></FormGroup>
      </FormRow>
      <FormGroup label={`Children (Students)${selectedIds.length > 0 ? ` — ${selectedIds.length} selected` : ""}`} required>
        <FormInput
          placeholder="Search students…"
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          className="mb-1.5"
        />
        <div className="border border-border rounded-md max-h-44 overflow-y-auto divide-y divide-border">
          {students.length === 0 ? (
            <div className="text-center py-4 text-nc-muted text-sm">Loading students…</div>
          ) : students.filter((s) => s.fullName?.toLowerCase().includes(studentSearch.toLowerCase())).length === 0 ? (
            <div className="text-center py-4 text-nc-muted text-sm">No students match "{studentSearch}"</div>
          ) : students.filter((s) => s.fullName?.toLowerCase().includes(studentSearch.toLowerCase())).map((s) => {
            const checked = selectedIds.includes(s._id);
            return (
              <label
                key={s._id}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${checked ? "bg-gold/10" : "hover:bg-muted"}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleStudent(s._id)}
                  className="accent-gold w-4 h-4 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{s.fullName}</div>
                  <div className="text-xs text-nc-muted">{s.circle?.name || "No circle"}</div>
                </div>
              </label>
            );
          })}
        </div>
      </FormGroup>
      <FormGroup label="Notes"><FormTextarea placeholder="Any notes about this parent (optional)" value={form.notes} onChange={(e) => set("notes", e.target.value)} /></FormGroup>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-gold flex-1" onClick={handleSubmit} disabled={loading}>{loading ? "Registering…" : "Register Parent"}</button>
        <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Add Parent Feedback Modal
// ─────────────────────────────────────────────────────────────────────────────
export function AddParentFeedbackModal({
  open, onClose, onSuccess, parentId, parentName,
}: { open: boolean; onClose: () => void; onSuccess?: () => void; parentId: string; parentName?: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ message: "", stars: "5", sessionNumber: "1" });

  useEffect(() => {
    if (open) setForm({ message: "", stars: "5", sessionNumber: "1" });
  }, [open]);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit() {
    if (!form.message.trim()) {
      toast({ variant: "destructive", title: "Please enter a feedback message." }); return;
    }
    setLoading(true);
    try {
      await parentsService.addFeedback(parentId, {
        message      : form.message.trim(),
        stars        : Number(form.stars),
        sessionNumber: Number(form.sessionNumber),
      });
      toast({ title: "Feedback added successfully!" });
      onClose(); onSuccess?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Failed to add feedback." });
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Parent Feedback" subtitle={parentName ? `Feedback from: ${parentName}` : "Record parent feedback"}>
      <FormGroup label="Feedback Message" required>
        <FormTextarea placeholder="What did the parent share about their child's progress?" value={form.message} onChange={(e) => set("message", e.target.value)} />
      </FormGroup>
      <FormRow>
        <FormGroup label="Rating (Stars)">
          <FormSelect value={form.stars} onChange={(e) => set("stars", e.target.value)}>
            <option value="5">★★★★★ — 5 Stars</option>
            <option value="4">★★★★☆ — 4 Stars</option>
            <option value="3">★★★☆☆ — 3 Stars</option>
            <option value="2">★★☆☆☆ — 2 Stars</option>
            <option value="1">★☆☆☆☆ — 1 Star</option>
          </FormSelect>
        </FormGroup>
        <FormGroup label="Session Number">
          <FormInput type="number" min="1" value={form.sessionNumber} onChange={(e) => set("sessionNumber", e.target.value)} placeholder="e.g. 15" />
        </FormGroup>
      </FormRow>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-gold flex-1" onClick={handleSubmit} disabled={loading}>{loading ? "Saving…" : "Save Feedback"}</button>
        <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Award Points Modal
// ─────────────────────────────────────────────────────────────────────────────
const AWARD_OPTIONS = [
  { value: "noor-star",        label: "Noor Star — 50 pts",         desc: "Exemplary character, courage, or service" },
  { value: "circle-champion",  label: "Circle Champion — 100 pts",  desc: "100% attendance for one full month" },
  { value: "sadaqah-hero",     label: "Sadaqah Hero — 75 pts",      desc: "Community service beyond requirements" },
  { value: "knowledge-seeker", label: "Knowledge Seeker — 25 pts",  desc: "Exceptional curiosity and love of learning" },
  { value: "kindness-award",   label: "Kindness Award — 30 pts",    desc: "Outstanding kindness to peers or family" },
  { value: "courage-award",    label: "Courage Award — 40 pts",     desc: "Displayed courage in standing for truth" },
];

export function AwardPointsModal({
  open, onClose, onSuccess, students: providedStudents, presetStudentId,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /**
   * Pass this when opening from a murabbi context. Without it, the modal
   * falls back to fetching /admin/students, which is admin-only — a
   * murabbi opening the modal would get a silent 403 on every load.
   */
  students?: any[];
  /** Pre-select a specific student, e.g. when opened from that student's row. */
  presetStudentId?: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading]   = useState(false);
  const [students, setStudents] = useState<any[]>(providedStudents || []);
  const [form, setForm]         = useState({ studentId: "", awardType: "", note: "" });

  useEffect(() => {
    if (!open) return;
    setForm({ studentId: presetStudentId || "", awardType: "", note: "" });
    if (providedStudents) {
      setStudents(providedStudents);
      return;
    }
    studentsApi.getAll()
      .then((r) => setStudents(r.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load students" }));
  }, [open, presetStudentId, providedStudents]);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit() {
    if (!form.studentId || !form.awardType) {
      toast({ variant: "destructive", title: "Please select a student and award type." }); return;
    }
    setLoading(true);
    try {
      await incentivesService.award({ studentId: form.studentId, awardType: form.awardType, note: form.note || undefined });
      toast({ title: "Points awarded successfully!" });
      onClose(); onSuccess?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Failed to award points." });
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Award Noor Points" subtitle="Recognise character, service, or consistency">
      <FormGroup label="Student" required>
        <FormSelect value={form.studentId} onChange={(e) => set("studentId", e.target.value)} disabled={!!presetStudentId}>
          <option value="">Select student…</option>
          {students.map((s) => <option key={s._id} value={s._id}>{s.fullName} — {s.circle?.name || "No circle"}</option>)}
        </FormSelect>
      </FormGroup>
      <FormGroup label="Award Type" required>
        <FormSelect value={form.awardType} onChange={(e) => set("awardType", e.target.value)}>
          <option value="">Select award…</option>
          {AWARD_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </FormSelect>
        {form.awardType && (
          <p className="text-[11px] text-nc-muted mt-1">
            {AWARD_OPTIONS.find((a) => a.value === form.awardType)?.desc}
          </p>
        )}
      </FormGroup>
      <FormGroup label="Reason (optional)">
        <FormTextarea placeholder="Describe the specific act that earned this award…" value={form.note} onChange={(e) => set("note", e.target.value)} />
      </FormGroup>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-gold flex-1" onClick={handleSubmit} disabled={loading}>{loading ? "Awarding…" : "Award Points"}</button>
        <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </Modal>
  );
}
