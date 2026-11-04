import { API } from "@/lib/api";
import { downloadCsv } from "@/lib/finance";

/** Registers of murabbis, parents and hosts, with the team's follow-ups (admin only). */
export type RegisterType = "murabbi" | "parent" | "host";

export const FOLLOW_UP_STATUSES = ["new", "to-contact", "in-progress", "done", "no-response"] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];
export const FOLLOW_UP_META: Record<string, { label: string; cls: string; print: string }> = {
  "new":         { label: "New",         cls: "bg-muted text-nc-muted",            print: "new" },
  "to-contact":  { label: "To contact",  cls: "bg-nc-amber-lt text-nc-amber",      print: "to" },
  "in-progress": { label: "In progress", cls: "bg-plum/10 text-plum",              print: "prog" },
  "done":        { label: "Done",        cls: "bg-nc-green-lt text-nc-green",      print: "done" },
  "no-response": { label: "No response", cls: "bg-nc-red-lt text-nc-red",          print: "none" },
};
export const NOTE_KINDS = [
  ["call", "Call"], ["whatsapp", "WhatsApp"], ["visit", "Visit"], ["email", "Email"], ["note", "Note"],
] as const;
export const NOTE_KIND_LABEL: Record<string, string> = Object.fromEntries(NOTE_KINDS);

export interface FollowUp {
  status: FollowUpStatus; nextDate: string | null; due: "overdue" | "today" | null; notes: number;
  lastNote: { at: string; kind: string; text: string; byName: string } | null;
}
export interface FollowUpDetail extends FollowUp {
  subjectType: RegisterType; subject: string; name: string;
  log: { _id: string; at: string; kind: string; text: string; byName: string }[];
}
export interface AccountState {
  exists: boolean; active: boolean; pendingApproval: boolean; mustChangePassword: boolean; lastLoginAt: string | null; createdAt: string | null;
}

export interface MurabbiRow {
  _id: string; fullName: string; email: string; phone: string; address: string;
  area: string; city: string; cluster: string | null; background: string; interestAt: string | null;
  account: AccountState;
  circles: { _id: string; name: string; active: boolean; students: number }[];
  students: number; sessions: number; lastSession: string | null;
  asaas: null | {
    status: string; lessonsCompleted: number; lessonsTotal: number; percentHeard: number; lastActive: string | null;
    dueDate: string | null; overdue: boolean; assessment: { attempts: number; best: number; passed: boolean } | null;
    reflection: string | null; certificate: string | null;
  };
  certificates: { tier: number; number: string }[];
  otherCourses: { assigned: number; certified: number };
  introduction: number | null;
  journal: { pagesDone: number; totalPages: number; moments: number } | null;
  rating: number | null; lastRating: { month: string; score: number } | null;
  rewards: { paid: number; approved: number };
  followUp: FollowUp;
}
export interface ParentRow {
  _id: string; fullName: string; phone: string; whatsapp: string; email: string;
  area: string; city: string; cluster: string | null; engaged: boolean; notes: string; addedAt: string | null;
  account: AccountState & { userId: string | null };
  children: {
    _id: string; fullName: string; age: number | null; active: boolean; circle: { _id: string; name: string } | null; murabbi: string | null;
    attendance: { present: number; total: number; percent: number | null; last: string | null } | null;
  }[];
  profile: { answered: number; total: number; percent: number; updatedAt: string | null };
  asaas: null | {
    status: string; lessonsCompleted: number; lessonsTotal: number; currentModule: number; quizzesPassed: number;
    finalPassed: boolean; lastActive: string | null; certificate: string | null;
  };
  rating: number | null;
  rewards: { paid: number; approved: number };
  followUp: FollowUp;
}
export interface HostRow {
  _id: string; fullName: string; email: string; phone: string; address: string;
  area: string; city: string; cluster: string | null; interestAt: string | null;
  account: AccountState;
  spaces: { _id: string; name: string; type: string; status: string; capacity: number; circles: string[] }[];
  training: { done: number; total: number; certificate: string | null } | null;
  followUp: FollowUp;
}
export type AnyRow = MurabbiRow | ParentRow | HostRow;

