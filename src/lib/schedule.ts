// Dates for the syllabus, agenda, calendar and family pages.
// The API sends calendar dates as 'YYYY-MM-DD' (Pakistan time).

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const PARTS = [
  { key: "welcome",  label: "Welcome & warm-up" },
  { key: "quran",    label: "Qur’an & recitation" },
  { key: "tarbiyah", label: "Tarbiyah core lesson" },
  { key: "activity", label: "Activity & reflection" },
  { key: "dhikr",    label: "Dhikr & du’a circle" },
  { key: "closing",  label: "Closing & weekly pledge" },
] as const;

export const THEMES = [
  "Identity", "Honesty", "Family", "Gratitude", "Courage", "Friendship",
  "Patience", "Generosity", "Body", "Knowledge", "Community", "Legacy",
];

/** Today in Pakistan, 'YYYY-MM-DD'. */
export function pkToday() {
  return new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);
}

export function addDays(date: string, n: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);
}

/** 'Fri 30 Oct' from 'YYYY-MM-DD' (or an ISO instant, read in Pakistan time). */
export function formatDay(d?: string | null, withYear = false) {
  if (!d) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00Z`) : new Date(new Date(d).getTime() + 5 * 3600_000);
  return date.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", ...(withYear && { year: "numeric" }), timeZone: "UTC",
  });
}

/** '19:30' → '7:30 pm' */
export function formatTime(t?: string | null) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

/** The circle's most recent meeting day on or before today (or today if it has no schedule). */
export function lastMeetingDate(meetingDay?: number | null) {
  const today = pkToday();
  if (meetingDay == null) return today;
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
  return addDays(today, -((dow - meetingDay + 7) % 7));
}

export function scheduleLabel(c: { meetingDay?: number | null; meetingTime?: string | null }) {
  if (c.meetingDay == null) return "No weekly schedule yet";
  return `${DAYS[c.meetingDay]}s${c.meetingTime ? `, ${formatTime(c.meetingTime)}` : ""}`;
}

export const STATUS_META: Record<string, { label: string; cls: string }> = {
  "on-track"     : { label: "On track",      cls: "bg-nc-green-lt text-nc-green" },
  ahead          : { label: "Ahead",         cls: "bg-nc-green-lt text-nc-green" },
  complete       : { label: "Complete",      cls: "bg-plum-lt text-plum" },
  behind         : { label: "Behind",        cls: "bg-nc-red-lt text-nc-red" },
  "not-scheduled": { label: "No schedule",   cls: "bg-gold-lt text-gold-dim" },
  "no-track"     : { label: "No syllabus",   cls: "bg-muted text-nc-muted" },
};
