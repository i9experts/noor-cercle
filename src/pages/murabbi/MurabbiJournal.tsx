import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowLeft, Check, ChevronLeft, ChevronRight, Headphones, Lock, NotebookPen, Play, Printer, ShieldCheck, Sparkles, Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { courseService, murabbisService } from "@/services/api.service";
import NcCard from "@/components/shared/NcCard";
import DeleteConfirmModal from "@/components/shared/DeleteConfirmModal";
import { cn } from "@/lib/utils";
import { apiError, apiMessage, unwrap } from "@/lib/finance";
import { ASAAS_KEY, hasUrdu } from "@/lib/course";
import {
  MOMENTS_LESSON, MOMENTS_VIEW, journalService, momentDate, pkToday, printJournal,
  type JournalData, type JournalField, type JournalPage,
} from "@/lib/journal";

const PAPER = "relative overflow-hidden rounded-xl border border-gold/35 bg-[#fffdf8] shadow-nc";

/** Ruled-paper lines behind a textarea, matching its line height. */
function ruled(lineHeight: number): CSSProperties {
  return {
    lineHeight: `${lineHeight}px`,
    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${lineHeight - 1}px, rgba(199,148,70,.3) ${lineHeight - 1}px, rgba(199,148,70,.3) ${lineHeight}px)`,
    backgroundAttachment: "local",
    backgroundPosition: "0 10px",
  };
}

function Urdu({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div dir="rtl" lang="ur" className={cn("urdu text-right", className)}>{children}</div>;
}

interface Props {
  /** A page key or "moments" to open at. */
  initialView?: string | null;
  /** Preselects a circle when opening Moments of light. */
  initialCircleId?: string | null;
  onNavigate?: (page: string) => void;
}

export default function MurabbiJournal({ initialView = null, initialCircleId = null, onNavigate }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<JournalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<string | null>(initialView);

  const load = useCallback(async () => {
    try {
      setData(unwrap<JournalData>(await journalService.get()));
      setFailed(false);
    } catch (err) {
      setFailed(true);
      toast({ variant: "destructive", title: apiError(err, "Could not open your journal.") });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const go = (v: string | null) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSaved = useCallback((key: string, answers: Record<string, string>, done: boolean) => {
    setData((d) => {
      if (!d) return d;
      const pages = d.pages.map((p) => (p.key === key ? { ...p, answers, done, updatedAt: new Date().toISOString() } : p));
      return { ...d, pages, progress: { ...d.progress, done: pages.filter((p) => p.done).length } };
    });
  }, []);

  if (loading) return <NcCard><div className="py-16 text-center text-sm text-nc-muted">Opening your journal…</div></NcCard>;
  if (failed || !data) {
    return (
      <NcCard className="py-14 text-center">
        <NotebookPen className="mx-auto mb-3 h-9 w-9 text-pale" strokeWidth={1.5} />
        <div className="text-sm font-medium text-nc-dark">Your journal couldn’t be opened just now</div>
        <button className="btn-outline mt-4 !py-2 text-[12.5px]" onClick={() => { setLoading(true); load(); }}>Try again</button>
      </NcCard>
    );
  }

  const views = [...data.pages.map((p) => p.key), MOMENTS_VIEW];
  const idx = view ? views.indexOf(view) : -1;
  const page = data.pages.find((p) => p.key === view);
  const toCourse = onNavigate ? () => onNavigate("murabbi-course") : undefined;
  const nav = idx >= 0 && (
    <PageNav
      prev={idx > 0 ? views[idx - 1] : null}
      next={idx < views.length - 1 ? views[idx + 1] : null}
      label={(v) => (v === MOMENTS_VIEW ? "Moments of light" : `${data.pages.find((p) => p.key === v)?.number}. ${data.pages.find((p) => p.key === v)?.titleEn}`)}
      onGo={go}
    />
  );

  return (
    <div className="page-animate mx-auto max-w-4xl">
      {!data.assigned && (
        <div className="mb-4 rounded-lg border border-gold/30 bg-gold/[0.07] px-4 py-3 text-[12.5px] text-nc-dark">
          Your journal’s pages open as you listen to the Asaas Training. It hasn’t been assigned to you yet; you’ll get a notification when it is.
        </div>
      )}

      {view === null || idx < 0 ? (
        <>
          <Cover data={data} />
          <Contents data={data} onOpen={go} />
        </>
      ) : (
        <>
          <button className="mb-3 inline-flex items-center gap-1 text-[12.5px] text-nc-muted hover:text-nc-dark" onClick={() => go(null)}>
            <ArrowLeft className="h-3.5 w-3.5" /> Noor Journal · all pages
          </button>
          {view === MOMENTS_VIEW ? (
            <MomentsView data={data} initialCircleId={initialCircleId} onChanged={load} toCourse={toCourse} />
          ) : page && page.kind === "reflection" ? (
            <ReflectionPage page={page} onChanged={load} toCourse={toCourse} />
          ) : page && !page.open ? (
            <LockedPage page={page} toCourse={toCourse} />
          ) : page ? (
            <WritingPage key={page.key} page={page} onSaved={onSaved} />
          ) : null}
          {nav}
        </>
      )}
    </div>
  );
}

// ── Cover & contents ────────────────────────────────────────────────────────

function Cover({ data }: { data: JournalData }) {
  const { done, total } = data.progress;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className={cn(PAPER, "mb-6 px-5 py-6 pl-7 sm:px-10 sm:py-8 sm:pl-12")}>
      <div className="absolute inset-y-0 left-0 w-2 bg-plum" aria-hidden />
      <div className="absolute inset-y-0 left-2 w-px bg-gold/60" aria-hidden />
      <div className="text-center">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gold-dim">Noor Circles</div>
        <Urdu className="mt-2 !text-center text-[17px] leading-[2.4] text-plum">بسم اللہ الرحمٰن الرحیم</Urdu>
        <h2 className="mt-1 font-serif text-[28px] leading-tight text-plum sm:text-[32px]">Noor Journal</h2>
        <Urdu className="!text-center text-[22px] leading-[2.2] text-plum">نور جرنل</Urdu>
        <div className="mx-auto my-3 h-px w-24 bg-gold" />
        <div className="font-serif text-[18px] text-nc-dark">{data.owner}</div>
        <div className="mx-auto mt-4 max-w-xs">
          <div className="h-1.5 overflow-hidden rounded-full bg-gold/15">
            <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1.5 text-[12px] text-nc-muted">{done} of {total} pages written</div>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 border-t border-gold/25 pt-4 sm:flex-row sm:items-center">
        <p className="flex flex-1 items-start gap-2 text-[12px] leading-relaxed text-nc-muted">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-plum" />
          <span>
            Private: only you can read your journal. The Noor Circles team sees only how many pages you’ve written
            (and your final reflection, which they review).
          </span>
        </p>
        <button className="btn-outline flex-shrink-0 justify-center !py-2 text-[12.5px]" onClick={() => printJournal(data)}>
          <Printer className="h-3.5 w-3.5" /> Print my journal
        </button>
      </div>
    </div>
  );
}

function Contents({ data, onOpen }: { data: JournalData; onOpen: (v: string) => void }) {
  const m = data.moments;
  return (
    <div className={cn(PAPER, "p-2 sm:p-3")}>
      <div className="px-3 pb-1 pt-3 sm:px-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dim">Contents</div>
      </div>
      <ol>
        {data.pages.map((p) => (
          <li key={p.key}>
            <button
              onClick={() => onOpen(p.key)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gold/[0.08] sm:px-4"
            >
              <span className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-serif text-[14px]",
                p.done ? "bg-plum text-white" : p.open ? "border border-plum/40 text-plum" : "border border-border text-nc-muted")}>
                {p.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[13.5px] font-semibold", p.open ? "text-nc-dark" : "text-nc-muted")}>{p.titleEn}</span>
                <span dir="rtl" lang="ur" className="urdu block text-right text-[13px] leading-[2] text-nc-muted">{p.titleUr}</span>
              </span>
              <PageStatus done={p.done} open={p.open} code={p.lessonCode} />
            </button>
          </li>
        ))}
        <li className="mt-1 border-t border-dashed border-gold/40 pt-1">
          <button
            onClick={() => onOpen(MOMENTS_VIEW)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gold/[0.08] sm:px-4"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dim">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block text-[13.5px] font-semibold", m.open ? "text-nc-dark" : "text-nc-muted")}>
                Moments of light{m.list.length ? <span className="font-normal text-nc-muted"> · {m.list.length}</span> : null}
              </span>
              <span dir="rtl" lang="ur" className="urdu block text-right text-[13px] leading-[2] text-nc-muted">روشن لمحے</span>
            </span>
            <PageStatus done={false} open={m.open} code={MOMENTS_LESSON} />
          </button>
        </li>
      </ol>
    </div>
  );
}

function PageStatus({ done, open, code }: { done: boolean; open: boolean; code: string }) {
  if (done) return <span className="flex flex-shrink-0 items-center gap-1 text-[11.5px] font-semibold text-nc-green"><Check className="h-4 w-4" /><span className="hidden sm:inline">Written</span></span>;
  if (!open) {
    return (
      <span className="flex max-w-[110px] flex-shrink-0 items-center gap-1 text-right text-[11px] leading-tight text-nc-muted sm:max-w-none">
        <Lock className="h-3.5 w-3.5 flex-shrink-0" /> Listen to {code} first
      </span>
    );
  }
  return <ChevronRight className="h-4 w-4 flex-shrink-0 text-nc-muted" />;
}

function PageNav({ prev, next, label, onGo }: { prev: string | null; next: string | null; label: (v: string) => string; onGo: (v: string) => void }) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
      <div>
        {prev && (
          <button className="btn-outline w-full justify-start !px-3 !py-2 text-left text-[12px]" onClick={() => onGo(prev)}>
            <ChevronLeft className="h-4 w-4 flex-shrink-0" /><span className="min-w-0 truncate">{label(prev)}</span>
          </button>
        )}
      </div>
      <div>
        {next && (
          <button className="btn-outline w-full justify-end !px-3 !py-2 text-right text-[12px]" onClick={() => onGo(next)}>
            <span className="min-w-0 truncate">{label(next)}</span><ChevronRight className="h-4 w-4 flex-shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── A page ──────────────────────────────────────────────────────────────────

function PageHeader({ page }: { page: JournalPage }) {
  return (
    <div className="mb-4 flex items-start gap-3 border-b border-gold/40 pb-3">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-plum font-serif text-[17px] text-white">{page.number}</span>
      <div className="min-w-0 flex-1">
        <h2 className="font-serif text-[21px] leading-tight text-plum sm:text-[24px]">{page.titleEn}</h2>
        <Urdu className="text-[16px] leading-[2.1] text-plum/80">{page.titleUr}</Urdu>
      </div>
      {page.done && <span className="mt-1 flex flex-shrink-0 items-center gap-1 rounded-full bg-nc-green-lt px-2 py-0.5 text-[11px] font-semibold text-nc-green"><Check className="h-3 w-3" /> Written</span>}
    </div>
  );
}

function Intro({ page }: { page: JournalPage }) {
  return (
    <>
      <div className="mb-3">
        <Urdu className="text-[15.5px] leading-[2.3] text-nc-dark">{page.introUr}</Urdu>
        <p className="mt-1 text-[13px] leading-relaxed text-nc-muted">{page.introEn}</p>
      </div>
      {(page.hintUr || page.hintEn) && (
        <div className="mb-4 rounded-lg border border-gold/30 bg-gold/[0.07] px-4 py-2.5">
          {page.hintUr && <Urdu className="text-[14px] leading-[2.2] text-nc-dark">{page.hintUr}</Urdu>}
          {page.hintEn && <p className="mt-0.5 text-[12.5px] leading-relaxed text-nc-muted">{page.hintEn}</p>}
        </div>
      )}
    </>
  );
}

/** Plays the lesson inline (a replay here doesn't count towards progress). */
function ListenButton({ page }: { page: JournalPage }) {
  const { toast } = useToast();
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!page.lesson) return null;

  async function play() {
    setBusy(true);
    try {
      setUrl(unwrap(await courseService.play(page.lesson!._id)).audioUrl);
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not play this lesson.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-5">
      {url ? (
        <div className="rounded-lg border border-plum/15 bg-plum/[0.04] p-3">
          <div className="mb-2 flex items-center gap-2 text-[12px] text-nc-muted">
            <Headphones className="h-3.5 w-3.5 text-plum" /> {page.lessonCode} · <span dir="auto" className="min-w-0 truncate">{page.lesson.title}</span>
          </div>
          <audio src={url} controls autoPlay className="w-full" />
        </div>
      ) : (
        <button className="btn-outline !py-2 text-[12.5px]" onClick={play} disabled={busy}>
          <Play className="h-3.5 w-3.5" /> {busy ? "Opening…" : `Listen to this part (${page.lessonCode})`}
        </button>
      )}
    </div>
  );
}

function LockedPage({ page, toCourse }: { page: JournalPage; toCourse?: () => void }) {
  return (
    <div className={cn(PAPER, "p-5 sm:p-8")}>
      <PageHeader page={page} />
      <div className="py-6 text-center">
        <Lock className="mx-auto mb-3 h-8 w-8 text-gold-dim" strokeWidth={1.5} />
        <p className="mx-auto max-w-md text-[13.5px] text-nc-dark">
          This page opens after you listen to <span className="font-semibold" dir="auto">{page.lesson?.title ?? "its lesson"}</span> ({page.lessonCode}) in Asaas Training.
        </p>
        {toCourse && (
          <button className="btn-primary mt-4 !py-2 text-[12.5px]" onClick={toCourse}>
            <Headphones className="h-3.5 w-3.5" /> Go to Asaas Training
          </button>
        )}
      </div>
    </div>
  );
}

type SaveState = "idle" | "saving" | "saved" | "error";

function WritingPage({ page, onSaved }: { page: JournalPage; onSaved: (key: string, answers: Record<string, string>, done: boolean) => void }) {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>(() => ({ ...(page.answers ?? {}) }));
  const [state, setState] = useState<SaveState>("idle");
  const latest = useRef(answers);
  const dirty = useRef(false);
  const inflight = useRef(false);
  const queued = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const wasDone = useRef(page.done);

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    if (inflight.current) { queued.current = true; return; }
    dirty.current = false;
    inflight.current = true;
    setState("saving");
    const snapshot = { ...latest.current };
    try {
      const r = unwrap<{ done: boolean; points: number }>(await journalService.save(page.key, snapshot));
      setState("saved");
      onSaved(page.key, snapshot, r.done);
      if (r.done && !wasDone.current) {
        toast({ title: "This page is complete. MashaAllah!", description: r.points ? `+${r.points} training points` : undefined });
      }
      wasDone.current = r.done;
    } catch (err) {
      dirty.current = true;
      setState("error");
      toast({ variant: "destructive", title: apiError(err, "Couldn’t save this page.") });
    } finally {
      inflight.current = false;
      if (queued.current) { queued.current = false; dirty.current = true; save(); }
    }
  }, [page.key, onSaved, toast]);

  // Save anything still waiting when the page is left.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => () => { if (dirty.current) saveRef.current(); }, []);

  function change(key: string, value: string, immediate = false) {
    const next = { ...latest.current, [key]: value };
    latest.current = next;
    setAnswers(next);
    dirty.current = true;
    clearTimeout(timer.current);
    if (immediate) save();
    else timer.current = setTimeout(save, 1200);
  }

  return (
    <div className={cn(PAPER, "p-4 sm:p-8")}>
      <PageHeader page={page} />
      <Intro page={page} />
      <ListenButton page={page} />
      <div className="space-y-6">
        {page.fields.map((f) => (
          <FieldInput key={f.key} field={f} value={answers[f.key] ?? ""} onChange={(v, now) => change(f.key, v, now)} onBlur={save} />
        ))}
      </div>
      <div className="mt-5 flex min-h-[20px] items-center justify-end gap-1.5 text-[11.5px]" aria-live="polite">
        {state === "saving" && <span className="text-nc-muted">Saving…</span>}
        {state === "saved" && <span className="flex items-center gap-1 text-nc-green"><Check className="h-3.5 w-3.5" /> Saved</span>}
        {state === "error" && <span className="text-nc-red">Not saved yet; it will try again when you keep writing.</span>}
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange, onBlur }: {
  field: JournalField; value: string; onChange: (v: string, immediate?: boolean) => void; onBlur: () => void;
}) {
  const id = `jf-${field.key}`;
  const ur = hasUrdu(value);
  const label = (
    <label htmlFor={field.kind === "choice" ? undefined : id} className="mb-1.5 block">
      <Urdu className="text-[15px] leading-[2.2] text-nc-dark">{field.labelUr}</Urdu>
      <span className="block text-[12.5px] font-medium text-nc-muted">{field.labelEn}</span>
    </label>
  );

  if (field.kind === "choice") {
    return (
      <div role="group" aria-label={field.labelEn}>
        {label}
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((o) => {
            const on = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={on}
                onClick={() => onChange(on ? "" : o.value, true)}
                className={cn("max-w-full rounded-lg border px-3 py-1.5 text-left transition-colors",
                  on ? "border-plum bg-plum text-white" : "border-gold/40 bg-white/60 text-nc-dark hover:border-plum/50")}
              >
                <span dir="rtl" lang="ur" className={cn("urdu block text-right text-[13.5px] leading-[2]", on ? "text-white" : "text-nc-dark")}>{o.ur}</span>
                <span className={cn("block text-[11.5px]", on ? "text-white/80" : "text-nc-muted")}>{o.en}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.kind === "text") {
    return (
      <div>
        {label}
        <input
          id={id}
          value={value}
          dir="auto"
          maxLength={3000}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={cn("w-full border-0 border-b border-gold/50 bg-transparent px-1 py-1.5 text-[14.5px] text-nc-dark focus:border-plum focus:outline-none",
            ur && "urdu text-[15px] leading-[2.2]")}
        />
      </div>
    );
  }

  return (
    <div>
      {label}
      <textarea
        id={id}
        value={value}
        dir="auto"
        rows={4}
        maxLength={3000}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        style={ruled(ur ? 40 : 30)}
        className={cn("w-full resize-y rounded-md border border-gold/30 bg-transparent px-3 pb-2 pt-[10px] text-[14.5px] text-nc-dark focus:border-plum focus:outline-none",
          ur && "urdu text-[15px]")}
      />
    </div>
  );
}

// ── Final reflection (read by the team) ─────────────────────────────────────

function ReflectionPage({ page, onChanged, toCourse }: { page: JournalPage; onChanged: () => void; toCourse?: () => void }) {
  const { toast } = useToast();
  const r = page.reflection ?? null;
  const [text, setText] = useState(r?.text ?? "");
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState(false);
  const min = page.minChars ?? 0;
  const writable = page.open && (!r || r.status === "revision" || (r.status === "submitted" && editing));
  const prompt = page.prompt?.trim();

  async function send() {
    setSending(true);
    try {
      const res = await courseService.reflect(ASAAS_KEY, text);
      toast({ title: apiMessage(res, "Your reflection has been sent to the Noor Circles team.") });
      setEditing(false);
      onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not send your reflection.") });
    } finally {
      setSending(false);
    }
  }

  const chip = r && (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold",
      r.status === "approved" ? "bg-nc-green-lt text-nc-green" : r.status === "revision" ? "bg-nc-amber-lt text-nc-amber" : "bg-teal-lt text-teal")}>
      {r.status === "approved" ? "Approved" : r.status === "revision" ? "Revision requested" : "Waiting for review"}
    </span>
  );

  return (
    <div className={cn(PAPER, "p-4 sm:p-8")}>
      <PageHeader page={page} />
      <Intro page={page} />
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-plum/20 bg-plum/[0.05] px-4 py-2.5 text-[12.5px] leading-relaxed text-nc-dark">
        <NotebookPen className="mt-0.5 h-4 w-4 flex-shrink-0 text-plum" />
        <span>
          This is the one page of your journal the Noor Circles team reads. It goes to the admin team for review,
          and they may send you feedback. It opens once you’ve heard every lesson of the training.
        </span>
      </div>
      {page.open && <ListenButton page={page} />}

      {prompt && (
        <p dir={hasUrdu(prompt) ? "rtl" : "ltr"} lang={hasUrdu(prompt) ? "ur" : undefined}
          className={cn("mb-4 whitespace-pre-wrap rounded-lg bg-gold/[0.08] px-4 py-3 text-nc-dark",
            hasUrdu(prompt) ? "urdu text-right text-[15px] leading-[2.2]" : "text-[13.5px] leading-relaxed")}>
          {prompt}
        </p>
      )}

      {r && <div className="mb-3 flex flex-wrap items-center gap-2 text-[12.5px] text-nc-muted">Your reflection {chip}</div>}
      {r?.status === "revision" && r.feedback && (
        <p className="mb-3 rounded-md border border-nc-amber/30 bg-nc-amber-lt px-3 py-2 text-[12.5px] text-nc-dark">
          <span className="font-semibold">Feedback:</span> {r.feedback}
        </p>
      )}
      {r?.status === "approved" && r.feedback && (
        <p className="mb-3 rounded-md border border-nc-green/30 bg-nc-green-lt px-3 py-2 text-[12.5px] text-nc-dark">
          <span className="font-semibold">Feedback:</span> {r.feedback}
        </p>
      )}

      {r && !writable ? (
        <>
          <p dir="auto" className={cn("whitespace-pre-wrap rounded-md border border-gold/30 px-4 py-3 text-nc-dark",
            hasUrdu(r.text) ? "urdu text-[15px] leading-[2.2]" : "text-[14px] leading-relaxed")}>{r.text}</p>
          {r.status === "submitted" && page.open && (
            <button className="btn-outline mt-3 !py-1.5 text-[12px]" onClick={() => setEditing(true)}>Edit before review</button>
          )}
        </>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!page.open}
            dir="auto"
            rows={10}
            aria-label="Your final reflection"
            placeholder={page.open ? "Write in Urdu or English…" : ""}
            style={ruled(hasUrdu(text) ? 40 : 30)}
            className={cn("w-full resize-y rounded-md border border-gold/30 bg-transparent px-3 pb-2 pt-[10px] text-[14.5px] text-nc-dark focus:border-plum focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
              hasUrdu(text) && "urdu text-[15px]")}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className={cn("text-[11.5px]", text.trim().length < min ? "text-nc-muted" : "text-nc-green")}>
              {text.trim().length} / {min} characters minimum
            </span>
            <button className="btn-primary !py-2 text-[12.5px]" disabled={!page.open || sending || text.trim().length < min} onClick={send}>
              {sending ? "Sending…" : "Send to the Noor Circles team"}
            </button>
          </div>
          {!page.open && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[12.5px] text-nc-muted">
              <Lock className="h-4 w-4 text-gold-dim" />
              <span className="min-w-0 flex-1">This page opens after you listen to {page.lesson?.title ?? "the final lesson"} ({page.lessonCode}) in Asaas Training.</span>
              {toCourse && <button className="btn-outline !py-1.5 text-[12px]" onClick={toCourse}>Go to Asaas Training</button>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Moments of light ────────────────────────────────────────────────────────

function MomentsView({ data, initialCircleId, onChanged, toCourse }: {
  data: JournalData; initialCircleId: string | null; onChanged: () => Promise<void> | void; toCourse?: () => void;
}) {
  const { toast } = useToast();
  const m = data.moments;
  const [circles, setCircles] = useState<{ _id: string; name: string }[]>([]);
  const [text, setText] = useState("");
  const [date, setDate] = useState(pkToday());
  const [circleId, setCircleId] = useState(initialCircleId ?? "");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!m.open) return;
    murabbisService.getMyCircles()
      .then((r) => setCircles(unwrap<any[]>(r) ?? []))
      .catch(() => {});
  }, [m.open]);

  async function add() {
    setSaving(true);
    try {
      const res = await journalService.addMoment({ text: text.trim(), date, circleId: circleId || undefined });
      toast({ title: apiMessage(res, "Moment saved.") });
      setText("");
      await onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save this moment.") });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!removing) return;
    setBusy(true);
    try {
      const res = await journalService.deleteMoment(removing);
      toast({ title: apiMessage(res, "Moment removed.") });
      setRemoving(null);
      await onChanged();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not remove this moment.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn(PAPER, "p-4 sm:p-8")}>
      <div className="mb-4 flex items-start gap-3 border-b border-gold/40 pb-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold-dim"><Sparkles className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-[21px] leading-tight text-plum sm:text-[24px]">Moments of light</h2>
          <Urdu className="text-[16px] leading-[2.1] text-plum/80">روشن لمحے</Urdu>
        </div>
      </div>
      <p className="mb-4 text-[13px] leading-relaxed text-nc-muted">
        Small moments from your circles worth remembering: a child’s question, a smile, a change you noticed. Write them down while they’re fresh.
      </p>

      {!m.open ? (
        <div className="py-6 text-center">
          <Lock className="mx-auto mb-3 h-8 w-8 text-gold-dim" strokeWidth={1.5} />
          <p className="mx-auto max-w-md text-[13.5px] text-nc-dark">
            Moments of light open after you listen to <span className="font-semibold" dir="auto">{m.lesson?.title ?? "its lesson"}</span> ({MOMENTS_LESSON}) in Asaas Training.
          </p>
          {toCourse && (
            <button className="btn-primary mt-4 !py-2 text-[12.5px]" onClick={toCourse}>
              <Headphones className="h-3.5 w-3.5" /> Go to Asaas Training
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-lg border border-gold/30 bg-white/50 p-3 sm:p-4">
            <div className="mb-2 text-[13px] font-semibold text-nc-dark">Add a moment</div>
            <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="block text-[11.5px] text-nc-muted">
                Date
                <input type="date" value={date} max={pkToday()} onChange={(e) => setDate(e.target.value)}
                  className="mt-0.5 h-9 w-full rounded-md border border-input bg-card px-2.5 text-[13px] text-nc-dark focus:border-primary focus:outline-none" />
              </label>
              <label className="block text-[11.5px] text-nc-muted">
                Circle (optional)
                <select value={circleId} onChange={(e) => setCircleId(e.target.value)}
                  className="mt-0.5 h-9 w-full rounded-md border border-input bg-card px-2.5 text-[13px] text-nc-dark focus:border-primary focus:outline-none">
                  <option value="">No circle</option>
                  {circles.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </label>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              dir="auto"
              rows={3}
              maxLength={2000}
              aria-label="The moment"
              placeholder="What happened? · کیا ہوا؟"
              style={ruled(hasUrdu(text) ? 40 : 30)}
              className={cn("w-full resize-y rounded-md border border-gold/30 bg-transparent px-3 pb-2 pt-[10px] text-[14.5px] text-nc-dark focus:border-plum focus:outline-none",
                hasUrdu(text) && "urdu text-[15px]")}
            />
            <div className="mt-2 flex justify-end">
              <button className="btn-gold !py-2 text-[12.5px]" disabled={saving || !text.trim() || !date} onClick={add}>
                {saving ? "Saving…" : "Save this moment"}
              </button>
            </div>
          </div>

          {m.list.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-nc-muted">No moments yet. The first one is waiting in your next circle.</p>
          ) : (
            <ul className="space-y-3">
              {m.list.map((x) => (
                <li key={x._id} className="rounded-lg border-l-[3px] border-gold bg-white/60 px-4 py-3">
                  <div className="mb-1 flex items-start gap-2">
                    <div className="min-w-0 flex-1 text-[11.5px] font-semibold uppercase tracking-wide text-gold-dim">
                      {momentDate(x.date)}{x.circle ? <span className="normal-case tracking-normal text-nc-muted"> · {x.circle.name}</span> : null}
                    </div>
                    <button className="flex-shrink-0 rounded p-1 text-nc-muted hover:bg-nc-red-lt hover:text-nc-red" aria-label="Delete this moment" onClick={() => setRemoving(x._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p dir="auto" className={cn("whitespace-pre-wrap break-words text-nc-dark",
                    hasUrdu(x.text) ? "urdu text-[15px] leading-[2.2]" : "text-[13.5px] leading-relaxed")}>{x.text}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <DeleteConfirmModal
        open={!!removing}
        title="Delete this moment?"
        message="It will be removed from your journal. This can’t be undone."
        loading={busy}
        onConfirm={remove}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}
