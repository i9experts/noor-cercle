import { useCallback, useEffect, useState } from "react";
import { ArrowUpCircle, Check, Headphones, Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { courseService, marketplaceService } from "@/services/api.service";
import NcCard from "@/components/shared/NcCard";
import StatCard from "@/components/shared/StatCard";
import Modal, { FormGroup, FormInput, FormSelect, FormTextarea } from "@/components/shared/Modal";
import AsaasTrainingPage from "@/pages/AsaasTrainingPage";
import { cn } from "@/lib/utils";
import { apiError, apiMessage, formatDate, unwrap } from "@/lib/finance";
import { minutesLabel, titleProps } from "@/lib/course";

type Tab = "catalogue" | "requests" | "tiers";

/** Admin: every training in the marketplace, the requests waiting for approval, and murabbi tier upgrades. */
export default function TrainingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("catalogue");
  const [catalogue, setCatalogue] = useState<any[] | null>(null);
  const [pending, setPending] = useState(0);
  const [tiers, setTiers] = useState<any[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    marketplaceService.catalogue().then((r) => setCatalogue(unwrap(r) || []))
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load the trainings.") }));
    marketplaceService.requests("pending").then((r) => setPending((unwrap<any[]>(r) || []).length)).catch(() => {});
    marketplaceService.tierUpgrades().then((r) => setTiers(unwrap(r) || [])).catch(() => {});
  }, [toast]);
  useEffect(load, [load]);

  if (openKey) return <AsaasTrainingPage key={openKey} courseKey={openKey} onBack={() => { setOpenKey(null); load(); }} />;

  const all = catalogue ?? [];
  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "catalogue", label: "Catalogue" },
    { key: "requests", label: "Requests", count: pending },
    { key: "tiers", label: "Tier upgrades", count: tiers.length },
  ];

  return (
    <div className="page-animate">
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h2 className="font-serif text-[26px] text-nc-dark">Trainings</h2>
          <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
            The trainings murabbis and parents see in their marketplace. They can ask to join once the required trainings are certified
            and everything they already have is finished; you approve each request, or assign a training directly from inside it.
          </p>
        </div>
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New training</button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] sm:gap-4">
        <StatCard label="Trainings" value={catalogue ? all.length : "—"} meta={`${all.filter((c) => c.published).length} published`} color="purple" />
        <StatCard label="Enrolled" value={catalogue ? all.reduce((n, c) => n + c.enrolled, 0) : "—"} meta="Across all trainings" color="teal" />
        <StatCard label="Certified" value={catalogue ? all.reduce((n, c) => n + c.certified, 0) : "—"} meta="Completed a training" color="green" />
        <StatCard label="Requests" value={pending} meta="Waiting for approval" color={pending ? "red" : "gold"} />
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
        {tabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={cn("-mb-px whitespace-nowrap border-b-2 px-3.5 py-2 text-[13px] font-medium transition-colors",
              tab === t.key ? "border-teal text-teal" : "border-transparent text-nc-muted hover:text-nc-dark")}>
            {t.label}
            {t.count ? <span className="ml-1.5 rounded-full bg-nc-red px-1.5 text-[10.5px] font-semibold text-white">{t.count}</span> : null}
          </button>
        ))}
      </div>

      {tab === "catalogue" ? (
        catalogue === null ? <NcCard><div className="py-16 text-center text-sm text-nc-muted">Loading…</div></NcCard> : (
          <div className="space-y-8">
            {(["murabbi", "parent"] as const).map((aud) => (
              <section key={aud}>
                <h3 className="mb-3 text-[15px] font-semibold text-nc-dark">{aud === "murabbi" ? "For murabbis" : "For parents"}</h3>
                {all.filter((c) => c.audience === aud).length === 0 ? (
                  <NcCard><div className="py-6 text-center text-[13px] text-nc-muted">No trainings yet.</div></NcCard>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {all.filter((c) => c.audience === aud).map((c) => (
                      <TrainingCard key={c.key} c={c} all={all} onOpen={() => setOpenKey(c.key)} onChanged={load} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )
      ) : tab === "requests" ? (
        <RequestsTab onChanged={load} />
      ) : (
        <TierTab rows={tiers} onChanged={load} />
      )}

      {creating && <NewTrainingModal onClose={() => setCreating(false)} onCreated={(key) => { setCreating(false); setOpenKey(key); }} />}
    </div>
  );
}

function TrainingCard({ c, all, onOpen, onChanged }: { c: any; all: any[]; onOpen: () => void; onChanged: () => void }) {
  const { toast } = useToast();
  const needs = (c.prerequisites ?? []).map((k: string) => all.find((x) => x.key === k)?.title ?? k);

  async function remove() {
    if (!window.confirm(`Delete “${c.title}”? Its modules, lessons and audio are removed.`)) return;
    try {
      toast({ title: apiMessage(await courseService.remove(c.key), "Deleted.") });
      onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not delete the training.") });
    }
  }

  return (
    <NcCard className="flex flex-col p-5">
      <div className="mb-1 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-serif text-[19px] leading-snug text-nc-dark">{c.title}</div>
          {c.titleUr && <div {...titleProps(c.titleUr)} className="urdu text-right text-[15px] leading-[2] text-nc-muted">{c.titleUr}</div>}
        </div>
        <span className={cn("flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", c.published ? "bg-nc-green-lt text-nc-green" : "bg-muted text-nc-muted")}>
          {c.published ? "Published" : "Draft"}
        </span>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5 text-[11px]">
        {c.category && <span className="rounded-full bg-plum-lt px-2 py-0.5 font-medium text-plum">{c.category}</span>}
        {c.tier && <span className="rounded-full bg-gold-lt px-2 py-0.5 font-medium text-gold-dim">Tier {c.tier}</span>}
      </div>
      {c.summary && <p dir="auto" className="mb-3 line-clamp-3 text-[12.5px] text-nc-muted">{c.summary}</p>}
      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        {[["Enrolled", c.enrolled], ["Certified", c.certified], ["Waiting", c.pending]].map(([l, v]) => (
          <div key={l as string} className="rounded-md bg-muted/50 py-2">
            <div className={cn("font-serif text-[19px] leading-none", l === "Waiting" && v ? "text-nc-red" : "text-nc-dark")}>{v}</div>
            <div className="mt-1 text-[10.5px] uppercase tracking-wide text-nc-muted">{l}</div>
          </div>
        ))}
      </div>
      <div className="mb-1 flex items-center gap-1.5 text-[12px] text-nc-muted">
        <Headphones className="h-3.5 w-3.5" />
        {c.lessons} lesson{c.lessons === 1 ? "" : "s"}{c.withAudio < c.lessons ? ` (${c.withAudio} with audio)` : ""} · {minutesLabel(c.minutes)}
        {c.questions ? ` · ${c.questions} questions` : ""}{c.hasReflection ? " · reflection" : ""}
      </div>
      <div className="text-[12px] text-nc-muted">{needs.length ? <>Needs: <span className="text-nc-dark">{needs.join(", ")}</span></> : "No required trainings"}</div>
      <div className="mt-4 flex gap-2">
        {c.custom ? (
          <p className="text-[12px] text-nc-muted">This course has its own page: Operations → Parent Asaas.</p>
        ) : (
          <>
            <button className="btn-primary flex-1 justify-center !py-2 text-[12.5px]" onClick={onOpen}>Open</button>
            {!c.published && !c.enrolled && c.key !== "asaas-tier1" && (
              <button className="btn-outline !py-2 text-[12.5px]" onClick={remove} aria-label={`Delete ${c.title}`}><Trash2 className="h-4 w-4" /></button>
            )}
          </>
        )}
      </div>
    </NcCard>
  );
}

function NewTrainingModal({ onClose, onCreated }: { onClose: () => void; onCreated: (key: string) => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ title: "", titleUr: "", audience: "murabbi" as "murabbi" | "parent", summary: "", category: "" });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const r = await courseService.create({ ...f, titleUr: f.titleUr || undefined, summary: f.summary || undefined, category: f.category || undefined });
      toast({ title: apiMessage(r, "Training created.") });
      onCreated(unwrap(r).course.key);
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not create the training.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="New training" subtitle="It starts as a draft; add its modules, lessons and audio, then publish it.">
      <FormGroup label="Who is it for?">
        <FormSelect value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value as "murabbi" | "parent" })}>
          <option value="murabbi">Murabbis</option>
          <option value="parent">Parents</option>
        </FormSelect>
      </FormGroup>
      <FormGroup label="Title" required><FormInput value={f.title} maxLength={150} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Asaas Tier 2" /></FormGroup>
      <FormGroup label="Title in Urdu (optional)"><FormInput dir="rtl" lang="ur" className="urdu" value={f.titleUr} maxLength={150} onChange={(e) => setF({ ...f, titleUr: e.target.value })} /></FormGroup>
      <FormGroup label="Summary (optional)"><FormTextarea dir="auto" value={f.summary} maxLength={500} onChange={(e) => setF({ ...f, summary: e.target.value })} /></FormGroup>
      <FormGroup label="Category (optional)"><FormInput value={f.category} maxLength={60} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="e.g. Foundations" /></FormGroup>
      <button className="btn-primary w-full" disabled={saving || !f.title.trim()} onClick={save}>{saving ? "Creating…" : "Create and open"}</button>
    </Modal>
  );
}

// ── Requests ────────────────────────────────────────────────────────────────

const REQ_META: Record<string, { label: string; cls: string }> = {
  pending  : { label: "Waiting",   cls: "bg-nc-amber-lt text-nc-amber" },
  approved : { label: "Approved",  cls: "bg-nc-green-lt text-nc-green" },
  declined : { label: "Declined",  cls: "bg-nc-red-lt text-nc-red" },
  cancelled: { label: "Cancelled", cls: "bg-muted text-nc-muted" },
};

function RequestsTab({ onChanged }: { onChanged: () => void }) {
  const { toast } = useToast();
  const [status, setStatus] = useState("pending");
  const [rows, setRows] = useState<any[] | null>(null);
  const [approving, setApproving] = useState<any | null>(null);
  const [declining, setDeclining] = useState<any | null>(null);

  const load = useCallback(() => {
    setRows(null);
    marketplaceService.requests(status).then((r) => setRows(unwrap(r) || []))
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load requests.") }));
  }, [status, toast]);
  useEffect(load, [load]);
  const done = () => { setApproving(null); setDeclining(null); load(); onChanged(); };

  return (
    <NcCard className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap gap-1.5">
        {[["pending", "Waiting"], ["approved", "Approved"], ["declined", "Declined"], ["all", "All"]].map(([k, l]) => (
          <button key={k} onClick={() => setStatus(k)}
            className={cn("rounded-full border px-3 py-1 text-[12.5px]", status === k ? "border-plum bg-plum text-white" : "border-border text-nc-dark hover:border-teal")}>{l}</button>
        ))}
      </div>
      {rows === null ? <div className="py-12 text-center text-sm text-nc-muted">Loading…</div> : rows.length === 0 ? (
        <div className="py-12 text-center text-[13px] text-nc-muted">{status === "pending" ? "No requests waiting." : "Nothing here."}</div>
      ) : (
        <div className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r._id} className="flex flex-wrap items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] text-nc-dark">
                  <span className="font-semibold">{r.user.fullName}</span>
                  <span className="text-nc-muted"> ({r.user.role}{r.user.role === "murabbi" && r.user.tier ? `, Tier ${r.user.tier}` : ""}) asks for </span>
                  <span className="font-semibold">{r.course.title}</span>
                </div>
                <div className="text-[11.5px] text-nc-muted">{r.user.email} · {formatDate(r.createdAt)}</div>
                {r.note && <p dir="auto" className="mt-1 text-[12.5px] text-nc-dark">“{r.note}”</p>}
                <div className="mt-1 text-[12px] text-nc-muted">
                  Completed: {r.completed.length ? r.completed.map((c: any) => c.title).join(", ") : "nothing yet"}
                </div>
                {r.status !== "pending" && (
                  <div className="mt-1 text-[12px] text-nc-muted">
                    {REQ_META[r.status]?.label}{r.decidedBy ? ` by ${r.decidedBy.fullName}` : ""}{r.decidedAt ? ` · ${formatDate(r.decidedAt)}` : ""}{r.reason ? ` · “${r.reason}”` : ""}
                  </div>
                )}
              </div>
              {r.status === "pending" ? (
                <div className="flex gap-2">
                  <button className="btn-primary flex items-center gap-1 !py-1.5 text-[12.5px]" onClick={() => setApproving(r)}><Check className="h-3.5 w-3.5" /> Approve</button>
                  <button className="btn-outline flex items-center gap-1 !py-1.5 text-[12.5px]" onClick={() => setDeclining(r)}><X className="h-3.5 w-3.5" /> Decline</button>
                </div>
              ) : (
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", REQ_META[r.status]?.cls)}>{REQ_META[r.status]?.label}</span>
              )}
            </div>
          ))}
        </div>
      )}
      {approving && <ApproveModal r={approving} onClose={() => setApproving(null)} onDone={done} />}
      {declining && <DeclineModal r={declining} onClose={() => setDeclining(null)} onDone={done} />}
    </NcCard>
  );
}

