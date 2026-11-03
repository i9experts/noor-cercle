import { FormEvent, useState } from "react";
import Modal from "@/components/shared/Modal";
import { useToast } from "@/hooks/use-toast";
import { apiError, apiMessage } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { HostOptions, RECOMMENDATIONS, Recommendation, hostService } from "@/lib/host";

/** The visit checklist for a host's space (admins and the cluster's supervisors). */
export default function SpaceVisitForm({ space, options, onClose, onSaved }: {
  space: { _id: string; name: string } | null;
  options: HostOptions | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const checklist = options?.checklist ?? [];
  const [items, setItems] = useState<Record<string, { ok: boolean | null; note: string }>>({});
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState<Recommendation | "">("");
  const [saving, setSaving] = useState(false);

  if (!space) return null;
  const answered = checklist.every((c) => items[c.key]?.ok != null);
  const ok = answered && !!recommendation;
  const setItem = (key: string, patch: Partial<{ ok: boolean | null; note: string }>) =>
    setItems((p) => ({ ...p, [key]: { ok: p[key]?.ok ?? null, note: p[key]?.note ?? "", ...patch } }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ok || !space) return;
    setSaving(true);
    try {
      const r = await hostService.addVisit(space._id, {
        checklist: checklist.map((c) => ({ key: c.key, ok: !!items[c.key]?.ok, note: items[c.key]?.note.trim() || undefined })),
        notes: notes.trim() || undefined,
        recommendation: recommendation as Recommendation,
      });
      toast({ title: apiMessage(r, "Visit saved.") });
      onSaved();
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save the visit.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Record a visit" subtitle={`${space.name} · tick each check you saw on the visit.`}>
      <form onSubmit={submit}>
        {!checklist.length && <p className="mb-4 text-[13px] text-nc-muted">Loading the checklist…</p>}
        <ol className="mb-5 space-y-2.5">
          {checklist.map((c, i) => {
            const it = items[c.key];
            return (
              <li key={c.key} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-0 flex-1 basis-[200px]">
                    <div className="text-[13px] font-medium text-nc-dark">{i + 1}. {c.en}</div>
                    <div dir="rtl" lang="ur" className="urdu text-right text-[12.5px] leading-[2] text-nc-muted">{c.ur}</div>
                  </div>
                  <div className="flex gap-1.5" role="radiogroup" aria-label={c.en}>
                    {[{ v: true, label: "Yes", cls: "border-nc-green bg-nc-green-lt text-nc-green" }, { v: false, label: "No", cls: "border-nc-red bg-nc-red-lt text-nc-red" }].map((o) => (
                      <button type="button" key={o.label} role="radio" aria-checked={it?.ok === o.v} onClick={() => setItem(c.key, { ok: o.v })}
                        className={cn("rounded-full border px-3 py-1 text-[12.5px] font-medium", it?.ok === o.v ? o.cls : "border-border text-nc-muted hover:border-nc-dark/30")}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input value={it?.note ?? ""} onChange={(e) => setItem(c.key, { note: e.target.value })} maxLength={300} placeholder="Note (optional)"
                  className="mt-2 h-9 w-full rounded-md border border-input bg-card px-2.5 text-[12.5px] focus:border-primary focus:outline-none" />
              </li>
            );
          })}
        </ol>

        <label className="mb-4 block">
          <span className="mb-1 block text-[13px] font-medium text-slate">Notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={3}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-[13.5px] focus:border-primary focus:outline-none" placeholder="What you saw, what needs to change…" />
        </label>

        <div className="mb-5">
          <span className="mb-1.5 block text-[13px] font-medium text-slate">Recommendation <span className="text-nc-red">*</span></span>
          <div className="flex flex-wrap gap-2">
            {RECOMMENDATIONS.map((r) => (
              <button type="button" key={r.value} onClick={() => setRecommendation(r.value)} aria-pressed={recommendation === r.value}
                className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-medium", recommendation === r.value ? cn(r.cls, "border-current") : "border-border text-nc-dark hover:border-nc-dark/30")}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary w-full justify-center" disabled={!ok || saving}>
          {saving ? "Saving…" : answered ? "Save visit" : `Answer all ${checklist.length} checks`}
        </button>
      </form>
    </Modal>
  );
}
