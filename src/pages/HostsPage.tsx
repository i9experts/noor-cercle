import { useCallback, useEffect, useRef, useState } from "react";
import { Award, Check, Music, Trash2, Upload } from "lucide-react";
import { neighbourhoodsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { apiError, apiMessage, unwrap } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { AdminSpace, HOST_MODULE_TITLES, HostOptions, HostTrainingRow, hostService } from "@/lib/host";
import SpaceList from "@/components/host/SpaceList";
import SpaceDetail from "@/components/host/SpaceDetail";
import SpaceVisitForm from "@/components/host/SpaceVisitForm";
import RegisterView from "@/components/register/RegisterView";

const TABS = [
  { key: "spaces", label: "Spaces" },
  { key: "training", label: "Host training" },
  { key: "register", label: "Register & follow-up" },
] as const;

/** Admin: hosts' spaces (visit, approve, place circles) and Asaas for Hosts. */
export default function HostsPage({ initialTab }: { initialTab?: string }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>(initialTab === "register" ? "register" : "spaces");
  const [spaces, setSpaces] = useState<AdminSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<HostOptions | null>(null);
  const [neighbourhoods, setNeighbourhoods] = useState<{ _id: string; name: string; city?: string }[]>([]);
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
    neighbourhoodsService.getAll().then((r) => setNeighbourhoods(unwrap(r) ?? [])).catch(() => {});
  }, [load]);

  const closeDetail = useCallback(() => setOpenId(null), []);

  return (
    <div className="page-animate min-w-0">
      <div className="mb-5">
        <h2 className="font-serif text-[26px] text-nc-dark">Hosts &amp; Spaces</h2>
        <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
          Homes, lawns and halls offered for circles. Visit each space with the checklist, approve it, then place a circle there.
          Addresses are shown only to the team, the cluster’s supervisors, the circle’s murabbi and enrolled families.
        </p>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("-mb-px whitespace-nowrap border-b-2 px-3.5 py-2 text-[13.5px]", tab === t.key ? "border-plum font-semibold text-plum" : "border-transparent text-nc-muted hover:text-nc-dark")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "spaces" ? (
        <SpaceList spaces={spaces} options={options} loading={loading} onOpen={(s) => setOpenId(s._id)} onVisit={(s) => setVisitFor(s)} />
      ) : tab === "register" ? (
        <RegisterView type="host" />
      ) : (
        <HostTrainingTab />
      )}

      {openId && (
        <SpaceDetail spaceId={openId} options={options} admin neighbourhoods={neighbourhoods} refreshKey={detailKey} paused={!!visitFor}
          onClose={closeDetail} onChanged={load} onVisit={(s) => setVisitFor(s)} />
      )}
      {visitFor && (
        <SpaceVisitForm space={visitFor} options={options} onClose={() => setVisitFor(null)}
          onSaved={() => { load(); setDetailKey((k) => k + 1); }} />
      )}
    </div>
  );
}

