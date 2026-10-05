"use client";
import { useState } from "react";
import { Bot, FileSearch, ShieldCheck, AlertTriangle, UserCheck, Info, Scale } from "lucide-react";
import { PageHeader, Card, CardHeader, ScoreRing, RiskBadge, Badge, Tabs, AIDisclaimer, LinkButton, Drawer } from "@/components/ui";
import { EvaluationBreakdown, ClaimsList, RiskFlags, ChallengerFindings } from "@/components/ai/Explainability";
import { evaluationFor, agents } from "@/mock/evaluations";
import { agentIcons } from "@/components/ai/agentIcons";
import { problemById } from "@/mock/problems";
import { useStore } from "@/lib/store";
import { adaptLiveEval } from "@/lib/adapter";

export default function StartupEvaluation() {
  const { liveEval } = useStore();
  const ev = liveEval ? adaptLiveEval(liveEval, "APP-LIVE") : evaluationFor("APP-2041")!;
  const p = problemById("plastic-recycling")!;
  const [tab, setTab] = useState<"Claims" | "Risks" | "Challenger">("Claims");
  const [how, setHow] = useState(false);
  const verified = ev.claims.filter((c) => c.status === "Verified");
  const review = ev.claims.filter((c) => c.status !== "Verified");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="AI Evaluation · APP-2041" title="Your AI Evaluation" subtitle={`${p.title} — Maharashtra Urban Development Department. Every score below comes with its reason, evidence and confidence.`}
        actions={<><button onClick={() => setHow(true)} className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-slate-200 hover:bg-white/[0.05]"><Info className="h-4 w-4" /> How is my score calculated?</button></>} />

      <div className="flex items-start gap-4 rounded-2xl border-2 border-saffron-400/40 bg-saffron-500/[0.08] px-5 py-4">
        <UserCheck className="mt-0.5 h-6 w-6 shrink-0 text-saffron-300" />
        <div>
          <p className="font-display text-lg font-semibold text-saffron-300">Final decision requires human review.</p>
          <p className="text-sm text-slate-300">This is an AI recommendation shared with government officers and experts. It is not a selection, rejection or contract.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card glow className="flex flex-col items-center justify-center p-8 text-center">
          <ScoreRing score={ev.overall} size={190} stroke={14} label="out of 100" />
          <div className="mt-5 flex flex-wrap justify-center gap-2"><RiskBadge risk={ev.risk} /><Badge tone="ai">Confidence {ev.confidence}%</Badge><Badge tone="violet">Rank #1 of 48</Badge></div>
          <p className="mt-4 text-sm text-slate-400">{ev.keyReason}</p>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="AI reasoning" subtitle="Written in plain language by the Ranking Agent" icon={<Bot className="h-[18px] w-[18px]" />} />
          <p className="text-[15px] leading-relaxed text-slate-200">“{ev.reasoning}”</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-mint-500/[0.06] p-3 ring-1 ring-mint-400/20"><p className="text-xs text-slate-400">Claims verified</p><p className="font-display text-2xl font-semibold text-mint-400">{verified.length}</p></div>
            <div className="rounded-xl bg-warn-500/[0.06] p-3 ring-1 ring-warn-400/20"><p className="text-xs text-slate-400">Claims requiring review</p><p className="font-display text-2xl font-semibold text-warn-400">{review.length}</p></div>
            <div className="rounded-xl bg-danger-500/[0.06] p-3 ring-1 ring-danger-400/20"><p className="text-xs text-slate-400">Risk flags</p><p className="font-display text-2xl font-semibold text-danger-400">{ev.riskFlags.length}</p></div>
          </div>
          <div className="mt-5">
            <p className="label mb-2">Evidence used</p>
            <div className="flex flex-wrap gap-2">{ev.evidenceUsed.map((e) => <Badge key={e} tone="blue"><FileSearch className="h-3 w-3" />{e}</Badge>)}</div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Score breakdown" subtitle="Each criterion, its weight in the department's rubric, and why you received this score" icon={<Scale className="h-[18px] w-[18px]" />} />
        <EvaluationBreakdown items={ev.breakdown} />
        <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div><p className="text-sm font-medium text-white">Risk</p><p className="text-xs text-slate-400">Emission compliance self-reported; offtake concentration moderate.</p></div>
          <RiskBadge risk={ev.risk} />
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-base font-semibold text-white">Claims, risks & challenges</h3>
          <Tabs value={tab} onChange={setTab} tabs={[{ id: "Claims", label: "Claims", count: ev.claims.length }, { id: "Risks", label: "Risk Flags", count: ev.riskFlags.length }, { id: "Challenger", label: "Challenger", count: ev.challenger.length }]} />
        </div>
        {tab === "Claims" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div><p className="mb-2 flex items-center gap-2 text-sm font-semibold text-mint-400"><ShieldCheck className="h-4 w-4" /> Claims verified</p><ClaimsList claims={verified} /></div>
            <div><p className="mb-2 flex items-center gap-2 text-sm font-semibold text-warn-400"><AlertTriangle className="h-4 w-4" /> Claims requiring review</p><ClaimsList claims={review} /></div>
          </div>
        )}
        {tab === "Risks" && <RiskFlags flags={ev.riskFlags} />}
        {tab === "Challenger" && <ChallengerFindings items={ev.challenger} />}
      </Card>

      <Card>
        <CardHeader title="Agents that evaluated you" subtitle="Each agent has one job and read-only permissions" icon={<Bot className="h-[18px] w-[18px]" />} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((a) => {
            const I = agentIcons[a.icon];
            return (
              <div key={a.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="flex items-center gap-2 text-sm font-medium text-white"><I className="h-4 w-4 text-ai-300" />{a.name}</p>
                <p className="mt-1 text-xs text-slate-400">{a.role}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <AIDisclaimer>Think a claim was misread? Respond to clarification requests from your application page — a human reviewer will see your response.</AIDisclaimer>
      <div className="flex gap-2"><LinkButton href="/startup/applications/APP-2041" variant="secondary">Open application</LinkButton><LinkButton href="/startup/trust" variant="ghost">How this affects my Trust Score</LinkButton></div>

      <Drawer open={how} onClose={() => setHow(false)} title="How is my AI score calculated?">
        <div className="space-y-4 text-sm text-slate-300">
          <p>Your overall score is a weighted combination of the department&apos;s published criteria:</p>
          <ul className="space-y-2">
            {p.criteria.map((c) => <li key={c.name} className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-2"><span>{c.name}</span><span className="font-semibold text-white">{c.weight}%</span></li>)}
          </ul>
          <p>Confidence shows how strongly the evidence supports each score. Lower confidence means human reviewers look more closely.</p>
          <p>First-round scoring is <span className="text-white">anonymous</span>: your name and logo are hidden. Videos are judged on the idea, not on presentation polish.</p>
          <p>A bias check compares rankings across startup size, region and women-led ownership before results reach officers.</p>
          <p className="text-saffron-300">AI never selects a startup, signs a contract or releases money.</p>
        </div>
      </Drawer>
    </div>
  );
}
