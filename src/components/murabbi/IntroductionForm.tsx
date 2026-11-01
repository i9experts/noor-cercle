import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Lock, Plus, Printer, X } from "lucide-react";
import NcCard from "@/components/shared/NcCard";
import { useToast } from "@/hooks/use-toast";
import { apiError, formatDate } from "@/lib/finance";
import {
  Bi, EXPERIENCE_ROWS, FIELDS, HARD_SKILLS, Introduction, IntroductionResponse, LANGUAGE_LABELS, LANGUAGES, LEVEL_LABELS, LEVELS,
  Level, MAX_ROWS, QURAN, QURAN_LABELS, SECTIONS, SKILL_LABELS, SOFT_SKILLS, SkillKey, completenessOf, printIntroduction, toDto, toForm,
} from "@/lib/murabbiIntro";
import { cn } from "@/lib/utils";

const inputCls = "mt-1 w-full min-w-0 rounded-md border border-input bg-card px-3 text-[13.5px] focus:border-primary focus:outline-none";

/** English label, with the Urdu beside it (or beneath on narrow screens). */
export function BiLabel({ b, optional, className }: { b: Bi; optional?: boolean; className?: string }) {
  return (
    <span className={cn("flex flex-wrap items-baseline justify-between gap-x-3", className)}>
      <span className="text-[13px] font-medium text-slate">
        {b.en}{optional && <span className="ml-1 text-[11.5px] font-normal text-nc-muted">(optional)</span>}
      </span>
      <span dir="rtl" lang="ur" className="urdu text-[13px] leading-[2] text-nc-muted">{b.ur}</span>
    </span>
  );
}

function Text({ b, value, onChange, rows, type, max, placeholder, optional }: {
  b: Bi; value: string; onChange: (v: string) => void; rows?: number; type?: string; max: number; placeholder?: string; optional?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <BiLabel b={b} optional={optional} />
      {rows ? (
        <textarea dir="auto" value={value} rows={rows} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
          className={cn(inputCls, "resize-y py-2 leading-relaxed")} />
      ) : (
        <input dir={type === "date" ? undefined : "auto"} type={type ?? "text"} value={value} maxLength={max} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} className={cn(inputCls, "h-10")} />
      )}
    </label>
  );
}

function Section({ b, n, done, children }: { b: Bi; n: number; done: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <NcCard className="!p-0 min-w-0">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left sm:px-6">
        <span className={cn("flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
          done ? "bg-nc-green-lt text-nc-green" : "bg-plum/10 text-plum")}>
          {done ? <Check className="h-3.5 w-3.5" /> : n}
        </span>
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-[15px] font-semibold text-foreground">{b.en}</span>
          <span dir="rtl" lang="ur" className="urdu text-[15px] leading-[2] text-plum">{b.ur}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 flex-shrink-0 text-nc-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-4 border-t border-border px-4 pb-5 pt-4 sm:px-6">{children}</div>}
    </NcCard>
  );
}

function Chip({ b, on, onClick }: { b: Bi; on: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cn("inline-flex items-baseline gap-1.5 rounded-full border px-3 py-1 text-[12.5px] transition-colors",
        on ? "border-plum bg-plum text-white" : "border-border bg-card text-nc-dark hover:border-plum/60")}>
      {b.en}<span dir="rtl" lang="ur" className={cn("urdu text-[12px] leading-[1.9]", on ? "text-white/80" : "text-nc-muted")}>{b.ur}</span>
    </button>
  );
}

function SkillRow({ k, value, onChange }: { k: SkillKey; value: { level: Level | null; note: string }; onChange: (v: { level: Level | null; note: string }) => void }) {
  return (
    <div className="rounded-md border border-border p-3">
      <BiLabel b={SKILL_LABELS[k]} />
      <div role="radiogroup" aria-label={SKILL_LABELS[k].en} className="mt-1.5 grid grid-cols-4 overflow-hidden rounded-md border border-border">
        {LEVELS.map((l, i) => {
          const on = value.level === l;
          return (
            <button key={l} type="button" role="radio" aria-checked={on} title={on ? "Click again to clear" : undefined}
              onClick={() => onChange({ ...value, level: on ? null : l })}
              className={cn("flex min-w-0 flex-col items-center justify-center px-1 py-1 text-[11.5px] leading-tight transition-colors",
                i > 0 && "border-l border-border", on ? "bg-plum text-white" : "bg-card text-nc-dark hover:bg-plum/5")}>
              <span className="truncate font-medium">{LEVEL_LABELS[l].en}</span>
              <span dir="rtl" lang="ur" className={cn("urdu text-[11px] leading-[1.9]", on ? "text-white/80" : "text-nc-muted")}>{LEVEL_LABELS[l].ur}</span>
            </button>
          );
        })}
      </div>
      <input dir="auto" value={value.note} maxLength={300} placeholder="Note (optional)" aria-label={`${SKILL_LABELS[k].en} note`}
        onChange={(e) => onChange({ ...value, note: e.target.value })} className={cn(inputCls, "h-9 text-[12.5px]")} />
    </div>
  );
}