function HostTrainingTab() {
  const { toast } = useToast();
  const [rows, setRows] = useState<HostTrainingRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadKey, setUploadKey] = useState<string | null>(null);

  const [audio, setAudio] = useState<Record<string, { durationSec: number } | null>>({});
  const loadAudio = useCallback(() => {
    hostService.moduleAudio()
      .then((r) => setAudio(Object.fromEntries((unwrap<{ key: string; audio: { durationSec: number } | null }[]>(r) ?? []).map((m) => [m.key, m.audio]))))
      .catch(() => setAudio({}));
  }, []);
  useEffect(loadAudio, [loadAudio]);

  const load = useCallback(() => {
    hostService.trainingOverview()
      .then((r) => setRows(unwrap<HostTrainingRow[]>(r) ?? []))
      .catch((err) => { setRows([]); toast({ variant: "destructive", title: apiError(err, "Could not load host training.") }); });
  }, [toast]);
  useEffect(load, [load]);

  async function upload(file: File | undefined) {
    const key = uploadKey;
    if (fileRef.current) fileRef.current.value = "";
    if (!file || !key) return;
    if (!/\.mp3$/i.test(file.name) && file.type !== "audio/mpeg") { toast({ variant: "destructive", title: "Choose an MP3 file." }); return; }
    setBusy(key);
    try {
      const r = await hostService.uploadAudio(key, file);
      toast({ title: apiMessage(r, "Audio added to the module.") });
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not upload the audio.") });
    } finally {
      setBusy(null);
      loadAudio();
    }
  }

  async function remove(key: string) {
    if (!window.confirm("Remove this module’s audio?")) return;
    setBusy(key);
    try {
      const r = await hostService.removeAudio(key);
      toast({ title: apiMessage(r, "Audio removed.") });
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not remove the audio.") });
    } finally {
      setBusy(null);
      loadAudio();
    }
  }

  return (
    <div className="space-y-6">
      <section className="min-w-0 rounded-lg border border-border bg-card shadow-nc">
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <h3 className="text-[15px] font-semibold text-nc-dark">Hosts’ progress</h3>
          <p className="text-[12.5px] text-nc-muted">Asaas for Hosts: six modules, each passed with 3 of 4 right. All six earn the Noor Circles Host certificate.</p>
        </div>
        {!rows ? <div className="py-12 text-center text-sm text-nc-muted">Loading…</div> : rows.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-nc-muted">No host accounts yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-nc-muted">
                  <th className="px-4 py-2 font-medium">Host</th>
                  {HOST_MODULE_TITLES.map((m, i) => <th key={m.key} className="px-2 py-2 text-center font-medium" title={m.titleEn}>{i + 1}</th>)}
                  <th className="px-4 py-2 font-medium">Done</th>
                  <th className="px-4 py-2 font-medium">Certificate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user._id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-nc-dark">{r.user.fullName}</div>
                      <div className="text-[11.5px] text-nc-muted">{r.user.email}</div>
                    </td>
                    {HOST_MODULE_TITLES.map((m) => {
                      const x = r.modules.find((y) => y.key === m.key);
                      return (
                        <td key={m.key} className="px-2 py-2.5 text-center" title={`${m.titleEn}${x?.attempts ? ` · ${x.attempts} tries` : ""}`}>
                          {x?.passed ? <Check className="mx-auto h-4 w-4 text-nc-green" /> : <span className="mx-auto block h-2 w-2 rounded-full bg-border" />}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5 whitespace-nowrap">{r.done}/{r.total}</td>
                    <td className="px-4 py-2.5">
                      {r.certificate ? <span className="inline-flex items-center gap-1 whitespace-nowrap text-nc-green"><Award className="h-3.5 w-3.5" /> {r.certificate.number}</span> : <span className="text-nc-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card shadow-nc">
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <h3 className="text-[15px] font-semibold text-nc-dark">Module audio</h3>
          <p className="text-[12.5px] text-nc-muted">Optional: add an MP3 (up to 15 MB) to a module and hosts get a player above the text. Uploading again replaces it.</p>
        </div>
        <ul className="divide-y divide-border">
          {HOST_MODULE_TITLES.map((m, i) => (
            <li key={m.key} className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
              <Music className="h-4 w-4 flex-shrink-0 text-plum" />
              <div className="min-w-0 flex-1 basis-[180px]">
                <div className="text-[13.5px] font-medium text-nc-dark">{i + 1}. {m.titleEn}</div>
                <div dir="rtl" lang="ur" className="urdu text-left text-[12.5px] leading-[2] text-nc-muted">{m.titleUr}</div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ${audio[m.key] ? "bg-nc-green-lt text-nc-green" : "bg-muted text-nc-muted"}`}>
                {audio[m.key] ? `Audio · ${Math.floor(audio[m.key]!.durationSec / 60)}:${String(Math.round(audio[m.key]!.durationSec % 60)).padStart(2, "0")}` : "No audio"}
              </span>
              <button className="btn-outline !py-1.5 text-[12.5px]" disabled={busy === m.key} onClick={() => { setUploadKey(m.key); fileRef.current?.click(); }}>
                <Upload className="h-3.5 w-3.5" /> {busy === m.key ? "Working…" : audio[m.key] ? "Replace MP3" : "Upload MP3"}
              </button>
              {audio[m.key] && <button className="rounded-md p-2 text-nc-muted hover:bg-nc-red-lt hover:text-nc-red" disabled={busy === m.key} onClick={() => remove(m.key)} aria-label={`Remove audio from ${m.titleEn}`} title="Remove audio">
                <Trash2 className="h-4 w-4" />
              </button>}
            </li>
          ))}
        </ul>
        <input ref={fileRef} type="file" accept="audio/mpeg,.mp3" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      </section>
    </div>
  );
}