function ApproveModal({ r, onClose, onDone }: { r: any; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      toast({ title: apiMessage(await marketplaceService.approve(r._id, { dueDate: dueDate || undefined, note: note.trim() || undefined }), "Approved.") });
      onDone();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not approve.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Approve the request" subtitle={`${r.course.title} opens for ${r.user.fullName}; they get a notification and an email.`}>
      <FormGroup label="Complete by (optional)"><FormInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></FormGroup>
      <FormGroup label="Note to them (optional)"><FormTextarea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} /></FormGroup>
      <button className="btn-primary w-full" disabled={saving} onClick={save}>{saving ? "Approving…" : "Approve and open the training"}</button>
    </Modal>
  );
}

function DeclineModal({ r, onClose, onDone }: { r: any; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      toast({ title: apiMessage(await marketplaceService.decline(r._id, reason.trim() || undefined), "Declined.") });
      onDone();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not decline.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Decline the request" subtitle={`${r.user.fullName} is told by notification and email, and can ask again later.`}>
      <FormGroup label="Reason (sent to them)"><FormTextarea dir="auto" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Please complete your practical session first." /></FormGroup>
      <button className="btn-primary w-full" disabled={saving} onClick={save}>{saving ? "Declining…" : "Decline"}</button>
    </Modal>
  );
}

