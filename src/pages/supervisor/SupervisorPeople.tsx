import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, MapPin, MessageCircle, Pencil, Phone, Plus, Search, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supervisorService } from "@/services/api.service";
import NcCard from "@/components/shared/NcCard";
import Modal from "@/components/shared/Modal";
import CredentialsModal, { IssuedCredentials } from "@/components/shared/CredentialsModal";
import { cn } from "@/lib/utils";
import { apiError, apiMessage, unwrap } from "@/lib/finance";
import { formatDay } from "@/lib/schedule";
import { whatsappLink } from "@/lib/contact";
import type { SupervisorShared } from "./SupervisorIndex";

const inputCls = "h-10 w-full rounded-md border border-input bg-card px-3 text-[13.5px] focus:border-primary focus:outline-none";

// ── Children ────────────────────────────────────────────────────────────────

export function SupervisorChildren({ shared, enrolOpen, setEnrolOpen }: {
  shared: SupervisorShared; enrolOpen: boolean; setEnrolOpen: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const [students, setStudents] = useState<any[] | null>(null);
  const [circleId, setCircleId] = useState("");
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const circles = (shared.dashboard?.circles ?? []).filter((c) => c.isActive);

  const load = useCallback(() => {
    supervisorService.students().then((r) => setStudents(unwrap<any>(r).students))
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load children.") }));
  }, [toast]);
  useEffect(load, [load]);

  const q = search.trim().toLowerCase();
  const rows = (students ?? [])
    .filter((s) => showInactive || s.isActive)
    .filter((s) => !circleId || s.circle?._id === circleId)
    .filter((s) => !q || [s.fullName, s.fatherName, s.phone].some((v: string | undefined) => v?.toLowerCase().includes(q)));

  async function setActive(s: any, active: boolean) {
    if (!active && !window.confirm(`Mark ${s.fullName} as no longer attending?`)) return;
    try {
      toast({ title: apiMessage(await supervisorService.setActive(s._id, active), "Saved.") });
      load(); shared.reload();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not update.") });
    }
  }

  return (
    <div className="page-animate">
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h2 className="font-serif text-[26px] text-nc-dark">Children</h2>
          <p className="mt-1 text-[13.5px] text-nc-muted">Enrol children into your circles, update their details or move them to another circle.</p>
        </div>
        <button className="btn-primary" onClick={() => setEnrolOpen(true)} disabled={!circles.length}><Plus className="h-4 w-4" /> Enrol a child</button>
      </div>
      <NcCard className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-nc-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, father, phone…" aria-label="Search children"
              className="h-9 w-52 rounded-md border border-input bg-card pl-8 pr-3 text-[13px] focus:border-primary focus:outline-none" />
          </div>
          <select value={circleId} onChange={(e) => setCircleId(e.target.value)} aria-label="Circle"
            className="h-9 rounded-md border border-input bg-card px-2.5 text-[13px] focus:border-primary focus:outline-none">
            <option value="">All circles</option>
            {circles.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[12.5px] text-nc-muted">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="accent-[hsl(var(--teal))]" />
            Show children who left
          </label>
        </div>
        {!students ? <div className="py-16 text-center text-sm text-nc-muted">Loading…</div> : rows.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-nc-muted">No children match.</div>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[680px] text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-nc-muted">
                  <th className="px-3 py-2 font-medium">Child</th>
                  <th className="px-3 py-2 font-medium">Circle</th>
                  <th className="px-3 py-2 font-medium">Contact</th>
                  <th className="px-3 py-2 font-medium">Joined</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s._id} className={cn("border-b border-border/60", !s.isActive && "opacity-60")}>
                    <td className="px-3 py-3">
                      <div className="font-medium text-nc-dark">{s.fullName}</div>
                      <div className="text-[11.5px] text-nc-muted">c/o {s.fatherName}</div>
                    </td>
                    <td className="px-3 py-3 text-nc-dark">{s.circle?.name ?? "—"}</td>
                    <td className="px-3 py-3 text-nc-dark">{s.phone}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-nc-dark">{formatDay(s.enrollmentDate, true)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <button className="mr-1 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[12px] hover:border-teal hover:text-teal" onClick={() => setEditing(s)} aria-label={`Edit ${s.fullName}`}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button className="rounded-md border border-border px-2 py-1 text-[12px] hover:border-teal hover:text-teal" onClick={() => setActive(s, !s.isActive)}>
                        {s.isActive ? "Left" : "Back"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NcCard>
      <ChildForm open={enrolOpen || !!editing} child={editing} circles={circles}
        onClose={() => { setEnrolOpen(false); setEditing(null); }} onSaved={() => { load(); shared.reload(); }} />
    </div>
  );
}

function ChildForm({ open, child, circles, onClose, onSaved }: { open: boolean; child: any | null; circles: any[]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setF({
      fullName: child?.fullName ?? "", fatherName: child?.fatherName ?? "", phone: child?.phone ?? "", email: child?.email ?? "",
      address: child?.address ?? "", circleId: child?.circle?._id ?? (circles.length === 1 ? circles[0]._id : ""),
    });
  }, [open, child, circles]);

  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));

  async function save() {
    setBusy(true);
    try {
      if (child) {
        const details: Record<string, string> = { fullName: f.fullName, fatherName: f.fatherName, phone: f.phone };
        if (f.email.trim()) details.email = f.email.trim();
        if (f.address.trim()) details.address = f.address.trim();
        await supervisorService.updateStudent(child._id, details);
        if (f.circleId && f.circleId !== child.circle?._id) await supervisorService.moveStudent(child._id, f.circleId);
        toast({ title: "Saved." });
      } else {
        const circle = circles.find((c) => c._id === f.circleId);
        const r = await supervisorService.enrol({
          fullName: f.fullName, fatherName: f.fatherName, phone: f.phone, circleId: f.circleId,
          neighbourhoodId: circle?.neighbourhood?._id, ...(f.email.trim() && { email: f.email.trim() }), ...(f.address.trim() && { address: f.address.trim() }),
        });
        toast({ title: apiMessage(r, "Enrolled.") });
      }
      onSaved();
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={child ? `Edit ${child.fullName}` : "Enrol a child"}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Child’s name *</span>
          <input value={f.fullName ?? ""} onChange={(e) => set("fullName", e.target.value)} maxLength={100} className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Father’s name *</span>
          <input value={f.fatherName ?? ""} onChange={(e) => set("fatherName", e.target.value)} maxLength={100} className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Phone *</span>
          <input value={f.phone ?? ""} onChange={(e) => set("phone", e.target.value)} maxLength={20} placeholder="0300 1234567" className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Email</span>
          <input type="email" value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} maxLength={120} className={inputCls} /></label>
        <label className="block sm:col-span-2"><span className="mb-1 block text-[12.5px] font-medium text-slate">Circle *</span>
          <select value={f.circleId ?? ""} onChange={(e) => set("circleId", e.target.value)} className={inputCls}>
            <option value="">Choose…</option>
            {circles.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.students}/{c.capacity})</option>)}
          </select></label>
        <label className="block sm:col-span-2"><span className="mb-1 block text-[12.5px] font-medium text-slate">Address</span>
          <input value={f.address ?? ""} onChange={(e) => set("address", e.target.value)} maxLength={200} className={inputCls} /></label>
      </div>
      <div className="mt-6 flex gap-2">
        <button className="btn-primary flex-1 justify-center" disabled={!f.fullName?.trim() || !f.fatherName?.trim() || !f.phone?.trim() || !f.circleId || busy} onClick={save}>
          {busy ? "Saving…" : child ? "Save changes" : "Enrol"}
        </button>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

