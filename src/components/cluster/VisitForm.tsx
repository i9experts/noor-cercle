import { useEffect, useMemo, useState } from "react";
import { ShieldAlert, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Modal from "@/components/shared/Modal";
import { cn } from "@/lib/utils";
import { apiError, apiMessage } from "@/lib/finance";
import { pkToday } from "@/lib/schedule";
import { ChecklistItem, RATING_META, RATINGS, SCORES } from "@/lib/cluster";
import { supervisorService } from "@/services/api.service";

type Score = number | null;

/** The supervisor's visit report: the checklist, an overall rating, notes and follow-ups. */
export default function VisitForm({ open, circles, circleId, checklist, onClose, onSaved }: {
  open: boolean;
  circles: { _id: string; name: string }[];
  circleId?: string | null;
  checklist: ChecklistItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [circle, setCircle] = useState("");
  const [date, setDate] = useState(pkToday());
  const [present, setPresent] = useState("");
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [overall, setOverall] = useState("");
  const [highlights, setHighlights] = useState("");
  const [concerns, setConcerns] = useState("");
  const [safeguarding, setSafeguarding] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([""]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCircle(circleId ?? ""); setDate(pkToday()); setPresent(""); setScores({}); setNotes({}); setOverall("");
    setHighlights(""); setConcerns(""); setSafeguarding(false); setFollowUps([""]);
  }, [open, circleId]);

  const groups = useMemo(() => {
    const m = new Map<string, ChecklistItem[]>();
    for (const i of checklist) m.set(i.group, [...(m.get(i.group) ?? []), i]);
    return [...m.entries()];
  }, [checklist]);
  const ready = circle && date && overall && (!safeguarding || concerns.trim());

  async function save() {
    setBusy(true);
    try {
      const r = await supervisorService.createVisit({
        circleId: circle, date, overall, highlights, concerns, safeguarding,
        ...(present !== "" && { childrenPresent: Number(present) }),
        checklist: checklist.map((i) => ({ key: i.key, score: scores[i.key] ?? null, note: notes[i.key] ?? "" })).filter((x) => x.score !== null || x.note),
        followUps: followUps.map((f) => f.trim()).filter(Boolean),
      });
      toast({ title: apiMessage(r, "Visit saved.") });
      onSaved();
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save the visit.") });
    } finally {
      setBusy(false);
    }
  }

  const input = "h-10 w-full rounded-md border border-input bg-card px-3 text-[13.5px] focus:border-primary focus:outline-none";

  return (
    <Modal open={open} onClose={onClose} title="Log a visit" subtitle="Score what you saw; leave an item on “Not seen” if it didn’t happen while you were there.">
      <div className="grid gap-3 sm:grid-cols-[1fr_150px_110px]">
        <label className="block">
          <span className="mb-1 block text-[12.5px] font-medium text-slate">Circle</span>
          <select value={circle} onChange={(e) => setCircle(e.target.value)} className={input} aria-label="Circle">
            <option value="">Choose…</option>
            {circles.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[12.5px] font-medium text-slate">Date</span>
          <input type="date" value={date} max={pkToday()} onChange={(e) => setDate(e.target.value)} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12.5px] font-medium text-slate">Children</span>
          <input type="number" min={0} max={100} value={present} onChange={(e) => setPresent(e.target.value)} placeholder="Present" className={input} />
        </label>
      </div>

      {groups.map(([group, items]) => (
        <div key={group} className="mt-5">
          <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-gold-dim">{group}</div>
          <div className="space-y-2.5">
            {items.map((i) => (
              <div key={i.key} className="rounded-md border border-border/80 p-3">
                <div className="text-[13.5px] font-medium text-nc-dark">{i.title}</div>
                <div className="mb-2 text-[12px] leading-snug text-nc-muted">{i.look}</div>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={i.title}>
                  {SCORES.map((s) => {
                    const on = (scores[i.key] ?? null) === s.value;
                    return (
                      <button key={String(s.value)} type="button" role="radio" aria-checked={on}
                        className={cn("rounded-full border px-2.5 py-1 text-[12px] transition-colors", on ? s.cls + " font-semibold" : "border-border text-nc-muted hover:border-teal")}
                        onClick={() => setScores((v) => ({ ...v, [i.key]: s.value }))}>
                        {s.label}
                      </button>
                    );
                  })}
                </div>
                {(scores[i.key] ?? null) !== null && (
                  <input value={notes[i.key] ?? ""} onChange={(e) => setNotes((v) => ({ ...v, [i.key]: e.target.value }))} maxLength={300}
                    placeholder="A note (optional)" aria-label={`Note on ${i.title}`}
                    className="mt-2 h-8 w-full rounded-md border border-input bg-card px-2.5 text-[12.5px] focus:border-primary focus:outline-none" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-5">
        <div className="mb-2 text-[12.5px] font-medium text-slate">Overall</div>
        <div className="flex flex-wrap gap-1.5">
          {RATINGS.map((r) => (
            <button key={r} type="button" onClick={() => setOverall(r)}
              className={cn("rounded-full border px-3 py-1.5 text-[12.5px]", overall === r ? RATING_META[r].cls + " border-transparent font-semibold" : "border-border text-nc-dark hover:border-teal")}>
              {RATING_META[r].label}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-[12.5px] font-medium text-slate">What went well</span>
        <textarea dir="auto" value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={3} maxLength={2000}
          className="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-[13.5px] focus:border-primary focus:outline-none" />
      </label>
      <label className="mt-3 block">
        <span className="mb-1 block text-[12.5px] font-medium text-slate">Concerns</span>
        <textarea dir="auto" value={concerns} onChange={(e) => setConcerns(e.target.value)} rows={3} maxLength={2000}
          className="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-[13.5px] focus:border-primary focus:outline-none" />
      </label>

      <label className={cn("mt-3 flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 text-[13px]", safeguarding ? "border-nc-red/50 bg-nc-red-lt/60" : "border-border")}>
        <input type="checkbox" checked={safeguarding} onChange={(e) => setSafeguarding(e.target.checked)} className="mt-0.5 accent-[hsl(var(--nc-red))]" />
        <span>
          <span className="flex items-center gap-1.5 font-semibold text-nc-dark"><ShieldAlert className="h-4 w-4 text-nc-red" /> Safeguarding concern</span>
          <span className="block text-[12px] text-nc-muted">The admin team is alerted straight away by notification and email. Describe what you saw under Concerns.</span>
        </span>
      </label>

      <div className="mt-4">
        <div className="mb-1.5 text-[12.5px] font-medium text-slate">Follow-ups</div>
        {followUps.map((f, i) => (
          <div key={i} className="mb-1.5 flex gap-1.5">
            <input dir="auto" value={f} maxLength={300} placeholder="e.g. Share the Qur’an flip chart with the murabbi"
              onChange={(e) => setFollowUps((v) => v.map((x, k) => (k === i ? e.target.value : x)))}
              className="h-9 min-w-0 flex-1 rounded-md border border-input bg-card px-3 text-[13px] focus:border-primary focus:outline-none" />
            {followUps.length > 1 && (
              <button className="rounded-md px-2 text-nc-muted hover:text-nc-red" onClick={() => setFollowUps((v) => v.filter((_, k) => k !== i))} aria-label="Remove follow-up"><X className="h-4 w-4" /></button>
            )}
          </div>
        ))}
        {followUps.length < 10 && (
          <button className="flex items-center gap-1 text-[12.5px] text-teal hover:underline" onClick={() => setFollowUps((v) => [...v, ""])}>
            <Plus className="h-3.5 w-3.5" /> Add another
          </button>
        )}
      </div>

      <div className="mt-6 flex gap-2">
        <button className="btn-primary flex-1 justify-center" disabled={!ready || busy} onClick={save}>{busy ? "Saving…" : "Save visit"}</button>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
      </div>
      {safeguarding && !concerns.trim() && <p className="mt-2 text-[12px] text-nc-red">Write what you saw under Concerns before saving.</p>}
    </Modal>
  );
}
