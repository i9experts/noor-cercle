import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, Bell, CalendarOff, Check, CircleDot, GraduationCap, MessageCircle, Pencil, Phone, Trash2, Warehouse } from "lucide-react";
import HostShell, { Bi, HostCard } from "@/components/host/HostShell";
import FounderCard from "@/components/founder/FounderCard";
import { announcementsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { apiError, apiMessage, unwrap } from "@/lib/finance";
import { pkToday } from "@/lib/schedule";
import { whatsappLink } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { printHostCertificate } from "@/lib/hostCertificate";
import { HostCircle, HostMe, HostSpace, NEXT_STEP, dayLabel, hostService, statusMeta, telLink } from "@/lib/host";
import StatusSteps from "@/components/host/StatusSteps";

interface Announcement { _id: string; title: string; body: string; createdAt: string }

/** The host portal's home: their space's progress, the circle meeting there, unavailable dates, training and news. */
export default function HostHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<HostMe | null>(null);
  const [error, setError] = useState("");
  const [news, setNews] = useState<Announcement[]>([]);

  const load = useCallback(() => {
    hostService.me()
      .then((r) => setData(unwrap<HostMe>(r)))
      .catch((err) => setError(apiError(err, "We couldn’t open your page right now. Please try again later.")));
  }, []);

  useEffect(() => {
    document.title = "Host · Noor Circles";
    load();
    announcementsService.getAll().then((r) => { const l = unwrap<Announcement[]>(r); setNews(Array.isArray(l) ? l : []); }).catch(() => {});
  }, [load]);

  const name = (data?.host?.fullName || user?.fullName || "").split(" ")[0];

  return (
    <HostShell titleUr={`السلام علیکم، ${name}`} titleEn={`Assalam-o-Alaikum, ${name}`}
      sub={<span dir="rtl" lang="ur" className="urdu leading-[2]">آپ کی میزبانی سے محلے میں روشنی کا حلقہ قائم ہوتا ہے۔</span>}>
      {error ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-[14px] text-nc-dark shadow-nc">{error}</div>
      ) : !data ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-[13px] text-nc-muted shadow-nc">Loading…</div>
      ) : (
        <>
          {data.spaces.length === 0 && (
            <HostCard ur="آپ کی جگہ" en="Your space">
              <Bi ur="ابھی آپ کی کوئی جگہ شامل نہیں۔ نور سرکلز ٹیم جلد رابطہ کرے گی۔" en="No space is linked to your account yet. The Noor Circles team will be in touch." />
            </HostCard>
          )}

          {data.spaces.map((s) => <SpaceStatusCard key={s._id} space={s} />)}

          {data.spaces.flatMap((s) => s.circles.map((c) => <CircleCard key={c._id} circle={c} space={s} many={data.spaces.length > 1} />))}

          {data.spaces.length > 0 && <UnavailableCard spaces={data.spaces} onChanged={load} toast={toast} />}

          <TrainingCard done={data.training.done} total={data.training.total} certificate={data.training.certificate} name={data.host?.fullName || user?.fullName || ""} />

          {news.length > 0 && (
            <HostCard ur="اعلانات" en="Announcements" icon={<Bell className="h-4 w-4 text-plum" />}>
              <ul className="space-y-2.5">
                {news.slice(0, 5).map((a) => (
                  <li key={a._id} className="rounded-lg bg-muted/50 px-3.5 py-2.5">
                    <div className="text-[13.5px] font-semibold text-nc-dark">{a.title}</div>
                    <p className="mt-0.5 whitespace-pre-line break-words text-[13px] text-nc-dark/90">{a.body}</p>
                    <div className="mt-1 text-[11px] text-nc-muted">{new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                  </li>
                ))}
              </ul>
            </HostCard>
          )}

          <FounderCard audience="host" className="" onOpen={() => navigate("/host/founder")} />
        </>
      )}
    </HostShell>
  );
}

