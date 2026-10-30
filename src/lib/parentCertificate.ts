// Certificate data and the printable page, shared by the parent course page and the admin page.

export interface ParentCertificateData {
  name: string;
  number: string;
  issuedOn: string | null;
  title: string;
  titleEn: string;
  body: string;
  bodyEn: string;
  line: string;
  dua: string;
  signedBy: string;
  badge: string;
  badgeEn: string;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
export const dateLabel = (d: string | null) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");

/** A standalone page for printing (the team prints it and sends it home with the child). */
export function printParentCertificate(c: ParentCertificateData) {
  const w = window.open("", "_blank", "width=1100,height=800");
  if (!w) return;
  w.document.write(`<!doctype html><html lang="ur"><head><meta charset="utf-8"><title>${esc(c.titleEn)} · ${esc(c.name)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Amiri:wght@400;700&family=Caveat:wght@600&display=swap">
<style>
@page { size: A4 landscape; margin: 0 }
* { box-sizing: border-box }
body { margin: 0; font-family: Georgia, serif; color: #361a2c; -webkit-print-color-adjust: exact; print-color-adjust: exact }
.c { width: 297mm; height: 210mm; padding: 14mm; background: #fffdf8 }
.f { height: 100%; border: 3px solid #691c46; outline: 1.5px solid #c79446; outline-offset: -9px; border-radius: 6px; padding: 12mm 18mm;
     display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center }
.u { font-family: "Noto Nastaliq Urdu", serif; direction: rtl; line-height: 2.1 }
.ar { font-family: Amiri, serif; direction: rtl; font-size: 20px; color: #8a5c1c }
h1 { margin: 0; font-size: 34px; color: #691c46 }
.en { margin: 0; font-size: 14px; color: #74646d; letter-spacing: .04em }
.name { font-family: Caveat, cursive; font-size: 46px; color: #691c46; margin: 2mm 0; border-bottom: 1.5px solid #c79446; padding: 0 12mm }
.foot { display: flex; width: 100%; justify-content: space-between; align-items: flex-end; font-size: 13px; color: #74646d }
.badge { border: 1.5px solid #c79446; border-radius: 999px; padding: 2px 14px; color: #691c46 }
</style></head><body><div class="c"><div class="f">
<div><p class="en">NOOR CIRCLES · A CIRCLE OF LIGHT IN EVERY NEIGHBOURHOOD</p><h1 class="u">${esc(c.title)}</h1><p class="en">${esc(c.titleEn)}</p></div>
<div><div class="name">${esc(c.name)}</div><p class="u" style="font-size:17px;max-width:210mm;margin:2mm auto">${esc(c.body.replace("{name}", c.name))}</p>
<p class="en" style="max-width:200mm;margin:0 auto">${esc(c.bodyEn.replace("{name}", c.name))}</p></div>
<div><p class="u" style="font-size:20px;font-weight:700;color:#691c46;margin:0">${esc(c.line)}</p><p class="ar" style="margin:1mm 0 0">${esc(c.dua)}</p></div>
<div class="foot"><span>${esc(c.number)}<br>${esc(dateLabel(c.issuedOn))}</span><span class="badge u">${esc(c.badge)} · ${esc(c.badgeEn)}</span><span class="u">${esc(c.signedBy)}</span></div>
</div></div><script>document.fonts.ready.then(() => setTimeout(() => window.print(), 300));</script></body></html>`);
  w.document.close();
}
