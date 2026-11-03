import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiError, unwrap } from "@/lib/finance";
import { AdminSpace, HostOptions, hostService } from "@/lib/host";
import SpaceList from "@/components/host/SpaceList";
import SpaceDetail from "@/components/host/SpaceDetail";
import SpaceVisitForm from "@/components/host/SpaceVisitForm";

/** Hosts' spaces in the supervisor's clusters: read the details and record visits. */
export default function SupervisorSpaces() {
  const { toast } = useToast();
  const [spaces, setSpaces] = useState<AdminSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<HostOptions | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [visitFor, setVisitFor] = useState<{ _id: string; name: string } | null>(null);
  const [detailKey, setDetailKey] = useState(0);

  const load = useCallback(() => {
    hostService.spaces()
      .then((r) => setSpaces(unwrap<AdminSpace[]>(r) ?? []))
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load the spaces.") }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
    hostService.options().then((r) => setOptions(unwrap<HostOptions>(r))).catch(() => {});
  }, [load]);

  const closeDetail = useCallback(() => setOpenId(null), []);

  return (
    <div className="page-animate min-w-0">
      <div className="mb-5">
        <h2 className="font-serif text-[26px] text-nc-dark">Spaces</h2>
        <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
          Homes, lawns and halls hosts have offered in your clusters. Visit each one with the checklist; the Noor Circles team approves it and places a circle there.
        </p>
      </div>

      <SpaceList spaces={spaces} options={options} loading={loading} onOpen={(s) => setOpenId(s._id)} onVisit={(s) => setVisitFor(s)} />

      {openId && (
        <SpaceDetail spaceId={openId} options={options} admin={false} refreshKey={detailKey} paused={!!visitFor}
          onClose={closeDetail} onChanged={load} onVisit={(s) => setVisitFor(s)} />
      )}
      {visitFor && (
        <SpaceVisitForm space={visitFor} options={options} onClose={() => setVisitFor(null)}
          onSaved={() => { load(); setDetailKey((k) => k + 1); }} />
      )}
    </div>
  );
}
