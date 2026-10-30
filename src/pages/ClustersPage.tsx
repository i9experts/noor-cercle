import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, KeyRound, MapPin, Pencil, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { accountService, clustersService } from "@/services/api.service";
import NcCard from "@/components/shared/NcCard";
import Modal from "@/components/shared/Modal";
import CredentialsModal, { IssuedCredentials } from "@/components/shared/CredentialsModal";
import ClusterDashboard from "@/components/cluster/ClusterDashboard";
import VisitList from "@/components/cluster/VisitList";
import { cn } from "@/lib/utils";
import { apiError, apiMessage, unwrap } from "@/lib/finance";
import { formatDay } from "@/lib/schedule";
import { Visit } from "@/lib/cluster";

const TABS = [
  { key: "clusters", label: "Clusters" },
  { key: "supervisors", label: "Supervisors" },
  { key: "visits", label: "Visit reports" },
];

const inputCls = "h-10 w-full rounded-md border border-input bg-card px-3 text-[13.5px] focus:border-primary focus:outline-none";

export default function ClustersPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("clusters");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [newSupervisor, setNewSupervisor] = useState(false);
  const [issued, setIssued] = useState<IssuedCredentials | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    clustersService.list()
      .then((r) => setData(unwrap(r)))
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load clusters.") }))
      .finally(() => setLoading(false));
  }, [toast]);
  useEffect(load, [load]);

  async function remove(c: any) {
    if (!window.confirm(`Remove the cluster “${c.name}”? Its neighbourhoods and circles stay as they are; its visit reports are deleted.`)) return;
    try {
      toast({ title: apiMessage(await clustersService.remove(c._id), "Removed.") });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not remove.") });
    }
  }

  async function resetPassword(s: any) {
    if (!window.confirm(`Issue a new temporary password for ${s.fullName}? Their current password stops working.`)) return;
    try { setIssued(unwrap(await accountService.resetPassword(s._id))); }
    catch (err) { toast({ variant: "destructive", title: apiError(err, "Could not reset.") }); }
  }

  async function setAccess(s: any, active: boolean) {
    try {
      toast({ title: apiMessage(await accountService.setAccess(s._id, active), "Saved.") });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not change access.") });
    }
  }

  const open = data?.clusters.find((c: any) => c._id === openId);
  if (open) {
    return (
      <>
        <ClusterDetail cluster={open} onBack={() => setOpenId(null)} onEdit={() => setEditing(open)} />
        <ClusterEditor cluster={editing} data={data} onClose={() => setEditing(null)} onSaved={load} />
      </>
    );
  }

  return (
    <div className="page-animate">
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h2 className="font-serif text-[26px] text-nc-dark">Clusters</h2>
          <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
            Group neighbourhoods into clusters and give each a supervisor who visits the circles, supports the murabbis and follows up families.
            Supervisors never see Parent Insights or parents’ Asaas progress.
          </p>
        </div>
        <button className="btn-outline" onClick={() => setNewSupervisor(true)}><UserPlus className="h-4 w-4" /> New supervisor</button>
        <button className="btn-primary" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> New cluster</button>
      </div>

      <div className="mb-5 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("-mb-px border-b-2 px-3.5 py-2 text-[13.5px]", tab === t.key ? "border-plum font-semibold text-plum" : "border-transparent text-nc-muted hover:text-nc-dark")}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="py-16 text-center text-sm text-nc-muted">Loading…</div> : tab === "clusters" ? (
        <>
          {data.clusters.length === 0 && (
            <NcCard className="text-center text-[13.5px] text-nc-muted">No clusters yet. Create one and choose its neighbourhoods.</NcCard>
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.clusters.map((c: any) => (
              <NcCard key={c._id} className={cn("flex flex-col p-5", !c.isActive && "opacity-70")}>
                <div className="mb-1 flex items-start gap-2">
                  <button className="mr-auto text-left font-serif text-[20px] text-nc-dark hover:text-plum" onClick={() => setOpenId(c._id)}>{c.name}</button>
                  {!c.isActive && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-nc-muted">Paused</span>}
                  <button className="rounded p-1 text-nc-muted hover:text-teal" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}><Pencil className="h-4 w-4" /></button>
                  <button className="rounded p-1 text-nc-muted hover:text-nc-red" onClick={() => remove(c)} aria-label={`Remove ${c.name}`}><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mb-3 flex items-start gap-1.5 text-[12.5px] text-nc-muted">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <span>{c.neighbourhoods.map((n: any) => n.name).join(", ") || "No neighbourhoods yet"}{c.city ? ` · ${c.city}` : ""}</span>
                </div>
                <div className="mb-3 grid grid-cols-4 gap-2 text-center">
                  {[["Circles", c.stats.circles], ["Children", c.stats.students], ["Murabbis", c.stats.murabbis], ["Attend.", c.stats.attendance28 === null ? "—" : `${c.stats.attendance28}%`]].map(([l, v]) => (
                    <div key={l as string} className="rounded-md bg-muted/50 py-2">
                      <div className="font-serif text-[20px] leading-none text-nc-dark">{v}</div>
                      <div className="mt-1 text-[10.5px] uppercase tracking-wide text-nc-muted">{l}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-[12.5px] text-nc-dark">
                  <Users className="h-3.5 w-3.5 text-nc-muted" />
                  {c.supervisors.length ? c.supervisors.map((s: any) => s.fullName).join(", ") : <span className="text-nc-red">No supervisor</span>}
                </div>
                <div className="mt-1 text-[12px] text-nc-muted">
                  {c.stats.visits30} visit{c.stats.visits30 === 1 ? "" : "s"} in 30 days{c.stats.lastVisit ? ` · last ${formatDay(c.stats.lastVisit)}` : ""}
                </div>
                <button className="btn-outline mt-4 justify-center !py-2 text-[12.5px]" onClick={() => setOpenId(c._id)}>Open dashboard</button>
              </NcCard>
            ))}
          </div>
          {data.unassigned.length > 0 && (
            <p className="mt-5 text-[12.5px] text-nc-muted">
              <span className="font-semibold text-nc-dark">Not in a cluster yet:</span> {data.unassigned.map((n: any) => n.name).join(", ")}
            </p>
          )}
        </>
      ) : tab === "supervisors" ? (
        <NcCard className="p-4 sm:p-6">
          {data.supervisors.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-nc-muted">No supervisors yet. Use “New supervisor” to create an account.</div>
          ) : (
            <div className="-mx-4 overflow-x-auto sm:mx-0">
              <table className="w-full min-w-[720px] text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-nc-muted">
                    <th className="px-3 py-2 font-medium">Supervisor</th>
                    <th className="px-3 py-2 font-medium">Clusters</th>
                    <th className="px-3 py-2 font-medium">Last sign-in</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {data.supervisors.map((s: any) => (
                    <tr key={s._id} className="border-b border-border/60">
                      <td className="px-3 py-3">
                        <div className="font-medium text-nc-dark">{s.fullName}{!s.isActive && <span className="ml-1.5 rounded-full bg-nc-red-lt px-2 py-px text-[10.5px] text-nc-red">Blocked</span>}</div>
                        <div className="text-[11.5px] text-nc-muted">{s.email}{s.phone ? ` · ${s.phone}` : ""}</div>
                      </td>
                      <td className="px-3 py-3 text-nc-dark">{s.clusters.map((c: any) => c.name).join(", ") || <span className="text-nc-muted">None</span>}</td>
                      <td className="px-3 py-3 text-nc-dark">{s.lastLoginAt ? formatDay(s.lastLoginAt, true) : <span className="text-nc-muted">{s.mustChangePassword ? "Not yet" : "—"}</span>}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        <button className="mr-1 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[12px] hover:border-teal hover:text-teal" onClick={() => resetPassword(s)}>
                          <KeyRound className="h-3.5 w-3.5" /> Reset password
                        </button>
                        <button className="rounded-md border border-border px-2 py-1 text-[12px] hover:border-teal hover:text-teal" onClick={() => setAccess(s, !s.isActive)}>
                          {s.isActive ? "Block" : "Allow"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-[12px] text-nc-muted">Add or remove a supervisor’s clusters by editing the cluster.</p>
        </NcCard>
      ) : (
        <AllVisits clusters={data.clusters} />
      )}

      <ClusterEditor cluster={editing} data={data} onClose={() => setEditing(null)} onSaved={load} />
      <NewSupervisor open={newSupervisor} clusters={data?.clusters ?? []} onClose={() => setNewSupervisor(false)} onCreated={(c) => { setIssued(c); load(); }} />
      <CredentialsModal issued={issued} title="Supervisor account ready" onClose={() => setIssued(null)} />
    </div>
  );
}

// ── One cluster: its dashboard and visit reports ────────────────────────────

function ClusterDetail({ cluster, onBack, onEdit }: { cluster: any; onBack: () => void; onEdit: () => void }) {
  const { toast } = useToast();
  const [dash, setDash] = useState<any>(null);
  const [visits, setVisits] = useState<Visit[]>([]);

  const load = useCallback(() => {
    Promise.all([clustersService.dashboard(cluster._id), clustersService.visits({ clusterId: cluster._id })])
      .then(([d, v]) => { setDash(unwrap(d)); setVisits(unwrap<any>(v).visits); })
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load the cluster.") }));
  }, [cluster._id, toast]);
  useEffect(load, [load]);

  return (
    <div className="page-animate">
      <button className="mb-3 flex items-center gap-1 text-[13px] text-nc-muted hover:text-nc-dark" onClick={onBack}><ArrowLeft className="h-4 w-4" /> All clusters</button>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h2 className="font-serif text-[26px] text-nc-dark">{cluster.name}</h2>
          <p className="mt-1 text-[13px] text-nc-muted">
            {cluster.neighbourhoods.map((n: any) => n.name).join(", ") || "No neighbourhoods"} · Supervised by {cluster.supervisors.map((s: any) => s.fullName).join(", ") || "nobody yet"}
          </p>
        </div>
        <button className="btn-outline" onClick={onEdit}><Pencil className="h-4 w-4" /> Edit cluster</button>
      </div>
      {dash ? <ClusterDashboard data={dash} /> : <div className="py-16 text-center text-sm text-nc-muted">Loading…</div>}
      <h3 className="mb-3 mt-8 text-[15px] font-semibold text-nc-dark">Visit reports</h3>
      <VisitList
        visits={visits}
        canDelete={() => true}
        onFollowUp={async (v, fid, done) => {
          try { await clustersService.followUp(v._id, fid, done); load(); }
          catch (err) { toast({ variant: "destructive", title: apiError(err, "Could not update.") }); }
        }}
        onDelete={async (v) => {
          if (!window.confirm("Remove this visit report?")) return;
          try { await clustersService.deleteVisit(v._id); load(); }
          catch (err) { toast({ variant: "destructive", title: apiError(err, "Could not remove.") }); }
        }}
      />
    </div>
  );
}

function AllVisits({ clusters }: { clusters: any[] }) {
  const { toast } = useToast();
  const [clusterId, setClusterId] = useState("");
  const [visits, setVisits] = useState<Visit[] | null>(null);

  const load = useCallback(() => {
    clustersService.visits(clusterId ? { clusterId } : {})
      .then((r) => setVisits(unwrap<any>(r).visits))
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load visits.") }));
  }, [clusterId, toast]);
  useEffect(load, [load]);

  return (
    <div>
      <select value={clusterId} onChange={(e) => setClusterId(e.target.value)} aria-label="Cluster" className={cn(inputCls, "mb-4 w-auto")}>
        <option value="">All clusters</option>
        {clusters.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
      </select>
      {visits === null ? <div className="py-16 text-center text-sm text-nc-muted">Loading…</div> : (
        <VisitList visits={visits} showCluster onFollowUp={async (v, fid, done) => {
          try { await clustersService.followUp(v._id, fid, done); load(); }
          catch (err) { toast({ variant: "destructive", title: apiError(err, "Could not update.") }); }
        }} />
      )}
    </div>
  );
}

// ── Create / edit a cluster ─────────────────────────────────────────────────

function ClusterEditor({ cluster, data, onClose, onSaved }: { cluster: any | null; data: any; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState(true);
  const [nbh, setNbh] = useState<string[]>([]);
  const [sups, setSups] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const isNew = cluster && !cluster._id;

  useEffect(() => {
    if (!cluster) return;
    setName(cluster.name ?? ""); setCity(cluster.city ?? ""); setNotes(cluster.notes ?? ""); setActive(cluster.isActive ?? true);
    setNbh((cluster.neighbourhoods ?? []).map((n: any) => n._id)); setSups((cluster.supervisors ?? []).map((s: any) => s._id));
  }, [cluster]);

  if (!cluster || !data) return null;
  const toggle = (set: (f: (v: string[]) => string[]) => void, id: string) => set((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  const clusterName = (id: string | null) => data.clusters.find((c: any) => c._id === id)?.name;

  async function save() {
    setBusy(true);
    const body = { name, city, notes, isActive: active, neighbourhoodIds: nbh, supervisorIds: sups };
    try {
      const r = isNew ? await clustersService.create(body) : await clustersService.update(cluster._id, body);
      toast({ title: apiMessage(r, "Saved.") });
      onSaved();
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save the cluster.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isNew ? "New cluster" : `Edit ${cluster.name}`} subtitle="A neighbourhood can be in one cluster at a time.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Name *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="e.g. Gulshan Cluster" className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">City</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} placeholder="Karachi" className={inputCls} /></label>
      </div>

      <div className="mb-1.5 mt-4 text-[12.5px] font-medium text-slate">Neighbourhoods</div>
      <div className="max-h-52 overflow-y-auto rounded-md border border-border">
        {data.neighbourhoods.length === 0 && <div className="px-3 py-4 text-[12.5px] text-nc-muted">Add neighbourhoods first (Operations → Neighbourhoods).</div>}
        {data.neighbourhoods.map((n: any) => {
          const elsewhere = n.cluster && n.cluster !== cluster._id;
          return (
            <label key={n._id} className={cn("flex items-center gap-2.5 px-3 py-1.5 text-[13px]", elsewhere ? "cursor-not-allowed text-nc-muted" : "cursor-pointer hover:bg-muted/40")}>
              <input type="checkbox" disabled={elsewhere} checked={nbh.includes(n._id)} onChange={() => toggle(setNbh, n._id)} className="accent-[hsl(var(--teal))]" />
              <span className="flex-1">{n.name}{n.city ? <span className="text-nc-muted"> · {n.city}</span> : null}</span>
              {elsewhere && <span className="text-[11px]">in {clusterName(n.cluster)}</span>}
            </label>
          );
        })}
      </div>

      <div className="mb-1.5 mt-4 text-[12.5px] font-medium text-slate">Supervisors</div>
      <div className="max-h-40 overflow-y-auto rounded-md border border-border">
        {data.supervisors.length === 0 && <div className="px-3 py-4 text-[12.5px] text-nc-muted">No supervisor accounts yet. Use “New supervisor” first.</div>}
        {data.supervisors.map((s: any) => (
          <label key={s._id} className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-[13px] hover:bg-muted/40">
            <input type="checkbox" checked={sups.includes(s._id)} onChange={() => toggle(setSups, s._id)} className="accent-[hsl(var(--teal))]" />
            <span className="flex-1">{s.fullName}</span>
            <span className="text-[11px] text-nc-muted">{s.clusters.filter((c: any) => c._id !== cluster._id).map((c: any) => c.name).join(", ")}</span>
          </label>
        ))}
      </div>

      <label className="mt-4 block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Notes</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={1000}
          className="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-[13.5px] focus:border-primary focus:outline-none" /></label>
      {!isNew && (
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px] text-nc-dark">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-[hsl(var(--teal))]" />
          Active (a paused cluster is hidden from its supervisors)
        </label>
      )}
      <div className="mt-6 flex gap-2">
        <button className="btn-primary flex-1 justify-center" disabled={!name.trim() || busy} onClick={save}>{busy ? "Saving…" : isNew ? "Create cluster" : "Save changes"}</button>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function NewSupervisor({ open, clusters, onClose, onCreated }: { open: boolean; clusters: any[]; onClose: () => void; onCreated: (c: IssuedCredentials) => void }) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setFullName(""); setEmail(""); setPhone(""); setIds([]); } }, [open]);

  async function save() {
    setBusy(true);
    try {
      const r = await clustersService.createSupervisor({ fullName, email, ...(phone.trim() && { phone }), clusterIds: ids });
      onClose();
      onCreated(unwrap(r));
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not create the account.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New cluster supervisor" subtitle="They get a temporary password to share, and an email to choose their own.">
      <label className="mb-3 block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Full name *</span>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={60} className={inputCls} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Email *</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Phone (for WhatsApp)</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="0300 1234567" className={inputCls} /></label>
      </div>
      {clusters.length > 0 && (
        <>
          <div className="mb-1.5 mt-4 text-[12.5px] font-medium text-slate">Clusters</div>
          <div className="max-h-44 overflow-y-auto rounded-md border border-border">
            {clusters.map((c) => (
              <label key={c._id} className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-[13px] hover:bg-muted/40">
                <input type="checkbox" checked={ids.includes(c._id)} className="accent-[hsl(var(--teal))]"
                  onChange={() => setIds((v) => (v.includes(c._id) ? v.filter((x) => x !== c._id) : [...v, c._id]))} />
                {c.name}
              </label>
            ))}
          </div>
        </>
      )}
      <div className="mt-6 flex gap-2">
        <button className="btn-primary flex-1 justify-center" disabled={!fullName.trim() || !email.trim() || busy} onClick={save}>{busy ? "Creating…" : "Create account"}</button>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
