import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { courseService, marketplaceService } from "@/services/api.service";
import NcCard from "@/components/shared/NcCard";
import { FormGroup, FormInput, FormSelect, FormTextarea } from "@/components/shared/Modal";
import { apiError, apiMessage, unwrap } from "@/lib/finance";

/** How a training appears in the marketplace: titles, summary, publishing, required trainings and tier. */
export default function MarketplaceSettings({ courseKey, outline, onChanged }: { courseKey: string; outline: any; onChanged: () => void }) {
  const { toast } = useToast();
  const c = outline.course;
  const [f, setF] = useState({
    title: c.title ?? "", titleUr: c.titleUr ?? "", summary: c.summary ?? "", summaryUr: c.summaryUr ?? "",
    category: c.category ?? "", trainer: c.trainer ?? "", badge: c.badge ?? "", published: !!c.published,
    position: c.position ?? 100, prerequisites: (c.prerequisites ?? []) as string[], tier: c.tier ?? null as number | null,
  });
  const [others, setOthers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const set = (patch: object) => setF((x) => ({ ...x, ...patch }));
  const isMurabbi = c.audience !== "parent";

  useEffect(() => {
    marketplaceService.catalogue()
      .then((r) => setOthers((unwrap<any[]>(r) || []).filter((x) => x.audience === c.audience && x.key !== courseKey)))
      .catch(() => {});
  }, [courseKey, c.audience]);

  async function save() {
    setSaving(true);
    try {
      const r = await courseService.settings(courseKey, {
        title: f.title, titleUr: f.titleUr, summary: f.summary, summaryUr: f.summaryUr, category: f.category,
        trainer: f.trainer, badge: f.badge || f.title, published: f.published, position: Number(f.position) || 0,
        prerequisites: f.prerequisites, ...(isMurabbi && { tier: f.tier }),
      });
      toast({ title: apiMessage(r, "Saved.") });
      onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save.") });
    } finally {
      setSaving(false);
    }
  }

  const toggle = (key: string) => set({ prerequisites: f.prerequisites.includes(key) ? f.prerequisites.filter((k) => k !== key) : [...f.prerequisites, key] });

  return (
    <NcCard className="max-w-2xl">
      <div className="mb-1 text-[14px] font-semibold text-nc-dark">Marketplace</div>
      <p className="mb-4 text-[12.5px] text-nc-muted">
        How this training appears to {isMurabbi ? "murabbis" : "parents"} under Trainings. People ask to join once the trainings below are certified and
        everything they already have is finished; you approve each request.
      </p>
      <div className="grid gap-x-6 sm:grid-cols-2">
        <FormGroup label="Title" required><FormInput value={f.title} maxLength={150} onChange={(e) => set({ title: e.target.value })} /></FormGroup>
        <FormGroup label="Title in Urdu"><FormInput dir="rtl" lang="ur" className="urdu" value={f.titleUr} maxLength={150} onChange={(e) => set({ titleUr: e.target.value })} /></FormGroup>
      </div>
      <FormGroup label="Summary"><FormTextarea dir="auto" value={f.summary} maxLength={500} onChange={(e) => set({ summary: e.target.value })} /></FormGroup>
      <FormGroup label="Summary in Urdu"><FormTextarea dir="rtl" lang="ur" className="urdu" value={f.summaryUr} maxLength={500} onChange={(e) => set({ summaryUr: e.target.value })} /></FormGroup>
      <div className="grid gap-x-6 sm:grid-cols-2">
        <FormGroup label="Category"><FormInput value={f.category} maxLength={60} onChange={(e) => set({ category: e.target.value })} placeholder="e.g. Foundations" /></FormGroup>
        <FormGroup label="Trainer"><FormInput value={f.trainer} maxLength={100} onChange={(e) => set({ trainer: e.target.value })} /></FormGroup>
        <FormGroup label="Badge on completion"><FormInput value={f.badge} maxLength={100} onChange={(e) => set({ badge: e.target.value })} /></FormGroup>
        <FormGroup label="Order in the marketplace (lower first)"><FormInput type="number" min={0} max={1000} value={f.position} onChange={(e) => set({ position: e.target.value })} /></FormGroup>
        {isMurabbi && (
          <FormGroup label="Leads to murabbi tier">
            <FormSelect value={f.tier ?? ""} onChange={(e) => set({ tier: e.target.value ? Number(e.target.value) : null })}>
              <option value="">No tier</option>
              {[1, 2, 3].map((t) => <option key={t} value={t}>Tier {t}</option>)}
            </FormSelect>
          </FormGroup>
        )}
      </div>
      <div className="mb-1.5 text-[13px] font-medium text-slate">Required trainings (must be certified first)</div>
      <div className="mb-4 max-h-44 divide-y divide-border overflow-y-auto rounded-md border border-border">
        {others.length === 0 ? <div className="px-3 py-3 text-[12.5px] text-nc-muted">No other trainings for {isMurabbi ? "murabbis" : "parents"} yet.</div> : others.map((o) => (
          <label key={o.key} className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-[13px] hover:bg-muted/40">
            <input type="checkbox" checked={f.prerequisites.includes(o.key)} onChange={() => toggle(o.key)} className="accent-[hsl(var(--teal))]" />
            <span className="flex-1">{o.title}</span>
            {!o.published && <span className="text-[11px] text-nc-muted">Draft</span>}
          </label>
        ))}
      </div>
      <label className="mb-5 flex cursor-pointer items-start gap-2.5 text-[13px] text-nc-dark">
        <input type="checkbox" checked={f.published} onChange={(e) => set({ published: e.target.checked })} className="mt-0.5 accent-[hsl(var(--teal))]" />
        <span>Published <span className="block text-[12px] text-nc-muted">Shown in the marketplace. Needs at least one lesson with audio.</span></span>
      </label>
      <button className="btn-primary" disabled={saving || !f.title.trim()} onClick={save}>{saving ? "Saving…" : "Save marketplace settings"}</button>
    </NcCard>
  );
}
