import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, ChevronDown, Feather, Quote } from "lucide-react";
import {
  RichText, blogHost, founderPhoto, founderService, messageFor, postDate,
  type BlogPost, type FounderAudience, type FounderData,
} from "@/lib/founder";
import { apiError, unwrap } from "@/lib/finance";

interface FounderProfileProps {
  audience: FounderAudience;
  /** Renders this content instead of loading the saved profile (the admin preview). */
  data?: FounderData;
  /** The blog's posts; loaded when not given. */
  posts?: BlogPost[];
}

/** "Meet the Founder": the founder's profile, shared by the murabbi and parent portals. */
export default function FounderProfile({ audience, data, posts }: FounderProfileProps) {
  const [loaded, setLoaded] = useState<FounderData | null>(null);
  const [loadedPosts, setLoadedPosts] = useState<BlogPost[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (data) return;
    founderService.get()
      .then((r) => setLoaded(unwrap<FounderData>(r)))
      .catch((err) => setError(apiError(err, "We couldn’t load this page right now. Please try again later.")));
  }, [data]);

  useEffect(() => {
    if (posts) return;
    founderService.posts()
      .then((r) => { const list = unwrap<BlogPost[]>(r); setLoadedPosts(Array.isArray(list) ? list : []); })
      .catch(() => {});
  }, [posts]);

  const d = data ?? loaded;
  if (error && !d) {
    return <div className="mx-auto max-w-4xl rounded-xl border border-border bg-card p-8 text-center text-[13.5px] text-nc-muted shadow-nc">{error}</div>;
  }
  if (!d) {
    return <div className="mx-auto max-w-4xl animate-pulse rounded-xl border border-border bg-card p-10 text-center text-[13px] text-nc-muted shadow-nc">Loading…</div>;
  }

  const parent = audience === "parent";
  const blogPosts = (posts ?? loadedPosts).slice(0, 3);
  const host = d.blogUrl ? blogHost(d.blogUrl) : "";
  const message = messageFor(d, audience);
  const vision = (d.vision ?? []).filter((v) => v.en || v.ur);

  return (
    <div className="page-animate mx-auto max-w-4xl space-y-6 sm:space-y-8">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-br from-[#fbf6ec] via-white to-plum-lt shadow-nc">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-plum/[0.06]" />
        <div className="relative flex flex-col items-center gap-6 px-5 py-8 text-center sm:px-10 sm:py-10 md:flex-row md:items-center md:gap-10 md:text-left">
          <div className="flex-shrink-0 rounded-full bg-gradient-to-br from-gold via-gold-lt to-gold p-1.5 shadow-lg">
            <img
              src={founderPhoto(d)}
              alt={d.name}
              className="h-40 w-40 rounded-full border-4 border-white bg-white object-cover sm:h-48 sm:w-48"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-dim">
              Meet the founder · <span dir="rtl" lang="ur" className="urdu normal-case tracking-normal">بانی سے ملیے</span>
            </p>
            <h1 className="mt-2 break-words font-serif text-[30px] leading-tight text-nc-dark sm:text-[38px]">{d.name}</h1>
            <p className="mt-1 text-[14.5px] font-medium text-plum">{d.titleEn}</p>
            {d.titleUr && <p dir="rtl" lang="ur" className="urdu text-[15px] leading-[2.2] text-plum md:text-left">{d.titleUr}</p>}
            {(d.taglineEn || d.taglineUr) && (
              <div className="mt-3 border-t border-gold/25 pt-3">
                {d.taglineEn && <p className="font-serif text-[16px] italic text-slate">{d.taglineEn}</p>}
                {d.taglineUr && <p dir="rtl" lang="ur" className="urdu text-[14.5px] leading-[2.2] text-nc-muted md:text-left">{d.taglineUr}</p>}
              </div>
            )}
            {d.blogUrl && (
              <a
                href={d.blogUrl}
                target="_blank"
                rel="noopener"
                className="btn-gold mt-5 !rounded-full !px-5 !py-2.5 shadow-md"
              >
                <Feather className="h-4 w-4" /> Read my blog <span aria-hidden>→</span> {host}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Quote ── */}
      {(d.quoteEn || d.quoteUr) && (
        <figure className="relative mx-auto max-w-3xl px-2 text-center sm:px-8">
          <Quote aria-hidden className="mx-auto mb-3 h-8 w-8 fill-gold/20 text-gold" />
          {parent ? (
            <>
              {d.quoteUr && <blockquote dir="rtl" lang="ur" className="urdu text-[22px] leading-[2.2] text-nc-dark sm:text-[26px]">{d.quoteUr}</blockquote>}
              {d.quoteEn && <p className="mt-2 font-serif text-[16px] italic text-nc-muted sm:text-[18px]">“{d.quoteEn}”</p>}
            </>
          ) : (
            <>
              {d.quoteEn && <blockquote className="font-serif text-[24px] leading-snug text-nc-dark sm:text-[30px]">“{d.quoteEn}”</blockquote>}
              {d.quoteUr && <p dir="rtl" lang="ur" className="urdu mt-3 text-[16px] leading-[2.2] text-nc-muted sm:text-[18px]">{d.quoteUr}</p>}
            </>
          )}
          <figcaption className="mt-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dim">— {d.name}</figcaption>
        </figure>
      )}

      {/* ── Story ── */}
      {(d.storyEn || d.storyUr) && (
        <Section en="My story" ur="میری کہانی">
          <Bilingual
            primary={parent ? d.storyUr : d.storyEn}
            secondary={parent ? d.storyEn : d.storyUr}
            primaryUr={parent}
            toggle={parent ? "Read in English" : "اردو میں پڑھیے"}
          />
        </Section>
      )}

      {/* ── Vision ── */}
      {vision.length > 0 && (
        <section>
          <SectionHeading en="Why Noor Circles" ur="نور سرکلز کیوں" />
          <div className="grid gap-4 sm:grid-cols-2">
            {vision.map((v, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-nc">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-plum font-serif text-[17px] text-gold">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  {v.en && <p className="break-words font-serif text-[18px] leading-snug text-nc-dark">{v.en}</p>}
                  {v.ur && <p dir="rtl" lang="ur" className="urdu mt-1 text-right text-[15px] leading-[2.2] text-plum">{v.ur}</p>}
                  {v.detailEn && <p className="mt-1 text-[13px] text-nc-muted">{v.detailEn}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── A message for you ── */}
      {(message.primary || message.secondary) && (
        <section>
          <SectionHeading en="A message for you" ur="آپ کے نام پیغام" />
          <article className="relative overflow-hidden rounded-2xl border border-gold/30 bg-[#fffcf6] px-5 py-7 shadow-nc sm:px-10 sm:py-10">
            <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-plum via-gold to-plum" />
            {message.primary && (
              <RichText
                text={message.primary}
                dir={message.primaryUr ? "rtl" : "ltr"}
                className={message.primaryUr ? "text-[17px] text-nc-dark" : "font-serif text-[17px] text-nc-dark sm:text-[18px]"}
              />
            )}
            {message.primary && message.secondary && (
              <div aria-hidden className="my-6 flex items-center gap-3 text-gold">
                <span className="h-px flex-1 bg-gold/30" />✦<span className="h-px flex-1 bg-gold/30" />
              </div>
            )}
            {message.secondary && (
              <RichText
                text={message.secondary}
                dir={message.primaryUr ? "ltr" : "rtl"}
                className="text-[14.5px] text-slate"
              />
            )}
            <div className="mt-8 flex items-center gap-3 border-t border-gold/25 pt-5">
              <img src={founderPhoto(d)} alt="" className="h-12 w-12 flex-shrink-0 rounded-full bg-white object-cover ring-2 ring-gold" />
              <div className="min-w-0">
                <p className="font-serif text-[19px] italic leading-tight text-nc-dark">{d.name}</p>
                <p className="text-[12.5px] text-nc-muted">{d.titleEn}</p>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* ── From the blog ── */}
      {blogPosts.length > 0 && (
        <section>
          <SectionHeading en="From the blog" ur="بلاگ سے" />
          <div className="grid gap-3 sm:grid-cols-3">
            {blogPosts.map((p) => (
              <a
                key={p.url}
                href={p.url}
                target="_blank"
                rel="noopener"
                className="group flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-nc transition hover:border-gold/60 hover:shadow-md"
              >
                <p className="break-words font-serif text-[16.5px] leading-snug text-nc-dark group-hover:text-plum">{p.title}</p>
                <p className="flex items-center justify-between text-[12px] text-nc-muted">
                  <span>{postDate(p.date)}</span>
                  <ArrowUpRight className="h-4 w-4 text-gold transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </p>
              </a>
            ))}
          </div>
          {d.blogUrl && (
            <a href={d.blogUrl} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-plum hover:underline">
              More on {host} <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
        </section>
      )}
    </div>
  );
}

function SectionHeading({ en, ur }: { en: string; ur: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline gap-x-2.5">
      <h2 className="font-serif text-[23px] text-nc-dark sm:text-[26px]">{en}</h2>
      <span className="text-gold" aria-hidden>·</span>
      <span dir="rtl" lang="ur" className="urdu text-[17px] leading-[2] text-plum">{ur}</span>
    </div>
  );
}

function Section({ en, ur, children }: { en: string; ur: string; children: ReactNode }) {
  return (
    <section>
      <SectionHeading en={en} ur={ur} />
      <div className="rounded-2xl border border-border bg-card px-5 py-6 shadow-nc sm:px-8 sm:py-8">{children}</div>
    </section>
  );
}

/** One text in the portal's main language, with the other language folded away below it. */
function Bilingual({ primary, secondary, primaryUr, toggle }: { primary: string; secondary: string; primaryUr: boolean; toggle: string }) {
  const [open, setOpen] = useState(false);
  const toggleUr = !primaryUr;
  return (
    <>
      {primary && <RichText text={primary} dir={primaryUr ? "rtl" : "ltr"} className={primaryUr ? "text-[16px] text-nc-dark" : "text-[15px] text-slate"} />}
      {secondary && (
        <div className={primary ? "mt-5 border-t border-border pt-4" : ""}>
          {primary && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="inline-flex items-center gap-1.5 rounded-full bg-plum-lt px-3.5 py-1.5 text-[13px] font-medium text-plum hover:bg-plum/10"
            >
              <span dir={toggleUr ? "rtl" : undefined} lang={toggleUr ? "ur" : undefined} className={toggleUr ? "urdu leading-[1.9]" : ""}>{toggle}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
          {(open || !primary) && (
            <RichText
              text={secondary}
              dir={primaryUr ? "ltr" : "rtl"}
              className={`${primary ? "mt-4" : ""} ${primaryUr ? "text-[14.5px] text-slate" : "text-[16px] text-nc-dark"}`}
            />
          )}
        </div>
      )}
    </>
  );
}
