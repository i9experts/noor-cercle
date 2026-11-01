import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Lock, Pencil, Printer, Search, X } from "lucide-react";
import NcCard from "@/components/shared/NcCard";
import StatCard from "@/components/shared/StatCard";
import NcBadge from "@/components/shared/NcBadge";
import IntroductionForm, { CompletenessBar } from "@/components/murabbi/IntroductionForm";
import IntroductionView from "@/components/murabbi/IntroductionView";
import { murabbiProfileService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { apiError, apiMessage, formatDate, unwrap } from "@/lib/finance";
import {
  IntroductionResponse, LANGUAGE_LABELS, LANGUAGES, LEVEL_LABELS, LEVELS, QURAN, QURAN_LABELS, SKILL_LABELS, SKILLS, STATUS_LABELS, SkillKey,
  printIntroduction,
} from "@/lib/murabbiIntro";
import { cn } from "@/lib/utils";

interface Row {
  _id: string; fullName: string; email: string; phone?: string; tier: number; isActive: boolean; image: string | null;
  status: "none" | "started" | "complete"; completeness: number; updatedAt: string | null;
  quran: string | null; languages: string[]; specialisation: string; skills: Partial<Record<SkillKey, string | null>>; experienceCount: number;
}
interface ListData {
  stats: { murabbis: number; started: number; complete: number; none: number; quran: Record<string, number>; languages: Record<string, number>; skills: Record<string, number> };
  rows: Row[];
}

const STATUS_TONE: Record<string, "green" | "amber" | "slate"> = { complete: "green", started: "amber", none: "slate" };
const opts = (keys: readonly string[], labels: Record<string, { en: string }>) => keys.map((k) => [k, labels[k]?.en ?? k] as [string, string]);
const selectCls = "h-9 rounded-md border border-input bg-card px-2 text-[12.5px] focus:border-primary focus:outline-none";

export default function MurabbiProfilesPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<string[]>([]);
  const [quran, setQuran] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [skill, setSkill] = useState("");
  const [minLevel, setMinLevel] = useState("good");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Row | null>(null);
  const reqId = useRef(0);

  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (status.length) p.status = status.join(",");
    if (quran.length) p.quran = quran.join(",");
    if (languages.length) p.languages = languages.join(",");
    if (skill) { p.skill = skill; p.minLevel = minLevel; }
    if (search.trim()) p.search = search.trim();
    return p;
  }, [status, quran, languages, skill, minLevel, search]);

  const load = useCallback(() => {
    const id = ++reqId.current;
    setLoading(true);
    murabbiProfileService.list(params)
      .then((r) => { if (id === reqId.current) setData(unwrap<ListData>(r)); })
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load murabbi profiles.") }))
      .finally(() => { if (id === reqId.current) setLoading(false); });
  }, [params, toast]);
  useEffect(() => { const t = setTimeout(load, search ? 300 : 0); return () => clearTimeout(t); }, [load, search]);

  const flip = (set: (f: (v: string[]) => string[]) => void, v: string) => set((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  const anyFilter = status.length || quran.length || languages.length || skill || search;
  const clearAll = () => { setStatus([]); setQuran([]); setLanguages([]); setSkill(""); setMinLevel("good"); setSearch(""); };

  const s = data?.stats;
  const rows = data?.rows ?? [];
  const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : "–");
  const topSkills = s ? SKILLS.map((k) => [k, s.skills[k] ?? 0] as [string, number]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 8) : [];

  return (
    <div className="min-w-0 space-y-6">
      <p className="max-w-3xl text-[13px] text-nc-muted">
        What murabbis have told us about themselves on their introduction sheet: education, experience, languages and skills. Use it to match
        murabbis to circles, trainings and responsibilities.
        <span className="ml-1 inline-flex items-center gap-1 font-medium text-nc-dark"><Lock className="h-3 w-3" /> Admins only — supervisors and other murabbis never see these answers.</span>
      </p>

      {s && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard label="Murabbis" value={s.murabbis} meta="Verified murabbi accounts" color="teal" />
          <StatCard label="Complete" value={s.complete} meta={`${pct(s.complete, s.murabbis)} of murabbis`} color="green" metaUp={s.complete > 0} />
          <StatCard label="Started" value={s.started} meta="Some sections still empty" color="gold" />
          <StatCard label="Not started" value={s.none} meta="Remind them from their dashboard" color="red" />
        </div>
      )}

      {/* Filters */}
      <NcCard small className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-nc-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, school, organisation" aria-label="Search murabbis"
              dir="auto" className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-[13px] focus:border-primary focus:outline-none" />
          </div>
          <MultiSelect title="Status" options={opts(["none", "started", "complete"], Object.fromEntries(Object.entries(STATUS_LABELS).map(([k, v]) => [k, { en: v }])))}
            value={status} onChange={setStatus} />
          <MultiSelect title="Qur’an" options={opts(QURAN, QURAN_LABELS)} value={quran} onChange={setQuran} />
          <MultiSelect title="Languages" sub="Speaks all of the chosen" options={opts(LANGUAGES, LANGUAGE_LABELS)} value={languages} onChange={setLanguages} />
          <div className="flex flex-wrap items-center gap-1.5">
            <select aria-label="Skill" value={skill} onChange={(e) => setSkill(e.target.value)} className={cn(selectCls, skill && "border-plum text-plum")}>
              <option value="">Any skill</option>
              {SKILLS.map((k) => <option key={k} value={k}>{SKILL_LABELS[k].en}</option>)}
            </select>
            <select aria-label="Minimum level" value={minLevel} onChange={(e) => setMinLevel(e.target.value)} disabled={!skill} className={cn(selectCls, "disabled:opacity-50")}>
              {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l].en} or better</option>)}
            </select>
          </div>
        </div>
        {anyFilter ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
            {status.map((v) => <Pill key={`s${v}`} k="Status" v={STATUS_LABELS[v]} onClick={() => flip(setStatus, v)} />)}
            {quran.map((v) => <Pill key={`q${v}`} k="Qur’an" v={QURAN_LABELS[v]?.en ?? v} onClick={() => flip(setQuran, v)} />)}
            {languages.map((v) => <Pill key={`l${v}`} k="Speaks" v={LANGUAGE_LABELS[v]?.en ?? v} onClick={() => flip(setLanguages, v)} />)}
            {skill && <Pill k={SKILL_LABELS[skill as SkillKey].en} v={`${LEVEL_LABELS[minLevel as keyof typeof LEVEL_LABELS].en}+`} onClick={() => setSkill("")} />}
            <button className="ml-1 text-[12px] font-medium text-nc-muted underline hover:text-nc-dark" onClick={clearAll}>Clear all</button>
          </div>
        ) : null}
      </NcCard>

      {!data ? (
        <NcCard><div className="py-12 text-center text-[13px] text-nc-muted">Loading…</div></NcCard>
      ) : (
        <div className={cn("min-w-0 space-y-6 transition-opacity", loading && "opacity-60")}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Counts title="Qur’an" sub="Of those who answered" items={QURAN.map((k) => [k, QURAN_LABELS[k].en, s!.quran[k] ?? 0])}
              active={quran} onPick={(v) => flip(setQuran, v)} />
            <Counts title="Languages" sub="Click to filter" items={LANGUAGES.map((k) => [k, LANGUAGE_LABELS[k].en, s!.languages[k] ?? 0])}
              active={languages} onPick={(v) => flip(setLanguages, v)} />
            <Counts title="Top skills" sub="Good or better" items={topSkills.map(([k, n]) => [k, SKILL_LABELS[k as SkillKey].en, n])}
              active={skill ? [skill] : []} onPick={(v) => { setSkill(skill === v ? "" : v); setMinLevel("good"); }} />
          </div>

          <NcCard className="min-w-0">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-[15px] font-semibold text-foreground">{rows.length} murabbi{rows.length === 1 ? "" : "s"}</div>
              <div className="text-[12px] text-nc-muted">Click a murabbi to read, edit or print their introduction</div>
            </div>
            <ProfileTable rows={rows} onOpen={setOpen} />
          </NcCard>
        </div>
      )}

      {open && <ProfileDrawer row={open} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  );
}