function ListRows({ b, items, onChange }: { b: Bi; items: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="min-w-0">
      <BiLabel b={b} />
      <ol className="mt-1 space-y-1.5">
        {items.map((x, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-5 flex-shrink-0 text-right text-[12px] tabular-nums text-nc-muted">{i + 1}.</span>
            <input dir="auto" value={x} maxLength={300} aria-label={`${b.en} ${i + 1}`}
              onChange={(e) => onChange(items.map((y, n) => (n === i ? e.target.value : y)))} className={cn(inputCls, "mt-0 h-9")} />
          </li>
        ))}
      </ol>
      {items.length < MAX_ROWS && (
        <button type="button" onClick={() => onChange([...items, ""])} className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-plum hover:underline">
          <Plus className="h-3.5 w-3.5" /> Add another
        </button>
      )}
    </div>
  );
}

export function CompletenessBar({ pct, className }: { pct: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 min-w-[60px] flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-nc-green" : "bg-plum")} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 flex-shrink-0 text-right text-[12px] font-semibold tabular-nums text-nc-dark">{pct}%</span>
    </div>
  );
}

/**
 * The murabbi introduction ("Your Introduction" sheet). The murabbi fills it on
 * "My Introduction"; admins (with `adminMode`) correct it on Murabbi Profiles.
 * Every answer is optional and may be typed in English or Urdu.
 */
