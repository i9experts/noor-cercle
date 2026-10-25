import { useEffect, useState } from "react";
import { Copy, ExternalLink, MessageCircle, RefreshCw } from "lucide-react";
import Modal from "@/components/shared/Modal";
import { useToast } from "@/hooks/use-toast";
import { familyService } from "@/services/api.service";
import { apiError, apiMessage, unwrap } from "@/lib/finance";

/** wa.me needs digits only, in international form (local numbers start with 0). */
function waNumber(phone: string) {
  let d = (phone || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("0")) d = "92" + d.slice(1);
  return d;
}

/** Shows a family's private page link with copy / WhatsApp / rotate. */
export default function FamilyLinkModal({ parent, onClose }: {
  parent: { _id: string; fullName: string; phone?: string; whatsappNumber?: string | null } | null; onClose: () => void;
}) {
  const { toast } = useToast();
  const [url, setUrl]           = useState("");
  const [viewed, setViewed]     = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [confirm, setConfirm]   = useState(false);

  useEffect(() => {
    if (!parent) return;
    setUrl(""); setConfirm(false);
    familyService.getLink(parent._id)
      .then((r) => { const d = unwrap(r); setUrl(d.url); setViewed(d.lastViewedAt); })
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load the link.") }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parent]);

  if (!parent) return null;
  const first = parent.fullName.split(" ")[0];
  const message = `Assalam-o-Alaikum ${first}! Here is your private Noor Circles family page, where you can see your child's attendance, points, this week's lesson, a home activity and the circle calendar: ${url}\n\nPlease keep this link private.`;
  const number = waNumber(parent.whatsappNumber || parent.phone || "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied." });
    } catch {
      toast({ variant: "destructive", title: "Couldn’t copy. Select the link and copy it manually." });
    }
  }

  async function rotate() {
    setRotating(true);
    try {
      const r = await familyService.rotate(parent!._id);
      setUrl(unwrap(r).url);
      setViewed(null);
      toast({ title: apiMessage(r) });
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not create a new link.") });
    } finally {
      setRotating(false);
      setConfirm(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`${parent.fullName}’s family page`}
      subtitle="A private page for this family, no password needed. Anyone with the link can see it, so share it only with the family.">
      <div className="mb-3 break-all rounded-md border border-border bg-muted/50 px-3 py-2.5 font-mono text-[12px] text-nc-dark" aria-live="polite">
        {url || "Loading…"}
      </div>
      <div className="mb-5 text-[12px] text-nc-muted">
        {viewed ? `Last opened ${new Date(viewed).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}` : "Not opened yet"}
      </div>
      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button className="btn-outline inline-flex items-center justify-center gap-1.5" onClick={copy} disabled={!url}>
          <Copy className="h-4 w-4" /> Copy link
        </button>
        <a className={`btn-primary inline-flex items-center justify-center gap-1.5 ${!url || !number ? "pointer-events-none opacity-50" : ""}`}
          href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
          <MessageCircle className="h-4 w-4" /> Send on WhatsApp
        </a>
        <a className={`btn-outline inline-flex items-center justify-center gap-1.5 ${!url ? "pointer-events-none opacity-50" : ""}`} href={url} target="_blank" rel="noreferrer">
          <ExternalLink className="h-4 w-4" /> Preview
        </a>
      </div>
      <div className="rounded-md border border-border p-3">
        {confirm ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex-1 text-[12.5px] text-nc-dark">The current link will stop working. Continue?</span>
            <button className="btn-outline !py-1.5 text-[12.5px]" onClick={() => setConfirm(false)}>Cancel</button>
            <button className="btn-primary !py-1.5 text-[12.5px] disabled:opacity-50" onClick={rotate} disabled={rotating}>{rotating ? "Creating…" : "Create new link"}</button>
          </div>
        ) : (
          <button className="inline-flex items-center gap-1.5 text-[12.5px] text-nc-muted hover:text-nc-dark" onClick={() => setConfirm(true)}>
            <RefreshCw className="h-3.5 w-3.5" /> Link shared with the wrong person? Create a new one
          </button>
        )}
      </div>
    </Modal>
  );
}
