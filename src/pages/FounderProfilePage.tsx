import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Camera, Eye, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import { FormGroup, FormInput, FormTextarea } from "@/components/shared/Modal";
import FounderProfile from "@/components/founder/FounderProfile";
import { uploadService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { apiError, apiMessage, formatDate, unwrap } from "@/lib/finance";
import {
  FOUNDER_PHOTO, MAX_VISION_POINTS, TEXT_FORMAT_HINT, founderPhoto, founderService,
  type BlogPost, type FounderAudience, type FounderData, type FounderUpdate, type VisionPoint,
} from "@/lib/founder";

type TextKey = Exclude<keyof FounderData, "vision" | "updatedAt">;

const URDU = "urdu text-right leading-[2.2]";

/** Admin → Founder Profile: edits the "Meet the Founder" page both portals show. */
export default function FounderProfilePage() {
  const { toast } = useToast();
  const [form, setForm]         = useState<FounderData | null>(null);
  const [saved, setSaved]       = useState<FounderData | null>(null);
  const [posts, setPosts]       = useState<BlogPost[]>([]);
  const [error, setError]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [resetting, setResetting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]   = useState<FounderAudience | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = (d: FounderData) => {
    const clean = { ...d, vision: (d.vision ?? []).map((v) => ({ en: v.en ?? "", ur: v.ur ?? "", detailEn: v.detailEn ?? "" })) };
    setForm(clean);
    setSaved(clean);
  };

  useEffect(() => {
    founderService.get()
      .then((r) => load(unwrap<FounderData>(r)))
      .catch((err) => setError(apiError(err, "Could not load the founder profile.")));
    founderService.posts()
      .then((r) => { const list = unwrap<BlogPost[]>(r); setPosts(Array.isArray(list) ? list : []); })
      .catch(() => {});
  }, []);

  if (error && !form) return <NcCard><p className="text-center text-[13.5px] text-nc-muted">{error}</p></NcCard>;
  if (!form) return <div className="flex h-64 items-center justify-center text-sm text-nc-muted animate-pulse">Loading founder profile…</div>;

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = (k: TextKey, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const setVision = (fn: (v: VisionPoint[]) => VisionPoint[]) => setForm((f) => (f ? { ...f, vision: fn(f.vision) } : f));
  const text = (k: TextKey) => ({ value: form[k] ?? "", onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value) });

  async function save() {
    if (!form) return;
    if (form.vision.some((v) => !v.en.trim())) {
      toast({ variant: "destructive", title: "Each vision point needs an English title." });
      return;
    }
    setSaving(true);
    try {
      const { updatedAt: _updatedAt, ...rest } = form;
      const dto: FounderUpdate = { ...rest, vision: form.vision.map((v) => ({ en: v.en.trim(), ur: v.ur.trim(), detailEn: v.detailEn.trim() })) };
      const r = await founderService.update(dto);
      const profile = unwrap<{ profile?: FounderData }>(r).profile;
      if (profile) load(profile);
      toast({ title: apiMessage(r, "Founder profile saved.") });
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save the founder profile.") });
    } finally {
      setSaving(false);
    }
  }

  async function restore() {
    if (!window.confirm("Restore the original approved text? Every change made here (including the photo and blog link) is replaced.")) return;
    setResetting(true);
    try {
      const r = await founderService.reset();
      const profile = unwrap<{ profile?: FounderData }>(r).profile;
      if (profile) load(profile);
      toast({ title: apiMessage(r, "Founder profile restored to the original text.") });
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not restore the original text.") });
    } finally {
      setResetting(false);
    }
  }

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadService.image(file);
      const url: string = res.data.data?.url ?? (res.data as any).url ?? "";
      if (!url) throw new Error();
      set("photo", url);
      toast({ title: "Photo uploaded. Save to publish it." });
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Upload failed. Please try again.") });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const hint = <p className="mt-1 text-[11.5px] text-nc-muted">{TEXT_FORMAT_HINT}</p>;

  return (
    <div className="page-animate">
      {/* Toolbar */}
      <div className="sticky top-16 z-40 -mx-4 mb-6 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mr-auto min-w-0">
          <p className="text-[13px] text-nc-muted">
            The “Meet the Founder” page murabbis and parents see.
            {form.updatedAt && <> Last saved {formatDate(form.updatedAt)}.</>}
          </p>
          {dirty && <p className="text-[12px] font-semibold text-gold-dim">Unsaved changes</p>}
        </div>
        <div className="inline-flex rounded-sm border border-border bg-card p-0.5 text-[12.5px]" role="group" aria-label="Preview">
          {([null, "murabbi", "parent"] as const).map((a) => (
            <button
              key={a ?? "off"}
              type="button"
              onClick={() => setPreview(a)}
              aria-pressed={preview === a}
              className={`inline-flex items-center gap-1 rounded-[3px] px-2.5 py-1.5 font-medium ${preview === a ? "bg-plum text-white" : "text-slate hover:text-plum"}`}
            >
              {a === null ? "Edit" : <><Eye className="h-3.5 w-3.5" /> As {a}</>}
            </button>
          ))}
        </div>
        <button className="btn-outline" onClick={restore} disabled={resetting || saving}>
          <RotateCcw className="h-4 w-4" /> <span className="hidden sm:inline">{resetting ? "Restoring…" : "Restore original text"}</span>
        </button>
        <button className="btn-primary" onClick={save} disabled={saving || !dirty}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {preview ? (
        <div>
          <p className="mb-4 text-center text-[12px] text-nc-muted">
            Preview as a {preview} would see it{dirty ? " (with your unsaved changes)" : ""}.
          </p>
          <FounderProfile audience={preview} data={form} posts={posts} />
        </div>
      ) : (
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Name and titles */}
          <NcCard>
            <CardHeader><CardTitle sub="Shown at the top of the page.">Name and titles</CardTitle></CardHeader>
            <FormGroup label="Name" required><FormInput maxLength={100} {...text("name")} /></FormGroup>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <FormGroup label="Title (English)"><FormInput maxLength={100} {...text("titleEn")} /></FormGroup>
              <FormGroup label="Title (Urdu)"><FormInput dir="rtl" lang="ur" className={URDU} maxLength={100} {...text("titleUr")} /></FormGroup>
              <FormGroup label="Tagline (English)"><FormInput maxLength={200} {...text("taglineEn")} /></FormGroup>
              <FormGroup label="Tagline (Urdu)"><FormInput dir="rtl" lang="ur" className={URDU} maxLength={200} {...text("taglineUr")} /></FormGroup>
            </div>
          </NcCard>

          {/* Photo and blog */}
          <NcCard>
            <CardHeader><CardTitle sub="A square photo works best.">Photo and blog</CardTitle></CardHeader>
            <div className="mb-5 flex flex-wrap items-center gap-5">
              <img src={founderPhoto(form)} alt={form.name} className="h-24 w-24 rounded-full bg-white object-cover ring-2 ring-gold ring-offset-2" />
              <div className="space-y-2">
                <p className="text-[12.5px] text-nc-muted">{form.photo ? "An uploaded photo." : `The original photo (${FOUNDER_PHOTO}).`}</p>
                <div className="flex flex-wrap gap-2">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={upload} />
                  <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} {uploading ? "Uploading…" : "Upload new photo"}
                  </button>
                  <button type="button" className="btn-outline" onClick={() => set("photo", "")} disabled={!form.photo || uploading}>
                    <RotateCcw className="h-4 w-4" /> Use the original photo
                  </button>
                </div>
              </div>
            </div>
            <FormGroup label="Blog link">
              <FormInput type="url" placeholder="https://ayubi.blog" maxLength={300} {...text("blogUrl")} />
              <p className="mt-1 text-[11.5px] text-nc-muted">The page shows a “Read my blog” button and the blog’s newest posts. Leave empty to hide both.</p>
            </FormGroup>
          </NcCard>

          {/* Quote */}
          <NcCard>
            <CardHeader><CardTitle sub="Shown large, under the photo.">Quote</CardTitle></CardHeader>
            <FormGroup label="Quote (English)"><FormTextarea rows={2} className="!min-h-0" maxLength={300} {...text("quoteEn")} /></FormGroup>
            <FormGroup label="Quote (Urdu)"><FormTextarea rows={2} dir="rtl" lang="ur" className={`${URDU} !min-h-0`} maxLength={300} {...text("quoteUr")} /></FormGroup>
          </NcCard>

          {/* Story */}
          <NcCard>
            <CardHeader><CardTitle sub="Murabbis read the English first; parents read the Urdu first.">My story</CardTitle></CardHeader>
            <FormGroup label="Story (English)"><FormTextarea rows={12} maxLength={8000} {...text("storyEn")} />{hint}</FormGroup>
            <FormGroup label="Story (Urdu)"><FormTextarea rows={12} dir="rtl" lang="ur" className={URDU} maxLength={8000} {...text("storyUr")} />{hint}</FormGroup>
          </NcCard>

          {/* Vision */}
          <NcCard>
            <CardHeader>
              <CardTitle sub={`“Why Noor Circles”: up to ${MAX_VISION_POINTS} numbered points.`}>Vision points</CardTitle>
              <button
                type="button"
                className="btn-outline !py-1.5 text-[12.5px]"
                onClick={() => setVision((v) => [...v, { en: "", ur: "", detailEn: "" }])}
                disabled={form.vision.length >= MAX_VISION_POINTS}
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </CardHeader>
            {form.vision.length === 0 && <p className="text-[13px] text-nc-muted">No vision points: the section is hidden.</p>}
            <div className="space-y-4">
              {form.vision.map((v, i) => {
                const change = (k: keyof VisionPoint, val: string) => setVision((list) => list.map((p, j) => (j === i ? { ...p, [k]: val } : p)));
                const move = (to: number) => setVision((list) => {
                  const next = [...list];
                  [next[i], next[to]] = [next[to], next[i]];
                  return next;
                });
                return (
                  <div key={i} className="rounded-lg border border-border bg-muted/40 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-plum font-serif text-[13px] text-gold">{i + 1}</span>
                      <span className="mr-auto text-[12.5px] font-medium text-slate">Point {i + 1}</span>
                      <button type="button" className="rounded p-1.5 text-nc-muted hover:bg-card hover:text-plum disabled:opacity-30" onClick={() => move(i - 1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                      <button type="button" className="rounded p-1.5 text-nc-muted hover:bg-card hover:text-plum disabled:opacity-30" onClick={() => move(i + 1)} disabled={i === form.vision.length - 1} aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                      <button type="button" className="rounded p-1.5 text-nc-muted hover:bg-card hover:text-nc-red" onClick={() => setVision((list) => list.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="grid gap-x-4 sm:grid-cols-2">
                      <FormGroup label="Title (English)" required><FormInput maxLength={120} value={v.en} onChange={(e) => change("en", e.target.value)} /></FormGroup>
                      <FormGroup label="Line (Urdu)"><FormInput dir="rtl" lang="ur" className={URDU} maxLength={120} value={v.ur} onChange={(e) => change("ur", e.target.value)} /></FormGroup>
                    </div>
                    <FormGroup label="Detail (English)"><FormInput maxLength={300} value={v.detailEn} onChange={(e) => change("detailEn", e.target.value)} /></FormGroup>
                  </div>
                );
              })}
            </div>
          </NcCard>

          {/* Messages */}
          <NcCard>
            <CardHeader><CardTitle sub="A letter signed with the name and title above. Its first sentence also appears on the parent home page.">Message for parents</CardTitle></CardHeader>
            <FormGroup label="Message (Urdu, shown first)"><FormTextarea rows={9} dir="rtl" lang="ur" className={URDU} maxLength={4000} {...text("messageParentsUr")} />{hint}</FormGroup>
            <FormGroup label="Message (English)"><FormTextarea rows={9} maxLength={4000} {...text("messageParentsEn")} />{hint}</FormGroup>
          </NcCard>
          <NcCard>
            <CardHeader><CardTitle sub="Its first sentence also appears on the murabbi dashboard.">Message for murabbis</CardTitle></CardHeader>
            <FormGroup label="Message (English, shown first)"><FormTextarea rows={9} maxLength={4000} {...text("messageMurabbisEn")} />{hint}</FormGroup>
            <FormGroup label="Message (Urdu)"><FormTextarea rows={9} dir="rtl" lang="ur" className={URDU} maxLength={4000} {...text("messageMurabbisUr")} />{hint}</FormGroup>
          </NcCard>
        </div>
      )}
    </div>
  );
}