export interface DueList {
  today: number; overdue: number; byType: Record<RegisterType, number>;
  items: { subjectType: RegisterType; subject: string; name: string; phone: string; status: string; nextDate: string; overdue: boolean; lastNote: { at: string; kind: string; text: string } | null }[];
}

const PATH: Record<RegisterType, string> = { murabbi: "murabbis", parent: "parents", host: "hosts" };
export const registerService = {
  list    : (type: RegisterType)                 => API.get(`/register/${PATH[type]}`),
  due     : ()                                   => API.get("/register/due"),
  followUp: (type: RegisterType, id: string)     => API.get(`/register/${type}/${id}/follow-up`),
  update  : (type: RegisterType, id: string, data: { status?: string; nextDate?: string | null }) => API.patch(`/register/${type}/${id}/follow-up`, data),
  addNote : (type: RegisterType, id: string, data: { kind: string; text: string; status?: string; nextDate?: string | null }) => API.post(`/register/${type}/${id}/notes`, data),
};

// ── Labels ─────────────────────────────────────────────────────────────────

export const ASAAS_STAGE: Record<string, string> = {
  "not-started": "Not started", "in-progress": "Listening", "listened": "Heard all", "assessment-passed": "Assessment passed",
  "certified": "Certified", "heard-all": "Heard all",
};
export const SPACE_STATUS_LABEL: Record<string, string> = { offered: "Offered", visited: "Visited", approved: "Approved", "in-use": "In use", inactive: "Inactive" };

