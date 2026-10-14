import { useEffect, useState } from "react";
import { CheckCircle2, Gift, GraduationCap, Plus, RefreshCw, Settings2, Trash2, Users, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminService, contributionsService, rewardsService, studentsService } from "@/services/api.service";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import Modal, { FormGroup, FormInput, FormRow, FormSelect, FormTextarea } from "@/components/shared/Modal";
import DeleteConfirmModal from "@/components/shared/DeleteConfirmModal";
import { cn } from "@/lib/utils";
import {
  PAYMENT_METHOD_LABELS, PAYOUT_METHODS, addMonths, apiError, apiMessage, currentMonth, downloadCsv, formatDate, formatPKR,
  monthLabel, recentMonths, unwrap,
} from "@/lib/finance";

type PoolStatus  = "draft" | "approved" | "completed";
type AllocStatus = "proposed" | "approved" | "paid" | "cancelled";

interface Pool {
  _id: string; month: string; budgetMode: "fixed" | "percent"; budgetValue: number; contributionsCollected: number;
  budget: number; studentSharePct: number; maxStudents: number; maxMurabbis: number; minMurabbiScore: number;
  status: PoolStatus; notes: string; approvedAt?: string;
  allocated?: number; paid?: number; recipients?: number;
}
interface Allocation {
  _id: string; recipientType: "student" | "murabbi";
  student?: { _id: string; fullName: string; circle?: { name: string } } | null;
  murabbi?: { _id: string; fullName: string; email?: string } | null;
  basisValue: number; rank: number; amount: number; status: AllocStatus; manual: boolean;
  method: string | null; reference: string; paidAt: string | null; paidBy?: { fullName: string } | null; notes: string;
}
interface PoolDetail {
  pool: Pool; allocations: Allocation[];
  totals: { budget: number; studentBudget: number; murabbiBudget: number; allocated: number; remaining: number; paid: number; toStudents: number; toMurabbis: number };
}

const POOL_STATUS: Record<PoolStatus, { label: string; cls: string }> = {
  draft    : { label: "Draft — review & approve", cls: "bg-gold text-gold-foreground" },
  approved : { label: "Approved — paying out",    cls: "bg-plum-lt text-plum" },
  completed: { label: "Completed",                cls: "bg-nc-green-lt text-nc-green" },
};
const ALLOC_STATUS: Record<AllocStatus, string> = {
  proposed : "bg-gold-lt text-gold-dim",
  approved : "bg-plum-lt text-plum",
  paid     : "bg-nc-green-lt text-nc-green",
  cancelled: "bg-muted text-nc-muted line-through",
};

const recipientName = (a: Allocation) => (a.recipientType === "student" ? a.student?.fullName : a.murabbi?.fullName) ?? "(removed)";

