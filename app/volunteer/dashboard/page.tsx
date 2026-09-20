"use client";

import React from "react";
import Link from "next/link";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  BellRing,
  ArrowRight,
  User,
  Sparkles,
  Zap,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function VolunteerDashboardPage() {
  const { currentUser, tasks, notifications, volunteers, event } = useClubOps();

  // Volunteer scoped tasks (Section 7)
  const myTasks = tasks.filter((t) => t.owner_id === currentUser.id);
  const pendingAcceptance = myTasks.filter((t) => t.status === "pending");
  const inProgressTasks = myTasks.filter((t) => t.status === "in_progress" || t.status === "accepted");
  const completedTasks = myTasks.filter((t) => t.status === "completed" || t.status === "done");
  const blockedTasks = myTasks.filter((t) => t.status === "blocked");
  const overdueTasks = myTasks.filter(
    (t) => new Date(t.due_at).getTime() < Date.now() && t.status !== "completed" && t.status !== "done"
  );

  const unreadNotifications = notifications.filter((n) => !n.read_at);
  const myVolunteerProfile = volunteers.find((v) => v.user_id === currentUser.id);

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan" className="text-xs px-2.5 py-0.5 font-mono">
              VOLUNTEER CLEARANCE
            </Badge>
            <span className="text-xs text-slate-400 font-mono">Task Execution & Delivery</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Personal Operations Command
          </h1>
          <p className="text-xs text-slate-400">
            Welcome, <span className="text-white font-semibold">{currentUser.name}</span>. You have {inProgressTasks.length} tasks in progress and {pendingAcceptance.length} pending acceptance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/volunteer/tasks"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white transition-all shadow-aiGlow flex items-center gap-2"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Open My Tasks</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">In Progress</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{inProgressTasks.length}</span>
            <span className="text-xs text-cyan-400">Active Focus</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">Pending Acceptance</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">{pendingAcceptance.length}</span>
            <span className="text-xs text-slate-400">New Assignments</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">{completedTasks.length}</span>
            <span className="text-xs text-slate-400">Deliverables</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">Blockers / Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400 font-mono">{blockedTasks.length + overdueTasks.length}</span>
            <span className="text-xs text-rose-400">{blockedTasks.length} Blocked</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Urgent Task Deliverables & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">Active Deliverables Queue</h2>
            <Link href="/volunteer/tasks" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">
              View All ({myTasks.length}) &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {myTasks.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400">
                <p className="text-xs">No tasks currently assigned. Check back once an organizer assigns work.</p>
              </div>
            ) : (
              myTasks.slice(0, 5).map((task) => {
                const isOverdue = new Date(task.due_at).getTime() < Date.now() && task.status !== "completed" && task.status !== "done";

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border bg-slate-900/70 backdrop-blur-xl flex items-center justify-between gap-4 transition-all ${
                      task.status === "pending"
                        ? "border-amber-500/40 bg-slate-900/90"
                        : isOverdue
                        ? "border-rose-500/40"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={task.priority === "critical" ? "destructive" : task.priority === "high" ? "warning" : "outline"}
                          className="text-[9px] uppercase font-mono"
                        >
                          {task.priority}
                        </Badge>
                        <span className="font-semibold text-white text-xs truncate">{task.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Due: {new Date(task.due_at).toLocaleDateString()} • Est: {task.estimated_hours || 4} hrs
                      </p>
                    </div>

                    <Link
                      href={`/volunteer/tasks#${task.id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold whitespace-nowrap transition-colors"
                    >
                      {task.status === "pending" ? "Accept Task" : "Work on Deliverable"} &rarr;
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Profile Summary & Notification Alerts (1 Col) */}
        <div className="space-y-6">
          {/* Profile & Skills Summary Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Volunteer Profile
              </span>
              <Link href="/volunteer/profile" className="text-[11px] text-cyan-400 hover:underline">
                Edit &rarr;
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Availability:</span>
                <Badge variant="cyan" className="text-[10px] uppercase font-mono">
                  {myVolunteerProfile?.availability || "available"}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Hours Contributed:</span>
                <span className="font-mono text-white font-bold">
                  {myVolunteerProfile?.total_hours_logged || 14} Hours
                </span>
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400">Your Skills:</span>
                <div className="flex flex-wrap gap-1">
                  {(myVolunteerProfile?.skills || ["Generalist", "Coordination"]).map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notifications Alert */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                <BellRing className="w-4 h-4" />
                <span>Recent Notifications</span>
              </div>
              <Link href="/volunteer/notifications" className="text-[11px] text-cyan-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2">
              {notifications.slice(0, 3).map((n) => (
                <div
                  key={n.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] space-y-0.5"
                >
                  <p className="font-semibold text-white">{n.title}</p>
                  <p className="text-slate-400 line-clamp-1">{n.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