// ── Tier upgrades ───────────────────────────────────────────────────────────

function TierTab({ rows, onChanged }: { rows: any[]; onChanged: () => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function approve(t: any) {
    setBusy(t.user._id);
    try {
      toast({ title: apiMessage(await marketplaceService.approveTier(t.user._id, t.tier), "Tier updated.") });
      onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not update the tier.") });
    } finally {
      setBusy(null);
    }
  }

  return (
    <NcCard className="p-4 sm:p-6">
      <p className="mb-4 text-[12.5px] text-nc-muted">Murabbis certified in a tier training above their current tier. Moving them up changes their tier everywhere in the portal.</p>
      {rows.length === 0 ? <div className="py-12 text-center text-[13px] text-nc-muted">No one is waiting to move up.</div> : (
        <div className="divide-y divide-border">
          {rows.map((t) => (
            <div key={t.user._id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-nc-dark">{t.user.fullName}</div>
                <div className="text-[11.5px] text-nc-muted">{t.user.email} · certified in {t.course}{t.certifiedAt ? ` on ${formatDate(t.certifiedAt)}` : ""}</div>
              </div>
              <span className="text-[12.5px] text-nc-dark">Tier {t.user.tier} → <span className="font-semibold">Tier {t.tier}</span></span>
              <button className="btn-primary flex items-center gap-1 !py-1.5 text-[12.5px]" disabled={busy === t.user._id} onClick={() => approve(t)}>
                <ArrowUpCircle className="h-3.5 w-3.5" /> Move to Tier {t.tier}
              </button>
            </div>
          ))}
        </div>
      )}
    </NcCard>
  );
}