export const shortDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
export const dayLabel = (ymd?: string | null) =>
  ymd ? new Date(`${ymd}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";

/** "Today", "3 days ago", "Never". */
export function agoLabel(d?: string | null) {
  if (!d) return "Never";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return shortDate(d);
}

export function accountLabel(a: AccountState) {
  if (!a.exists) return "No account";
  if (!a.active) return a.pendingApproval ? "Awaiting approval" : "Access stopped";
  if (a.mustChangePassword && !a.lastLoginAt) return "Never signed in";
  return "Active";
}

/** Pakistani number → wa.me form (92…). */
export function waNumber(phone?: string | null) {
  const d = (phone ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("92")) return d;
  if (d.startsWith("0")) return `92${d.slice(1)}`;
  if (d.length === 10 && d.startsWith("3")) return `92${d}`;
  return d;
}

/** The training stage used for filters. */
export function trainingStage(type: RegisterType, r: AnyRow): string {
  if (type === "host") {
    const t = (r as HostRow).training;
    return !t || t.done === 0 ? "not-started" : t.certificate ? "certified" : "in-progress";
  }
  const a = (r as MurabbiRow | ParentRow).asaas;
  if (!a) return "not-enrolled";
  if (a.certificate || a.status === "certified") return "certified";
  return a.status === "not-started" ? "not-started" : "in-progress";
}
export const STAGE_LABEL: Record<string, string> = {
  "not-enrolled": "Not enrolled", "not-started": "Not started", "in-progress": "In training", "certified": "Certified",
};

// ── Excel (CSV) ─────────────────────────────────────────────────────────────

const yes = (b: boolean) => (b ? "Yes" : "No");
const fu = (f: FollowUp) => [FOLLOW_UP_META[f.status]?.label ?? f.status, f.nextDate ?? "", f.lastNote ? `${NOTE_KIND_LABEL[f.lastNote.kind] ?? f.lastNote.kind}: ${f.lastNote.text}` : ""];
const FU_HEAD = ["Follow-up", "Next date", "Last note"];

export function exportRegisterCsv(type: RegisterType, rows: AnyRow[]) {
  const date = new Date().toISOString().slice(0, 10);
  if (type === "murabbi") {
    const head = ["Name", "Email", "Phone", "Area", "City", "Cluster", "Background", "Interest date", "Account", "Last sign-in",
      "Circles", "Students", "Sessions", "Last session", "Asaas stage", "Lessons", "Assessment best %", "Reflection", "Asaas certificate",
      "Other courses (certified/assigned)", "Introduction %", "Journal pages", "Moments", "Rating this month", "Rewards paid (PKR)", "Rewards approved (PKR)", ...FU_HEAD];
    downloadCsv(`murabbi-register-${date}.csv`, [head, ...(rows as MurabbiRow[]).map((r) => [
      r.fullName, r.email, r.phone, r.area, r.city, r.cluster ?? "", r.background, shortDate(r.interestAt), accountLabel(r.account), shortDate(r.account.lastLoginAt),
      r.circles.map((c) => c.name).join("; "), r.students, r.sessions, shortDate(r.lastSession),
      r.asaas ? ASAAS_STAGE[r.asaas.status] ?? r.asaas.status : "Not enrolled", r.asaas ? `${r.asaas.lessonsCompleted}/${r.asaas.lessonsTotal}` : "",
      r.asaas?.assessment?.best ?? "", r.asaas?.reflection ?? "", r.asaas?.certificate ?? "",
      r.otherCourses.assigned ? `${r.otherCourses.certified}/${r.otherCourses.assigned}` : "", r.introduction ?? "",
      r.journal ? `${r.journal.pagesDone}/${r.journal.totalPages}` : "", r.journal?.moments ?? "", r.rating ?? "", r.rewards.paid, r.rewards.approved, ...fu(r.followUp),
    ])]);
  } else if (type === "parent") {
    const head = ["Name", "Phone", "WhatsApp", "Email", "Area", "City", "Cluster", "Engaged", "Account", "Last sign-in",
      "Children", "Circles", "Attendance", "Family profile %", "Asaas for Parents", "Clips heard", "Certificate", "Rating this month", "Rewards paid (PKR)", ...FU_HEAD];
    downloadCsv(`parent-register-${date}.csv`, [head, ...(rows as ParentRow[]).map((r) => [
      r.fullName, r.phone, r.whatsapp, r.email, r.area, r.city, r.cluster ?? "", yes(r.engaged), accountLabel(r.account), shortDate(r.account.lastLoginAt),
      r.children.map((c) => `${c.fullName}${c.age != null ? ` (${c.age})` : ""}`).join("; "),
      r.children.map((c) => c.circle?.name ?? "—").join("; "),
      r.children.map((c) => (c.attendance?.percent != null ? `${c.attendance.percent}%` : "—")).join("; "),
      r.profile.percent, r.asaas ? ASAAS_STAGE[r.asaas.status] ?? r.asaas.status : "Not enrolled",
      r.asaas ? `${r.asaas.lessonsCompleted}/${r.asaas.lessonsTotal}` : "", r.asaas?.certificate ?? "", r.rating ?? "", r.rewards.paid, ...fu(r.followUp),
    ])]);
  } else {
    const head = ["Name", "Email", "Phone", "Area", "City", "Cluster", "Interest date", "Account", "Last sign-in",
      "Spaces", "Space status", "Circles placed", "Host training", "Certificate", ...FU_HEAD];
    downloadCsv(`host-register-${date}.csv`, [head, ...(rows as HostRow[]).map((r) => [
      r.fullName, r.email, r.phone, r.area, r.city, r.cluster ?? "", shortDate(r.interestAt), accountLabel(r.account), shortDate(r.account.lastLoginAt),
      r.spaces.map((s) => s.name).join("; "), r.spaces.map((s) => SPACE_STATUS_LABEL[s.status] ?? s.status).join("; "),
      r.spaces.flatMap((s) => s.circles).join("; "), r.training ? `${r.training.done}/${r.training.total}` : "", r.training?.certificate ?? "", ...fu(r.followUp),
    ])]);
  }
}

// ── Printable PDF ───────────────────────────────────────────────────────────

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const TITLES: Record<RegisterType, [string, string]> = {
  murabbi: ["Murabbi register", "مربی رجسٹر"], parent: ["Parent register", "والدین رجسٹر"], host: ["Host register", "میزبان رجسٹر"],
};

function fuCell(f: FollowUp) {
  const m = FOLLOW_UP_META[f.status];
  const due = f.due === "overdue" ? ` <span class="od">overdue</span>` : f.due === "today" ? ` <span class="td">today</span>` : "";
  return `<span class="chip ${m?.print ?? ""}">${esc(m?.label ?? f.status)}</span>${f.nextDate ? `<div class="sm">Next: ${esc(dayLabel(f.nextDate))}${due}</div>` : ""}${f.lastNote ? `<div class="sm">${esc(NOTE_KIND_LABEL[f.lastNote.kind] ?? "")}: ${esc(f.lastNote.text.slice(0, 90))}</div>` : ""}`;
}

export function printRegister(type: RegisterType, rows: AnyRow[], filterNote: string) {
  const w = window.open("", "_blank", "width=1100,height=1000");
  if (!w) return;
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const [title, titleUr] = TITLES[type];
  const contact = (r: { fullName: string; phone?: string; email?: string; area: string; cluster: string | null }) =>
    `<b>${esc(r.fullName)}</b><div class="sm">${esc([r.phone, r.email].filter(Boolean).join(" · "))}</div><div class="sm">${esc([r.area, r.cluster].filter(Boolean).join(" · ") || "—")}</div>`;
  const acct = (a: AccountState) => `${esc(accountLabel(a))}<div class="sm">Last in: ${esc(agoLabel(a.lastLoginAt))}</div>`;

  let head = "", body = "";
  if (type === "murabbi") {
    head = "<th>Murabbi</th><th>Account</th><th>Circles</th><th>Asaas</th><th>Other</th><th>Rating · rewards</th><th>Follow-up</th>";
    body = (rows as MurabbiRow[]).map((r) => `<tr><td>${contact(r)}</td><td>${acct(r.account)}</td>
<td>${r.circles.length ? esc(r.circles.map((c) => c.name).join(", ")) : "—"}<div class="sm">${r.students} children · ${r.sessions} sessions</div><div class="sm">Last: ${esc(shortDate(r.lastSession) || "—")}</div></td>
<td>${r.asaas ? `${esc(ASAAS_STAGE[r.asaas.status] ?? r.asaas.status)}<div class="sm">${r.asaas.lessonsCompleted}/${r.asaas.lessonsTotal} lessons${r.asaas.assessment ? ` · best ${r.asaas.assessment.best}%` : ""}</div>${r.asaas.certificate ? `<div class="sm">${esc(r.asaas.certificate)}</div>` : ""}` : "Not enrolled"}</td>
<td class="sm">Intro ${r.introduction ?? 0}%<br>Journal ${r.journal ? `${r.journal.pagesDone}/${r.journal.totalPages}` : "—"}${r.otherCourses.assigned ? `<br>Courses ${r.otherCourses.certified}/${r.otherCourses.assigned}` : ""}</td>
<td>${r.rating ?? "—"}<div class="sm">Paid Rs ${r.rewards.paid.toLocaleString()}</div></td><td>${fuCell(r.followUp)}</td></tr>`).join("");
  } else if (type === "parent") {
    head = "<th>Parent</th><th>Account</th><th>Children</th><th>Family profile</th><th>Asaas for Parents</th><th>Rating</th><th>Follow-up</th>";
    body = (rows as ParentRow[]).map((r) => `<tr><td>${contact(r)}</td><td>${acct(r.account)}</td>
<td>${r.children.length ? r.children.map((c) => `<div>${esc(c.fullName)}${c.age != null ? ` (${c.age})` : ""} <span class="sm">${esc(c.circle?.name ?? "no circle")}${c.attendance?.percent != null ? ` · ${c.attendance.percent}%` : ""}</span></div>`).join("") : "—"}</td>
<td class="c">${r.profile.percent}%</td>
<td>${r.asaas ? `${esc(ASAAS_STAGE[r.asaas.status] ?? r.asaas.status)}<div class="sm">${r.asaas.lessonsCompleted}/${r.asaas.lessonsTotal} clips</div>${r.asaas.certificate ? `<div class="sm">${esc(r.asaas.certificate)}</div>` : ""}` : "Not enrolled"}</td>
<td class="c">${r.rating ?? "—"}</td><td>${fuCell(r.followUp)}</td></tr>`).join("");
  } else {
    head = "<th>Host</th><th>Account</th><th>Spaces</th><th>Circles</th><th>Host training</th><th>Follow-up</th>";
    body = (rows as HostRow[]).map((r) => `<tr><td>${contact(r)}</td><td>${acct(r.account)}</td>
<td>${r.spaces.length ? r.spaces.map((s) => `<div>${esc(s.name)} <span class="sm">${esc(SPACE_STATUS_LABEL[s.status] ?? s.status)} · ${s.capacity}</span></div>`).join("") : "—"}</td>
<td>${esc(r.spaces.flatMap((s) => s.circles).join(", ") || "—")}</td>
<td>${r.training ? `${r.training.done}/${r.training.total}${r.training.certificate ? `<div class="sm">${esc(r.training.certificate)}</div>` : ""}` : "—"}</td><td>${fuCell(r.followUp)}</td></tr>`).join("");
  }
  const counts = FOLLOW_UP_STATUSES.map((s) => `${FOLLOW_UP_META[s].label} ${rows.filter((r) => r.followUp.status === s).length}`).join(" · ");
  const overdue = rows.filter((r) => r.followUp.due === "overdue").length;

  w.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)} · ${esc(today)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap">
<style>
@page { size: A4 landscape; margin: 10mm }
* { box-sizing: border-box }
html, body { background: #fffdf8 }
body { margin: 0; font-family: Georgia, serif; color: #361a2c; font-size: 10.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact }
@media screen { body { max-width: 297mm; margin: 0 auto; padding: 10mm } }
.top { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #691c46; padding-bottom: 2.5mm; margin-bottom: 1mm }
.top2 { border-top: 1px solid #c79446; margin-bottom: 4mm }
.brand { font-size: 11px; letter-spacing: .2em; color: #c79446; font-weight: bold }
.ttl { font-size: 22px; color: #691c46 }
.ttlu { font-family: "Noto Nastaliq Urdu", serif; font-size: 15px; color: #691c46; line-height: 2 }
.date { text-align: right; color: #74646d; font-size: 11px }
.sum { margin-bottom: 3mm; color: #74646d }
.sum b { color: #691c46 }
table { width: 100%; border-collapse: collapse }
th, td { border-bottom: 1px solid #e6dad0; padding: 1.4mm 1.8mm; vertical-align: top; text-align: left }
thead th { background: #f7efe9; font-size: 9px; text-transform: uppercase; letter-spacing: .04em; color: #74646d; font-weight: normal }
thead { display: table-header-group }
tr { break-inside: avoid }
td.c { text-align: center }
.sm { font-size: 9px; color: #74646d }
.chip { display: inline-block; border-radius: 3mm; padding: .3mm 2mm; font-size: 9px; white-space: nowrap; background: #eee; color: #555 }
.chip.to { background: #fbf0dc; color: #9a6512 } .chip.prog { background: #f3e6ee; color: #691c46 }
.chip.done { background: #e3f2e6; color: #2f7a43 } .chip.none { background: #f8e3e3; color: #a33 }
.od { color: #a33; font-weight: bold } .td { color: #9a6512; font-weight: bold }
.foot { margin-top: 6mm; border-top: 1px solid #c79446; padding-top: 1.5mm; display: flex; justify-content: space-between; font-size: 9px; color: #74646d }
</style></head><body>
<div class="top"><div><div class="brand">NOOR CIRCLES</div><div class="ttl">${esc(title)}</div><div class="ttlu" dir="rtl" lang="ur">${esc(titleUr)}</div></div>
<div class="date">${esc(today)}<br>${rows.length} ${rows.length === 1 ? "person" : "people"}${filterNote ? `<br>${esc(filterNote)}` : ""}</div></div><div class="top2"></div>
<div class="sum">Follow-ups: ${esc(counts)}${overdue ? ` · <b>${overdue} overdue</b>` : ""}</div>
<table><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="7">No one matches.</td></tr>`}</tbody></table>
<div class="foot"><span>Confidential: for the Noor Circles team only.</span><span>noorcircles.com</span></div>
<script>window.onload = () => setTimeout(() => window.print(), 400);</script>
</body></html>`);
  w.document.close();
}
