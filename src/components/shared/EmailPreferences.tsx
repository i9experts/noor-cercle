import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { emailService } from "@/services/api.service";
import { apiError, apiMessage, unwrap } from "@/lib/finance";

const LABELS: Record<string, { title: string; text: string }> = {
  "training-reminders": { title: "Training reminders", text: "Nudges when your training is waiting, paused or near its due date, and, for parents, when a new Asaas module opens." },
  announcements: { title: "News and group emails", text: "Messages the Noor Circles team sends to murabbis or parents." },
};

/** Switches for the optional emails. Account, safety and receipt emails always go. */
export default function EmailPreferences({ only }: { only?: string[] }) {
  const { toast } = useToast();
  const [data, setData] = useState<{ email: string; categories: { key: string; on: boolean }[] } | null>(null);

  useEffect(() => {
    emailService.preferences().then((r) => setData(unwrap(r))).catch(() => {});
  }, []);

  async function toggle(key: string, on: boolean) {
    if (!data) return;
    const next = data.categories.map((c) => (c.key === key ? { ...c, on } : c));
    setData({ ...data, categories: next });
    try {
      const r = await emailService.setPreferences(Object.fromEntries(next.map((c) => [c.key, c.on])));
      toast({ title: apiMessage(r, "Saved.") });
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save.") });
    }
  }

  if (!data) return <div className="text-[12.5px] text-nc-muted">Loading…</div>;
  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-nc-muted">Emails go to <span className="font-medium text-nc-dark">{data.email}</span>. Account, safety and receipt emails always arrive.</p>
      {data.categories.filter((c) => !only || only.includes(c.key)).map((c) => (
        <label key={c.key} className="flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-2.5">
          <input type="checkbox" checked={c.on} onChange={(e) => toggle(c.key, e.target.checked)} className="mt-1 accent-[hsl(var(--teal))]" />
          <span>
            <span className="block text-[13.5px] font-medium text-nc-dark">{LABELS[c.key]?.title ?? c.key}</span>
            <span className="block text-[12px] text-nc-muted">{LABELS[c.key]?.text}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
