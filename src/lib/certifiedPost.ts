// Social media announcement for a murabbi who has earned their certificate:
// a square-ish image (1080×1350, for Instagram, Facebook and WhatsApp) and a caption.

export interface CertifiedPostData {
  name: string;
  courseTitle: string;          // "Asaas Murabbi Training"
  courseTitleUr?: string;
  badge: string;                // "Certified Asaas Murabbi"
  certificateNumber: string;
  issuedAt: string | null;
  lessonsCompleted: number;
  lessonsTotal: number;
  listenMinutes: number;
  assessmentBest: number | null;
  reflectionApproved: boolean;
  flipCharts: { studied: number; total: number } | null;
  journal: { pagesDone: number; totalPages: number } | null;
  practical: number | null;     // out of 18
}

const MAROON = "#691c46";
const GOLD = "#c79446";
const INK = "#361a2c";
const MUTED = "#74646d";
const CREAM = "#fffdf8";

export const hoursLabel = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
};
const longDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

/** The achievements shown on the image and in the caption (only the ones that apply). */
export function achievements(d: CertifiedPostData) {
  const out: { value: string; label: string; labelUr: string }[] = [
    { value: `${d.lessonsCompleted}/${d.lessonsTotal}`, label: "audio lessons heard", labelUr: "آڈیو اسباق" },
    { value: hoursLabel(d.listenMinutes), label: "of focused listening", labelUr: "سماعت" },
  ];
  if (d.assessmentBest != null) out.push({ value: `${d.assessmentBest}%`, label: "final assessment", labelUr: "حتمی جائزہ" });
  if (d.reflectionApproved) out.push({ value: "✓", label: "reflection approved", labelUr: "تحریری غور و فکر" });
  if (d.flipCharts?.total) out.push({ value: `${d.flipCharts.studied}/${d.flipCharts.total}`, label: "flip charts studied", labelUr: "فلپ چارٹس" });
  if (d.journal?.totalPages) out.push({ value: `${d.journal.pagesDone}/${d.journal.totalPages}`, label: "Noor Journal pages", labelUr: "نور جرنل صفحات" });
  if (d.practical != null) out.push({ value: `${d.practical}/18`, label: "practical score", labelUr: "عملی جائزہ" });
  return out.slice(0, 6);
}

