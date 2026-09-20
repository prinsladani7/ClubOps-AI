"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  GitCommit,
  Sliders,
  Users,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Clock,
  Layers,
  ShieldAlert,
  ArrowDownRight,
  HelpCircle,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AlgorithmIntelligencePage() {
  const {
    tasks,
    volunteers,
    getCriticalPathAnalysis,
    simulateTaskDelay,
    getOptimizedWorkload,
    getHackathonRiskReport,
    updateTaskItem,
    showToast,
  } = useClubOps();

  const [activeTab, setActiveTab] = useState<"cpm" | "workload" | "risk">("cpm");
  const [selectedSimTask, setSelectedSimTask] = useState("task-01");
  const [simulatedDelayHours, setSimulatedDelayHours] = useState(3);

  // Compute live algorithmic models
  const cpmSchedule = useMemo(() => getCriticalPathAnalysis(), [getCriticalPathAnalysis, tasks]);
  const delaySimulation = useMemo(
    () => simulateTaskDelay(selectedSimTask, simulatedDelayHours),
    [simulateTaskDelay, selectedSimTask, simulatedDelayHours, tasks]
  );
  const workloadOptimization = useMemo(() => getOptimizedWorkload(), [getOptimizedWorkload, volunteers, tasks]);
  const riskReport = useMemo(() => getHackathonRiskReport(), [getHackathonRiskReport, tasks, volunteers]);

  const handleApplyRebalance = () => {
    workloadOptimization.rebalanceActions.forEach((act) => {
      updateTaskItem(act.taskId, { owner_id: act.toVolunteerId });
    });
    showToast(`Mathematically optimized workload applied! Workload variance reduced by ${workloadOptimization.varianceReductionPercentage}%.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] font-mono font-bold">
              <Activity className="w-3.5 h-3.5" />
              MATHEMATICAL ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono">Algorithm Intelligence Center</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Operational Optimization Sandbox
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Live interactive computation sandbox for the Critical Path Method (CPM), Bipartite Workload Variance Balancing, and Real-Time Hackathon Threat Prediction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/war-room"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-all flex items-center gap-2"
          >
            <span>Open War Room</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Algorithm Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <button
          onClick={() => setActiveTab("cpm")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "cpm"
              ? "bg-indigo-600 text-white shadow-aiGlow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>Critical Path & Delay Simulator (CPM)</span>
        </button>

        <button
          onClick={() => setActiveTab("workload")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "workload"
              ? "bg-indigo-600 text-white shadow-aiGlow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Bipartite Workload Balancer ({workloadOptimization.varianceReductionPercentage}% \u0394\u03c3)</span>
        </button>

        <button
          onClick={() => setActiveTab("risk")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "risk"
              ? "bg-indigo-600 text-white shadow-aiGlow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Threat & Anomaly Predictor (Score: {riskReport.overallThreatIndex}/100)</span>
        </button>
      </div>

      {/* TAB 1: CRITICAL PATH METHOD (CPM) & DELAY SIMULATION */}
      {activeTab === "cpm" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Simulation Controls Bar */}
          <div className="p-6 rounded-3xl border border-indigo-500/30 bg-slate-900/60 backdrop-blur-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>Interactive Milestone Delay Simulation</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select an upstream task and adjust delay hours to observe mathematical float absorption and cascading deadline slips.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Target Task:</span>
                  <select
                    value={selectedSimTask}
                    onChange={(e) => setSelectedSimTask(e.target.value)}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title.slice(0, 35)}... ({t.priority.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Delay:</span>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={simulatedDelayHours}
                    onChange={(e) => setSimulatedDelayHours(Number(e.target.value))}
                    className="w-28 accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-indigo-300 w-8">
                    +{simulatedDelayHours}h
                  </span>
                </div>
              </div>
            </div>

            {/* Delay Impact Feedback Banner */}
            <div className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              delaySimulation.projectSlipHours > 0
                ? "border-rose-500/40 bg-rose-950/20 text-rose-300"
                : "border-emerald-500/40 bg-emerald-950/20 text-emerald-300"
            }`}>
              <div className="space-y-1">
                <p className="font-semibold text-white">
                  {delaySimulation.projectSlipHours > 0
                    ? `⚠️ CRITICAL PATH SLIP DETECTED: +${delaySimulation.projectSlipHours} Hours Total Project Delay`
                    : `✅ DELAY BUFFER ABSORBED: 0 Hours Project Delay (Total float absorbed)`}
                </p>
                <p className="text-[11px] text-slate-300">
                  Delaying {delaySimulation.delayedTaskId} by {delaySimulation.delayHours} hours affects {delaySimulation.affectedTasks.length} downstream deliverables.
                </p>
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span>Base: {delaySimulation.originalProjectDuration}h</span>
                <span>➔</span>
                <span className="font-bold underline">Projected: {delaySimulation.newProjectDuration}h</span>
              </div>
            </div>
          </div>

          {/* Critical Path Tasks Table with Float Badges */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-rose-400" />
                  <span>Topological CPM Graph & Slack Calculation</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Total Float = 0 defines the zero-slack Critical Path governing the 36h hackathon finish line.
                </p>
              </div>

              <span className="text-xs font-mono px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                {cpmSchedule.criticalPath.length} Critical Nodes
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-3 px-3">Node ID</th>
                    <th className="py-3 px-3">Deliverable Name</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Early (ES/EF)</th>
                    <th className="py-3 px-3">Late (LS/LF)</th>
                    <th className="py-3 px-3">Total Float</th>
                    <th className="py-3 px-3">Free Float</th>
                    <th className="py-3 px-3">Path State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {Object.values(cpmSchedule.nodes).slice(0, 10).map((node) => (
                    <tr
                      key={node.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        node.isCritical ? "bg-rose-950/10" : ""
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-medium text-slate-400">{node.id}</td>
                      <td className="py-3 px-3 font-semibold text-white max-w-xs truncate">{node.title}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{node.durationHours}h</td>
                      <td className="py-3 px-3 font-mono text-indigo-300">{node.earlyStart}h / {node.earlyFinish}h</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{node.lateStart}h / {node.lateFinish}h</td>
                      <td className="py-3 px-3 font-mono">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          node.totalFloat === 0
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}>
                          {node.totalFloat}h Slack
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">{node.freeFloat}h</td>
                      <td className="py-3 px-3">
                        {node.isCritical ? (
                          <Badge variant="destructive" className="text-[9px] font-mono">
                            CRITICAL
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] font-mono text-slate-400">
                            BUFFERED
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BIPARTITE WORKLOAD OPTIMIZER */}
      {activeTab === "workload" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Optimization Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
              <span className="text-xs font-mono text-slate-400 uppercase">Workload Std Dev (\u03c3)</span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-400 line-through">
                  {workloadOptimization.initialStandardDeviation}
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  ➔ {workloadOptimization.optimizedStandardDeviation}
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 mt-1 block">
                -{workloadOptimization.varianceReductionPercentage}% Variance Reduction
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
              <span className="text-xs font-mono text-slate-400 uppercase">Critical Path Risk Alleviation</span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-cyan-400 font-mono">
                  {workloadOptimization.criticalPathRiskReductionPercentage}%
                </span>
                <span className="text-xs text-slate-400">Protected Capacity</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Offloads single-point bottlenecks
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase">Proposed Reassignments</span>
                <div className="mt-3 text-3xl font-extrabold text-white font-mono">
                  {workloadOptimization.rebalanceActions.length}
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleApplyRebalance}
                className="mt-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-aiGlow"
              >
                Apply Rebalance to Live Backlog
              </Button>
            </div>
          </div>

          {/* Rebalance Actions List */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Algorithmic Task Reallocation Recommendations</span>
            </h3>

            <div className="space-y-3">
              {workloadOptimization.rebalanceActions.map((act, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{act.taskTitle}</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {act.taskPriority}
                      </Badge>
                      <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                        Jaccard Match: {act.skillMatchPercentage}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{act.rationale}</p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {act.matchedSkills.map((sk, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 font-mono"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                    <div className="text-right">
                      <p className="text-slate-400 text-[10px]">From</p>
                      <p className="text-rose-400 font-bold">{act.fromVolunteerName}</p>
                      <p className="text-[10px] text-slate-500">{act.fromWorkloadBefore}% ➔ {act.fromWorkloadAfter}%</p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-500" />

                    <div>
                      <p className="text-slate-400 text-[10px]">To</p>
                      <p className="text-emerald-400 font-bold">{act.toVolunteerName}</p>
                      <p className="text-[10px] text-slate-500">{act.toWorkloadBefore}% ➔ {act.toWorkloadAfter}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REAL-TIME THREAT PREDICTOR */}
      {activeTab === "risk" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Threat Index Card */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase">Composite Threat Index</span>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black font-mono text-white">
                  {riskReport.overallThreatIndex}
                </span>
                <span className="text-xs text-slate-400">/ 100</span>
                <Badge
                  variant={
                    riskReport.threatTier === "CRITICAL"
                      ? "destructive"
                      : riskReport.threatTier === "HIGH"
                      ? "warning"
                      : "outline"
                  }
                  className="text-xs font-mono uppercase"
                >
                  {riskReport.threatTier} RISK
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Evaluating schedule debt, dependency fan-out, volunteer burnout, and physical venue fragility.
              </p>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs text-slate-300">
              <div>
                <span className="text-2xl font-bold text-rose-400 block">{riskReport.criticalTaskCount}</span>
                <span className="text-[10px] text-slate-500">Critical Tasks</span>
              </div>
              <div className="w-[1px] h-8 bg-slate-800" />
              <div>
                <span className="text-2xl font-bold text-amber-400 block">{riskReport.highRiskTaskCount}</span>
                <span className="text-[10px] text-slate-500">High Risk Tasks</span>
              </div>
              <div className="w-[1px] h-8 bg-slate-800" />
              <div>
                <span className="text-2xl font-bold text-indigo-400 block">{riskReport.singlePointsOfFailure.length}</span>
                <span className="text-[10px] text-slate-500">SPOFs Detected</span>
              </div>
            </div>
          </div>

          {/* Single Point of Failure (SPOF) Callout */}
          {riskReport.singlePointsOfFailure.length > 0 && (
            <div className="p-4 rounded-2xl border border-rose-500/50 bg-rose-950/20 text-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <ShieldAlert className="w-4 h-4" />
                <span>Single Points of Failure (SPOF) Requiring Contingency Isolation</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                {riskReport.singlePointsOfFailure.map((spof, idx) => (
                  <li key={idx}>
                    <span className="font-semibold text-white">{spof}</span> — Failure directly cascades into opening ceremony or track judging delays.
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Evaluated Deliverables List */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl space-y-4">
            <h3 className="text-base font-bold text-white">Deliverable Risk Score Breakdown</h3>

            <div className="space-y-3">
              {riskReport.evaluatedTasks.slice(0, 6).map((task) => (
                <div
                  key={task.taskId}
                  className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{task.taskTitle}</span>
                      <Badge
                        variant={task.threatTier === "CRITICAL" ? "destructive" : "warning"}
                        className="text-[10px] font-mono"
                      >
                        {task.threatTier} ({task.compositeRiskScore}/100)
                      </Badge>
                      {task.isSinglePointOfFailure && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                          SPOF
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-indigo-300">
                      💡 <span className="font-semibold">Recommended Action:</span> {task.recommendedAction}
                    </p>

                    <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-slate-400">
                      {task.riskFactors.map((f, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="font-mono text-slate-500">{f.name}:</span>
                          <span className={f.score >= 70 ? "text-rose-400 font-semibold" : "text-slate-300"}>
                            {f.detail}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
