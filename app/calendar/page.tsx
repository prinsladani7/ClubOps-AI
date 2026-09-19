"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Video,
  FileText,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/utils";

export default function CalendarPage() {
  const { tasks, meetings, event } = useClubOps();

  // Combine tasks and meetings into chronological agenda
  const agendaItems = [
    ...tasks.map((t) => ({
      id: t.id,
      title: t.title,
      type: "task" as const,
      date: t.due_at,
      priority: t.priority,
      status: t.status,
      owner: t.owner?.name,
    })),
    ...meetings.map((m) => ({
      id: m.id,
      title: m.title,
      type: "meeting" as const,
      date: m.scheduled_at,
      priority: "high" as const,
      status: m.transcript_status,
      owner: "Core Team",
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-400" />
            <span>Master Schedule & Operational Agenda</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Synchronized timeline of meetings, task milestones, and critical path deadlines for {event.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="cyan" className="py-1 px-2.5">
            Event Day: Oct 24, 2026
          </Badge>
        </div>
      </div>

      {/* Agenda Stream */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className="text-sm">Upcoming Operations Agenda</CardTitle>
          <CardDescription>
            Chronologically ordered deadlines and sync checkpoints.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 divide-y divide-slate-800/60">
          {agendaItems.slice(0, 15).map((item) => {
            const isTask = item.type === "task";
            const isPast = new Date(item.date).getTime() < Date.now();
            return (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isTask
                        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                        : "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30"
                    }`}
                  >
                    {isTask ? <CheckCircle2 className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-100 truncate">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>👤 {item.owner || "Unassigned"}</span>
                      <span>•</span>
                      <span className="font-mono text-cyan-300">
                        {formatDate(item.date)} at {formatTime(item.date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={item.priority === "critical" ? "destructive" : "warning"} className="text-[10px]">
                    {item.priority}
                  </Badge>
                  <Badge variant={isPast && item.status !== "done" ? "destructive" : "secondary"} className="text-[10px]">
                    {isPast && item.status !== "done" ? "OVERDUE" : item.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
