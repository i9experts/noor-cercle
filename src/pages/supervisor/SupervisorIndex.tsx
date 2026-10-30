import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays, CircleDot, ClipboardPen, GraduationCap, Inbox, LayoutDashboard, Mail, Plus, Settings, Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppSidebar, { SidebarNavGroup } from "@/components/layout/AppSidebar";
import TopBar from "@/components/layout/TopBar";
import NcCard from "@/components/shared/NcCard";
import ClusterDashboard, { ClusterDashboardData } from "@/components/cluster/ClusterDashboard";
import VisitForm from "@/components/cluster/VisitForm";
import VisitList from "@/components/cluster/VisitList";
import CircleForm, { CircleOptions } from "@/components/cluster/CircleForm";
import MurabbiSettings from "@/pages/murabbi/MurabbiSettings";
import { useAuth } from "@/context/AuthContext";
import { supervisorService } from "@/services/api.service";
import { whatsappLink } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { apiError, unwrap } from "@/lib/finance";
import { formatDay, scheduleLabel } from "@/lib/schedule";
import { ChecklistItem, TRAINING_META, Visit } from "@/lib/cluster";
import { SupervisorChildren, SupervisorInterest } from "./SupervisorPeople";
import { SupervisorCalendar, SupervisorMessages } from "./SupervisorComms";

const navGroups: SidebarNavGroup[] = [
  { label: "Overview", items: [{ icon: LayoutDashboard, label: "Dashboard", page: "supervisor-dashboard" }] },
  {
    label: "My Cluster",
    items: [
      { icon: CircleDot,     label: "Circles",  page: "supervisor-circles"  },
      { icon: GraduationCap, label: "Children", page: "supervisor-children", badgeKey: "children" },
      { icon: Users,         label: "Murabbis", page: "supervisor-murabbis" },
      { icon: Inbox,         label: "Interest Requests", page: "supervisor-interest", badgeKey: "interest" },
    ],
  },
  {
    label: "Support",
    items: [
      { icon: ClipboardPen, label: "Visits",   page: "supervisor-visits"   },
      { icon: CalendarDays, label: "Calendar", page: "supervisor-calendar" },
      { icon: Mail,         label: "Messages", page: "supervisor-messages" },
    ],
  },
  { label: "System", items: [{ icon: Settings, label: "Settings", page: "settings" }] },
];

export interface SupervisorShared {
  clusters: any[];
  dashboard: ClusterDashboardData | null;
  options: CircleOptions | null;
  reload: () => void;
}

