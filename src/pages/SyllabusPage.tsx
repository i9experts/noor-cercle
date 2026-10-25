import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, CheckCircle2, Home, Plus, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { syllabusService } from "@/services/api.service";
import NcCard from "@/components/shared/NcCard";
import Modal, { FormGroup, FormInput, FormRow, FormSelect, FormTextarea } from "@/components/shared/Modal";
import DeleteConfirmModal from "@/components/shared/DeleteConfirmModal";
import { cn } from "@/lib/utils";
import { apiError, apiMessage, unwrap } from "@/lib/finance";
import { PARTS, THEMES } from "@/lib/schedule";

interface Part { key: string; title: string; details: string; minutes: number }
interface Session {
  _id: string; number: number; month: number; title: string; objectives: string[];
  parts: Part[]; homeActivity: string;
}
interface Track { _id: string; name: string; ageGroup: string; description: string; sessionCount: number; circleCount: number }

/** How much of a session has been written (for the at-a-glance dots). */
function completeness(s: Session) {
  const parts = s.parts.filter((p) => p.title || p.details).length;
  return { parts, home: !!s.homeActivity.trim() };
}

export default function SyllabusPage() {
  const { toast } = useToast();
  const [tracks, setTracks]       = useState<Track[]>([]);
  const [trackId, setTrackId]     = useState("");
  const [sessions, setSessions]   = useState<Session[]>([]);
  const [loading, setLoading]     = useState(true);
  const [busy, setBusy]           = useState(false);
  const [editing, setEditing]     = useState<Session | "new" | null>(null);

  async function loadTracks() {
    try {
      const t: Track[] = unwrap(await syllabusService.tracks()) || [];
      setTracks(t);
      setTrackId((cur) => cur || t[0]?._id || "");
      if (!t.length) setLoading(false);
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not load the syllabus.") });
      setLoading(false);
    }
  }
  async function loadSessions(id = trackId) {
    if (!id) return;
    setLoading(true);
    try {
      setSessions(unwrap(await syllabusService.sessions(id)).sessions || []);
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not load sessions.") });
    } finally {
      setLoading(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadTracks(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadSessions(trackId); }, [trackId]);

  async function setup() {
    setBusy(true);
    try {
      const r = await syllabusService.setupDefaults();
      toast({ title: apiMessage(r) });
      await loadTracks();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not set up the syllabus.") });
    } finally {
      setBusy(false);
    }
  }

  const byMonth = useMemo(() => {
    const groups = new Map<number, Session[]>();
    for (const s of sessions) groups.set(s.month, [...(groups.get(s.month) ?? []), s]);
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [sessions]);

  const track = tracks.find((t) => t._id === trackId);
  const written = sessions.filter((s) => { const c = completeness(s); return c.parts === 6 && c.home; }).length;

  return (
    <div className="page-animate">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-[26px] text-nc-dark">Syllabus</h2>
          <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
            One syllabus per age group. Each weekly session follows the six parts of a circle and has a home activity
            that families see on their page. Murabbis get the next session as their weekly agenda.
          </p>
        </div>
      </div>

      {!loading && tracks.length === 0 ? (
        <NcCard className="mx-auto max-w-xl p-8 text-center">
          <Sparkles className="mx-auto mb-3 h-9 w-9 text-gold" strokeWidth={1.5} />
          <div className="font-serif text-[22px] text-nc-dark">Set up the syllabus</div>
          <p className="mx-auto mb-6 mt-2 max-w-md text-[13px] text-nc-muted">
            Creates three tracks (ages 6–8, 9–10 and 11–13), each with a 40-session outline across the 12 monthly
            themes. You can then write the details of each session.
          </p>
          <button className="btn-primary disabled:opacity-50" onClick={setup} disabled={busy}>
            {busy ? "Setting up…" : "Create the three tracks"}
          </button>
        </NcCard>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Age group">
            {tracks.map((t) => (
              <button
                key={t._id}
                role="tab"
                aria-selected={t._id === trackId}
                onClick={() => setTrackId(t._id)}
                className={cn("rounded-lg border px-4 py-2.5 text-left transition-colors",
                  t._id === trackId ? "border-plum bg-plum text-white" : "border-border bg-card hover:border-plum")}
              >
                <div className="text-[13.5px] font-semibold">{t.name}</div>
                <div className={cn("text-[11.5px]", t._id === trackId ? "text-white/80" : "text-nc-muted")}>
                  {t.sessionCount} sessions · {t.circleCount} circle{t.circleCount === 1 ? "" : "s"}
                </div>
              </button>
            ))}
          </div>

          <NcCard className="p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[13px] text-nc-muted">
                <span className="font-semibold text-nc-dark">{written}</span> of {sessions.length} sessions fully written
                <span className="ml-2 inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-plum" /> part written</span>
                <span className="ml-2 inline-flex items-center gap-1"><Home className="h-3 w-3 text-gold-dim" /> home activity</span>
              </div>
              <button className="btn-outline inline-flex items-center gap-1.5 !py-2 text-[12.5px]" onClick={() => setEditing("new")} disabled={!track}>
                <Plus className="h-4 w-4" /> Add session
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm text-nc-muted">Loading…</div>
            ) : (
              <div className="space-y-6">
                {byMonth.map(([month, list]) => (
                  <section key={month}>
                    <div className="mb-2 flex items-baseline gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gold-dim">Month {month}</span>
                      <span className="font-serif text-[18px] text-nc-dark">{THEMES[month - 1]}</span>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {list.map((s) => {
                        const c = completeness(s);
                        return (
                          <button
                            key={s._id}
                            onClick={() => setEditing(s)}
                            className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3 text-left transition-colors hover:border-plum"
                          >
                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-plum-lt text-[12px] font-bold text-plum">{s.number}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13.5px] font-medium text-nc-dark">{s.title}</span>
                              <span className="mt-1 flex items-center gap-1">
                                {s.parts.map((p) => (
                                  <span key={p.key} title={PARTS.find((x) => x.key === p.key)?.label}
                                    className={cn("h-1.5 w-4 rounded-full", p.title || p.details ? "bg-plum" : "bg-muted")} />
                                ))}
                                <Home className={cn("ml-1 h-3 w-3", c.home ? "text-gold-dim" : "text-pale")} />
                              </span>
                            </span>
                            {c.parts === 6 && c.home && <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-nc-green" />}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
                {sessions.length === 0 && (
                  <div className="py-12 text-center text-[13px] text-nc-muted">
                    <BookOpenCheck className="mx-auto mb-2 h-8 w-8 text-pale" strokeWidth={1.5} />
                    No sessions in this track yet.
                  </div>
                )}
              </div>
            )}
          </NcCard>
        </>
      )}

      {editing && track && (
        <SessionEditor
          session={editing === "new" ? null : editing}
          trackId={track._id}
          nextNumber={(sessions[sessions.length - 1]?.number ?? 0) + 1}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); loadSessions(); loadTracks(); }}
        />
      )}
    </div>
  );
}

function SessionEditor({ session, trackId, nextNumber, onClose, onSaved }: {
  session: Session | null; trackId: string; nextNumber: number; onClose: () => void; onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving]   = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [f, setF] = useState(() => ({
    number      : String(session?.number ?? nextNumber),
    month       : String(session?.month ?? 1),
    title       : session?.title ?? "",
    objectives  : (session?.objectives ?? []).join("\n"),
    homeActivity: session?.homeActivity ?? "",
    parts       : PARTS.map((p) => {
      const ex = session?.parts.find((x) => x.key === p.key);
      return { key: p.key, title: ex?.title ?? "", details: ex?.details ?? "", minutes: String(ex?.minutes ?? "") };
    }),
  }));

  const setPart = (key: string, field: "title" | "details" | "minutes", v: string) =>
    setF((x) => ({ ...x, parts: x.parts.map((p) => (p.key === key ? { ...p, [field]: v } : p)) }));

  async function save() {
    if (!f.title.trim()) { toast({ variant: "destructive", title: "Give the session a title." }); return; }
    setSaving(true);
    const body = {
      number      : Number(f.number),
      month       : Number(f.month),
      title       : f.title.trim(),
      objectives  : f.objectives.split("\n").map((o) => o.trim()).filter(Boolean),
      homeActivity: f.homeActivity.trim(),
      parts       : f.parts.map((p) => ({ key: p.key, title: p.title.trim(), details: p.details, ...(p.minutes !== "" && { minutes: Number(p.minutes) }) })),
    };
    try {
      const r = session ? await syllabusService.updateSession(session._id, body) : await syllabusService.createSession(trackId, body);
      toast({ title: apiMessage(r) });
      onSaved();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save the session.") });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!session) return;
    try {
      await syllabusService.deleteSession(session._id);
      toast({ title: "Session deleted." });
      onSaved();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not delete the session.") });
    } finally {
      setConfirm(false);
    }
  }

  return (
    <>
      <Modal open={!confirm} onClose={onClose} title={session ? `Session ${session.number}` : "New session"}
        subtitle="Write what happens in each part of the circle. Families see the home activity.">
        <FormRow>
          <FormGroup label="Session number" required>
            <FormInput type="number" min={1} value={f.number} onChange={(e) => setF((x) => ({ ...x, number: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Month / theme" required>
            <FormSelect value={f.month} onChange={(e) => setF((x) => ({ ...x, month: e.target.value }))}>
              {THEMES.map((t, i) => <option key={t} value={i + 1}>{i + 1}. {t}</option>)}
            </FormSelect>
          </FormGroup>
        </FormRow>
        <FormGroup label="Title" required>
          <FormInput value={f.title} maxLength={150} onChange={(e) => setF((x) => ({ ...x, title: e.target.value }))} placeholder="e.g. Who am I? My name and my faith" />
        </FormGroup>
        <FormGroup label="Learning objectives (one per line)">
          <FormTextarea rows={3} value={f.objectives} onChange={(e) => setF((x) => ({ ...x, objectives: e.target.value }))} placeholder={"Know the meaning of their own name\nName three blessings of being Muslim"} />
        </FormGroup>

        <div className="mb-[18px] space-y-3">
          {PARTS.map((p, i) => {
            const part = f.parts.find((x) => x.key === p.key)!;
            return (
              <div key={p.key} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-plum-lt text-[11px] font-bold text-plum">{i + 1}</span>
                  <span className="flex-1 text-[13px] font-semibold text-nc-dark">{p.label}</span>
                  <input type="number" min={0} max={240} value={part.minutes} onChange={(e) => setPart(p.key, "minutes", e.target.value)}
                    className="h-8 w-16 rounded-md border border-input bg-card px-2 text-right text-[12.5px] focus:border-primary focus:outline-none" aria-label={`${p.label} minutes`} />
                  <span className="text-[11.5px] text-nc-muted">min</span>
                </div>
                <FormInput value={part.title} maxLength={150} onChange={(e) => setPart(p.key, "title", e.target.value)} placeholder="Short title (optional)" className="mb-2" />
                <FormTextarea rows={2} value={part.details} onChange={(e) => setPart(p.key, "details", e.target.value)} placeholder="What the Murabbi does in this part" />
              </div>
            );
          })}
        </div>

        <FormGroup label="Home activity for families">
          <FormTextarea rows={2} value={f.homeActivity} maxLength={1000} onChange={(e) => setF((x) => ({ ...x, homeActivity: e.target.value }))}
            placeholder="Something parents and children can do together this week" />
        </FormGroup>

        <div className="flex items-center justify-between gap-2">
          {session ? <button className="text-[12.5px] text-nc-muted hover:text-nc-red" onClick={() => setConfirm(true)}>Delete session</button> : <span />}
          <div className="flex gap-2">
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn-primary disabled:opacity-50" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save session"}</button>
          </div>
        </div>
      </Modal>
      <DeleteConfirmModal
        open={confirm}
        title="Delete this session?"
        message="Sessions that circles have already covered can’t be deleted."
        onConfirm={remove}
        onClose={() => setConfirm(false)}
      />
    </>
  );
}