export default function IntroductionForm({ load, save, adminMode, onSaved, onCancel }: {
  load: () => Promise<IntroductionResponse>;
  save: (dto: ReturnType<typeof toDto>) => Promise<IntroductionResponse>;
  adminMode?: boolean;
  onSaved?: (r: IntroductionResponse) => void;
  onCancel?: () => void;
}) {
  const { toast } = useToast();
  const [meta, setMeta] = useState<IntroductionResponse | null>(null);
  const [f, setF] = useState<Introduction | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const apply = useCallback((r: IntroductionResponse) => { setMeta(r); setF(toForm(r.profile)); setDirty(false); }, []);
  const reload = useCallback(() => {
    setError("");
    load().then(apply).catch((err) => setError(apiError(err, "Could not load the introduction.")));
  }, [load, apply]);
  useEffect(() => { reload(); }, [reload]);

  const pct = useMemo(() => completenessOf(f), [f]);

  if (!f) {
    return (
      <NcCard>
        <div className="py-10 text-center text-[13px] text-nc-muted">
          {error ? <>{error} <button className="ml-1 font-medium text-plum underline" onClick={reload}>Try again</button></> : "Loading…"}
        </div>
      </NcCard>
    );
  }

  const set = <K extends keyof Introduction>(k: K) => (v: Introduction[K]) => { setF((x) => (x ? { ...x, [k]: v } : x)); setDirty(true); };
  const setExp = (i: number, k: "organisation" | "duration" | "responsibilities") => (v: string) =>
    set("experience")(f.experience.map((e, n) => (n === i ? { ...e, [k]: v } : e)));
  const skill = (k: SkillKey) => f.skills[k] ?? { level: null, note: "" };
  const setSkill = (k: SkillKey) => (v: { level: Level | null; note: string }) => set("skills")({ ...f.skills, [k]: v });
  const toggleLang = (l: string) => set("languages")(f.languages.includes(l) ? f.languages.filter((x) => x !== l) : [...f.languages, l]);

  const filled = {
    personal: !!(f.fatherName.trim() && f.dateOfBirth && f.address.trim()),
    vision: !!(f.purpose.trim() || f.approach.trim() || f.currentWork.trim()),
    education: !!(f.quran || f.school.trim() || f.college.trim()),
    experience: f.experience.some((e) => e.organisation.trim() || e.duration.trim() || e.responsibilities.trim()),
    soft: !!(f.languages.length || SOFT_SKILLS.some((k) => f.skills[k]?.level)),
    hard: HARD_SKILLS.some((k) => f.skills[k]?.level),
    religious: !!(f.islahi.trim() || f.tabligh.trim() || f.political.trim()),
    self: f.strengths.some((x) => x.trim()) || f.weaknesses.some((x) => x.trim()),
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const r = await save(toDto(f!));
      apply(r);
      toast({ title: r.message || "Saved." });
      onSaved?.(r);
    } catch (err) {
      setError(apiError(err, "Could not save. Please try again."));
    } finally { setBusy(false); }
  }

  const savedLine = meta?.saved && meta.updatedAt
    ? `Last saved ${formatDate(meta.updatedAt)}${adminMode && meta.updatedBy ? ` by ${meta.updatedBy.fullName}${meta.updatedBy.role === "admin" ? " (admin)" : meta.updatedBy.role === "murabbi" ? " (the murabbi)" : ""}` : ""}`
    : "Not saved yet";

  return (
    <form onSubmit={submit} className="min-w-0 space-y-4">
      <NcCard small className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="text-[13px] font-semibold text-nc-dark">How complete is {adminMode ? "this introduction" : "your introduction"}?</div>
          <div className="text-[11.5px] text-nc-muted">{savedLine}</div>
        </div>
        <CompletenessBar pct={pct} className="mt-2" />
        <p className="mt-2 flex items-start gap-1.5 text-[11.5px] text-nc-muted">
          <Lock className="mt-0.5 h-3 w-3 flex-shrink-0" />
          Every answer is optional and can be in English or Urdu. Only the Noor Circles admin team sees it; never supervisors or other murabbis.
        </p>
      </NcCard>

      <Section b={SECTIONS.personal} n={1} done={filled.personal}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Text b={FIELDS.fullName} value={f.fullName} onChange={set("fullName")} max={100} />
          <Text b={FIELDS.fatherName} value={f.fatherName} onChange={set("fatherName")} max={100} />
          <Text b={FIELDS.dateOfBirth} type="date" value={f.dateOfBirth} onChange={set("dateOfBirth")} max={10} />
          <Text b={FIELDS.placeOfBirth} value={f.placeOfBirth} onChange={set("placeOfBirth")} max={100} />
          <Text b={FIELDS.whatsapp} type="tel" value={f.whatsapp} onChange={set("whatsapp")} max={30} placeholder="03xx xxxxxxx" />
          <Text b={FIELDS.email} type="email" value={f.email} onChange={set("email")} max={120} />
        </div>
        <Text b={FIELDS.address} rows={2} value={f.address} onChange={set("address")} max={300} />
      </Section>

      <Section b={SECTIONS.vision} n={2} done={filled.vision}>
        <Text b={FIELDS.purpose} rows={3} value={f.purpose} onChange={set("purpose")} max={1000} placeholder="What do you want your life and work to achieve?" />
        <Text b={FIELDS.approach} rows={3} value={f.approach} onChange={set("approach")} max={1000} placeholder="How do you go about it?" />
        <Text b={FIELDS.currentWork} rows={4} value={f.currentWork} onChange={set("currentWork")} max={3000} placeholder="What are you busy with these days?" />
        <Text b={FIELDS.socialImpact} rows={3} value={f.socialImpact} onChange={set("socialImpact")} max={1000} placeholder="What difference has your work made around you?" />
      </Section>

      <Section b={SECTIONS.education} n={3} done={filled.education}>
        <fieldset className="min-w-0">
          <legend className="w-full"><BiLabel b={FIELDS.quran} /></legend>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {QURAN.map((q) => <Chip key={q} b={QURAN_LABELS[q]} on={f.quran === q} onClick={() => set("quran")(f.quran === q ? null : q)} />)}
          </div>
          <input dir="auto" value={f.quranNote} maxLength={300} placeholder="Note (optional), e.g. which juz, where you studied" aria-label="Qur'an note"
            onChange={(e) => set("quranNote")(e.target.value)} className={cn(inputCls, "h-9 text-[12.5px]")} />
        </fieldset>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Text b={FIELDS.school} rows={2} value={f.school} onChange={set("school")} max={1000} />
          <Text b={FIELDS.college} rows={2} value={f.college} onChange={set("college")} max={1000} />
          <Text b={FIELDS.courses} rows={2} value={f.courses} onChange={set("courses")} max={1000} />
          <Text b={FIELDS.specialisation} rows={2} value={f.specialisation} onChange={set("specialisation")} max={1000} />
        </div>
      </Section>

      <Section b={SECTIONS.experience} n={4} done={filled.experience}>
        {f.experience.map((e, i) => (
          <div key={i} className="relative rounded-md border border-dashed border-border p-3 pr-10">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-dim">{i + 1}</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
              <Text b={FIELDS.organisation} value={e.organisation} onChange={setExp(i, "organisation")} max={150} />
              <Text b={FIELDS.duration} value={e.duration} onChange={setExp(i, "duration")} max={80} placeholder="e.g. 2019–2022" />
            </div>
            <div className="mt-3"><Text b={FIELDS.responsibilities} rows={2} value={e.responsibilities} onChange={setExp(i, "responsibilities")} max={1000} /></div>
            {f.experience.length > 1 && (
              <button type="button" aria-label={`Remove row ${i + 1}`} onClick={() => set("experience")(f.experience.filter((_, n) => n !== i))}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-nc-muted hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
            )}
          </div>
        ))}
        {f.experience.length < MAX_ROWS && (
          <button type="button" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-plum hover:underline"
            onClick={() => set("experience")([...f.experience, { organisation: "", duration: "", responsibilities: "" }])}>
            <Plus className="h-3.5 w-3.5" /> Add another{f.experience.length >= EXPERIENCE_ROWS ? ` (up to ${MAX_ROWS})` : ""}
          </button>
        )}
      </Section>

      <Section b={SECTIONS.soft} n={5} done={filled.soft}>
        <fieldset className="min-w-0">
          <legend className="w-full"><BiLabel b={FIELDS.languages} /></legend>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {LANGUAGES.map((l) => <Chip key={l} b={LANGUAGE_LABELS[l]} on={f.languages.includes(l)} onClick={() => toggleLang(l)} />)}
          </div>
          <input dir="auto" value={f.languagesNote} maxLength={300} placeholder="Note (optional), e.g. other languages, how well you speak them" aria-label="Languages note"
            onChange={(e) => set("languagesNote")(e.target.value)} className={cn(inputCls, "h-9 text-[12.5px]")} />
        </fieldset>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {SOFT_SKILLS.map((k) => <SkillRow key={k} k={k} value={skill(k)} onChange={setSkill(k)} />)}
        </div>
      </Section>

      <Section b={SECTIONS.hard} n={6} done={filled.hard}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {HARD_SKILLS.map((k) => <SkillRow key={k} k={k} value={skill(k)} onChange={setSkill(k)} />)}
        </div>
      </Section>

      <Section b={SECTIONS.religious} n={7} done={filled.religious}>
        <Text b={FIELDS.islahi} rows={2} value={f.islahi} onChange={set("islahi")} max={1000} />
        <Text b={FIELDS.tabligh} rows={2} value={f.tabligh} onChange={set("tabligh")} max={1000} />
        <div>
          <Text b={FIELDS.political} rows={2} value={f.political} onChange={set("political")} max={1000} optional />
          <p className="mt-1 text-[11.5px] text-nc-muted">Optional. Never used to judge anyone; admins only.</p>
        </div>
      </Section>

      <Section b={SECTIONS.self} n={8} done={filled.self}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ListRows b={FIELDS.strengths} items={f.strengths} onChange={set("strengths")} />
          <ListRows b={FIELDS.weaknesses} items={f.weaknesses} onChange={set("weaknesses")} />
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-lg sm:border sm:shadow-nc">
        {error && <p role="alert" className="mb-2 text-[12.5px] text-nc-red">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden min-w-[160px] flex-1 sm:block"><CompletenessBar pct={pct} /></div>
          <span className="flex-1 text-[11.5px] text-nc-muted sm:hidden">{pct}% complete{dirty ? " · unsaved" : ""}</span>
          {dirty && <span className="hidden text-[11.5px] text-gold-dim sm:inline">Unsaved changes</span>}
          {onCancel && <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>}
          <button type="button" className="btn-outline" onClick={() => printIntroduction(toDto(f), { name: meta?.murabbi.fullName, updatedAt: meta?.updatedAt })}>
            <Printer className="h-4 w-4" /> Print
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </form>
  );
}
