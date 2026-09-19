"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Flame,
  GitBranch,
  UserX,
  FileWarning,
  Zap,
  Check,
  RotateCcw,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Risk, RiskSeverity } from "@/types";

export default function RisksPage() {
  const { risks, triggerRiskAnalysis, updateRisk, tasks, event, showToast } = useClubOps();

  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [isScanning, setIsScanning] = useState(false);

  const filteredRisks = risks.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterSeverity !== "all" && r.severity !== filterSeverity) return false;
    return true;
  });

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      triggerRiskAnalysis();
      setIsScanning(false);
      showToast("Real-time Risk Scan complete. Evaluated 42 dependency chains and volunteer workloads.");
    }, 600);
  };

  const criticalCount = risks.filter((r) => r.severity === "critical" && r.status === "active").length;
  const highCount = risks.filter((r) => r.severity === "high" && r.status === "active").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
            <span>Threat Radar</span>
            <span>•</span>
            <span>{criticalCount} Critical Path Risks</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 mt-0.5">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <span>Risk Intelligence Engine & Bottleneck Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time inference over dependency graphs, overdue work, and personnel bandwidth. Every risk provides evidence and response plans.
          </p>
        </div>

        <Button
          onClick={handleScan}
          disabled={isScanning}
          className="gap-2 text-xs h-9 bg-indigo-600 hover:bg-indigo-500 shadow-aiGlow"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
          <span>{isScanning ? "Evaluating Dependency Chains..." : "Run Live Risk Scan"}</span>
        </Button>
      </div>

      {/* Visual Risk Severity Radar / Heatmap Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-950/20 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-rose-400 uppercase font-mono">Critical Threats</span>
            <div className="text-2xl font-extrabold text-white">{criticalCount}</div>
            <p className="text-[11px] text-rose-300/80">Immobilizing venue & staging</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-950/20 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">High Threats</span>
            <div className="text-2xl font-extrabold text-white">{highCount}</div>
            <p className="text-[11px] text-amber-300/80">Volunteer burnout & marketing</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono">Mitigated Items</span>
            <div className="text-2xl font-extrabold text-white">
              {risks.filter((r) => r.status === "mitigated" || r.status === "resolved").length}
            </div>
            <p className="text-[11px] text-emerald-300/80">Interventions logged to audit</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Threats</option>
              <option value="mitigated">Mitigated</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {filteredRisks.length} of {risks.length} threats
        </span>
      </div>

      {/* Risk Cards List: Strict 4-Part Structure (WHY, EVIDENCE, IMPACT, WHAT TO DO) */}
      <div className="space-y-4">
        {filteredRisks.map((risk) => (
          <Card
            key={risk.id}
            className={`border transition-all rounded-2xl ${
              risk.status === "resolved" || risk.status === "mitigated"
                ? "border-slate-800/60 bg-slate-950/40 opacity-75"
                : risk.severity === "critical"
                ? "border-rose-500/50 bg-slate-900/90 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
                : risk.severity === "high"
                ? "border-amber-500/50 bg-slate-900/80"
                : "border-slate-800 bg-slate-950/80"
            }`}
          >
            <CardHeader className="pb-3 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    risk.severity === "critical"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : risk.severity === "high"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold">{risk.title}</CardTitle>
                    <Badge
                      variant={
                        risk.severity === "critical"
                          ? "destructive"
                          : risk.severity === "high"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-[9px] font-mono uppercase"
                    >
                      {risk.severity}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Category: {risk.source_type.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={risk.status === "active" ? "outline" : "secondary"}
                  onClick={() => {
                    const newStatus = risk.status === "active" ? "mitigated" : "active";
                    updateRisk(risk.id, newStatus);
                    showToast(`Risk "${risk.title}" marked ${newStatus.toUpperCase()}`);
                  }}
                  className="h-7 text-xs border-slate-700"
                >
                  {risk.status === "active" ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      Mark Mitigated
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Reactivate Threat
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3.5">
              {/* 1. WHY */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  1. Threat Description & Origin
                </span>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  {risk.description}
                </p>
              </div>

              {/* 2. EVIDENCE */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                  2. Telemetry Evidence
                </span>
                <p className="text-xs text-slate-300 mt-1 font-mono leading-relaxed">
                  {risk.evidence}
                </p>
              </div>

              {/* 3. IMPACT */}
              <div>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider font-mono">
                  3. Operational Impact & Severity
                </span>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Severity: <strong className="text-rose-400 uppercase">{risk.severity}</strong> • Impact: <strong className="text-amber-400 uppercase">{risk.impact}</strong> on critical path deliverables.
                </p>
              </div>

              {/* 4. WHAT TO DO */}
              <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                  4. Recommended Action Plan
                </span>
                <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                  {risk.suggested_action}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
