import { useEffect, useRef, useState } from "react";
import NcCard from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import ProgressBar from "@/components/shared/ProgressBar";
import Modal, { FormGroup, FormInput, FormRow, FormSelect } from "@/components/shared/Modal";
import DeleteConfirmModal from "@/components/shared/DeleteConfirmModal";
import { neighbourhoodsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, MoreVertical, Rocket } from "lucide-react";

// ── Status config ──────────────────────────────────────────────────────────────
const NBH_STATUS: Record<string, { label: string; variant: "green" | "amber" | "slate" }> = {
  active  : { label: "active",   variant: "green" },
  review  : { label: "review",   variant: "amber" },
  inactive: { label: "inactive", variant: "slate" },
};

const PIPE_STATUS: Record<string, { label: string; color: string }> = {
  prospecting      : { label: "Prospecting",       color: "text-slate bg-muted border border-border" },
  "in-talks"       : { label: "In talks",           color: "text-gold-dim bg-gold/10 border border-gold/20" },
  "ready-to-launch": { label: "Ready to launch",   color: "text-nc-green bg-nc-green/10 border border-nc-green/20" },
};

// ── Neighbourhood Form Modal ────────────────────────────────────────────────────
function NbhModal({ open, onClose, onSuccess, nbh }: {
  open: boolean; onClose: () => void; onSuccess: () => void; nbh?: any;
}) {
  const { toast } = useToast();
  const E = { name: "", city: "", area: "", mosques: "", status: "active" };
  const [form, setForm] = useState({ ...E });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(nbh
      ? { name: nbh.name || "", city: nbh.city || "", area: nbh.area || "", mosques: nbh.mosques || "", status: nbh.status || "active" }
      : { ...E });
  }, [open, nbh]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.name.trim()) { toast({ variant: "destructive", title: "Name is required." }); return; }
    setSaving(true);
    try {
      if (nbh) await neighbourhoodsService.update(nbh._id, form);
      else     await neighbourhoodsService.create(form);
      toast({ title: nbh ? "Neighbourhood updated." : "Neighbourhood created." });
      onClose(); onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Failed." });
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={nbh ? "Edit Neighbourhood" : "Add Neighbourhood"}>
      <FormRow>
        <FormGroup label="Name" required><FormInput value={form.name} onChange={(e) => set("name", e.target.value)} /></FormGroup>
        <FormGroup label="Status">
          <FormSelect value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="active">Active</option>
            <option value="review">Review</option>
            <option value="inactive">Inactive</option>
          </FormSelect>
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="City"><FormInput placeholder="e.g. Karachi" value={form.city} onChange={(e) => set("city", e.target.value)} /></FormGroup>
        <FormGroup label="Area"><FormInput placeholder="e.g. East Karachi" value={form.area} onChange={(e) => set("area", e.target.value)} /></FormGroup>
      </FormRow>
      <FormGroup label="Mosques"><FormInput placeholder="Masjid A, Masjid B" value={form.mosques} onChange={(e) => set("mosques", e.target.value)} /></FormGroup>
      <div className="flex gap-2 mt-2">
        <button className="btn-gold flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : nbh ? "Save Changes" : "Add"}</button>
        <button className="btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
      </div>
    </Modal>
  );
}

