import { useEffect, useRef, useState } from "react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import { adminService, courseService } from "@/services/api.service";
import CertifiedBadge from "@/components/course/CertifiedBadge";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, Pencil, UserCheck, UserX, Trash2, ShieldCheck, ChevronRight } from "lucide-react";
import { AddMurabbiModal, EditMurabbiModal } from "@/components/modals/AllModals";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const TIER_COLORS: Record<number, string> = {
  1: "bg-teal/10 border-teal/20",
  2: "bg-gold/10 border-gold/20",
  3: "bg-purple-100 border-purple-200",
};
const TIER_TEXT: Record<number, string> = { 1: "text-teal", 2: "text-gold-dim", 3: "text-purple-600" };
const TIER_BAR: Record<number, string>  = { 1: "bg-teal", 2: "bg-gold", 3: "bg-purple-500" };

const BADGE_CONFIG = {
  excellent   : { label: "excellent",    variant: "teal"  as const },
  good        : { label: "good",         variant: "green" as const },
  "needs-work": { label: "needs work",   variant: "amber" as const },
  new         : { label: "new",          variant: "purple"as const },
};

function ActionMenu({ murabbi, onEdit, onToggle, onDelete, onTierChange }: {
  murabbi: any; onEdit: () => void; onToggle: () => void; onDelete: () => void;
  onTierChange: (tier: 1 | 2 | 3) => void;
}) {
  const [open, setOpen]           = useState(false);
  const [tierOpen, setTierOpen]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setTierOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentTier: number = murabbi.tier ?? 1;

  return (
    <div className="relative" ref={ref}>
      <button
        className="p-1.5 hover:bg-muted rounded-md text-nc-muted"
        onClick={() => { setOpen((s) => !s); setTierOpen(false); }}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-48 bg-card border border-border rounded-lg shadow-lg z-50 py-1 text-[13px]">
          <button className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-muted text-left"
            onClick={() => { setOpen(false); onEdit(); }}>
            <Pencil className="h-3.5 w-3.5 text-nc-muted" /> Edit
          </button>

          {/* Tier submenu */}
          <div className="relative">
            <button
              className="w-full flex items-center justify-between gap-2.5 px-3.5 py-2 hover:bg-muted text-left"
              onClick={() => setTierOpen((s) => !s)}
            >
              <span className="flex items-center gap-2.5">
                <ShieldCheck className="h-3.5 w-3.5 text-nc-muted" />
                Set Tier (now: {currentTier})
              </span>
              <ChevronRight className="h-3 w-3 text-nc-muted" />
            </button>
            {tierOpen && (
              <div className="absolute right-full top-0 mr-1 w-36 bg-card border border-border rounded-lg shadow-lg py-1 z-60">
                {([1, 2, 3] as const).map((t) => (
                  <button
                    key={t}
                    className={`w-full text-left px-3.5 py-2 hover:bg-muted text-[13px] flex items-center gap-2 ${currentTier === t ? "font-semibold text-teal" : ""}`}
                    onClick={() => { setOpen(false); setTierOpen(false); onTierChange(t); }}
                  >
                    {currentTier === t && <span className="text-teal">✓</span>}
                    {currentTier !== t && <span className="w-3" />}
                    Tier {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-muted text-left"
            onClick={() => { setOpen(false); onToggle(); }}>
            {murabbi.isActive
              ? <><UserX className="h-3.5 w-3.5 text-amber-500" /> Deactivate</>
              : <><UserCheck className="h-3.5 w-3.5 text-green-600" /> Activate</>}
          </button>
          <div className="border-t border-border my-1" />
          <button className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-50 text-red-600 text-left"
            onClick={() => { setOpen(false); onDelete(); }}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

const TIERS = [
  { num: 1, name: "Asaas (Foundation)",    desc: "18 hours · 2-day training · Leads one circle" },
  { num: 2, name: "Mutqin (Proficient)",   desc: "After 1 complete year · Mentors Tier 1 Murabbis" },
  { num: 3, name: "Mudarrib (Master Trainer)", desc: "2 circles + Tier 2 · Trains other Murabbis" },
];

export default function MurabbisPage({
  refreshKey,
}: { onAddMurabbi?: () => void; refreshKey?: number }) {
  const { toast } = useToast();
  const [murabbis, setMurabbis]       = useState<any[]>([]);
  const [pageStats, setPageStats]     = useState<any>({});
  const [tierCounts, setTierCounts]   = useState<any>({});
  const [loading, setLoading]         = useState(true);
  const [badges, setBadges]           = useState<Record<string, string>>({});
  const [editMurabbi, setEditMurabbi] = useState<any>(null);
  const [showAdd, setShowAdd]         = useState(false);

  function load() {
    setLoading(true);
    adminService.getMurabbisWithStats()
      .then((res) => {
        const d = res.data.data || {};
        setMurabbis(d.murabbis || []);
        setPageStats(d.stats || {});
        setTierCounts(d.tiers || {});
      })
      .catch(() => toast({ variant: "destructive", title: "Failed to load murabbis" }))
      .finally(() => setLoading(false));
    courseService.badges()
      .then((res) => setBadges(Object.fromEntries((res.data.data || []).map((b: any) => [b.user, b.badge]))))
      .catch(() => { /* badges are extra; the list works without them */ });
  }

  useEffect(() => { load(); }, [refreshKey]);

  async function handleTierChange(m: any, tier: 1 | 2 | 3) {
    try {
      await adminService.updateMurabbiTier(m._id, tier);
      toast({ title: `${m.fullName} moved to Tier ${tier}.` });
      load();
    } catch { toast({ variant: "destructive", title: "Failed to update tier." }); }
  }

  async function toggleStatus(m: any) {
    try {
      if (m.isActive) { await adminService.deactivateMurabbi(m._id); toast({ title: `${m.fullName} deactivated.` }); }
      else             { await adminService.activateMurabbi(m._id);   toast({ title: `${m.fullName} ${m.pendingApproval ? "approved" : "activated"}.` }); }
      load();
    } catch { toast({ variant: "destructive", title: "Action failed." }); }
  }

  async function handleDelete(m: any) {
    if (!confirm(`Delete ${m.fullName}? This cannot be undone.`)) return;
    try {
      await adminService.deleteMurabbi(m._id);
      toast({ title: "Murabbi deleted." });
      load();
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Delete failed." });
    }
  }

  const activeMurabbis   = murabbis.filter((m) => m.isActive);
  const pendingMurabbis  = murabbis.filter((m) => !m.isActive && m.pendingApproval);
  const inactiveMurabbis = murabbis.filter((m) => !m.isActive && !m.pendingApproval);
  const total            = pageStats.total ?? murabbis.length;
  const tier1Count       = tierCounts.tier1 ?? activeMurabbis.length;
  const tier2Count       = tierCounts.tier2 ?? 0;
  const tier3Count       = tierCounts.tier3 ?? 0;
  const avgHealth        = pageStats.avgCircleHealth ?? 0;

  return (
    <div className="page-animate">

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:gap-4 mb-7">
        <StatCard
          label="Total Murabbis"
          value={total}
          meta="All Tier 1 Certified"
          color="teal"
        />
        <StatCard
          label="Active"
          value={activeMurabbis.length}
          meta="Currently active"
          color="green"
        />
        <StatCard
          label="Tier 2 Candidates"
          value={pageStats.tier2Candidates ?? tier2Count}
          meta="After Year 1 completion"
          color="gold"
        />
        <StatCard
          label="Avg. Circle Health"
          value={`${avgHealth}%`}
          meta="Based on KPIs"
          color="purple"
        />
      </div>

      {/* ── Main 2-col layout ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* LEFT — Active Murabbis list */}
        <NcCard>
          <CardHeader>
            <CardTitle>Active Murabbis</CardTitle>
            <button className="btn-gold text-sm" onClick={() => setShowAdd(true)}>+ Add Murabbi</button>
          </CardHeader>

          {loading ? (
            <div className="text-center py-10 text-nc-muted text-sm animate-pulse">Loading murabbis...</div>
          ) : activeMurabbis.length === 0 ? (
            <div className="text-center py-10 text-nc-muted text-sm">No active murabbis found.</div>
          ) : (
            <div className="scroll-hover max-h-[420px] divide-y divide-border">
              {activeMurabbis.map((m) => {
                const badge = BADGE_CONFIG[m.badge as keyof typeof BADGE_CONFIG] ?? BADGE_CONFIG.new;
                const primaryCircle = m.circles?.[0];
                const circleName = primaryCircle?.name || "—";
                const tierNum: number = m.tier ?? 1;

                return (
                  <div key={m._id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors">

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-lg bg-teal-lt flex items-center justify-center text-xs font-bold text-teal flex-shrink-0 overflow-hidden">
                      {m.image
                        ? <img src={m.image} alt={m.fullName} className="w-full h-full object-cover" />
                        : getInitials(m.fullName)
                      }
                    </div>

                    {/* Name + circle */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13.5px] truncate">{m.fullName}</div>
                      <div className="text-[11.5px] text-nc-muted">
                        {circleName} · Tier {tierNum}
                        {m.circles?.length > 1 && (
                          <span className="ml-1 text-teal">+{m.circles.length - 1} more</span>
                        )}
                      </div>
                      {badges[m._id] && <CertifiedBadge label={badges[m._id]} className="mt-1" />}
                    </div>

                    {/* Right side — badge + stats */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <NcBadge variant={badge.variant}>{badge.label}</NcBadge>
                        <div className="text-[11px] text-nc-muted mt-1">
                          {m.attendanceRate !== null ? `${m.attendanceRate}% att` : "no sessions"} · {m.studentCount} students
                        </div>
                      </div>
                      <ActionMenu
                        murabbi={m}
                        onEdit={() => setEditMurabbi(m)}
                        onToggle={() => toggleStatus(m)}
                        onDelete={() => handleDelete(m)}
                        onTierChange={(t) => handleTierChange(m, t)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Self-registered accounts waiting for an admin to approve them */}
          {pendingMurabbis.length > 0 && (
            <div className="border-t border-border px-4 py-3">
              <p className="text-[12px] text-amber-600 font-semibold uppercase tracking-wide mb-2">
                Awaiting approval ({pendingMurabbis.length})
              </p>
              <div className="divide-y divide-border">
                {pendingMurabbis.map((m) => (
                  <div key={m._id} className="flex items-center gap-3 py-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                      {getInitials(m.fullName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px] truncate">{m.fullName}</div>
                      <div className="text-[11px] text-nc-muted">{m.email}</div>
                    </div>
                    <button
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold text-green-700 bg-green-50 hover:bg-green-100"
                      onClick={() => toggleStatus(m)}
                    >
                      <UserCheck className="h-3.5 w-3.5" /> Approve
                    </button>
                    <ActionMenu
                      murabbi={m}
                      onEdit={() => setEditMurabbi(m)}
                      onToggle={() => toggleStatus(m)}
                      onDelete={() => handleDelete(m)}
                      onTierChange={(t) => handleTierChange(m, t)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inactive murabbis collapsible section */}
          {inactiveMurabbis.length > 0 && (
            <div className="border-t border-border px-4 py-3">
              <p className="text-[12px] text-nc-muted font-semibold uppercase tracking-wide mb-2">
                Inactive ({inactiveMurabbis.length})
              </p>
              <div className="divide-y divide-border">
                {inactiveMurabbis.map((m) => (
                  <div key={m._id} className="flex items-center gap-3 py-2.5 opacity-60">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-nc-muted flex-shrink-0">
                      {getInitials(m.fullName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px] truncate">{m.fullName}</div>
                      <div className="text-[11px] text-nc-muted">{m.email}</div>
                    </div>
                    <ActionMenu
                      murabbi={m}
                      onEdit={() => setEditMurabbi(m)}
                      onToggle={() => toggleStatus(m)}
                      onDelete={() => handleDelete(m)}
                      onTierChange={(t) => handleTierChange(m, t)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </NcCard>

        {/* RIGHT — Certification Tiers */}
        <NcCard>
          <CardHeader>
            <CardTitle>Murabbi Certification Tiers</CardTitle>
          </CardHeader>

          <div className="px-4 pb-4 space-y-4">
            {TIERS.map((tier) => {
              const count    = tier.num === 1 ? tier1Count : tier.num === 2 ? tier2Count : tier3Count;
              const maxCount = Math.max(total, 1);
              const pct      = Math.round((count / maxCount) * 100);

              return (
                <div
                  key={tier.num}
                  className={`rounded-xl border p-4 ${TIER_COLORS[tier.num]}`}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`h-4 w-4 flex-shrink-0 ${TIER_TEXT[tier.num]}`} />
                      <span className={`font-semibold text-[13.5px] ${TIER_TEXT[tier.num]}`}>
                        Tier {tier.num} — {tier.name}
                      </span>
                    </div>
                    <span className={`text-[12px] font-semibold whitespace-nowrap ${count > 0 ? TIER_TEXT[tier.num] : "text-nc-muted"}`}>
                      {count} certified
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-[11.5px] text-nc-muted mb-3 pl-6">{tier.desc}</p>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${TIER_BAR[tier.num]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Summary */}
            <div className="pt-2 border-t border-border flex items-center justify-between text-[12px] text-nc-muted">
              <span>Total registered murabbis</span>
              <span className="font-semibold text-foreground">{total}</span>
            </div>
            <div className="flex items-center justify-between text-[12px] text-nc-muted">
              <span>Avg. circle health score</span>
              <span className={`font-semibold ${avgHealth >= 80 ? "text-teal" : avgHealth >= 60 ? "text-gold-dim" : "text-red-500"}`}>
                {avgHealth}%
              </span>
            </div>
          </div>
        </NcCard>
      </div>

      {/* Modals */}
      <AddMurabbiModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={() => { setShowAdd(false); load(); }}
      />
      <EditMurabbiModal
        open={!!editMurabbi}
        murabbi={editMurabbi}
        onClose={() => setEditMurabbi(null)}
        onSuccess={() => { setEditMurabbi(null); load(); }}
      />
    </div>
  );
}
