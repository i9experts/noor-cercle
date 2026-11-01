import { BiLabel } from "@/components/murabbi/IntroductionForm";
import {
  Bi, FIELDS, HARD_SKILLS, Introduction, LANGUAGE_LABELS, LEVEL_LABELS, QURAN_LABELS, SECTIONS, SKILL_LABELS, SOFT_SKILLS, SkillKey, dobLabel,
} from "@/lib/murabbiIntro";
import { cn } from "@/lib/utils";

const Empty = () => <span className="text-nc-muted">–</span>;
const Answer = ({ v }: { v?: string | null }) =>
  v && v.trim() ? <div dir="auto" className="whitespace-pre-wrap break-words text-[13.5px] text-nc-dark">{v}</div> : <Empty />;

function Item({ b, v, children }: { b: Bi; v?: string | null; children?: React.ReactNode }) {
  return (
    <div className="min-w-0 border-b border-border/60 py-2 last:border-0">
      <BiLabel b={b} className="mb-0.5" />
      {children ?? <Answer v={v} />}
    </div>
  );
}

function Block({ b, children }: { b: Bi; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-border bg-card">
      <h3 className="flex flex-wrap items-baseline justify-between gap-x-3 rounded-t-lg bg-plum/[0.06] px-4 py-2">
        <span className="text-[14px] font-semibold text-plum">{b.en}</span>
        <span dir="rtl" lang="ur" className="urdu text-[14px] leading-[2] text-plum">{b.ur}</span>
      </h3>
      <div className="px-4 py-1">{children}</div>
    </section>
  );
}

function Skills({ keys, p }: { keys: readonly SkillKey[]; p: Partial<Introduction> }) {
  return (
    <ul className="divide-y divide-border/60">
      {keys.map((k) => {
        const s = p.skills?.[k];
        return (
          <li key={k} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
            <BiLabel b={SKILL_LABELS[k]} className="min-w-0 flex-1" />
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11.5px] font-medium",
              s?.level ? "bg-plum/10 text-plum" : "bg-muted text-nc-muted")}>
              {s?.level ? LEVEL_LABELS[s.level].en : "Not answered"}
            </span>
            {s?.note && <div dir="auto" className="w-full text-[12.5px] text-nc-muted">{s.note}</div>}
          </li>
        );
      })}
    </ul>
  );
}

/** Read-only view of a murabbi's introduction (admins). */
export default function IntroductionView({ p }: { p: Partial<Introduction> | null }) {
  if (!p) return <div className="py-8 text-center text-[13px] text-nc-muted">No introduction yet.</div>;
  const exp = (p.experience ?? []).filter((e) => e.organisation || e.duration || e.responsibilities);
  const list = (a?: string[]) => (a ?? []).filter((x) => x.trim());
  const q = p.quran ? QURAN_LABELS[p.quran] : null;
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
      <Block b={SECTIONS.personal}>
        <Item b={FIELDS.fullName} v={p.fullName} />
        <Item b={FIELDS.fatherName} v={p.fatherName} />
        <Item b={FIELDS.dateOfBirth} v={dobLabel(p.dateOfBirth)} />
        <Item b={FIELDS.placeOfBirth} v={p.placeOfBirth} />
        <Item b={FIELDS.address} v={p.address} />
        <Item b={FIELDS.whatsapp} v={p.whatsapp} />
        <Item b={FIELDS.email} v={p.email} />
      </Block>
      <Block b={SECTIONS.vision}>
        <Item b={FIELDS.purpose} v={p.purpose} />
        <Item b={FIELDS.approach} v={p.approach} />
        <Item b={FIELDS.currentWork} v={p.currentWork} />
        <Item b={FIELDS.socialImpact} v={p.socialImpact} />
      </Block>
      <Block b={SECTIONS.education}>
        <Item b={FIELDS.quran}>
          {q ? (
            <div className="text-[13.5px] text-nc-dark">
              {q.en} <span dir="rtl" lang="ur" className="urdu text-nc-muted">{q.ur}</span>
              {p.quranNote && <span dir="auto" className="text-nc-muted"> · {p.quranNote}</span>}
            </div>
          ) : <Answer v={p.quranNote} />}
        </Item>
        <Item b={FIELDS.school} v={p.school} />
        <Item b={FIELDS.college} v={p.college} />
        <Item b={FIELDS.courses} v={p.courses} />
        <Item b={FIELDS.specialisation} v={p.specialisation} />
      </Block>
      <Block b={SECTIONS.experience}>
        {exp.length === 0 ? <div className="py-2"><Empty /></div> : (
          <ol className="divide-y divide-border/60">
            {exp.map((e, i) => (
              <li key={i} className="py-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span dir="auto" className="font-medium text-nc-dark">{i + 1}. {e.organisation || "–"}</span>
                  {e.duration && <span dir="auto" className="text-[12px] text-nc-muted">{e.duration}</span>}
                </div>
                {e.responsibilities && <div dir="auto" className="mt-0.5 whitespace-pre-wrap text-[12.5px] text-nc-dark">{e.responsibilities}</div>}
              </li>
            ))}
          </ol>
        )}
      </Block>
      <Block b={SECTIONS.soft}>
        <Item b={FIELDS.languages}>
          {p.languages?.length ? (
            <div className="flex flex-wrap gap-1">
              {p.languages.map((l) => <span key={l} className="rounded-full bg-teal-lt px-2 py-0.5 text-[11.5px] font-medium text-teal">{LANGUAGE_LABELS[l]?.en ?? l}</span>)}
              {p.languagesNote && <span dir="auto" className="w-full text-[12.5px] text-nc-muted">{p.languagesNote}</span>}
            </div>
          ) : <Answer v={p.languagesNote} />}
        </Item>
        <Skills keys={SOFT_SKILLS} p={p} />
      </Block>
      <Block b={SECTIONS.hard}>
        <Skills keys={HARD_SKILLS} p={p} />
      </Block>
      <Block b={SECTIONS.religious}>
        <Item b={FIELDS.islahi} v={p.islahi} />
        <Item b={FIELDS.tabligh} v={p.tabligh} />
        <Item b={FIELDS.political} v={p.political} />
      </Block>
      <Block b={SECTIONS.self}>
        {([FIELDS.strengths, FIELDS.weaknesses] as const).map((b, n) => {
          const items = list(n === 0 ? p.strengths : p.weaknesses);
          return (
            <Item key={b.en} b={b}>
              {items.length ? (
                <ol className="list-decimal space-y-0.5 pl-5 text-[13px] text-nc-dark">
                  {items.map((x, i) => <li key={i} dir="auto">{x}</li>)}
                </ol>
              ) : <Empty />}
            </Item>
          );
        })}
      </Block>
    </div>
  );
}
