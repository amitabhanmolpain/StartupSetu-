"use client";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, GitCompare, Bot, UserCheck, Check, X, ScissorsLineDashed, FileSearch } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from "recharts";
import { ResponsiveContainer } from "@/components/charts/Deferred";
import { PageHeader, Card, Badge, RiskBadge, StatusBadge, Button, Drawer, Modal, Tabs, ScoreRing, LinkButton, EmptyState, scoreColor } from "@/components/ui";
import { EvaluationBreakdown, ClaimsList, RiskFlags, ChallengerFindings } from "@/components/ai/Explainability";
import { rankedForProblem, type Ranked } from "@/mock/govExtra";
import { useStore } from "@/lib/store";
import { adaptLiveEval } from "@/lib/adapter";
import { chartColors, tooltipProps } from "@/components/charts/theme";
import { cn } from "@/lib/format";
import { StartupAvatar } from "@/components/gov/StartupAvatar";
import { startupById } from "@/mock/startups";
import { applications } from "@/mock/applications";

const drawerTabs = ["Score", "Evidence", "Risks", "Claims", "Human Review"] as const;

export default function Leaderboard() {
  const { statusOf, liveEval } = useStore();
  let all = rankedForProblem("plastic-recycling");
  if (liveEval) {
    const liveApp = { ...applications[0], id: "APP-LIVE" };
    const liveStartup = { ...startupById("ecotech"), name: "Live Evaluated Startup" };
    const liveEv = adaptLiveEval(liveEval, "APP-LIVE");
    all = [...all, { app: liveApp, ev: liveEv, startup: liveStartup, rank: 0 }];
    all = all.sort((a, b) => b.ev.overall - a.ev.overall).map((r, i) => ({ ...r, rank: i + 1 }));
  }

  const [risk, setRisk] = useState("All");
  const [womenOnly, setWomenOnly] = useState(false);
  const [state, setState] = useState("All");
  const [open, setOpen] = useState<Ranked | null>(null);
  const [dtab, setDtab] = useState<(typeof drawerTabs)[number]>("Score");
  const [compareMode, setCompareMode] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const states = ["All", ...Array.from(new Set(all.map((r) => r.startup.state)))];
  const list = useMemo(() => all.filter((r) => (risk === "All" || r.ev.risk === risk) && (!womenOnly || r.startup.womenLed) && (state === "All" || r.startup.state === state)), [all, risk, womenOnly, state]);
  const podium = all.slice(0, 3);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]));
  const compared = all.filter((r) => picked.includes(r.app.id));
  const radarData = ["Solution Fit", "Feasibility", "Track Record", "Scalability"].map((label, i) => ({
    metric: label, ...Object.fromEntries(compared.map((r) => [r.startup.name, r.ev.breakdown[i].score])),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Evaluation Leaderboard"
        subtitle="Transparent ranking based on predefined evaluation criteria."
        actions={<>
          <Button variant={compareMode ? "primary" : "secondary"} onClick={() => { setCompareMode((c) => !c); setPicked([]); }}><GitCompare className="h-4 w-4" /> {compareMode ? "Exit compare" : "Compare Startups"}</Button>
          <LinkButton href="/government/human-review" variant="saffron"><UserCheck className="h-4 w-4" /> Human Review</LinkButton>
        </>}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="ai" className="!px-3 !py-1 text-sm"><Bot className="h-4 w-4" /> AI-generated ranking for human review</Badge>
        <span className="text-sm text-slate-400">Plastic Recycling · Maharashtra Urban Development Department</span>
      </div>

      {/* podium */}
      <div className="grid items-end gap-4 md:grid-cols-3">
        {[podium[1], podium[0], podium[2]].map((r) => {
          const first = r.rank === 1;
          return (
            <motion.button key={r.app.id} onClick={() => { setOpen(r); setDtab("Score"); }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: first ? 0 : 0.1 }}
              className={cn("glass glass-hover focus-ring flex flex-col items-center p-5 text-center", first ? "glow-border md:pb-10 md:pt-8" : "md:pb-6")}>
              <div className={cn("mb-3 grid h-9 w-9 place-items-center rounded-full font-display font-bold", first ? "bg-saffron-gradient text-onaccent" : "bg-white/[0.06] text-slate-300")}>
                {first ? <Trophy className="h-5 w-5" /> : r.rank}
              </div>
              <ScoreRing score={r.ev.overall} size={first ? 130 : 104} />
              <p className="mt-3 font-display text-lg font-semibold text-white">{r.startup.name}</p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-400">{r.ev.keyReason}</p>
              <div className="mt-2"><RiskBadge risk={r.ev.risk} /></div>
            </motion.button>
          );
        })}
      </div>

      <Card className="!p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] p-4">
          <select className="input w-auto py-2" value={risk} onChange={(e) => setRisk(e.target.value)} aria-label="Risk filter">
            {["All", "Low", "Medium", "High"].map((r) => <option key={r} value={r}>{r === "All" ? "All risk levels" : `${r} risk`}</option>)}
          </select>
          <select className="input w-auto py-2" value={state} onChange={(e) => setState(e.target.value)} aria-label="State filter">
            {states.map((s) => <option key={s} value={s}>{s === "All" ? "All states" : s}</option>)}
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300">
            <input type="checkbox" checked={womenOnly} onChange={(e) => setWomenOnly(e.target.checked)} className="accent-setu-500" /> Women-led only
          </label>
          {compareMode && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-slate-400">{picked.length}/3 selected</span>
              <Button size="sm" disabled={picked.length < 2} onClick={() => setShowCompare(true)}>Compare</Button>
            </div>
          )}
        </div>
        {list.length === 0 ? <div className="p-6"><EmptyState title="No startups match these filters" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead><tr className="border-b border-white/[0.06]">
                {[compareMode ? "" : null, "Rank", "Startup", "Fit", "Feasibility", "Track", "Scale", "Risk", "Conf.", "Overall", "Status"].filter((h) => h !== null).map((h, i) => <th key={i} className="table-head px-4 py-3">{h}</th>)}
              </tr></thead>
              <tbody>
                {list.map((r) => (
                  <Fragment key={r.app.id}>
                    <tr onClick={() => (compareMode ? toggle(r.app.id) : (setOpen(r), setDtab("Score")))}
                      className={cn("cursor-pointer border-b border-white/[0.04] hover:bg-white/[0.03]", picked.includes(r.app.id) && "bg-setu-500/10", r.rank > 5 && "opacity-75")}>
                      {compareMode && <td className="px-4"><span className={cn("grid h-5 w-5 place-items-center rounded border", picked.includes(r.app.id) ? "border-setu-400 bg-setu-500 text-onprimary" : "border-white/20")}>{picked.includes(r.app.id) && <Check className="h-3 w-3" />}</span></td>}
                      <td className="px-4 py-3 font-display text-lg font-semibold text-slate-400">#{r.rank}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3"><StartupAvatar name={r.startup.name} size="sm" />
                          <div><p className="font-medium text-white">{r.startup.name}</p><p className="text-xs text-slate-500">{r.startup.state}{r.startup.womenLed && " · Women-led"}</p></div></div>
                      </td>
                      {r.ev.breakdown.map((b) => <td key={b.key} className="px-4 py-3 font-medium" style={{ color: scoreColor(b.score) }} title={b.reason}>{b.score}</td>)}
                      <td className="px-4 py-3"><RiskBadge risk={r.ev.risk} /></td>
                      <td className="px-4 py-3 text-sm text-slate-400">{r.ev.confidence}%</td>
                      <td className="px-4 py-3 font-display text-xl font-semibold text-white">{r.ev.overall}</td>
                      <td className="px-4 py-3"><StatusBadge status={statusOf(r.app.id)} /></td>
                    </tr>
                    {r.rank === 5 && (
                      <tr><td colSpan={12} className="px-4 py-2">
                        <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-saffron-300">
                          <span className="h-px flex-1 border-t border-dashed border-saffron-400/40" />
                          <ScissorsLineDashed className="h-4 w-4" /> Cut-off for human review (top 5)
                          <span className="h-px flex-1 border-t border-dashed border-saffron-400/40" />
                        </div>
                      </td></tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-white/[0.06] px-4 py-3 text-xs text-slate-500">Hover any score for its reason. Weights: Fit 30% · Feasibility 25% · Track 20% · Scalability 15% · Risk 10%. Ranks 11–48 scored below 60.</p>
      </Card>

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open ? `#${open.rank} ${open.startup.name}` : ""}>
        {open && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <ScoreRing score={open.ev.overall} size={100} stroke={8} />
              <div>
                <div className="flex gap-2"><RiskBadge risk={open.ev.risk} /><Badge tone="ai">{open.ev.confidence}% conf.</Badge></div>
                <p className="mt-2 text-sm text-slate-300">{open.ev.keyReason}</p>
              </div>
            </div>
            <Tabs tabs={drawerTabs} value={dtab} onChange={setDtab} />
            {dtab === "Score" && <><EvaluationBreakdown items={open.ev.breakdown} compact={false} /><p className="text-sm leading-relaxed text-slate-300">{open.ev.reasoning}</p></>}
            {dtab === "Evidence" && <div className="flex flex-wrap gap-2">{open.ev.evidenceUsed.map((e) => <Badge key={e} tone="blue"><FileSearch className="h-3 w-3" />{e}</Badge>)}</div>}
            {dtab === "Risks" && <><RiskFlags flags={open.ev.riskFlags} /><ChallengerFindings items={open.ev.challenger} /></>}
            {dtab === "Claims" && <ClaimsList claims={open.ev.claims} />}
            {dtab === "Human Review" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] p-3"><span className="text-sm text-slate-300">Current status</span><StatusBadge status={statusOf(open.app.id)} /></div>
                {open.app.expertComments.length ? open.app.expertComments.map((c) => (
                  <div key={c.expert} className="rounded-xl border border-saffron-400/20 bg-saffron-500/[0.05] p-3 text-sm"><p className="font-medium text-saffron-300">{c.expert} · {c.score}/100</p><p className="mt-1 text-slate-300">{c.comment}</p></div>
                )) : <p className="text-sm text-slate-400">No expert comments yet.</p>}
                <div className="flex gap-2">
                  <LinkButton href={`/government/applications/${open.app.id}`} variant="secondary" size="sm">Application</LinkButton>
                  {open.rank <= 5 && <LinkButton href="/government/human-review" variant="saffron" size="sm">Human Review</LinkButton>}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal open={showCompare} onClose={() => setShowCompare(false)} title="Compare Startups" size="lg">
        <div className="h-[320px]">
          <ResponsiveContainer>
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="rgba(133,171,255,0.15)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "rgb(var(--slate-400))", fontSize: 12 }} />
              <PolarRadiusAxis domain={[60, 100]} tick={false} axisLine={false} />
              {compared.map((r, i) => <Radar isAnimationActive={false} key={r.app.id} name={r.startup.name} dataKey={r.startup.name} stroke={chartColors[i]} fill={chartColors[i]} fillOpacity={0.15} strokeWidth={2} />)}
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip {...tooltipProps} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${compared.length}, minmax(0,1fr))` }}>
          {compared.map((r, i) => (
            <div key={r.app.id} className="rounded-xl border border-white/[0.06] p-3 text-sm">
              <p className="font-semibold" style={{ color: chartColors[i] }}>{r.startup.name}</p>
              <p className="mt-1 font-display text-2xl text-white">{r.ev.overall}</p>
              <RiskBadge risk={r.ev.risk} />
              <p className="mt-2 text-xs text-slate-400">{r.ev.keyReason}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">{r.ev.claims.filter((c) => c.status === "Verified").length} <Check className="h-3 w-3 text-mint-400" /> · {r.ev.claims.filter((c) => c.status !== "Verified").length} <X className="h-3 w-3 text-warn-400" /> claims</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">AI-generated comparison for human review — not a selection.</p>
      </Modal>
      <div className="text-center"><Link href="/government/recommendation" className="text-sm text-setu-300 hover:underline">View AI Recommendation summary →</Link></div>
    </div>
  );
}
