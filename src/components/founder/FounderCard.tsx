import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { firstSentence, founderPhoto, founderService, messageFor, type FounderAudience, type FounderData } from "@/lib/founder";
import { unwrap } from "@/lib/finance";

/** "A word from our founder": a short card that opens the full "Meet the Founder" page. */
export default function FounderCard({ audience, onOpen, className = "mb-6" }: { audience: FounderAudience; onOpen: () => void; className?: string }) {
  const [d, setD] = useState<FounderData | null>(null);

  useEffect(() => {
    founderService.get().then((r) => setD(unwrap<FounderData>(r))).catch(() => {});
  }, []);

  if (!d) return null;
  const { primary, primaryUr } = messageFor(d, audience);
  const line = firstSentence(primary);

  return (
    <div className={`${className} overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-br from-[#fbf6ec] to-white shadow-nc`}>
      <div className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
        <img src={founderPhoto(d)} alt={d.name} className="h-14 w-14 flex-shrink-0 rounded-full bg-white object-cover ring-2 ring-gold ring-offset-2" />
        <div className="min-w-0 flex-1 basis-[200px]">
          <p className="flex flex-wrap items-baseline gap-x-2 text-[11px] font-semibold uppercase tracking-wider text-gold-dim">
            <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> A word from our founder</span>
            <span dir="rtl" lang="ur" className="urdu text-[12.5px] font-normal normal-case tracking-normal leading-[2]">بانی کا پیغام</span>
          </p>
          {line && (
            primaryUr
              ? <p dir="rtl" lang="ur" className="urdu mt-1 text-right text-[14px] leading-[2.2] text-nc-dark">{line}</p>
              : <p className="mt-1 font-serif text-[15px] italic leading-snug text-nc-dark">“{line}”</p>
          )}
          <p className="mt-1 text-[12px] text-nc-muted">{d.name} · {d.titleEn}</p>
        </div>
        <button className="btn-primary !py-2 text-[12.5px]" onClick={onOpen}>
          Meet the founder <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
