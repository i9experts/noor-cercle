// The murabbi introduction ("Your Introduction" sheet): labels, types and the printable page.
// Admin-only data (plus the murabbi's own view): never shown to supervisors or other murabbis.

export type Bi = { en: string; ur: string };

export const LEVELS = ["basic", "good", "very-good", "expert"] as const;
export const QURAN = ["hafiz", "nazira", "learning", "other"] as const;
export const LANGUAGES = ["urdu", "english", "arabic", "punjabi", "sindhi", "pashto", "balochi", "saraiki", "other"] as const;
export const SOFT_SKILLS = ["punctuality", "decisionMaking", "leadership", "creativity", "teamwork"] as const;
export const HARD_SKILLS = ["strategy", "computer", "graphicDesign", "typing", "administration", "writing"] as const;
export const SKILLS = [...SOFT_SKILLS, ...HARD_SKILLS] as const;

export type Level = (typeof LEVELS)[number];
export type SkillKey = (typeof SKILLS)[number];

export interface Experience { organisation: string; duration: string; responsibilities: string }
export interface SkillAnswer { level: Level | null; note: string }

export interface Introduction {
  fullName: string; fatherName: string; dateOfBirth: string; placeOfBirth: string; address: string; whatsapp: string; email: string;
  purpose: string; approach: string; currentWork: string; socialImpact: string;
  quran: string | null; quranNote: string; school: string; college: string; courses: string; specialisation: string;
  experience: Experience[];
  languages: string[]; languagesNote: string;
  skills: Partial<Record<SkillKey, SkillAnswer>>;
  islahi: string; tabligh: string; political: string;
  strengths: string[]; weaknesses: string[];
}

export interface IntroductionResponse {
  murabbi: { _id: string; fullName: string; email: string; tier: number };
  profile: Partial<Introduction> | null;
  saved: boolean;
  completeness: number;
  updatedAt: string | null;
  updatedBy: { fullName: string; role: string } | null;
  message?: string;
}

export const SECTIONS = {
  personal:   { en: "Personal information", ur: "ذاتی شخصی معلومات" },
  vision:     { en: "Your personal vision", ur: "مقصدِ زندگی" },
  education:  { en: "Educational background", ur: "تعلیمی کوائف" },
  experience: { en: "Professional experience", ur: "پیشہ وارانہ کوائف" },
  soft:       { en: "Soft skills", ur: "شخصی مہارتیں" },
  hard:       { en: "Hard skills", ur: "پیشہ وارانہ صلاحیتیں" },
  religious:  { en: "Religious affiliation", ur: "دینی وابستگی" },
  self:       { en: "Self-analysis", ur: "شخصی تجزیہ" },
} satisfies Record<string, Bi>;

export const FIELDS = {
  fullName:         { en: "Name", ur: "نام" },
  fatherName:       { en: "Father's name", ur: "والدیت" },
  dateOfBirth:      { en: "Date of birth", ur: "تاریخ پیدائش" },
  placeOfBirth:     { en: "Place of birth", ur: "مقام پیدائش" },
  address:          { en: "Current address", ur: "موجودہ ایڈریس" },
  whatsapp:         { en: "WhatsApp number", ur: "واٹس ایپ نمبر" },
  email:            { en: "Email", ur: "ای میل ایڈریس" },
  purpose:          { en: "Purpose", ur: "مقصد" },
  approach:         { en: "Approach", ur: "طریقہ کار" },
  currentWork:      { en: "Current activities", ur: "موجودہ مصروفیات کی کارگزاری" },
  socialImpact:     { en: "Social impact", ur: "معاشرتی اثرات" },
  quran:            { en: "Qur'an (Hifz / Nazira)", ur: "حفظ قرآن / ناظرہ" },
  school:           { en: "School / Madrasa", ur: "اسکولنگ / مدرسہ" },
  college:          { en: "College / University", ur: "کالج / یونیورسٹی" },
  courses:          { en: "Short courses / workshops", ur: "شارٹ کورسز / ورکشاپس" },
  specialisation:   { en: "Specialisation", ur: "تخصصات" },
  organisation:     { en: "Organisation", ur: "ادارہ" },
  duration:         { en: "Duration", ur: "دورانیہ" },
  responsibilities: { en: "Responsibilities", ur: "ذمہ داریاں" },
  languages:        { en: "Languages", ur: "زبانیں" },
  islahi:           { en: "Reform / spiritual link", ur: "اصلاحی تعلق" },
  tabligh:          { en: "Tabligh & da'wah", ur: "تبلیغی و دعوت" },
  political:        { en: "Political affiliation", ur: "سیاسی تعلق" },
  strengths:        { en: "Strengths", ur: "خوبیاں" },
  weaknesses:       { en: "Weaknesses", ur: "خامیاں" },
} satisfies Record<string, Bi>;

