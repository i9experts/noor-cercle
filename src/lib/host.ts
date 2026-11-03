// Hosts and the spaces they offer for circles: API calls, types and labels.
import { API } from "@/lib/api";

export type SpaceStatus = "offered" | "visited" | "approved" | "in-use" | "inactive";
export const SPACE_STATUSES: SpaceStatus[] = ["offered", "visited", "approved", "in-use", "inactive"];

export const STATUS_META: Record<SpaceStatus, { label: string; ur: string; cls: string }> = {
  offered : { label: "Offered",  ur: "پیش کی گئی",  cls: "bg-gold-lt text-gold-dim" },
  visited : { label: "Visited",  ur: "وزٹ ہو گیا",  cls: "bg-teal-lt text-teal" },
  approved: { label: "Approved", ur: "منظور",       cls: "bg-nc-green-lt text-nc-green" },
  "in-use": { label: "In use",   ur: "استعمال میں", cls: "bg-plum-lt text-plum" },
  inactive: { label: "Inactive", ur: "غیر فعال",    cls: "bg-muted text-nc-muted" },
};
export const statusMeta = (s: string) => STATUS_META[s as SpaceStatus] ?? STATUS_META.offered;

/** The four steps a space moves through (inactive is outside the line). */
export const STEPS: SpaceStatus[] = ["offered", "visited", "approved", "in-use"];

/** What happens next, for the host, at each step. */
export const NEXT_STEP: Record<SpaceStatus, { ur: string; en: string }> = {
  offered : { ur: "نور سرکلز ٹیم یا کلسٹر سپروائزر جلد آپ کی جگہ دیکھنے آئیں گے۔", en: "The Noor Circles team or the cluster supervisor will visit your space soon." },
  visited : { ur: "وزٹ ہو گیا ہے۔ ٹیم اب جگہ کی منظوری پر غور کر رہی ہے۔", en: "The visit is done. The team is now reviewing your space for approval." },
  approved: { ur: "آپ کی جگہ منظور ہو گئی ہے۔ جلد ہی ایک حلقہ یہاں رکھا جائے گا۔", en: "Your space is approved. A circle will be placed here soon." },
  "in-use": { ur: "ایک حلقہ آپ کی جگہ پر ہوتا ہے۔ جزاک اللہ خیر!", en: "A circle meets in your space. JazakAllah khair!" },
  inactive: { ur: "یہ جگہ فی الحال استعمال میں نہیں۔ سوال ہو تو ٹیم سے رابطہ کریں۔", en: "This space is not in use for now. Contact the team with any questions." },
};

export const RECOMMENDATIONS = [
  { value: "approve", label: "Approve",       cls: "bg-nc-green-lt text-nc-green" },
  { value: "changes", label: "Needs changes", cls: "bg-nc-amber-lt text-nc-amber" },
  { value: "decline", label: "Decline",       cls: "bg-nc-red-lt text-nc-red" },
] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number]["value"];
export const recommendationMeta = (v?: string | null) => RECOMMENDATIONS.find((r) => r.value === v);

/** The six modules of Asaas for Hosts (titles as in the backend content). */
export const HOST_MODULE_TITLES = [
  { key: "why",    titleEn: "Why hosting matters",                         titleUr: "میزبانی کیوں اہم ہے" },
  { key: "space",  titleEn: "Preparing the space",                         titleUr: "جگہ کی تیاری" },
  { key: "safety", titleEn: "Safety and safeguarding",                     titleUr: "حفاظت اور بچوں کا تحفظ" },
  { key: "day",    titleEn: "Circle day",                                  titleUr: "حلقے کا دن" },
  { key: "people", titleEn: "Working with the murabbi and families",       titleUr: "مربی اور خاندانوں کے ساتھ" },
  { key: "adab",   titleEn: "Adab, hospitality and when things go wrong",  titleUr: "آداب، مہمان نوازی اور مشکل حالات" },
];

export interface Option { value: string; en: string; ur: string }
export interface HostOptions {
  spaceTypes: Option[];
  facilities: Option[];
  days: string[];
  checklist: { key: string; en: string; ur: string }[];
}

