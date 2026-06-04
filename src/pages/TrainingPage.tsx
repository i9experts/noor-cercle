import { useEffect, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import Modal, { FormGroup, FormInput, FormSelect, FormRow } from "@/components/shared/Modal";
import { trainingService, adminService, lessonsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, UserPlus, X, BookOpen, Plus, Trash2, Tag, ListChecks, Clock as ClockIcon } from "lucide-react";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

function getApiError(e: unknown) {
  const m = (e as any)?.response?.data?.message;
  return typeof m === "string" && m ? m : null;
}

const LESSON_STATUS_OPTIONS = ["Available", "Upcoming", "Draft"] as const;

const EMPTY_LESSON = {
  title: "", description: "", module: "", level: "", duration: "",
  status: "Available", pdfUrl: "", videoUrl: "", order: 0,
  sessionNumber: "", objectives: "", keyTopics: "",
};

// ── Lesson Form Modal ─────────────────────────────────────────────────────────
function LessonFormModal({ lesson, onClose, onSaved }: {
  lesson: any; onClose: () => void; onSaved: (l: any) => void;
}) {
  const { toast } = useToast();
  const isEdit = !!lesson._id;
  const [form, setForm] = useState({
    title        : lesson.title         || "",
    description  : lesson.description   || "",
    module       : lesson.module        || "",
    level        : lesson.level         || "",
    duration     : lesson.duration      || "",
    status       : lesson.status        || "Available",
    pdfUrl       : lesson.pdfUrl        || "",
    videoUrl     : lesson.videoUrl      || "",
    order        : lesson.order         ?? 0,
    sessionNumber: lesson.sessionNumber ?? "",
    objectives   : (lesson.objectives   || []).join("\n"),
    keyTopics    : (lesson.keyTopics    || []).join("\n"),
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Title is required" }); return; }
    setSaving(true);
    const payload = {
      ...form,
      order        : Number(form.order) || 0,
      sessionNumber: form.sessionNumber !== "" ? Number(form.sessionNumber) : null,
      objectives   : form.objectives.split("\n").map((s: string) => s.trim()).filter(Boolean),
      keyTopics    : form.keyTopics.split("\n").map((s: string) => s.trim()).filter(Boolean),
      pdfUrl       : form.pdfUrl.trim()   || null,
      videoUrl     : form.videoUrl.trim() || null,
    };
    try {
      const res = isEdit
        ? await lessonsService.update(lesson._id, payload)
        : await lessonsService.create(payload);
      toast({ title: isEdit ? "Lesson updated!" : "Lesson created!" });
      onSaved(res.data?.data || res.data);
    } catch (e) {
      toast({ variant: "destructive", title: "Save failed", description: getApiError(e) || "Try again." });
    } finally { setSaving(false); }
  };

  const inp = "w-full px-3 py-2 border border-border rounded-md text-sm bg-card focus:border-teal outline-none";
  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit Lesson" : "New Lesson Plan"} subtitle="Fill in the details for this lesson plan">
      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Title *</label>
            <input className={inp} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Understanding Muslim Identity" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Order #</label>
            <input type="number" min={0} className={inp} value={form.order} onChange={(e) => set("order", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Module / Theme</label>
            <input className={inp} value={form.module} onChange={(e) => set("module", e.target.value)} placeholder="e.g. Identity" /></div>
          <div><label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Level</label>
            <input className={inp} value={form.level} onChange={(e) => set("level", e.target.value)} placeholder="e.g. Beginner" /></div>
          <div><label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Duration</label>
            <input className={inp} value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="e.g. 45 mins" /></div>
          <div><label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Session #</label>
            <input type="number" min={1} className={inp} value={form.sessionNumber} onChange={(e) => set("sessionNumber", e.target.value)} placeholder="Optional" /></div>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Status</label>
          <select className={inp} value={form.status} onChange={(e) => set("status", e.target.value)}>
            {LESSON_STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Description</label>
          <textarea rows={3} className={inp} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief overview…" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Learning Objectives <span className="normal-case text-nc-muted/60">(one per line)</span></label>
            <textarea rows={4} className={inp} value={form.objectives} onChange={(e) => set("objectives", e.target.value)} placeholder={"Understand fitrah\nExplore Muslim identity"} /></div>
          <div><label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Key Topics <span className="normal-case text-nc-muted/60">(one per line)</span></label>
            <textarea rows={4} className={inp} value={form.keyTopics} onChange={(e) => set("keyTopics", e.target.value)} placeholder={"Fitrah\nTawheed\nPurpose"} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">PDF URL</label>
            <input className={inp} value={form.pdfUrl} onChange={(e) => set("pdfUrl", e.target.value)} placeholder="https://…" /></div>
          <div><label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Video URL</label>
            <input className={inp} value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://…" /></div>
        </div>
      </div>
      <div className="flex gap-3 mt-5 pt-4 border-t border-border">
        <button onClick={onClose} className="flex-1 btn-outline">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary">
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Lesson"}
        </button>
      </div>
    </Modal>
  );
}

const MODULE_STATUS_COLOR: Record<string, "green" | "amber" | "slate"> = {
  Available: "green",
  Upcoming : "amber",
  Locked   : "slate",
};

function ModuleCard({ m, i }: { m: any; i: number }) {
  return (
    <div className="border border-border rounded-xl p-4 bg-card hover:border-teal/30 transition-colors">
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center text-background text-[13px] font-bold flex-shrink-0">
            {m.order || i + 1}
          </div>
          <div>
            <div className="font-semibold text-[13.5px]">{m.title}</div>
            <div className="text-[11.5px] text-nc-muted mt-0.5">
              {[m.timeSlot, m.durationMinutes && `${m.durationMinutes} min`].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
        </div>
        <NcBadge variant={MODULE_STATUS_COLOR[m.status] || "slate"}>{m.status}</NcBadge>
      </div>
      {m.description && (
        <p className="text-[12.5px] text-nc-muted leading-relaxed pl-12">{m.description}</p>
      )}
    </div>
  );
}

// ── Create / Edit Batch Modal ──────────────────────────────────────────────────
function BatchModal({ open, onClose, onSuccess, batch }: {
  open: boolean; onClose: () => void; onSuccess: () => void; batch?: any;
}) {
  const { toast } = useToast();
  const EMPTY = { batchNumber: "", day1Date: "", day2Date: "", day1Title: "Foundation & Identity", day2Title: "Skill, Safety & The Year", day1Meta: "9:00 AM – 3:00 PM · Modules 1, 2 & 3 · 5 hours", day2Meta: "8:45 AM – 3:00 PM · Modules 4, 5 & 6 · 5 hours", status: "upcoming" };
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(batch ? {
      batchNumber: String(batch.batchNumber), day1Date: batch.day1Date ? new Date(batch.day1Date).toISOString().slice(0,10) : "",
      day2Date: batch.day2Date ? new Date(batch.day2Date).toISOString().slice(0,10) : "",
      day1Title: batch.day1Title || EMPTY.day1Title, day2Title: batch.day2Title || EMPTY.day2Title,
      day1Meta: batch.day1Meta || EMPTY.day1Meta, day2Meta: batch.day2Meta || EMPTY.day2Meta,
      status: batch.status || "upcoming",
    } : { ...EMPTY });
  }, [open, batch]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.batchNumber) { toast({ variant: "destructive", title: "Batch number required." }); return; }
    setSaving(true);
    try {
      const payload = { ...form, batchNumber: parseInt(form.batchNumber), day1Date: form.day1Date || undefined, day2Date: form.day2Date || undefined };
      if (batch) await trainingService.updateBatch(batch._id, payload);
      else        await trainingService.createBatch(payload);
      toast({ title: batch ? "Batch updated." : "Batch created." });
      onClose(); onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Failed to save batch." });
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={batch ? "Edit Batch" : "Create New Batch"}>
      <FormRow>
        <FormGroup label="Batch Number" required>
          <FormInput type="number" value={form.batchNumber} onChange={(e) => set("batchNumber", e.target.value)} />
        </FormGroup>
        <FormGroup label="Status">
          <FormSelect value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </FormSelect>
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Day 1 Date"><FormInput type="date" value={form.day1Date} onChange={(e) => set("day1Date", e.target.value)} /></FormGroup>
        <FormGroup label="Day 2 Date"><FormInput type="date" value={form.day2Date} onChange={(e) => set("day2Date", e.target.value)} /></FormGroup>
      </FormRow>
      <FormGroup label="Day 1 Title"><FormInput value={form.day1Title} onChange={(e) => set("day1Title", e.target.value)} /></FormGroup>
      <FormGroup label="Day 1 Meta (time/modules)"><FormInput value={form.day1Meta} onChange={(e) => set("day1Meta", e.target.value)} /></FormGroup>
      <FormGroup label="Day 2 Title"><FormInput value={form.day2Title} onChange={(e) => set("day2Title", e.target.value)} /></FormGroup>
      <FormGroup label="Day 2 Meta (time/modules)"><FormInput value={form.day2Meta} onChange={(e) => set("day2Meta", e.target.value)} /></FormGroup>
      <div className="flex gap-2 mt-2">
        <button className="btn-gold flex-1" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : batch ? "Save Changes" : "Create Batch"}
        </button>
        <button className="btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
      </div>
    </Modal>
  );
}

// ── Add Candidates Modal ───────────────────────────────────────────────────────
function AddCandidatesModal({ open, onClose, onSuccess, batchId, existingIds }: {
  open: boolean; onClose: () => void; onSuccess: () => void; batchId: string; existingIds: string[];
}) {
  const { toast }             = useToast();
  const [murabbis, setMurabbis] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    adminService.getMurabbis()
      .then((res) => setMurabbis((res.data.data || []).filter((m: any) => !existingIds.includes(m._id))))
      .catch(() => toast({ variant: "destructive", title: "Failed to load murabbis." }));
  }, [open]);

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  async function handleAdd() {
    if (!selected.size) { toast({ variant: "destructive", title: "Select at least one murabbi." }); return; }
    setSaving(true);
    try {
      await trainingService.addCandidates(batchId, [...selected]);
      toast({ title: `${selected.size} candidate(s) added.` });
      onClose(); onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Failed to add." });
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Candidates to Batch">
      {murabbis.length === 0
        ? <p className="text-nc-muted text-sm py-4 text-center">All murabbis already added or none available.</p>
        : <div className="max-h-[300px] overflow-y-auto divide-y divide-border mb-4">
            {murabbis.map((m) => (
              <div key={m._id} className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-muted/40" onClick={() => toggle(m._id)}>
                <input type="checkbox" readOnly checked={selected.has(m._id)} className="rounded" />
                <div className="w-7 h-7 rounded-full bg-teal-lt flex items-center justify-center text-[11px] font-bold text-teal">{getInitials(m.fullName)}</div>
                <div>
                  <div className="text-[13px] font-medium">{m.fullName}</div>
                  <div className="text-[11px] text-nc-muted">{m.email}</div>
                </div>
              </div>
            ))}
          </div>
      }
      <div className="flex gap-2">
        <button className="btn-gold flex-1" onClick={handleAdd} disabled={saving || !selected.size}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : `Add ${selected.size ? `(${selected.size})` : ""}`}
        </button>
        <button className="btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TrainingPage() {
  const { toast }                       = useToast();
  const [data, setData]                 = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [batchModal, setBatchModal]     = useState(false);
  const [editBatch, setEditBatch]       = useState<any>(null);
  const [addCandModal, setAddCandModal] = useState(false);
  const [removingId, setRemovingId]     = useState<string | null>(null);

  // Lesson Plans state
  const [lessons,        setLessons]        = useState<any[]>([]);
  const [lessonLoading,  setLessonLoading]  = useState(true);
  const [lessonForm,     setLessonForm]     = useState<any>(null);
  const [lessonDelTarget, setLessonDelTarget] = useState<any>(null);
  const [lessonDeleting, setLessonDeleting] = useState(false);

  function load() {
    setLoading(true);
    trainingService.getPageData()
      .then((res) => setData(res.data.data || res.data))
      .catch(() => toast({ variant: "destructive", title: "Failed to load training data." }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    lessonsService.getAll()
      .then((res) => setLessons(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load lessons." }))
      .finally(() => setLessonLoading(false));
  }, []);

  const handleLessonSaved = (saved: any) => {
    setLessons((prev) => {
      const idx = prev.findIndex((l) => l._id === saved._id);
      return idx >= 0
        ? prev.map((l) => l._id === saved._id ? saved : l)
        : [...prev, saved].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
    setLessonForm(null);
  };

  const handleLessonDelete = async () => {
    if (!lessonDelTarget) return;
    setLessonDeleting(true);
    try {
      await lessonsService.remove(lessonDelTarget._id);
      setLessons((prev) => prev.filter((l) => l._id !== lessonDelTarget._id));
      toast({ title: "Lesson deleted." });
      setLessonDelTarget(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Delete failed", description: getApiError(e) || "Try again." });
    } finally { setLessonDeleting(false); }
  };

  async function handleRemoveCandidate(userId: string) {
    if (!activeBatch) return;
    setRemovingId(userId);
    try {
      await trainingService.removeCandidate(activeBatch._id, userId);
      toast({ title: "Candidate removed." });
      load();
    } catch { toast({ variant: "destructive", title: "Failed to remove." }); }
    finally { setRemovingId(null); }
  }

  const stats       = data?.stats       || {};
  const activeBatch = data?.activeBatch || null;
  const modules     = data?.modules     || [];


  const candidates: any[] = activeBatch?.candidates || [];
  const existingCandIds   = candidates.map((c: any) => c._id || c);

  const day1Count      = modules.filter((m: any) => m.daySlot === 1 || (!m.daySlot && (m.order || 0) <= 3)).length;
  const modulesSubtitle = modules.length > 0
    ? `Day 1: M1–M${day1Count || 3} · Day 2: M${(day1Count || 3) + 1}–M${modules.length}`
    : "No modules yet";

  return (
    <div className="page-animate">

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard
          label="Batches Completed"
          value={loading ? "—" : stats.batchesCompleted ?? 0}
          meta={`${stats.murabbisInBatches ?? 0} Murabbis certified`}
          color="teal"
        />
        <StatCard
          label={`Batch ${stats.activeBatchNumber ?? "—"} — Active`}
          value={loading ? "—" : stats.activeBatchCandidates ?? 0}
          meta="Candidates registered"
          color="gold"
        />
        <StatCard
          label="Modules Available"
          value={loading ? "—" : stats.modulesAvailable ?? 0}
          meta={modulesSubtitle}
          color="green"
        />
        <StatCard
          label="Pass Rate"
          value={loading ? "—" : `${stats.passRate ?? 0}%`}
          meta="All cohorts combined"
          color="purple"
        />
      </div>

      {/* ── Batch schedule + Candidates ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* LEFT — Current Batch Schedule */}
        <NcCard>
          <CardHeader>
            <CardTitle>
              {activeBatch
                ? `Tier 1 Training — Batch ${activeBatch.batchNumber}`
                : "No Active Batch"}
            </CardTitle>
            <div className="flex items-center gap-2">
              {activeBatch?.day1Date && (
                <span className="text-[11.5px] font-semibold text-gold bg-gold/10 border border-gold/20 rounded-full px-3 py-1">
                  Starting {fmtDate(activeBatch.day1Date)}
                </span>
              )}
              <button className="p-1.5 hover:bg-muted rounded-md text-nc-muted"
                onClick={() => { setEditBatch(activeBatch); setBatchModal(true); }}>
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button className="btn-outline text-xs" onClick={() => { setEditBatch(null); setBatchModal(true); }}>
                + New Batch
              </button>
            </div>
          </CardHeader>

          {loading ? (
            <div className="text-center py-8 text-nc-muted text-sm animate-pulse">Loading…</div>
          ) : !activeBatch ? (
            <div className="text-center py-8 text-nc-muted text-sm">
              No active batch. Create one to get started.
            </div>
          ) : (
            <div className="px-4 pb-4 flex flex-col gap-3">
              {/* Day 1 */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-[13.5px] text-teal mb-0.5">
                      Day 1 — {activeBatch.day1Title}
                    </div>
                    <div className="text-[12px] text-nc-muted">{activeBatch.day1Meta}</div>
                  </div>
                  <span className="text-[11.5px] text-nc-muted flex-shrink-0 ml-3">
                    {fmtDate(activeBatch.day1Date)}
                  </span>
                </div>
              </div>
              {/* Day 2 */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-[13.5px] text-teal mb-0.5">
                      Day 2 — {activeBatch.day2Title}
                    </div>
                    <div className="text-[12px] text-nc-muted">{activeBatch.day2Meta}</div>
                  </div>
                  <span className="text-[11.5px] text-nc-muted flex-shrink-0 ml-3">
                    {fmtDate(activeBatch.day2Date)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </NcCard>

        {/* RIGHT — Batch Candidates */}
        <NcCard>
          <CardHeader>
            <CardTitle sub={activeBatch ? `Batch ${activeBatch.batchNumber}` : ""}>
              Batch Candidates
            </CardTitle>
            {activeBatch && (
              <button className="btn-outline text-xs flex items-center gap-1" onClick={() => setAddCandModal(true)}>
                <UserPlus className="h-3.5 w-3.5" /> Add
              </button>
            )}
          </CardHeader>

          {loading ? (
            <div className="text-center py-8 text-nc-muted text-sm animate-pulse">Loading…</div>
          ) : !activeBatch || candidates.length === 0 ? (
            <div className="text-center py-8 text-nc-muted text-sm">
              {activeBatch ? "No candidates yet. Add murabbis to this batch." : "Create an active batch first."}
            </div>
          ) : (
            <div className="scroll-hover max-h-[300px] divide-y divide-border">
              {candidates.map((c: any) => (
                <div key={c._id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-lt flex items-center justify-center text-xs font-bold text-teal overflow-hidden flex-shrink-0">
                      {c.image
                        ? <img src={c.image} alt="" className="w-full h-full object-cover" />
                        : getInitials(c.fullName || "?")}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium">{c.fullName}</div>
                      {c.email && <div className="text-[11px] text-nc-muted">{c.email}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <NcBadge variant="amber">Registered</NcBadge>
                    <button
                      className="p-1 hover:bg-red-50 rounded text-red-400"
                      onClick={() => handleRemoveCandidate(c._id)}
                      disabled={removingId === c._id}
                    >
                      {removingId === c._id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <X className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </NcCard>
      </div>

      {/* ── Training Modules ─────────────────────────────────────── */}
      {/* ── Training Modules ─────────────────────────────────── */}
      {!loading && (
        <div>
          <h2 className="font-semibold text-[15px] mb-5">
            Training Modules — Tier 1 Asaas
            {modules.length > 0 && (() => {
              const hrs = Math.round(modules.reduce((s: number, m: any) => s + (m.durationMinutes || 0), 0) / 60);
              return hrs > 0 ? <span className="text-nc-muted font-normal ml-1.5 text-[13px]">({hrs} hours)</span> : null;
            })()}
          </h2>

          {(() => {
            const day1Mods = modules.filter((m: any) => (m.daySlot ?? 1) === 1);
            const day2Mods = modules.filter((m: any) => m.daySlot === 2);

            const DAYS = [
              {
                num      : 1,
                title    : activeBatch?.day1Title || "Foundation & Identity",
                meta     : activeBatch?.day1Meta  || "9:00 AM – 3:00 PM · Modules 1, 2 & 3 · 5 hours",
                date     : activeBatch?.day1Date,
                mods     : day1Mods,
                bg       : "bg-teal/5 border-teal/20",
                headerBg : "bg-teal/10 border-teal/20",
                text     : "text-teal",
              },
              {
                num      : 2,
                title    : activeBatch?.day2Title || "Skill, Safety & The Year",
                meta     : activeBatch?.day2Meta  || "8:45 AM – 3:00 PM · Modules 4, 5 & 6 · 5 hours",
                date     : activeBatch?.day2Date,
                mods     : day2Mods,
                bg       : "bg-gold/5 border-gold/20",
                headerBg : "bg-gold/10 border-gold/20",
                text     : "text-gold",
              },
            ];

            return (
              <div className="flex flex-col gap-6">
                {DAYS.map((day) => (
                  <div key={day.num} className={`border rounded-xl overflow-hidden ${day.bg}`}>

                    {/* Day header */}
                    <div className={`flex items-center justify-between px-5 py-3.5 border-b ${day.headerBg}`}>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`font-bold text-[14px] ${day.text}`}>
                          Day {day.num} — {day.title}
                        </span>
                        <span className="text-[12px] text-nc-muted">{day.meta}</span>
                      </div>
                      {day.date && (
                        <span className={`text-[12px] font-semibold flex-shrink-0 ml-4 ${day.text}`}>
                          {fmtDate(day.date)}
                        </span>
                      )}
                    </div>

                    {/* Modules inside the day card */}
                    {day.mods.length === 0 ? (
                      <div className="text-center py-6 text-nc-muted text-sm">
                        No modules added for Day {day.num} yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                        {day.mods.map((m: any, i: number) => (
                          <ModuleCard key={m._id} m={m} i={i} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Lesson Plans ─────────────────────────────────────────── */}
      <NcCard className="mt-6">
        <CardHeader>
          <CardTitle sub={`${lessons.length} lesson plan${lessons.length !== 1 ? "s" : ""} in curriculum`}>
            <span className="flex items-center gap-1.5"><BookOpen size={14} /> Lesson Plans</span>
          </CardTitle>
          <button className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5"
            onClick={() => setLessonForm(EMPTY_LESSON)}>
            <Plus size={13} /> Add Lesson
          </button>
        </CardHeader>

        {lessonLoading ? (
          <div className="text-center py-10 text-nc-muted text-sm animate-pulse">Loading lessons…</div>
        ) : lessons.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <BookOpen size={22} className="text-nc-muted/40" />
            </div>
            <p className="text-sm text-nc-muted">No lessons yet.</p>
            <button className="btn-primary mt-4 text-xs px-4" onClick={() => setLessonForm(EMPTY_LESSON)}>
              <Plus size={12} className="inline mr-1" /> Create First Lesson
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["#", "Title", "Module", "Level", "Duration", "Status", "Objectives", ""].map((h) => (
                    <th key={h} className="bg-muted px-3.5 py-2.5 text-left text-[11px] font-semibold text-nc-muted uppercase tracking-wide border-b border-border whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lessons.map((l) => (
                  <tr key={l._id} className="hover:bg-teal-lt/40 transition-colors group">
                    <td className="px-3.5 py-3 border-b border-border text-nc-muted text-center font-mono text-xs">{l.order || "—"}</td>
                    <td className="px-3.5 py-3 border-b border-border font-semibold max-w-[220px]">
                      <div className="truncate">{l.title}</div>
                      {l.sessionNumber && <span className="text-[10px] text-teal font-medium">Session #{l.sessionNumber}</span>}
                    </td>
                    <td className="px-3.5 py-3 border-b border-border text-nc-muted text-xs">
                      {l.module ? <span className="flex items-center gap-1"><Tag size={10} />{l.module}</span> : "—"}
                    </td>
                    <td className="px-3.5 py-3 border-b border-border text-nc-muted text-xs">{l.level || "—"}</td>
                    <td className="px-3.5 py-3 border-b border-border text-nc-muted text-xs whitespace-nowrap">
                      {l.duration ? <span className="flex items-center gap-1"><ClockIcon size={10} />{l.duration}</span> : "—"}
                    </td>
                    <td className="px-3.5 py-3 border-b border-border">
                      <NcBadge variant={l.status === "Available" ? "green" : l.status === "Upcoming" ? "amber" : "dark"}>{l.status}</NcBadge>
                    </td>
                    <td className="px-3.5 py-3 border-b border-border text-center text-nc-muted text-xs">
                      {l.objectives?.length > 0
                        ? <span className="flex items-center gap-1 justify-center"><ListChecks size={11} className="text-teal" />{l.objectives.length}</span>
                        : "—"}
                    </td>
                    <td className="px-3.5 py-3 border-b border-border">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setLessonForm(l)} className="p-1.5 rounded-md hover:bg-teal/10 text-teal" title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => setLessonDelTarget(l)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500" title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NcCard>

      {/* Modals */}
      <BatchModal
        open={batchModal}
        batch={editBatch}
        onClose={() => { setBatchModal(false); setEditBatch(null); }}
        onSuccess={load}
      />
      {activeBatch && (
        <AddCandidatesModal
          open={addCandModal}
          batchId={activeBatch._id}
          existingIds={existingCandIds}
          onClose={() => setAddCandModal(false)}
          onSuccess={load}
        />
      )}

      {/* Lesson modals */}
      {lessonForm !== null && (
        <LessonFormModal lesson={lessonForm} onClose={() => setLessonForm(null)} onSaved={handleLessonSaved} />
      )}
      {lessonDelTarget && (
        <Modal open onClose={() => setLessonDelTarget(null)} title="Delete Lesson" subtitle="This cannot be undone.">
          <p className="text-[13px] text-nc-muted mb-6">
            Delete <strong>"{lessonDelTarget.title}"</strong>? Murabbis will no longer see this lesson.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setLessonDelTarget(null)} className="flex-1 btn-outline">Cancel</button>
            <button onClick={handleLessonDelete} disabled={lessonDeleting}
              className="flex-1 py-2 px-4 rounded-md bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50">
              {lessonDeleting ? "Deleting…" : "Yes, Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
