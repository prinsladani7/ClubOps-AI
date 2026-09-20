"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";

export default function OrganizerCalendarPage() {
  const { currentUser, projects, tasks, event } = useClubOps();

  const myProjects = projects.filter(
    (p) => p.organizer_id === currentUser.id || (p.organizers && p.organizers.includes(currentUser.id))
  );
  const myProjectIds = new Set(myProjects.map((p) => p.id));
  const myTasks = tasks.filter((t) => t.project_id && myProjectIds.has(t.project_id));

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/organizer/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Organizer Dashboard
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-mono text-cyan-400 font-semibold">Calendar</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Operational Deadlines & Milestone Schedule
          </h1>
          <p className="text-xs text-slate-400">
            Chronological timetable of project deliverables, vendor sign-offs, and critical path milestones.
          </p>
        </div>

        <Badge variant="cyan" className="text-xs font-mono py-1 px-3">
          {event.name} Event Timeline
        </Badge>
      </div>

      {/* Timeline Schedule View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deadlines List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">Milestone Timeline</h2>
            <span className="text-xs text-slate-400 font-mono">{myTasks.length} Scheduled Deliverables</span>
          </div>

          <div className="space-y-3">
            {myTasks.map((task) => {
              const proj = projects.find((p) => p.id === task.project_id);
              const isOverdue = new Date(task.due_at).getTime() < Date.now() && task.status !== "completed" && task.status !== "done";

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border bg-slate-900/70 backdrop-blur-xl flex items-center justify-between gap-4 transition-all ${
                    isOverdue ? "border-rose-500/40" : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-mono">
                      <span className="text-[10px] text-slate-400 uppercase">
                        {new Date(task.due_at).toLocaleString("default", { month: "short" })}
                      </span>
                      <span className="text-xs font-bold text-white leading-none">
                        {new Date(task.due_at).getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] font-mono border-slate-700 text-slate-300">
                          {proj?.name || "Project"}
                        </Badge>
                        <span className="text-sm font-bold text-white">{task.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Assignee: {task.owner?.name || "Unassigned"} • Est: {task.estimated_hours || 4} hrs
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={
                      task.status === "completed" || task.status === "done"
                        ? "cyan"
                        : task.status === "submitted"
                        ? "warning"
                        : isOverdue
                        ? "destructive"
                        : "outline"
                    }
                    className="text-[10px] font-mono uppercase"
                  >
                    {task.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Card Context (1 Col) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Clock className="w-5 h-5" />
            <h3 className="text-base text-white">Event Critical Path</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Event Day Zero</span>
              <p className="font-semibold text-white">{new Date(event.start_at).toLocaleDateString()}</p>
              <p className="text-slate-400">{event.venue}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Deliverable Cutoff</span>
              <p className="font-semibold text-white">48 Hours Before Kickoff</p>
              <p className="text-slate-400">All task evidence must be submitted for review.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Status Overview</span>
              <p className="font-semibold text-white">
                {myTasks.filter((t) => t.status === "completed" || t.status === "done").length} / {myTasks.length} Completed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
