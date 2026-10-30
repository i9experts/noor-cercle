import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MailX, MailCheck } from "lucide-react";
import { emailService } from "@/services/api.service";
import { apiError, unwrap } from "@/lib/finance";

const LABELS: Record<string, string> = {
  "training-reminders": "training reminders",
  announcements: "announcements and group emails from the Noor Circles team",
};

/** /email/unsubscribe?t=… from the link at the bottom of an optional email. */
export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get("t") ?? "";
  const [state, setState] = useState<{ email: string; category: string; subscribed: boolean } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function apply(subscribe: boolean) {
    setBusy(true);
    try {
      setState(unwrap(await emailService.unsubscribe(token, subscribe)));
      setError("");
    } catch (err) {
      setError(apiError(err, "This link is not valid."));
    } finally {
      setBusy(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { document.title = "Email preferences · Noor Circles"; apply(false); }, []);

  const what = state ? LABELS[state.category] ?? "these emails" : "";
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-nc">
        <img src="/brand/noor-circles-logo-horizontal.svg" alt="Noor Circles" className="mx-auto mb-6 h-9" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        {error ? (
          <p className="text-[14px] text-nc-dark">{error}</p>
        ) : !state ? (
          <p className="text-[13px] text-nc-muted">One moment…</p>
        ) : state.subscribed ? (
          <>
            <MailCheck className="mx-auto mb-3 h-9 w-9 text-nc-green" />
            <h1 className="font-serif text-[22px] text-nc-dark">You’re subscribed again</h1>
            <p className="mt-2 text-[13.5px] text-nc-muted">{state.email} will get {what} again.</p>
          </>
        ) : (
          <>
            <MailX className="mx-auto mb-3 h-9 w-9 text-plum" />
            <h1 className="font-serif text-[22px] text-nc-dark">You’re unsubscribed</h1>
            <p className="mt-2 text-[13.5px] text-nc-muted">
              {state.email} won’t get {what} any more. Account, safety and receipt emails still arrive.
            </p>
            <button className="btn-outline mx-auto mt-5" disabled={busy} onClick={() => apply(true)}>Undo: keep sending them</button>
          </>
        )}
      </div>
    </div>
  );
}
