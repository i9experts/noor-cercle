import { useCallback, useEffect, useState } from "react";
import { Award, CheckCircle2, Circle, Clock, Headphones, Hourglass, Lock, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { marketplaceService } from "@/services/api.service";
import NcCard from "@/components/shared/NcCard";
import Modal from "@/components/shared/Modal";
import { cn } from "@/lib/utils";
import { apiError, apiMessage, formatDate, unwrap } from "@/lib/finance";
import { ExploreTraining, Lang, MyTraining, T, TrainingStep, stepLabel } from "@/lib/trainings";

/**
 * "My trainings" and "Explore": the trainings someone has, the steps left in
 * each, and the marketplace (locked ones show what unlocks them). Used by the
 * murabbi portal (English) and the parent portal (Urdu first).
 */
export default function TrainingsBoard({ lang, onOpen }: { lang: Lang; onOpen: (t: MyTraining) => void }) {
  const { toast } = useToast();
  const t = T[lang];
  const ur = lang === "ur";
  const [tab, setTab] = useState<"mine" | "explore">("mine");
  const [data, setData] = useState<{ mine: MyTraining[]; explore: ExploreTraining[] } | null>(null);
  const [asking, setAsking] = useState<ExploreTraining | null>(null);
  const [busy, setBusy] = useState("");

  const load = useCallback(() => {
    marketplaceService.mine()
      .then((r) => setData(unwrap(r)))
      .catch((err) => toast({ variant: "destructive", title: apiError(err, "Could not load your trainings.") }));
  }, [toast]);
  useEffect(load, [load]);

  async function cancel(x: ExploreTraining) {
    setBusy(x.key);
    try {
      toast({ title: apiMessage(await marketplaceService.cancel(x.key), "Request cancelled.") });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not cancel.") });
    } finally {
      setBusy("");
    }
  }

  const title = (x: { title: string; titleUr?: string }) => (ur && x.titleUr ? x.titleUr : x.title);
  const summary = (x: { summary?: string; summaryUr?: string }) => (ur && x.summaryUr ? x.summaryUr : x.summary);
  const textCls = ur ? "urdu leading-[2]" : "";
  const available = data?.explore.filter((x) => x.status !== "locked").length ?? 0;

  return (
    <div dir={ur ? "rtl" : "ltr"} lang={ur ? "ur" : "en"}>
      <div className="mb-4 flex gap-1 border-b border-border">
        {(["mine", "explore"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={cn("-mb-px border-b-2 px-3.5 py-2 text-[13.5px]", textCls, tab === k ? "border-plum font-semibold text-plum" : "border-transparent text-nc-muted hover:text-nc-dark")}>
            {t[k]}
            {k === "mine" && data ? <span className="mx-1.5 text-[11.5px] text-nc-muted">{data.mine.length}</span> : null}
            {k === "explore" && available ? <span className="mx-1.5 rounded-full bg-gold px-1.5 text-[11px] font-semibold text-[#361a2c]">{available}</span> : null}
          </button>
        ))}
      </div>

      {!data ? (
        <NcCard><div className={cn(textCls, "py-14 text-center text-sm text-nc-muted")}>{t.loading}</div></NcCard>
      ) : tab === "mine" ? (
        data.mine.length === 0 ? (
          <NcCard className="py-12 text-center">
            <Headphones className="mx-auto mb-3 h-8 w-8 text-pale" strokeWidth={1.5} />
            <p className={cn(textCls, "text-[13.5px] text-nc-muted")}>{t.noMine}</p>
          </NcCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.mine.map((m) => {
              const pct = m.lessonsTotal ? Math.round((m.lessonsCompleted / m.lessonsTotal) * 100) : 0;
              const left = m.steps.filter((s) => !s.done);
              return (
                <NcCard key={m.key} className="flex flex-col p-5">
                  <div className="mb-1 flex items-start gap-2">
                    <div className={cn("min-w-0 flex-1 font-serif text-[19px] text-nc-dark", ur && m.titleUr && "urdu font-sans text-[18px] leading-[2]")}>{title(m)}</div>
                    {m.certifiedAt && (
                      <span className={cn("inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-nc-green-lt px-2 py-0.5 text-[11px] font-semibold text-nc-green", textCls)}>
                        <Award className="h-3.5 w-3.5" /> {t.certified}
                      </span>
                    )}
                  </div>
                  {summary(m) && <p dir="auto" className={cn("mb-2 text-[12.5px] text-nc-muted", textCls)}>{summary(m)}</p>}
                  <div className="mt-1 flex items-center gap-2 text-[12px] text-nc-muted">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className={cn("h-full rounded-full", m.certifiedAt ? "bg-nc-green" : "bg-plum")} style={{ width: `${pct}%` }} />
                    </div>
                    <span dir="ltr">{m.lessonsCompleted}/{m.lessonsTotal}</span>
                  </div>
                  {m.dueDate && !m.certifiedAt && (
                    <div className={cn("mt-2 flex items-center gap-1 text-[12px] text-nc-dark", textCls)}>
                      <Clock className="h-3.5 w-3.5 text-nc-muted" /> {t.due}: <span dir="ltr">{formatDate(m.dueDate)}</span>
                    </div>
                  )}
                  {m.certifiedAt && m.certificateNumber && (
                    <div className="mt-2 text-[12px] text-nc-muted">
                      <span className={textCls}>{t.certificate}</span> <span dir="ltr">{m.certificateNumber} · {formatDate(m.certifiedAt)}</span>
                    </div>
                  )}
                  {left.length > 0 && (
                    <div className="mt-3">
                      <div className={cn("mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-gold-dim", ur && "urdu normal-case tracking-normal")}>{t.stepsLeft}</div>
                      <Steps steps={m.steps} lang={lang} />
                    </div>
                  )}
                  <button className={cn("mt-4 justify-center !py-2 text-[12.5px]", m.certifiedAt ? "btn-outline" : "btn-primary", textCls)} onClick={() => onOpen(m)}>
                    {m.certifiedAt ? t.open : m.lessonsCompleted ? t.continue : t.start}
                  </button>
                </NcCard>
              );
            })}
          </div>
        )
      ) : data.explore.length === 0 ? (
        <NcCard className="py-12 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-pale" strokeWidth={1.5} />
          <p className={cn(textCls, "text-[13.5px] text-nc-muted")}>{t.noExplore}</p>
        </NcCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.explore.map((x) => (
            <NcCard key={x.key} className={cn("flex flex-col p-5", x.status === "locked" && "bg-muted/30")}>
              <div className="mb-1 flex items-start gap-2">
                {x.status === "locked" && <Lock className="mt-1.5 h-4 w-4 flex-shrink-0 text-nc-muted" />}
                <div className={cn("min-w-0 flex-1 font-serif text-[19px] text-nc-dark", ur && x.titleUr && "urdu font-sans text-[18px] leading-[2]")}>{title(x)}</div>
                {x.category && <span dir="auto" className="flex-shrink-0 rounded-full bg-plum-lt px-2 py-0.5 text-[11px] text-plum">{x.category}</span>}
              </div>
              {summary(x) && <p dir="auto" className={cn("mb-2 text-[12.5px] text-nc-muted", textCls)}>{summary(x)}</p>}
              <div className="text-[12px] text-nc-muted">
                <span dir="ltr">{x.lessons}</span> <span className={textCls}>{t.lessons}</span> · <span dir="ltr">{x.minutes}</span> <span className={textCls}>{t.min}</span>
                {x.badge && <> · <span dir="auto">{x.badge}</span></>}
              </div>
              {x.declined && x.status !== "requested" && (
                <p className={cn("mt-2 rounded-md bg-nc-amber-lt px-3 py-2 text-[12px] text-nc-dark", textCls)}>
                  {t.declined}{x.declined.reason ? <>: <span dir="auto">{x.declined.reason}</span></> : "."}
                </p>
              )}
              {x.status === "locked" && (
                <div className="mt-3">
                  <div className={cn("mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-gold-dim", ur && "urdu normal-case tracking-normal")}>{t.unlockWhen}</div>
                  <Steps steps={x.conditions} lang={lang} />
                </div>
              )}
              <div className="mt-auto pt-4">
                {x.status === "available" && (
                  <button className={cn("btn-primary w-full justify-center !py-2 text-[12.5px]", textCls)} onClick={() => setAsking(x)}>{t.ask}</button>
                )}
                {x.status === "requested" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1 rounded-full bg-gold-lt px-2.5 py-1 text-[12px] font-medium text-gold-dim", textCls)}>
                      <Hourglass className="h-3.5 w-3.5" /> {t.requested}
                    </span>
                    <button className={cn("text-[12px] text-nc-muted hover:text-nc-red", textCls)} disabled={busy === x.key} onClick={() => cancel(x)}>{t.cancel}</button>
                  </div>
                )}
              </div>
            </NcCard>
          ))}
        </div>
      )}

      {asking && <AskModal training={asking} lang={lang} onClose={() => setAsking(null)} onSent={() => { setAsking(null); load(); }} />}
    </div>
  );
}

