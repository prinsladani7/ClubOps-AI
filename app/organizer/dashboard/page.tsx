"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  CheckSquare,
  AlertTriangle,
  History,
  Sparkles,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Flame,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function OrganizerDashboardPage() {
  const { currentUser, projects, tasks, volunteers, risks, auditLogs, showToast } = useClubOps();

  // Scoped data for this organizer (Specification Section 6)
  const myProjects = projects.filter(
    (p) => p.organizer_id === currentUser.id || (p.organizers && p.organizers.includes(currentUser.id))
  );
  const myProjectIds = new Set(myProjects.map((p) => p.id));

  const myTasks = tasks.filter((t) => t.project_id && myProjectIds.has(t.project_id));
  const activeTasks = myTasks.filter((t) => t.status !== "completed" && t.status !== "done");
  const overdueTasks = activeTasks.filter((t) => new Date(t.due_at).getTime() < Date.now());
  const submittedTasks = myTasks.filter((t) => t.status === "submitted");
  const blockedTasks = myTasks.filter((t) => t.status === "blocked");

  // Volunteers assigned to organizer's projects
  const scopedVolunteers = volunteers.filter(
    (v) => v.project_ids && v.project_ids.some((pid) => myProjectIds.has(pid))
  );

  const scopedAuditLogs = auditLogs.filter(
    (l) => l.actor_user_id === currentUser.id || (l.metadata_json && myProjectIds.has(l.metadata_json.projectId))
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Badge variant="cyan" className="text-xs px-2.5 py-0.5 font-mono">
              ORGANIZER CLEARANCE
            </Badge>
            <span className="text-xs text-slate-400 font-mono">Project Leadership & Operations</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Lead Operations Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Welcome back, <span className="text-white font-semibold">{currentUser.name}</span>. Managing {myProjects.length} designated project workstreams and volunteer squads.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/organizer/tasks?action=create"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white transition-all shadow-aiGlow flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create & Assign Task</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">Assigned Projects</span>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{myProjects.length}</span>
            <span className="text-xs text-emerald-400">Active Scope</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">In-Flight Tasks</span>
            <CheckSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{activeTasks.length}</span>
            <span className="text-xs text-slate-400">of {myTasks.length} total</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">{submittedTasks.length}</span>
            <span className="text-xs text-slate-400">Submissions</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">Overdue & Blocked</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400 font-mono">{overdueTasks.length + blockedTasks.length}</span>
            <span className="text-xs text-rose-400">{blockedTasks.length} Blocked</span>
          </div>
        </div>
      </div>

      {/* Review Queue: Submitted Proof of Work */}
      {submittedTasks.length > 0 && (
        <div className="p-5 rounded-2xl border border-amber-500/40 bg-amber-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Deliverables Pending Your Review ({submittedTasks.length})</span>
            </div>
            <Link
              href="/organizer/tasks?tab=review"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              Open Review Queue &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {submittedTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-white">{task.title}</p>
                  <p className="text-[11px] text-slate-400">
                    Assignee: {task.owner?.name || "Volunteer"}
                  </p>
                </div>
                <Link
                  href={`/organizer/tasks#${task.id}`}
                  className="px-3 py-1 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
                >
                  Review Proof
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Assigned Workstream Projects</h2>
            <p className="text-xs text-slate-400">Projects under your operational directorship.</p>
          </div>
          <Link
            href="/organizer/projects"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {myProjects.map((proj) => {
            const pTasks = tasks.filter((t) => t.project_id === proj.id);
            const pDone = pTasks.filter((t) => t.status === "completed" || t.status === "done").length;
            const pProgress = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;

            return (
              <div
                key={proj.id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="cyan" className="text-[10px] uppercase font-mono">
                      {proj.status}
                    </Badge>
                    <span className="text-xs text-emerald-400 font-mono font-bold">
                      ₹{proj.budget?.toLocaleString() || "0"} Budget
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{proj.description}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Deliverable Progress:</span>
                    <span className="font-mono text-white font-bold">{pProgress}% ({pDone}/{pTasks.length})</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                      style={{ width: `${pProgress}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <Link
                    href={`/organizer/tasks?projectId=${proj.id}`}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    <span>Manage Tasks ({pTasks.length})</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>

                  <Link
                    href={`/organizer/projects#${proj.id}`}
                    className="text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <span>Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Grid: Priority Tasks Queue & Squad Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Tasks Queue */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">Today's Priority Task Queue</h2>
            <Link href="/organizer/tasks" className="text-xs text-cyan-400 hover:text-cyan-300">
              All Tasks &rarr;
            </Link>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {activeTasks.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs text-slate-400">No active tasks yet. Create a task to get started.</p>
                <Link href="/organizer/tasks?action=create" className="inline-block mt-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300">
                  + Create Task
                </Link>
              </div>
            ) : activeTasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={task.priority === "critical" ? "destructive" : task.priority === "high" ? "warning" : "outline"}
                      className="text-[9px] uppercase font-mono"
                    >
                      {task.priority}
                    </Badge>
                    <span className="font-semibold text-white truncate">{task.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Assigned: {task.owner?.name || "Unassigned"} • Due: {new Date(task.due_at).toLocaleDateString()}
                  </p>
                </div>

                <Badge variant={task.status === "in_progress" ? "cyan" : "outline"} className="text-[10px] font-mono capitalize">
                  {task.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Squad Volunteers Overview */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">Squad Volunteers Capacity</h2>
            <Link href="/organizer/volunteers" className="text-xs text-cyan-400 hover:text-cyan-300">
              Manage Squad &rarr;
            </Link>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {scopedVolunteers.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No volunteers assigned to your projects yet.</p>
                <Link href="/admin/volunteers" className="inline-block mt-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300">
                  Go to Volunteer Roster
                </Link>
              </div>
            ) : scopedVolunteers.slice(0, 6).map((vol) => {
              const u = vol.user;
              const isOverloaded = vol.availability === "overloaded" || (vol.workloadScore || 0) > 75;

              return (
                <div
                  key={vol.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300">
                      {(u?.name || "V")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{u?.name || "Volunteer"}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {vol.skills.slice(0, 2).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        isOverloaded ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {vol.workloadScore || 20}% Load
                    </span>
                    <p className="text-[10px] text-slate-500 capitalize">{vol.availability}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

