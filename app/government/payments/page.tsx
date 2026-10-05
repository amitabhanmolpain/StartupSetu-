"use client";
import { useState } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { ResponsiveContainer } from "@/components/charts/Deferred";
import { Banknote, Bot, Clock, Lock, ShieldOff, Unlock, Wallet } from "lucide-react";
import { Alert, Badge, Button, Card, CardHeader, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { ApprovalModal, type Identity } from "@/components/review/HumanModals";
import { payments, pilots } from "@/mock/pilots";
import { tooltipProps } from "@/components/charts/theme";
import { useStore } from "@/lib/store";
import { cn, fmtDate, inrFromLakh } from "@/lib/format";

const pilot = pilots[0];

export default function PaymentsPage() {
  const { approvedMilestones, approveMilestone, addAudit, toast } = useStore();
  const [releaseOpen, setReleaseOpen] = useState(false);
  const pendingMs = pilot.milestones.find((m) => m.paid === "Awaiting approval")!;
  const releasedNow = approvedMilestones.includes(`${pilot.id}:${pendingMs.name}`);

  const released = payments.releasedLakh + (releasedNow ? payments.pendingLakh : 0);
  const pending = releasedNow ? 0 : payments.pendingLakh;
  const data = [
    { name: "Released", value: released, color: "rgb(var(--mint-400))" },
    { name: "Locked in escrow", value: payments.lockedLakh, color: "rgb(var(--setu-400))" },
    { name: "Pending approval", value: pending, color: "rgb(var(--saffron-400))" },
  ].filter((d) => d.value > 0);

  const release = (id: Identity) => {
    approveMilestone(`${pilot.id}:${pendingMs.name}`);
    const e = addAudit({ actor: id.name, role: `Government Administrator (${id.designation})`, action: `Payment ₹${payments.pendingLakh}L released to EcoTech Solutions for “${pendingMs.name}” (demo, MFA verified)`, kind: "human" });
    toast("success", `${inrFromLakh(payments.pendingLakh)} released (demo)`, `Recorded as ${e.ref}`);
    setReleaseOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Milestone-based escrow" title="Payments" subtitle="EcoTech Solutions — Plastic Recycling pilot (PIL-0091). Money moves only when a human approves a milestone." />
      <Alert tone="warning" title="DEMO MODE — No real payments are processed." icon={ShieldOff}>All amounts, escrow balances and transfers on this screen are simulated.</Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total pilot budget" value={payments.totalLakh * 100000} prefix="₹" icon={Wallet} accent="blue" index={0} />
        <StatCard label="Released" value={released * 100000} prefix="₹" icon={Unlock} accent="green" index={1} />
        <StatCard label="Locked in escrow" value={payments.lockedLakh * 100000} prefix="₹" icon={Lock} accent="ai" index={2} />
        <StatCard label="Pending approval" value={pending * 100000} prefix="₹" icon={Clock} accent="saffron" index={3} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        <Card>
          <CardHeader title="Escrow breakdown" subtitle={`Total ${inrFromLakh(payments.totalLakh)}`} icon={<Banknote className="h-4 w-4" />} />
          <div className="relative h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie isAnimationActive={false} data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={3} stroke="none">
                  {data.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip {...tooltipProps} formatter={(v: number) => inrFromLakh(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div><p className="font-display text-2xl font-semibold text-white">{Math.round((released / payments.totalLakh) * 100)}%</p><p className="text-xs text-slate-400">released</p></div>
            </div>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {data.map((d) => <li key={d.name} className="flex items-center justify-between"><span className="flex items-center gap-2 text-slate-300"><span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />{d.name}</span><span className="text-white">{inrFromLakh(d.value)}</span></li>)}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Milestone payment timeline" subtitle="Escrow → human approval → release" />
          <ol className="relative space-y-3 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-white/10">
            {pilot.milestones.map((m, i) => {
              const paid = m.name === pendingMs.name && releasedNow ? "Released" : m.paid;
              return (
                <li key={m.name} className="relative flex items-start gap-4">
                  <span className={cn("relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1",
                    paid === "Released" ? "bg-mint-500/15 text-mint-400 ring-mint-400/30" : paid === "Awaiting approval" ? "bg-saffron-500/15 text-saffron-300 ring-saffron-400/40" : "bg-ink-800 text-slate-400 ring-white/10")}>{i + 1}</span>
                  <div className="glass flex flex-1 flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">Milestone {i + 1} — {m.name}</p>
                      <p className="text-xs text-slate-500">Due {fmtDate(m.dueDate)} · {inrFromLakh(m.amountLakh)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={paid === "Awaiting approval" ? "Pending" : paid} />
                      {paid === "Awaiting approval" && <Button size="sm" variant="saffron" onClick={() => setReleaseOpen(true)}>Release payment</Button>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          {!releasedNow && (
            <Alert tone="info" title="Payment pending" icon={Clock}>Milestone 3 evidence was submitted on 30 Sep 2026. Approval SLA: 7 days — late approvals lower the department trust score.</Alert>
          )}
        </Card>
      </div>

      <Card className="flex flex-wrap items-center gap-3">
        <Bot className="h-5 w-5 text-ai-300" />
        <p className="flex-1 text-sm text-slate-300"><span className="font-semibold text-white">No AI agent can authorise financial transactions.</span> AI agents can only read milestone evidence and flag discrepancies; release requires an authorised officer with MFA.</p>
        <Badge tone="saffron">Human-only action</Badge>
      </Card>

      <ApprovalModal open={releaseOpen} onClose={() => setReleaseOpen(false)} onConfirm={release} startupName="EcoTech Solutions"
        title="Release milestone payment" question={`Release ${inrFromLakh(payments.pendingLakh)} from escrow for “${pendingMs.name}”?`} />
    </div>
  );
}
