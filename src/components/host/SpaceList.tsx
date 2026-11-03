import { useMemo, useState } from "react";
import { Award, CalendarOff, CircleDot, ClipboardPen, Mail, MapPin, MessageCircle, Phone, Search, Users } from "lucide-react";
import { formatDate } from "@/lib/finance";
import { whatsappLink } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { AdminSpace, HostOptions, SPACE_STATUSES, recommendationMeta, statusMeta, telLink, typeLabel } from "@/lib/host";

export function StatusChip({ status, className }: { status: string; className?: string }) {
  const m = statusMeta(status);
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", m.cls, className)}>{m.label}</span>;
}

/** Hosts' spaces with counts by status, a status filter and search (admins and supervisors). */
export default function SpaceList({ spaces, options, loading, onOpen, onVisit }: {
  spaces: AdminSpace[];
  options: HostOptions | null;
  loading: boolean;
  onOpen: (s: AdminSpace) => void;
  onVisit: (s: AdminSpace) => void;
}) {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  const counts = useMemo(() => Object.fromEntries(SPACE_STATUSES.map((s) => [s, spaces.filter((x) => x.status === s).length])), [spaces]);
  const shown = spaces.filter((s) => {
    if (status && s.status !== status) return false;
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return [s.name, s.host?.fullName, s.host?.email, s.host?.phone, s.area, s.city, s.neighbourhood?.name, s.cluster, ...s.circles.map((c) => c.name)]
      .some((v) => v?.toLowerCase().includes(t));
  });

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {SPACE_STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(status === s ? "" : s)} aria-pressed={status === s}
            className={cn("rounded-lg border bg-card p-4 text-left shadow-nc transition-colors", status === s ? "border-plum ring-2 ring-plum/15" : "border-border hover:border-plum/40")}>
            <div className="text-[11.5px] font-medium uppercase tracking-wide text-nc-muted">{statusMeta(s).label}</div>
            <div className="mt-1 font-serif text-[28px] leading-none text-nc-dark">{counts[s] ?? 0}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nc-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search space, host, area, circle…" aria-label="Search spaces"
            className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-[13.5px] focus:border-primary focus:outline-none" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"
          className="h-10 rounded-md border border-input bg-card px-3 text-[13.5px] focus:border-primary focus:outline-none">
          <option value="">All statuses ({spaces.length})</option>
          {SPACE_STATUSES.map((s) => <option key={s} value={s}>{statusMeta(s).label} ({counts[s] ?? 0})</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-nc-muted">Loading…</div>
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-14 text-center text-[13.5px] text-nc-muted">
          {spaces.length ? "No spaces match." : "No hosts’ spaces yet. They appear here when a host account is created from an interest request."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {shown.map((s) => {
            const t = typeLabel(options, s.type);
            const rec = recommendationMeta(s.lastVisit?.recommendation);
            return (
              <article key={s._id} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 shadow-nc">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <button className="break-words text-left font-serif text-[18px] leading-snug text-nc-dark hover:text-plum" onClick={() => onOpen(s)}>{s.name}</button>
                    <div className="text-[12.5px] text-nc-muted">{t ? t.en : s.type} · <Users className="inline h-3 w-3" /> {s.capacity}</div>
                  </div>
                  <StatusChip status={s.status} />
                </div>

                <div className="mt-2 flex items-start gap-1.5 text-[12.5px] text-nc-dark">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-plum" />
                  <span className="min-w-0 break-words">
                    {[s.neighbourhood?.name ?? s.area, s.city].filter(Boolean).join(", ") || "No area yet"}
                    {s.cluster ? <span className="text-nc-muted"> · {s.cluster}</span> : <span className="text-nc-amber"> · no cluster</span>}
                  </span>
                </div>

                {s.host && (
                  <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-[12.5px]">
                    <div className="font-medium text-nc-dark">{s.host.fullName}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-nc-muted">
                      <a href={`mailto:${s.host.email}`} className="inline-flex min-w-0 items-center gap-1 break-all hover:text-plum"><Mail className="h-3 w-3 flex-shrink-0" /> {s.host.email}</a>
                      {s.host.phone && (
                        <>
                          <a href={telLink(s.host.phone)} className="inline-flex items-center gap-1 hover:text-plum"><Phone className="h-3 w-3" /> {s.host.phone}</a>
                          <a href={whatsappLink(s.host.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-nc-green hover:underline"><MessageCircle className="h-3 w-3" /> WhatsApp</a>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-2 grid grid-cols-1 gap-1.5 text-[12.5px] sm:grid-cols-2">
                  <div className="flex items-start gap-1.5">
                    <CircleDot className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-nc-muted" />
                    <span className="min-w-0 break-words">{s.circles.length ? s.circles.map((c) => c.name).join(", ") : <span className="text-nc-muted">No circle here</span>}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <ClipboardPen className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-nc-muted" />
                    <span className="min-w-0">
                      {s.lastVisit ? (
                        <>{formatDate(s.lastVisit.at)}{s.lastVisit.byName && ` · ${s.lastVisit.byName}`}{rec && <span className={cn("ml-1 rounded-full px-1.5 py-px text-[10.5px] font-semibold", rec.cls)}>{rec.label}</span>}</>
                      ) : <span className="text-nc-muted">Not visited yet</span>}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Award className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-nc-muted" />
                    <span>Training {s.training.done}/{s.training.total}{s.training.certified && <span className="ml-1 font-semibold text-nc-green">· certified</span>}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CalendarOff className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-nc-muted" />
                    <span className={s.unavailableSoon ? "font-medium text-nc-amber" : "text-nc-muted"}>{s.unavailableSoon ? `${s.unavailableSoon} unavailable date${s.unavailableSoon === 1 ? "" : "s"} ahead` : "No unavailable dates"}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  <button className="btn-primary !py-1.5 text-[12.5px]" onClick={() => onOpen(s)}>Open</button>
                  <button className="btn-outline !py-1.5 text-[12.5px]" onClick={() => onVisit(s)}><ClipboardPen className="h-3.5 w-3.5" /> Record a visit</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