// ── Pipeline Form Modal ────────────────────────────────────────────────────────
function PipelineModal({ open, onClose, onSuccess, entry }: {
  open: boolean; onClose: () => void; onSuccess: () => void; entry?: any;
}) {
  const { toast } = useToast();
  const E = { name: "", area: "", mosqueContact: "", targetCircles: "1", interestLevel: "50", status: "prospecting" };
  const [form, setForm] = useState({ ...E });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(entry
      ? { name: entry.name || "", area: entry.area || "", mosqueContact: entry.mosqueContact || "", targetCircles: String(entry.targetCircles || 1), interestLevel: String(entry.interestLevel || 50), status: entry.status || "prospecting" }
      : { ...E });
  }, [open, entry]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.name.trim()) { toast({ variant: "destructive", title: "Name is required." }); return; }
    setSaving(true);
    try {
      const payload = { ...form, targetCircles: parseInt(form.targetCircles) || 1, interestLevel: parseInt(form.interestLevel) || 50 };
      if (entry) await neighbourhoodsService.updatePipeline(entry._id, payload);
      else       await neighbourhoodsService.createPipeline(payload);
      toast({ title: entry ? "Entry updated." : "Entry added to pipeline." });
      onClose(); onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Failed." });
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={entry ? "Edit Pipeline Entry" : "Add to Pipeline"}>
      <FormRow>
        <FormGroup label="Neighbourhood Name" required><FormInput value={form.name} onChange={(e) => set("name", e.target.value)} /></FormGroup>
        <FormGroup label="Area"><FormInput placeholder="e.g. Central Karachi" value={form.area} onChange={(e) => set("area", e.target.value)} /></FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Mosque Contact"><FormInput placeholder="Masjid name (optional)" value={form.mosqueContact} onChange={(e) => set("mosqueContact", e.target.value)} /></FormGroup>
        <FormGroup label="Target Circles"><FormInput type="number" min={1} value={form.targetCircles} onChange={(e) => set("targetCircles", e.target.value)} /></FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Interest Level (0–100)"><FormInput type="number" min={0} max={100} value={form.interestLevel} onChange={(e) => set("interestLevel", e.target.value)} /></FormGroup>
        <FormGroup label="Status">
          <FormSelect value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="prospecting">Prospecting</option>
            <option value="in-talks">In talks</option>
            <option value="ready-to-launch">Ready to launch</option>
          </FormSelect>
        </FormGroup>
      </FormRow>
      <div className="flex gap-2 mt-2">
        <button className="btn-gold flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : entry ? "Save Changes" : "Add to Pipeline"}</button>
        <button className="btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
      </div>
    </Modal>
  );
}

