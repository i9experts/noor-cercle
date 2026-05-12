import { useEffect, useState } from "react";
import Modal, { FormGroup, FormInput, FormSelect, FormTextarea, FormRow } from "@/components/shared/Modal";
import { adminService, circlesService, neighbourhoodsService, studentsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

// ─────────────────────────────────────────────────────────────────────────────
//  Enroll Student Modal
// ─────────────────────────────────────────────────────────────────────────────
export function EnrollModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading]               = useState(false);
  const [neighbourhoods, setNeighbourhoods] = useState<any[]>([]);
  const [circles, setCircles]               = useState<any[]>([]);

  const [form, setForm] = useState({
    fullName       : "",
    fatherName     : "",
    phone          : "",
    email          : "",
    dateOfBirth    : "",
    address        : "",
    circleId       : "",
    neighbourhoodId: "",
  });

  useEffect(() => {
    if (!open) return;
    Promise.all([neighbourhoodsService.getAll(), circlesService.getAll()])
      .then(([nRes, cRes]) => {
        setNeighbourhoods(nRes.data.data || []);
        setCircles(cRes.data.data || []);
      })
      .catch(() =>
        toast({ variant: "destructive", title: "Failed to load neighbourhoods / circles" }),
      );
  }, [open]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.fullName || !form.fatherName || !form.phone || !form.circleId || !form.neighbourhoodId) {
      toast({ variant: "destructive", title: "Please fill all required fields." });
      return;
    }
    setLoading(true);
    try {
      await studentsService.enroll({
        fullName       : form.fullName,
        fatherName     : form.fatherName,
        phone          : form.phone,
        email          : form.email || undefined,
        dateOfBirth    : form.dateOfBirth || undefined,
        address        : form.address || undefined,
        circleId       : form.circleId,
        neighbourhoodId: form.neighbourhoodId,
      });
      toast({ title: "Student enrolled successfully!" });
      setForm({ fullName: "", fatherName: "", phone: "", email: "", dateOfBirth: "", address: "", circleId: "", neighbourhoodId: "" });
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to enroll student.";
      toast({ variant: "destructive", title: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Enroll New Student" subtitle="Register a child into a Noor Circle">
      <FormRow>
        <FormGroup label="Full Name" required>
          <FormInput placeholder="Child's full name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </FormGroup>
        <FormGroup label="Father's Name" required>
          <FormInput placeholder="Father's full name" value={form.fatherName} onChange={(e) => set("fatherName", e.target.value)} />
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Phone" required>
          <FormInput placeholder="+92 300 0000000" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </FormGroup>
        <FormGroup label="Date of Birth">
          <FormInput type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Neighbourhood" required>
          <FormSelect value={form.neighbourhoodId} onChange={(e) => set("neighbourhoodId", e.target.value)}>
            <option value="">Select neighbourhood…</option>
            {neighbourhoods.map((n) => (
              <option key={n._id} value={n._id}>{n.name}{n.city ? ` — ${n.city}` : ""}</option>
            ))}
          </FormSelect>
        </FormGroup>
        <FormGroup label="Assign Circle" required>
          <FormSelect value={form.circleId} onChange={(e) => set("circleId", e.target.value)}>
            <option value="">Select circle…</option>
            {circles.map((c) => (
              <option key={c._id} value={c._id}>{c.name} ({c.neighbourhood?.name || "—"})</option>
            ))}
          </FormSelect>
        </FormGroup>
      </FormRow>
      <FormGroup label="Email">
        <FormInput type="email" placeholder="student@example.com (optional)" value={form.email} onChange={(e) => set("email", e.target.value)} />
      </FormGroup>
      <FormGroup label="Address">
        <FormTextarea placeholder="Home address (optional)" value={form.address} onChange={(e) => set("address", e.target.value)} />
      </FormGroup>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-gold flex-1" onClick={handleSubmit} disabled={loading}>
          {loading ? "Enrolling…" : "Enroll Student"}
        </button>
        <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  New Circle Modal
// ─────────────────────────────────────────────────────────────────────────────
export function NewCircleModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading]               = useState(false);
  const [neighbourhoods, setNeighbourhoods] = useState<any[]>([]);
  const [murabbis, setMurabbis]             = useState<any[]>([]);

  const [form, setForm] = useState({
    name           : "",
    neighbourhoodId: "",
    murabbiId      : "",
    capacity       : "30",
  });

  useEffect(() => {
    if (!open) return;
    Promise.all([neighbourhoodsService.getAll(), adminService.getMurabbis()])
      .then(([nRes, mRes]) => {
        setNeighbourhoods(nRes.data.data || []);
        setMurabbis(mRes.data.data || []);
      })
      .catch(() =>
        toast({ variant: "destructive", title: "Failed to load neighbourhoods / murabbis" }),
      );
  }, [open]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.name || !form.neighbourhoodId || !form.murabbiId) {
      toast({ variant: "destructive", title: "Please fill all required fields." });
      return;
    }
    setLoading(true);
    try {
      await circlesService.create({
        name           : form.name,
        neighbourhoodId: form.neighbourhoodId,
        murabbiId      : form.murabbiId,
        capacity       : Number(form.capacity) || 30,
      });
      toast({ title: "Circle created successfully!" });
      setForm({ name: "", neighbourhoodId: "", murabbiId: "", capacity: "30" });
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to create circle.";
      toast({ variant: "destructive", title: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create New Circle" subtitle="Set up a new Noor Circle in your neighbourhood">
      <FormRow>
        <FormGroup label="Circle Name" required>
          <FormInput placeholder="e.g. Gulshan Circle 2" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </FormGroup>
        <FormGroup label="Max Students">
          <FormInput type="number" min="1" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} />
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Neighbourhood" required>
          <FormSelect value={form.neighbourhoodId} onChange={(e) => set("neighbourhoodId", e.target.value)}>
            <option value="">Select neighbourhood…</option>
            {neighbourhoods.map((n) => (
              <option key={n._id} value={n._id}>{n.name}{n.city ? ` — ${n.city}` : ""}</option>
            ))}
          </FormSelect>
        </FormGroup>
        <FormGroup label="Assign Murabbi" required>
          <FormSelect value={form.murabbiId} onChange={(e) => set("murabbiId", e.target.value)}>
            <option value="">Select murabbi…</option>
            {murabbis.map((m) => (
              <option key={m._id} value={m._id}>{m.fullName} ({m.email})</option>
            ))}
          </FormSelect>
        </FormGroup>
      </FormRow>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-gold flex-1" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating…" : "Create Circle"}
        </button>
        <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Add Murabbi Modal
// ─────────────────────────────────────────────────────────────────────────────
export function AddMurabbiModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ fullName: "", email: "", password: "" });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.fullName || !form.email || !form.password) {
      toast({ variant: "destructive", title: "Please fill all required fields." });
      return;
    }
    setLoading(true);
    try {
      await adminService.createMurabbi({
        fullName: form.fullName,
        email   : form.email,
        password: form.password,
      });
      toast({ title: "Murabbi account created successfully!" });
      setForm({ fullName: "", email: "", password: "" });
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to create murabbi.";
      toast({ variant: "destructive", title: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add New Murabbi" subtitle="Create a Murabbi account — they can log in immediately">
      <FormGroup label="Full Name" required>
        <FormInput placeholder="Full name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
      </FormGroup>
      <FormGroup label="Email" required>
        <FormInput type="email" placeholder="murabbi@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
      </FormGroup>
      <FormGroup label="Password" required>
        <FormInput type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password} onChange={(e) => set("password", e.target.value)} />
      </FormGroup>
      <p className="text-[11px] text-nc-muted -mt-1">Password must be at least 8 characters with one uppercase letter and one number.</p>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating…" : "Create Murabbi"}
        </button>
        <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Add Neighbourhood Modal
// ─────────────────────────────────────────────────────────────────────────────
export function AddNeighbourhoodModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({ name: "", city: "" });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast({ variant: "destructive", title: "Neighbourhood name is required." });
      return;
    }
    setLoading(true);
    try {
      await neighbourhoodsService.create({ name: form.name.trim(), city: form.city.trim() || undefined });
      toast({ title: "Neighbourhood added successfully!" });
      setForm({ name: "", city: "" });
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to add neighbourhood.";
      toast({ variant: "destructive", title: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Neighbourhood" subtitle="Define a new area for Noor Circles">
      <FormGroup label="Neighbourhood Name" required>
        <FormInput placeholder="e.g. Gulshan-e-Iqbal" value={form.name} onChange={(e) => set("name", e.target.value)} />
      </FormGroup>
      <FormGroup label="City">
        <FormInput placeholder="e.g. Karachi (optional)" value={form.city} onChange={(e) => set("city", e.target.value)} />
      </FormGroup>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-gold flex-1" onClick={handleSubmit} disabled={loading}>
          {loading ? "Adding…" : "Add Neighbourhood"}
        </button>
        <button className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Award Points Modal (UI only — backend not yet implemented)
// ─────────────────────────────────────────────────────────────────────────────
export function AwardPointsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Award Noor Points" subtitle="Recognise character, service, or consistency">
      <FormGroup label="Award Type" required>
        <FormSelect>
          <option>Noor Star (50 pts) — Exemplary character</option>
          <option>Circle Champion (100 pts) — 100% attendance</option>
          <option>Sadaqah Hero (75 pts) — Community service</option>
          <option>Knowledge Seeker (25 pts) — Outstanding question</option>
          <option>Kindness Award (30 pts) — Act of generosity</option>
          <option>Courage Award (40 pts) — Moral courage shown</option>
        </FormSelect>
      </FormGroup>
      <FormGroup label="Reason (shown to student)" required>
        <FormTextarea placeholder="Describe the specific act that earned this award…" />
      </FormGroup>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-gold flex-1">Award Points</button>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
