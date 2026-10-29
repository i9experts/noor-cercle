// Shared helpers for the Asaas audio training course.

export const ASAAS_KEY = "asaas-tier1";
export const BADGE_NAME = "Certified Asaas Murabbi";

/** 73.3 → "1:13" */
export function clock(sec: number | null | undefined) {
  const s = Math.max(0, Math.floor(sec ?? 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** 4860 → "1 h 21 min", 300 → "5 min" */
export function minutesLabel(min: number) {
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ""}`;
}

export const STATUS_META: Record<string, { label: string; cls: string }> = {
  "not-started"      : { label: "Not started",       cls: "bg-muted text-nc-muted" },
  "in-progress"      : { label: "Listening",         cls: "bg-teal-lt text-teal" },
  listened           : { label: "Lessons done",      cls: "bg-nc-amber-lt text-nc-amber" },
  "assessment-passed": { label: "Assessment passed", cls: "bg-nc-purple-lt text-nc-purple" },
  certified          : { label: "Certified",         cls: "bg-nc-green-lt text-nc-green" },
};

export const BAND_META: Record<string, { label: string; cls: string }> = {
  pass       : { label: "Pass",             cls: "bg-nc-green-lt text-nc-green" },
  conditional: { label: "Conditional pass", cls: "bg-nc-amber-lt text-nc-amber" },
  practice   : { label: "Needs practice",   cls: "bg-nc-red-lt text-nc-red" },
};

export function practicalBand(total: number) {
  return total >= 12 ? "pass" : total >= 8 ? "conditional" : "practice";
}

/** Urdu (and Arabic) text runs right to left. */
export const hasUrdu = (s: string) => /[\u0600-\u06FF]/.test(s);

/** Props for a lesson title: Urdu titles (even with an English word in them) read right to left. */
export const titleProps = (s: string) => (hasUrdu(s) ? { dir: "rtl" as const, lang: "ur" } : {});
