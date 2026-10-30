import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Modal from "@/components/shared/Modal";
import { apiError, apiMessage } from "@/lib/finance";
import { DAYS } from "@/lib/schedule";
import { supervisorService } from "@/services/api.service";

export interface CircleOptions {
  neighbourhoods: { _id: string; name: string }[];
  murabbis: { _id: string; fullName: string }[];
  tracks: { _id: string; name: string }[];
}

const inputCls = "h-10 w-full rounded-md border border-input bg-card px-3 text-[13.5px] focus:border-primary focus:outline-none";
const idOf = (x: any) => (x && typeof x === "object" ? x._id : x) ?? "";

/** A supervisor creates or edits a circle in one of their neighbourhoods. `circle` = {} for a new one. */
export default function CircleForm({ circle, options, onClose, onSaved }: {
  circle: any | null; options: CircleOptions | null; onClose: () => void; onSaved: () => void;
}) {
  const { toast } = useToast();
  const [f, setF] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const isNew = circle && !circle._id;

  useEffect(() => {
    if (!circle) return;
    setF({
      name: circle.name ?? "", neighbourhoodId: idOf(circle.neighbourhood), murabbiId: idOf(circle.murabbi), capacity: circle.capacity ?? 30,
      trackId: idOf(circle.track), meetingDay: circle.meetingDay ?? "", meetingTime: circle.meetingTime ?? "", startDate: circle.startDate ?? "",
      isActive: circle.isActive ?? true,
    });
  }, [circle]);

  if (!circle || !options) return null;
  const set = (k: string, v: unknown) => setF((x) => ({ ...x, [k]: v }));

  async function save() {
    setBusy(true);
    const body = {
      name: f.name, neighbourhoodId: f.neighbourhoodId, murabbiId: f.murabbiId, capacity: Number(f.capacity) || 30,
      trackId: f.trackId || null, meetingDay: f.meetingDay === "" ? null : Number(f.meetingDay),
      meetingTime: f.meetingTime || null, startDate: f.startDate || null,
      ...(!isNew && { isActive: f.isActive }),
    };
    try {
      const r = isNew ? await supervisorService.createCircle(body) : await supervisorService.updateCircle(circle._id, body);
      toast({ title: apiMessage(r, "Saved.") });
      onSaved();
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save the circle.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isNew ? "New circle" : `Edit ${circle.name}`}>
      <label className="mb-3 block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Name *</span>
        <input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} maxLength={100} className={inputCls} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Neighbourhood *</span>
          <select value={f.neighbourhoodId ?? ""} onChange={(e) => set("neighbourhoodId", e.target.value)} className={inputCls}>
            <option value="">Choose…</option>
            {options.neighbourhoods.map((n) => <option key={n._id} value={n._id}>{n.name}</option>)}
          </select></label>
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Murabbi *</span>
          <select value={f.murabbiId ?? ""} onChange={(e) => set("murabbiId", e.target.value)} className={inputCls}>
            <option value="">Choose…</option>
            {options.murabbis.map((m) => <option key={m._id} value={m._id}>{m.fullName}</option>)}
          </select></label>
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Syllabus</span>
          <select value={f.trackId ?? ""} onChange={(e) => set("trackId", e.target.value)} className={inputCls}>
            <option value="">None yet</option>
            {options.tracks.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select></label>
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Capacity</span>
          <input type="number" min={1} max={100} value={f.capacity ?? 30} onChange={(e) => set("capacity", e.target.value)} className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Meets on</span>
          <select value={f.meetingDay ?? ""} onChange={(e) => set("meetingDay", e.target.value)} className={inputCls}>
            <option value="">No weekly schedule</option>
            {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select></label>
        <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-slate">Time</span>
          <input type="time" value={f.meetingTime ?? ""} onChange={(e) => set("meetingTime", e.target.value)} className={inputCls} /></label>
        <label className="block sm:col-span-2"><span className="mb-1 block text-[12.5px] font-medium text-slate">First meeting</span>
          <input type="date" value={f.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} className={inputCls} /></label>
      </div>
      {!isNew && (
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px] text-nc-dark">
          <input type="checkbox" checked={!!f.isActive} onChange={(e) => set("isActive", e.target.checked)} className="accent-[hsl(var(--teal))]" />
          Active (untick to pause the circle)
        </label>
      )}
      <div className="mt-6 flex gap-2">
        <button className="btn-primary flex-1 justify-center" disabled={!f.name?.trim() || !f.neighbourhoodId || !f.murabbiId || busy} onClick={save}>
          {busy ? "Saving…" : isNew ? "Create circle" : "Save changes"}
        </button>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