export const QURAN_LABELS: Record<string, Bi> = {
  hafiz:    { en: "Hafiz", ur: "حافظ" },
  nazira:   { en: "Nazira complete", ur: "ناظرہ مکمل" },
  learning: { en: "Learning", ur: "سیکھ رہے ہیں" },
  other:    { en: "Other", ur: "دیگر" },
};

export const LANGUAGE_LABELS: Record<string, Bi> = {
  urdu:    { en: "Urdu", ur: "اردو" },
  english: { en: "English", ur: "انگریزی" },
  arabic:  { en: "Arabic", ur: "عربی" },
  punjabi: { en: "Punjabi", ur: "پنجابی" },
  sindhi:  { en: "Sindhi", ur: "سندھی" },
  pashto:  { en: "Pashto", ur: "پشتو" },
  balochi: { en: "Balochi", ur: "بلوچی" },
  saraiki: { en: "Saraiki", ur: "سرائیکی" },
  other:   { en: "Other", ur: "دیگر" },
};

export const SKILL_LABELS: Record<SkillKey, Bi> = {
  punctuality:    { en: "Punctuality", ur: "وقت کی پابندی" },
  decisionMaking: { en: "Decision-making", ur: "فیصلہ سازی" },
  leadership:     { en: "Leadership", ur: "رہبر / رہنما / امیر / ذمہ دار" },
  creativity:     { en: "Creativity", ur: "تخلیقی صلاحیت" },
  teamwork:       { en: "Teamwork", ur: "ٹیم ورک" },
  strategy:       { en: "Strategic thinking", ur: "حکمت عملی کی صلاحیت" },
  computer:       { en: "Computer use", ur: "کمپیوٹر آپریٹر" },
  graphicDesign:  { en: "Graphic design", ur: "گرافکس ڈیزائننگ" },
  typing:         { en: "Urdu / English typing", ur: "اردو / انگلش ٹائپنگ" },
  administration: { en: "Administration", ur: "انتظامی و انصرام" },
  writing:        { en: "Writing", ur: "تحریر / کالم نگاری" },
};

export const LEVEL_LABELS: Record<Level, Bi> = {
  basic:       { en: "Basic", ur: "ابتدائی" },
  good:        { en: "Good", ur: "اچھی" },
  "very-good": { en: "Very good", ur: "بہت اچھی" },
  expert:      { en: "Expert", ur: "ماہر" },
};

export const STATUS_LABELS: Record<string, string> = { none: "Not started", started: "Started", complete: "Complete" };

export const EXPERIENCE_ROWS = 4;
export const LIST_ROWS = 5;
export const MAX_ROWS = 10;

const pad = <T,>(a: T[] | undefined, n: number, blank: () => T) => {
  const out = [...(a ?? [])];
  while (out.length < n) out.push(blank());
  return out;
};