export interface Availability { day: number; from: string; to: string }
export interface Unavailable { _id: string; date: string; reason: string }

export interface HostCircle {
  _id: string;
  name: string;
  schedule: string;
  meetingDay: number | null;
  meetingTime: string | null;
  isActive: boolean;
  murabbi: { fullName: string; phone: string | null } | null;
  upcoming: { date: string; unavailable: boolean }[];
}

export interface HostSpace {
  _id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  area: string;
  capacity: number;
  facilities: string[];
  availability: Availability[];
  photos: string[];
  notes: string;
  status: SpaceStatus;
  lastVisitAt: string | null;
  visited: boolean;
  neighbourhood: { _id: string; name: string } | null;
  circles: HostCircle[];
  unavailable: Unavailable[];
}

export interface HostCertificate { number: string; issuedOn: string | null }

export interface HostMe {
  host: { _id: string; fullName: string; email: string; phone?: string | null } | null;
  spaces: HostSpace[];
  training: { done: number; total: number; certificate: HostCertificate | null };
}

export interface HostModule {
  key: string;
  number: number;
  titleEn: string;
  titleUr: string;
  summaryEn: string;
  summaryUr: string;
  sections: { headingEn: string; headingUr: string; ur: string[]; en: string[] }[];
  check: { passMark: number; questions: { questionUr: string; questionEn: string; options: { ur: string; en: string }[] }[] };
  passedAt: string | null;
  attempts: number;
  audio: { url: string; durationSec: number } | null;
}

export interface HostTrainingData {
  name: string;
  modules: HostModule[];
  done: number;
  total: number;
  certificate: HostCertificate | null;
}

export interface CheckResult {
  correct: number;
  total: number;
  passMark: number;
  passed: boolean;
  results: { chosen: number; correct: number; right: boolean }[];
  certificate: string | null;
}

export interface VisitRecord {
  _id?: string;
  byName: string;
  at: string;
  checklist: { key: string; ok: boolean; note: string }[];
  notes: string;
  recommendation: Recommendation;
}

/** A row of GET /host/admin/spaces. */
export interface AdminSpace {
  _id: string;
  name: string;
  type: string;
  status: SpaceStatus;
  address: string;
  city: string;
  area: string;
  capacity: number;
  facilities: string[];
  photos: string[];
  createdAt: string;
  host: { _id: string; fullName: string; email: string; phone: string | null } | null;
  neighbourhood: { _id: string; name: string } | null;
  cluster: string | null;
  circles: { _id: string; name: string; schedule: string; murabbi: string | null }[];
  lastVisit: { at: string; byName: string; recommendation: Recommendation } | null;
  training: { done: number; total: number; certified: boolean };
  unavailableSoon: number;
}

/** GET /host/admin/spaces/:id */
export interface AdminSpaceDetail extends AdminSpace {
  availability: Availability[];
  notes: string;
  adminNotes?: string;
  visits: VisitRecord[];
  unavailable: Unavailable[];
  trainingModules: { key: string; titleEn: string; passedAt: string | null }[];
  certificate: HostCertificate | null;
}

export interface VenueCircle {
  _id: string;
  name: string;
  murabbi: string | null;
  neighbourhood: string | null;
  schedule: string;
  venue: { _id: string; name: string } | null;
  isActive: boolean;
}

export interface HostTrainingRow {
  user: { _id: string; fullName: string; email: string };
  done: number;
  total: number;
  modules: { key: string; passed: boolean; attempts: number }[];
  certificate: HostCertificate | null;
}

export type SpaceInput = Partial<Pick<HostSpace, "name" | "type" | "address" | "city" | "area" | "capacity" | "facilities" | "availability" | "photos" | "notes">>;
export type AdminSpaceInput = SpaceInput & { status?: SpaceStatus; neighbourhoodId?: string | null; adminNotes?: string };

