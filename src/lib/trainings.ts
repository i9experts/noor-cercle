// Shared types and wording for the trainings marketplace (murabbi page in English, parent page in Urdu).

export interface TrainingStep { label: string; done: boolean; detail?: string }

export interface MyTraining {
  key: string; title: string; titleUr?: string; summary?: string; summaryUr?: string; category?: string; badge?: string;
  dueDate: string | null; certifiedAt: string | null; certificateNumber: string | null;
  lessonsCompleted: number; lessonsTotal: number; custom?: boolean; steps: TrainingStep[];
}

export interface ExploreTraining {
  key: string; title: string; titleUr?: string; summary?: string; summaryUr?: string; category?: string; badge?: string;
  tier?: number | null; lessons: number; minutes: number;
  status: "available" | "locked" | "requested";
  conditions: TrainingStep[];
  declined: { reason: string; at: string | null } | null;
  requestedAt: string | null;
}

export type Lang = "en" | "ur";

export const T = {
  en: {
    mine: "My trainings", explore: "Explore", noMine: "No trainings yet. Explore what’s on offer and ask to join.",
    noExplore: "Nothing new to explore right now. New trainings appear here when the team publishes them.",
    lessons: "lessons", min: "min", due: "Finish by", certified: "Certified", open: "Open", continue: "Continue", start: "Start",
    stepsLeft: "Still to do", unlockWhen: "Unlocks when", ask: "Ask to join", requested: "Waiting for approval", cancel: "Cancel request",
    notePlaceholder: "A note for the team (optional)", send: "Send request", declined: "Your last request wasn’t approved",
    loading: "Loading…", certificate: "Certificate",
  },
  ur: {
    mine: "میری تربیتیں", explore: "نئی تربیتیں", noMine: "ابھی کوئی تربیت نہیں۔ نئی تربیتیں دیکھیں اور شامل ہونے کی درخواست دیں۔",
    noExplore: "ابھی کوئی نئی تربیت نہیں۔ ٹیم جب نئی تربیت شامل کرے گی تو یہاں نظر آئے گی۔",
    lessons: "اسباق", min: "منٹ", due: "مکمل کرنے کی تاریخ", certified: "مکمل · سرٹیفکیٹ", open: "کھولیں", continue: "جاری رکھیں", start: "شروع کریں",
    stepsLeft: "ابھی باقی ہے", unlockWhen: "یہ تب کھلے گی جب", ask: "شامل ہونے کی درخواست", requested: "منظوری کا انتظار ہے", cancel: "درخواست واپس لیں",
    notePlaceholder: "ٹیم کے لیے کوئی بات (اختیاری)", send: "درخواست بھیجیں", declined: "آپ کی پچھلی درخواست منظور نہیں ہوئی",
    loading: "کھل رہا ہے…", certificate: "سرٹیفکیٹ",
  },
} as const;

const STEP_UR: Record<string, string> = {
  "Listen to every lesson": "تمام اسباق سنیں",
  "Pass the assessment": "جائزہ پاس کریں",
  "Share your reflection": "اپنی عکاسی لکھیں",
  "Practical assessment": "عملی جائزہ",
  "Certified": "سرٹیفکیٹ",
  "Pass the module checks": "ماڈیول کے سوالات پاس کریں",
  "Pass the final check": "آخری جائزہ پاس کریں",
  "Share your closing self-check": "آخری خود جائزہ مکمل کریں",
};

/** A step or condition label in the page's language (Urdu where we have it). */
export function stepLabel(label: string, lang: Lang) {
  if (lang === "en") return label;
  if (STEP_UR[label]) return STEP_UR[label];
  const cert = label.match(/^Certified in (.+)$/);
  if (cert) return `${cert[1]} مکمل ہو جائے`;
  const fin = label.match(/^Finish (.+)$/);
  if (fin) return `پہلے ${fin[1]} مکمل کریں`;
  return label;
}