function SpaceStatusCard({ space: s }: { space: HostSpace }) {
  const next = NEXT_STEP[s.status] ?? NEXT_STEP.offered;
  return (
    <HostCard ur={s.name} en={`Your space · ${[s.area, s.city].filter(Boolean).join(", ") || "—"}`} icon={<Warehouse className="h-4 w-4 text-plum" />}
      action={<Link to="/host/space" className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[12px] font-medium text-plum hover:border-plum"><Pencil className="h-3 w-3" /> Edit</Link>}>
      {s.status === "inactive" ? (
        <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold", statusMeta(s.status).cls)}>{statusMeta(s.status).label}</span>
      ) : <StatusSteps status={s.status} />}
      <Bi className="mt-3 rounded-lg bg-gold-lt/50 px-3.5 py-2" ur={next.ur} en={next.en} urCls="text-[14.5px]" />
    </HostCard>
  );
}

function CircleCard({ circle: c, space, many }: { circle: HostCircle; space: HostSpace; many: boolean }) {
  return (
    <HostCard ur="میرا حلقہ" en={`My circle${many ? ` · ${space.name}` : ""}`} icon={<CircleDot className="h-4 w-4 text-plum" />}>
      <div className="font-serif text-[20px] text-nc-dark">{c.name}</div>
      <div className="text-[13px] text-nc-muted">{c.schedule || "No weekly schedule yet"}{!c.isActive && " · not active"}</div>

      {c.murabbi && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2.5">
          <div className="mr-auto min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-nc-muted">Murabbi · <span lang="ur" className="urdu normal-case">مربی</span></div>
            <div className="break-words text-[14px] font-medium text-nc-dark">{c.murabbi.fullName}</div>
            {c.murabbi.phone && <div className="text-[12.5px] text-nc-muted">{c.murabbi.phone}</div>}
          </div>
          {c.murabbi.phone && (
            <>
              <a href={telLink(c.murabbi.phone)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12.5px] font-medium text-plum hover:border-plum">
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
              <a href={whatsappLink(c.murabbi.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12.5px] font-medium text-nc-green hover:border-nc-green">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </>
          )}
        </div>
      )}

      {c.upcoming.length > 0 && (
        <div className="mt-3">
          <Bi ur="آنے والی تاریخیں" en="Coming dates" urCls="text-[14px]" enCls="text-[11.5px] text-nc-muted" />
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {c.upcoming.map((d) => (
              <li key={d.date} className={cn("rounded-full px-2.5 py-1 text-[12px]", d.unavailable ? "bg-nc-red-lt text-nc-red line-through" : "bg-plum-lt/60 text-plum")}
                title={d.unavailable ? "Space unavailable" : undefined}>
                {dayLabel(d.date)}{d.unavailable && <span className="sr-only"> (space unavailable)</span>}
              </li>
            ))}
          </ul>
          {c.upcoming.some((d) => d.unavailable) && <p className="mt-1 text-[11.5px] text-nc-muted">Crossed-out dates are marked unavailable.</p>}
        </div>
      )}
    </HostCard>
  );
}

function UnavailableCard({ spaces, onChanged, toast }: { spaces: HostSpace[]; onChanged: () => void; toast: ReturnType<typeof useToast>["toast"] }) {
  const [spaceId, setSpaceId] = useState(spaces[0]._id);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const today = pkToday();
  const all = spaces.flatMap((s) => s.unavailable.map((u) => ({ ...u, space: s.name })));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!date) return;
    setSaving(true);
    try {
      const r = await hostService.addUnavailable(spaceId, { date, reason: reason.trim() || undefined });
      toast({ title: apiMessage(r, "Marked.") });
      setDate(""); setReason("");
      onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not mark the date.") });
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      const r = await hostService.removeUnavailable(id);
      toast({ title: apiMessage(r, "Removed.") });
      onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not remove the date.") });
    }
  }

  const input = "h-10 w-full rounded-md border border-input bg-card px-3 text-[13.5px] focus:border-primary focus:outline-none";
  return (
    <HostCard ur="جگہ دستیاب نہیں" en="Space unavailable" icon={<CalendarOff className="h-4 w-4 text-plum" />}>
      <Bi ur="کسی دن جگہ استعمال نہ ہو سکے تو یہاں بتائیں۔ مربی اور ٹیم کو فوراً اطلاع مل جائے گی۔"
        en="If the space can’t be used on a day, mark it here. The murabbi and the team are told at once." urCls="text-[14px]" />
      <form onSubmit={submit} className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
        {spaces.length > 1 && (
          <select className={cn(input, "sm:col-span-3")} value={spaceId} onChange={(e) => setSpaceId(e.target.value)} aria-label="Space">
            {spaces.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        )}
        <input type="date" className={input} min={today} value={date} onChange={(e) => setDate(e.target.value)} required aria-label="Date" />
        <input className={input} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Reason (optional) · وجہ" aria-label="Reason (optional)" />
        <button type="submit" className="btn-primary justify-center" disabled={saving || !date}>{saving ? "Saving…" : "Mark unavailable"}</button>
      </form>

      {all.length > 0 && (
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
          {all.map((u) => (
            <li key={u._id} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium text-nc-dark">{dayLabel(u.date)}{spaces.length > 1 && <span className="font-normal text-nc-muted"> · {u.space}</span>}</div>
                {u.reason && <div className="break-words text-[12px] text-nc-muted">{u.reason}</div>}
              </div>
              <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-nc-muted hover:bg-nc-red-lt hover:text-nc-red" onClick={() => remove(u._id)}>
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </HostCard>
  );
}

function TrainingCard({ done, total, certificate, name }: { done: number; total: number; certificate: HostMe["training"]["certificate"]; name: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <HostCard ur="میزبانوں کا Asaas" en="Asaas for Hosts" icon={<GraduationCap className="h-4 w-4 text-plum" />}
      action={<Link to="/host/training" className="btn-primary !py-1.5 text-[12.5px]">{done === 0 ? "Start" : done < total ? "Continue" : "Open"}</Link>}>
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-plum" style={{ width: `${pct}%` }} /></div>
        <span className="text-[13px] font-medium text-nc-dark">{done} of {total} modules</span>
      </div>
      {certificate ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-nc-green-lt px-3 py-2 text-[13px] text-nc-dark">
          <Award className="h-4 w-4 text-nc-green" /> <span className="mr-auto">Certified · {certificate.number}</span>
          <button className="btn-outline !py-1 text-[12px]" onClick={() => printHostCertificate({ name, number: certificate.number, issuedOn: certificate.issuedOn })}>Certificate</button>
        </div>
      ) : (
        <Bi className="mt-2" ur="چھ مختصر حصے، ہر ایک کے بعد چار سوال۔ مکمل کرنے پر نور سرکلز میزبان کی سند ملے گی۔"
          en="Six short modules, each with four questions. Finish them all for your Noor Circles Host certificate." urCls="text-[14px]" />
      )}
    </HostCard>
  );
}
