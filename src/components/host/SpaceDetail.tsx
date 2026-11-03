import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Award, Check, ClipboardPen, Mail, MessageCircle, Pencil, Phone, X, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiError, apiMessage, formatDate, unwrap } from "@/lib/finance";
import { whatsappLink } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/schedule";
import {
  AdminSpaceDetail, AdminSpaceInput, HostOptions, SpaceStatus, VenueCircle, dayLabel, facilityLabel, hostService, recommendationMeta, telLink, toFormValue, toInput, typeLabel,
} from "@/lib/host";
import SpaceForm from "./SpaceForm";
import { StatusChip } from "./SpaceList";
import { joinAddress } from "@/lib/host";

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="border-t border-border pt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-nc-muted">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * One space in full, in a side panel. Admins can edit it, set its status and
 * neighbourhood, keep notes and place circles; supervisors read it and record visits.
 */
export default function SpaceDetail({ spaceId, options, admin, neighbourhoods = [], onClose, onChanged, onVisit, refreshKey = 0, paused = false }: {
  spaceId: string;
  options: HostOptions | null;
  admin: boolean;
  neighbourhoods?: { _id: string; name: string; city?: string }[];
  onClose: () => void;
  onChanged: () => void;
  onVisit: (s: { _id: string; name: string }) => void;
  /** Bump to reload (after a visit is recorded). */
  refreshKey?: number;
  /** A dialog is open on top (Escape closes that, not the panel). */
  paused?: boolean;
}) {
  const { toast } = useToast();
  const [d, setD] = useState<AdminSpaceDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [circles, setCircles] = useState<VenueCircle[]>([]);
  const [place, setPlace] = useState("");
  const [nbh, setNbh] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [openVisit, setOpenVisit] = useState<number | null>(0);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const load = useCallback(() => {
    hostService.space(spaceId)
      .then((r) => {
        const x = unwrap<AdminSpaceDetail>(r);
        setD(x);
        setNbh(x.neighbourhood?._id ?? "");
        setAdminNotes(x.adminNotes ?? "");
      })
      .catch((err) => { toast({ variant: "destructive", title: apiError(err, "Could not open the space.") }); closeRef.current(); });
    if (admin) hostService.circles().then((r) => setCircles(unwrap<VenueCircle[]>(r) ?? [])).catch(() => {});
  }, [spaceId, admin, toast]);

  useEffect(load, [load, refreshKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !pausedRef.current) closeRef.current(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function patch(data: AdminSpaceInput, fallback = "Saved.") {
    setBusy(true);
    try {
      const r = await hostService.updateSpace(spaceId, data);
      toast({ title: apiMessage(r, fallback) });
      load();
      onChanged();
      return true;
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save.") });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function venue(circleId: string, spaceIdOrNull: string | null) {
    setBusy(true);
    try {
      const r = await hostService.setVenue(circleId, spaceIdOrNull);
      toast({ title: apiMessage(r, "Saved.") });
      setPlace("");
      load();
      onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not change the venue.") });
    } finally {
      setBusy(false);
    }
  }

  const setStatus = (status: SpaceStatus) => patch({ status });
  const canPlace = d && (d.status === "approved" || d.status === "in-use");
  const placeable = circles.filter((c) => !d?.circles.some((x) => x._id === c._id));
  const checkLabel = (key: string) => options?.checklist.find((c) => c.key === key)?.en ?? key;

  return (
    <div className="fixed inset-0 z-[150] flex justify-end bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="flex h-full w-full max-w-2xl flex-col bg-card shadow-2xl" role="dialog" aria-modal="true" aria-label={d?.name ?? "Space"}>
        <div className="flex items-start gap-3 border-b border-border px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="break-words font-serif text-[22px] leading-tight text-nc-dark">{d?.name ?? "Loading…"}</div>
            {d && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-nc-muted">
                <StatusChip status={d.status} />
                <span>{typeLabel(options, d.type)?.en ?? d.type} · capacity {d.capacity}</span>
                {d.cluster && <span>· {d.cluster}</span>}
              </div>
            )}
          </div>
          <button className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-nc-muted hover:bg-teal-lt" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        {!d ? (
          <div className="flex-1 py-16 text-center text-sm text-nc-muted">Loading…</div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            {/* Status and visits */}
            <div className="flex flex-wrap gap-2">
              <button className="btn-outline !py-1.5 text-[12.5px]" onClick={() => onVisit(d)}><ClipboardPen className="h-3.5 w-3.5" /> Record a visit</button>
              {admin && d.status !== "approved" && d.status !== "in-use" && (
                <button className="btn-primary !bg-nc-green !py-1.5 text-[12.5px] hover:!brightness-95" disabled={busy} onClick={() => setStatus("approved")}><Check className="h-3.5 w-3.5" /> Approve</button>
              )}
              {admin && d.status !== "inactive" && (
                <button className="btn-outline !py-1.5 text-[12.5px]" disabled={busy} onClick={() => setStatus("inactive")}>Mark inactive</button>
              )}
              {admin && d.status !== "offered" && (
                <button className="btn-outline !py-1.5 text-[12.5px]" disabled={busy} onClick={() => setStatus("offered")}>Back to offered</button>
              )}
            </div>
            {admin && !d.lastVisit && d.status === "offered" && (
              <p className="rounded-md bg-gold-lt/60 px-3 py-2 text-[12.5px] text-nc-dark">Not visited yet. Record a visit before approving the space.</p>
            )}

            {/* Host */}
            {d.host && (
              <Section title="Host">
                <div className="text-[14px] font-medium text-nc-dark">{d.host.fullName}</div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px]">
                  <a href={`mailto:${d.host.email}`} className="inline-flex min-w-0 items-center gap-1 break-all text-nc-muted hover:text-plum"><Mail className="h-3.5 w-3.5 flex-shrink-0" /> {d.host.email}</a>
                  {d.host.phone && (
                    <>
                      <a href={telLink(d.host.phone)} className="inline-flex items-center gap-1 text-nc-muted hover:text-plum"><Phone className="h-3.5 w-3.5" /> {d.host.phone}</a>
                      <a href={whatsappLink(d.host.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-nc-green hover:underline"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
                    </>
                  )}
                </div>
              </Section>
            )}

            {/* Details */}
            <Section title="The space" action={admin && !editing ? (
              <button className="inline-flex items-center gap-1 text-[12.5px] font-medium text-plum hover:underline" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" /> Edit</button>
            ) : undefined}>
              {editing ? (
                <>
                  <SpaceForm initial={toFormValue(d)} options={options} saveLabel="Save details"
                    onSave={async (v) => { if (await patch(toInput(v), "Space saved.")) setEditing(false); }} />
                  <button className="mt-2 text-[12.5px] text-nc-muted hover:text-nc-dark" onClick={() => setEditing(false)}>Cancel</button>
                </>
              ) : (
                <div className="space-y-2.5 text-[13px] text-nc-dark">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-nc-muted">Address</div>
                    <div className="break-words">{joinAddress(d.address, d.area, d.city) || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-nc-muted">Facilities</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {d.facilities.length ? d.facilities.map((f) => (
                        <span key={f} className="rounded-full bg-plum-lt px-2.5 py-0.5 text-[12px] text-plum">{facilityLabel(options, f)?.en ?? f}</span>
                      )) : <span className="text-nc-muted">None listed</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-nc-muted">When it’s free</div>
                    {d.availability.length ? (
                      <ul className="mt-0.5">
                        {d.availability.map((a, i) => <li key={i}>{options?.days[a.day] ?? a.day}: {formatTime(a.from)} – {formatTime(a.to)}</li>)}
                      </ul>
                    ) : <div className="text-nc-muted">Not given</div>}
                  </div>
                  {d.notes && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-nc-muted">Host’s notes</div>
                      <p className="whitespace-pre-line break-words">{d.notes}</p>
                    </div>
                  )}
                  {d.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {d.photos.map((p) => (
                        <a key={p} href={p} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                          <img src={p} alt="" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* Admin only: neighbourhood and notes */}
            {admin && (
              <Section title="Neighbourhood and team notes">
                <label className="mb-2 block">
                  <span className="mb-1 block text-[12px] text-nc-muted">Neighbourhood (links the space to a cluster and its supervisor)</span>
                  <select value={nbh} onChange={(e) => setNbh(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-[13.5px] focus:border-primary focus:outline-none">
                    <option value="">No neighbourhood</option>
                    {neighbourhoods.map((n) => <option key={n._id} value={n._id}>{n.name}{n.city ? ` · ${n.city}` : ""}</option>)}
                  </select>
                </label>
                <label className="mb-2 block">
                  <span className="mb-1 block text-[12px] text-nc-muted">Admin notes (only admins see these)</span>
                  <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} maxLength={1000} rows={3}
                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-[13.5px] focus:border-primary focus:outline-none" />
                </label>
                <button className="btn-primary !py-1.5 text-[12.5px]" disabled={busy || (nbh === (d.neighbourhood?._id ?? "") && adminNotes === (d.adminNotes ?? ""))}
                  onClick={() => patch({ neighbourhoodId: nbh || null, adminNotes })}>Save</button>
              </Section>
            )}

            {/* Circles */}
            <Section title="Circles meeting here">
              {d.circles.length ? (
                <ul className="space-y-1.5">
                  {d.circles.map((c) => (
                    <li key={c._id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-[13px]">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-nc-dark">{c.name}</div>
                        <div className="text-[12px] text-nc-muted">{[c.schedule, c.murabbi].filter(Boolean).join(" · ")}</div>
                      </div>
                      {admin && <button className="rounded-md px-2 py-1 text-[12px] text-nc-muted hover:bg-nc-red-lt hover:text-nc-red" disabled={busy} onClick={() => venue(c._id, null)}>Remove</button>}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-[13px] text-nc-muted">No circle meets here yet.</p>}
              {admin && (
                canPlace ? (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <select value={place} onChange={(e) => setPlace(e.target.value)} aria-label="Circle to place here"
                      className="h-10 min-w-0 flex-1 rounded-md border border-input bg-card px-3 text-[13.5px] focus:border-primary focus:outline-none">
                      <option value="">Place a circle here…</option>
                      {placeable.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}{c.neighbourhood ? ` · ${c.neighbourhood}` : ""}{c.venue ? ` (now at ${c.venue.name})` : ""}{!c.isActive ? " · inactive" : ""}
                        </option>
                      ))}
                    </select>
                    <button className="btn-primary justify-center" disabled={!place || busy} onClick={() => venue(place, d._id)}>Place</button>
                  </div>
                ) : (
                  <p className="mt-2 rounded-md bg-muted px-3 py-2 text-[12.5px] text-nc-muted">A circle can be placed here once the space is approved{d.status === "inactive" ? " (it is inactive now)" : ""}.</p>
                )
              )}
            </Section>

            {/* Visits */}
            <Section title={`Visits (${d.visits.length})`}>
              {d.visits.length === 0 ? <p className="text-[13px] text-nc-muted">No visits recorded yet.</p> : (
                <ul className="space-y-2">
                  {d.visits.map((v, i) => {
                    const rec = recommendationMeta(v.recommendation);
                    const okCount = v.checklist.filter((c) => c.ok).length;
                    const open = openVisit === i;
                    return (
                      <li key={v._id ?? i} className="rounded-md border border-border">
                        <button className="flex w-full flex-wrap items-center gap-2 px-3 py-2 text-left text-[13px]" onClick={() => setOpenVisit(open ? null : i)} aria-expanded={open}>
                          <span className="font-medium text-nc-dark">{formatDate(v.at)}</span>
                          <span className="text-nc-muted">{v.byName}</span>
                          <span className="text-nc-muted">· {okCount}/{v.checklist.length} checks</span>
                          {rec && <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold", rec.cls)}>{rec.label}</span>}
                        </button>
                        {open && (
                          <div className="border-t border-border px-3 py-2">
                            <ul className="space-y-1">
                              {v.checklist.map((c) => (
                                <li key={c.key} className="flex items-start gap-1.5 text-[12.5px]">
                                  {c.ok ? <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-nc-green" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-nc-red" />}
                                  <span className="min-w-0 break-words">{checkLabel(c.key)}{c.note && <span className="text-nc-muted"> · {c.note}</span>}</span>
                                </li>
                              ))}
                            </ul>
                            {v.notes && <p className="mt-2 whitespace-pre-line break-words rounded bg-muted/60 px-2.5 py-1.5 text-[12.5px] text-nc-dark">{v.notes}</p>}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>

            {/* Unavailable dates */}
            <Section title="Unavailable dates">
              {d.unavailable.length === 0 ? <p className="text-[13px] text-nc-muted">None marked.</p> : (
                <ul className="flex flex-wrap gap-1.5">
                  {d.unavailable.map((u) => (
                    <li key={u._id} className="rounded-full bg-nc-amber-lt px-2.5 py-1 text-[12px] text-nc-dark" title={u.reason || undefined}>
                      {dayLabel(u.date)}{u.reason && <span className="text-nc-muted"> · {u.reason}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Training */}
            <Section title={`Asaas for Hosts (${d.training.done}/${d.training.total})`}>
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {d.trainingModules.map((m) => (
                  <li key={m.key} className="flex items-start gap-1.5 text-[12.5px]">
                    {m.passedAt ? <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-nc-green" /> : <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-border" />}
                    <span className={m.passedAt ? "text-nc-dark" : "text-nc-muted"}>{m.titleEn}{m.passedAt && <span className="text-nc-muted"> · {formatDate(m.passedAt)}</span>}</span>
                  </li>
                ))}
              </ul>
              {d.certificate && <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-nc-green-lt px-2.5 py-1 text-[12px] font-medium text-nc-green"><Award className="h-3.5 w-3.5" /> Certified · {d.certificate.number}</p>}
            </Section>
          </div>
        )}
      </aside>
    </div>
  );
}
