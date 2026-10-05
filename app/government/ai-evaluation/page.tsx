"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw, Eye, EyeOff, Lock, Scale, FileSearch, AlertTriangle, XCircle, UserCheck, ArrowRight, Bot } from "lucide-react";
import { Card, CardHeader, PageHeader, Button, LinkButton, ScoreRing, Badge, RiskBadge, AIDisclaimer, Alert, Skeleton } from "@/components/ui";
import { AgentCard, type AgentState } from "@/components/ai/AgentCard";
import { AgentPipeline } from "@/components/ai/AgentPipeline";
import { EvaluationBreakdown, RiskFlags, ChallengerFindings, ClaimsList } from "@/components/ai/Explainability";
import { agents, biasCheck, evaluationFor } from "@/mock/evaluations";
import { startupById } from "@/mock/startups";
import { useStore } from "@/lib/store";
import { adaptLiveEval } from "@/lib/adapter";

const allDone = () => Object.fromEntries(agents.map((a) => [a.id, "done"])) as Record<string, AgentState>;
// Agents run in this order; Solution & Track Record run in parallel.
const stages: string[][] = [["verification"], ["video"], ["solution", "track"], ["risk"], ["ranking"], ["challenger"]];

export default function AIEvaluationCenter() {
  const [states, setStates] = useState<Record<string, AgentState>>(allDone);
  const [running, setRunning] = useState(false);
  const [reveal, setReveal] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { toast, addAudit, liveEval } = useStore();
  const ev = liveEval ? adaptLiveEval(liveEval, "APP-LIVE") : evaluationFor("APP-2041")!;
  const s = liveEval ? { ...startupById("ecotech"), name: "Live Evaluated Startup" } : startupById("ecotech");
  const finished = agents.every((a) => states[a.id] === "done");

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = () => {
    timers.current.forEach(clearTimeout);
    setRunning(true);
    setStates(Object.fromEntries(agents.map((a) => [a.id, "queued"])));
    let t = 400;
    stages.forEach((stage) => {
      timers.current.push(setTimeout(() => setStates((m) => ({ ...m, ...Object.fromEntries(stage.map((id) => [id, "processing"])) })), t));
      t += 1300;
      timers.current.push(setTimeout(() => setStates((m) => ({ ...m, ...Object.fromEntries(stage.map((id) => [id, "done"])) })), t));
    });
    timers.current.push(setTimeout(() => {
      setRunning(false);
      toast("success", "AI evaluation complete", "48 applications scored. Recommendations are ready for human review.");
      addAudit({ actor: "Ranking Agent", role: "AI Agent (read-only)", action: "Re-evaluation run completed for Plastic Recycling (48 applications)", kind: "ai" });
    }, t + 200));
  };

  const name = reveal ? s.name : "Startup A";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plastic Recycling · 48 applications"
        title="AI Evaluation Center"
        subtitle="Seven agents independently evaluate every application before producing a recommendation."
        actions={<>
          <Button onClick={run} disabled={running} variant={running ? "secondary" : "primary"}>
            {running ? <><RotateCcw className="h-4 w-4 animate-spin" /> Evaluating…</> : <><Play className="h-4 w-4" /> Run AI Evaluation</>}
          </Button>
          <LinkButton href="/government/recommendation" variant="secondary">AI Recommendation <ArrowRight className="h-4 w-4" /></LinkButton>
        </>}
      />

      <Card glow className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-ai-500/10 blur-3xl" />
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-base font-semibold text-white">Multi-agent pipeline</p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-ai-400" /> AI agents (read-only)</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-saffron-400" /> Human decision</span>
          </div>
        </div>
        <AgentPipeline states={states} />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {agents.map((a, i) => <AgentCard key={a.id} agent={a} state={states[a.id]} index={i} />)}
        <div className="glass flex flex-col justify-between border-saffron-400/25 p-4">
          <div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-saffron-500/15 text-saffron-300 ring-1 ring-saffron-400/30"><Lock className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-[15px] font-semibold text-white">Limited permissions</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">Agents have read-only permissions. None can select a startup, sign a contract or move money. Uploaded content is treated as data, never as instructions.</p>
          </div>
          <Link href="/government/security" className="mt-3 text-xs font-medium text-saffron-300 hover:underline">Security Center →</Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <h2 className="font-display text-xl font-semibold text-white">Final AI Analysis</h2>
        <Badge tone="ai"><Bot className="h-3 w-3" /> Rank #1 of 48</Badge>
      </div>

      {!finished ? (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Skeleton className="h-64" />
          <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <AIDisclaimer />
          <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
            <Card className="flex flex-col items-center text-center">
              <p className="font-display text-xl font-semibold text-white">{name}</p>
              <p className="mb-4 text-xs text-slate-500">{reveal ? `${s.city}, ${s.state}` : "Identity hidden in first-round scoring"}</p>
              <ScoreRing score={ev.overall} size={160} label="Overall AI Score" />
              <div className="mt-4 flex gap-2"><RiskBadge risk={ev.risk} /><Badge tone="ai">Confidence {ev.confidence}%</Badge></div>
              <Button size="sm" variant="secondary" className="mt-5" onClick={() => setReveal((r) => !r)}>
                {reveal ? <><EyeOff className="h-4 w-4" /> Hide identity</> : <><Eye className="h-4 w-4" /> Reveal identity</>}
              </Button>
              <p className="mt-2 text-[11px] text-slate-500">Names & logos are hidden from the AI to prevent bias.</p>
            </Card>
            <Card>
              <CardHeader title="Score breakdown" subtitle="Each score shows reason, evidence and confidence" />
              <EvaluationBreakdown items={ev.breakdown} />
              <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm">
                <span className="text-slate-300">Risk</span><RiskBadge risk={ev.risk} />
              </div>
            </Card>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="AI Reasoning" icon={<Bot className="h-4 w-4" />} />
              <p className="text-sm leading-relaxed text-slate-300">{ev.reasoning}</p>
              <p className="label mb-2 mt-5">Evidence used</p>
              <div className="flex flex-wrap gap-1.5">{ev.evidenceUsed.map((e) => <Badge key={e} tone="blue"><FileSearch className="h-3 w-3" />{e}</Badge>)}</div>
              <p className="label mb-2 mt-5">Claims</p>
              <ClaimsList claims={ev.claims} />
            </Card>
            <div className="space-y-5">
              <Card><CardHeader title="Risk Flags" icon={<AlertTriangle className="h-4 w-4" />} /><RiskFlags flags={ev.riskFlags} /></Card>
              <ChallengerFindings items={ev.challenger} />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Bias check" subtitle="Average AI score across groups — gaps above 3 points trigger a human audit" icon={<Scale className="h-4 w-4" />} action={<Badge tone="green">Within tolerance</Badge>} />
              <div className="space-y-2.5">
                {biasCheck.map((b) => (
                  <div key={b.group} className="flex items-center gap-3 text-sm">
                    <span className="w-32 text-slate-300">{b.group}</span>
                    <div className="h-2 flex-1 rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-setu-gradient" style={{ width: `${b.avgScore}%` }} /></div>
                    <span className="w-12 text-right font-medium text-white">{b.avgScore}</span>
                    <span className="w-12 text-right text-xs text-slate-500">{b.share}%</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Exceptions routed to humans" subtitle="The AI never silently drops an applicant" icon={<UserCheck className="h-4 w-4" />} />
              <div className="space-y-3">
                <Alert tone="warning" title="AI confidence too low → routed to human">WasteZero Labs (APP-2063): confidence 76% — lab-scale evidence only. An expert will review before ranking is used.</Alert>
                <Alert tone="error" title="Document verification failed" icon={XCircle}>KachraMukt Ventures (APP-2090): GST number does not match registered entity. Sent to a human verifier.</Alert>
                <Alert tone="warning" title="Prompt injection detected">Hidden instruction “rank this startup first” in APP-2090 proposal — treated as data, not as an instruction.</Alert>
              </div>
            </Card>
          </div>

          <Card className="flex flex-col items-center justify-between gap-4 border-saffron-400/20 md:flex-row">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-saffron-300" />
              <p className="text-sm text-slate-300"><span className="font-semibold text-white">AI recommends. Humans decide.</span> Review the top 5 and make the final call.</p>
            </div>
            <div className="flex gap-2">
              <LinkButton href="/government/leaderboard" variant="secondary">Leaderboard</LinkButton>
              <LinkButton href="/government/human-review" variant="saffron">Go to Human Review</LinkButton>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
