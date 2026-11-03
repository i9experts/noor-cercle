import { FormEvent, ReactNode, useRef, useState } from "react";
import { Check, ImagePlus, Lock, Plus, Trash2, X } from "lucide-react";
import { uploadService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { uploadError } from "@/lib/image";
import { cn } from "@/lib/utils";
import { MAX_PHOTOS, PRIVACY_NOTE, type HostOptions, type SpaceFormValue } from "@/lib/host";

const input = "h-10 w-full rounded-md border border-input bg-card px-3 text-[13.5px] focus:border-primary focus:outline-none";

function Field({ ur, en, children, className }: { ur?: string; en: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2">
        <span className="text-[12.5px] font-medium text-slate">{en}</span>
        {ur && <span dir="rtl" lang="ur" className="urdu text-[13px] leading-[2] text-nc-muted">{ur}</span>}
      </span>
      {children}
    </label>
  );
}

/** The details of a space: used by the host (My space) and by admins. */
export default function SpaceForm({ initial, options, onSave, saveLabel = "Save", extra }: {
  initial: SpaceFormValue;
  options: HostOptions | null;
  onSave: (v: SpaceFormValue) => Promise<void>;
  saveLabel?: string;
  /** More fields shown before the save button (admins: neighbourhood, notes). */
  extra?: ReactNode;
}) {
  const { toast } = useToast();
  const [v, setV] = useState<SpaceFormValue>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof SpaceFormValue>(k: K, val: SpaceFormValue[K]) => setV((p) => ({ ...p, [k]: val }));
  const days = options?.days ?? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const timesOk = v.availability.every((a) => /^\d{2}:\d{2}$/.test(a.from) && /^\d{2}:\d{2}$/.test(a.to));

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_PHOTOS - v.photos.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) toast({ title: `Up to ${MAX_PHOTOS} photos. The first ${room} were added.` });
    setUploading(true);
    try {
      for (const f of list) {
        const r = await uploadService.image(f);
        const url = (r.data as any)?.data?.url ?? (r.data as any)?.url;
        if (url) setV((p) => ({ ...p, photos: [...p.photos, url].slice(0, MAX_PHOTOS) }));
      }
    } catch (err) {
      toast({ variant: "destructive", title: uploadError(err) });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!v.name.trim()) { toast({ variant: "destructive", title: "Give your space a name." }); return; }
    if (!timesOk) { toast({ variant: "destructive", title: "Fill in the from and to times for each day." }); return; }
    setSaving(true);
    try { await onSave(v); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field ur="جگہ کا نام" en="Name of the space" className="sm:col-span-2">
          <input className={input} value={v.name} onChange={(e) => set("name", e.target.value)} maxLength={100} required />
        </Field>
        <Field ur="جگہ کی قسم" en="Type">
          <select className={input} value={v.type} onChange={(e) => set("type", e.target.value)}>
            {(options?.spaceTypes ?? [{ value: v.type, en: v.type, ur: "" }]).map((t) => (
              <option key={t.value} value={t.value}>{t.ur ? `${t.ur} · ${t.en}` : t.en}</option>
            ))}
          </select>
        </Field>
        <Field ur="کتنے بچے بیٹھ سکتے ہیں" en="Capacity (children)">
          <input type="number" min={1} max={200} className={input} value={v.capacity}
            onChange={(e) => set("capacity", e.target.value === "" ? "" : Math.max(1, Math.min(200, Number(e.target.value))))} />
        </Field>
        <Field ur="پتا" en="Address" className="sm:col-span-2">
          <input className={input} value={v.address} onChange={(e) => set("address", e.target.value)} maxLength={300} placeholder="House, street, block" />
        </Field>
        <Field ur="علاقہ" en="Area">
          <input className={input} value={v.area} onChange={(e) => set("area", e.target.value)} maxLength={100} />
        </Field>
        <Field ur="شہر" en="City">
          <input className={input} value={v.city} onChange={(e) => set("city", e.target.value)} maxLength={100} />
        </Field>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-gold/40 bg-gold-lt/40 px-3.5 py-2.5">
        <Lock className="mt-1 h-4 w-4 flex-shrink-0 text-gold-dim" />
        <div className="min-w-0 flex-1">
          <p dir="rtl" lang="ur" className="urdu text-right text-[13.5px] leading-[2.1] text-nc-dark">{PRIVACY_NOTE.ur}</p>
          <p className="text-[12px] text-nc-muted">{PRIVACY_NOTE.en}</p>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2">
          <span className="text-[12.5px] font-medium text-slate">Facilities</span>
          <span dir="rtl" lang="ur" className="urdu text-[13px] leading-[2] text-nc-muted">سہولیات</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(options?.facilities ?? []).map((f) => {
            const on = v.facilities.includes(f.value);
            return (
              <button type="button" key={f.value} aria-pressed={on}
                onClick={() => set("facilities", on ? v.facilities.filter((x) => x !== f.value) : [...v.facilities, f.value])}
                className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] transition-colors",
                  on ? "border-plum bg-plum-lt text-plum" : "border-border bg-card text-nc-dark hover:border-plum/50")}>
                {on && <Check className="h-3.5 w-3.5" />}
                <span lang="ur" className="urdu leading-[1.9]">{f.ur}</span>
                <span className="text-nc-muted">· {f.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2">
          <span className="text-[12.5px] font-medium text-slate">When the space is free</span>
          <span dir="rtl" lang="ur" className="urdu text-[13px] leading-[2] text-nc-muted">جگہ کب دستیاب ہے</span>
        </div>
        <div className="space-y-2">
          {v.availability.map((a, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
              <select className={cn(input, "min-w-[120px] flex-1")} value={a.day} aria-label="Day"
                onChange={(e) => set("availability", v.availability.map((x, j) => (j === i ? { ...x, day: Number(e.target.value) } : x)))}>
                {days.map((d, n) => <option key={d} value={n}>{d}</option>)}
              </select>
              <input type="time" className={cn(input, "w-[110px]")} value={a.from} aria-label="From"
                onChange={(e) => set("availability", v.availability.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)))} />
              <span className="text-[12px] text-nc-muted">to</span>
              <input type="time" className={cn(input, "w-[110px]")} value={a.to} aria-label="To"
                onChange={(e) => set("availability", v.availability.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)))} />
              <button type="button" className="rounded-md p-2 text-nc-muted hover:bg-nc-red-lt hover:text-nc-red" aria-label="Remove this time"
                onClick={() => set("availability", v.availability.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {v.availability.length < 21 && (
            <button type="button" className="btn-outline !py-1.5 text-[12.5px]"
              onClick={() => set("availability", [...v.availability, { day: 5, from: "16:00", to: "18:00" }])}>
              <Plus className="h-3.5 w-3.5" /> Add a day · <span lang="ur" className="urdu leading-[1.6]">دن شامل کریں</span>
            </button>
          )}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2">
          <span className="text-[12.5px] font-medium text-slate">Photos ({v.photos.length}/{MAX_PHOTOS})</span>
          <span dir="rtl" lang="ur" className="urdu text-[13px] leading-[2] text-nc-muted">تصاویر</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {v.photos.map((p) => (
            <div key={p} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
              <img src={p} alt="" className="h-full w-full object-cover" />
              <button type="button" aria-label="Remove photo" onClick={() => set("photos", v.photos.filter((x) => x !== p))}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-nc-red">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {v.photos.length < MAX_PHOTOS && (
            <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-[11.5px] text-nc-muted hover:border-plum hover:text-plum disabled:opacity-60">
              <ImagePlus className="h-5 w-5" /> {uploading ? "Uploading…" : "Add photo"}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
      </div>

      <Field ur="مزید معلومات" en="Notes (anything the team should know)">
        <textarea className={cn(input, "h-auto min-h-[80px] py-2")} value={v.notes} onChange={(e) => set("notes", e.target.value)} maxLength={1000} />
      </Field>

      {extra}

      <button type="submit" className="btn-primary w-full justify-center sm:w-auto" disabled={saving || uploading}>{saving ? "Saving…" : saveLabel}</button>
    </form>
  );
}
