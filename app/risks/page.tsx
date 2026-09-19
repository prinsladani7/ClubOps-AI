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
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
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
          <span>{isScanning ? "Evaluating Dependency Chains..." : "Run Risk Analysis"}</span>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Severity:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <span className="text-xs text-slate-400 ml-3">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Threats</option>
            <option value="mitigated">Mitigated</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {filteredRisks.length} of {risks.length} evaluated items
        </span>
      </div>

      {/* Risk Cards List: Strict Section 12 Formatting (WHY, EVIDENCE, IMPACT, WHAT TO DO) */}
      <div className="space-y-4">
        {filteredRisks.map((risk) => (
          <Card
            key={risk.id}
            className={`border transition-all ${
              risk.status === "resolved"
                ? "border-slate-800/60 bg-slate-950/40 opacity-70"
                : risk.severity === "critical"
                ? "border-rose-500/40 bg-slate-900/80 shadow-dangerGlow"
                : risk.severity === "high"
                ? "border-amber-500/40 bg-slate-900/70"
                : "border-slate-800 bg-slate-950"
            }`}
          >
            <CardHeader className="pb-3 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    risk.severity === "critical"
                      ? "bg-rose-500/20 text-rose-400"
                      : risk.severity === "high"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-indigo-500/20 text-indigo-400"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{risk.title}</CardTitle>
                    <Badge
                      variant={
                        risk.severity === "critical"
                          ? "destructive"
                          : risk.severity === "high"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-[9px] uppercase tracking-wider"
                    >
                      {risk.severity} Severity
                    </Badge>
                  </div>
                  <CardDescription className="mt-0.5">{risk.description}</CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    risk.status === "resolved"
                      ? "success"
                      : risk.status === "mitigated"
                      ? "warning"
                      : "destructive"
                  }
                  className="text-[10px]"
                >
                  {risk.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4 text-xs">
              {/* The 4 Mandatory Operational Blocks: WHY, EVIDENCE, IMPACT, WHAT TO DO */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. WHY */}
                <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    1. Why Flagged?
                  </span>
                  <p className="text-slate-200 leading-relaxed font-mono text-[11px]">
                    Source: {risk.source_type.toUpperCase()} ({risk.source_id || "Graph"})
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Probability: {risk.probability} • Impact: {risk.impact}
                  </p>
                </div>

                {/* 2. EVIDENCE */}
                <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60 space-y-1">
                  <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                    2. Verifiable Evidence
                  </span>
                  <p className="text-slate-200 leading-relaxed text-[11px]">
                    {risk.evidence}
                  </p>
                </div>

                {/* 3. IMPACT */}
                <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60 space-y-1">
                  <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">
                    3. Downstream Impact
                  </span>
                  <p className="text-slate-200 leading-relaxed text-[11px]">
                    {risk.affected_tasks && risk.affected_tasks.length > 0
                      ? `Affects ${risk.affected_tasks.length} tasks in the critical path (${risk.affected_tasks.slice(0, 2).join(", ")}...)`
                      : "Direct impact on event schedule and attendee experience."}
                  </p>
                </div>

                {/* 4. WHAT TO DO */}
                <div className="p-3 rounded-lg border border-slate-800/80 bg-indigo-950/20 space-y-1">
                  <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                    4. Recommended Action
                  </span>
                  <p className="text-indigo-200 leading-relaxed text-[11px]">
                    {risk.suggested_action}
                  </p>
                </div>
              </div>

              {/* Status Management Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-500 font-mono">
                  Reported: {risk.created_at.slice(0, 10)} • System ID: {risk.id}
                </span>

                <div className="flex items-center gap-2">
                  {risk.status !== "mitigated" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateRisk(risk.id, "mitigated")}
                      className="h-7 text-xs text-amber-300 border-amber-500/40 hover:bg-amber-950/50"
                    >
                      Mark Mitigated
                    </Button>
                  )}
                  {risk.status !== "resolved" && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateRisk(risk.id, "resolved")}
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500"
                    >
                      Resolve Risk
                    </Button>
                  )}
                  {risk.status === "resolved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateRisk(risk.id, "active")}
                      className="h-7 text-xs text-slate-400"
                    >
                      Reopen Threat
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredRisks.length === 0 && (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-white">No active threats in this category.</p>
            <p className="text-xs text-slate-400">
              All tasks and volunteer allocations are operating within safe tolerances.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