// ── Interest requests from the website ──────────────────────────────────────

const ROLE_LABEL: Record<string, string> = { parent: "Parent", mentor: "Wants to be a murabbi", host: "Offers a space" };
const STATUS_CLS: Record<string, string> = { new: "bg-gold text-gold-foreground", contacted: "bg-plum-lt text-plum", closed: "bg-muted text-nc-muted" };

export function SupervisorInterest({ onChanged }: { onChanged: () => void }) {
  const { toast } = useToast();
  const [items, setItems] = useState<any[] | null>(null);
  const [status, setStatus] = useState("open");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [toConvert, setToConvert] = useState<any | null>(null);
  const [issued, setIssued] = useState<IssuedCredentials | null>(null);

  const load = useCallback(() => {
    supervisorService.interest().then((r) => setItems(unwrap<any>(r).requests))
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load requests.") }));
  }, [toast]);
  useEffect(load, [load]);

  const visible = useMemo(() => (items ?? []).filter((i) => status === "all" || (status === "open" ? i.status !== "closed" : i.status === status)), [items, status]);

  async function patch(item: any, data: { status?: string; notes?: string }) {
    try {
      const r = await supervisorService.updateInterest(item._id, data);
      toast({ title: apiMessage(r, "Saved.") });
      load(); onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save.") });
    }
  }

  return (
    <div className="page-animate">
      <h2 className="font-serif text-[26px] text-nc-dark">Interest Requests</h2>
      <p className="mb-5 mt-1 max-w-2xl text-[13.5px] text-nc-muted">
        Families and volunteers from your neighbourhoods who used “Find your place” on the website. Call them, note what you agreed and
        create their portal account when they’re ready.
      </p>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {[["open", "Open"], ["new", "New"], ["contacted", "Contacted"], ["closed", "Closed"], ["all", "All"]].map(([k, l]) => (
          <button key={k} onClick={() => setStatus(k)}
            className={cn("rounded-full border px-3 py-1 text-[12.5px]", status === k ? "border-plum bg-plum text-white" : "border-border text-nc-dark hover:border-teal")}>{l}</button>
        ))}
      </div>
      {!items ? <div className="py-16 text-center text-sm text-nc-muted">Loading…</div> : visible.length === 0 ? (
        <NcCard className="text-center text-[13.5px] text-nc-muted">No requests here.</NcCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((i) => {
            const draft = notes[i._id] ?? i.notes ?? "";
            return (
              <NcCard key={i._id} className="p-5">
                <div className="mb-2 flex items-start gap-2">
                  <div className="mr-auto">
                    <div className="font-serif text-[19px] text-nc-dark">{i.firstName} {i.lastName}</div>
                    <div className="text-[12px] text-nc-muted">{ROLE_LABEL[i.role]}{i.roleDetail ? ` · ${i.roleDetail}` : ""} · {formatDay(i.createdAt, true)}</div>
                  </div>
                  <select value={i.status} onChange={(e) => patch(i, { status: e.target.value })} aria-label="Status"
                    className={cn("rounded-full border-0 px-2.5 py-1 text-[11.5px] font-semibold", STATUS_CLS[i.status])}>
                    <option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option>
                  </select>
                </div>
                <div className="space-y-1 text-[12.5px] text-nc-dark">
                  <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-nc-muted" /> {i.neighbourhood}, {i.city}</div>
                  <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-nc-muted" /> {i.phone}</div>
                  <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-nc-muted" /> {i.email}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a className="btn-outline !py-1.5 text-[12.5px]" href={whatsappLink(i.phone)} target="_blank" rel="noreferrer"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
                  {i.account ? (
                    <span className="self-center rounded-full bg-nc-green-lt px-2.5 py-1 text-[11.5px] font-semibold text-nc-green">
                      Account created{i.account.lastLoginAt ? " · signed in" : ""}
                    </span>
                  ) : i.role !== "host" && (
                    <button className="btn-primary ml-auto !py-1.5 text-[12.5px]" onClick={() => setToConvert(i)}><UserPlus className="h-3.5 w-3.5" /> Create account</button>
                  )}
                </div>
                <textarea dir="auto" value={draft} onChange={(e) => setNotes((n) => ({ ...n, [i._id]: e.target.value }))} rows={2} maxLength={1000}
                  placeholder="Notes: when you called, what you agreed…" aria-label="Notes"
                  className="mt-3 w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-[13px] focus:border-primary focus:outline-none" />
                {draft !== (i.notes ?? "") && (
                  <button className="mt-1 text-[12.5px] font-medium text-teal hover:underline" onClick={() => patch(i, { notes: draft })}>Save notes</button>
                )}
              </NcCard>
            );
          })}
        </div>
      )}

      {toConvert && (
        <ConvertModal item={toConvert} onClose={() => setToConvert(null)} onDone={(d) => { setToConvert(null); setIssued(d); load(); onChanged(); }} />
      )}
      <CredentialsModal issued={issued} title="Account created" onClose={() => setIssued(null)} />
    </div>
  );
}

