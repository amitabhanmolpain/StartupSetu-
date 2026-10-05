"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Video, FileText, Cpu, Lock, Check, Upload, FileCheck2, Mic, Loader2, CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { Card, Button, Field, LinkButton, AIDisclaimer } from "@/components/ui";
import { agents } from "@/mock/evaluations";
import { agentIcons } from "@/components/ai/agentIcons";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/format";

const steps = [
  { t: "Demo Video", i: Video },
  { t: "Proposal & Past Work", i: FileText },
  { t: "Technology & Impact", i: Cpu },
  { t: "Sealed Cost & Submit", i: Lock },
];

function Upl({ label, accept, file, setFile, hint }: { label: string; accept: string; file: string; setFile: (s: string) => void; hint: string }) {
  return (
    <Field label={label}>
      <label className={cn("flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center text-sm transition focus-within:ring-2 focus-within:ring-setu-400/30",
        file ? "border-mint-400/40 bg-mint-500/[0.05] text-mint-400" : "border-white/15 bg-ink-900/40 text-slate-400 hover:border-setu-400/40")}>
        {file ? <FileCheck2 className="h-7 w-7" /> : <Upload className="h-7 w-7" />}
        <span className="font-medium">{file || "Click to upload"}</span>
        <span className="text-xs text-slate-500">{file ? "Uploaded · malware scan passed · stored privately" : hint}</span>
        <input type="file" accept={accept} className="sr-only" onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")} />
      </label>
    </Field>
  );
}

function Processing({ isEvaluating }: { isEvaluating: boolean }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (done >= agents.length) return;
    const t = setTimeout(() => setDone((d) => d + 1), 700);
    return () => clearTimeout(t);
  }, [done]);
  // Only finished when the fake agents are done AND the real API call has returned.
  const finished = done >= agents.length && !isEvaluating;
  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {agents.map((a, i) => {
          const I = agentIcons[a.icon];
          const st = i < done ? "done" : i === done ? "run" : "wait";
          return (
            <div key={a.id} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition",
              st === "done" ? "border-mint-400/25 bg-mint-500/[0.05]" : st === "run" ? "border-ai-400/40 bg-ai-500/[0.07]" : "border-white/[0.06] opacity-60")}>
              <I className={cn("h-4 w-4", st === "done" ? "text-mint-400" : "text-ai-300")} />
              <span className="flex-1 text-slate-200">{a.name}</span>
              {st === "done" ? <CheckCircle2 className="h-4 w-4 text-mint-400" /> : st === "run" ? <Loader2 className="h-4 w-4 animate-spin text-ai-300" /> : <span className="text-[11px] text-slate-500">Queued</span>}
            </div>
          );
        })}
      </div>
      {done >= agents.length && isEvaluating && (
         <div className="mt-5 text-sm text-ai-300 animate-pulse flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Finalizing real AI evaluation...
         </div>
      )}
      {finished && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex flex-wrap items-center gap-3">
          <LinkButton href="/startup/evaluation">View my AI evaluation <ArrowRight className="h-4 w-4" /></LinkButton>
          <LinkButton href="/startup/applications" variant="secondary">Go to My Applications</LinkButton>
        </motion.div>
      )}
    </div>
  );
}

