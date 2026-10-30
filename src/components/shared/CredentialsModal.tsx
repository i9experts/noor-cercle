import { useState } from "react";
import { Check, Copy, KeyRound, MessageCircle } from "lucide-react";
import Modal from "@/components/shared/Modal";
import { whatsappLink } from "@/lib/contact";

export interface IssuedCredentials {
  account: { fullName: string; email: string; role: string; phone?: string | null };
  credentials: { email: string; password: string; loginUrl: string };
  /** A welcome / reset email with a set-password link went out too. */
  emailed?: boolean;
}

/** The message an admin sends the person, in English and Urdu. */
export function credentialsMessage({ account, credentials }: IssuedCredentials) {
  const first = account.fullName.split(" ")[0];
  return [
    `Assalam-o-Alaikum ${first},`,
    "",
    `Your Noor Circles ${account.role === "parent" ? "parent" : "murabbi"} account is ready.`,
    "",
    `Sign in: ${credentials.loginUrl}`,
    `Email: ${credentials.email}`,
    `Temporary password: ${credentials.password}`,
    "",
    "You'll be asked to choose your own password when you first sign in.",
    "",
    "آپ کا Noor Circles اکاؤنٹ تیار ہے۔ اوپر دیے گئے ای میل اور عارضی پاس ورڈ سے سائن اِن کریں، پھر اپنا نیا پاس ورڈ بنائیں۔",
    "",
    "JazakAllah khair, Noor Circles team",
  ].join("\n");
}

function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/70 py-2.5 last:border-0">
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-nc-muted">{label}</div>
        <div className={`truncate text-[14px] text-nc-dark ${mono ? "font-mono font-semibold tracking-wide" : ""}`}>{value}</div>
      </div>
      <button
        className="flex flex-shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-[12px] text-nc-dark hover:border-teal hover:text-teal"
        onClick={() => navigator.clipboard?.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
        aria-label={`Copy ${label.toLowerCase()}`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/** Shows a newly issued temporary password once, ready to share with the person. */
export default function CredentialsModal({ issued, title, onClose }: { issued: IssuedCredentials | null; title?: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!issued) return null;
  const message = credentialsMessage(issued);
  const phone = issued.account.phone;

  return (
    <Modal open onClose={onClose} title={title ?? "Account ready"} subtitle={`Share these sign-in details with ${issued.account.fullName} personally.`}>
      <div className="mb-4 flex items-start gap-3 rounded-md border border-gold/40 bg-gold/10 px-3.5 py-2.5 text-[12.5px] text-nc-dark">
        <KeyRound className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-dim" />
        <span>This password is shown only now. They’ll choose their own password the first time they sign in. If it’s lost, use “Reset password”.</span>
      </div>
      {issued.emailed && (
        <p className="mb-3 rounded-md bg-nc-green-lt px-3.5 py-2 text-[12.5px] text-nc-dark">
          We’ve also emailed <span className="font-semibold">{issued.credentials.email}</span> a link to choose their own password, so they can use either.
        </p>
      )}
      <div className="mb-5 rounded-md border border-border px-4">
        <CopyRow label="Sign-in page" value={issued.credentials.loginUrl} />
        <CopyRow label="Email" value={issued.credentials.email} />
        <CopyRow label="Temporary password" value={issued.credentials.password} mono />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {phone && (
          <a href={whatsappLink(phone, message)} target="_blank" rel="noreferrer"
            className="btn-primary flex-1 justify-center !bg-nc-green hover:!brightness-95">
            <MessageCircle className="h-4 w-4" /> Send on WhatsApp
          </a>
        )}
        <button className="btn-outline flex-1 justify-center"
          onClick={() => navigator.clipboard?.writeText(message).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Message copied" : "Copy message"}
        </button>
      </div>
      <button className="mt-3 w-full text-center text-[12.5px] text-nc-muted hover:text-nc-dark" onClick={onClose}>Done</button>
    </Modal>
  );
}
