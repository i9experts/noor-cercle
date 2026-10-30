import { ReactNode, useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Award, CalendarDays, Heart, Home, Lock, MessageCircleHeart, Pencil, Sparkles, Star, Users } from "lucide-react";
import { familyService } from "@/services/api.service";
import CalendarList from "@/components/shared/CalendarList";
import { titleProps, urduCls } from "@/lib/course";
import { cn } from "@/lib/utils";
import { apiError, unwrap } from "@/lib/finance";
import { formatDay, scheduleLabel } from "@/lib/schedule";
import FamilyProfileForm from "@/components/shared/FamilyProfileForm";
import { FamilyProfile, summarise } from "@/lib/familyProfile";

/** Public, password-free family page: /family/:token (link shared by the Noor team). */
export default function FamilyPage() {
  const { token = "" } = useParams();
  const load = useCallback(() => familyService.view(token), [token]);
  const save = useCallback((dto: object) => familyService.saveProfile(token, dto), [token]);
  return <FamilyScreen load={load} saveProfile={save} />;
}

/**
 * The family page itself, for the private link and for a parent signed in
 * with their own account (who gets `actions` in the header).
 */
export function FamilyScreen({ load, actions, saveProfile }: {
  load: () => Promise<{ data: any }>;
  actions?: ReactNode;
  saveProfile?: (dto: object) => Promise<unknown>;
}) {
  const [data, setData]   = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Your family page · Noor Circles";
    load()
      .then((r) => setData(unwrap(r)))
      .catch((err) => setError(apiError(err, "We couldn’t open this page right now. Please try again later.")));
  }, [load]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-plum px-4 pb-10 pt-6 text-white sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-3">
            <img src="/brand/noor-circles-logo-horizontal-white.svg" alt="Noor Circles" className="h-9" />
            {actions}
          </div>
          {data && (
            <>
              <h1 className="mt-6 font-serif text-[28px] leading-tight sm:text-[34px]">
                Assalam-o-Alaikum, {data.family.name.split(" ")[0]}
              </h1>
              <p className="mt-1 text-[14px] text-white/80">
                How {data.children.length === 1 ? data.children[0].fullName.split(" ")[0] + " is" : "your children are"} getting on in the circle.
              </p>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto -mt-6 max-w-3xl space-y-5 px-4 pb-10 sm:px-6">
        {error ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-nc">
            <Lock className="mx-auto mb-3 h-8 w-8 text-pale" />
            <p className="text-[14px] text-nc-dark">{error}</p>
          </div>
        ) : !data ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-[13px] text-nc-muted shadow-nc">Loading…</div>
        ) : (
          <>
            {data.children.length > 1 && (
              <nav className="flex flex-wrap gap-2" aria-label="Children">
                {data.children.map((c: any) => (
                  <a key={c._id} href={`#child-${c._id}`} className="rounded-full bg-card px-3.5 py-1.5 text-[13px] font-medium text-plum shadow-nc">
                    {c.fullName.split(" ")[0]}
                  </a>
                ))}
              </nav>
            )}

            {data.children.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-[13.5px] text-nc-muted shadow-nc">
                {actions
                  ? "Your child’s circle will appear here once the Noor Circles team has enrolled them. JazakAllah khair for your patience."
                  : "No active children are linked to this family yet."}
              </div>
            )}

            {data.children.map((c: any) => <ChildCard key={c._id} child={c} />)}

            <section className="rounded-xl border border-border bg-card p-4 shadow-nc sm:p-6">
              <h2 className="mb-1 flex items-center gap-2 font-serif text-[20px] text-nc-dark"><CalendarDays className="h-5 w-5 text-plum" /> Coming up</h2>
              <p className="mb-4 text-[12.5px] text-nc-muted">Circle meetings and events for the next eight weeks.</p>
              <CalendarList items={data.calendar} showCircle={new Set(data.children.map((c: any) => c.circle?.name)).size > 1} compact />
            </section>

            {saveProfile && (
              <AboutFamily profile={data.family.profile} save={async (dto) => {
                try {
                  await saveProfile(dto);
                  setData((d: any) => ({ ...d, family: { ...d.family, profile: { ...dto, updatedAt: new Date().toISOString() } } }));
                } catch (err) {
                  throw new Error(apiError(err, "We couldn’t save your answers. Please try again."));
                }
              }} />
            )}

            <footer className="pt-2 text-center text-[11.5px] text-nc-muted">
              <Lock className="mr-1 inline h-3 w-3" />
              {actions ? "Only you can see this page when signed in." : "This page is private to your family. Please don’t share the link."}
              <div className="mt-1">Noor Circles · A Circle of Light in Every Neighbourhood</div>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

function ChildCard({ child: c }: { child: any }) {
  const first = c.fullName.split(" ")[0];
  const pct = c.progress?.total ? Math.round((c.progress.covered / c.progress.total) * 100) : 0;
  return (
    <section id={`child-${c._id}`} className="scroll-mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-nc">
      <div className="border-b border-border p-4 sm:p-6">
        <h2 className="font-serif text-[24px] text-nc-dark">{c.fullName}</h2>
        {c.circle ? (
          <p className="text-[13px] text-nc-muted">
            {c.circle.name}{c.circle.murabbi ? ` with ${c.circle.murabbi}` : ""} · {scheduleLabel(c.circle)}
          </p>
        ) : (
          <p className="text-[13px] text-nc-muted">Not in a circle yet.</p>
        )}
      </div>

      {/* This week */}
      {c.thisWeek ? (
        <div className="border-b border-border bg-gold-lt/40 p-4 sm:p-6">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gold-dim">
            This week · {c.thisWeek.theme} · {formatDay(c.thisWeek.date)}
          </div>
          <div {...titleProps(c.thisWeek.title)} className={cn("mt-1 text-nc-dark", urduCls(c.thisWeek.title) ? "urdu text-[22px] leading-[2]" : "font-serif text-[20px] leading-snug")}>{c.thisWeek.title}</div>
          {c.thisWeek.objectives?.length > 0 && (
            <ul {...titleProps(c.thisWeek.objectives[0])} className={cn("mt-2 list-disc space-y-0.5 ps-5 text-nc-dark", urduCls(c.thisWeek.objectives[0]) ? "urdu text-right text-[15px] leading-[2.1]" : "text-[13.5px]")}>
              {c.thisWeek.objectives.map((o: string, i: number) => <li key={i}>{o}</li>)}
            </ul>
          )}
          {c.thisWeek.homeActivity && (
            <div className="mt-3 flex gap-3 rounded-lg bg-card p-3.5">
              <Home className="mt-0.5 h-5 w-5 flex-shrink-0 text-plum" />
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-wide text-plum">Try at home together</div>
                <p {...titleProps(c.thisWeek.homeActivity)} className={cn("mt-0.5 text-nc-dark", urduCls(c.thisWeek.homeActivity) ? "urdu text-right text-[16px] leading-[2.2]" : "text-[14px]")}>{c.thisWeek.homeActivity}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border-b border-border bg-gold-lt/40 p-4 text-[13.5px] text-nc-dark sm:p-6">
          <Sparkles className="mr-1.5 inline h-4 w-4 text-gold-dim" />
          The circle’s journey is just beginning. This week’s topic will appear here after the first session.
        </div>
      )}

      {c.next && (
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
          <CalendarDays className="h-5 w-5 flex-shrink-0 text-plum" />
          <div className="text-[13.5px] text-nc-dark">
            <span className="font-semibold">Next{c.next.date ? `, ${formatDay(c.next.date)}` : ""}:</span> <span {...titleProps(c.next.title)} className={cn(urduCls(c.next.title) && "urdu")}>{c.next.title}</span>
            <span className="text-nc-muted"> ({c.next.theme})</span>
          </div>
        </div>
      )}

      <div className="grid gap-px bg-border sm:grid-cols-3">
        <div className="bg-card p-4">
          <div className="text-[11.5px] font-medium uppercase tracking-wide text-nc-muted">Attendance</div>
          <div className="mt-1 font-serif text-[26px] text-nc-dark">{c.attendance.rate == null ? "—" : `${c.attendance.rate}%`}</div>
          <div className="text-[12px] text-nc-muted">{c.attendance.present} of {c.attendance.total} sessions</div>
          {c.attendance.recent.length > 0 && (
            <div className="mt-2 flex gap-1" aria-label="Recent sessions">
              {[...c.attendance.recent].reverse().map((r: any, i: number) => (
                <span key={i} title={`${formatDay(r.date)}: ${r.status}`}
                  className={cn("h-2.5 w-2.5 rounded-full", r.status === "present" ? "bg-nc-green" : r.status === "excused" ? "bg-gold" : "bg-nc-red/60")} />
              ))}
            </div>
          )}
        </div>
        <div className="bg-card p-4">
          <div className="text-[11.5px] font-medium uppercase tracking-wide text-nc-muted">Noor points</div>
          <div className="mt-1 flex items-center gap-1.5 font-serif text-[26px] text-nc-dark"><Star className="h-5 w-5 fill-gold text-gold" />{c.points.total}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {c.points.recent.slice(0, 3).map((a: any, i: number) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-gold-lt px-2 py-0.5 text-[11px] text-gold-dim"><Award className="h-3 w-3" />{a.award}</span>
            ))}
            {c.points.recent.length === 0 && <span className="text-[12px] text-nc-muted">Points appear here as {first} earns them.</span>}
          </div>
        </div>
        <div className="bg-card p-4">
          <div className="text-[11.5px] font-medium uppercase tracking-wide text-nc-muted">Syllabus</div>
          <div className="mt-1 font-serif text-[26px] text-nc-dark">{c.progress ? `${c.progress.covered}/${c.progress.total}` : "—"}</div>
          <div className="text-[12px] text-nc-muted">sessions covered</div>
          {c.progress && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-plum" style={{ width: `${pct}%` }} /></div>}
        </div>
      </div>

      {c.notes.length > 0 && (
        <div className="border-t border-border p-4 sm:p-6">
          <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-nc-dark">
            <MessageCircleHeart className="h-4 w-4 text-plum" /> From {c.circle?.murabbi || "the Murabbi"}
          </div>
          <div className="space-y-2">
            {c.notes.map((n: any, i: number) => (
              <figure key={i} className="rounded-lg bg-plum-lt/50 px-3.5 py-2.5">
                <blockquote className="text-[14px] text-nc-dark">“{n.note}”</blockquote>
                <figcaption className="mt-0.5 text-[11.5px] text-nc-muted">{formatDay(n.date, true)}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      {c.thisWeek == null && c.notes.length === 0 && c.attendance.total === 0 && (
        <div className="border-t border-border p-4 text-center text-[12.5px] text-nc-muted"><Heart className="mr-1 inline h-3.5 w-3.5" /> More will appear here week by week.</div>
      )}
    </section>
  );
}

/** Optional "about your family" answers; only the Noor Circles team sees them. */
function AboutFamily({ profile, save }: { profile: FamilyProfile | null; save: (dto: object) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const rows = summarise(profile);
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-nc sm:p-6">
      <div className="mb-1 flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 font-serif text-[20px] text-nc-dark"><Users className="h-5 w-5 text-plum" /> About your family</h2>
        {profile && !editing && (
          <button className="inline-flex items-center gap-1 text-[12.5px] font-medium text-plum hover:underline" onClick={() => { setEditing(true); setSaved(false); }}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>
      <p className="mb-4 text-[12.5px] text-nc-muted">
        Optional. It helps us plan the right day, time and support for your child. Only the Noor Circles team sees it.
      </p>
      {editing ? (
        <FamilyProfileForm initial={profile} onCancel={() => setEditing(false)}
          onSave={async (dto) => { await save(dto); setEditing(false); setSaved(true); }} />
      ) : profile ? (
        <>
          {saved && <p role="status" className="mb-3 rounded-md bg-nc-green-lt px-3 py-2 text-[12.5px] text-nc-dark">JazakAllah khair, your answers are saved.</p>}
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-[11px] uppercase tracking-wide text-nc-muted">{k}</dt>
                <dd className="break-words text-nc-dark">{v}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <button className="btn-primary" onClick={() => setEditing(true)}>Tell us a bit more (2 minutes)</button>
      )}
    </section>
  );
}
