// Photos straight from a phone are often 3–12 MB. Shrinking them in the
// browser first makes uploads quick on mobile data and keeps them under
// the server's 5 MB limit.

const MAX_SIDE = 1024;
const SMALL_ENOUGH = 300 * 1024;

function decode(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This photo can’t be read. Please choose a JPG or PNG.')); };
    img.src = url;
  });
}

/** A JPEG no bigger than 1024 px on its longest side (small JPG/PNG/WebP files are left as they are). */
export async function shrinkImage(file: File): Promise<File> {
  const supported = /^image\/(jpeg|png|webp)$/.test(file.type);
  if (supported && file.size <= SMALL_ENOUGH) return file;
  const img = await decode(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.fillStyle = '#ffffff'; // transparent PNGs get a white background as JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
}

/** The reason an upload failed, in words a person can act on. */
export function uploadError(err: unknown): string {
  const e = err as { response?: { status?: number; data?: { message?: string | string[] } }; message?: string };
  const m = e?.response?.data?.message;
  if (Array.isArray(m)) return m[0];
  if (m) return m;
  if (e?.response?.status === 413) return 'That photo is too large. Please choose a smaller one.';
  if (!e?.response && e?.message && !/network/i.test(e.message)) return e.message;
  return 'Please check your connection and try again.';
}
