// The Noor Journal: the writing activities of the Asaas murabbi training.
// Pages open once their lesson has been heard. What a murabbi writes is
// shared with the Noor Circles team (admins), who can read every page and
// moment to support them; supervisors and other murabbis cannot.

import { API } from "@/lib/api";

export const MOMENTS_LESSON = "M6-02";
export const JOURNAL_POINTS = 10;
/** The view key for "Moments of light" (alongside page keys). */
export const MOMENTS_VIEW = "moments";

export interface JournalOption { value: string; ur: string; en: string }
export interface JournalField {
  key: string;
  labelUr: string;
  labelEn: string;
  kind: "text" | "textarea" | "choice";
  options?: JournalOption[];
}

export interface JournalReflection {
  text: string;
  status: "submitted" | "approved" | "revision";
  feedback?: string | null;
  submittedAt?: string | null;
}

export interface JournalPage {
  key: string;
  number: number;
  lessonCode: string;
  titleEn: string;
  titleUr: string;
  introUr: string;
  introEn: string;
  hintUr?: string;
  hintEn?: string;
  kind: "fields" | "reflection";
  fields: JournalField[];
  lesson: { _id: string; code: string; title: string } | null;
  open: boolean;
  done: boolean;
  updatedAt: string | null;
  answers?: Record<string, string>;
  prompt?: string;
  minChars?: number;
  reflection?: JournalReflection | null;
}

export interface JournalMoment {
  _id: string;
  date: string;
  text: string;
  circle: { _id: string; name: string } | null;
  createdAt: string;
  /** The murabbi agreed their name may be shown if the team features it. */
  shareName?: boolean;
  featured?: boolean;
}

export interface JournalData {
  owner: string;
  assigned: boolean;
  pages: JournalPage[];
  progress: { done: number; total: number };
  moments: { open: boolean; lesson: { _id: string; title: string } | null; list: JournalMoment[] };
}

export interface JournalAdminRow {
  user: { _id: string; fullName: string; email: string };
  pagesDone: number;
  totalPages: number;
  moments: number;
  lastWrittenAt: string | null;
}

// ── Admin insights ──────────────────────────────────────────────────────────

export type JournalStatus = "complete" | "on-track" | "behind" | "not-started" | "not-open";

export interface JournalInsightsSummary {
  murabbis: number;
  writing: number;
  notStarted: number;
  behind: number;
  complete: number;
  pagesDone: number;
  totalPages: number;
  avgPages: number;
  moments: number;
  momentsThisMonth: number;
  featured: number;
}

export interface JournalPageStat {
  key: string;
  number: number;
  titleEn: string;
  titleUr: string;
  lessonCode: string;
  open: number;
  started: number;
  done: number;
  waiting: number;
}

export interface JournalMurabbiRow {
  user: { _id: string; fullName: string; email: string };
  circles: string[];
  clusters: string[];
  pagesDone: number;
  pagesOpen: number;
  waiting: number;
  totalPages: number;
  nextPage: string | null;
  pages: { key: string; open: boolean; done: boolean; started: boolean }[];
  moments: number;
  momentsThisMonth: number;
  reflection: JournalReflection["status"] | null;
  lastWrittenAt: string | null;
  lastReminderAt: string | null;
  reminders: number;
  status: JournalStatus;
}

export interface JournalInsights {
  /** Null when the Asaas course doesn't exist yet. */
  summary: JournalInsightsSummary | null;
  pages: JournalPageStat[];
  murabbis: JournalMurabbiRow[];
  months: { month: string; moments: number; clusters: Record<string, number> }[];
  clusters: string[];
}

/** One murabbi's journal as an admin reads it. */
export interface JournalAdminData extends JournalData {
  user: { _id: string; fullName: string; email: string };
}

export interface JournalAdminMoment {
  _id: string;
  date: string;
  text: string;
  featured: boolean;
  featuredAt: string | null;
  shareName: boolean;
  murabbi: { _id: string; fullName: string } | null;
  circle: string | null;
  cluster: string | null;
  /** What a newsletter may print: the name only with the murabbi's consent. */
  byline: string;
}

export const JOURNAL_STATUS_META: Record<JournalStatus, { label: string; cls: string }> = {
  "complete"   : { label: "Complete",    cls: "bg-nc-green-lt text-nc-green" },
  "on-track"   : { label: "On track",    cls: "bg-teal-lt text-teal" },
  "behind"     : { label: "Behind",      cls: "bg-nc-amber-lt text-nc-amber" },
  "not-started": { label: "Not started", cls: "bg-nc-red-lt text-nc-red" },
  "not-open"   : { label: "Not open yet", cls: "bg-muted text-nc-muted" },
};

