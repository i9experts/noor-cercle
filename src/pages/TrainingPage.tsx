import { useEffect, useState } from "react";
import { Plus, Trash2, BookOpen, Video, Calendar, Clock, Repeat, ExternalLink, Pencil } from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import Modal, { FormGroup, FormInput, FormSelect, FormTextarea, FormRow } from "@/components/shared/Modal";
import { trainingService, liveSessionsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS = ["Available", "Upcoming", "Locked"];
const TYPE_OPTIONS   = ["Video", "PDF", "Live", "Mixed"];
const DAY_OPTIONS    = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const EMPTY_LIVE_FORM = {
  title          : "",
  description    : "",
  zoomLink       : "",
  isRecurring    : false,
  scheduledAt    : "",
  recurringDay   : "0",
  recurringTime  : "",
  durationMinutes: "60",
};

const EMPTY_FORM = {
  title          : "",
  description    : "",
  order          : "",
  durationMinutes: "",
  totalLessons   : "",
  status         : "Available",
  type           : "Video",
};

export default function TrainingPage() {
  const { toast } = useToast();
  const [modules, setModules]   = useState<any[]>([]);
  const [summary, setSummary]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Live sessions state
  const [liveSessions, setLiveSessions]     = useState<any[]>([]);
  const [showLiveForm, setShowLiveForm]     = useState(false);
  const [editingLive, setEditingLive]       = useState<any | null>(null);
  const [liveForm, setLiveForm]             = useState({ ...EMPTY_LIVE_FORM });
  const [savingLive, setSavingLive]         = useState(false);
  const [deletingLive, setDeletingLive]     = useState<string | null>(null);

  const load = () => {
    Promise.all([trainingService.getModules(), trainingService.getProgressSummary()])
      .then(([mRes, sRes]) => {
        setModules(mRes.data.data || []);
        setSummary(sRes.data.data || null);
      })
      .catch(() => toast({ variant: "destructive", title: "Failed to load training data" }))
      .finally(() => setLoading(false));
  };

  const loadLiveSessions = () => {
    liveSessionsService.getAll()
      .then((res) => setLiveSessions(res.data.data || []))
      .catch(() => {});
  };

  useEffect(() => { load(); loadLiveSessions(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLiveChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setLiveForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const openCreateLive = () => {
    setEditingLive(null);
    setLiveForm({ ...EMPTY_LIVE_FORM });
    setShowLiveForm(true);
  };

  const openEditLive = (s: any) => {
    setEditingLive(s);
    setLiveForm({
      title          : s.title          ?? "",
      description    : s.description    ?? "",
      zoomLink       : s.zoomLink       ?? "",
      isRecurring    : s.isRecurring     ?? false,
      scheduledAt    : s.scheduledAt
        ? new Date(s.scheduledAt).toISOString().slice(0, 16)
        : "",
      recurringDay   : s.recurringDay   != null ? String(s.recurringDay) : "0",
      recurringTime  : s.recurringTime  ?? "",
      durationMinutes: s.durationMinutes != null ? String(s.durationMinutes) : "60",
    });
    setShowLiveForm(true);
  };

  const closeLiveForm = () => {
    setShowLiveForm(false);
    setEditingLive(null);
    setLiveForm({ ...EMPTY_LIVE_FORM });
  };

  const handleSaveLive = async () => {
    if (!liveForm.title.trim()) {
      toast({ variant: "destructive", title: "Title is required." });
      return;
    }
    if (!liveForm.zoomLink.trim()) {
      toast({ variant: "destructive", title: "Zoom link is required." });
      return;
    }
    setSavingLive(true);
    const payload: Record<string, any> = {
      title          : liveForm.title.trim(),
      description    : liveForm.description.trim(),
      zoomLink       : liveForm.zoomLink.trim(),
      isRecurring    : liveForm.isRecurring,
      durationMinutes: liveForm.durationMinutes ? Number(liveForm.durationMinutes) : 60,
    };
    if (liveForm.isRecurring) {
      payload.recurringDay  = Number(liveForm.recurringDay);
      payload.recurringTime = liveForm.recurringTime;
    } else {
      payload.scheduledAt = liveForm.scheduledAt ? new Date(liveForm.scheduledAt).toISOString() : undefined;
    }
    try {
      if (editingLive) {
        await liveSessionsService.update(editingLive._id, payload);
        toast({ title: "Meeting updated." });
      } else {
        await liveSessionsService.create(payload);
        toast({ title: "Meeting scheduled." });
      }
      closeLiveForm();
      loadLiveSessions();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Failed to save meeting." });
    } finally {
      setSavingLive(false);
    }
  };

  const handleDeleteLive = async (id: string) => {
    if (!confirm("Delete this live meeting? This cannot be undone.")) return;
    setDeletingLive(id);
    try {
      await liveSessionsService.remove(id);
      setLiveSessions((prev) => prev.filter((s) => s._id !== id));
      toast({ title: "Meeting deleted." });
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Failed to delete meeting." });
    } finally {
      setDeletingLive(null);
    }
  };

  const formatMeetingTime = (s: any) => {
    if (s.isRecurring && s.recurringDay != null && s.recurringTime) {
      return `Every ${DAY_OPTIONS[s.recurringDay]} at ${s.recurringTime}`;
    }
    if (s.scheduledAt) {
      return new Date(s.scheduledAt).toLocaleString("en-PK", {
        weekday: "short", day: "numeric", month: "short",
        year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    }
    return "—";
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast({ variant: "destructive", title: "Title is required." });
      return;
    }
    setSaving(true);
    try {
      await trainingService.createModule({
        title          : form.title.trim(),
        description    : form.description.trim(),
        order          : form.order           ? Number(form.order)           : undefined,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        totalLessons   : form.totalLessons    ? Number(form.totalLessons)    : undefined,
        status         : form.status,
        type           : form.type,
      });
      toast({ title: "Training module created." });
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      load();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Failed to create module." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this training module? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await trainingService.deleteModule(id);
      setModules((prev) => prev.filter((m) => m._id !== id));
      toast({ title: "Module deleted." });
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Failed to delete module." });
    } finally {
      setDeleting(null); }
  };

  return (
    <div className="page-animate">
      <div className="flex items-center justify-between mb-6">
        <SectionTitle
          title="Training Modules"
          subtitle="Manage training content available to all Murabbis."
        />
        <button
          className="btn-primary flex items-center gap-2 text-sm"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4" /> New Module
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Total Modules"    value={summary?.total    ?? modules.length} meta="Available modules"  color="teal"   />
        <StatCard label="Completed"        value={summary?.completed   ?? "—"}          meta="Modules done"       color="green"  />
        <StatCard label="In Progress"      value={summary?.inProgress  ?? "—"}          meta="Currently ongoing"  color="gold"   />
        <StatCard label="Overall Progress" value={summary?.overallPercent ? `${summary.overallPercent}%` : "—"} meta="Completion rate" color="purple" />
      </div>

      <div className="scroll-hover max-h-[600px] grid grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-20 text-nc-muted text-sm animate-pulse">Loading training modules...</div>
        ) : modules.length === 0 ? (
          <div className="col-span-2 text-center py-20 text-nc-muted text-sm">
            No training modules yet. Click <strong>New Module</strong> to add one.
          </div>
        ) : (
          modules.map((m) => (
            <div key={m._id} className="border border-border rounded-lg overflow-hidden bg-card">
              <div className="p-4 px-5 flex items-center gap-3.5 border-b border-border">
                <div className="w-10 h-10 bg-nc-dark rounded-xl flex items-center justify-center font-serif text-[18px] text-sidebar-primary flex-shrink-0">
                  {m.order || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate">{m.title}</div>
                  <div className="text-[11px] text-nc-muted mt-0.5">
                    {[m.type, m.durationMinutes && `${m.durationMinutes} mins`, m.totalLessons && `${m.totalLessons} lessons`]
                      .filter(Boolean).join(" · ") || "No details set"}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <NcBadge variant={m.status === "Available" ? "green" : m.status === "Upcoming" ? "amber" : "dark"}>
                    {m.status}
                  </NcBadge>
                  <button
                    className="p-1.5 text-nc-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40"
                    onClick={() => handleDelete(m._id)}
                    disabled={deleting === m._id}
                    title="Delete module"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 px-5">
                <div className="text-[12.5px] text-slate leading-relaxed line-clamp-3">
                  {m.description || <span className="text-nc-muted italic">No description.</span>}
                </div>
                {m.progressPercent > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-nc-muted">Avg Progress</span>
                      <span className="font-semibold text-teal">{m.progressPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-teal rounded-full" style={{ width: `${m.progressPercent}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Live Zoom Meetings section ─────────────────────────────────────── */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Video className="h-5 w-5 text-teal" /> Live Meetings
            </h2>
            <p className="text-[12px] text-nc-muted mt-0.5">Zoom sessions scheduled for Murabbis.</p>
          </div>
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={openCreateLive}>
            <Plus className="h-4 w-4" /> Schedule Meeting
          </button>
        </div>

        {liveSessions.length === 0 ? (
          <div className="text-center py-12 text-nc-muted text-sm border border-dashed border-border rounded-lg">
            No meetings scheduled yet. Click <strong>Schedule Meeting</strong> to add one.
          </div>
        ) : (
          <div className="scroll-hover max-h-[400px] flex flex-col gap-3">
            {liveSessions.map((s) => (
              <div key={s._id} className="border border-border rounded-lg bg-card p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {s.isRecurring
                    ? <Repeat className="h-5 w-5 text-teal" />
                    : <Calendar className="h-5 w-5 text-teal" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{s.title}</span>
                    {s.isLive && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-white bg-green-500 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-nc-muted mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatMeetingTime(s)}
                    <span className="mx-1">·</span>
                    {s.durationMinutes} mins
                  </div>
                  {s.description && (
                    <p className="text-[12px] text-nc-muted mt-1 line-clamp-1">{s.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={s.zoomLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-nc-muted hover:text-teal hover:bg-teal/10 rounded-md transition-colors"
                    title="Open Zoom link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    className="p-1.5 text-nc-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                    onClick={() => openEditLive(s)}
                    title="Edit meeting"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1.5 text-nc-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40"
                    onClick={() => handleDeleteLive(s._id)}
                    disabled={deletingLive === s._id}
                    title="Delete meeting"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule / Edit meeting modal */}
      <Modal
        open={showLiveForm}
        onClose={closeLiveForm}
        title={editingLive ? "Edit Meeting" : "Schedule Meeting"}
        subtitle="This meeting will be visible to all Murabbis."
      >
        <FormGroup label="Title" required>
          <FormInput
            name="title" value={liveForm.title} onChange={handleLiveChange}
            placeholder="e.g. Weekly Murabbi Q&A"
          />
        </FormGroup>

        <FormGroup label="Description">
          <FormTextarea
            name="description" value={liveForm.description} onChange={handleLiveChange}
            placeholder="Brief description of the meeting…"
            rows={2}
          />
        </FormGroup>

        <FormGroup label="Zoom Link" required>
          <FormInput
            name="zoomLink" value={liveForm.zoomLink} onChange={handleLiveChange}
            placeholder="https://zoom.us/j/..."
          />
        </FormGroup>

        <FormGroup label="Recurring Meeting">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              name="isRecurring"
              checked={liveForm.isRecurring}
              onChange={handleLiveChange}
              className="w-4 h-4 accent-teal"
            />
            <span className="text-foreground">This is a recurring weekly meeting</span>
          </label>
        </FormGroup>

        {liveForm.isRecurring ? (
          <FormRow>
            <FormGroup label="Day of Week">
              <FormSelect name="recurringDay" value={liveForm.recurringDay} onChange={handleLiveChange}>
                {DAY_OPTIONS.map((d, i) => (
                  <option key={d} value={i}>{d}</option>
                ))}
              </FormSelect>
            </FormGroup>
            <FormGroup label="Time">
              <FormInput
                name="recurringTime" value={liveForm.recurringTime} onChange={handleLiveChange}
                type="time"
              />
            </FormGroup>
          </FormRow>
        ) : (
          <FormGroup label="Date & Time">
            <FormInput
              name="scheduledAt" value={liveForm.scheduledAt} onChange={handleLiveChange}
              type="datetime-local"
            />
          </FormGroup>
        )}

        <FormGroup label="Duration (mins)">
          <FormInput
            name="durationMinutes" value={liveForm.durationMinutes} onChange={handleLiveChange}
            type="number" min="1" placeholder="60"
          />
        </FormGroup>

        <div className="flex gap-2.5 mt-2">
          <button
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={handleSaveLive}
            disabled={savingLive}
          >
            <Video className="h-4 w-4" />
            {savingLive ? "Saving…" : editingLive ? "Update Meeting" : "Schedule Meeting"}
          </button>
          <button className="btn-outline" onClick={closeLiveForm} disabled={savingLive}>
            Cancel
          </button>
        </div>
      </Modal>

      {/* Create module modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }}
        title="New Training Module"
        subtitle="This module will be visible to all Murabbis."
      >
        <FormGroup label="Title" required>
          <FormInput
            name="title" value={form.title} onChange={handleChange}
            placeholder="e.g. Introduction to Tarbiyah"
          />
        </FormGroup>

        <FormGroup label="Description">
          <FormTextarea
            name="description" value={form.description} onChange={handleChange}
            placeholder="Brief overview of this module's content…"
            rows={3}
          />
        </FormGroup>

        <FormRow>
          <FormGroup label="Order #">
            <FormInput
              name="order" value={form.order} onChange={handleChange}
              type="number" min="1" placeholder="1"
            />
          </FormGroup>
          <FormGroup label="Duration (mins)">
            <FormInput
              name="durationMinutes" value={form.durationMinutes} onChange={handleChange}
              type="number" min="1" placeholder="60"
            />
          </FormGroup>
        </FormRow>

        <FormRow>
          <FormGroup label="Total Lessons">
            <FormInput
              name="totalLessons" value={form.totalLessons} onChange={handleChange}
              type="number" min="1" placeholder="5"
            />
          </FormGroup>
          <FormGroup label="Type">
            <FormSelect name="type" value={form.type} onChange={handleChange}>
              {TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
            </FormSelect>
          </FormGroup>
        </FormRow>

        <FormGroup label="Status">
          <FormSelect name="status" value={form.status} onChange={handleChange}>
            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </FormSelect>
        </FormGroup>

        <div className="flex gap-2.5 mt-2">
          <button
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={handleCreate}
            disabled={saving}
          >
            <BookOpen className="h-4 w-4" />
            {saving ? "Creating…" : "Create Module"}
          </button>
          <button
            className="btn-outline"
            onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
