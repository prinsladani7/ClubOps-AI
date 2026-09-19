"use client";

import React from "react";
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
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const { event, tasks, volunteers, risks, auditLogs, updateTaskItem, showToast } = useClubOps();

  // Metrics calculated from real state
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

  // Dynamic Event Health Score (100 base, penalize overdue tasks and critical risks)
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

  // Upcoming Deadlines (sorted)
  const upcomingDeadlines = [...tasks]
    .filter((t) => t.status !== "done")
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Selected Event Overview & Health */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-indigo-950/20 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Operations Command Center
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <Badge variant="cyan" className="text-[10px]">
              {event.status.toUpperCase()}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {event.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {event.description}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Oct 24–26, 2026 (35 days away)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">•</span>
              <span>📍 {event.venue}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">•</span>
              <span>Budget: ${event.budget.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Health Score Gauge */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/80">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="currentColor"
                strokeWidth="5"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="currentColor"
                strokeWidth="5"
                strokeDasharray={163}
                strokeDashoffset={163 - (163 * healthScore) / 100}
                className={healthScore > 75 ? "text-emerald-500" : healthScore > 50 ? "text-amber-500" : "text-rose-500"}
                fill="transparent"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-sm font-bold text-white">{healthScore}%</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white">Event Health</span>
              <Badge
                variant={healthScore > 75 ? "success" : healthScore > 50 ? "warning" : "destructive"}
                className="text-[9px] py-0 px-1"
              >
                {healthScore > 75 ? "HEALTHY" : healthScore > 50 ? "AT RISK" : "CRITICAL"}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {overdueTasks.length} overdue task(s) affecting critical path.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400">Total Tasks</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalTasks}</div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-medium">{completedTasks} completed</span>
              <span>•</span>
              <span>{inProgressTasks} in flight</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-900/40 bg-rose-950/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-rose-300">Overdue Tasks</CardTitle>
            <Clock className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">{overdueTasks.length}</div>
            <p className="text-[11px] text-rose-300/80 mt-1">
              Venue signoff & sponsor decks delayed
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-900/40 bg-amber-950/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-amber-300">Active Risks</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{risks.filter((r) => r.status === "active").length}</div>
            <p className="text-[11px] text-amber-300/80 mt-1">
              {criticalRisks.length} critical path dependencies
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400">Volunteer Roster</CardTitle>
            <Users className="w-4 h-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{volunteers.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              <span className="text-amber-400 font-medium">{overloadedVolunteers.length} overloaded</span> • 24 total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Prominent "AI Attention Required" Section (Core Section 5 Requirement) */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-slate-900/60 to-slate-950/80 p-6 shadow-aiGlow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-indigo-500/20 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">
                AI Attention Required
              </h2>
              <p className="text-xs text-slate-400">
                Operational bottlenecks surfaced from dependency chains and real-time activity.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ai"
            onClick={() => router.push("/ai-assistant")}
            className="text-xs h-8 gap-1.5"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Open AI Command Center</span>
          </Button>
        </div>

        {/* Attention Items Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Critical Dependency Risk */}
          <div className="rounded-xl border border-rose-500/30 bg-slate-900/80 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <Badge variant="destructive" className="text-[10px]">
                  DEPENDENCY BLOCKED
                </Badge>
                <span className="text-[10px] text-rose-400 font-mono">2 days overdue</span>
              </div>
              <h3 className="text-xs font-semibold text-white mt-2">
                Grand Auditorium Booking Unsigned
              </h3>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Task #task-01 is marked BLOCKED. This delays <strong>Stage Rigging</strong>, <strong>Sound Check</strong>, and the <strong>Dress Rehearsal</strong>.
              </p>
              <div className="mt-3 p-2 rounded bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 font-mono">
                Evidence: Task #task-01 due 2026-09-17 • 3 downstream tasks waiting.
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-indigo-300">Target: Rahul Sharma</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/50"
                onClick={() => router.push("/ai-assistant")}
              >
                Ask Copilot to Intervene
              </Button>
            </div>
          </div>

          {/* Card 2: Overloaded Volunteer */}
          <div className="rounded-xl border border-amber-500/30 bg-slate-900/80 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <Badge variant="warning" className="text-[10px]">
                  BURNOUT THREAT
                </Badge>
                <span className="text-[10px] text-amber-400 font-mono">92% capacity</span>
              </div>
              <h3 className="text-xs font-semibold text-white mt-2">
                Rahul Sharma Assigned 7 Critical Tasks
              </h3>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Handling venue signoffs, stage rigging, power extension procurement, and AC checks simultaneously.
              </p>
              <div className="mt-3 p-2 rounded bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 font-mono">
                Recommendation: Reassign heavy electrical tasks to Arjun Pillai (Available).
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">7 Active Tasks</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] border-amber-500/40 text-amber-300 hover:bg-amber-950/50"
                onClick={() => router.push("/volunteers")}
              >
                Rebalance Workload
              </Button>
            </div>
          </div>

          {/* Card 3: Meeting Action Pending */}
          <div className="rounded-xl border border-indigo-500/30 bg-slate-900/80 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <Badge variant="ai" className="text-[10px]">
                  MEETING ACTION EXTRACTED
                </Badge>
                <span className="text-[10px] text-indigo-400 font-mono">Yesterday Sync</span>
              </div>
              <h3 className="text-xs font-semibold text-white mt-2">
                Launch Registration Portal & Instagram Reel
              </h3>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Jay and Priya committed to launch the registration site and teaser video by Friday night for 500 hacker signups.
              </p>
              <div className="mt-3 p-2 rounded bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 font-mono">
                Confidence: 96% • 3 Action Items ready for one-click approval.
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Review & Approve</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/50"
                onClick={() => router.push("/meetings")}
              >
                Open Meeting
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Upcoming Deadlines + Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Deadlines & Priority Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm">Critical Deadlines & In-Flight Work</CardTitle>
                <CardDescription>Tasks requiring immediate attention or review.</CardDescription>
              </div>
              <Link href="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">
                <span>View all ({tasks.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {upcomingDeadlines.map((task) => {
                const isOverdue = new Date(task.due_at).getTime() < now;
                return (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/50 hover:bg-slate-900/80 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => {
                          updateTaskItem(task.id, { status: "done" });
                          showToast(`Task marked DONE: "${task.title}"`);
                        }}
                        className="w-5 h-5 rounded border border-slate-700 hover:border-emerald-500 flex items-center justify-center text-transparent hover:text-emerald-400 transition-colors"
                        title="Mark done"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>Assignee: {task.owner?.name || "Unassigned"}</span>
                          <span>•</span>
                          <span className={isOverdue ? "text-rose-400 font-medium" : "text-slate-400"}>
                            {formatRelativeTime(task.due_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          task.priority === "critical"
                            ? "destructive"
                            : task.priority === "high"
                            ? "warning"
                            : "secondary"
                        }
                        className="text-[10px]"
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
                        className="text-[10px]"
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm">Volunteer Workload Distribution</CardTitle>
                <CardDescription>Live task allocation across active committee leads.</CardDescription>
              </div>
              <Link href="/volunteers" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">
                <span>Manage Team ({volunteers.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {volunteers.slice(0, 5).map((vol) => {
                const score = vol.workloadScore || 30;
                return (
                  <div key={vol.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-200">{vol.user?.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {score}% load ({vol.assignedTasks?.length || 0} tasks)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          score > 80
                            ? "bg-rose-500"
                            : score > 50
                            ? "bg-amber-500"
                            : "bg-indigo-500"
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Live Operational Activity Feed */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Operational Activity Feed</CardTitle>
              <CardDescription>Verifiable audit trail of user and AI actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {auditLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/40 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-200">
                        {log.actor?.name || (log.actor_type === "ai" ? "ClubOps Copilot" : "System")}
                      </span>
                      <Badge
                        variant={log.actor_type === "ai" ? "ai" : "secondary"}
                        className="text-[9px] py-0 px-1"
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
                    <p className="text-[11px] text-slate-400 truncate">
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
                  className="w-full text-xs h-8 text-slate-300"
                >
                  View Full Audit Log
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
