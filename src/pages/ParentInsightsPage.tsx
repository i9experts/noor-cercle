import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Download, Filter, Lock, Mail, Pencil, Search, Send, X } from "lucide-react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import StatCard from "@/components/shared/StatCard";
import Modal from "@/components/shared/Modal";
import FamilyProfileForm from "@/components/shared/FamilyProfileForm";
import { emailService, insightsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { apiError, apiMessage, downloadCsv, formatDate, unwrap } from "@/lib/finance";
import { FamilyProfile, OPTIONS, QUESTIONS, label, summarise, workOf } from "@/lib/familyProfile";
import { cn } from "@/lib/utils";

type Filters = Record<string, string[]>;
interface Row {
  id: string; source: "parent" | "request"; name: string; email: string | null; phone: string; city: string; neighbourhood: string;
  status: string; createdAt: string; children: number; enrolledChildren: number; ageBands: string[]; profile: FamilyProfile | null;
}

// The filter menus, grouped. Every one is "any of" within, "all of" across.
const FILTER_GROUPS: { title: string; keys: string[] }[] = [
  { title: "Family situation", keys: ["livesWith", "relationship", "household", "work"] },
  { title: "Timing and travel", keys: ["days", "times", "transport"] },
  { title: "Children", keys: ["ageBand", "gender", "school", "quran"] },
  { title: "Support and outreach", keys: ["needs", "language", "involvement", "heardFrom"] },
  { title: "Pipeline", keys: ["status", "source", "answered"] },
];
const EXTRA: Record<string, [string, string][]> = {
  source: [["request", "Interest request"], ["parent", "Parent on file"]],
  answered: [["yes", "Answered the questions"], ["no", "Not answered yet"]],
};
const optionsFor = (k: string) => EXTRA[k] ?? OPTIONS[k] ?? [];
const nameFor = (k: string) => (k === "source" ? "Record" : k === "answered" ? "Answers" : QUESTIONS[k] ?? k);
const valueLabel = (k: string, v: string) => EXTRA[k]?.find(([x]) => x === v)?.[1] ?? label(k, v);

const BREAKDOWNS: { key: string; title: string; filter?: string; sub?: string }[] = [
  { key: "livesWith", title: "Who the child lives with", filter: "livesWith" },
  { key: "mothersWork", title: "Mother’s work", filter: "work", sub: "From the mother’s own answer, or the father’s answer about her" },
  { key: "fathersWork", title: "Father’s work", filter: "work", sub: "From the father’s own answer, or the mother’s answer about him" },
  { key: "household", title: "Household", filter: "household" },
  { key: "relationship", title: "Who answered", filter: "relationship" },
  { key: "transport", title: "Getting to the circle", filter: "transport" },
  { key: "ageBand", title: "Children’s ages", filter: "ageBand", sub: "Counted per child; includes the age chosen on the request" },
  { key: "gender", title: "Boys and girls", filter: "gender" },
  { key: "school", title: "School", filter: "school" },
  { key: "quran", title: "Qur’an so far", filter: "quran" },
  { key: "language", title: "Home language", filter: "language" },
  { key: "needs", title: "Support needs", filter: "needs" },
  { key: "involvement", title: "How they’d like to help", filter: "involvement" },
  { key: "heardFrom", title: "How they heard about us", filter: "heardFrom" },
  { key: "contactBy", title: "Best way to reach" },
  { key: "status", title: "Where they are", filter: "status" },
];

const STATUS_TONE: Record<string, string> = {
  new: "bg-gold/15 text-gold-dim", contacted: "bg-teal-lt text-teal", registered: "bg-muted text-nc-dark",
  enrolled: "bg-nc-green-lt text-nc-green", closed: "bg-muted text-nc-muted",
};

function toParams(f: Filters, search: string, from: string, to: string) {
  const p: Record<string, string> = {};
  for (const [k, v] of Object.entries(f)) if (v.length) p[k] = v.join(",");
  if (search.trim()) p.search = search.trim();
  if (from) p.from = from;
  if (to) p.to = to;
  return p;
}

export default function ParentInsightsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<Filters>({});
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [mailing, setMailing] = useState<Row[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const reqId = useRef(0);

  const params = useMemo(() => toParams(filters, search, from, to), [filters, search, from, to]);
  const load = useCallback(() => {
    const id = ++reqId.current;
    setLoading(true);
    insightsService.parents(params)
      .then((r) => { if (id === reqId.current) { setData(unwrap(r)); setSelected(new Set()); } })
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load Parent Insights.") }))
      .finally(() => { if (id === reqId.current) setLoading(false); });
  }, [params, toast]);
  useEffect(() => { const t = setTimeout(load, search ? 300 : 0); return () => clearTimeout(t); }, [load, search]);

  const toggle = (k: string, v: string) => setFilters((f) => {
    const cur = f[k] ?? [];
    return { ...f, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
  });
  const active = Object.entries(filters).flatMap(([k, vs]) => vs.map((v) => [k, v] as [string, string]));
  const clearAll = () => { setFilters({}); setSearch(""); setFrom(""); setTo(""); };

  const rows: Row[] = data?.rows ?? [];
  const t = data?.totals;
  const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : "–");

  function exportCsv() {
    const head = ["Name", "Email", "Phone", "City", "Neighbourhood", "Status", "Record", "Since", "Children", "Answered by", "Lives with", "Household",
      "Mother's work", "Father's work", "Days", "Times", "Transport", "Ages", "Language", "Support needs", "Note", "Involvement", "Heard from", "Contact by", "Contact time"];
    const many = (k: string, v?: string[]) => (v ?? []).map((x) => label(k, x)).join("; ");
    downloadCsv(`parent-insights-${new Date().toISOString().slice(0, 10)}.csv`, [head, ...rows.map((r) => {
      const p = r.profile;
      return [r.name, r.email ?? "", r.phone, r.city, r.neighbourhood, label("status", r.status), r.source === "parent" ? "Parent on file" : "Interest request",
        formatDate(r.createdAt), r.children, label("relationship", p?.relationship), label("livesWith", p?.livesWith), label("household", p?.household),
        label("work", workOf(p, "mother")), label("work", workOf(p, "father")), many("days", p?.days), many("times", p?.times), label("transport", p?.transport),
        r.ageBands.map((a) => label("ageBand", a)).join("; "), label("language", p?.language), many("needs", p?.needs), p?.needsNote ?? "",
        many("involvement", p?.involvement), label("heardFrom", p?.heardFrom), label("contactBy", p?.contactBy), label("contactTime", p?.contactTime)];
    })]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-[13px] text-nc-muted">
          What families have told us about their situation: who children live with, parents’ work, the days and times that suit them, and what
          support they need. Answers come from the website form, the family page, or the team.
          <span className="ml-1 inline-flex items-center gap-1 font-medium text-nc-dark"><Lock className="h-3 w-3" /> Admins only; never shown to murabbis.</span>
        </p>
      </div>

      {/* Filters */}
      <NcCard small>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-nc-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, email, area" aria-label="Search families"
              className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-[13px] focus:border-primary focus:outline-none" />
          </div>
          <MultiSelect title="City" options={(data?.places.cities ?? []).map((c: string) => [c, c])} value={filters.city ?? []}
            onChange={(v) => setFilters((f) => ({ ...f, city: v }))} />
          <MultiSelect title="Neighbourhood" options={(data?.places.neighbourhoods ?? []).map((c: string) => [c, c])} value={filters.neighbourhood ?? []}
            onChange={(v) => setFilters((f) => ({ ...f, neighbourhood: v }))} />
          <label className="flex items-center gap-1.5 text-[12px] text-nc-muted">From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 rounded-md border border-input bg-card px-2 text-[12.5px]" />
          </label>
          <label className="flex items-center gap-1.5 text-[12px] text-nc-muted">To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 rounded-md border border-input bg-card px-2 text-[12.5px]" />
          </label>
          <button className={cn("btn-outline !h-9", showFilters && "!border-plum !text-plum")} onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
            <Filter className="h-4 w-4" /> More filters{active.filter(([k]) => k !== "city" && k !== "neighbourhood").length ? ` (${active.filter(([k]) => k !== "city" && k !== "neighbourhood").length})` : ""}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-5 border-t border-border pt-4 md:grid-cols-2 xl:grid-cols-3">
            {FILTER_GROUPS.map((g) => (
              <div key={g.title}>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-dim">{g.title}</div>
                {g.keys.map((k) => (
                  <div key={k} className="mb-2.5">
                    <div className="mb-1 text-[12px] font-medium text-slate">{nameFor(k)}</div>
                    <div className="flex flex-wrap gap-1">
                      {optionsFor(k).map(([v, l]) => {
                        const on = (filters[k] ?? []).includes(v);
                        return (
                          <button key={v} type="button" aria-pressed={on} onClick={() => toggle(k, v)}
                            className={cn("rounded-full border px-2.5 py-1 text-[11.5px]", on ? "border-plum bg-plum text-white" : "border-border text-nc-dark hover:border-plum/60")}>
                            {l}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {(active.length > 0 || search || from || to) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
            {active.map(([k, v]) => (
              <button key={k + v} onClick={() => toggle(k, v)} className="inline-flex items-center gap-1 rounded-full bg-plum/10 px-2.5 py-1 text-[11.5px] text-plum hover:bg-plum/20">
                <span className="text-plum/70">{nameFor(k)}:</span> {valueLabel(k, v)} <X className="h-3 w-3" />
              </button>
            ))}
            <button className="ml-1 text-[12px] font-medium text-nc-muted underline hover:text-nc-dark" onClick={clearAll}>Clear all</button>
          </div>
        )}
      </NcCard>

      {!data ? (
        <NcCard><div className="py-12 text-center text-[13px] text-nc-muted">Loading…</div></NcCard>
      ) : (
        <div className={cn("space-y-6 transition-opacity", loading && "opacity-60")}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Families" value={t.families} meta={`${t.children} children · ${t.requests} still requests`} color="teal" />
            <StatCard label="Waiting for a circle" value={t.waiting} meta={`${t.enrolled} enrolled`} color="gold" />
            <StatCard label="Answered the questions" value={t.answered} meta={`${pct(t.answered, t.families)} of these families`} color="purple" />
            <StatCard label="Single-parent homes" value={t.singleParent} meta={`${pct(t.singleParent, t.answered)} of those who answered`} color="red" />
            <StatCard label="A parent works away" value={t.parentAway} meta={`${pct(t.parentAway, t.answered)} of those who answered`} color="gold" />
            <StatCard label="Working mothers" value={t.workingMothers} meta="Full-time, part-time, from home, business, shift or away" color="teal" />
            <StatCard label="Need a lift" value={t.needsLift} meta="Can’t walk or be dropped off" color="purple" />
            <StatCard label="Support needs" value={t.supportNeeds} meta="Learning or health" color="red" />
            <StatCard label="Enrolled" value={t.enrolled} meta={`${pct(t.enrolled, t.families)} of these families`} color="green" />
            <StatCard label="Children" value={t.children} meta="Counted from answers and records" color="teal" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <NcCard className="min-w-0">
              <CardHeader><CardTitle sub="Families who said both the day and the time suit them">When families are free</CardTitle></CardHeader>
              <Availability cells={data.availability} />
            </NcCard>
            <NcCard className="min-w-0">
              <CardHeader><CardTitle sub="New families by month (Pakistan time)">Families over time</CardTitle></CardHeader>
              <OverTime points={data.overTime} />
            </NcCard>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {BREAKDOWNS.map((b) => (
              <Breakdown key={b.key} title={b.title} sub={b.sub} field={b.key} counts={data.breakdowns[b.key]}
                active={b.filter ? filters[b.filter] ?? [] : []} onPick={b.filter ? (v) => toggle(b.filter!, v) : undefined} />
            ))}
          </div>

          <NcCard>
            <CardHeader><CardTitle sub="Families still waiting, against free seats in that area’s active circles">Demand by neighbourhood</CardTitle></CardHeader>
            <Neighbourhoods rows={data.neighbourhoods} />
          </NcCard>

          <NcCard>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <CardTitle sub={rows.length < t.families ? `Showing the first ${rows.length}` : "Tick families to email just them"}>{t.families} families</CardTitle>
              <div className="flex flex-wrap gap-2">
                <button className="btn-outline" onClick={exportCsv} disabled={!rows.length}><Download className="h-4 w-4" /> Export CSV</button>
                <button className="btn-primary" disabled={!rows.length}
                  onClick={() => setMailing(selected.size ? rows.filter((r) => selected.has(r.id)) : rows)}>
                  <Mail className="h-4 w-4" /> Email {selected.size ? `${selected.size} selected` : "these families"}
                </button>
              </div>
            </div>
            <FamilyTable rows={rows} selected={selected} setSelected={setSelected} onEdit={setEditing} />
          </NcCard>
        </div>
      )}

      {editing && (
        <Modal open onClose={() => setEditing(null)} title={`About ${editing.name.split(" ")[0]}’s family`}
          subtitle="Record or correct the answers the family gave you, for example over the phone.">
          <FamilyProfileForm admin initial={editing.profile} onCancel={() => setEditing(null)} onSave={async (dto) => {
            try {
              const r = await insightsService.saveProfile(editing.id, dto);
              toast({ title: apiMessage(r, "Saved.") });
              setEditing(null);
              load();
            } catch (err) { throw new Error(apiError(err, "Could not save.")); }
          }} />
        </Modal>
      )}
      {mailing && <EmailFamilies families={mailing} onClose={() => setMailing(null)} />}
    </div>
  );
}

// ── Filter dropdown (city / neighbourhood) ─────────────────────────────────

function MultiSelect({ title, options, value, onChange }: { title: string; options: [string, string][]; value: string[]; onChange: (v: string[]) => void }) {
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
          {options.length === 0 ? <div className="px-3 py-2 text-[12px] text-nc-muted">None yet</div> : options.map(([v, l]) => (
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

// ── Charts ──────────────────────────────────────────────────────────────────

function Breakdown({ title, sub, field, counts, active, onPick }: {
  title: string; sub?: string; field: string; counts: Record<string, number>; active: string[]; onPick?: (v: string) => void;
}) {
  const { unanswered = 0, ...rest } = counts ?? {};
  const entries = Object.entries(rest).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, n]) => s + n, 0);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  return (
    <NcCard small className="min-w-0">
      <div className="mb-3">
        <div className="text-[14px] font-semibold text-foreground">{title}</div>
        {sub && <div className="text-[11.5px] text-nc-muted">{sub}</div>}
      </div>
      {entries.length === 0 ? (
        <div className="py-4 text-[12.5px] text-nc-muted">No answers yet.</div>
      ) : (
        <ul className="space-y-1.5">
          {entries.map(([v, n]) => {
            const on = active.includes(v);
            const Row = onPick ? "button" : "div";
            return (
              <li key={v}>
                <Row {...(onPick && { type: "button", onClick: () => onPick(v), "aria-pressed": on, title: on ? "Remove this filter" : "Show only these families" })}
                  className={cn("group block w-full text-left", onPick && "cursor-pointer")}>
                  <div className="mb-0.5 flex justify-between gap-2 text-[12.5px]">
                    <span className={cn("truncate", on ? "font-semibold text-plum" : "text-nc-dark", onPick && "group-hover:text-plum")}>{label(field, v)}</span>
                    <span className="flex-shrink-0 tabular-nums text-nc-muted">{n} · {Math.round((n / total) * 100)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", on ? "bg-plum" : "bg-teal")} style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                </Row>
              </li>
            );
          })}
        </ul>
      )}
      {unanswered > 0 && <div className="mt-2.5 text-[11px] text-nc-muted">{unanswered} didn’t answer this</div>}
    </NcCard>
  );
}

function Availability({ cells }: { cells: { day: string; time: string; families: number }[] }) {
  const max = Math.max(1, ...cells.map((c) => c.families));
  const days = OPTIONS.days;
  const times = OPTIONS.times;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[360px] border-separate border-spacing-1 text-[12px]">
        <thead>
          <tr><th />{times.map(([v, l]) => <th key={v} className="px-1 pb-1 text-left font-medium text-nc-muted">{l}</th>)}</tr>
        </thead>
        <tbody>
          {days.map(([d, dl]) => (
            <tr key={d}>
              <th className="pr-2 text-left font-medium text-nc-dark">{dl}</th>
              {times.map(([tv]) => {
                const n = cells.find((c) => c.day === d && c.time === tv)?.families ?? 0;
                const a = n / max;
                return (
                  <td key={tv} className="h-12 rounded-md text-center font-semibold tabular-nums"
                    style={{ background: n ? `hsl(var(--teal) / ${0.12 + a * 0.78})` : "hsl(var(--muted))", color: a > 0.5 ? "white" : undefined }}>
                    {n}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OverTime({ points }: { points: { month: string; families: number }[] }) {
  if (!points.length) return <div className="py-8 text-center text-[12.5px] text-nc-muted">No families yet.</div>;
  const max = Math.max(1, ...points.map((p) => p.families));
  return (
    <div className="flex h-44 items-end gap-1.5">
      {points.map((p) => (
        <div key={p.month} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${p.families} in ${p.month}`}>
          <span className="text-[11px] tabular-nums text-nc-dark">{p.families}</span>
          <div className="w-full max-w-[36px] rounded-t bg-plum" style={{ height: `${(p.families / max) * 120}px` }} />
          <span className="text-[10.5px] text-nc-muted">{new Date(`${p.month}-01T00:00:00`).toLocaleDateString("en-GB", { month: "short" })}</span>
        </div>
      ))}
    </div>
  );
}

function Neighbourhoods({ rows }: { rows: any[] }) {
  if (!rows.length) return <div className="py-6 text-center text-[12.5px] text-nc-muted">No families match.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-nc-muted">
            <th className="py-2 pr-3 font-medium">Neighbourhood</th>
            <th className="py-2 pr-3 text-right font-medium">Waiting families</th>
            <th className="py-2 pr-3 text-right font-medium">Their children</th>
            <th className="py-2 pr-3 text-right font-medium">Enrolled</th>
            <th className="py-2 pr-3 text-right font-medium">Active circles</th>
            <th className="py-2 pr-3 text-right font-medium">Free seats</th>
            <th className="py-2 font-medium">Outlook</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const short = r.waitingChildren - r.seatsFree;
            return (
              <tr key={r.name} className="border-b border-border/60 last:border-0">
                <td className="py-2 pr-3"><div className="font-medium text-nc-dark">{r.name}</div>{r.city && <div className="text-[11.5px] text-nc-muted">{r.city}</div>}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{r.waiting}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{r.waitingChildren}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{r.enrolled}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{r.circles}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{r.seatsFree}</td>
                <td className="py-2 text-[12px]">
                  {r.waitingChildren === 0 ? <span className="text-nc-muted">No one waiting</span>
                    : r.circles === 0 ? <span className="font-medium text-nc-red">No circle yet: a new one is needed</span>
                    : short > 0 ? <span className="font-medium text-gold-dim">{short} more seat{short === 1 ? "" : "s"} needed</span>
                    : <span className="text-nc-green">Enough seats</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Families table ──────────────────────────────────────────────────────────

function FamilyTable({ rows, selected, setSelected, onEdit }: {
  rows: Row[]; selected: Set<string>; setSelected: (s: Set<string>) => void; onEdit: (r: Row) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  if (!rows.length) return <div className="py-10 text-center text-[13px] text-nc-muted">No families match these filters.</div>;
  const all = rows.every((r) => selected.has(r.id));
  const flip = (id: string) => { const s = new Set(selected); if (s.has(id)) s.delete(id); else s.add(id); setSelected(s); };
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[760px] text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-nc-muted">
            <th className="w-8 py-2"><input type="checkbox" aria-label="Select all" checked={all} className="accent-[hsl(var(--teal))]"
              onChange={() => setSelected(all ? new Set() : new Set(rows.map((r) => r.id)))} /></th>
            <th className="py-2 pr-3 font-medium">Family</th>
            <th className="py-2 pr-3 font-medium">Area</th>
            <th className="py-2 pr-3 font-medium">Status</th>
            <th className="py-2 pr-3 font-medium">Child lives with</th>
            <th className="py-2 pr-3 font-medium">Mother / father works</th>
            <th className="py-2 pr-3 font-medium">Suits them</th>
            <th className="py-2 font-medium"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const p = r.profile;
            const isOpen = open === r.id;
            return (
              <Fragment key={r.id}>
                <tr className={cn("border-b border-border/60 align-top", isOpen && "bg-muted/30")}>
                  <td className="py-2.5"><input type="checkbox" aria-label={`Select ${r.name}`} checked={selected.has(r.id)} onChange={() => flip(r.id)} className="accent-[hsl(var(--teal))]" /></td>
                  <td className="py-2.5 pr-3">
                    <button className="text-left font-medium text-nc-dark hover:text-plum" onClick={() => setOpen(isOpen ? null : r.id)} aria-expanded={isOpen}>{r.name}</button>
                    <div className="text-[11.5px] text-nc-muted">{r.phone}{r.email ? ` · ${r.email}` : ""}</div>
                  </td>
                  <td className="py-2.5 pr-3"><div>{r.neighbourhood || "–"}</div><div className="text-[11.5px] text-nc-muted">{r.city}</div></td>
                  <td className="py-2.5 pr-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-medium", STATUS_TONE[r.status])}>{label("status", r.status)}</span>
                    <div className="mt-1 text-[11px] text-nc-muted">since {formatDate(r.createdAt)}</div>
                  </td>
                  <td className="py-2.5 pr-3">{p ? label("livesWith", p.livesWith) || "–" : <span className="text-[12px] text-nc-muted">Not answered</span>}</td>
                  <td className="py-2.5 pr-3 text-[12.5px]">
                    {p ? <>{label("work", workOf(p, "mother")) || "–"} / {label("work", workOf(p, "father")) || "–"}</> : ""}
                  </td>
                  <td className="py-2.5 pr-3 text-[12.5px]">
                    {[...(p?.days ?? []).map((d) => label("days", d)), ...(p?.times ?? []).map((x) => label("times", x).replace(/ \(.*\)/, ""))].join(", ")}
                  </td>
                  <td className="py-2.5 text-right">
                    <button className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[12px] text-nc-dark hover:border-plum hover:text-plum" onClick={() => onEdit(r)}>
                      <Pencil className="h-3 w-3" /> {p ? "Edit" : "Add answers"}
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-b border-border/60 bg-muted/30">
                    <td />
                    <td colSpan={7} className="pb-4 pr-3">
                      {p ? (
                        <>
                          <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-[12.5px] sm:grid-cols-2 lg:grid-cols-3">
                            {summarise(p).map(([k, v]) => (
                              <div key={k}><dt className="text-[10.5px] uppercase tracking-wide text-nc-muted">{k}</dt><dd className="text-nc-dark">{v}</dd></div>
                            ))}
                          </dl>
                          <div className="mt-2 text-[11px] text-nc-muted">
                            Answered {p.source === "website" ? "on the website" : p.source === "family-page" ? "on their family page" : "with the team"}
                            {p.updatedAt ? `, ${formatDate(p.updatedAt)}` : ""}.
                          </div>
                        </>
                      ) : (
                        <div className="text-[12.5px] text-nc-muted">This family hasn’t answered the questions yet. Use “Add answers” if they told you over the phone.</div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Email the chosen families ──────────────────────────────────────────────

function EmailFamilies({ families, onClose }: { families: Row[]; onClose: () => void }) {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reach, setReach] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const audience = useMemo(() => ({ type: "families", families: families.slice(0, 2000).map((f) => f.id) }), [families]);

  useEffect(() => {
    emailService.audience(audience).then((r) => setReach(unwrap(r))).catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not count recipients.") }));
  }, [audience, toast]);

  async function send(testOnly: boolean) {
    if (!testOnly && !window.confirm(`Send this email to ${reach?.count ?? families.length} ${reach?.count === 1 ? "family" : "families"} now?`)) return;
    setBusy(true);
    try {
      const r = await emailService.send({ subject, body, audience, testOnly });
      toast({ title: apiMessage(r, "Sent.") });
      if (!testOnly) onClose();
    } catch (err) { toast({ variant: "destructive", title: apiError(err, "Could not send.") }); }
    finally { setBusy(false); }
  }

  return (
    <Modal open onClose={onClose} title="Email these families" subtitle="Sent from support@noorcircles.com. Replies come to the support inbox; you’ll find it under Emails › Sent.">
      <div className="mb-4 rounded-md border border-border px-3 py-2.5 text-[12.5px]">
        {!reach ? "Counting…" : (
          <>
            <span className="font-semibold text-nc-dark">{reach.count} {reach.count === 1 ? "family" : "families"}</span> will get it
            {reach.withoutEmail > 0 && <span className="text-nc-muted"> · {reach.withoutEmail} have no email on file</span>}
            {reach.optedOut > 0 && <span className="text-nc-muted"> · {reach.optedOut} unsubscribed</span>}
          </>
        )}
      </div>
      <label htmlFor="ef-subject" className="mb-1.5 block text-[13px] font-medium text-slate">Subject</label>
      <input id="ef-subject" dir="auto" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="e.g. A Saturday morning circle near you"
        className="mb-3 h-10 w-full rounded-md border border-input bg-card px-3 text-[14px] focus:border-primary focus:outline-none" />
      <label htmlFor="ef-body" className="mb-1.5 block text-[13px] font-medium text-slate">Message</label>
      <textarea id="ef-body" dir="auto" value={body} onChange={(e) => setBody(e.target.value)} rows={8} maxLength={20000}
        placeholder={"Assalam-o-Alaikum {name},\n\nWrite your message here."}
        className="w-full resize-y rounded-md border border-input bg-card px-3 py-2.5 text-[14px] leading-relaxed focus:border-primary focus:outline-none" />
      <p className="mt-1.5 text-[11.5px] text-nc-muted"><code className="rounded bg-muted px-1">{"{name}"}</code> becomes each parent’s first name.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button className="btn-outline" disabled={!subject.trim() || !body.trim() || busy} onClick={() => send(true)}><Mail className="h-4 w-4" /> Send a test to me</button>
        <button className="btn-primary ml-auto" disabled={!subject.trim() || !body.trim() || busy || !reach?.count} onClick={() => send(false)}>
          <Send className="h-4 w-4" /> {busy ? "Sending…" : `Send${reach ? ` to ${reach.count}` : ""}`}
        </button>
      </div>
    </Modal>
  );
}
