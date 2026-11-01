// The printable certificate for a marketplace training (one without a tier certificate PDF).

export interface TrainingCertificateData {
  name: string;
  title: string;
  titleUr?: string;
  number: string;
  issuedAt: string | null;
  badge?: string;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const dateLabel = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");

/** Opens a standalone A4 page with the certificate and the print dialog. */
export function printTrainingCertificate(c: TrainingCertificateData) {
  const w = window.open("", "_blank", "width=1100,height=800");
  if (!w) return;
  w.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(c.title)} · ${esc(c.name)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Caveat:wght@600&display=swap">
<style>
@page { size: A4 landscape; margin: 0 }
* { box-sizing: border-box }
body { margin: 0; font-family: Georgia, serif; color: #361a2c; -webkit-print-color-adjust: exact; print-color-adjust: exact }
.c { width: 297mm; height: 210mm; padding: 14mm; background: #fffdf8 }
.f { height: 100%; border: 3px solid #691c46; outline: 1.5px solid #c79446; outline-offset: -9px; border-radius: 6px; padding: 14mm 18mm;
     display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center }
.u { font-family: "Noto Nastaliq Urdu", serif; direction: rtl; line-height: 2.1 }
h1 { margin: 0; font-size: 34px; color: #691c46 }
.en { margin: 0; font-size: 14px; color: #74646d; letter-spacing: .04em }
.name { font-family: Caveat, cursive; font-size: 48px; color: #691c46; margin: 2mm 0; border-bottom: 1.5px solid #c79446; padding: 0 12mm }
.foot { display: flex; width: 100%; justify-content: space-between; align-items: flex-end; font-size: 13px; color: #74646d }
.badge { border: 1.5px solid #c79446; border-radius: 999px; padding: 2px 14px; color: #691c46 }
</style></head><body><div class="c"><div class="f">
<div><p class="en">NOOR CIRCLES · A CIRCLE OF LIGHT IN EVERY NEIGHBOURHOOD</p><h1>Certificate of Completion</h1>
<p class="u" style="font-size:20px;margin:1mm 0 0">سندِ تکمیل</p></div>
<div><p class="en">This certifies that</p><div class="name">${esc(c.name)}</div>
<p class="en" style="margin-top:3mm">has completed the training</p>
<p style="font-size:26px;color:#691c46;margin:2mm 0">${esc(c.title)}</p>
${c.titleUr ? `<p class="u" style="font-size:18px;margin:0">${esc(c.titleUr)}</p>` : ""}</div>
<div class="foot"><span>${esc(c.number)}<br>${esc(dateLabel(c.issuedAt))}</span>${c.badge ? `<span class="badge">${esc(c.badge)}</span>` : "<span></span>"}<span>Noor Circles team</span></div>
</div></div><script>document.fonts.ready.then(() => setTimeout(() => window.print(), 300));</script></body></html>`);
  w.document.close();
}
