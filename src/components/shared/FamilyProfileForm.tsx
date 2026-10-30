import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FamilyProfile, OPTIONS, Opt, ProfileChild } from "@/lib/familyProfile";

function Chips({ legend, options, value, onChange }: {
  legend: string; options: Opt[]; value: string | string[] | undefined; onChange: (v: any) => void;
}) {
  const multi = Array.isArray(value);
  const on = (v: string) => (multi ? (value as string[]).includes(v) : value === v);
  const toggle = (v: string) => {
    if (multi) onChange(on(v) ? (value as string[]).filter((x) => x !== v) : [...(value as string[]), v]);
    else onChange(on(v) ? "" : v); // tap again to clear: every question is optional
  };
  return (
    <fieldset className="mb-4">
      <legend className="mb-1.5 text-[13px] font-medium text-slate">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([v, l]) => (
          <button key={v} type="button" aria-pressed={on(v)} onClick={() => toggle(v)}
            className={cn("rounded-full border px-3 py-1.5 text-[12.5px] transition-colors",
              on(v) ? "border-plum bg-plum text-white" : "border-border bg-card text-nc-dark hover:border-plum/60")}>
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Pick({ label, options, value, onChange }: { label: string; options: Opt[]; value?: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-[12px] font-medium text-slate">
      {label}
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded-md border border-input bg-card px-2 text-[13px] focus:border-primary focus:outline-none">
        <option value="">—</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

const H = ({ children }: { children: string }) => (
  <div className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-dim first:mt-0">{children}</div>
);

/** Strips blanks so only answered questions are sent. */
function toDto(p: FamilyProfile) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    if (["updatedAt", "source", "consent"].includes(k) || v === "" || v == null) continue;
    if (k === "children") {
      const kids = (v as ProfileChild[]).map((c) => Object.fromEntries(Object.entries(c).filter(([, x]) => x))).filter((c) => Object.keys(c).length);
      if (kids.length) out.children = kids;
    } else if (k === "work") {
      const w = Object.fromEntries(Object.entries(v as object).filter(([, x]) => x));
      if (Object.keys(w).length) out.work = w;
    } else if (Array.isArray(v)) { if (v.length) out[k] = v; }
    else out[k] = typeof v === "string" ? v.trim() : v;
  }
  return out;
}

/**
 * The optional "about your family" questions. Parents fill it on their family
 * page; admins use it (with `admin`) to record answers given over the phone.
 */
export default function FamilyProfileForm({ initial, admin, onSave, onCancel }: {
  initial?: FamilyProfile | null;
  admin?: boolean;
  onSave: (dto: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
}) {
  const [p, setP] = useState<FamilyProfile>(() => ({
    ...initial,
    days: initial?.days ?? [], times: initial?.times ?? [], needs: initial?.needs ?? [], involvement: initial?.involvement ?? [],
    work: { ...initial?.work }, children: initial?.children?.length ? initial.children.map((c) => ({ ...c })) : [{}],
  }));
  const [consent, setConsent] = useState(!!initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof FamilyProfile) => (v: any) => setP((x) => ({ ...x, [k]: v }));
  const setWork = (k: "self" | "other") => (v: string) => setP((x) => ({ ...x, work: { ...x.work, [k]: v } }));
  const setChild = (i: number, k: keyof ProfileChild) => (v: string) =>
    setP((x) => ({ ...x, children: x.children!.map((c, n) => (n === i ? { ...c, [k]: v } : c)) }));
  const you = admin ? "the parent" : "you";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setError(admin ? "Tick the box to confirm the family agreed." : "Please tick the box at the end so we can use your answers."); return; }
    setBusy(true); setError("");
    try { await onSave({ ...toDto(p), consent: true }); }
    catch (err: any) { setError(err?.message || "Could not save."); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit}>
      <p className="mb-4 rounded-md bg-muted/60 px-3 py-2 text-[12px] text-nc-muted">
        Every question is optional. {admin ? "Answers" : "Your answers"} are seen only by the Noor Circles team, never by murabbis or other families.
      </p>

      <H>{admin ? "The family" : "Your family"}</H>
      <Chips legend={admin ? "Who answered?" : "Who is filling this in?"} options={OPTIONS.relationship} value={p.relationship ?? ""} onChange={set("relationship")} />
      <Chips legend="Who does the child live with?" options={OPTIONS.livesWith} value={p.livesWith ?? ""} onChange={set("livesWith")} />
      <Chips legend="Household" options={OPTIONS.household} value={p.household ?? ""} onChange={set("household")} />
      <Chips legend={admin ? "Their work" : "Your work"} options={OPTIONS.work} value={p.work?.self ?? ""} onChange={setWork("self")} />
      <Chips legend="The other parent’s work" options={OPTIONS.work} value={p.work?.other ?? ""} onChange={setWork("other")} />

      <H>Timing and getting there</H>
      <Chips legend={`Which days suit ${you}? (choose any)`} options={OPTIONS.days} value={p.days} onChange={set("days")} />
      <Chips legend={`Which times suit ${you}? (choose any)`} options={OPTIONS.times} value={p.times} onChange={set("times")} />
      <Chips legend="Getting to the circle" options={OPTIONS.transport} value={p.transport ?? ""} onChange={set("transport")} />

      <H>Children</H>
      {p.children!.map((c, i) => (
        <div key={i} className="relative mb-3 grid grid-cols-1 gap-2 rounded-md border border-dashed border-border p-3 pr-9 sm:grid-cols-2">
          <Pick label={`Child ${i + 1}: age`} options={OPTIONS.ageBand} value={c.ageBand} onChange={setChild(i, "ageBand")} />
          <Pick label="Boy or girl" options={OPTIONS.gender} value={c.gender} onChange={setChild(i, "gender")} />
          <Pick label="School" options={OPTIONS.school} value={c.school} onChange={setChild(i, "school")} />
          <Pick label="Qur’an so far" options={OPTIONS.quran} value={c.quran} onChange={setChild(i, "quran")} />
          {p.children!.length > 1 && (
            <button type="button" aria-label={`Remove child ${i + 1}`} onClick={() => setP((x) => ({ ...x, children: x.children!.filter((_, n) => n !== i) }))}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-nc-muted hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
          )}
        </div>
      ))}
      {p.children!.length < 4 && (
        <button type="button" className="mb-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-plum hover:underline"
          onClick={() => setP((x) => ({ ...x, children: [...x.children!, {}] }))}>
          <Plus className="h-3.5 w-3.5" /> Add another child
        </button>
      )}

      <H>Support and involvement</H>
      <Chips legend="Language spoken at home" options={OPTIONS.language} value={p.language ?? ""} onChange={set("language")} />
      <Chips legend="Anything to know to support the child? (choose any)" options={OPTIONS.needs} value={p.needs} onChange={set("needs")} />
      <label className="mb-4 block text-[13px] font-medium text-slate">
        Anything else? (optional)
        <textarea value={p.needsNote ?? ""} onChange={(e) => set("needsNote")(e.target.value)} maxLength={500} rows={2}
          placeholder="e.g. allergies, how the child learns best"
          className="mt-1.5 w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-[13px] focus:border-primary focus:outline-none" />
      </label>
      <Chips legend="How would they like to be involved? (choose any)" options={OPTIONS.involvement} value={p.involvement} onChange={set("involvement")} />
      <Chips legend="How did they hear about Noor Circles?" options={OPTIONS.heardFrom} value={p.heardFrom ?? ""} onChange={set("heardFrom")} />
      <Chips legend="Best way to reach them" options={OPTIONS.contactBy} value={p.contactBy ?? ""} onChange={set("contactBy")} />
      <Chips legend="Best time to reach them" options={OPTIONS.contactTime} value={p.contactTime ?? ""} onChange={set("contactTime")} />

      <label className="mt-2 flex cursor-pointer items-start gap-2.5 rounded-md bg-gold/10 px-3 py-2.5 text-[12.5px] text-nc-dark">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[hsl(var(--teal))]" />
        {admin
          ? "The family agreed that Noor Circles may use these answers to arrange their child’s circle."
          : "Noor Circles may use these answers only to arrange a circle for my child."}
      </label>
      {error && <p role="alert" className="mt-3 text-[12.5px] text-nc-red">{error}</p>}
      <div className="mt-4 flex gap-2">
        {onCancel && <button type="button" className="btn-outline flex-1 justify-center" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={busy}>{busy ? "Saving…" : "Save answers"}</button>
      </div>
    </form>
  );
}
