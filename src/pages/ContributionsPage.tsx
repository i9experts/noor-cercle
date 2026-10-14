import { useEffect, useMemo, useState } from "react";
import {
  Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  CreditCard, Download, HandCoins, Inbox, Mail, Phone, Plus, Receipt, Search, Trash2, Undo2, Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { contributionsService, parentsService } from "@/services/api.service";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import Modal, { FormGroup, FormInput, FormRow, FormSelect, FormTextarea } from "@/components/shared/Modal";
import DeleteConfirmModal from "@/components/shared/DeleteConfirmModal";
import { cn } from "@/lib/utils";
import {
  MANUAL_METHODS, MIN_MONTHLY_PLEDGE, PAYMENT_METHOD_LABELS, addMonths, apiError, apiMessage, currentMonth, downloadCsv,
  formatDate, formatPKR, monthLabel, recentMonths, unwrap,
} from "@/lib/finance";

// ── Types ─────────────────────────────────────────────────────────────────────
type MonthState = "paid" | "partial" | "due" | "overdue" | "advance" | "n/a";
type ContributorStatus = "pending" | "active" | "paused" | "cancelled";

interface Contributor {
  _id              : string;
  type             : "parent" | "supporter";
  parent           : { _id: string; fullName: string; students?: { fullName: string }[] } | null;
  fullName         : string;
  email            : string | null;
  phone            : string | null;
  frequency        : "monthly" | "once";
  monthlyPledge    : number;
  startMonth       : string;
  status           : ContributorStatus;
  source           : "admin" | "website";
  preferredMethod  : string;
  stripeSubscriptionId?: string | null;
  notes            : string;
  createdAt        : string;
  currentMonthState: MonthState;
  paidThisMonth    : number;
  arrears          : number;
  totalPaid        : number;
  lastPaymentAt    : string | null;
}

interface Payment {
  _id          : string;
  contributor  : { _id: string; fullName: string; type: string; phone?: string; email?: string } | null;
  amount       : number;
  month        : string;
  method       : string;
  status       : "succeeded" | "pending" | "failed" | "refunded" | "void";
  receiptNumber: string;
  reference    : string;
  receivedAt   : string;
  recordedBy   : { fullName: string } | null;
  notes        : string;
}

interface Summary {
  month: string; collected: number; expected: number; collectionRate: number;
  byMethod: Record<string, number>; activeContributors: number; pendingPledges: number;
  parentContributors: number; overdueContributors: number; totalArrears: number;
  allTimeCollected: number; trend: { month: string; collected: number; expected: number }[];
  stripeEnabled: boolean;
}

interface LedgerRow { month: string; expected: number; paid: number; state: MonthState }

// ── Display metadata ──────────────────────────────────────────────────────────
const STATE_META: Record<MonthState, { label: string; cls: string }> = {
  paid   : { label: "Paid",    cls: "bg-nc-green-lt text-nc-green" },
  partial: { label: "Partial", cls: "bg-gold-lt text-gold-dim" },
  due    : { label: "Due",     cls: "bg-muted text-nc-dark" },
  overdue: { label: "Overdue", cls: "bg-nc-red-lt text-nc-red" },
  advance: { label: "Advance", cls: "bg-plum-lt text-plum" },
  "n/a"  : { label: "—",       cls: "bg-muted text-nc-muted" },
};

const STATUS_META: Record<ContributorStatus, { label: string; cls: string }> = {
  pending  : { label: "Pending",   cls: "bg-gold text-gold-foreground" },
  active   : { label: "Active",    cls: "bg-nc-green-lt text-nc-green" },
  paused   : { label: "Paused",    cls: "bg-muted text-nc-dark" },
  cancelled: { label: "Cancelled", cls: "bg-muted text-nc-muted" },
};

const PAY_STATUS_CLS: Record<Payment["status"], string> = {
  succeeded: "bg-nc-green-lt text-nc-green",
  pending  : "bg-gold-lt text-gold-dim",
  failed   : "bg-nc-red-lt text-nc-red",
  refunded : "bg-muted text-nc-muted",
  void     : "bg-muted text-nc-muted",
};

const CLR = { plum: "hsl(327, 58%, 26%)", gold: "hsl(36, 54%, 53%)", border: "hsl(327, 22%, 89%)", muted: "#9ca3af" };

function Pill({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", cls)}>{children}</span>;
}

function TrendTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-[12px] shadow-nc">
      <div className="mb-1 font-semibold text-nc-dark">{monthLabel(d.month)}</div>
      <div className="text-plum">Collected: {formatPKR(d.collected)}</div>
      <div className="text-gold-dim">Pledged: {formatPKR(d.expected)}</div>
    </div>
  );
}

