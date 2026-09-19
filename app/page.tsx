"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Bot,
  ArrowUpRight,
  TrendingUp,
  Users,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Play,
  Check,
  Plus,
  Zap,
  Radio,
  FileSearch,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkloadGauge } from "@/components/ui/WorkloadGauge";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const {
    event,
    tasks,
    volunteers,
    risks,
    auditLogs,
    updateTaskItem,
    triggerRiskAnalysis,
    showToast,
  } = useClubOps();

  // Real-time calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "review").length;
  const blockedTasks = tasks.filter((t) => t.status === "blocked").length;
  const now = new Date().getTime();
  const overdueTasks = tasks.filter(
    (t) => new Date(t.due_at).getTime() < now && t.status !== "done"
  );
  const criticalRisks = risks.filter((r) => r.status === "active" && r.severity === "critical");
  const highRisks = risks.filter((r) => r.status === "active" && r.severity === "high");

  // Dynamic Event Health Score
  const healthScore = Math.max(
    10,
    Math.min(
      100,
      Math.round(
        100 -
          overdueTasks.length * 8 -
          criticalRisks.length * 15 -
          blockedTasks * 5 +
          (completedTasks / Math.max(1, totalTasks)) * 25
      )
    )
  );

  // Volunteer workload calculation
  const overloadedVolunteers = volunteers.filter(
    (v) => v.availability === "overloaded" || (v.workloadScore || 0) > 75
  );

  // Upcoming Deadlines
  const upcomingDeadlines = [...tasks]
    .filter((t) => t.status !== "done")
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Selected Event Overview & Health */}
      <div className="relative overflow-hidden p-6 lg:p-8 rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/30 backdrop-blur-xl shadow-2xl">
        {/* Ambient Glow Background Element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Operations Command Center
              </span>
              <span className="text-slate-600">•</span>
              <Badge variant="cyan" className="text-[10px] font-mono">
                {event.status.toUpperCase()}
              </Badge>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-indigo-300 font-mono">Code: LJ-TECHFEST-26</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              {event.name}
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {event.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Oct 24–26, 2026</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800">
                <span>📍 {event.venue}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800 font-mono">
                <span>Budget: ₹{(event.budget * 82).toLocaleString()}</span>
              </div>
              <CountdownTimer targetDate="2026-10-24T09:00:00Z" />
            </div>
          </div>

          {/* Health Score Gauge with Diagnostics */}
          <div className="flex-shrink-0 flex items-center gap-5 p-5 rounded-2xl border border-slate-800/90 bg-slate-950/90 shadow-xl backdrop-blur-md">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-slate-800/80"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray={201}
                  strokeDashoffset={201 - (201 * healthScore) / 100}
                  className={
                    healthScore > 75
                      ? "text-emerald-500 transition-all duration-1000"
                      : healthScore > 50
                      ? "text-amber-500 transition-all duration-1000"
                      : "text-rose-500 transition-all duration-1000"
                  }
                  fill="transparent"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-lg font-extrabold text-white">{healthScore}%</span>
                <span className="text-[9px] text-slate-400 uppercase font-mono">Index</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Event Health</span>
                <Badge
                  variant={healthScore > 75 ? "success" : healthScore > 50 ? "warning" : "destructive"}
                  className="text-[9px] py-0 px-1.5 uppercase font-mono"
                >
                  {healthScore > 75 ? "HEALTHY" : healthScore > 50 ? "AT RISK" : "CRITICAL"}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                {overdueTasks.length} overdue item(s) impacting critical path.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                <span className="text-emerald-400 font-semibold">{completedTasks}/{totalTasks} Done</span>
                <span>•</span>
                <span className="text-rose-400 font-semibold">{blockedTasks} Blocked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Quick Action Bar */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-slate-300">Quick Operations:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/tasks")}
              className="h-7 text-xs gap-1.5 border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Create Task</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                triggerRiskAnalysis();
                showToast("Live AI Risk Scan initiated. Analyzing dependencies and bottlenecks...");
                router.push("/risks");
              }}
              className="h-7 text-xs gap-1.5 border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Run AI Risk Scan</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/announcements")}
              className="h-7 text-xs gap-1.5 border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200"
            >
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>Broadcast Update</span>
            </Button>
            <Button
              size="sm"
              variant="ai"
              onClick={() => router.push("/ai-assistant")}
              className="h-7 text-xs gap-1.5"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Launch Copilot</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-800/80 bg-slate-900/50 hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400">Total Tasks</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-white">{totalTasks}</div>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">{completedTasks} completed</span>
              <span>•</span>
              <span>{inProgressTasks} in flight</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-900/40 bg-rose-950/15 hover:border-rose-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-rose-300">Overdue Deliverables</CardTitle>
            <Clock className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-rose-400">{overdueTasks.length}</div>
            <p className="text-[11px] text-rose-300/80 mt-1.5 font-medium">
              Venue signoff & sponsor decks delayed
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-900/40 bg-amber-950/15 hover:border-amber-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-amber-300">Active Operational Risks</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-400">{risks.filter((r) => r.status === "active").length}</div>
            <p className="text-[11px] text-amber-300/80 mt-1.5 font-medium">
              {criticalRisks.length} critical path dependencies
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800/80 bg-slate-900/50 hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400">Volunteer Roster</CardTitle>
            <Users className="w-4 h-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-white">{volunteers.length}</div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              <span className="text-amber-400 font-semibold">{overloadedVolunteers.length} overloaded</span> • 24 total leads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Prominent "AI Attention Required" Section */}
      <div className="rounded-3xl border border-indigo-500/40 bg-gradient-to-b from-indigo-950/40 via-slate-900/80 to-slate-950/90 p-6 sm:p-7 shadow-aiGlow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-indigo-500/20 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-aiGlow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                AI Attention Required
                <Badge variant="ai" className="text-[9px] py-0 px-1.5">
                  REAL-TIME BOTTLENECK RADAR
                </Badge>
              </h2>
              <p className="text-xs text-slate-400">
                Surfaced by dependency propagation, volunteer workload spikes, and unfulfilled meeting action items.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ai"
            onClick={() => router.push("/ai-assistant")}
            className="text-xs h-8 gap-1.5 flex-shrink-0"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Open AI Command Center</span>
          </Button>
        </div>

        {/* Attention Items Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Critical Dependency Risk */}
          <div className="rounded-2xl border border-rose-500/40 bg-slate-900/90 p-5 flex flex-col justify-between shadow-sm hover:border-rose-500/70 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <Badge variant="destructive" className="text-[10px] font-mono">
                  DEPENDENCY BLOCKED
                </Badge>
                <span className="text-[10px] text-rose-400 font-mono font-semibold">2 days overdue</span>
              </div>
              <h3 className="text-xs font-bold text-white mt-2.5">
                Grand Auditorium Booking Unsigned
              </h3>
              <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                Task #task-01 is marked BLOCKED. This delays <strong>Stage Rigging</strong>, <strong>Sound Check</strong>, and the <strong>Dress Rehearsal</strong>.
              </p>
              <div className="mt-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/80 text-[10px] text-slate-400 font-mono">
                Evidence: Task #task-01 due 2026-09-17 • 3 downstream tasks waiting.
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-indigo-300 font-mono">Target: Rahul Sharma</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/50"
                onClick={() => {
                  showToast("Opening AI Copilot to draft urgent venue escalation to Registrar");
                  router.push("/ai-assistant");
                }}
              >
                Copilot Intervene
              </Button>
            </div>
          </div>

          {/* Card 2: Overloaded Volunteer */}
          <div className="rounded-2xl border border-amber-500/40 bg-slate-900/90 p-5 flex flex-col justify-between shadow-sm hover:border-amber-500/70 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <Badge variant="warning" className="text-[10px] font-mono">
                  BURNOUT THREAT
                </Badge>
                <span className="text-[10px] text-amber-400 font-mono font-semibold">92% capacity</span>
              </div>
              <h3 className="text-xs font-bold text-white mt-2.5">
                Rahul Sharma Assigned 7 Critical Tasks
              </h3>
              <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                Handling venue signoffs, stage rigging, power extension procurement, and AC checks simultaneously.
              </p>
              <div className="mt-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/80 text-[10px] text-slate-400 font-mono">
                Recommendation: Reassign heavy electrical tasks to Arjun Pillai (Available).
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">7 Active Tasks</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] border-amber-500/40 text-amber-300 hover:bg-amber-950/50"
                onClick={() => {
                  showToast("Navigating to Volunteer Workload rebalancing engine");
                  router.push("/volunteers");
                }}
              >
                Rebalance Workload
              </Button>
            </div>
          </div>

          {/* Card 3: Meeting Action Pending */}
          <div className="rounded-2xl border border-indigo-500/40 bg-slate-900/90 p-5 flex flex-col justify-between shadow-sm hover:border-indigo-500/70 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <Badge variant="ai" className="text-[10px] font-mono">
                  MEETING ACTION EXTRACTED
                </Badge>
                <span className="text-[10px] text-indigo-400 font-mono font-semibold">Sync Transcript</span>
              </div>
              <h3 className="text-xs font-bold text-white mt-2.5">
                Launch Registration Portal & Instagram Reel
              </h3>
              <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                Jay and Priya committed to launch the registration site and teaser video by Friday night for 500 hacker signups.
              </p>
              <div className="mt-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/80 text-[10px] text-slate-400 font-mono">
                Confidence: 96% • 3 Action Items ready for one-click approval.
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">Review & Commit</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/50"
                onClick={() => {
                  showToast("Reviewing meeting extraction deliverables");
                  router.push("/meetings");
                }}
              >
                Open Meeting
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Critical Deadlines + Volunteer Workload & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Deadlines & Priority Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-800/80 bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800/60">
              <div>
                <CardTitle className="text-sm">Critical Deadlines & In-Flight Work</CardTitle>
                <CardDescription>Deliverables requiring immediate attention, review, or signoff.</CardDescription>
              </div>
              <Link href="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold">
                <span>View all ({tasks.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-4">
              {upcomingDeadlines.map((task) => {
                const isOverdue = new Date(task.due_at).getTime() < now;
                return (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/90 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        onClick={() => {
                          updateTaskItem(task.id, { status: "done" });
                          showToast(`Task marked DONE: "${task.title}"`);
                        }}
                        className="w-5 h-5 rounded-md border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 flex items-center justify-center text-transparent hover:text-emerald-400 transition-colors flex-shrink-0"
                        title="Mark done"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>Assignee: <strong className="text-slate-300">{task.owner?.name || "Unassigned"}</strong></span>
                          <span>•</span>
                          <span className={isOverdue ? "text-rose-400 font-semibold font-mono" : "text-slate-400 font-mono"}>
                            {formatRelativeTime(task.due_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={
                          task.priority === "critical"
                            ? "destructive"
                            : task.priority === "high"
                            ? "warning"
                            : "secondary"
                        }
                        className="text-[10px] font-mono uppercase"
                      >
                        {task.priority}
                      </Badge>
                      <Badge
                        variant={
                          task.status === "blocked"
                            ? "destructive"
                            : task.status === "in_progress"
                            ? "warning"
                            : task.status === "done"
                            ? "success"
                            : "secondary"
                        }
                        className="text-[10px] font-mono uppercase"
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Volunteer Workload Heatmeter Card */}
          <Card className="border-slate-800/80 bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800/60">
              <div>
                <CardTitle className="text-sm">Volunteer Workload Distribution</CardTitle>
                <CardDescription>Live task allocation and capacity gauges across active committee leads.</CardDescription>
              </div>
              <Link href="/volunteers" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold">
                <span>Manage Team ({volunteers.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {volunteers.slice(0, 5).map((vol) => (
                <WorkloadGauge
                  key={vol.id}
                  label={vol.user?.name}
                  score={vol.workloadScore || 30}
                  taskCount={vol.assignedTasks?.length || 0}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Live Operational Activity Feed */}
        <div className="space-y-6">
          <Card className="border-slate-800/80 bg-slate-900/50">
            <CardHeader className="pb-3 border-b border-slate-800/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Operational Activity Feed</CardTitle>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <CardDescription>Verifiable audit trail of user and AI operations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {auditLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-1 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-200">
                        {log.actor?.name || (log.actor_type === "ai" ? "ClubOps Copilot" : "System")}
                      </span>
                      <Badge
                        variant={log.actor_type === "ai" ? "ai" : "secondary"}
                        className="text-[9px] py-0 px-1 font-mono"
                      >
                        {log.actor_type.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-300 font-mono">
                    {log.action}
                  </p>
                  {log.metadata_json && (
                    <p className="text-[11px] text-slate-400 truncate font-sans">
                      {log.metadata_json.title ||
                        log.metadata_json.event_name ||
                        JSON.stringify(log.metadata_json)}
                    </p>
                  )}
                </div>
              ))}
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/audit")}
                  className="w-full text-xs h-8 text-slate-300 border-slate-700 hover:bg-slate-800"
                >
                  View Full Audit Ledger
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