// ── Action Menu (3-dot) ────────────────────────────────────────────────────────
function ActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button className="p-1.5 hover:bg-muted rounded-md text-nc-muted" onClick={() => setOpen((s) => !s)}>
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-36 bg-card border border-border rounded-lg shadow-lg z-50 py-1 text-[13px]">
          <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left" onClick={() => { setOpen(false); onEdit(); }}>
            <Pencil className="h-3.5 w-3.5 text-nc-muted" /> Edit
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-500 text-left" onClick={() => { setOpen(false); onDelete(); }}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function NeighbourhoodsPage() {
  const { toast }                         = useToast();
  const [data, setData]                   = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [nbhModal, setNbhModal]           = useState(false);
  const [editNbh, setEditNbh]             = useState<any>(null);
  const [pipeModal, setPipeModal]         = useState(false);
  const [editPipe, setEditPipe]           = useState<any>(null);
  const [deleteTarget, setDeleteTarget]   = useState<{ type: "nbh" | "pipe"; item: any } | null>(null);
  const [launching, setLaunching]         = useState<string | null>(null);

  function load() {
    setLoading(true);
    neighbourhoodsService.getPageData()
      .then((res) => setData(res.data.data || res.data))
      .catch(() => toast({ variant: "destructive", title: "Failed to load neighbourhoods." }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "nbh")  await neighbourhoodsService.remove(deleteTarget.item._id);
      else                               await neighbourhoodsService.deletePipeline(deleteTarget.item._id);
      toast({ title: `"${deleteTarget.item.name}" deleted.` });
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Delete failed." });
    }
  }

  async function handleLaunch(entry: any) {
    setLaunching(entry._id);
    try {
      await neighbourhoodsService.launchPipeline(entry._id);
      toast({ title: `"${entry.name}" launched as active neighbourhood!` });
      load();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Launch failed." });
    } finally { setLaunching(null); }
  }

  const neighbourhoods = data?.neighbourhoods || [];
  const pipeline       = data?.pipeline       || [];
  const stats          = data?.stats          || {};
  const activeCount    = neighbourhoods.filter((n: any) => n.status === "active" || n.isActive).length;
  const city           = stats.city || neighbourhoods[0]?.city || "";

  return (
    <div className="page-animate">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-[22px] font-semibold">Neighbourhood Management</h1>
          <p className="text-[12.5px] text-nc-muted mt-0.5">
            {activeCount} active neighbourhood{activeCount !== 1 ? "s" : ""}
            {city ? ` · ${city}` : ""}
          </p>
        </div>
        <button className="btn-gold" onClick={() => { setEditNbh(null); setNbhModal(true); }}>
          + Add Neighbourhood
        </button>
      </div>

      {/* ── Neighbourhood Cards ──────────────────────────────── */}
      {loading ? (
        <div className="text-center py-16 text-nc-muted text-sm animate-pulse">Loading…</div>
      ) : neighbourhoods.length === 0 ? (
        <div className="text-center py-16 text-nc-muted text-sm border border-dashed border-border rounded-xl mb-5">
          No neighbourhoods yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-7">
          {neighbourhoods.map((n: any) => {
            const statusCfg  = NBH_STATUS[n.status] || NBH_STATUS.active;
            const enrolled   = n.studentCount  || 0;
            const capacity   = n.totalCapacity || 0;
            const pct        = capacity > 0 ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0;

            return (
              <div key={n._id} className="bg-card border border-border rounded-xl p-5 hover:border-teal/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-[15px]">{n.name}</div>
                    <div className="text-[12px] text-nc-muted mt-0.5">
                      {[n.area, n.mosques].filter(Boolean).join(" · ") || n.city || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <NcBadge variant={statusCfg.variant}>{statusCfg.label}</NcBadge>
                    <ActionMenu
                      onEdit={() => { setEditNbh(n); setNbhModal(true); }}
                      onDelete={() => setDeleteTarget({ type: "nbh", item: n })}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 mb-3">
                  {[
                    { val: n.circleCount  || 0, label: "CIRCLES"   },
                    { val: n.studentCount || 0, label: "STUDENTS"  },
                    { val: n.murabbiCount || 0, label: "MURABBIS"  },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="font-serif text-[22px] font-bold text-teal leading-none">{s.val}</div>
                      <div className="text-[10px] text-nc-muted font-semibold tracking-wide mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Capacity bar */}
                <ProgressBar value={pct} color={pct > 100 ? "gold" : "teal"} />
                <p className="text-[11.5px] text-nc-muted mt-1.5">
                  {enrolled} of {capacity || "—"} capacity enrolled
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Expansion Pipeline ────────────────────────────────── */}
      <NcCard>
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <div className="font-semibold text-[15px]">Neighbourhood Expansion Pipeline</div>
          </div>
          <button className="btn-outline text-xs flex items-center gap-1.5"
            onClick={() => { setEditPipe(null); setPipeModal(true); }}>
            <Plus className="h-3.5 w-3.5" /> Add Entry
          </button>
        </div>

        {pipeline.length === 0 ? (
          <div className="text-center py-8 text-nc-muted text-sm px-5 pb-5">No pipeline entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["NEIGHBOURHOOD", "AREA", "INTEREST LEVEL", "MOSQUE CONTACT", "TARGET CIRCLES", "STATUS", "ACTION"].map((h) => (
                    <th key={h} className="bg-muted px-4 py-2.5 text-left text-[11px] font-semibold text-nc-muted uppercase tracking-wide border-b border-border">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pipeline.map((p: any) => {
                  const statusCfg = PIPE_STATUS[p.status] || PIPE_STATUS.prospecting;
                  const isReady   = p.status === "ready-to-launch";
                  return (
                    <tr key={p._id} className="hover:bg-teal-lt border-b border-border last:border-b-0">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-nc-muted">{p.area || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-[80px] h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-teal rounded-full" style={{ width: `${p.interestLevel || 0}%` }} />
                          </div>
                          <span className="text-[11px] text-nc-muted">{p.interestLevel || 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-nc-muted">{p.mosqueContact || "—"}</td>
                      <td className="px-4 py-3 text-center font-semibold">{p.targetCircles || 1}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isReady ? (
                            <button
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                              onClick={() => handleLaunch(p)}
                              disabled={launching === p._id}
                            >
                              <Rocket className="h-3 w-3" />
                              {launching === p._id ? "Launching…" : "Launch"}
                            </button>
                          ) : (
                            <span className="text-[12px] text-nc-muted">
                              {p.status === "prospecting" ? "Contact" : "Follow up"}
                            </span>
                          )}
                          <ActionMenu
                            onEdit={() => { setEditPipe(p); setPipeModal(true); }}
                            onDelete={() => setDeleteTarget({ type: "pipe", item: p })}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </NcCard>

      {/* Modals */}
      <NbhModal
        open={nbhModal}
        nbh={editNbh}
        onClose={() => { setNbhModal(false); setEditNbh(null); }}
        onSuccess={load}
      />
      <PipelineModal
        open={pipeModal}
        entry={editPipe}
        onClose={() => { setPipeModal(false); setEditPipe(null); }}
        onSuccess={load}
      />
      <DeleteConfirmModal
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === "nbh" ? "Neighbourhood" : "Pipeline Entry"}`}
        message={`Delete "${deleteTarget?.item?.name}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
