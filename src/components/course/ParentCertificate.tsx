import { Printer } from "lucide-react";
import { ParentCertificateData, dateLabel, printParentCertificate } from "@/lib/parentCertificate";

export type { ParentCertificateData };

/** The certificate as a card on screen, with a print button. */
export default function ParentCertificate({ data, printLabel = "Print" }: { data: ParentCertificateData; printLabel?: string }) {
  return (
    <div className="rounded-xl border-2 border-plum bg-[#fffdf8] p-5 text-center text-[#361a2c] shadow-nc outline outline-1 -outline-offset-[7px] outline-gold sm:p-8">
      <div className="text-[11px] tracking-[0.12em] text-[#74646d]">NOOR CIRCLES</div>
      <div dir="rtl" lang="ur" className="urdu text-[24px] leading-[2] text-plum sm:text-[28px]">{data.title}</div>
      <div className="font-[Caveat,cursive] text-[34px] leading-tight text-plum">{data.name}</div>
      <p dir="rtl" lang="ur" className="urdu mx-auto mt-2 max-w-xl text-[15px] leading-[2.1]">{data.body.replace("{name}", data.name)}</p>
      <p dir="rtl" lang="ur" className="urdu mt-2 text-[17px] font-bold leading-[2] text-plum">{data.line}</p>
      <p dir="rtl" lang="ar" className="arabic text-[18px] leading-[1.9] text-gold-dim">{data.dua}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] text-[#74646d]">
        <span>{data.number}</span>
        {data.issuedOn && <span>{dateLabel(data.issuedOn)}</span>}
        <span dir="rtl" className="urdu rounded-full border border-gold px-3 leading-[1.9] text-plum">{data.badge} · {data.badgeEn}</span>
      </div>
      <button className="btn-outline mx-auto mt-4 inline-flex items-center gap-1.5 !py-1.5 text-[12.5px]" onClick={() => printParentCertificate(data)}>
        <Printer className="h-4 w-4" /> {printLabel}
      </button>
    </div>
  );
}