function ConvertModal({ item, onClose, onDone }: { item: any; onClose: () => void; onDone: (d: IssuedCredentials) => void }) {
  const { toast } = useToast();
  const [assignTraining, setAssignTraining] = useState(true);
  const [busy, setBusy] = useState(false);
  const mentor = item.role === "mentor";

  async function create() {
    setBusy(true);
    try {
      onDone(unwrap(await supervisorService.convertInterest(item._id, mentor ? { assignTraining } : {})));
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not create the account.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Create ${mentor ? "a murabbi" : "a parent"} account`}
      subtitle={`${item.firstName} ${item.lastName} signs in with ${item.email}. You’ll see a temporary password to share.`}>
      {mentor && (
        <label className="mb-4 flex cursor-pointer items-start gap-2.5 text-[13px] text-nc-dark">
          <input type="checkbox" checked={assignTraining} onChange={(e) => setAssignTraining(e.target.checked)} className="mt-0.5 accent-[hsl(var(--teal))]" />
          Assign the Asaas murabbi training straight away
        </label>
      )}
      {!mentor && <p className="mb-4 text-[13px] text-nc-muted">Asaas for Parents opens for them with the account.</p>}
      <div className="flex gap-2">
        <button className="btn-primary flex-1 justify-center" disabled={busy} onClick={create}>{busy ? "Creating…" : "Create account"}</button>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