/** A full form from whatever the API returned (blank rows added for typing). */
export function toForm(p: Partial<Introduction> | null | undefined): Introduction {
  const s = (v?: string | null) => v ?? "";
  return {
    fullName: s(p?.fullName), fatherName: s(p?.fatherName), dateOfBirth: s(p?.dateOfBirth), placeOfBirth: s(p?.placeOfBirth),
    address: s(p?.address), whatsapp: s(p?.whatsapp), email: s(p?.email),
    purpose: s(p?.purpose), approach: s(p?.approach), currentWork: s(p?.currentWork), socialImpact: s(p?.socialImpact),
    quran: p?.quran ?? null, quranNote: s(p?.quranNote), school: s(p?.school), college: s(p?.college), courses: s(p?.courses), specialisation: s(p?.specialisation),
    experience: pad(p?.experience?.map((e) => ({ organisation: s(e.organisation), duration: s(e.duration), responsibilities: s(e.responsibilities) })),
      EXPERIENCE_ROWS, () => ({ organisation: "", duration: "", responsibilities: "" })),
    languages: [...(p?.languages ?? [])], languagesNote: s(p?.languagesNote),
    skills: Object.fromEntries(SKILLS.map((k) => [k, { level: p?.skills?.[k]?.level ?? null, note: s(p?.skills?.[k]?.note) }])),
    islahi: s(p?.islahi), tabligh: s(p?.tabligh), political: s(p?.political),
    strengths: pad(p?.strengths, LIST_ROWS, () => ""), weaknesses: pad(p?.weaknesses, LIST_ROWS, () => ""),
  };
}

/** What the API takes: empty rows dropped, the rest trimmed by the server. */
export function toDto(f: Introduction) {
  const t = (v: string) => v.trim();
  return {
    ...f,
    experience: f.experience.filter((e) => t(e.organisation) || t(e.duration) || t(e.responsibilities)).slice(0, MAX_ROWS),
    skills: Object.fromEntries(Object.entries(f.skills).filter(([, v]) => v && (v.level || t(v.note)))),
    strengths: f.strengths.map(t).filter(Boolean).slice(0, MAX_ROWS),
    weaknesses: f.weaknesses.map(t).filter(Boolean).slice(0, MAX_ROWS),
  };
}

/** Same rule as the server: seven parts, each counted once anything in it is answered. */
export function completenessOf(p: Partial<Introduction> | null | undefined) {
  if (!p) return 0;
  const has = (a?: unknown[]) => !!a?.some((x) => (typeof x === "string" ? x.trim() : x && Object.values(x as object).some((v) => String(v ?? "").trim())));
  const parts = [
    !!(p.fatherName?.trim() && p.dateOfBirth && p.address?.trim()),
    !!(p.purpose?.trim() || p.approach?.trim() || p.currentWork?.trim()),
    !!(p.quran || p.school?.trim() || p.college?.trim()),
    has(p.experience),
    !!(p.languages?.length || SOFT_SKILLS.some((k) => p.skills?.[k]?.level)),
    HARD_SKILLS.some((k) => p.skills?.[k]?.level),
    has(p.strengths) || has(p.weaknesses),
  ];
  return Math.round((parts.filter(Boolean).length / parts.length) * 100);
}

export const biText = (b?: Bi) => (b ? `${b.en} · ${b.ur}` : "");
export const dobLabel = (d?: string) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

// ── Printable page ─────────────────────────────────────────────────────────

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const ans = (s?: string | null) => (s && s.trim() ? `<span dir="auto">${esc(s.trim()).replace(/\n/g, "<br>")}</span>` : "");
const lbl = (b: Bi) => `<span class="en">${esc(b.en)}</span> <span class="u">${esc(b.ur)}</span>`;
const head = (b: Bi, n: number) => `<h2><span>${n}. ${esc(b.en)}</span><span class="u">${esc(b.ur)}</span></h2>`;
const row = (b: Bi, v: string) => `<tr><th>${lbl(b)}</th><td>${v}</td></tr>`;