export const journalService = {
  get          : ()                                         => API.get("/journal"),
  save         : (key: string, answers: Record<string, string>) => API.put(`/journal/pages/${key}`, { answers }),
  addMoment    : (data: { text: string; date?: string; circleId?: string; shareName?: boolean }) => API.post("/journal/moments", data),
  updateMoment : (id: string, data: { shareName: boolean }) => API.patch(`/journal/moments/${id}`, data),
  deleteMoment : (id: string)                               => API.delete(`/journal/moments/${id}`),
  adminProgress: ()                                         => API.get("/journal/admin/progress"),
  insights     : ()                                         => API.get("/journal/admin/insights"),
  murabbi      : (id: string)                               => API.get(`/journal/admin/murabbis/${id}`),
  remind       : (data: { userIds: string[]; note?: string }) => API.post("/journal/admin/remind", data),
  moments      : (featured = false)                         => API.get("/journal/admin/moments", { params: featured ? { featured: true } : undefined }),
  feature      : (id: string, featured: boolean)            => API.patch(`/journal/admin/moments/${id}`, { featured }),
};

/** Today in Pakistan time, as YYYY-MM-DD (matches the backend). */
export const pkToday = () => new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);

export const momentDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

// ── Printable booklet ───────────────────────────────────────────────────────

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const para = (s: string) => esc(s.trim()).replace(/\n/g, "<br>");
const lines = (n: number) => `<div class="lines">${'<div class="ln"></div>'.repeat(n)}</div>`;
const answer = (s: string | undefined, blank = 4) =>
  s && s.trim() ? `<div class="ans" dir="auto">${para(s)}</div>` : lines(blank);

function fieldHtml(f: JournalField, value?: string) {
  const label = `<div class="lbl"><div class="u">${esc(f.labelUr)}</div><div class="en">${esc(f.labelEn)}</div></div>`;
  if (f.kind === "choice") {
    const opts = (f.options ?? []).map((o) =>
      `<li class="${o.value === value ? "on" : ""}"><span class="box">${o.value === value ? "✔" : ""}</span><span class="u">${esc(o.ur)}</span> <span class="en">${esc(o.en)}</span></li>`).join("");
    return `<div class="field">${label}<ul class="opts">${opts}</ul></div>`;
  }
  return `<div class="field">${label}${answer(value, f.kind === "text" ? 1 : 4)}</div>`;
}

