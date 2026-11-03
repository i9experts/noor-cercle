import { useEffect, useState } from "react";
import { Warehouse } from "lucide-react";
import HostShell, { Bi, HostCard } from "@/components/host/HostShell";
import SpaceForm from "@/components/host/SpaceForm";
import StatusSteps from "@/components/host/StatusSteps";
import { useToast } from "@/hooks/use-toast";
import { apiError, apiMessage, unwrap } from "@/lib/finance";
import { HostMe, HostOptions, HostSpace, hostService, toFormValue, toInput } from "@/lib/host";

/** My space: the host describes their space (PUT /host/spaces/:id). */
export default function HostSpacePage() {
  const { toast } = useToast();
  const [spaces, setSpaces] = useState<HostSpace[] | null>(null);
  const [options, setOptions] = useState<HostOptions | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "My space · Noor Circles";
    Promise.all([hostService.me(), hostService.options()])
      .then(([m, o]) => { setSpaces(unwrap<HostMe>(m).spaces); setOptions(unwrap<HostOptions>(o)); })
      .catch((err) => setError(apiError(err, "We couldn’t open your space right now. Please try again later.")));
  }, []);

  return (
    <HostShell titleUr="میری جگہ" titleEn="My space">
      {error ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-[14px] text-nc-dark shadow-nc">{error}</div>
      ) : !spaces || !options ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-[13px] text-nc-muted shadow-nc">Loading…</div>
      ) : spaces.length === 0 ? (
        <HostCard ur="آپ کی جگہ" en="Your space">
          <Bi ur="ابھی آپ کی کوئی جگہ شامل نہیں۔ نور سرکلز ٹیم جلد رابطہ کرے گی۔" en="No space is linked to your account yet. The Noor Circles team will be in touch." />
        </HostCard>
      ) : (
        spaces.map((s) => (
          <HostCard key={s._id} ur={s.name} en="Tell us about your space" icon={<Warehouse className="h-4 w-4 text-plum" />}>
            {s.status !== "inactive" && <div className="mb-4"><StatusSteps status={s.status} /></div>}
            <SpaceForm
              initial={toFormValue(s)}
              options={options}
              saveLabel="Save · محفوظ کریں"
              onSave={async (v) => {
                try {
                  const r = await hostService.saveSpace(s._id, toInput(v));
                  toast({ title: apiMessage(r, "Your space is saved.") });
                } catch (err) {
                  toast({ variant: "destructive", title: apiError(err, "Could not save your space.") });
                }
              }}
            />
          </HostCard>
        ))
      )}
    </HostShell>
  );
}
