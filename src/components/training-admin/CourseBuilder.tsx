import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { courseService } from "@/services/api.service";
import NcCard from "@/components/shared/NcCard";
import Modal, { FormGroup, FormInput, FormSelect, FormTextarea } from "@/components/shared/Modal";
import { apiError, apiMessage, unwrap } from "@/lib/finance";
import { clock, titleProps } from "@/lib/course";

const iconBtn = "rounded p-1.5 text-nc-muted hover:bg-muted hover:text-teal disabled:pointer-events-none disabled:opacity-30";

/** Modules and lessons of a marketplace training: add, edit, reorder, delete, and one lesson's audio. */
export default function CourseBuilder({ courseKey, outline, onChanged }: { courseKey: string; outline: any; onChanged: () => void }) {
  const { toast } = useToast();
  const file = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [section, setSection] = useState<any | null>(null);
  const [lesson, setLesson] = useState<{ id?: string; sectionId: string } | null>(null);
  const [preview, setPreview] = useState<{ id: string; url: string } | null>(null);
  const sections: any[] = outline.sections;

  async function run(p: Promise<any>, fallback: string) {
    try {
      toast({ title: apiMessage(await p, "Saved.") });
      onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, fallback) });
    }
  }

  async function upload(f: File | undefined) {
    const id = target;
    if (!f || !id) return;
    setUploading(id);
    await run(courseService.uploadLessonAudio(id, f), "Could not upload the audio.");
    setUploading(null);
    setTarget(null);
    if (file.current) file.current.value = "";
  }

  async function play(id: string) {
    if (preview?.id === id) { setPreview(null); return; }
    try {
      setPreview({ id, url: unwrap(await courseService.play(id)).audioUrl });
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not play this lesson.") });
    }
  }

  return (
    <div className="space-y-4">
      <input ref={file} type="file" accept=".mp3,audio/mpeg" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12.5px] text-nc-muted">
          Lessons are numbered through the whole training in module order; each lesson’s length is read from its MP3.
        </p>
        <button className="btn-primary flex items-center gap-1.5 !py-2 text-[12.5px]" onClick={() => setSection({})}>
          <Plus className="h-3.5 w-3.5" /> Add module
        </button>
      </div>

      {sections.length === 0 && (
        <NcCard><div className="py-10 text-center text-[13px] text-nc-muted">No modules yet. Add the first module, then its lessons.</div></NcCard>
      )}

      {sections.map((s, si) => (
        <NcCard key={s._id} className="!p-0">
          <div className="flex flex-wrap items-start gap-2 border-b border-border px-4 py-3 sm:px-5">
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold text-nc-dark">{s.title}</div>
              {s.titleUr && <div dir="rtl" lang="ur" className="urdu text-right text-[14px] leading-[2] text-nc-muted">{s.titleUr}</div>}
              {s.meta && <div className="text-[11.5px] text-nc-muted">{s.meta}</div>}
            </div>
            <div className="flex items-center">
              <button className={iconBtn} disabled={si === 0} aria-label={`Move ${s.title} up`}
                onClick={() => run(courseService.updateSection(s._id, { move: "up" }), "Could not move the module.")}><ArrowUp className="h-4 w-4" /></button>
              <button className={iconBtn} disabled={si === sections.length - 1} aria-label={`Move ${s.title} down`}
                onClick={() => run(courseService.updateSection(s._id, { move: "down" }), "Could not move the module.")}><ArrowDown className="h-4 w-4" /></button>
              <button className={iconBtn} aria-label={`Edit ${s.title}`} onClick={() => setSection(s)}><Pencil className="h-4 w-4" /></button>
              <button className={iconBtn} aria-label={`Delete ${s.title}`}
                onClick={() => window.confirm(`Delete the module “${s.title}”?`) && run(courseService.deleteSection(s._id), "Could not delete the module.")}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <ul className="divide-y divide-border/70">
            {s.lessons.map((l: any, li: number) => (
              <li key={l._id} className="px-4 py-2.5 sm:px-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
                  <span className="w-10 flex-shrink-0 font-mono text-[11.5px] text-nc-muted">{l.code}</span>
                  <span className="min-w-0 flex-1">
                    <span {...titleProps(l.title)} className="block truncate text-start text-nc-dark">{l.title}</span>
                    {l.topic && <span {...titleProps(l.topic)} className="block truncate text-start text-[11.5px] text-nc-muted">{l.topic}</span>}
                  </span>
                  {l.hasAudio ? (
                    <>
                      <span className="text-nc-muted">{clock(l.durationSec)}</span>
                      <button className="text-[12px] font-medium text-teal hover:underline" onClick={() => play(l._id)}>{preview?.id === l._id ? "Close" : "Play"}</button>
                    </>
                  ) : <span className="rounded-full bg-nc-amber-lt px-2 py-0.5 text-[11px] font-semibold text-nc-amber">No audio</span>}
                  <div className="flex items-center">
                    <button className={iconBtn} disabled={uploading === l._id} aria-label={`Upload audio for ${l.code}`} title="Upload MP3"
                      onClick={() => { setTarget(l._id); file.current?.click(); }}>
                      {uploading === l._id ? <span className="text-[11px]">…</span> : <Upload className="h-4 w-4" />}
                    </button>
                    <button className={iconBtn} disabled={li === 0} aria-label={`Move ${l.code} up`}
                      onClick={() => run(courseService.updateLesson(l._id, { move: "up" }), "Could not move the lesson.")}><ArrowUp className="h-4 w-4" /></button>
                    <button className={iconBtn} disabled={li === s.lessons.length - 1} aria-label={`Move ${l.code} down`}
                      onClick={() => run(courseService.updateLesson(l._id, { move: "down" }), "Could not move the lesson.")}><ArrowDown className="h-4 w-4" /></button>
                    <button className={iconBtn} aria-label={`Edit ${l.code}`} onClick={() => setLesson({ id: l._id, sectionId: s._id })}><Pencil className="h-4 w-4" /></button>
                    <button className={iconBtn} aria-label={`Delete ${l.code}`}
                      onClick={() => window.confirm(`Delete lesson ${l.code} “${l.title}”? Everyone’s listening progress on it is removed too.`) && run(courseService.deleteLesson(l._id), "Could not delete the lesson.")}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {preview?.id === l._id && <audio src={preview.url} controls autoPlay className="mt-2 w-full" />}
              </li>
            ))}
            <li className="px-4 py-2 sm:px-5">
              <button className="flex items-center gap-1 text-[12.5px] font-medium text-teal hover:underline" onClick={() => setLesson({ sectionId: s._id })}>
                <Plus className="h-3.5 w-3.5" /> Add a lesson
              </button>
            </li>
          </ul>
        </NcCard>
      ))}

      {section && (
        <SectionModal courseKey={courseKey} section={section} onClose={() => setSection(null)} onSaved={() => { setSection(null); onChanged(); }} />
      )}
      {lesson && (
        <LessonModal courseKey={courseKey} lessonId={lesson.id} sectionId={lesson.sectionId} sections={sections}
          onClose={() => setLesson(null)} onSaved={() => { setLesson(null); onChanged(); }} />
      )}
    </div>
  );
}