/** Opens a Noor Circles branded A5 booklet of the journal with the print dialog. */
export function printJournal(data: JournalData) {
  const w = window.open("", "_blank", "width=720,height=1000");
  if (!w) return;
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const foot = `<div class="foot">Noor Circles · A circle of light in every neighbourhood</div>`;

  const pages = data.pages.map((p) => {
    const head = `<div class="ph"><div class="num">${p.number}</div><div><div class="t">${esc(p.titleEn)}</div><div class="u tu">${esc(p.titleUr)}</div></div></div>`;
    const intro = `<div class="intro"><div class="u">${esc(p.introUr)}</div><div class="en">${esc(p.introEn)}</div></div>`;
    let body: string;
    if (p.kind === "reflection") {
      const prompt = p.prompt?.trim() ? `<div class="prompt" dir="auto">${para(p.prompt)}</div>` : "";
      body = `${prompt}${answer(p.reflection?.text, 14)}`;
    } else {
      body = p.fields.map((f) => fieldHtml(f, p.answers?.[f.key])).join("");
    }
    return `<section class="sheet">${head}${intro}${body}${foot}</section>`;
  }).join("");

  const moments = data.moments.list.length
    ? data.moments.list.map((m) => `<div class="moment"><div class="md">${esc(momentDate(m.date))}${m.circle ? ` · ${esc(m.circle.name)}` : ""}</div><div class="ans" dir="auto">${para(m.text)}</div></div>`).join("")
    : lines(16);

  w.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Noor Journal · ${esc(data.owner)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap">
<style>
@page { size: A5 portrait; margin: 0 }
* { box-sizing: border-box }
body { margin: 0; font-family: Georgia, serif; color: #361a2c; font-size: 11px; background: #eee; -webkit-print-color-adjust: exact; print-color-adjust: exact }
.sheet { width: 148mm; min-height: 210mm; margin: 0 auto; padding: 11mm 11mm 8mm; background: #fffdf8; display: flex; flex-direction: column; page-break-after: always; break-after: page; border-left: 3px solid #691c46 }
.sheet:last-child { page-break-after: auto; break-after: auto }
@media screen { .sheet { margin: 6mm auto; box-shadow: 0 1px 6px rgba(0,0,0,.15) } }
.u { font-family: "Noto Nastaliq Urdu", serif; direction: rtl; text-align: right; unicode-bidi: isolate; line-height: 2.1 }
.en { color: #74646d; font-size: .95em }
.cover { justify-content: center; align-items: center; text-align: center; border: none; outline: 2px solid #691c46; outline-offset: -7mm }
.cover .inner { border: 1px solid #c79446; padding: 14mm 8mm; margin: auto 6mm 0; width: calc(100% - 12mm) }
.brand { letter-spacing: .2em; font-size: 10px; color: #c79446; font-weight: bold }
.bism { font-family: "Noto Nastaliq Urdu", serif; font-size: 17px; color: #691c46; direction: rtl; line-height: 2.4; margin: 6mm 0 2mm }
.ttl { font-size: 26px; color: #691c46; margin-top: 4mm }
.ttlu { font-family: "Noto Nastaliq Urdu", serif; font-size: 22px; color: #691c46; line-height: 2.4 }
.rule { width: 30mm; height: 1px; background: #c79446; margin: 5mm auto }
.owner { font-size: 16px; color: #361a2c }
.small { font-size: 10px; color: #74646d; margin-top: 2mm }
.ph { display: flex; gap: 3mm; align-items: center; border-bottom: 1.5px solid #c79446; padding-bottom: 2mm; margin-bottom: 3mm }
.num { flex: 0 0 auto; width: 9mm; height: 9mm; border-radius: 50%; background: #691c46; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold }
.ph > div:last-child { flex: 1 }
.t { font-size: 15px; color: #691c46; font-weight: bold }
.tu { color: #691c46; font-size: 13px; line-height: 1.9 }
.intro { background: #f7efe9; border-radius: 3px; padding: 2mm 3mm; margin-bottom: 3mm }
.intro .u { font-size: 11.5px }
.prompt { background: #fbf4e6; border: 1px solid #ecd9b6; border-radius: 3px; padding: 2mm 3mm; margin-bottom: 3mm }
.field { margin-bottom: 3.5mm; break-inside: avoid }
.lbl .u { font-size: 11px; color: #361a2c }
.lbl .en { font-weight: bold; font-size: 10.5px; color: #361a2c }
.ans { border-left: 2px solid #c79446; padding: 1mm 0 1mm 3mm; margin-top: 1mm; line-height: 1.7; white-space: normal }
.lines .ln { border-bottom: 1px solid #d9c9b0; height: 7.5mm }
.opts { list-style: none; margin: 1mm 0 0; padding: 0 }
.opts li { display: flex; align-items: baseline; gap: 2mm; padding: .5mm 0 }
.opts .u { text-align: left; flex: 0 1 auto; font-size: 10.5px }
.opts li.on { color: #691c46; font-weight: bold }
.box { flex: 0 0 auto; width: 3.5mm; height: 3.5mm; border: 1px solid #691c46; display: inline-flex; align-items: center; justify-content: center; font-size: 8px }
.moment { margin-bottom: 3mm; break-inside: avoid }
.md { font-size: 10px; color: #c79446; font-weight: bold; letter-spacing: .04em }
.foot { margin-top: auto; padding-top: 3mm; border-top: 1px solid #c79446; text-align: center; font-size: 9px; color: #74646d }
</style></head><body>
<section class="sheet cover"><div class="inner">
<div class="brand">NOOR CIRCLES</div>
<div class="bism">بسم اللہ الرحمٰن الرحیم</div>
<div class="ttl">Noor Journal</div>
<div class="ttlu">نور جرنل</div>
<div class="rule"></div>
<div class="owner">${esc(data.owner)}</div>
<div class="small">Asaas Murabbi Training · ${esc(today)}</div>
<div class="small">${data.progress.done} of ${data.progress.total} pages written</div>
</div>${foot}</section>
${pages}
<section class="sheet"><div class="ph"><div class="num">✦</div><div><div class="t">Moments of light</div><div class="u tu">روشن لمحے</div></div></div>
<div class="intro"><div class="en">Small moments from your circles worth remembering: a question, a smile, a change.</div></div>
${moments}${foot}</section>
<script>document.fonts.ready.then(() => setTimeout(() => window.print(), 300));</script></body></html>`);
  w.document.close();
}

// ── Admin report ────────────────────────────────────────────────────────────

const REFLECTION_LABEL: Record<string, string> = { submitted: "To review", approved: "Approved", revision: "Revising" };
const shortDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
export const monthName = (m: string) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString("en-GB", { month: "short", year: "numeric" });

/** Opens a Noor Circles branded A4 report of the journal insights with the print dialog. */
export function printJournalReport(data: JournalInsights, featured: JournalAdminMoment[] = []) {
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const s = data.summary;
  const n = s?.murabbis ?? 0;
  const pct = (x: number) => (n ? Math.round((x / n) * 100) : 0);

  const cards = s ? [
    ["Murabbis", s.murabbis, "given the training"],
    ["Writing", s.writing, "at least one page"],
    ["Average", s.avgPages, `pages of ${s.totalPages}`],
    ["Complete", s.complete, "all pages"],
    ["Behind", s.behind, "2+ pages waiting"],
    ["Not started", s.notStarted, "pages open, none written"],
    ["Moments", s.momentsThisMonth, `this month · ${s.moments} in all`],
    ["Featured", s.featured, "moments of light"],
  ].map(([l, v, m]) => `<div class="card"><div class="cl">${esc(String(l))}</div><div class="cv">${esc(String(v))}</div><div class="cm">${esc(String(m))}</div></div>`).join("") : "";

  const pages = data.pages.map((p) => {
    const notOpen = Math.max(0, n - p.open);
    return `<tr><td class="c">${p.number}</td><td><div>${esc(p.titleEn)}</div><div class="u">${esc(p.titleUr)}</div></td>
<td><div class="bar"><span class="d" style="width:${pct(p.done)}%"></span><span class="w" style="width:${pct(p.waiting)}%"></span></div></td>
<td class="c">${p.done}</td><td class="c">${p.waiting}</td><td class="c">${notOpen}</td></tr>`;
  }).join("");

  const rows = data.murabbis.map((r) => `<tr><td><b>${esc(r.user.fullName)}</b><div class="sm">${esc(r.user.email ?? "")}</div></td>
<td>${esc(r.clusters.join(", ") || "—")}</td><td class="c">${r.pagesDone}/${r.totalPages}</td><td class="c">${r.waiting}</td>
<td class="c">${r.moments}${r.momentsThisMonth ? ` <span class="sm">(${r.momentsThisMonth})</span>` : ""}</td>
<td>${esc(r.reflection ? REFLECTION_LABEL[r.reflection] ?? r.reflection : "—")}</td><td>${esc(shortDate(r.lastWrittenAt))}</td>
<td><span class="chip ${r.status}">${esc(JOURNAL_STATUS_META[r.status]?.label ?? r.status)}</span></td></tr>`).join("");

  const maxMonth = Math.max(1, ...data.months.map((m) => m.moments));
  const months = data.months.map((m) => {
    const cl = Object.entries(m.clusters).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${esc(k)} ${v}`).join(" · ");
    return `<tr><td style="width:22mm">${esc(monthName(m.month))}</td><td><div class="bar"><span class="d" style="width:${Math.round((m.moments / maxMonth) * 100)}%"></span></div></td>
<td class="c" style="width:12mm">${m.moments}</td><td class="sm">${cl || "—"}</td></tr>`;
  }).join("");

  const feats = featured.length
    ? featured.map((m) => `<div class="moment"><div class="md">${esc(momentDate(m.date))}</div><div class="mt" dir="auto">${para(m.text)}</div><div class="by">— ${esc(m.byline)}</div></div>`).join("")
    : `<p class="sm">No moments featured yet.</p>`;

  w.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Noor Journal report · ${esc(today)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap">
<style>
@page { size: A4 portrait; margin: 12mm }
* { box-sizing: border-box }
html, body { background: #fffdf8 }
body { margin: 0; font-family: Georgia, serif; color: #361a2c; font-size: 11px; -webkit-print-color-adjust: exact; print-color-adjust: exact }
@media screen { body { max-width: 210mm; margin: 0 auto; padding: 12mm } }
.u { font-family: "Noto Nastaliq Urdu", serif; direction: rtl; text-align: right; unicode-bidi: isolate; line-height: 1.9; color: #74646d; font-size: .95em }
.top { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #691c46; padding-bottom: 2.5mm; margin-bottom: 1mm }
.top2 { border-top: 1px solid #c79446; margin-bottom: 5mm }
.brand { font-size: 11px; letter-spacing: .2em; color: #c79446; font-weight: bold }
.ttl { font-size: 24px; color: #691c46 }
.ttlu { font-family: "Noto Nastaliq Urdu", serif; font-size: 16px; color: #691c46; line-height: 2 }
.date { text-align: right; color: #74646d; font-size: 11px }
h2 { margin: 6mm 0 2mm; padding: .8mm 2.5mm; background: #691c46; color: #fff; font-size: 12.5px; border-radius: 3px; font-weight: normal; break-after: avoid }
.cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2.5mm }
.card { border: 1px solid #e3d3c0; border-left: 3px solid #c79446; border-radius: 3px; padding: 2mm 3mm; background: #fff }
.cl { font-size: 9.5px; text-transform: uppercase; letter-spacing: .06em; color: #74646d }
.cv { font-size: 20px; color: #691c46; line-height: 1.2 }
.cm { font-size: 9.5px; color: #74646d }
table { width: 100%; border-collapse: collapse }
th, td { border-bottom: 1px solid #e6dad0; padding: 1.4mm 1.8mm; vertical-align: middle; text-align: left }
thead th { background: #f7efe9; font-size: 9.5px; text-transform: uppercase; letter-spacing: .04em; color: #74646d; font-weight: normal }
thead { display: table-header-group }
tr { break-inside: avoid }
td.c, th.c { text-align: center }
.sm { font-size: 9.5px; color: #74646d }
.bar { display: flex; height: 3.2mm; background: #efe6dd; border-radius: 2mm; overflow: hidden; min-width: 30mm }
.bar .d { background: #691c46 } .bar .w { background: #c79446 }
.legend { font-size: 9.5px; color: #74646d; margin-top: 1.5mm }
.legend i { display: inline-block; width: 3mm; height: 3mm; border-radius: 1mm; vertical-align: -.4mm; margin: 0 1mm 0 3mm }
.chip { display: inline-block; border-radius: 3mm; padding: .3mm 2mm; font-size: 9.5px; white-space: nowrap; background: #eee; color: #555 }
.chip.complete { background: #e3f2e6; color: #2f7a43 } .chip.on-track { background: #f3e6ee; color: #691c46 }
.chip.behind { background: #fbf0dc; color: #9a6512 } .chip.not-started { background: #f8e3e3; color: #a33 }
.moment { border-left: 2px solid #c79446; padding: 1mm 0 1mm 3mm; margin-bottom: 3mm; break-inside: avoid }
.md { font-size: 9.5px; color: #c79446; font-weight: bold; letter-spacing: .04em }
.mt { line-height: 1.7 }
.by { font-style: italic; color: #691c46; margin-top: .5mm }
.foot { margin-top: 8mm; border-top: 1px solid #c79446; padding-top: 1.5mm; display: flex; justify-content: space-between; gap: 4mm; font-size: 9px; color: #74646d; break-inside: avoid }
</style></head><body>
<div class="top"><div><div class="brand">NOOR CIRCLES</div><div class="ttl">Noor Journal report</div><div class="ttlu">نور جرنل رپورٹ</div></div>
<div class="date">Asaas Murabbi Training<br>${esc(today)}</div></div><div class="top2"></div>
${s ? `<div class="cards">${cards}</div>` : `<p class="sm">The Asaas training hasn’t been set up yet.</p>`}
<h2>Where murabbis stop · page by page</h2>
<table><thead><tr><th class="c">#</th><th>Page</th><th>Completion</th><th class="c">Done</th><th class="c">Waiting</th><th class="c">Not open</th></tr></thead><tbody>${pages}</tbody></table>
<div class="legend">Out of ${n} murabbi${n === 1 ? "" : "s"}: <i style="background:#691c46"></i>written <i style="background:#c79446"></i>open, waiting <i style="background:#efe6dd"></i>not open yet</div>
<h2>Murabbis</h2>
<table><thead><tr><th>Murabbi</th><th>Clusters</th><th class="c">Pages</th><th class="c">Waiting</th><th class="c">Moments</th><th>Reflection</th><th>Last written</th><th>Status</th></tr></thead>
<tbody>${rows || `<tr><td colspan="8" class="sm">No murabbis have been given the training yet.</td></tr>`}</tbody></table>
<h2>Moments of light · last six months</h2>
<table><tbody>${months}</tbody></table>
<h2>Featured moments</h2>
${feats}
<div class="foot"><span>Noor Circles · A circle of light in every neighbourhood</span><span>Noor Journal report · ${esc(today)} · Confidential: admins only</span></div>
<script>document.fonts.ready.then(() => setTimeout(() => window.print(), 300));</script></body></html>`);
  w.document.close();
}
