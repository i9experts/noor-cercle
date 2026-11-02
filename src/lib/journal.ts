// The Noor Journal: the writing activities of the Asaas murabbi training.
// Pages open once their lesson has been heard. What a murabbi writes is
// private to them; admins see only counts (and the final reflection, which
// the team reviews through the course's reflection flow).

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

export const journalService = {
  get          : ()                                         => API.get("/journal"),
  save         : (key: string, answers: Record<string, string>) => API.put(`/journal/pages/${key}`, { answers }),
  addMoment    : (data: { text: string; date?: string; circleId?: string }) => API.post("/journal/moments", data),
  deleteMoment : (id: string)                               => API.delete(`/journal/moments/${id}`),
  adminProgress: ()                                         => API.get("/journal/admin/progress"),
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
  const foot = `<div class="foot">Noor Circles · A circle of light in every neighbourhood · Private</div>`;

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