/** Opens a standalone two-page A4 introduction with the print dialog. */
export function printIntroduction(data: Partial<Introduction> | null, meta?: { name?: string; updatedAt?: string | null }) {
  const p = toForm(data);
  const name = p.fullName || meta?.name || "";
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;

  const exp = pad(p.experience.filter((e) => e.organisation || e.duration || e.responsibilities), EXPERIENCE_ROWS,
    () => ({ organisation: "", duration: "", responsibilities: "" }));
  const skillTable = (keys: readonly SkillKey[]) => `<table class="grid sk"><thead><tr><th></th>${LEVELS.map((l) => `<th>${lbl(LEVEL_LABELS[l])}</th>`).join("")}<th>${lbl({ en: "Note", ur: "نوٹ" })}</th></tr></thead><tbody>
${keys.map((k) => `<tr><th>${lbl(SKILL_LABELS[k])}</th>${LEVELS.map((l) => `<td class="c">${p.skills[k]?.level === l ? "✔" : ""}</td>`).join("")}<td>${ans(p.skills[k]?.note)}</td></tr>`).join("")}
</tbody></table>`;
  const list = (items: string[]) => pad(items.filter((x) => x.trim()), LIST_ROWS, () => "").map((x, i) => `<li><b>${i + 1}.</b> ${ans(x)}</li>`).join("");
  const quran = p.quran ? `${esc(QURAN_LABELS[p.quran]?.en ?? p.quran)} <span class="u">${esc(QURAN_LABELS[p.quran]?.ur ?? "")}</span>` : "";
  const langs = p.languages.map((l) => `${esc(LANGUAGE_LABELS[l]?.en ?? l)} <span class="u">${esc(LANGUAGE_LABELS[l]?.ur ?? "")}</span>`).join(" · ");
  const foot = `<div class="foot"><span>Noor Circles · A circle of light in every neighbourhood</span><span>${meta?.updatedAt ? `Updated ${esc(new Date(meta.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))} · ` : ""}Confidential: admins only</span></div>`;
  const top = `<div class="top"><div><div class="brand">NOOR CIRCLES — MURABBI INTRODUCTION</div><div class="u big">آپ کا تعارف</div></div><div class="who">${esc(name)}</div></div>`;

  w.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Murabbi Introduction · ${esc(name)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap">
<style>
@page { size: A4 portrait; margin: 0 }
* { box-sizing: border-box }
body { margin: 0; font-family: Georgia, serif; color: #361a2c; font-size: 11.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact }
.page { width: 210mm; min-height: 297mm; padding: 11mm 12mm 9mm; background: #fffdf8; display: flex; flex-direction: column; page-break-after: always; break-after: page }
.page:last-child { page-break-after: auto; break-after: auto }
.frame { flex: 1; border: 2px solid #691c46; outline: 1px solid #c79446; outline-offset: -5px; border-radius: 5px; padding: 7mm 8mm 5mm; display: flex; flex-direction: column }
.u { font-family: "Noto Nastaliq Urdu", serif; direction: rtl; unicode-bidi: isolate; line-height: 1.9; color: #74646d; font-size: .92em }
.top { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1.5px solid #c79446; padding-bottom: 2mm; margin-bottom: 3mm }
.brand { font-size: 13px; letter-spacing: .12em; color: #691c46; font-weight: bold }
.big { font-size: 15px; color: #691c46 }
.who { font-size: 16px; color: #691c46 }
h2 { display: flex; justify-content: space-between; align-items: baseline; margin: 3.5mm 0 1.5mm; padding: .6mm 2.5mm; background: #691c46; color: #fff; font-size: 12px; border-radius: 3px }
h2 .u { color: #f3e2c4; font-size: 12px; line-height: 1.7 }
table { width: 100%; border-collapse: collapse }
th, td { border: 1px solid #dccfd6; padding: 1.2mm 2mm; vertical-align: top; text-align: left }
th { background: #f7efe9; font-weight: normal; width: 34% }
th .en { font-weight: bold; color: #361a2c }
.grid th { width: auto }
.grid thead th { text-align: center; font-size: 10.5px }
.sk tbody th { width: 30% }
td.c { text-align: center; color: #691c46; font-weight: bold; width: 9% }
td { min-height: 7mm; height: 7mm }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm }
ul { list-style: none; margin: 0; padding: 0 }
li { border-bottom: 1px solid #dccfd6; min-height: 7mm; padding: 1.2mm 1mm }
.note { font-size: 10px; color: #74646d; font-style: italic }
.foot { margin-top: auto; padding-top: 3mm; display: flex; justify-content: space-between; font-size: 10px; color: #74646d; border-top: 1px solid #c79446 }
</style></head><body>
<div class="page"><div class="frame">${top}
${head(SECTIONS.personal, 1)}<table>
${row(FIELDS.fullName, ans(p.fullName))}${row(FIELDS.fatherName, ans(p.fatherName))}${row(FIELDS.dateOfBirth, ans(dobLabel(p.dateOfBirth)))}
${row(FIELDS.placeOfBirth, ans(p.placeOfBirth))}${row(FIELDS.address, ans(p.address))}${row(FIELDS.whatsapp, ans(p.whatsapp))}${row(FIELDS.email, ans(p.email))}
</table>
${head(SECTIONS.vision, 2)}<table>
${row(FIELDS.purpose, ans(p.purpose))}${row(FIELDS.approach, ans(p.approach))}${row(FIELDS.currentWork, ans(p.currentWork))}${row(FIELDS.socialImpact, ans(p.socialImpact))}
</table>
${head(SECTIONS.education, 3)}<table>
${row(FIELDS.quran, `${quran}${p.quranNote ? ` — ${ans(p.quranNote)}` : ""}`)}${row(FIELDS.school, ans(p.school))}${row(FIELDS.college, ans(p.college))}
${row(FIELDS.courses, ans(p.courses))}${row(FIELDS.specialisation, ans(p.specialisation))}
</table>
${head(SECTIONS.experience, 4)}<table class="grid"><thead><tr><th style="width:5%">#</th><th style="width:30%">${lbl(FIELDS.organisation)}</th><th style="width:17%">${lbl(FIELDS.duration)}</th><th>${lbl(FIELDS.responsibilities)}</th></tr></thead><tbody>
${exp.map((e, i) => `<tr><td class="c">${i + 1}</td><td>${ans(e.organisation)}</td><td>${ans(e.duration)}</td><td>${ans(e.responsibilities)}</td></tr>`).join("")}
</tbody></table>
${foot}</div></div>
<div class="page"><div class="frame">${top}
${head(SECTIONS.soft, 5)}<table>${row(FIELDS.languages, `${langs}${p.languagesNote ? ` — ${ans(p.languagesNote)}` : ""}`)}</table>
<div style="height:1.5mm"></div>${skillTable(SOFT_SKILLS)}
${head(SECTIONS.hard, 6)}${skillTable(HARD_SKILLS)}
${head(SECTIONS.religious, 7)}<table>
${row(FIELDS.islahi, ans(p.islahi))}${row(FIELDS.tabligh, ans(p.tabligh))}${row(FIELDS.political, ans(p.political))}
</table><div class="note">Political affiliation is optional and never used to judge anyone.</div>
${head(SECTIONS.self, 8)}<div class="cols">
<div><table><tr><th style="width:100%">${lbl(FIELDS.strengths)}</th></tr></table><ul>${list(p.strengths)}</ul></div>
<div><table><tr><th style="width:100%">${lbl(FIELDS.weaknesses)}</th></tr></table><ul>${list(p.weaknesses)}</ul></div>
</div>
${foot}</div></div>
<script>document.fonts.ready.then(() => setTimeout(() => window.print(), 300));</script></body></html>`);
  w.document.close();
}