export default function RewardsPage() {
  const { toast } = useToast();
  const [month, setMonth]     = useState(addMonths(currentMonth(), -1)); // rewards usually close out last month
  const [pools, setPools]     = useState<Pool[]>([]);
  const [detail, setDetail]   = useState<PoolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen]           = useState(false);
  const [paying, setPaying]             = useState<Allocation | null>(null);
  const [confirm, setConfirm]           = useState<null | "approve" | "delete">(null);

  async function loadPools() {
    try { setPools(unwrap(await rewardsService.getPools()) || []); } catch { /* list is secondary */ }
  }
  async function loadPool(m = month) {
    setLoading(true);
    try {
      setDetail(unwrap(await rewardsService.getPool(m)));
    } catch (err: any) {
      setDetail(null);
      if (err?.response?.status !== 404) toast({ variant: "destructive", title: apiError(err, "Could not load the reward pool.") });
    } finally {
      setLoading(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadPool(month); }, [month]);
  useEffect(() => { loadPools(); }, []);

  /** Runs a pool action that returns the refreshed pool. */
  async function act(fn: () => Promise<any>, fallback: string) {
    setBusy(true);
    try {
      const r = await fn();
      const d = unwrap(r);
      if (d?.pool) setDetail(d);
      toast({ title: apiMessage(r) });
      loadPools();
      return true;
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, fallback) });
      return false;
    } finally {
      setBusy(false);
    }
  }

  const pool  = detail?.pool;
  const t     = detail?.totals;
  const draft = pool?.status === "draft";
  const students = detail?.allocations.filter((a) => a.recipientType === "student") ?? [];
  const murabbis = detail?.allocations.filter((a) => a.recipientType === "murabbi") ?? [];
  const monthOptions = [...new Set([...recentMonths(13, currentMonth()), ...pools.map((p) => p.month)])].sort().reverse();

  function exportCsv() {
    if (!detail) return;
    downloadCsv(`noor-circles-rewards-${month}.csv`, [
      ["Type", "Rank", "Recipient", "Circle", "Basis", "Amount (PKR)", "Status", "Method", "Reference", "Paid on", "Paid by", "Notes"],
      ...detail.allocations.map((a) => [
        a.recipientType, a.manual ? "manual" : a.rank, recipientName(a), a.student?.circle?.name ?? "",
        a.recipientType === "student" ? `${a.basisValue} points` : `score ${a.basisValue}`, a.amount, a.status,
        a.method ? PAYMENT_METHOD_LABELS[a.method] ?? a.method : "", a.reference, a.paidAt ? formatDate(a.paidAt) : "",
        a.paidBy?.fullName ?? "", a.notes,
      ]),
    ]);
  }

  return (
    <div className="page-animate">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-[26px] text-nc-dark">Reward Pool</h2>
          <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
            Each month, part of what's contributed comes back as rewards. Students are rewarded by the points they earned,
            and Murabbis by their engagement rating. The pool is proposed automatically; you review it, approve it and record each payout.
          </p>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-9 rounded-md border border-input bg-card px-3 text-[13px] focus:border-primary focus:outline-none"
          aria-label="Month"
        >
          {monthOptions.map((m) => (
            <option key={m} value={m}>{monthLabel(m)}{pools.some((p) => p.month === m) ? " •" : ""}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <NcCard><div className="py-16 text-center text-sm text-nc-muted">Loading…</div></NcCard>
      ) : !detail || !pool || !t ? (
        <CreatePool month={month} onCreated={(d) => { setDetail(d); loadPools(); }} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-3 py-1.5 text-[12px] font-semibold", POOL_STATUS[pool.status].cls)}>{POOL_STATUS[pool.status].label}</span>
            <span className="text-[12.5px] text-nc-muted">
              {pool.budgetMode === "percent"
                ? `${pool.budgetValue}% of ${formatPKR(pool.contributionsCollected)} collected in ${monthLabel(month)}`
                : `Fixed budget · ${formatPKR(pool.contributionsCollected)} collected in ${monthLabel(month)}`}
              {" · "}{pool.studentSharePct}% students / {100 - pool.studentSharePct}% Murabbis
            </span>
            <div className="ml-auto flex flex-wrap gap-2">
              <button className="btn-outline !py-2 text-[12.5px]" onClick={exportCsv}>Export CSV</button>
              {draft && (
                <>
                  <button className="btn-outline inline-flex items-center gap-1.5 !py-2 text-[12.5px]" onClick={() => setSettingsOpen(true)} disabled={busy}>
                    <Settings2 className="h-4 w-4" /> Settings
                  </button>
                  <button className="btn-outline inline-flex items-center gap-1.5 !py-2 text-[12.5px]" disabled={busy}
                    onClick={() => act(() => rewardsService.regenerate(month), "Could not regenerate.")}
                    title="Recalculate from the latest points, ratings and contributions. Rewards you added by hand are kept.">
                    <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} /> Recalculate
                  </button>
                  <button className="btn-outline inline-flex items-center gap-1.5 !py-2 text-[12.5px]" onClick={() => setAddOpen(true)} disabled={busy}>
                    <Plus className="h-4 w-4" /> Add reward
                  </button>
                  <button className="btn-primary inline-flex items-center gap-1.5 !py-2 text-[12.5px] disabled:opacity-50"
                    disabled={busy || t.allocated === 0 || t.allocated > t.budget} onClick={() => setConfirm("approve")}>
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:gap-4">
            <StatCard label="Budget" value={formatPKR(t.budget)} meta={`${formatPKR(t.studentBudget)} students · ${formatPKR(t.murabbiBudget)} Murabbis`} color="purple" />
            <StatCard label="Allocated" value={formatPKR(t.allocated)} meta={`${students.filter((a) => a.status !== "cancelled").length} students · ${murabbis.filter((a) => a.status !== "cancelled").length} Murabbis`} color="teal" />
            <StatCard label={t.remaining < 0 ? "Over budget" : "Unallocated"} value={formatPKR(Math.abs(t.remaining))} meta={t.remaining < 0 ? "Reduce amounts to approve" : "Rounding & unused share"} color={t.remaining < 0 ? "red" : "gold"} />
            <StatCard label="Paid out" value={formatPKR(t.paid)} meta={t.allocated ? `${Math.round((t.paid / t.allocated) * 100)}% of allocated` : "—"} color="green" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AllocationList
              title="Students" sub={`By points earned in ${monthLabel(month)} · top ${pool.maxStudents}`} icon={GraduationCap}
              items={students} basis={(a) => `${a.basisValue.toLocaleString("en-PK")} pts`} draft={draft} busy={busy}
              onAmount={(a, amount) => act(() => rewardsService.updateAllocation(a._id, { amount }), "Could not update.")}
              onToggle={(a) => act(() => rewardsService.updateAllocation(a._id, { status: a.status === "cancelled" ? "proposed" : "cancelled" }), "Could not update.")}
              onPay={setPaying}
            />
            <AllocationList
              title="Murabbis" sub={`By engagement rating · score ≥ ${pool.minMurabbiScore} · top ${pool.maxMurabbis}`} icon={Users}
              items={murabbis} basis={(a) => `score ${a.basisValue}`} draft={draft} busy={busy}
              onAmount={(a, amount) => act(() => rewardsService.updateAllocation(a._id, { amount }), "Could not update.")}
              onToggle={(a) => act(() => rewardsService.updateAllocation(a._id, { status: a.status === "cancelled" ? "proposed" : "cancelled" }), "Could not update.")}
              onPay={setPaying}
            />
          </div>

          {draft && (
            <div className="mt-4 text-right">
              <button className="text-[12.5px] text-nc-muted hover:text-nc-red" onClick={() => setConfirm("delete")}>Delete this draft pool</button>
            </div>
          )}

          <PoolSettingsModal open={settingsOpen} pool={pool} onClose={() => setSettingsOpen(false)}
            onSave={async (body) => { if (await act(() => rewardsService.updatePool(month, body), "Could not save settings.")) setSettingsOpen(false); }} />
          <AddRewardModal open={addOpen} onClose={() => setAddOpen(false)}
            onSave={async (body) => { if (await act(() => rewardsService.addAllocation(month, body), "Could not add reward.")) setAddOpen(false); }} />
          <PayModal allocation={paying} onClose={() => setPaying(null)}
            onSave={async (body) => { if (paying && await act(() => rewardsService.pay(paying._id, body), "Could not mark paid.")) setPaying(null); }} />
          <DeleteConfirmModal
            open={!!confirm}
            title={confirm === "approve" ? `Approve ${monthLabel(month)} rewards?` : "Delete draft pool?"}
            message={confirm === "approve"
              ? `${formatPKR(t.allocated)} to ${detail.allocations.filter((a) => a.status !== "cancelled").length} recipients. After approval amounts are locked; you then mark each reward as paid when it's given.`
              : "The pool and all its proposed rewards will be removed. You can create it again."}
            confirmLabel={confirm === "approve" ? "Approve" : "Delete"}
            variant={confirm === "approve" ? "warning" : "danger"}
            onConfirm={async () => {
              const c = confirm; setConfirm(null);
              if (c === "approve") act(() => rewardsService.approve(month), "Could not approve.");
              else if (await act(() => rewardsService.removePool(month), "Could not delete.")) setDetail(null);
            }}
            onClose={() => setConfirm(null)}
          />
        </>
      )}

      {pools.length > 0 && (
        <NcCard className="mt-6 p-4 sm:p-6">
          <CardHeader><CardTitle sub="All reward pools">History</CardTitle></CardHeader>
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-nc-muted">
                  <th className="px-3 py-2 font-medium">Month</th>
                  <th className="px-3 py-2 text-right font-medium">Collected</th>
                  <th className="px-3 py-2 text-right font-medium">Budget</th>
                  <th className="px-3 py-2 text-right font-medium">Allocated</th>
                  <th className="px-3 py-2 text-right font-medium">Paid</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pools.map((p) => (
                  <tr key={p._id} className={cn("cursor-pointer border-b border-border/60 hover:bg-muted/50", p.month === month && "bg-plum-lt/40")} onClick={() => setMonth(p.month)}>
                    <td className="px-3 py-2.5 font-medium text-nc-dark">{monthLabel(p.month)}</td>
                    <td className="px-3 py-2.5 text-right">{formatPKR(p.contributionsCollected)}</td>
                    <td className="px-3 py-2.5 text-right">{formatPKR(p.budget)}</td>
                    <td className="px-3 py-2.5 text-right">{formatPKR(p.allocated)} <span className="text-nc-muted">({p.recipients})</span></td>
                    <td className="px-3 py-2.5 text-right">{formatPKR(p.paid)}</td>
                    <td className="px-3 py-2.5"><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", POOL_STATUS[p.status].cls)}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </NcCard>
      )}
    </div>
  );
}

// ── Allocation list ───────────────────────────────────────────────────────────
function AllocationList({ title, sub, icon: Icon, items, basis, draft, busy, onAmount, onToggle, onPay }: {
  title: string; sub: string; icon: typeof Users; items: Allocation[]; basis: (a: Allocation) => string;
  draft: boolean; busy: boolean;
  onAmount: (a: Allocation, amount: number) => void; onToggle: (a: Allocation) => void; onPay: (a: Allocation) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const total = items.filter((a) => a.status !== "cancelled").reduce((s, a) => s + a.amount, 0);

  function commit(a: Allocation) {
    const v = drafts[a._id];
    if (v === undefined) return;
    const n = Math.max(0, Math.round(Number(v) || 0));
    setDrafts((d) => { const { [a._id]: _, ...rest } = d; return rest; });
    if (n !== a.amount) onAmount(a, n);
  }

  return (
    <NcCard className="p-4 sm:p-6">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-plum-lt text-plum"><Icon className="h-[18px] w-[18px]" /></div>
          <CardTitle sub={sub}>{title}</CardTitle>
        </div>
        <div className="text-right text-[13px] font-semibold text-nc-dark">{formatPKR(total)}</div>
      </CardHeader>
      {items.length === 0 ? (
        <div className="py-8 text-center text-[12.5px] text-nc-muted">
          <Gift className="mx-auto mb-2 h-7 w-7 text-pale" strokeWidth={1.5} />
          No one qualifies yet{title === "Students" ? " — award points during the month" : " — ratings fill in as sessions are submitted"}.
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((a) => (
            <div key={a._id} className={cn("flex items-center gap-3 rounded-md border border-border/70 px-3 py-2", a.status === "cancelled" && "opacity-60")}>
              <span className="w-7 flex-shrink-0 text-center text-[12px] font-semibold text-nc-muted">{a.manual ? "✎" : `#${a.rank}`}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-nc-dark">{recipientName(a)}</div>
                <div className="truncate text-[11.5px] text-nc-muted">
                  {a.manual ? "Added by admin" : basis(a)}{a.student?.circle?.name ? ` · ${a.student.circle.name}` : ""}
                  {a.status === "paid" && ` · ${PAYMENT_METHOD_LABELS[a.method ?? ""] ?? a.method} ${formatDate(a.paidAt)}`}
                  {a.notes ? ` · ${a.notes}` : ""}
                </div>
              </div>
              {draft && a.status !== "cancelled" ? (
                <div className="relative">
                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-nc-muted">PKR</span>
                  <input
                    type="number" min={0} step={10}
                    value={drafts[a._id] ?? String(a.amount)}
                    onChange={(e) => setDrafts((d) => ({ ...d, [a._id]: e.target.value }))}
                    onBlur={() => commit(a)}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    disabled={busy}
                    className="h-8 w-28 rounded-md border border-input bg-card pl-9 pr-2 text-right text-[13px] focus:border-primary focus:outline-none"
                    aria-label={`Amount for ${recipientName(a)}`}
                  />
                </div>
              ) : (
                <span className="whitespace-nowrap text-[13px] font-semibold text-nc-dark">{formatPKR(a.amount)}</span>
              )}
              <span className={cn("hidden rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline", ALLOC_STATUS[a.status])}>{a.status}</span>
              {draft ? (
                <button className="rounded-md p-1.5 text-nc-muted hover:bg-muted hover:text-nc-dark disabled:opacity-40" disabled={busy}
                  onClick={() => onToggle(a)} title={a.status === "cancelled" ? "Restore" : "Remove from this pool"}
                  aria-label={a.status === "cancelled" ? `Restore ${recipientName(a)}` : `Remove ${recipientName(a)}`}>
                  {a.status === "cancelled" ? <RefreshCw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                </button>
              ) : a.status === "approved" ? (
                <button className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-plum hover:border-plum" onClick={() => onPay(a)}>
                  <Wallet className="h-3.5 w-3.5" /> Paid
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </NcCard>
  );
}

// ── Create pool ───────────────────────────────────────────────────────────────
type PoolSettings = { budgetMode: "fixed" | "percent"; budgetValue: number; studentSharePct: number; maxStudents: number; maxMurabbis: number; minMurabbiScore: number; notes?: string };

function PoolFields({ f, set, collected }: { f: PoolSettings; set: (k: keyof PoolSettings, v: any) => void; collected: number | null }) {
  const budget = f.budgetMode === "fixed" ? f.budgetValue : Math.floor(((collected ?? 0) * f.budgetValue) / 100);
  return (
    <>
      <FormRow>
        <FormGroup label="Budget type">
          <FormSelect value={f.budgetMode} onChange={(e) => { set("budgetMode", e.target.value); set("budgetValue", e.target.value === "percent" ? 20 : 10000); }}>
            <option value="percent">% of contributions collected</option>
            <option value="fixed">Fixed amount (PKR)</option>
          </FormSelect>
        </FormGroup>
        <FormGroup label={f.budgetMode === "percent" ? "Percentage" : "Amount (PKR)"}>
          <FormInput type="number" min={0} max={f.budgetMode === "percent" ? 100 : undefined} value={f.budgetValue} onChange={(e) => set("budgetValue", Number(e.target.value))} />
        </FormGroup>
      </FormRow>
      <div className="mb-[18px] rounded-md bg-plum-lt/60 p-3 text-[12.5px] text-plum">
        Budget: <strong>{formatPKR(budget)}</strong>
        {collected !== null && <> · {formatPKR(collected)} collected this month</>}
      </div>
      <FormGroup label={`Split — ${f.studentSharePct}% students · ${100 - f.studentSharePct}% Murabbis`}>
        <input type="range" min={0} max={100} step={5} value={f.studentSharePct} onChange={(e) => set("studentSharePct", Number(e.target.value))} className="w-full accent-[hsl(327,58%,26%)]" aria-label="Student share" />
      </FormGroup>
      <FormRow>
        <FormGroup label="Students rewarded (top N)">
          <FormInput type="number" min={0} max={100} value={f.maxStudents} onChange={(e) => set("maxStudents", Number(e.target.value))} />
        </FormGroup>
        <FormGroup label="Murabbis rewarded (top N)">
          <FormInput type="number" min={0} max={100} value={f.maxMurabbis} onChange={(e) => set("maxMurabbis", Number(e.target.value))} />
        </FormGroup>
      </FormRow>
      <FormGroup label="Minimum Murabbi score to qualify">
        <FormInput type="number" min={0} max={100} value={f.minMurabbiScore} onChange={(e) => set("minMurabbiScore", Number(e.target.value))} />
      </FormGroup>
    </>
  );
}

function CreatePool({ month, onCreated }: { month: string; onCreated: (d: PoolDetail) => void }) {
  const { toast } = useToast();
  const [collected, setCollected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState<PoolSettings>({ budgetMode: "percent", budgetValue: 20, studentSharePct: 60, maxStudents: 10, maxMurabbis: 5, minMurabbiScore: 60 });
  const set = (k: keyof PoolSettings, v: any) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    setCollected(null);
    contributionsService.summary(month).then((r) => setCollected(unwrap(r).collected ?? 0)).catch(() => setCollected(0));
  }, [month]);

  async function create() {
    setSaving(true);
    try {
      const r = await rewardsService.createPool({ month, ...f });
      const d = unwrap(r);
      toast({ title: apiMessage(r) });
      onCreated(d);
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not create the pool.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <NcCard className="mx-auto max-w-xl p-5 sm:p-8">
      <div className="mb-1 font-serif text-[22px] text-nc-dark">Set up {monthLabel(month)} rewards</div>
      <p className="mb-6 text-[13px] text-nc-muted">
        Choose the budget and how it's shared. Rewards are proposed from {monthLabel(month)}'s student points and Murabbi
        ratings, in proportion to each person's points or score. Nothing is final until you approve it.
      </p>
      <PoolFields f={f} set={set} collected={collected} />
      <button className="btn-primary w-full disabled:opacity-50" disabled={saving} onClick={create}>
        {saving ? "Calculating…" : "Create pool & propose rewards"}
      </button>
    </NcCard>
  );
}

function PoolSettingsModal({ open, pool, onClose, onSave }: { open: boolean; pool: Pool; onClose: () => void; onSave: (b: PoolSettings) => void }) {
  const [f, setF] = useState<PoolSettings>(pool);
  useEffect(() => { if (open) setF(pool); }, [open, pool]);
  const set = (k: keyof PoolSettings, v: any) => setF((x) => ({ ...x, [k]: v }));
  if (!open) return null;
  return (
    <Modal open onClose={onClose} title="Pool settings" subtitle="Saving recalculates the budget. Press Recalculate afterwards to re-propose rewards with the new limits.">
      <PoolFields f={f} set={set} collected={pool.contributionsCollected} />
      <div className="flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={() => onSave({
          budgetMode: f.budgetMode, budgetValue: f.budgetValue, studentSharePct: f.studentSharePct,
          maxStudents: f.maxStudents, maxMurabbis: f.maxMurabbis, minMurabbiScore: f.minMurabbiScore,
        })}>Save</button>
      </div>
    </Modal>
  );
}

function AddRewardModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (b: object) => void }) {
  const [type, setType] = useState<"student" | "murabbi">("student");
  const [people, setPeople] = useState<{ student: { _id: string; fullName: string }[]; murabbi: { _id: string; fullName: string }[] }>({ student: [], murabbi: [] });
  const [f, setF] = useState({ recipientId: "", amount: "", notes: "" });

  useEffect(() => {
    if (!open) return;
    setF({ recipientId: "", amount: "", notes: "" });
    const list = (r: any) => { const d = unwrap<any>(r); return Array.isArray(d) ? d : d?.students ?? d?.murabbis ?? []; };
    Promise.all([studentsService.getAll(), adminService.getMurabbis()])
      .then(([s, m]) => setPeople({ student: list(s), murabbi: list(m) }))
      .catch(() => {});
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Add a reward" subtitle="For someone the proposal missed, such as special effort or a one-off recognition.">
      <FormGroup label="Recipient type">
        <FormSelect value={type} onChange={(e) => { setType(e.target.value as any); setF((x) => ({ ...x, recipientId: "" })); }}>
          <option value="student">Student</option>
          <option value="murabbi">Murabbi</option>
        </FormSelect>
      </FormGroup>
      <FormGroup label={type === "student" ? "Student" : "Murabbi"} required>
        <FormSelect value={f.recipientId} onChange={(e) => setF((x) => ({ ...x, recipientId: e.target.value }))}>
          <option value="">Select…</option>
          {[...people[type]].sort((a, b) => a.fullName.localeCompare(b.fullName)).map((p) => <option key={p._id} value={p._id}>{p.fullName}</option>)}
        </FormSelect>
      </FormGroup>
      <FormGroup label="Amount (PKR)" required>
        <FormInput type="number" min={0} step={10} value={f.amount} onChange={(e) => setF((x) => ({ ...x, amount: e.target.value }))} />
      </FormGroup>
      <FormGroup label="Reason">
        <FormTextarea value={f.notes} onChange={(e) => setF((x) => ({ ...x, notes: e.target.value }))} rows={2} maxLength={500} />
      </FormGroup>
      <div className="flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary disabled:opacity-50" disabled={!f.recipientId || !Number(f.amount)}
          onClick={() => onSave({ recipientType: type, recipientId: f.recipientId, amount: Number(f.amount), notes: f.notes.trim() || undefined })}>
          Add reward
        </button>
      </div>
    </Modal>
  );
}

function PayModal({ allocation, onClose, onSave }: { allocation: Allocation | null; onClose: () => void; onSave: (b: object) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ method: "cash", reference: "", paidAt: today, notes: "" });
  useEffect(() => { if (allocation) setF({ method: "cash", reference: "", paidAt: today, notes: "" }); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allocation]);
  if (!allocation) return null;
  return (
    <Modal open onClose={onClose} title={`Pay ${recipientName(allocation)}`} subtitle={`${formatPKR(allocation.amount)} · ${allocation.recipientType === "student" ? "student reward" : "Murabbi reward"}${allocation.recipientType === "murabbi" ? ". They'll get a notification." : ""}`}>
      <FormRow>
        <FormGroup label="Given as" required>
          <FormSelect value={f.method} onChange={(e) => setF((x) => ({ ...x, method: e.target.value }))}>
            {PAYOUT_METHODS.map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>)}
          </FormSelect>
        </FormGroup>
        <FormGroup label="Date">
          <FormInput type="date" value={f.paidAt} max={today} onChange={(e) => setF((x) => ({ ...x, paidAt: e.target.value }))} />
        </FormGroup>
      </FormRow>
      <FormGroup label="Reference">
        <FormInput value={f.reference} onChange={(e) => setF((x) => ({ ...x, reference: e.target.value }))} maxLength={120} placeholder="Transaction ID, gift description…" />
      </FormGroup>
      <FormGroup label="Notes">
        <FormTextarea value={f.notes} onChange={(e) => setF((x) => ({ ...x, notes: e.target.value }))} rows={2} maxLength={500} />
      </FormGroup>
      <div className="flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={() => onSave({ method: f.method, reference: f.reference.trim() || undefined, paidAt: f.paidAt || undefined, notes: f.notes.trim() || undefined })}>
          Mark as paid
        </button>
      </div>
    </Modal>
  );
}