// ══ Page ══════════════════════════════════════════════════════════════════════
export default function ContributionsPage() {
  const { toast } = useToast();
  const [month, setMonth]               = useState(currentMonth());
  const [summary, setSummary]           = useState<Summary | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [payments, setPayments]         = useState<Payment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState<"contributors" | "payments">("contributors");

  // contributor filters
  const [search, setSearch]             = useState("");
  const [typeFilter, setTypeFilter]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stateFilter, setStateFilter]   = useState("");
  // payment filters
  const [methodFilter, setMethodFilter] = useState("");

  const [addOpen, setAddOpen]           = useState(false);
  const [payFor, setPayFor]             = useState<Contributor | null | undefined>(undefined); // undefined = closed
  const [detailId, setDetailId]         = useState<string | null>(null);
  const [toReverse, setToReverse]       = useState<{ payment: Payment; status: "refunded" | "void" } | null>(null);

  async function loadAll(m = month) {
    try {
      const [s, c, p] = await Promise.all([
        contributionsService.summary(m),
        contributionsService.getContributors(),
        contributionsService.getPayments({ month: m }),
      ]);
      setSummary(unwrap(s));
      setContributors(unwrap(c) || []);
      setPayments(unwrap(p) || []);
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not load contributions.") });
    } finally {
      setLoading(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll(month); }, [month]);

  const visibleContributors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contributors.filter((c) =>
      (!typeFilter || c.type === typeFilter) &&
      (!statusFilter || c.status === statusFilter) &&
      (!stateFilter || (stateFilter === "arrears" ? c.arrears > 0 : c.currentMonthState === stateFilter)) &&
      (!q || [c.fullName, c.email, c.phone, ...(c.parent?.students?.map((s) => s.fullName) ?? [])]
        .some((v) => v?.toLowerCase().includes(q))));
  }, [contributors, search, typeFilter, statusFilter, stateFilter]);

  const visiblePayments = payments.filter((p) => !methodFilter || p.method === methodFilter);

  function exportContributors() {
    downloadCsv(`noor-circles-contributors-${month}.csv`, [
      ["Name", "Type", "Children", "Email", "Phone", "Frequency", "Monthly pledge (PKR)", "Status",
       "This month", "Paid this month (PKR)", "Arrears (PKR)", "Total paid (PKR)", "Last payment", "Source", "Since"],
      ...visibleContributors.map((c) => [
        c.fullName, c.type, c.parent?.students?.map((s) => s.fullName).join("; ") ?? "", c.email ?? "", c.phone ?? "",
        c.frequency, c.monthlyPledge, c.status, STATE_META[c.currentMonthState].label, c.paidThisMonth, c.arrears,
        c.totalPaid, c.lastPaymentAt ? formatDate(c.lastPaymentAt) : "", c.source, c.startMonth,
      ]),
    ]);
  }

  function exportPayments() {
    downloadCsv(`noor-circles-payments-${month}.csv`, [
      ["Receipt", "Contributor", "Type", "Amount (PKR)", "For month", "Method", "Reference", "Received", "Status", "Recorded by", "Notes"],
      ...visiblePayments.map((p) => [
        p.receiptNumber, p.contributor?.fullName ?? "(deleted)", p.contributor?.type ?? "", p.amount, p.month,
        PAYMENT_METHOD_LABELS[p.method] ?? p.method, p.reference, formatDate(p.receivedAt), p.status,
        p.recordedBy?.fullName ?? (p.method === "stripe" ? "Stripe" : ""), p.notes,
      ]),
    ]);
  }

  async function reversePayment() {
    if (!toReverse) return;
    try {
      const r = await contributionsService.updatePayment(toReverse.payment._id, { status: toReverse.status });
      toast({ title: apiMessage(r) });
      loadAll();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Update failed.") });
    } finally {
      setToReverse(null);
    }
  }

  const s = summary;
  const methodTotal = s ? Object.values(s.byMethod).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="page-animate">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div>
          <h2 className="font-serif text-[26px] text-nc-dark">Contributions</h2>
          <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
            Noor Circles has no fees. Families and supporters give a monthly contribution of {formatPKR(MIN_MONTHLY_PLEDGE)} or
            more. Track every pledge and payment here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium",
              s?.stripeEnabled ? "bg-nc-green-lt text-nc-green" : "bg-muted text-nc-muted")}
            title={s?.stripeEnabled
              ? "Online card payments are live on the website."
              : "Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET on the server to accept cards. Until then, website pledges arrive here for follow-up."}
          >
            <CreditCard className="h-3.5 w-3.5" /> {s?.stripeEnabled ? "Stripe live" : "Stripe not connected"}
          </span>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-9 rounded-md border border-input bg-card px-3 text-[13px] focus:border-primary focus:outline-none"
            aria-label="Month"
          >
            {recentMonths(24, addMonths(currentMonth(), 1)).map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <button className="btn-outline inline-flex items-center gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add contributor
          </button>
          <button className="btn-primary inline-flex items-center gap-1.5" onClick={() => setPayFor(null)}>
            <Receipt className="h-4 w-4" /> Record payment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 sm:gap-4">
        <StatCard label={`Collected · ${monthLabel(month, true)}`} value={formatPKR(s?.collected)} meta={`of ${formatPKR(s?.expected)} pledged`} color="teal" />
        <StatCard label="Collection rate" value={`${s?.collectionRate ?? 0}%`} meta="Pledges met this month" color={(s?.collectionRate ?? 0) >= 80 ? "green" : "gold"} />
        <StatCard label="Active contributors" value={s?.activeContributors ?? 0} meta={`${s?.parentContributors ?? 0} parents · ${s?.pendingPledges ?? 0} pending`} color="purple" />
        <StatCard label="Arrears" value={formatPKR(s?.totalArrears)} meta={`${s?.overdueContributors ?? 0} contributor${s?.overdueContributors === 1 ? "" : "s"} behind`} color="red" />
        <StatCard label="All-time collected" value={formatPKR(s?.allTimeCollected)} meta="Since launch" color="gold" />
      </div>

      {/* Trend + methods */}
      <div className="mb-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <NcCard className="p-4 sm:p-6">
          <CardHeader><CardTitle sub="Collected vs. pledged, last 12 months">Monthly trend</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={s?.trend ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CLR.border} vertical={false} />
              <XAxis dataKey="month" tickFormatter={(m) => monthLabel(m, true)} tick={{ fontSize: 10, fill: CLR.muted }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} tick={{ fontSize: 10, fill: CLR.muted }} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<TrendTooltip />} cursor={{ fill: "hsl(327, 40%, 95%)" }} />
              <Bar dataKey="collected" fill={CLR.plum} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
              <Line dataKey="expected" stroke={CLR.gold} strokeWidth={2} dot={{ r: 2.5, fill: CLR.gold }} type="linear" isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </NcCard>
        <NcCard className="p-4 sm:p-6">
          <CardHeader><CardTitle sub={monthLabel(month)}>By payment method</CardTitle></CardHeader>
          {methodTotal === 0 ? (
            <div className="py-10 text-center text-[12.5px] text-nc-muted">No payments recorded for this month.</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(s!.byMethod).sort((a, b) => b[1] - a[1]).map(([m, v]) => (
                <div key={m}>
                  <div className="mb-1 flex justify-between text-[12.5px]">
                    <span className="text-nc-dark">{PAYMENT_METHOD_LABELS[m] ?? m}</span>
                    <span className="font-medium text-nc-dark">{formatPKR(v)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-plum-lt">
                    <div className="h-full rounded-full bg-plum" style={{ width: `${(v / methodTotal) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </NcCard>
      </div>

      {/* Tabs */}
      <NcCard className="p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1.5" role="tablist">
            {([["contributors", `Contributors (${contributors.length})`], ["payments", `Payments · ${monthLabel(month, true)} (${payments.length})`]] as const).map(([k, label]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={cn("rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                  tab === k ? "bg-primary text-primary-foreground" : "bg-muted text-nc-muted hover:text-nc-dark")}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "contributors" ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-nc-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, child, phone…"
                  className="h-9 w-48 rounded-md border border-input bg-card pl-8 pr-3 text-[13px] focus:border-primary focus:outline-none"
                  aria-label="Search contributors"
                />
              </div>
              <FilterSelect value={typeFilter} onChange={setTypeFilter} label="Type" options={[["", "All types"], ["parent", "Parents"], ["supporter", "Supporters"]]} />
              <FilterSelect value={statusFilter} onChange={setStatusFilter} label="Status" options={[["", "All statuses"], ["active", "Active"], ["pending", "Pending"], ["paused", "Paused"], ["cancelled", "Cancelled"]]} />
              <FilterSelect value={stateFilter} onChange={setStateFilter} label="This month" options={[["", "Any month state"], ["paid", "Paid"], ["partial", "Partial"], ["due", "Due"], ["arrears", "Has arrears"]]} />
              <button className="btn-outline inline-flex items-center gap-1.5 !py-2" onClick={exportContributors}><Download className="h-4 w-4" /> CSV</button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect value={methodFilter} onChange={setMethodFilter} label="Method"
                options={[["", "All methods"], ...Object.entries(PAYMENT_METHOD_LABELS).filter(([k]) => k !== "gift" && k !== "voucher")]} />
              <button className="btn-outline inline-flex items-center gap-1.5 !py-2" onClick={exportPayments}><Download className="h-4 w-4" /> CSV</button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-nc-muted">Loading…</div>
        ) : tab === "contributors" ? (
          visibleContributors.length === 0 ? (
            <Empty
              title={contributors.length ? "Nothing here" : "No contributors yet"}
              body={contributors.length ? "No contributors match these filters." : "Add a parent or supporter, or share the website's “Support Noor Circles” form."}
            />
          ) : (
            <div className="-mx-4 overflow-x-auto sm:mx-0">
              <table className="w-full min-w-[820px] text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-nc-muted">
                    <th className="px-3 py-2 font-medium">Contributor</th>
                    <th className="px-3 py-2 font-medium">Pledge</th>
                    <th className="px-3 py-2 font-medium">{monthLabel(currentMonth(), true)}</th>
                    <th className="px-3 py-2 text-right font-medium">Arrears</th>
                    <th className="px-3 py-2 text-right font-medium">Total given</th>
                    <th className="px-3 py-2 font-medium">Last paid</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {visibleContributors.map((c) => (
                    <tr key={c._id} className="cursor-pointer border-b border-border/60 hover:bg-muted/50" onClick={() => setDetailId(c._id)}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                            c.type === "parent" ? "bg-plum-lt text-plum" : "bg-gold-lt text-gold-dim")}>
                            {c.type === "parent" ? <Users className="h-4 w-4" /> : <HandCoins className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-nc-dark">{c.fullName}</div>
                            <div className="truncate text-[11.5px] text-nc-muted">
                              {c.type === "parent"
                                ? `Parent${c.parent?.students?.length ? ` of ${c.parent.students.map((s) => s.fullName).join(", ")}` : ""}`
                                : `Supporter${c.source === "website" ? " · via website" : ""}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {formatPKR(c.monthlyPledge)}<span className="text-nc-muted">{c.frequency === "monthly" ? "/mo" : " once"}</span>
                      </td>
                      <td className="px-3 py-3"><Pill cls={STATE_META[c.currentMonthState].cls}>{STATE_META[c.currentMonthState].label}</Pill></td>
                      <td className={cn("px-3 py-3 text-right whitespace-nowrap", c.arrears > 0 ? "font-medium text-nc-red" : "text-nc-muted")}>
                        {c.arrears > 0 ? formatPKR(c.arrears) : "—"}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">{formatPKR(c.totalPaid)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-nc-muted">{formatDate(c.lastPaymentAt)}</td>
                      <td className="px-3 py-3"><Pill cls={STATUS_META[c.status].cls}>{STATUS_META[c.status].label}</Pill></td>
                      <td className="px-3 py-3 text-right">
                        <button
                          className="rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-plum hover:border-plum"
                          onClick={(e) => { e.stopPropagation(); setPayFor(c); }}
                        >
                          Record
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : visiblePayments.length === 0 ? (
          <Empty title="No payments" body={`No payments recorded for ${monthLabel(month)}${methodFilter ? " with this method" : ""}.`} />
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[820px] text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-nc-muted">
                  <th className="px-3 py-2 font-medium">Receipt</th>
                  <th className="px-3 py-2 font-medium">Contributor</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">Method</th>
                  <th className="px-3 py-2 font-medium">Received</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {visiblePayments.map((p) => (
                  <tr key={p._id} className="border-b border-border/60">
                    <td className="px-3 py-3 font-mono text-[12px] text-nc-dark">{p.receiptNumber}</td>
                    <td className="px-3 py-3">
                      {p.contributor ? (
                        <button className="font-medium text-nc-dark hover:text-plum" onClick={() => setDetailId(p.contributor!._id)}>{p.contributor.fullName}</button>
                      ) : <span className="text-nc-muted">(deleted)</span>}
                      {p.month !== monthOfDate(p.receivedAt) && <div className="text-[11.5px] text-nc-muted">for {monthLabel(p.month)}</div>}
                    </td>
                    <td className="px-3 py-3 text-right font-medium whitespace-nowrap">{formatPKR(p.amount)}</td>
                    <td className="px-3 py-3">
                      <div>{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</div>
                      {p.reference && <div className="max-w-[180px] truncate text-[11.5px] text-nc-muted" title={p.reference}>{p.reference}</div>}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div>{formatDate(p.receivedAt)}</div>
                      <div className="text-[11.5px] text-nc-muted">{p.recordedBy?.fullName ?? (p.method === "stripe" ? "Online" : "")}</div>
                    </td>
                    <td className="px-3 py-3"><Pill cls={PAY_STATUS_CLS[p.status]}>{p.status}</Pill></td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {p.status === "succeeded" && p.method !== "stripe" && (
                        <>
                          <button className="rounded-md p-1.5 text-nc-muted hover:bg-muted hover:text-nc-dark" title="Mark refunded"
                            onClick={() => setToReverse({ payment: p, status: "refunded" })} aria-label={`Refund ${p.receiptNumber}`}>
                            <Undo2 className="h-4 w-4" />
                          </button>
                          <button className="rounded-md p-1.5 text-nc-muted hover:bg-nc-red-lt hover:text-nc-red" title="Void (recorded by mistake)"
                            onClick={() => setToReverse({ payment: p, status: "void" })} aria-label={`Void ${p.receiptNumber}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NcCard>

      <AddContributorModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => loadAll()} existing={contributors} />
      <RecordPaymentModal
        open={payFor !== undefined}
        contributor={payFor ?? null}
        contributors={contributors}
        onClose={() => setPayFor(undefined)}
        onSaved={() => loadAll()}
      />
      <ContributorDetailModal
        id={detailId}
        onClose={() => setDetailId(null)}
        onChanged={() => loadAll()}
        onRecordPayment={(c) => { setDetailId(null); setPayFor(c); }}
      />
      <DeleteConfirmModal
        open={!!toReverse}
        title={toReverse?.status === "void" ? "Void this payment?" : "Mark as refunded?"}
        message={toReverse
          ? `${toReverse.payment.receiptNumber} · ${formatPKR(toReverse.payment.amount)} from ${toReverse.payment.contributor?.fullName ?? "—"} will no longer count as collected. The record is kept for the audit trail.`
          : ""}
        confirmLabel={toReverse?.status === "void" ? "Void payment" : "Mark refunded"}
        variant="warning"
        onConfirm={reversePayment}
        onClose={() => setToReverse(null)}
      />
    </div>
  );
}

function monthOfDate(iso: string) {
  const d = new Date(new Date(iso).getTime() + 5 * 3600_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function FilterSelect({ value, onChange, label, options }: {
  value: string; onChange: (v: string) => void; label: string; options: (readonly [string, string])[] | [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-card px-2.5 text-[13px] focus:border-primary focus:outline-none"
      aria-label={label}
    >
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <Inbox className="mb-3 h-9 w-9 text-pale" strokeWidth={1.5} />
      <div className="text-sm font-medium text-nc-dark">{title}</div>
      <div className="mt-1 max-w-sm text-[12.5px] text-nc-muted">{body}</div>
    </div>
  );
}

function PledgeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {[250, 500, 1000, 2000, 5000].map((v) => (
          <button
            type="button"
            key={v}
            onClick={() => onChange(String(v))}
            className={cn("rounded-full border px-3 py-1 text-[12px] font-medium",
              Number(value) === v ? "border-plum bg-plum text-white" : "border-border text-nc-dark hover:border-plum")}
          >
            {v.toLocaleString("en-PK")}
          </button>
        ))}
      </div>
      <FormInput type="number" min={MIN_MONTHLY_PLEDGE} step={1} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Amount in PKR" />
      {value !== "" && Number(value) < MIN_MONTHLY_PLEDGE && (
        <div className="mt-1 text-[12px] text-nc-red">Minimum is {formatPKR(MIN_MONTHLY_PLEDGE)}.</div>
      )}
    </>
  );
}

// ── Add contributor ───────────────────────────────────────────────────────────
function AddContributorModal({ open, onClose, onSaved, existing }: {
  open: boolean; onClose: () => void; onSaved: () => void; existing: Contributor[];
}) {
  const { toast } = useToast();
  const [parents, setParents] = useState<{ _id: string; fullName: string; students?: { fullName: string }[] }[]>([]);
  const [saving, setSaving]   = useState(false);
  const blank = {
    type: "parent" as "parent" | "supporter", parentId: "", fullName: "", email: "", phone: "",
    frequency: "monthly", monthlyPledge: "500", startMonth: currentMonth(), preferredMethod: "cash", notes: "",
  };
  const [f, setF] = useState(blank);
  const set = (k: keyof typeof blank, v: string) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setF(blank);
    parentsService.getAll().then((r) => setParents(unwrap(r) || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const takenParents = new Set(existing.filter((c) => c.parent && c.status !== "cancelled").map((c) => c.parent!._id));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (Number(f.monthlyPledge) < MIN_MONTHLY_PLEDGE) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        type: f.type, frequency: f.frequency, monthlyPledge: Number(f.monthlyPledge),
        startMonth: f.startMonth, preferredMethod: f.preferredMethod,
      };
      if (f.type === "parent") body.parentId = f.parentId;
      if (f.fullName.trim()) body.fullName = f.fullName.trim();
      if (f.email.trim())    body.email    = f.email.trim();
      if (f.phone.trim())    body.phone    = f.phone.trim();
      if (f.notes.trim())    body.notes    = f.notes.trim();
      const r = await contributionsService.createContributor(body);
      toast({ title: apiMessage(r) });
      onSaved();
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not add contributor.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add contributor" subtitle={`No fees — a voluntary monthly contribution of ${formatPKR(MIN_MONTHLY_PLEDGE)} or more.`}>
      <form onSubmit={submit}>
        <div className="mb-[18px] grid grid-cols-2 gap-2">
          {(["parent", "supporter"] as const).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => set("type", t)}
              className={cn("rounded-md border px-3 py-2.5 text-left text-[13px]",
                f.type === t ? "border-plum bg-plum-lt text-plum" : "border-border text-nc-dark hover:border-plum")}
            >
              <div className="font-semibold">{t === "parent" ? "Parent" : "Supporter"}</div>
              <div className="text-[11.5px] opacity-80">{t === "parent" ? "A family already in Noor Circles" : "Anyone who wants to help"}</div>
            </button>
          ))}
        </div>

        {f.type === "parent" ? (
          <FormGroup label="Parent" required>
            <FormSelect value={f.parentId} onChange={(e) => set("parentId", e.target.value)} required>
              <option value="">Select a parent…</option>
              {parents.map((p) => (
                <option key={p._id} value={p._id} disabled={takenParents.has(p._id)}>
                  {p.fullName}{p.students?.length ? ` — ${p.students.map((s) => s.fullName).join(", ")}` : ""}{takenParents.has(p._id) ? " (already contributing)" : ""}
                </option>
              ))}
            </FormSelect>
          </FormGroup>
        ) : (
          <FormGroup label="Full name" required>
            <FormInput value={f.fullName} onChange={(e) => set("fullName", e.target.value)} required maxLength={100} />
          </FormGroup>
        )}

        <FormRow>
          <FormGroup label="Email">
            <FormInput type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder={f.type === "parent" ? "From parent record" : ""} />
          </FormGroup>
          <FormGroup label="Phone / WhatsApp">
            <FormInput value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder={f.type === "parent" ? "From parent record" : "03xx xxxxxxx"} />
          </FormGroup>
        </FormRow>

        <FormGroup label={f.frequency === "monthly" ? "Monthly contribution (PKR)" : "Contribution (PKR)"} required>
          <PledgeInput value={f.monthlyPledge} onChange={(v) => set("monthlyPledge", v)} />
        </FormGroup>

        <FormRow>
          <FormGroup label="Frequency">
            <FormSelect value={f.frequency} onChange={(e) => set("frequency", e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="once">One-time</option>
            </FormSelect>
          </FormGroup>
          <FormGroup label="Starting month">
            <FormSelect value={f.startMonth} onChange={(e) => set("startMonth", e.target.value)}>
              {recentMonths(15, addMonths(currentMonth(), 3)).map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </FormSelect>
          </FormGroup>
        </FormRow>

        <FormGroup label="Usually pays by">
          <FormSelect value={f.preferredMethod} onChange={(e) => set("preferredMethod", e.target.value)}>
            {MANUAL_METHODS.map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>)}
          </FormSelect>
        </FormGroup>

        <FormGroup label="Notes">
          <FormTextarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} maxLength={1000} />
        </FormGroup>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary disabled:opacity-50" disabled={saving || Number(f.monthlyPledge) < MIN_MONTHLY_PLEDGE}>
            {saving ? "Saving…" : "Add contributor"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Record payment ────────────────────────────────────────────────────────────
function RecordPaymentModal({ open, contributor, contributors, onClose, onSaved }: {
  open: boolean; contributor: Contributor | null; contributors: Contributor[]; onClose: () => void; onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ contributorId: "", amount: "", month: currentMonth(), method: "cash", reference: "", receivedAt: today, notes: "" });
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setF({
      contributorId: contributor?._id ?? "",
      amount       : contributor ? String(contributor.monthlyPledge) : "",
      month        : currentMonth(),
      method       : contributor?.preferredMethod && contributor.preferredMethod !== "stripe" ? contributor.preferredMethod : "cash",
      reference    : "",
      receivedAt   : today,
      notes        : "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contributor]);

  function pick(id: string) {
    const c = contributors.find((x) => x._id === id);
    setF((x) => ({
      ...x, contributorId: id,
      amount: c ? String(c.monthlyPledge) : x.amount,
      method: c?.preferredMethod && c.preferredMethod !== "stripe" ? c.preferredMethod : x.method,
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await contributionsService.recordPayment({
        contributorId: f.contributorId, amount: Number(f.amount), month: f.month, method: f.method,
        reference: f.reference.trim() || undefined, receivedAt: f.receivedAt || undefined, notes: f.notes.trim() || undefined,
      });
      toast({ title: apiMessage(r) });
      onSaved();
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not record payment.") });
    } finally {
      setSaving(false);
    }
  }

  const choosable = contributors.filter((c) => c.status !== "cancelled" || c._id === f.contributorId)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <Modal open={open} onClose={onClose} title="Record payment" subtitle="Cash, bank transfer, JazzCash or Easypaisa received by the team. A receipt number is issued automatically.">
      <form onSubmit={submit}>
        <FormGroup label="Contributor" required>
          <FormSelect value={f.contributorId} onChange={(e) => pick(e.target.value)} required>
            <option value="">Select…</option>
            {choosable.map((c) => (
              <option key={c._id} value={c._id}>{c.fullName} — {formatPKR(c.monthlyPledge)}{c.frequency === "monthly" ? "/mo" : ""}{c.status === "pending" ? " (pending)" : ""}</option>
            ))}
          </FormSelect>
        </FormGroup>
        <FormRow>
          <FormGroup label="Amount (PKR)" required>
            <FormInput type="number" min={1} step={1} value={f.amount} onChange={(e) => set("amount", e.target.value)} required />
          </FormGroup>
          <FormGroup label="For month" required>
            <FormSelect value={f.month} onChange={(e) => set("month", e.target.value)}>
              {recentMonths(24, addMonths(currentMonth(), 12)).map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </FormSelect>
          </FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup label="Method" required>
            <FormSelect value={f.method} onChange={(e) => set("method", e.target.value)}>
              {MANUAL_METHODS.map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>)}
            </FormSelect>
          </FormGroup>
          <FormGroup label="Received on">
            <FormInput type="date" value={f.receivedAt} max={today} onChange={(e) => set("receivedAt", e.target.value)} />
          </FormGroup>
        </FormRow>
        <FormGroup label="Reference">
          <FormInput value={f.reference} onChange={(e) => set("reference", e.target.value)} placeholder="Transaction ID, cheque no., who collected…" maxLength={120} />
        </FormGroup>
        <FormGroup label="Notes">
          <FormTextarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} maxLength={500} />
        </FormGroup>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary disabled:opacity-50" disabled={saving || !f.contributorId || !Number(f.amount)}>
            {saving ? "Saving…" : "Record payment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Contributor detail + ledger ───────────────────────────────────────────────
function ContributorDetailModal({ id, onClose, onChanged, onRecordPayment }: {
  id: string | null; onClose: () => void; onChanged: () => void; onRecordPayment: (c: Contributor) => void;
}) {
  const { toast } = useToast();
  const [data, setData] = useState<{ contributor: Contributor; ledger: LedgerRow[]; payments: Payment[]; arrears: number; totalPaid: number } | null>(null);
  const [edit, setEdit] = useState({ monthlyPledge: "", status: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function load() {
    if (!id) return;
    try {
      const d = unwrap(await contributionsService.getContributor(id));
      setData(d);
      setEdit({ monthlyPledge: String(d.contributor.monthlyPledge), status: d.contributor.status, notes: d.contributor.notes ?? "" });
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not load contributor.") });
      onClose();
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setData(null); load(); }, [id]);

  if (!id) return null;
  const c = data?.contributor;
  const dirty = c && (Number(edit.monthlyPledge) !== c.monthlyPledge || edit.status !== c.status || edit.notes !== (c.notes ?? ""));

  async function save() {
    if (!c) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (Number(edit.monthlyPledge) !== c.monthlyPledge) body.monthlyPledge = Number(edit.monthlyPledge);
      if (edit.status !== c.status) body.status = edit.status;
      if (edit.notes !== (c.notes ?? "")) body.notes = edit.notes;
      const r = await contributionsService.updateContributor(c._id, body);
      toast({ title: apiMessage(r) });
      await load();
      onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Update failed.") });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!c) return;
    try {
      await contributionsService.removeContributor(c._id);
      toast({ title: "Contributor deleted." });
      onChanged();
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Delete failed.") });
    } finally {
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <Modal open={!!id && !confirmDelete} onClose={onClose} title={c?.fullName ?? "Contributor"}
        subtitle={c ? `${c.type === "parent" ? "Parent" : "Supporter"} · since ${monthLabel(c.startMonth)}${c.source === "website" ? " · signed up on the website" : ""}` : "Loading…"}>
        {!data || !c ? (
          <div className="py-10 text-center text-sm text-nc-muted">Loading…</div>
        ) : (
          <>
            {c.parent?.students?.length ? (
              <div className="mb-3 text-[12.5px] text-nc-muted">Children: <span className="text-nc-dark">{c.parent.students.map((s) => s.fullName).join(", ")}</span></div>
            ) : null}
            <div className="mb-4 flex flex-wrap gap-2">
              {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12.5px] hover:border-primary hover:text-primary"><Mail className="h-3.5 w-3.5" />{c.email}</a>}
              {c.phone && <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12.5px] hover:border-primary hover:text-primary"><Phone className="h-3.5 w-3.5" />{c.phone}</a>}
              {c.stripeSubscriptionId && <Pill cls="bg-nc-green-lt text-nc-green">Card subscription</Pill>}
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-muted p-3"><div className="text-[11px] text-nc-muted">Pledge</div><div className="text-[15px] font-semibold text-nc-dark">{formatPKR(c.monthlyPledge)}</div></div>
              <div className="rounded-md bg-muted p-3"><div className="text-[11px] text-nc-muted">Total given</div><div className="text-[15px] font-semibold text-nc-green">{formatPKR(data.totalPaid)}</div></div>
              <div className="rounded-md bg-muted p-3"><div className="text-[11px] text-nc-muted">Arrears</div><div className={cn("text-[15px] font-semibold", data.arrears ? "text-nc-red" : "text-nc-dark")}>{formatPKR(data.arrears)}</div></div>
            </div>

            {/* Ledger */}
            <div className="mb-2 text-[13px] font-semibold text-nc-dark">Monthly ledger</div>
            {data.ledger.length === 0 ? (
              <div className="mb-5 text-[12.5px] text-nc-muted">Nothing expected yet{c.status === "pending" ? " — the pledge is pending confirmation" : ""}.</div>
            ) : (
              <div className="mb-5 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                {data.ledger.slice(0, 24).map((r) => (
                  <div key={r.month} className={cn("rounded-md px-2 py-1.5 text-[11.5px]", STATE_META[r.state].cls)} title={`${formatPKR(r.paid)} of ${formatPKR(r.expected)}`}>
                    <div className="font-semibold">{monthLabel(r.month, true)}</div>
                    <div>{STATE_META[r.state].label}{r.paid ? ` · ${r.paid.toLocaleString("en-PK")}` : ""}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Payments */}
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[13px] font-semibold text-nc-dark">Payments ({data.payments.length})</div>
              <button className="text-[12.5px] font-medium text-plum hover:underline" onClick={() => onRecordPayment(c)}>+ Record payment</button>
            </div>
            <div className="mb-5 max-h-48 overflow-y-auto rounded-md border border-border">
              {data.payments.length === 0 ? (
                <div className="p-4 text-center text-[12.5px] text-nc-muted">No payments yet.</div>
              ) : data.payments.map((p) => (
                <div key={p._id} className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2 text-[12.5px] last:border-0">
                  <div className="min-w-0">
                    <div className="font-medium text-nc-dark">{formatPKR(p.amount)} <span className="font-normal text-nc-muted">for {monthLabel(p.month)}</span></div>
                    <div className="truncate text-[11.5px] text-nc-muted">{p.receiptNumber} · {PAYMENT_METHOD_LABELS[p.method] ?? p.method} · {formatDate(p.receivedAt)}{p.reference ? ` · ${p.reference}` : ""}</div>
                  </div>
                  <Pill cls={PAY_STATUS_CLS[p.status]}>{p.status}</Pill>
                </div>
              ))}
            </div>

            {/* Edit */}
            <div className="mb-2 text-[13px] font-semibold text-nc-dark">Plan</div>
            <FormRow>
              <FormGroup label="Monthly pledge (PKR)">
                <FormInput type="number" min={MIN_MONTHLY_PLEDGE} value={edit.monthlyPledge} onChange={(e) => setEdit((x) => ({ ...x, monthlyPledge: e.target.value }))} />
              </FormGroup>
              <FormGroup label="Status">
                <FormSelect value={edit.status} onChange={(e) => setEdit((x) => ({ ...x, status: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused (no dues while paused)</option>
                  <option value="cancelled">Cancelled</option>
                </FormSelect>
              </FormGroup>
            </FormRow>
            <FormGroup label="Notes">
              <FormTextarea value={edit.notes} onChange={(e) => setEdit((x) => ({ ...x, notes: e.target.value }))} rows={2} maxLength={1000} />
            </FormGroup>
            <div className="flex items-center justify-between gap-2">
              <button className="text-[12.5px] text-nc-muted hover:text-nc-red" onClick={() => setConfirmDelete(true)}>Delete</button>
              <div className="flex gap-2">
                <button className="btn-outline" onClick={onClose}>Close</button>
                <button className="btn-primary disabled:opacity-50" disabled={!dirty || saving || Number(edit.monthlyPledge) < MIN_MONTHLY_PLEDGE} onClick={save}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>
      <DeleteConfirmModal
        open={confirmDelete}
        title="Delete contributor?"
        message="Only contributors without any payment records can be deleted. To stop a plan that has history, set its status to Cancelled."
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}
