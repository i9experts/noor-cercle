import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, CheckCircle2, ChevronDown, FileText, Home, ListChecks, Send, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { syllabusService } from "@/services/api.service";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import CircleSyllabusModal from "@/components/shared/CircleSyllabusModal";
import CalendarList from "@/components/shared/CalendarList";
import { titleProps, urduCls } from "@/lib/course";
import { cn } from "@/lib/utils";
import { apiError, apiMessage, unwrap } from "@/lib/finance";
import { PARTS, STATUS_META, addDays, formatDay, lastMeetingDate, pkToday, scheduleLabel } from "@/lib/schedule";

export default function MurabbiAgenda() {
  const { toast } = useToast();
  const [agenda, setAgenda]     = useState<any[]>([]);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);

  async function load() {
    try {
      const [a, c] = await Promise.all([
        syllabusService.myAgenda(),
        syllabusService.calendar({ from: pkToday(), to: addDays(pkToday(), 27) }),
      ]);
      setAgenda(unwrap(a) || []);
      setCalendar(unwrap(c).items || []);
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not load your agenda.") });
    } finally {
      setLoading(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  return (
    <div className="page-animate">
      <div className="mb-6">
        <h2 className="font-serif text-[26px] text-nc-dark">Weekly Agenda</h2>
        <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
          This week’s session for each of your circles. Tick each part as you cover it, then mark the session complete.
          Families see the topic and home activity on their family page, along with any note you write about their child.
        </p>
      </div>

      {loading ? (
        <NcCard><div className="py-16 text-center text-sm text-nc-muted">Loading…</div></NcCard>
      ) : agenda.length === 0 ? (
        <NcCard className="py-14 text-center">
          <ListChecks className="mx-auto mb-3 h-9 w-9 text-pale" strokeWidth={1.5} />
          <div className="text-sm font-medium text-nc-dark">No active circles yet</div>
          <div className="mt-1 text-[12.5px] text-nc-muted">Your agenda appears once an admin assigns you a circle.</div>
        </NcCard>
      ) : (
        <div className="space-y-6">
          {agenda.map((item) => (
            <AgendaCard key={item.circle._id} item={item} onSaved={load} onShowAll={() => setDetailId(item.circle._id)} />
          ))}
        </div>
      )}

      <NcCard className="mt-6 p-4 sm:p-6">
        <CardHeader><CardTitle sub="Next four weeks, including holidays and parent evenings"><span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-plum" /> Upcoming</span></CardTitle></CardHeader>
        <CalendarList items={calendar} showCircle={agenda.length > 1} compact />
      </NcCard>

      <CircleSyllabusModal circleId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}

function AgendaCard({ item, onSaved, onShowAll }: { item: any; onSaved: () => void; onShowAll: () => void }) {
  const { toast } = useToast();
  const { circle, track, progress: p, session, coverage, students, notes, recent } = item;
  const [done, setDone]     = useState<string[]>([]);
  const [date, setDate]     = useState(() => lastMeetingDate(circle.meetingDay));
  const [remarks, setRemarks] = useState("");
  const [open, setOpen]     = useState<string | null>("tarbiyah");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDone(coverage?.parts?.filter((x: any) => x.done).map((x: any) => x.key) ?? []);
    setRemarks(coverage?.notes ?? "");
  }, [coverage, session?._id]);

  const pct = p.total ? Math.round((p.covered / p.total) * 100) : 0;
  const toggle = (k: string) => setDone((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k]));

  async function save(completed: boolean) {
    setSaving(true);
    try {
      const r = await syllabusService.recordCoverage({
        circleId: circle._id, sessionId: session._id, date, notes: remarks.trim(),
        // "Complete" with nothing ticked means every part was covered.
        partsDone: completed && done.length === 0 ? PARTS.map((x) => x.key) : done,
        completed,
      });
      toast({ title: apiMessage(r) });
      onSaved();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <NcCard className="overflow-hidden p-0">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-4 border-b border-border p-4 sm:p-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-serif text-[20px] text-nc-dark">{circle.name}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_META[p.status]?.cls)}>
              {STATUS_META[p.status]?.label}{p.status === "behind" ? ` by ${p.behindBy}` : ""}
            </span>
          </div>
          <div className="mt-0.5 text-[12.5px] text-nc-muted">
            {track?.name ?? "No syllabus track"} · {scheduleLabel(circle)}{p.nextMeeting ? ` · next: ${formatDay(p.nextMeeting)}` : ""}
          </div>
        </div>
        <div className="w-full sm:w-56">
          <div className="mb-1 flex justify-between text-[11.5px] text-nc-muted"><span>{p.covered} of {p.total} sessions</span><span>{pct}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-plum" style={{ width: `${pct}%` }} /></div>
          <button className="mt-1.5 text-[12px] font-medium text-plum hover:underline" onClick={onShowAll}>See the full syllabus</button>
        </div>
      </div>

      {!track ? (
        <div className="p-6 text-[13px] text-nc-muted">This circle doesn’t have a syllabus track yet. Ask an admin to assign one (Circles → Edit).</div>
      ) : !session ? (
        <div className="flex items-center gap-3 p-6 text-[13.5px] text-nc-dark">
          <Sparkles className="h-6 w-6 text-gold" /> Masha’Allah, this circle has covered the whole syllabus!
        </div>
      ) : (
        <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
          {/* Session + checklist */}
          <div className="p-4 sm:p-6">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gold-dim">Session {session.number} · {session.theme}</div>
            <div {...titleProps(session.title)} className={cn("mb-2 text-nc-dark", urduCls(session.title, "leading-[2]") ? "urdu text-[22px] leading-[2]" : "font-serif text-[21px] leading-snug")}>{session.title}</div>
            {session.objectives?.length > 0 && (
              <ul {...titleProps(session.objectives[0])} className={cn("mb-3 list-disc space-y-0.5 ps-5 text-nc-dark", urduCls(session.objectives[0], "leading-[2.1] text-[15px]") || "text-[13px]")}>
                {session.objectives.map((o: string, i: number) => <li key={i}>{o}</li>)}
              </ul>
            )}
            {session.lesson && (
              <div className="mb-3 flex flex-wrap gap-2 text-[12.5px]">
                <span className="inline-flex items-center gap-1 text-nc-muted"><BookOpen className="h-3.5 w-3.5" /> {session.lesson.title}</span>
                {session.lesson.pdfUrl && <a className="inline-flex items-center gap-1 text-plum hover:underline" href={session.lesson.pdfUrl} target="_blank" rel="noreferrer"><FileText className="h-3.5 w-3.5" /> PDF</a>}
                {session.lesson.videoUrl && <a className="text-plum hover:underline" href={session.lesson.videoUrl} target="_blank" rel="noreferrer">Video</a>}
              </div>
            )}

            <div className="space-y-1.5">
              {PARTS.map((part, i) => {
                const detail = session.parts?.find((x: any) => x.key === part.key);
                const checked = done.includes(part.key);
                const expanded = open === part.key;
                return (
                  <div key={part.key} className={cn("rounded-lg border", checked ? "border-nc-green/40 bg-nc-green-lt/40" : "border-border")}>
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <input type="checkbox" checked={checked} onChange={() => toggle(part.key)} className="h-4 w-4 accent-[hsl(327,58%,26%)]"
                        aria-label={`${part.label} covered`} />
                      <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setOpen(expanded ? null : part.key)} aria-expanded={expanded}>
                        <span className="text-[11px] font-semibold text-nc-muted">{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium text-nc-dark">{part.label}</span>
                          {detail?.title && <span {...titleProps(detail.title)} className={cn("block truncate text-nc-muted", urduCls(detail.title, "leading-[2] text-[13px]") || "text-[11.5px]")}>{detail.title}</span>}
                        </span>
                        {detail?.minutes ? <span className="text-[11.5px] text-nc-muted">{detail.minutes} min</span> : null}
                        <ChevronDown className={cn("h-4 w-4 text-nc-muted transition-transform", expanded && "rotate-180")} />
                      </button>
                    </div>
                    {expanded && (
                      <div dir="auto" className={cn("whitespace-pre-line border-t border-border/60 px-3 py-2.5 text-nc-dark", detail?.details && urduCls(detail.details) ? "urdu pe-3 ps-3 text-right text-[15px] leading-[2.2] sm:pe-10" : "pl-10 text-[12.5px]")}>
                        {detail?.details || <span className="text-nc-muted">No details written for this part yet.</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {session.homeActivity && (
              <div className="mt-3 flex gap-2 rounded-lg bg-gold-lt/60 p-3 text-[12.5px] text-nc-dark">
                <Home className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-dim" />
                <span>
                  <span className="font-semibold">Home activity (families see this): </span>
                  <span {...titleProps(session.homeActivity)} className={cn(urduCls(session.homeActivity) && "urdu mt-1 block text-right text-[14.5px] leading-[2.1]")}>{session.homeActivity}</span>
                </span>
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr]">
              <label className="text-[12px] text-nc-muted">Held on
                <input type="date" value={date} max={pkToday()} onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block h-9 w-full rounded-md border border-input bg-card px-2.5 text-[13px] text-foreground focus:border-primary focus:outline-none" />
              </label>
              <label className="text-[12px] text-nc-muted">Notes for the team (optional)
                <textarea value={remarks} maxLength={2000} rows={1} onChange={(e) => setRemarks(e.target.value)} placeholder="How did it go? Anything to follow up?"
                  className="mt-1 block min-h-[36px] w-full resize-y rounded-md border border-input bg-card px-2.5 py-2 text-[13px] text-foreground focus:border-primary focus:outline-none" />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-outline disabled:opacity-50" onClick={() => save(false)} disabled={saving || done.length === 0}>
                Save progress ({done.length}/6)
              </button>
              <button className="btn-primary inline-flex items-center gap-1.5 disabled:opacity-50" onClick={() => save(true)} disabled={saving}>
                <CheckCircle2 className="h-4 w-4" /> Mark session {session.number} complete
              </button>
            </div>
            {coverage && !coverage.completed && <p className="mt-2 text-[11.5px] text-gold-dim">In progress: saved {formatDay(coverage.date)}.</p>}
          </div>

          {/* Families */}
          <div className="border-t border-border bg-muted/30 p-4 sm:p-6 lg:border-l lg:border-t-0">
            <div className="mb-1 text-[13px] font-semibold text-nc-dark">Notes to families</div>
            <p className="mb-3 text-[11.5px] text-nc-muted">A short, encouraging line about a child shows on their family’s page.</p>
            {students.length === 0 ? (
              <div className="text-[12.5px] text-nc-muted">No active students in this circle.</div>
            ) : (
              <div className="space-y-2">
                {students.map((s: any) => (
                  <StudentNoteRow key={s._id} student={s} sessionId={session._id}
                    sent={notes.filter((n: any) => n.student === s._id)} onSent={onSaved} />
                ))}
              </div>
            )}
            {recent.length > 0 && (
              <div className="mt-5">
                <div className="mb-1.5 text-[12px] font-semibold text-nc-dark">Recently covered</div>
                {recent.map((r: any) => (
                  <div key={r._id} className="flex items-center gap-2 py-0.5 text-[12px] text-nc-muted">
                    <CheckCircle2 className="h-3.5 w-3.5 text-nc-green" />
                    <span className="truncate">{r.session?.number}. <span {...titleProps(r.session?.title ?? "")} className={cn(urduCls(r.session?.title) && "urdu")}>{r.session?.title}</span></span>
                    <span className="ml-auto whitespace-nowrap">{formatDay(r.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </NcCard>
  );
}

function StudentNoteRow({ student, sessionId, sent, onSent }: { student: any; sessionId: string; sent: any[]; onSent: () => void }) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await syllabusService.addNote({ studentId: student._id, note: text.trim(), sessionId });
      toast({ title: `Shared with ${student.fullName.split(" ")[0]}’s family.` });
      setText("");
      onSent();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not send the note.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border border-border bg-card p-2">
      <div className="mb-1 text-[12.5px] font-medium text-nc-dark">{student.fullName}</div>
      {sent.map((n) => <div key={n._id} className="mb-1 rounded bg-nc-green-lt/60 px-2 py-1 text-[11.5px] text-nc-dark">✓ {n.note}</div>)}
      <div className="flex gap-1.5">
        <input value={text} maxLength={500} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="e.g. Recited beautifully today!" aria-label={`Note to ${student.fullName}'s family`}
          className="h-8 min-w-0 flex-1 rounded-md border border-input bg-card px-2 text-[12.5px] focus:border-primary focus:outline-none" />
        <button className="rounded-md bg-plum px-2.5 text-white disabled:opacity-40" onClick={send} disabled={busy || !text.trim()} aria-label="Send note">
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