/** English then Urdu, ready to paste. */
export function postCaption(d: CertifiedPostData) {
  const a = achievements(d);
  const en = [
    `🌙 Mubarak, ${d.name}!`,
    ``,
    `We are delighted to announce that ${d.name} has completed the ${d.courseTitle} and is now a ${d.badge}.`,
    ``,
    ...a.map((x) => `✅ ${x.value === "✓" ? x.label[0].toUpperCase() + x.label.slice(1) : `${x.value} ${x.label}`}`),
    ``,
    `May Allah accept this effort and make it a means of light for the children of our neighbourhood. Ameen.`,
    ``,
    `Would you like to lead a circle too? Register your interest at noorcircles.com`,
    ``,
    `#NoorCircles #AsaasMurabbi #Tarbiyah #CircleOfLight`,
  ];
  const ur = [
    `🌙 مبارک ہو، ${d.name}!`,
    ``,
    `ہمیں یہ اعلان کرتے ہوئے خوشی ہو رہی ہے کہ ${d.name} نے ${d.courseTitleUr || d.courseTitle} مکمل کر لی ہے اور اب سند یافتہ اساس مربی ہیں۔`,
    ``,
    `اللہ تعالیٰ اس محنت کو قبول فرمائے اور اسے ہمارے محلے کے بچوں کے لیے نور کا ذریعہ بنائے۔ آمین۔`,
    ``,
    `آپ بھی مربی بننا چاہتے ہیں؟ noorcircles.com پر رجسٹر کریں۔`,
  ];
  return `${en.join("\n")}\n\n—\n\n${ur.join("\n")}`;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function fitText(ctx: CanvasRenderingContext2D, text: string, font: (size: number) => string, start: number, maxWidth: number) {
  let size = start;
  ctx.font = font(size);
  while (size > 20 && ctx.measureText(text).width > maxWidth) { size -= 2; ctx.font = font(size); }
  return size;
}

/** Draws the announcement on a 1080×1350 canvas. */
export async function drawCertifiedPost(canvas: HTMLCanvasElement, d: CertifiedPostData) {
  const W = 1080, H = 1350;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  await Promise.all([
    document.fonts.load('400 40px "DM Serif Display"'),
    document.fonts.load('italic 400 27px "DM Serif Display"'),
    document.fonts.load('500 30px "DM Sans"'),
    document.fonts.load('700 90px "Caveat"'),
    document.fonts.load('400 40px "Noto Nastaliq Urdu"', "مبارک"),
  ]).catch(() => {});
  const logo = await loadImage("/brand/noor-circles-logo-horizontal.svg");

  // Background, frame
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 380, 40, W / 2, 380, 620);
  glow.addColorStop(0, "rgba(199,148,70,0.16)"); glow.addColorStop(1, "rgba(199,148,70,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = MAROON; ctx.lineWidth = 18; ctx.strokeRect(9, 9, W - 18, H - 18);
  ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.strokeRect(38, 38, W - 76, H - 76);

  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";

  // Logo
  if (logo) {
    const lw = 360, lh = (logo.height / logo.width) * lw || 90;
    ctx.drawImage(logo, (W - lw) / 2, 78, lw, lh);
  } else {
    ctx.fillStyle = MAROON; ctx.font = '600 34px "DM Sans", sans-serif'; ctx.fillText("NOOR CIRCLES", W / 2, 130);
  }

  // Heading
  ctx.fillStyle = GOLD; ctx.font = '600 24px "DM Sans", sans-serif';
  ctx.fillText("C E R T I F I E D   ·   M U B A R A K", W / 2, 248);
  ctx.fillStyle = MAROON; ctx.font = '400 58px "Noto Nastaliq Urdu", serif';
  ctx.fillText("مبارک ہو", W / 2, 345);

  // Name
  ctx.fillStyle = MAROON;
  fitText(ctx, d.name, (s) => `700 ${s}px "Caveat", cursive`, 112, W - 200);
  ctx.fillText(d.name, W / 2, 495);
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2 - 260, 525); ctx.lineTo(W / 2 + 260, 525); ctx.stroke();

  ctx.fillStyle = MUTED; ctx.font = '400 30px "DM Sans", sans-serif';
  ctx.fillText(`has completed the ${d.courseTitle} and is now a`, W / 2, 585);
  ctx.fillStyle = MAROON;
  fitText(ctx, d.badge, (s) => `400 ${s}px "DM Serif Display", serif`, 60, W - 180);
  ctx.fillText(d.badge, W / 2, 660);

  // Achievements (2 columns × up to 3 rows)
  const a = achievements(d);
  const cols = 2, cw = 430, chh = 120, gx = 30, gy = 22;
  const rows = Math.ceil(a.length / cols);
  const top = 710, left = (W - (cols * cw + gx)) / 2;
  a.forEach((x, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    const lastAlone = a.length % 2 === 1 && i === a.length - 1;
    const bx = lastAlone ? (W - cw) / 2 : left + c * (cw + gx), by = top + r * (chh + gy);
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#e6d6c4"; ctx.lineWidth = 2;
    roundRect(ctx, bx, by, cw, chh, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = GOLD; ctx.fillRect(bx, by + 14, 6, chh - 28);
    ctx.fillStyle = MAROON; ctx.font = '400 50px "DM Serif Display", serif';
    ctx.fillText(x.value, bx + cw / 2, by + 58);
    ctx.fillStyle = MUTED; ctx.font = '500 23px "DM Sans", sans-serif';
    ctx.fillText(x.label, bx + cw / 2, by + 95);
  });

  // Du'a and footer
  const fy = top + rows * chh + (rows - 1) * gy + 48;
  ctx.fillStyle = INK; ctx.font = 'italic 400 27px "DM Serif Display", serif';
  ctx.fillText("May Allah accept this effort and make it a light", W / 2, fy);
  ctx.fillText("for the children of our neighbourhood. Ameen.", W / 2, fy + 38);

  ctx.fillStyle = MUTED; ctx.font = '500 21px "DM Sans", sans-serif';
  ctx.fillText(`Certificate ${d.certificateNumber}${d.issuedAt ? `  ·  ${longDate(d.issuedAt)}` : ""}`, W / 2, H - 92);
  ctx.fillStyle = MAROON; ctx.font = '600 22px "DM Sans", sans-serif';
  ctx.fillText("A circle of light in every neighbourhood  ·  noorcircles.com", W / 2, H - 60);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "murabbi";
}
