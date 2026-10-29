import { useEffect, useMemo, useState } from "react";
import { Home, Inbox, KeyRound, Mail, MapPin, MessageCircle, Phone, Sparkles, Trash2, UserCheck, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { accountService, interestService, InterestStatus } from "@/services/api.service";
import StatCard from "@/components/shared/StatCard";
import NcCard from "@/components/shared/NcCard";
import DeleteConfirmModal from "@/components/shared/DeleteConfirmModal";
import Modal from "@/components/shared/Modal";
import CredentialsModal, { IssuedCredentials } from "@/components/shared/CredentialsModal";
import { apiError, unwrap } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/contact";

interface InterestRequest {
  _id          : string;
  role         : "parent" | "mentor" | "host";
  firstName    : string;
  lastName     : string;
  email        : string;
  phone        : string;
  city         : string;
  neighbourhood: string;
  roleDetail   : string;
  status       : InterestStatus;
  notes        : string;
  createdAt    : string;
  /** The portal account created from this request, if any. */
  account      : { _id: string; email: string; role: string; isActive: boolean; mustChangePassword: boolean; lastLoginAt: string | null } | null;
}

const ROLE_META = {
  parent: { label: "Parent", detail: "Child's age",     Icon: Users,    cls: "bg-plum-lt text-plum" },
  mentor: { label: "Mentor", detail: "Background",      Icon: Sparkles, cls: "bg-gold-lt text-gold-dim" },
  host  : { label: "Host",   detail: "Available space", Icon: Home,     cls: "bg-nc-green-lt text-nc-green" },
} as const;

const STATUS_META: Record<InterestStatus, { label: string; cls: string }> = {
  new      : { label: "New",       cls: "bg-gold text-gold-foreground" },
  contacted: { label: "Contacted", cls: "bg-plum-lt text-plum" },
  closed   : { label: "Closed",    cls: "bg-muted text-nc-muted" },
};

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function InterestPage() {
  const { toast } = useToast();
  const [items, setItems]           = useState<InterestRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [statusTab, setStatusTab]   = useState<InterestStatus | "all">("new");
  const [roleFilter, setRoleFilter] = useState<"" | InterestRequest["role"]>("");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [toDelete, setToDelete]     = useState<InterestRequest | null>(null);
  const [toConvert, setToConvert]   = useState<InterestRequest | null>(null);
  const [issued, setIssued]         = useState<{ data: IssuedCredentials; title: string } | null>(null);

  async function resetPassword(item: InterestRequest) {
    if (!item.account) return;
    if (!window.confirm(`Issue a new temporary password for ${item.firstName} ${item.lastName}? Their current password will stop working.`)) return;
    try {
      const data = unwrap<IssuedCredentials>(await accountService.resetPassword(item.account._id));
      setIssued({ data, title: "New temporary password" });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not reset the password.") });
    }
  }

  async function load() {
    try {
      const r = await interestService.getAll();
      setItems(r.data.data || r.data || []);
    } catch {
      toast({ variant: "destructive", title: "Could not load interest requests." });
    } finally {
      setLoading(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    all      : items.length,
    new      : items.filter((i) => i.status === "new").length,
    contacted: items.filter((i) => i.status === "contacted").length,
    closed   : items.filter((i) => i.status === "closed").length,
  }), [items]);

  const visible = items.filter((i) =>
    (statusTab === "all" || i.status === statusTab) && (!roleFilter || i.role === roleFilter));

  async function patch(item: InterestRequest, data: { status?: InterestStatus; notes?: string }, okMsg: string) {
    try {
      const r = await interestService.update(item._id, data);
      const updated = (r.data.data || r.data).interest as InterestRequest;
      setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, ...updated } : i)));
      toast({ title: okMsg });
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Update failed." });
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await interestService.remove(toDelete._id);
      setItems((prev) => prev.filter((i) => i._id !== toDelete._id));
      toast({ title: "Interest request deleted." });
    } catch {
      toast({ variant: "destructive", title: "Delete failed." });
    } finally {
      setToDelete(null);
    }
  }

  return (
    <div className="page-animate">
      <div className="mb-6">
        <h2 className="font-serif text-[26px] text-nc-dark">Interest Requests</h2>
        <p className="mt-1 text-[13.5px] text-nc-muted">
          Parents, mentors and hosts who used “Find your place” on the website. Follow up and track each one here.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:gap-4">
        <StatCard label="New"       value={counts.new}       meta="Awaiting first contact" color="gold" />
        <StatCard label="Contacted" value={counts.contacted} meta="In conversation"        color="teal" />
        <StatCard label="Closed"    value={counts.closed}    meta="Completed or declined"  color="green" />
        <StatCard label="Total"     value={counts.all}       meta="All time"               color="purple" />
      </div>

      <NcCard className="p-4 sm:p-6">
        {/* Filters */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by status">
            {(["new", "contacted", "closed", "all"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={statusTab === s}
                onClick={() => setStatusTab(s)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                  statusTab === s ? "bg-primary text-primary-foreground" : "bg-muted text-nc-muted hover:text-nc-dark",
                )}
              >
                {s === "all" ? "All" : STATUS_META[s].label}
                <span className="ml-1.5 opacity-75">{counts[s]}</span>
              </button>
            ))}
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            className="h-9 rounded-md border border-input bg-card px-3 text-[13px] text-foreground focus:border-primary focus:outline-none"
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            <option value="parent">Parents</option>
            <option value="mentor">Mentors</option>
            <option value="host">Hosts</option>
          </select>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-nc-muted">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Inbox className="mb-3 h-9 w-9 text-pale" strokeWidth={1.5} />
            <div className="text-sm font-medium text-nc-dark">
              {items.length === 0 ? "No interest requests yet" : "Nothing here"}
            </div>
            <div className="mt-1 max-w-sm text-[12.5px] text-nc-muted">
              {items.length === 0
                ? "Submissions from the website's “Find your place” form will appear here."
                : "No requests match these filters."}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((item) => {
              const role  = ROLE_META[item.role];
              const draft = notesDraft[item._id] ?? item.notes;
              return (
                <article
                  key={item._id}
                  className={cn(
                    "rounded-lg border p-4 transition-colors sm:p-5",
                    item.status === "new" ? "border-gold/50 bg-gold-lt/40" : "border-border bg-card",
                  )}
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full", role.cls)}>
                      <role.Icon className="h-[18px] w-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-semibold text-nc-dark">{item.firstName} {item.lastName}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", role.cls)}>{role.label}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_META[item.status].cls)}>
                          {STATUS_META[item.status].label}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-nc-muted">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.neighbourhood}, {item.city}</span>
                        {item.roleDetail && <span>{role.detail}: <span className="text-foreground">{item.roleDetail}</span></span>}
                        <span>{timeAgo(item.createdAt)}</span>
                      </div>
                    </div>
                    <select
                      value={item.status}
                      onChange={(e) => patch(item, { status: e.target.value as InterestStatus }, `Marked as ${STATUS_META[e.target.value as InterestStatus].label.toLowerCase()}.`)}
                      className="h-9 rounded-md border border-input bg-card px-2.5 text-[12.5px] focus:border-primary focus:outline-none"
                      aria-label={`Status for ${item.firstName} ${item.lastName}`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  {/* Contact */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={`mailto:${item.email}`} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12.5px] text-nc-dark hover:border-primary hover:text-primary">
                      <Mail className="h-3.5 w-3.5" /> {item.email}
                    </a>
                    <a href={`tel:${item.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12.5px] text-nc-dark hover:border-primary hover:text-primary">
                      <Phone className="h-3.5 w-3.5" /> {item.phone}
                    </a>
                    <a href={whatsappLink(item.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12.5px] text-nc-green hover:border-nc-green">
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  </div>

                  {/* Portal account */}
                  {item.role !== "host" && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border bg-card/60 px-3 py-2">
                      {item.account ? (
                        <>
                          <UserCheck className="h-4 w-4 text-nc-green" />
                          <span className="text-[12.5px] text-nc-dark">
                            <span className="font-semibold">{item.account.role === "parent" ? "Parent" : "Murabbi"} account</span>
                            <span className="text-nc-muted">
                              {" · "}{!item.account.isActive ? "sign-in blocked"
                                : item.account.lastLoginAt ? `last signed in ${timeAgo(item.account.lastLoginAt)}`
                                : "hasn’t signed in yet"}
                            </span>
                          </span>
                          <button className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] text-nc-dark hover:border-primary hover:text-primary"
                            onClick={() => resetPassword(item)}>
                            <KeyRound className="h-3.5 w-3.5" /> Reset password
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-[12.5px] text-nc-muted">
                            {item.role === "mentor" ? "Ready to start? Give them a murabbi login." : "Give this family a login to follow their child’s circle."}
                          </span>
                          <button className="btn-primary ml-auto !py-1.5 text-[12.5px]" onClick={() => setToConvert(item)}>
                            <UserPlus className="h-3.5 w-3.5" /> Create {item.role === "mentor" ? "murabbi" : "parent"} account
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
                    <textarea
                      value={draft}
                      onChange={(e) => setNotesDraft((d) => ({ ...d, [item._id]: e.target.value }))}
                      placeholder="Follow-up notes (only admins see these)…"
                      rows={1}
                      maxLength={1000}
                      className="min-h-[38px] flex-1 resize-y rounded-md border border-input bg-card px-3 py-2 text-[13px] focus:border-primary focus:outline-none"
                      aria-label={`Notes for ${item.firstName} ${item.lastName}`}
                    />
                    <div className="flex gap-2">
                      <button
                        className="btn-primary !py-2 disabled:opacity-40"
                        disabled={draft === item.notes}
                        onClick={() => patch(item, { notes: draft }, "Notes saved.")}
                      >
                        Save notes
                      </button>
                      <button
                        className="rounded-md p-2 text-nc-muted hover:bg-nc-red-lt hover:text-nc-red"
                        onClick={() => setToDelete(item)}
                        aria-label={`Delete request from ${item.firstName} ${item.lastName}`}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </NcCard>

      {toConvert && (
        <ConvertModal
          item={toConvert}
          onClose={() => setToConvert(null)}
          onDone={(data) => { setToConvert(null); setIssued({ data, title: "Account created" }); load(); }}
        />
      )}
      <CredentialsModal issued={issued?.data ?? null} title={issued?.title} onClose={() => setIssued(null)} />

      <DeleteConfirmModal
        open={!!toDelete}
        title="Delete interest request?"
        message={toDelete ? `${toDelete.firstName} ${toDelete.lastName}'s request will be permanently removed.` : ""}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

function ConvertModal({ item, onClose, onDone }: { item: InterestRequest; onClose: () => void; onDone: (data: IssuedCredentials) => void }) {
  const { toast } = useToast();
  const [assignTraining, setAssignTraining] = useState(true);
  const [saving, setSaving] = useState(false);
  const mentor = item.role === "mentor";
  const name = `${item.firstName} ${item.lastName}`;

  async function create() {
    setSaving(true);
    try {
      const data = unwrap<IssuedCredentials & { training?: string | null; linkedExisting?: boolean }>(
        await accountService.fromInterest(item._id, mentor ? { assignTraining } : {}));
      if (data.linkedExisting) toast({ title: "Linked to the parent already on file", description: "Their children appear on their page automatically." });
      if (mentor && assignTraining && !data.training) toast({ variant: "destructive", title: "Account created, but the training couldn’t be assigned. Assign it from Asaas Training." });
      onDone(data);
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not create the account.") });
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Create ${mentor ? "murabbi" : "parent"} account`} subtitle={`${name} · ${item.email}`}>
      <ul className="mb-5 space-y-2 text-[13px] text-nc-dark">
        {mentor ? (
          <>
            <li>• {item.firstName} signs in to the murabbi portal with <span className="font-semibold">{item.email}</span>.</li>
            <li>• You can assign their circle later from Circles.</li>
          </>
        ) : (
          <>
            <li>• {item.firstName} signs in with <span className="font-semibold">{item.email}</span> and sees their family page: attendance, this week’s topic, the calendar and notes from the murabbi.</li>
            <li>• If this parent is already on file (same email or phone), the login is linked to that record. Otherwise a new parent record is added; enrol their child to link them.</li>
          </>
        )}
        <li>• You’ll get a temporary password to share with them personally. They choose their own at first sign-in.</li>
      </ul>
      {mentor && (
        <label className="mb-5 flex cursor-pointer items-start gap-2.5 rounded-md bg-muted px-3 py-2.5 text-[13px] text-nc-dark">
          <input type="checkbox" checked={assignTraining} onChange={(e) => setAssignTraining(e.target.checked)} className="mt-0.5 accent-[hsl(var(--teal))]" />
          <span>Assign the Asaas training now <span className="block text-[12px] text-nc-muted">They’ll find it under Asaas Training when they sign in.</span></span>
        </label>
      )}
      <button className="btn-primary w-full justify-center" disabled={saving} onClick={create}>
        {saving ? "Creating…" : "Create account"}
      </button>
    </Modal>
  );
}
