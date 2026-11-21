// The official logo and the founder's signature, shared by every printable certificate.

export const SIGNATORY = { name: "Atiq ur Rehman Ayubi", nameUr: "عتیق الرحمٰن ایوبی", title: "Founder, Noor Circles", titleUr: "بانی، نور سرکلز" };

/** Absolute URLs, because the certificate opens in its own window. */
export const certLogoUrl = () => `${window.location.origin}/brand/noor-circles-logo-horizontal.svg`;
export const certSignatureUrl = () => `${window.location.origin}/brand/signature-atiq-ur-rehman.png`;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** CSS for the logo and signature blocks. */
export const CERT_BRAND_CSS = `
.logo { height: 22mm; width: auto; display: block; margin: 0 auto 2mm }
.sig { text-align: center; min-width: 62mm }
.sig img { height: 19mm; width: auto; display: block; margin: 0 auto 1mm }
.sig .ln { border-top: 1px solid #999; padding-top: 1.2mm }
.sig b { display: block; color: #691c46; font-size: 13px }
.sig i { font-size: 11.5px; color: #74646d }
`;

export const certLogoHtml = () => `<img class="logo" src="${certLogoUrl()}" alt="Noor Circles">`;
export const certSignatureHtml = () =>
  `<div class="sig"><img src="${certSignatureUrl()}" alt="Signature"><div class="ln"><b>${esc(SIGNATORY.name)}</b><i>${esc(SIGNATORY.title)}</i></div></div>`;

/** Print once the fonts and both images have loaded. */
export const CERT_PRINT_SCRIPT = `<script>Promise.all([document.fonts.ready, ...[...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))]).then(() => setTimeout(() => window.print(), 300));</script>`;