export const hostService = {
  options          : ()                                   => API.get("/host/options"),
  // the host
  me               : ()                                   => API.get("/host/me"),
  saveSpace        : (id: string, data: SpaceInput)       => API.put(`/host/spaces/${id}`, data),
  addUnavailable   : (id: string, data: { date: string; reason?: string }) => API.post(`/host/spaces/${id}/unavailable`, data),
  removeUnavailable: (id: string)                         => API.delete(`/host/unavailable/${id}`),
  training         : ()                                   => API.get("/host/training"),
  check            : (key: string, answers: number[])     => API.post(`/host/training/${key}/check`, { answers }),
  // admins and supervisors
  spaces           : (status?: string)                    => API.get("/host/admin/spaces", { params: status ? { status } : {} }),
  space            : (id: string)                         => API.get(`/host/admin/spaces/${id}`),
  addVisit         : (id: string, data: { checklist: { key: string; ok: boolean; note?: string }[]; notes?: string; recommendation: Recommendation }) =>
                       API.post(`/host/admin/spaces/${id}/visits`, data),
  // admins only
  updateSpace      : (id: string, data: AdminSpaceInput)  => API.patch(`/host/admin/spaces/${id}`, data),
  circles          : ()                                   => API.get("/host/admin/circles"),
  setVenue         : (circleId: string, spaceId: string | null) => API.put(`/host/admin/circles/${circleId}/venue`, { spaceId }),
  trainingOverview : ()                                   => API.get("/host/admin/training"),
  uploadAudio      : (key: string, file: File)            => {
    const form = new FormData();
    form.append("file", file);
    return API.post(`/host/admin/training/${key}/audio`, form, { headers: { "Content-Type": "multipart/form-data" }, timeout: 0 });
  },
  removeAudio      : (key: string)                        => API.delete(`/host/admin/training/${key}/audio`),
  moduleAudio      : ()                                   => API.get('/host/admin/training/modules'),
};

/** A link on the API (the training audio is served from there with a signed token). */
export const apiUrl = (path: string) => `${String(API.defaults.baseURL ?? "").replace(/\/$/, "")}${path}`;

export const typeLabel = (options: HostOptions | null, value: string) => options?.spaceTypes.find((t) => t.value === value);
export const facilityLabel = (options: HostOptions | null, value: string) => options?.facilities.find((f) => f.value === value);

/** 'Fri 13 Nov' style date, read as a calendar date. */
export function dayLabel(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

export const telLink = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

// ── The space form (host and admin) ──

export const MAX_PHOTOS = 6;

export interface SpaceFormValue {
  name: string;
  type: string;
  address: string;
  city: string;
  area: string;
  capacity: number | "";
  facilities: string[];
  availability: Availability[];
  photos: string[];
  notes: string;
}

export function toFormValue(s: Partial<SpaceFormValue> & { capacity?: number | "" }): SpaceFormValue {
  return {
    name: s.name ?? "", type: s.type ?? "other", address: s.address ?? "", city: s.city ?? "", area: s.area ?? "",
    capacity: s.capacity ?? "", facilities: s.facilities ?? [], availability: s.availability ?? [], photos: s.photos ?? [], notes: s.notes ?? "",
  };
}

export function toInput(v: SpaceFormValue): SpaceInput {
  return {
    name: v.name.trim(), type: v.type, address: v.address.trim(), city: v.city.trim(), area: v.area.trim(),
    ...(v.capacity !== "" && { capacity: Number(v.capacity) }),
    facilities: v.facilities, availability: v.availability, photos: v.photos, notes: v.notes.trim(),
  };
}

export const PRIVACY_NOTE = {
  ur: "آپ کا پتا صرف نور سرکلز ٹیم، حلقے کے مربی اور داخل شدہ خاندانوں کو دکھایا جاتا ہے، کبھی ویب سائٹ پر نہیں۔",
  en: "Your address is shown only to the Noor Circles team, your circle’s murabbi and enrolled families — never on the website.",
};

/** "House 21, Block 13-D, Gulshan-e-Iqbal" + area + city, without repeating a part the address already has. */
export function joinAddress(...parts: (string | null | undefined)[]) {
  const out: string[] = [];
  for (const raw of parts) {
    const p = raw?.trim();
    if (p && !out.some((o) => o.toLowerCase().includes(p.toLowerCase()))) out.push(p);
  }
  return out.join(", ");
}
