// The optional "about your family" questions. Answers are admin-only: never
// shown to murabbis. Values match the backend (src/insights/family-profile.ts).

export type Opt = [value: string, label: string];

export const WORK: Opt[] = [
  ["full-time", "Full-time job"], ["part-time", "Part-time job"], ["from-home", "Works from home"], ["business", "Own business"],
  ["shift", "Shift work"], ["away", "Works away or abroad"], ["homemaker", "Homemaker"], ["looking", "Looking for work"],
  ["student", "Student"], ["retired", "Retired"], ["not-applicable", "Not applicable"], ["prefer-not", "Prefer not to say"],
];

export const OPTIONS: Record<string, Opt[]> = {
  relationship: [["mother", "Mother"], ["father", "Father"], ["grandparent", "Grandparent"], ["other-relative", "Other relative"], ["guardian", "Guardian"]],
  livesWith: [
    ["both-parents", "Both parents"], ["mother-only", "Mother only"], ["father-only", "Father only"],
    ["father-away", "Mother; father works away or abroad"], ["mother-away", "Father; mother works away or abroad"],
    ["grandparents-relatives", "Grandparents or relatives"], ["guardian", "Guardian"], ["prefer-not", "Prefer not to say"],
  ],
  household: [["nuclear", "Just our family"], ["joint", "Joint family"], ["prefer-not", "Prefer not to say"]],
  work: WORK,
  days: [["weekdays", "Weekdays"], ["saturday", "Saturday"], ["sunday", "Sunday"]],
  times: [["after-school", "After school (3–6 pm)"], ["evening", "Evening (after Maghrib)"], ["weekend-morning", "Weekend morning"]],
  transport: [["walks", "Can walk"], ["dropped-off", "Can drop off"], ["needs-lift", "Needs a lift"], ["not-sure", "Not sure yet"]],
  ageBand: [["6-8", "6–8 years"], ["9-10", "9–10 years"], ["11-13", "11–13 years"]],
  gender: [["boy", "Boy"], ["girl", "Girl"]],
  school: [["government", "Government"], ["private", "Private"], ["madrasa", "Madrasa"], ["homeschool", "Homeschool"], ["not-in-school", "Not in school"]],
  quran: [["not-started", "Not started"], ["qaida", "Qaida"], ["nazra", "Nazra"], ["hifz", "Hifz"], ["madrasa-tutor", "With a madrasa or tutor"]],
  language: [["urdu", "Urdu"], ["english", "English"], ["sindhi", "Sindhi"], ["punjabi", "Punjabi"], ["pashto", "Pashto"], ["balochi", "Balochi"], ["saraiki", "Saraiki"], ["other", "Other"]],
  needs: [["learning", "Learning support"], ["health", "Health or medical"]],
  involvement: [["parent-evenings", "Parent evenings"], ["volunteering", "Volunteering"], ["hosting", "Hosting a circle"], ["contributing", "Contributing"], ["child-only", "Just my child for now"]],
  heardFrom: [["friend-family", "Friend or family"], ["masjid", "Masjid"], ["school", "School"], ["whatsapp", "WhatsApp"], ["social", "Social media"], ["other", "Other"]],
  contactBy: [["whatsapp", "WhatsApp"], ["call", "Phone call"], ["email", "Email"]],
  contactTime: [["morning", "Morning"], ["afternoon", "Afternoon"], ["evening", "Evening"]],
  status: [["new", "New request"], ["contacted", "Contacted"], ["registered", "Registered, not enrolled"], ["enrolled", "Enrolled"], ["closed", "Closed"]],
};

export const QUESTIONS: Record<string, string> = {
  relationship: "Who is answering", livesWith: "Child lives with", household: "Household", mothersWork: "Mother’s work", fathersWork: "Father’s work",
  work: "Either parent’s work", days: "Days that suit", times: "Times that suit", transport: "Getting to the circle", ageBand: "Child’s age",
  gender: "Boy / girl", school: "School", quran: "Qur’an so far", language: "Home language", needs: "Support needs", involvement: "Involvement",
  heardFrom: "Heard about us", contactBy: "Best way to reach", contactTime: "Best time to reach", status: "Status",
};

export function label(field: string, value?: string | null) {
  if (!value) return "";
  const list = field === "mothersWork" || field === "fathersWork" ? WORK : OPTIONS[field];
  return list?.find(([v]) => v === value)?.[1] ?? (value === "unanswered" ? "Not answered" : value);
}

export interface ProfileChild { ageBand?: string; gender?: string; school?: string; quran?: string }
export interface FamilyProfile {
  relationship?: string; livesWith?: string; household?: string; work?: { self?: string; other?: string };
  days?: string[]; times?: string[]; transport?: string; children?: ProfileChild[]; language?: string;
  needs?: string[]; needsNote?: string; involvement?: string[]; heardFrom?: string; contactBy?: string; contactTime?: string;
  updatedAt?: string; source?: "website" | "family-page" | "admin";
}

/** The mother's / father's work, when we know who answered. */
export function workOf(p: FamilyProfile | null | undefined, who: "mother" | "father") {
  if (!p?.work) return "";
  if (p.relationship === who) return p.work.self ?? "";
  if (p.relationship === (who === "mother" ? "father" : "mother")) return p.work.other ?? "";
  return "";
}

/** Short lines summarising a family's answers. */
export function summarise(p: FamilyProfile | null | undefined): [string, string][] {
  if (!p) return [];
  const many = (f: string, vs?: string[]) => (vs ?? []).map((v) => label(f, v)).join(", ");
  const rows: [string, string][] = [
    ["Answered by", label("relationship", p.relationship)],
    ["Child lives with", label("livesWith", p.livesWith)],
    ["Household", label("household", p.household)],
    [p.relationship === "father" ? "Father’s work" : p.relationship === "mother" ? "Mother’s work" : "Their work", label("work", p.work?.self)],
    [p.relationship === "father" ? "Mother’s work" : p.relationship === "mother" ? "Father’s work" : "Other parent’s work", label("work", p.work?.other)],
    ["Days", many("days", p.days)],
    ["Times", many("times", p.times)],
    ["Getting there", label("transport", p.transport)],
    ...((p.children ?? []).map((c, i) => [
      `Child ${i + 1}`,
      [label("ageBand", c.ageBand), label("gender", c.gender), c.school && `${label("school", c.school)} school`, c.quran && `Qur’an: ${label("quran", c.quran)}`]
        .filter(Boolean).join(" · "),
    ] as [string, string])),
    ["Home language", label("language", p.language)],
    ["Support needs", many("needs", p.needs)],
    ["Note", p.needsNote ?? ""],
    ["Involvement", many("involvement", p.involvement)],
    ["Heard about us", label("heardFrom", p.heardFrom)],
    ["Contact", [label("contactBy", p.contactBy), label("contactTime", p.contactTime)].filter(Boolean).join(", ")],
  ];
  return rows.filter(([, v]) => v);
}