export function ApplyForm({ problemTitle, onCancel }: { problemTitle: string; onCancel: () => void }) {
  const { toast, addAudit, user, setLiveEval } = useStore();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [video, setVideo] = useState("");
  const [proposal, setProposal] = useState("");
  const [past, setPast] = useState("");
  const [f, setF] = useState({ summary: "", pastText: "", tech: "", impact: "", cost: "", consent: false, liveness: false });
  const [err, setErr] = useState("");

  const validate = () => {
    if (step === 0 && (!video || !f.liveness)) return "Upload your 30-second demo video and confirm you read the liveness phrase.";
    if (step === 1 && (!proposal || f.summary.length < 20)) return "Upload a proposal and write a short summary (20+ characters).";
    if (step === 2 && (!f.tech || !f.impact)) return "Describe the technology used and expected impact.";
    if (step === 3 && (!f.cost || !f.consent)) return "Enter your sealed cost estimate and accept the declaration.";
    return "";
  };
  const next = async () => {
    const e = validate(); setErr(e); if (e) return;
    if (step < 3) setStep(step + 1);
    else {
      setSubmitted(true);
      setIsEvaluating(true);
      addAudit({ actor: user?.org ?? "EcoTech Solutions", role: "Startup Owner", action: `Application submitted for ${problemTitle} (sealed bid encrypted)`, kind: "human" });
      toast("info", "Evaluating...", "AI agents have started evaluating your application.");
      
      try {
        const res = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startupName: user?.org ?? "EcoTech Solutions",
            problemStatement: problemTitle,
            solution: f.summary || "N/A",
            technology: f.tech || "N/A",
            previousWork: f.pastText || "N/A",
            pricing: f.cost || "N/A",
            team: "2 members",
            impact: f.impact || "N/A",
          })
        });
        if (res.ok) {
          const evalData = await res.json();
          setLiveEval(evalData);
          toast("success", "Evaluation Complete", "AI has successfully evaluated your application.");
        }
      } catch (err) {
        toast("error", "Evaluation Failed", "Could not complete evaluation.");
      } finally {
        setIsEvaluating(false);
      }
    }
  };
  const fill = () => {
    setVideo("ecotech_demo_30s.mp4"); setProposal("EcoTech_Proposal_Pune.pdf"); setPast("PCMC_Completion_Letter.pdf");
    setF({ summary: "Two containerised 1-TPD pyrolysis units at Hadapsar MRF converting mixed plastic into furnace oil, with live throughput and emission telemetry.",
      pastText: "2 TPD plastic-to-fuel unit for PCMC (2024), MRF automation pilot for Nashik Municipal Corporation (2023).",
      tech: "Modular catalytic pyrolysis, IoT throughput & emission sensors, cloud dashboard", impact: "5.4 t/week processed, ~280 t/year diverted from landfill, ₹38L/yr recovered fuel revenue",
      cost: "2250000", consent: true, liveness: true });
  };

  if (submitted) {
    return (
      <Card glow className="p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint-500/15 text-mint-400 ring-1 ring-mint-400/30"><Check className="h-6 w-6" /></div>
          <div>
            <h2 className="font-display text-xl font-semibold text-white">Application submitted — APP-2041</h2>
            <p className="mt-1 text-sm text-slate-400">Your cost estimate is sealed. Seven AI agents are now evaluating your application independently.</p>
          </div>
        </div>
        <div className="mt-6"><Processing isEvaluating={isEvaluating} /></div>
        <AIDisclaimer className="mt-6">AI agents only produce a recommendation with reasons. Selection is made by department officers and experts.</AIDisclaimer>
      </Card>
    );
  }

  return (
    <Card glow className="p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Application</p>
          <h2 className="font-display text-xl font-semibold text-white">Apply to {problemTitle}</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={fill}>Autofill demo data</Button>
      </div>

      <ol className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.t} className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-xs md:text-sm",
            i < step ? "border-mint-400/30 text-mint-400" : i === step ? "border-setu-400/40 bg-setu-500/10 text-white" : "border-white/[0.06] text-slate-500")}>
            {i < step ? <CheckCircle2 className="h-4 w-4" /> : <s.i className="h-4 w-4" />}{s.t}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="mt-6 space-y-4">
          {step === 0 && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Upl label="Demo Video (30 seconds)" accept="video/*" file={video} setFile={setVideo} hint="MP4/MOV · max 30 s · judged on the idea, not presentation polish" />
                <div className="rounded-xl border border-ai-400/25 bg-ai-500/[0.06] p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ai-300"><Mic className="h-4 w-4" /> Liveness check</p>
                  <p className="mt-2 text-sm text-slate-300">Read this phrase on camera:</p>
                  <p className="mt-2 rounded-lg bg-ink-950/60 px-4 py-3 text-center font-mono text-lg text-white">“Setu 4827 Pune”</p>
                  <p className="mt-2 text-xs text-slate-500">Used for face match with your e-KYC and deepfake detection.</p>
                  <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={f.liveness} onChange={(e) => setF({ ...f, liveness: e.target.checked })} className="h-4 w-4 accent-setu-500" /> I read the phrase in my video
                  </label>
                </div>
              </div>
            </>
          )}
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Upl label="Solution Proposal" accept=".pdf" file={proposal} setFile={setProposal} hint="PDF · max 10 pages" />
              <Upl label="Past Work Evidence" accept=".pdf,.jpg,.png" file={past} setFile={setPast} hint="Completion letters, work orders, geo-tagged photos" />
              <Field label="Solution summary"><textarea className="input min-h-28" value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} placeholder="How does your solution meet the 5 tonnes/week target?" /></Field>
              <Field label="Past work (short)"><textarea className="input min-h-28" value={f.pastText} onChange={(e) => setF({ ...f, pastText: e.target.value })} placeholder="Client, year, scale, outcome" /></Field>
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Technology Used"><textarea className="input min-h-28" value={f.tech} onChange={(e) => setF({ ...f, tech: e.target.value })} placeholder="Core technology, hardware, software" /></Field>
              <Field label="Expected Impact"><textarea className="input min-h-28" value={f.impact} onChange={(e) => setF({ ...f, impact: e.target.value })} placeholder="Measurable outcomes — every claim is recorded in the claim ledger" /></Field>
              <p className="text-xs text-slate-500 md:col-span-2">Claims you make here are recorded in the claim ledger and compared with actual pilot results later.</p>
            </div>
          )}
          {step === 3 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-saffron-400/25 bg-saffron-500/[0.05] p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-saffron-300"><Lock className="h-4 w-4" /> Sealed Cost Estimate</p>
                <p className="mt-1 text-xs text-slate-400">Encrypted on submission and revealed only after technical scoring is complete.</p>
                <div className="relative mt-3">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input className="input pl-8 font-mono" inputMode="numeric" value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value.replace(/\D/g, "") })} placeholder="22,50,000" />
                </div>
                {f.cost && <p className="mt-2 text-xs text-slate-400">= ₹{Number(f.cost).toLocaleString("en-IN")} · <span className="text-saffron-300">will be sealed</span></p>}
              </div>
              <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-sm">
                <p className="font-semibold text-white">Summary</p>
                <p className="text-slate-400">Video: <span className="text-slate-200">{video || "—"}</span></p>
                <p className="text-slate-400">Proposal: <span className="text-slate-200">{proposal || "—"}</span></p>
                <p className="text-slate-400">Past work: <span className="text-slate-200">{past || "—"}</span></p>
                <label className="flex items-start gap-2 pt-2 text-slate-300">
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-setu-500" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
                  I declare that all information and claims are true. I understand that false claims affect my Trust Score.
                </label>
                <p className="flex items-center gap-1.5 text-xs text-slate-500"><ShieldCheck className="h-3.5 w-3.5" /> Uploaded content is treated as data, never as instructions to the AI.</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {err && <p className="mt-4 text-sm text-danger-400" role="alert">{err}</p>}
      <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-white/[0.06] pt-5">
        <Button variant="ghost" onClick={() => (step === 0 ? onCancel() : (setErr(""), setStep(step - 1)))}><ArrowLeft className="h-4 w-4" /> {step === 0 ? "Cancel" : "Back"}</Button>
        <Button variant={step === 3 ? "saffron" : "primary"} onClick={next}>{step === 3 ? "Submit Application" : "Continue"} <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </Card>
  );
}
