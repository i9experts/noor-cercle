import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, Headphones, RotateCcw, XCircle } from "lucide-react";
import HostShell, { Bi, HostCard } from "@/components/host/HostShell";
import ParentCertificate from "@/components/course/ParentCertificate";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { apiError, unwrap } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { hostCertificateData } from "@/lib/hostCertificate";
import { CheckResult, HostModule, HostTrainingData, apiUrl, hostService } from "@/lib/host";

/** Asaas for Hosts: six written modules, each with a four-question check, and a certificate at the end. */
export default function HostTraining() {
  const { user } = useAuth();
  const [data, setData] = useState<HostTrainingData | null>(null);
  const [error, setError] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const load = useCallback(() => {
    hostService.training()
      .then((r) => setData(unwrap<HostTrainingData>(r)))
      .catch((err) => setError(apiError(err, "We couldn’t open the training right now. Please try again later.")));
  }, []);

  useEffect(() => { document.title = "Asaas for Hosts · Noor Circles"; load(); }, [load]);

  const open = data?.modules.find((m) => m.key === openKey) ?? null;
  const pct = data?.total ? Math.round((data.done / data.total) * 100) : 0;
  const name = data?.name || user?.fullName || "";

  function openModule(key: string | null) {
    setOpenKey(key);
    window.scrollTo(0, 0);
  }

  return (
    <HostShell titleUr="میزبانوں کا Asaas" titleEn="Asaas for Hosts">
      {error ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-[14px] text-nc-dark shadow-nc">{error}</div>
      ) : !data ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-[13px] text-nc-muted shadow-nc">Loading…</div>
      ) : open ? (
        <ModuleView key={open.key} module={open} name={name} onBack={() => openModule(null)} onPassed={load} />
      ) : (
        <>
          <HostCard ur="آپ کی پیش رفت" en="Your progress">
            <div className="flex items-center gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-plum transition-all" style={{ width: `${pct}%` }} /></div>
              <span className="text-[13px] font-medium text-nc-dark">{data.done} of {data.total}</span>
            </div>
            <Bi className="mt-2" urCls="text-[14px]"
              ur="ہر حصہ پڑھیں، پھر چار سوالوں کے جواب دیں۔ تین درست ہوں تو حصہ مکمل۔"
              en="Read each module, then answer its four questions. Three right and the module is done." />
          </HostCard>

          {data.certificate && (
            <ParentCertificate printLabel="Download / Print"
              data={hostCertificateData({ name, number: data.certificate.number, issuedOn: data.certificate.issuedOn })} />
          )}

          <ol className="space-y-2.5">
            {data.modules.map((m) => (
              <li key={m.key}>
                <button onClick={() => openModule(m.key)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-nc transition-colors hover:border-plum/40">
                  <span className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-semibold",
                    m.passedAt ? "bg-nc-green-lt text-nc-green" : "bg-plum-lt text-plum")}>
                    {m.passedAt ? <CheckCircle2 className="h-5 w-5" /> : m.number}
                  </span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-nc-muted" />
                  <div className="min-w-0 flex-1 text-right">
                    <div dir="rtl" lang="ur" className="urdu text-[16px] leading-[2] text-nc-dark">{m.titleUr}</div>
                    <div className="text-[12.5px] text-nc-muted">
                      {m.audio && <Headphones className="mr-1 inline h-3.5 w-3.5" />}
                      {m.number}. {m.titleEn}{m.passedAt ? " · passed" : m.attempts ? ` · ${m.attempts} ${m.attempts === 1 ? "try" : "tries"}` : ""}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </HostShell>
  );
}

function ModuleView({ module: m, name, onBack, onPassed }: { module: HostModule; name: string; onBack: () => void; onPassed: () => void }) {
  const { toast } = useToast();
  const questions = m.check.questions;
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [result, setResult] = useState<CheckResult | null>(null);
  const [saving, setSaving] = useState(false);
  const complete = answers.every((a) => a !== null);

  async function submit() {
    if (!complete) return;
    setSaving(true);
    try {
      const r = unwrap<CheckResult>(await hostService.check(m.key, answers as number[]));
      setResult(r);
      if (r.passed) {
        toast({ title: r.certificate ? "MashaAllah! You have completed Asaas for Hosts." : "Well done, you passed this module." });
        onPassed();
      }
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not check your answers.") });
    } finally {
      setSaving(false);
    }
  }

  function retry() {
    setResult(null);
    setAnswers(questions.map(() => null));
  }

  return (
    <>
      <button className="flex items-center gap-1 rounded-full bg-card px-3 py-1.5 text-[13px] text-nc-dark shadow-nc hover:text-plum" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> All modules
      </button>

      <section className="rounded-xl border border-border bg-card p-4 shadow-nc sm:p-6">
        <div className="text-right">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gold-dim">Module {m.number} of 6{m.passedAt && " · passed"}</div>
          <h2 dir="rtl" lang="ur" className="urdu text-[24px] leading-[2] text-plum">{m.titleUr}</h2>
          <p className="font-serif text-[17px] text-nc-dark">{m.titleEn}</p>
        </div>
        <Bi className="mt-3 rounded-lg bg-gold-lt/50 px-3.5 py-2.5" urCls="text-[15px]" enLeft ur={m.summaryUr} en={m.summaryEn} />

        {m.audio && (
          <div className="mt-4 rounded-lg border border-border px-3 py-2.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-nc-dark">
              <Headphones className="h-4 w-4 text-plum" /> Listen · <span lang="ur" className="urdu leading-[1.8]">سنیں</span>
            </div>
            <audio controls preload="none" src={apiUrl(m.audio.url)} className="w-full" />
          </div>
        )}

        <div className="mt-5 space-y-6">
          {m.sections.map((s, i) => (
            <article key={i}>
              <h3 dir="rtl" lang="ur" className="urdu text-right text-[19px] leading-[2] text-nc-dark">{s.headingUr}</h3>
              <p className="mb-2 text-right text-[12.5px] font-medium text-nc-muted">{s.headingEn}</p>
              <div className="space-y-2">
                {s.ur.map((p, j) => <p key={j} dir="rtl" lang="ur" className="urdu text-right text-[16px] leading-[2.3] text-nc-dark">{p}</p>)}
              </div>
              <div className="mt-2 space-y-1.5 border-l-2 border-plum/20 pl-3">
                {s.en.map((p, j) => <p key={j} className="text-[13px] leading-relaxed text-nc-muted">{p}</p>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-nc sm:p-6">
        <div className="mb-3 text-right">
          <h2 dir="rtl" lang="ur" className="urdu text-[20px] leading-[2] text-nc-dark">اپنی سمجھ جانچیں</h2>
          <p className="text-[12.5px] text-nc-muted">Knowledge check · {m.check.passMark} of {questions.length} to pass</p>
        </div>

        <ol className="space-y-4">
          {questions.map((q, qi) => {
            const r = result?.results[qi];
            return (
              <li key={qi} className={cn("rounded-lg border p-3", r ? (r.right ? "border-nc-green/50 bg-nc-green-lt/30" : "border-nc-red/40 bg-nc-red-lt/30") : "border-border")}>
                <div className="flex items-start gap-2">
                  {r && (r.right ? <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-nc-green" /> : <XCircle className="mt-1 h-4 w-4 flex-shrink-0 text-nc-red" />)}
                  <div className="min-w-0 flex-1">
                    <p dir="rtl" lang="ur" className="urdu text-right text-[15.5px] leading-[2.1] text-nc-dark">{qi + 1}۔ {q.questionUr}</p>
                    <p className="text-right text-[12.5px] text-nc-muted">{q.questionEn}</p>
                  </div>
                </div>
                <div className="mt-2 space-y-1.5" role="radiogroup" aria-label={`Question ${qi + 1}`}>
                  {q.options.map((o, oi) => {
                    const chosen = answers[qi] === oi;
                    return (
                      <label key={oi} className={cn("flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2",
                        chosen ? "border-plum bg-plum-lt/40" : "border-border hover:border-plum/40",
                        result && "cursor-default")}>
                        <input type="radio" name={`q${qi}`} className="mt-1.5 accent-[hsl(var(--teal))]" checked={chosen} disabled={!!result}
                          onChange={() => setAnswers((a) => a.map((x, i) => (i === qi ? oi : x)))} />
                        <span className="min-w-0 flex-1 text-right">
                          <span dir="rtl" lang="ur" className="urdu block text-[14.5px] leading-[2] text-nc-dark">{o.ur}</span>
                          <span className="block text-[12px] text-nc-muted">{o.en}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>

        {result?.certificate && (
          <div className="mt-4">
            <ParentCertificate printLabel="Download / Print"
              data={hostCertificateData({ name, number: result.certificate, issuedOn: new Date().toISOString() })} />
          </div>
        )}

        {result ? (
          <div className={cn("mt-4 rounded-lg px-4 py-3", result.passed ? "bg-nc-green-lt" : "bg-nc-amber-lt")}>
            <p className="text-[14px] font-semibold text-nc-dark">You got {result.correct} of {result.total}.</p>
            {result.passed ? (
              <Bi urCls="text-[14.5px]" ur="ماشاء اللہ! یہ حصہ مکمل ہو گیا۔" en={result.certificate ? "MashaAllah! You have completed Asaas for Hosts. Your certificate is ready." : "Well done, you passed this module."} />
            ) : (
              <>
                <Bi urCls="text-[14.5px]" ur={`پاس ہونے کے لیے ${result.passMark} درست جواب چاہییں۔ حصہ دوبارہ پڑھیں اور پھر کوشش کریں۔`}
                  en={`You need ${result.passMark}. Read the module again and try once more.`} />
                <button className="btn-primary mt-2" onClick={retry}><RotateCcw className="h-4 w-4" /> Try again</button>
              </>
            )}
            {result.passed && <button className="btn-outline mt-2" onClick={onBack}>Back to the modules</button>}
          </div>
        ) : (
          <button className="btn-primary mt-4 w-full justify-center sm:w-auto" disabled={!complete || saving} onClick={submit}>
            {saving ? "Checking…" : "Check my answers · جواب جانچیں"}
          </button>
        )}
      </section>
    </>
  );
}