export default function SupervisorIndex() {
  const { toast } = useToast();
  const [activePage, setActivePage] = useState("supervisor-dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [clusters, setClusters] = useState<any[]>([]);
  const [clusterId, setClusterId] = useState("");
  const [dashboard, setDashboard] = useState<ClusterDashboardData | null>(null);
  const [options, setOptions] = useState<CircleOptions | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [visitFor, setVisitFor] = useState<string | null | undefined>(undefined);
  const [editCircle, setEditCircle] = useState<any | null>(null);
  const [enrolOpen, setEnrolOpen] = useState(false);
  const [visitsKey, setVisitsKey] = useState(0);

  const reload = useCallback(() => {
    supervisorService.dashboard(clusterId || undefined)
      .then((r) => setDashboard(unwrap(r)))
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load your cluster.") }));
    supervisorService.circleOptions().then((r) => setOptions(unwrap(r))).catch(() => {});
  }, [clusterId, toast]);

  useEffect(reload, [reload]);
  useEffect(() => {
    supervisorService.clusters().then((r) => setClusters(unwrap<any>(r).clusters)).catch(() => {});
    supervisorService.checklist().then((r) => setChecklist(unwrap<any>(r).checklist)).catch(() => {});
  }, []);

  const handleNav = (page: string) => {
    setActivePage(page);
    setNavOpen(false);
    window.scrollTo(0, 0);
  };

  const shared: SupervisorShared = { clusters, dashboard, options, reload };
  const activeCircles = (dashboard?.circles ?? []).filter((c) => c.isActive);
  const logVisit = (circleId?: string) => setVisitFor(circleId ?? null);

  const renderPage = () => {
    switch (activePage) {
      case "supervisor-circles":
        return <CirclesPage shared={shared} onNew={() => setEditCircle({})} onEdit={setEditCircle} onVisit={logVisit} />;
      case "supervisor-children":  return <SupervisorChildren shared={shared} enrolOpen={enrolOpen} setEnrolOpen={setEnrolOpen} />;
      case "supervisor-murabbis":  return <MurabbisPage />;
      case "supervisor-interest":  return <SupervisorInterest onChanged={reload} />;
      case "supervisor-visits":    return <VisitsPage key={visitsKey} onLog={() => logVisit()} />;
      case "supervisor-calendar":  return <SupervisorCalendar shared={shared} />;
      case "supervisor-messages":  return <SupervisorMessages shared={shared} />;
      case "settings":             return <MurabbiSettings />;
      default:
        return (
          <DashboardPage clusters={clusters} clusterId={clusterId} setClusterId={setClusterId} dashboard={dashboard}
            onVisit={logVisit} onEdit={setEditCircle} />
        );
    }
  };

  return (
    <>
      <AppSidebar
        groups={navGroups} activePage={activePage} onNavigate={handleNav}
        counts={{ children: dashboard?.totals.students ?? 0, interest: dashboard?.totals.waitingInterest ?? 0 }}
        seenStorageKey="supervisor_sidebar_seen" portalLabel="Cluster Supervisor" open={navOpen} onClose={() => setNavOpen(false)}
      />
      <div className="lg:ml-[264px] min-h-screen flex flex-col">
        <TopBar activePage={activePage} onEnroll={() => { handleNav("supervisor-children"); setEnrolOpen(true); }} onMenu={() => setNavOpen(true)} onMurabbiNav={handleNav} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{renderPage()}</main>
      </div>
      <VisitForm
        open={visitFor !== undefined} circleId={visitFor} circles={activeCircles} checklist={checklist}
        onClose={() => setVisitFor(undefined)} onSaved={() => { reload(); setVisitsKey((k) => k + 1); }}
      />
      <CircleForm circle={editCircle} options={options} onClose={() => setEditCircle(null)} onSaved={reload} />
    </>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────

function DashboardPage({ clusters, clusterId, setClusterId, dashboard, onVisit, onEdit }: {
  clusters: any[]; clusterId: string; setClusterId: (id: string) => void; dashboard: ClusterDashboardData | null;
  onVisit: (circleId?: string) => void; onEdit: (c: any) => void;
}) {
  const { user } = useAuth();
  const names = clusters.map((c) => c.name).join(", ");
  return (
    <div className="page-animate">
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h2 className="font-serif text-[26px] text-nc-dark">Assalam-o-Alaikum, {user?.fullName?.split(" ")[0]}</h2>
          <p className="mt-1 text-[13.5px] text-nc-muted">
            {clusters.length ? `You look after ${names}.` : "You haven’t been given a cluster yet. The admin team will add you to one."}
          </p>
        </div>
        {clusters.length > 1 && (
          <select value={clusterId} onChange={(e) => setClusterId(e.target.value)} aria-label="Cluster"
            className="h-10 rounded-md border border-input bg-card px-3 text-[13.5px] focus:border-primary focus:outline-none">
            <option value="">All my clusters</option>
            {clusters.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
        <button className="btn-primary" onClick={() => onVisit()} disabled={!dashboard?.circles.length}><ClipboardPen className="h-4 w-4" /> Log a visit</button>
      </div>
      {dashboard ? <ClusterDashboard data={dashboard} onLogVisit={onVisit} onEditCircle={onEdit} /> : <div className="py-16 text-center text-sm text-nc-muted">Loading…</div>}
    </div>
  );
}

// ── Circles ─────────────────────────────────────────────────────────────────

function CirclesPage({ shared, onNew, onEdit, onVisit }: { shared: SupervisorShared; onNew: () => void; onEdit: (c: any) => void; onVisit: (id: string) => void }) {
  const circles = shared.dashboard?.circles ?? [];
  return (
    <div className="page-animate">
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h2 className="font-serif text-[26px] text-nc-dark">Circles</h2>
          <p className="mt-1 text-[13.5px] text-nc-muted">Open new circles in your neighbourhoods, set their weekly schedule and syllabus, or pause a circle.</p>
        </div>
        <button className="btn-primary" onClick={onNew} disabled={!shared.options?.neighbourhoods.length}><Plus className="h-4 w-4" /> New circle</button>
      </div>
      {!shared.dashboard ? <div className="py-16 text-center text-sm text-nc-muted">Loading…</div> : circles.length === 0 ? (
        <NcCard className="text-center text-[13.5px] text-nc-muted">No circles in your cluster yet.</NcCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {circles.map((c) => (
            <NcCard key={c._id} className={cn("flex flex-col p-5", !c.isActive && "opacity-60")}>
              <div className="font-serif text-[19px] text-nc-dark">{c.name}{!c.isActive && <span className="ml-2 font-sans text-[11px] text-nc-muted">Paused</span>}</div>
              <div className="mb-3 text-[12.5px] text-nc-muted">{c.neighbourhood?.name} · {scheduleLabel(c)}</div>
              <dl className="mb-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12.5px]">
                <dt className="text-nc-muted">Murabbi</dt><dd className="text-nc-dark">{c.murabbi?.fullName ?? "—"}</dd>
                <dt className="text-nc-muted">Children</dt><dd className="text-nc-dark">{c.students} of {c.capacity}</dd>
                <dt className="text-nc-muted">Syllabus</dt><dd className="text-nc-dark">{c.track?.name ?? "None yet"}</dd>
                <dt className="text-nc-muted">Started</dt><dd className="text-nc-dark">{c.startDate ? formatDay(c.startDate, true) : "—"}</dd>
              </dl>
              <div className="mt-auto flex gap-2">
                <button className="btn-outline flex-1 justify-center !py-1.5 text-[12.5px]" onClick={() => onEdit(c)}>Edit</button>
                {c.isActive && <button className="btn-outline flex-1 justify-center !py-1.5 text-[12.5px]" onClick={() => onVisit(c._id)}>Log a visit</button>}
              </div>
            </NcCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Murabbis ────────────────────────────────────────────────────────────────

function MurabbisPage() {
  const { toast } = useToast();
  const [list, setList] = useState<any[] | null>(null);
  useEffect(() => {
    supervisorService.murabbis().then((r) => setList(unwrap<any>(r).murabbis))
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load murabbis.") }));
  }, [toast]);

  return (
    <div className="page-animate">
      <h2 className="font-serif text-[26px] text-nc-dark">Murabbis</h2>
      <p className="mb-5 mt-1 text-[13.5px] text-nc-muted">The murabbis running circles in your cluster, their Asaas training and attendance over the last four weeks.</p>
      {!list ? <div className="py-16 text-center text-sm text-nc-muted">Loading…</div> : list.length === 0 ? (
        <NcCard className="text-center text-[13.5px] text-nc-muted">No murabbis in your cluster yet.</NcCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => (
            <NcCard key={m._id} className="p-5">
              <div className="flex items-start gap-2">
                <div className="mr-auto">
                  <div className="font-serif text-[19px] text-nc-dark">{m.fullName}</div>
                  <div className="text-[12px] text-nc-muted">{m.email}</div>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", TRAINING_META[m.training]?.cls)}>{TRAINING_META[m.training]?.label}</span>
              </div>
              <div className="mt-3 text-[12.5px] text-nc-dark">{m.circles.map((c: any) => c.name).join(", ")}</div>
              <div className="mt-1 text-[12px] text-nc-muted">
                Attendance {m.attendance28 === null ? "—" : `${m.attendance28}%`} · last sign-in {m.lastLoginAt ? formatDay(m.lastLoginAt) : "never"}
              </div>
              {m.phone && (
                <div className="mt-3 flex gap-2">
                  <a className="btn-outline flex-1 justify-center !py-1.5 text-[12.5px]" href={`tel:${m.phone}`}>Call</a>
                  <a className="btn-outline flex-1 justify-center !py-1.5 text-[12.5px]" target="_blank" rel="noreferrer"
                    href={whatsappLink(m.phone)}>WhatsApp</a>
                </div>
              )}
            </NcCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Visits ──────────────────────────────────────────────────────────────────

function VisitsPage({ onLog }: { onLog: () => void }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const load = useCallback(() => {
    supervisorService.visits().then((r) => setVisits(unwrap<any>(r).visits))
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load visits.") }));
  }, [toast]);
  useEffect(load, [load]);

  return (
    <div className="page-animate">
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h2 className="font-serif text-[26px] text-nc-dark">Visits</h2>
          <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
            Visit each circle at least once a month. Score what you saw, note what went well and agree follow-ups with the murabbi.
            A safeguarding concern alerts the admin team at once.
          </p>
        </div>
        <button className="btn-primary" onClick={onLog}><ClipboardPen className="h-4 w-4" /> Log a visit</button>
      </div>
      {!visits ? <div className="py-16 text-center text-sm text-nc-muted">Loading…</div> : (
        <VisitList
          visits={visits}
          canDelete={(v) => v.supervisor?._id === user?.id}
          onFollowUp={async (v, fid, done) => {
            try { await supervisorService.followUp(v._id, fid, done); load(); }
            catch (err) { toast({ variant: "destructive", title: apiError(err, "Could not update.") }); }
          }}
          onDelete={async (v) => {
            if (!window.confirm("Remove this visit report?")) return;
            try { await supervisorService.deleteVisit(v._id); load(); }
            catch (err) { toast({ variant: "destructive", title: apiError(err, "Could not remove.") }); }
          }}
        />
      )}
    </div>
  );
}