function Steps({ steps, lang }: { steps: TrainingStep[]; lang: Lang }) {
  return (
    <ul className="space-y-1">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-2 text-[12.5px]">
          {s.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-nc-green" /> : <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-nc-muted" />}
          <span className={cn(s.done ? "text-nc-muted" : "text-nc-dark", lang === "ur" && "urdu leading-[1.9]")}>
            {stepLabel(s.label, lang)}
            {s.detail && <span dir="auto" className="mx-1 font-sans text-[11.5px] text-nc-muted">({s.detail})</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function AskModal({ training, lang, onClose, onSent }: { training: ExploreTraining; lang: Lang; onClose: () => void; onSent: () => void }) {
  const { toast } = useToast();
  const t = T[lang];
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    try {
      toast({ title: apiMessage(await marketplaceService.request(training.key, note.trim() || undefined), "Request sent.") });
      onSent();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not send the request.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={lang === "ur" && training.titleUr ? training.titleUr : training.title} subtitle={lang === "ur" ? undefined : "The team reviews every request and opens the training for you."}>
      <div dir={lang === "ur" ? "rtl" : "ltr"}>
        {lang === "ur" && <p className="urdu mb-3 text-[14px] leading-[2] text-nc-muted">ٹیم ہر درخواست دیکھ کر آپ کے لیے تربیت کھول دے گی۔</p>}
        <textarea dir="auto" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} placeholder={t.notePlaceholder}
          className={cn("w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-[13.5px] focus:border-primary focus:outline-none", lang === "ur" && "urdu leading-[2]")} />
        <div className="mt-4 flex gap-2">
          <button className={cn("btn-primary flex-1 justify-center", lang === "ur" && "urdu")} disabled={busy} onClick={send}>{t.send}</button>
          <button className="btn-outline" onClick={onClose}>{lang === "ur" ? "واپس" : "Cancel"}</button>
        </div>
      </div>
    </Modal>
  );
}
