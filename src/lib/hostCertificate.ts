// The Noor Circles Host certificate (Asaas for Hosts): same look as the parent certificate.
import { ParentCertificateData, printParentCertificate } from "@/lib/parentCertificate";

export interface HostCertificateInput {
  name: string;
  /** NCH-… */
  number: string;
  /** When it was issued (an ISO instant or 'YYYY-MM-DD'). */
  issuedOn: string | null;
}

/** The certificate's wording, ready for the card on screen or the printable page. */
export function hostCertificateData(c: HostCertificateInput): ParentCertificateData {
  return {
    name: c.name,
    number: c.number,
    // dateLabel reads a calendar date; the API sends an instant.
    issuedOn: c.issuedOn ? new Date(new Date(c.issuedOn).getTime() + 5 * 3600_000).toISOString().slice(0, 10) : null,
    title: "نور سرکلز میزبان",
    titleEn: "Noor Circles Host",
    body: "یہ سند {name} کو پیش کی جاتی ہے، جنہوں نے \"میزبانوں کا Asaas\" مکمل کیا اور اپنا گھر بچوں کے لیے روشنی کا حلقہ بنانے کا وعدہ کیا۔",
    bodyEn: "Presented to {name}, who has completed Asaas for Hosts and opened their home as a circle of light for the children of the neighbourhood.",
    line: "ہر محلے میں روشنی کا ایک حلقہ",
    dua: "رَبِّ أَنْزِلْنِي مُنْزَلًا مُبَارَكًا وَأَنْتَ خَيْرُ الْمُنْزِلِينَ",
    signedBy: "عتیق الرحمٰن ایوبی · Noor Circles",
    badge: "نور میزبان",
    badgeEn: "Noor Host",
  };
}

/** Opens the printable A4 certificate (the person can print or save it as PDF). */
export function printHostCertificate(c: HostCertificateInput) {
  printParentCertificate(hostCertificateData(c));
}