function SectionModal({ courseKey, section, onClose, onSaved }: { courseKey: string; section: any; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ title: section.title ?? "", titleUr: section.titleUr ?? "", meta: section.meta ?? "" });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const r = section._id ? await courseService.updateSection(section._id, f) : await courseService.addSection(courseKey, f);
      toast({ title: apiMessage(r, "Module saved.") });
      onSaved();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save the module.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={section._id ? "Edit module" : "Add a module"}>
      <FormGroup label="Title" required><FormInput value={f.title} maxLength={150} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Module 1 · Why screens matter" /></FormGroup>
      <FormGroup label="Title in Urdu (optional)"><FormInput dir="rtl" lang="ur" className="urdu" value={f.titleUr} maxLength={150} onChange={(e) => setF({ ...f, titleUr: e.target.value })} /></FormGroup>
      <FormGroup label="Short note (optional)"><FormInput value={f.meta} maxLength={200} onChange={(e) => setF({ ...f, meta: e.target.value })} placeholder="e.g. 4 lessons · 25 minutes" /></FormGroup>
      <button className="btn-primary w-full" disabled={saving || !f.title.trim()} onClick={save}>{saving ? "Saving…" : "Save module"}</button>
    </Modal>
  );
}

function LessonModal({ courseKey, lessonId, sectionId, sections, onClose, onSaved }: {
  courseKey: string; lessonId?: string; sectionId: string; sections: any[]; onClose: () => void; onSaved: () => void;
}) {
  const { toast } = useToast();
  const [f, setF] = useState({ sectionId, title: "", topic: "", transcript: "" });
  const [loading, setLoading] = useState(!!lessonId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    courseService.lessonForEdit(lessonId)
      .then((r) => {
        const l = unwrap(r);
        setF({ sectionId: String(l.section), title: l.title ?? "", topic: l.topic ?? "", transcript: l.transcriptText ?? "" });
      })
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load the lesson.") }))
      .finally(() => setLoading(false));
  }, [lessonId, toast]);

  async function save() {
    setSaving(true);
    try {
      const r = lessonId
        ? await courseService.updateLesson(lessonId, { title: f.title, topic: f.topic, transcript: f.transcript, ...(f.sectionId !== sectionId && { sectionId: f.sectionId }) })
        : await courseService.addLesson(courseKey, f);
      toast({ title: apiMessage(r, "Lesson saved.") });
      onSaved();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save the lesson.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={lessonId ? "Edit lesson" : "Add a lesson"} subtitle="Upload the audio from the lesson row once it’s saved.">
      {loading ? <div className="py-10 text-center text-sm text-nc-muted">Loading…</div> : (
        <>
          <FormGroup label="Module">
            <FormSelect value={f.sectionId} onChange={(e) => setF({ ...f, sectionId: e.target.value })}>
              {sections.map((s) => <option key={s._id} value={s._id}>{s.title}</option>)}
            </FormSelect>
          </FormGroup>
          <FormGroup label="Title" required><FormInput dir="auto" value={f.title} maxLength={200} onChange={(e) => setF({ ...f, title: e.target.value })} /></FormGroup>
          <FormGroup label="Topic (optional)"><FormInput dir="auto" value={f.topic} maxLength={200} onChange={(e) => setF({ ...f, topic: e.target.value })} /></FormGroup>
          <FormGroup label="Script (shown with the audio; a blank line starts a new paragraph)">
            <FormTextarea dir="auto" rows={10} value={f.transcript} maxLength={50000} onChange={(e) => setF({ ...f, transcript: e.target.value })} />
          </FormGroup>
          <button className="btn-primary w-full" disabled={saving || !f.title.trim()} onClick={save}>{saving ? "Saving…" : "Save lesson"}</button>
        </>
      )}
    </Modal>
  );
}
