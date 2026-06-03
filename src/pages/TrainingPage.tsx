import { useEffect, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import Modal, { FormGroup, FormInput, FormSelect, FormRow } from "@/components/shared/Modal";
import { trainingService, adminService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, UserPlus, X } from "lucide-react";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
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

  function load() {
    setLoading(true);
    trainingService.getPageData()
      .then((res) => setData(res.data.data || res.data))
      .catch(() => toast({ variant: "destructive", title: "Failed to load training data." }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

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
    </div>
  );
}
