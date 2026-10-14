// Shared helpers for contributions, ratings and the reward pool.
// Months are 'YYYY-MM' in Pakistan time (UTC+5), matching the backend.

export const MIN_MONTHLY_PLEDGE = 250;

export function formatPKR(n: number | null | undefined) {
  return `PKR ${Math.round(n ?? 0).toLocaleString("en-PK")}`;
}

export function currentMonth() {
  const pkt = new Date(Date.now() + 5 * 3600_000);
  return `${pkt.getUTCFullYear()}-${String(pkt.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function addMonths(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string, short = false) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: short ? "short" : "long", year: short ? "2-digit" : "numeric", timeZone: "UTC",
  });
}

export function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash         : "Cash",
  bank_transfer: "Bank transfer",
  jazzcash     : "JazzCash",
  easypaisa    : "Easypaisa",
  stripe       : "Card (Stripe)",
  gift         : "Gift",
  voucher      : "Voucher",
  other        : "Other",
};

export const MANUAL_METHODS = ["cash", "bank_transfer", "jazzcash", "easypaisa", "other"] as const;
export const PAYOUT_METHODS = ["cash", "bank_transfer", "jazzcash", "easypaisa", "gift", "voucher", "other"] as const;

/** Unwraps the API's `{ data }` envelope. */
export function unwrap<T = any>(r: { data: any }): T {
  return (r.data?.data ?? r.data) as T;
}

/** The API's success message (sits next to `data`, not inside it). */
export function apiMessage(r: { data: any }, fallback = "Done.") {
  return (r.data?.message as string) || fallback;
}

export function apiError(err: any, fallback: string) {
  const m = err?.response?.data?.message;
  return Array.isArray(m) ? m[0] : m || fallback;
}

/** CSV download with proper quoting (and a BOM so Excel reads UTF-8). */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((v) => {
      const s = String(v ?? "");
      // neutralise spreadsheet formulas
      const safe = typeof v === "string" && /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
      return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    }).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Month picker options: the last `count` months, newest first. */
export function recentMonths(count = 12, from = currentMonth()) {
  return Array.from({ length: count }, (_, i) => addMonths(from, -i));
}

/** Colour classes for a 0–100 engagement score. */
export function scoreTone(score: number) {
  if (score >= 80) return { text: "text-nc-green", bg: "bg-nc-green", lt: "bg-nc-green-lt" };
  if (score >= 60) return { text: "text-gold-dim", bg: "bg-gold", lt: "bg-gold-lt" };
  return { text: "text-nc-red", bg: "bg-nc-red", lt: "bg-nc-red-lt" };
}
