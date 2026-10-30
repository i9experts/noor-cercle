// Labels and colours for clusters, supervisor visits and dashboard alerts.

export const RATING_META: Record<string, { label: string; cls: string }> = {
  strong         : { label: "Strong",        cls: "bg-nc-green-lt text-nc-green" },
  good           : { label: "Good",          cls: "bg-teal-lt text-teal" },
  "needs-support": { label: "Needs support", cls: "bg-nc-amber-lt text-nc-amber" },
  urgent         : { label: "Urgent",        cls: "bg-nc-red-lt text-nc-red" },
};
export const RATINGS = Object.keys(RATING_META);

/** Checklist scores: 2 strong, 1 good, 0 needs support, null not seen. */
export const SCORES: { value: number | null; label: string; cls: string }[] = [
  { value: 2,    label: "Strong",        cls: "border-nc-green bg-nc-green-lt text-nc-green" },
  { value: 1,    label: "Good",          cls: "border-teal bg-teal-lt text-teal" },
  { value: 0,    label: "Needs support", cls: "border-nc-amber bg-nc-amber-lt text-nc-amber" },
  { value: null, label: "Not seen",      cls: "border-border bg-muted text-nc-muted" },
];
export const scoreMeta = (v: number | null | undefined) => SCORES.find((s) => s.value === (v ?? null)) ?? SCORES[3];

export const ALERT_META: Record<string, { cls: string; dot: string }> = {
  red  : { cls: "border-nc-red/40 bg-nc-red-lt/60",     dot: "bg-nc-red" },
  amber: { cls: "border-nc-amber/40 bg-nc-amber-lt/60", dot: "bg-nc-amber" },
  info : { cls: "border-border bg-muted/40",            dot: "bg-nc-muted" },
};

export const TRAINING_META: Record<string, { label: string; cls: string }> = {
  certified     : { label: "Certified",    cls: "bg-nc-green-lt text-nc-green" },
  "in-training" : { label: "In training",  cls: "bg-gold-lt text-gold-dim" },
  "not-assigned": { label: "Not assigned", cls: "bg-muted text-nc-muted" },
};

export interface ChecklistItem { key: string; group: string; title: string; look: string }

export interface Visit {
  _id: string;
  circle: { _id: string; name: string };
  cluster?: { _id: string; name: string };
  supervisor: { _id: string; fullName: string } | null;
  date: string;
  childrenPresent: number | null;
  checklist: { key: string; title: string; score: number | null; note: string }[];
  overall: string;
  highlights: string;
  concerns: string;
  safeguarding: boolean;
  followUps: { _id: string; text: string; done: boolean; doneAt: string | null }[];
}

/** Average of the scored items as a percentage of "strong" (null when nothing was scored). */
export function visitScore(v: Pick<Visit, "checklist">) {
  const scored = v.checklist.filter((c) => c.score !== null);
  if (!scored.length) return null;
  return Math.round((scored.reduce((n, c) => n + (c.score ?? 0), 0) / (scored.length * 2)) * 100);
}
