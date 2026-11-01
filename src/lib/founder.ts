// "Meet the Founder": the founder's profile (public to read, admins edit it),
// the blog's newest posts, and a small renderer for the profile's text.
//
// Text format (story and messages): a blank line starts a new paragraph,
// a line starting "- " is a bullet, and **words** are bold.

import { createElement, Fragment, type ReactNode } from "react";
import { API } from "@/lib/api";

export interface VisionPoint { en: string; ur: string; detailEn: string }

export interface FounderData {
  name: string;
  titleEn: string;
  titleUr: string;
  taglineEn: string;
  taglineUr: string;
  /** An uploaded photo's URL, or '' for the photo bundled with the portal. */
  photo: string;
  blogUrl: string;
  quoteEn: string;
  quoteUr: string;
  storyEn: string;
  storyUr: string;
  vision: VisionPoint[];
  messageParentsUr: string;
  messageParentsEn: string;
  messageMurabbisEn: string;
  messageMurabbisUr: string;
  updatedAt?: string | null;
}

export type FounderUpdate = Partial<Omit<FounderData, "updatedAt">>;

export interface BlogPost { title: string; url: string; date: string | null }

export type FounderAudience = "murabbi" | "parent";

export const FOUNDER_PHOTO = "/founder.webp";
export const MAX_VISION_POINTS = 8;
export const TEXT_FORMAT_HINT = "A blank line starts a new paragraph · a line starting “- ” is a bullet · **words** are bold";

export const founderService = {
  get    : ()                    => API.get("/founder"),
  posts  : ()                    => API.get("/founder/posts"),
  update : (data: FounderUpdate) => API.put("/founder", data),
  reset  : ()                    => API.post("/founder/reset"),
};

export const founderPhoto = (d: Pick<FounderData, "photo">) => d.photo || FOUNDER_PHOTO;

/** "https://ayubi.blog/" → "ayubi.blog" */
export function blogHost(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }
}

/** A post's 'YYYY-MM-DD' date as "3 Oct 2026". */
export function postDate(date: string | null) {
  if (!date) return "";
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** The message a portal shows, in the order it shows them (the portal's main language first). */
export function messageFor(d: FounderData, audience: FounderAudience) {
  return audience === "parent"
    ? { primary: d.messageParentsUr, primaryUr: true, secondary: d.messageParentsEn }
    : { primary: d.messageMurabbisEn, primaryUr: false, secondary: d.messageMurabbisUr };
}

/**
 * The first sentence of a text's first real paragraph (a short greeting
 * such as "Dear parents, Assalamu alaikum." is skipped), without formatting.
 */
export function firstSentence(text: string) {
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/^\s*- /gm, "").replace(/\*\*/g, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const para = paras.find((p) => p.length > 60) ?? paras[0] ?? "";
  return para.match(/^.*?[.!?۔؟](?=\s|$)/)?.[0] ?? para;
}

// ── Rich text ───────────────────────────────────────────────────────────────

type Block = { kind: "p"; lines: string[] } | { kind: "ul"; items: string[] };

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;
  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) { current = null; continue; }
    const bullet = /^[-•]\s+/.test(line);
    const kind = bullet ? "ul" : "p";
    if (!current || current.kind !== kind) {
      current = bullet ? { kind: "ul", items: [] } : { kind: "p", lines: [] };
      blocks.push(current);
    }
    if (current.kind === "ul") current.items.push(line.replace(/^[-•]\s+/, ""));
    else current.lines.push(line);
  }
  return blocks;
}

/** "a **b** c" → ["a ", <strong>b</strong>, " c"] */
function inline(text: string, key: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 ? createElement("strong", { key: `${key}-${i}`, className: "font-semibold text-nc-dark" }, part) : part,
  );
}

/**
 * Renders the profile's text format as React elements (never as HTML).
 * `dir="rtl"` renders Urdu (Nastaliq, right to left).
 */
export function RichText({ text, dir = "ltr", className = "" }: { text: string; dir?: "ltr" | "rtl"; className?: string }) {
  const rtl = dir === "rtl";
  const children = parseBlocks(text || "").map((b, i) =>
    b.kind === "ul"
      ? createElement(
        "ul",
        { key: i, className: "list-disc space-y-1.5 ps-5 marker:text-gold" },
        b.items.map((item, j) => createElement("li", { key: j }, inline(item, `${i}-${j}`))),
      )
      : createElement(
        "p",
        { key: i },
        b.lines.map((l, j) => createElement(Fragment, { key: j }, j > 0 && createElement("br"), inline(l, `${i}-${j}`))),
      ),
  );
  return createElement(
    "div",
    {
      dir,
      lang: rtl ? "ur" : undefined,
      className: `${rtl ? "urdu space-y-3 text-right leading-[2.3]" : "space-y-3 leading-relaxed"} break-words ${className}`,
    },
    children,
  );
}