function Pill({ k, v, onClick }: { k: string; v: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 rounded-full bg-plum/10 px-2.5 py-1 text-[11.5px] text-plum hover:bg-plum/20">
      <span className="text-plum/70">{k}:</span> {v} <X className="h-3 w-3" />
    </button>
  );
}

// ── Filter dropdown (same as Parent Insights) ─────────────────────────────

function MultiSelect({ title, sub, options, value, onChange }: {
  title: string; sub?: string; options: [string, string][]; value: string[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" className={cn("btn-outline !h-9", value.length && "!border-plum !text-plum")} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {title}{value.length ? ` (${value.length})` : ""} <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-1 max-h-64 w-56 overflow-y-auto rounded-md border border-border bg-card py-1 shadow-lg">
          {sub && <div className="px-3 pb-1 pt-1.5 text-[11px] text-nc-muted">{sub}</div>}
          {options.map(([v, l]) => (
            <label key={v} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[12.5px] hover:bg-muted/50">
              <input type="checkbox" checked={value.includes(v)} className="accent-[hsl(var(--teal))]"
                onChange={() => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])} />
              {l}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Count summaries ─────────────────────────────────────────────────────────

function Counts({ title, sub, items, active, onPick }: {
  title: string; sub: string; items: [string, string, number][]; active: string[]; onPick: (v: string) => void;
}) {
  const shown = items.filter(([, , n]) => n > 0).sort((a, b) => b[2] - a[2]);
  const max = Math.max(1, ...shown.map(([, , n]) => n));
  return (
    <NcCard small className="min-w-0">
      <div className="mb-3">
        <div className="text-[14px] font-semibold text-foreground">{title}</div>
        <div className="text-[11.5px] text-nc-muted">{sub}</div>
      </div>
      {shown.length === 0 ? <div className="py-3 text-[12.5px] text-nc-muted">No answers yet.</div> : (
        <ul className="space-y-1.5">
          {shown.map(([k, l, n]) => {
            const on = active.includes(k);
            return (
              <li key={k}>
                <button type="button" onClick={() => onPick(k)} aria-pressed={on} className="group block w-full text-left">
                  <div className="mb-0.5 flex justify-between gap-2 text-[12.5px]">
                    <span className={cn("truncate group-hover:text-plum", on ? "font-semibold text-plum" : "text-nc-dark")}>{l}</span>
                    <span className="flex-shrink-0 tabular-nums text-nc-muted">{n}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", on ? "bg-plum" : "bg-teal")} style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </NcCard>
  );
}

// ── Murabbis table ──────────────────────────────────────────────────────────

function ProfileTable({ rows, onOpen }: { rows: Row[]; onOpen: (r: Row) => void }) {
  if (!rows.length) return <div className="py-10 text-center text-[13px] text-nc-muted">No murabbis match these filters.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-nc-muted">
            <th className="py-2 pr-3 font-medium">Murabbi</th>
            <th className="py-2 pr-3 font-medium">Tier</th>
            <th className="w-44 py-2 pr-3 font-medium">Introduction</th>
            <th className="py-2 pr-3 font-medium">Qur’an</th>
            <th className="py-2 pr-3 font-medium">Languages</th>
            <th className="py-2 pr-3 font-medium">Specialisation</th>
            <th className="py-2 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r._id} onClick={() => onOpen(r)} className="cursor-pointer border-b border-border/60 align-top last:border-0 hover:bg-muted/40">
              <td className="py-2.5 pr-3">
                <button type="button" className="text-left font-medium text-nc-dark hover:text-plum" onClick={(e) => { e.stopPropagation(); onOpen(r); }}>{r.fullName}</button>
                {!r.isActive && <NcBadge variant="slate" className="ml-1.5">Inactive</NcBadge>}
                <div className="text-[11.5px] text-nc-muted">{r.email}</div>
              </td>
              <td className="py-2.5 pr-3">Tier {r.tier}</td>
              <td className="py-2.5 pr-3">
                <NcBadge variant={STATUS_TONE[r.status]}>{STATUS_LABELS[r.status]}</NcBadge>
                {r.status !== "none" && <CompletenessBar pct={r.completeness} className="mt-1.5" />}
              </td>
              <td className="py-2.5 pr-3">{r.quran ? QURAN_LABELS[r.quran]?.en ?? r.quran : <span className="text-nc-muted">–</span>}</td>
              <td className="py-2.5 pr-3 text-[12.5px]">{r.languages.length ? r.languages.map((l) => LANGUAGE_LABELS[l]?.en ?? l).join(", ") : <span className="text-nc-muted">–</span>}</td>
              <td className="max-w-[220px] py-2.5 pr-3 text-[12.5px]"><div dir="auto" className="line-clamp-2">{r.specialisation || <span className="text-nc-muted">–</span>}</div></td>
              <td className="py-2.5 text-[12px] text-nc-muted">{r.updatedAt ? formatDate(r.updatedAt) : "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── One murabbi's introduction (read / edit / print) ───────────────────────

function ProfileDrawer({ row, onClose, onChanged }: { row: Row; onClose: () => void; onChanged: () => void }) {
  const { toast } = useToast();
  const [detail, setDetail] = useState<IntroductionResponse | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => unwrap<IntroductionResponse>(await murabbiProfileService.get(row._id)), [row._id]);
  const save = useCallback(async (dto: object) => {
    const r = await murabbiProfileService.save(row._id, dto);
    return { ...unwrap<IntroductionResponse>(r), message: apiMessage(r, "Saved.") };
  }, [row._id]);

  useEffect(() => {
    let live = true;
    load().then((d) => { if (live) setDetail(d); })
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load the introduction.") }));
    return () => { live = false; };
  }, [load, toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex justify-end bg-black/45" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={`${row.fullName}’s introduction`} className="flex h-full w-full max-w-5xl flex-col bg-background shadow-xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-card px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="truncate font-serif text-[20px] text-foreground">{row.fullName}</div>
            <div className="text-[12px] text-nc-muted">
              Tier {row.tier} · {row.email}
              {detail?.saved && detail.updatedAt && <> · saved {formatDate(detail.updatedAt)}{detail.updatedBy ? ` by ${detail.updatedBy.fullName}` : ""}</>}
            </div>
          </div>
          {!editing && detail && (
            <>
              <button className="btn-outline !py-1.5" onClick={() => printIntroduction(detail.profile, { name: row.fullName, updatedAt: detail.updatedAt })}>
                <Printer className="h-4 w-4" /> Print
              </button>
              <button className="btn-primary !py-1.5" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Edit</button>
            </>
          )}
          <button aria-label="Close" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-nc-muted hover:bg-teal-lt"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {!detail ? (
            <div className="py-12 text-center text-[13px] text-nc-muted">Loading…</div>
          ) : editing ? (
            <IntroductionForm adminMode load={load} save={save} onCancel={() => setEditing(false)}
              onSaved={(r) => { setDetail(r); setEditing(false); onChanged(); }} />
          ) : (
            <>
              <div className="mb-4 rounded-lg border border-border bg-card px-4 py-3">
                <div className="mb-1 flex items-center justify-between text-[12.5px]">
                  <span className="font-medium text-nc-dark">{detail.saved ? "Introduction" : "Not started yet: the account details are filled in below"}</span>
                </div>
                <CompletenessBar pct={detail.completeness} />
              </div>
              <IntroductionView p={detail.profile} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
