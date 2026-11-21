import { useEffect, useRef, useState } from "react";
import { Copy, Download, FileDown, Printer } from "lucide-react";
import Modal from "@/components/shared/Modal";
import { useToast } from "@/hooks/use-toast";
import { trainingService } from "@/services/api.service";
import { printTrainingCertificate } from "@/lib/trainingCertificate";
import { CertifiedPostData, drawCertifiedPost, postCaption, slug } from "@/lib/certifiedPost";

/**
 * For a certified murabbi: print their certificate, and make the announcement
 * post (image + caption in English and Urdu) for social media.
 */
export default function CertifiedShareModal({ data, userId, tier, onClose }: {
  data: CertifiedPostData; userId: string; tier: number | null; onClose: () => void;
}) {
  const { toast } = useToast();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [caption, setCaption] = useState(() => postCaption(data));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setReady(false);
    if (canvas.current) drawCertifiedPost(canvas.current, data).then(() => setReady(true));
  }, [data]);

  function downloadImage() {
    canvas.current?.toBlob((b) => {
      if (!b) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `certified-${slug(data.name)}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, "image/png");
  }

  async function copyCaption() {
    try { await navigator.clipboard.writeText(caption); toast({ title: "Caption copied." }); }
    catch { toast({ variant: "destructive", title: "Couldn’t copy. Select the text and copy it instead." }); }
  }

  async function certificate() {
    // Tier courses have an official PDF; other trainings print from the browser.
    if (tier == null) {
      printTrainingCertificate({ name: data.name, title: data.courseTitle, titleUr: data.courseTitleUr, number: data.certificateNumber, issuedAt: data.issuedAt, badge: data.badge });
      return;
    }
    setBusy(true);
    try {
      const res = await trainingService.downloadCertificateFor(userId, tier);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const w = window.open(url, "_blank");
      if (!w) {
        const a = document.createElement("a");
        a.href = url; a.download = `certificate-${slug(data.name)}.pdf`; a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast({ variant: "destructive", title: "Could not open the certificate." });
    } finally { setBusy(false); }
  }

  return (
    <Modal open onClose={onClose} title={`Mubarak, ${data.name}`} subtitle={`${data.badge} · ${data.certificateNumber}`}>
      <div className="space-y-5">
        <section>
          <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-plum">Certificate</h4>
          <button className="btn-gold flex items-center gap-2 !py-2 text-[12.5px]" disabled={busy} onClick={certificate}>
            {tier == null ? <Printer className="h-3.5 w-3.5" /> : <FileDown className="h-3.5 w-3.5" />}
            {busy ? "Opening…" : tier == null ? "Print certificate" : "Open certificate (PDF) to print"}
          </button>
        </section>

        <section>
          <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-plum">Announcement post</h4>
          <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
            <canvas ref={canvas} className="block h-auto w-full" aria-label={`Announcement image for ${data.name}`} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="btn-primary flex items-center gap-2 !py-2 text-[12.5px]" disabled={!ready} onClick={downloadImage}>
              <Download className="h-3.5 w-3.5" /> {ready ? "Download image" : "Preparing…"}
            </button>
          </div>
          <label className="mt-4 block text-[12.5px] text-nc-muted">Caption (edit before copying if you like)
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={12} dir="auto"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] leading-relaxed text-nc-dark outline-none focus:border-plum" />
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button className="btn-outline flex items-center gap-2 !py-2 text-[12.5px]" onClick={copyCaption}><Copy className="h-3.5 w-3.5" /> Copy caption</button>
            <span className="text-[12px] text-nc-muted">Please check with the murabbi before posting their name publicly.</span>
          </div>
        </section>
      </div>
    </Modal>
  );
}
