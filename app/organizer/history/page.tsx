"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  History,
  ArrowLeft,
  Search,
  Filter,
  Briefcase,
  CheckSquare,
  Users,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { resolveEntityLabel, formatActionNarrative } from "@/lib/utils/formatters";

export default function OrganizerHistoryPage() {
  const { currentUser, auditLogs, projects, tasks, users, teams, event } = useClubOps();
  const [search, setSearch] = useState("");

  const dbHelper = {
    getTaskById: (id: string) => tasks.find((t) => t.id === id),
    getUserById: (id: string) => users.find((u) => u.id === id),
    getTeamById: (id: string) => teams.find((t) => t.id === id),
    getProjectById: (id: string) => projects.find((p) => p.id === id),
    getEvent: () => event,
  };

  const myProjects = projects.filter(
    (p) => p.organizer_id === currentUser.id || (p.organizers && p.organizers.includes(currentUser.id))
  );
  const myProjectIds = new Set(myProjects.map((p) => p.id));

  // Scoped audit logs (Section 4 & 6)
  const scopedLogs = auditLogs.filter(
    (l) =>
      l.actor_user_id === currentUser.id ||
      (l.metadata_json && myProjectIds.has(l.metadata_json.projectId)) ||
      (l.entity_type === "project" && myProjectIds.has(l.entity_id))
  );

  const filteredLogs = scopedLogs.filter(
    (l) =>
      !search ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_type.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_id.toLowerCase().includes(search.toLowerCase())
  );

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
            <span className="text-xs font-mono text-cyan-400 font-semibold">History</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Operational Activity & Assignment Log
          </h1>
          <p className="text-xs text-slate-400">
            Audit feed of task creations, volunteer assignments, status updates, and milestone submissions in your scope.
          </p>
        </div>

        <Badge variant="cyan" className="text-xs font-mono py-1 px-3">
          {scopedLogs.length} Scoped Activity Events
        </Badge>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter activity history..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Activity Timeline */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
        <div className="divide-y divide-slate-800/60">
          {filteredLogs.map((log) => (
            <div key={log.id} className="py-3 flex items-center justify-between text-xs gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-wrap sm:flex-nowrap">
                <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-300 uppercase flex-shrink-0">
                  {log.action.replace(/_/g, " ")}
                </Badge>
                <span className="text-white font-semibold truncate flex-shrink-0">{log.actor?.name || log.actor_user_id}</span>
                {(() => {
                  const resolved = resolveEntityLabel(log.entity_type, log.entity_id, dbHelper);
                  return (
                    <div className="flex items-center gap-1.5 text-slate-300 truncate">
                      <span className="text-[9px] uppercase font-mono px-1 rounded bg-slate-800 text-slate-400">
                        {resolved.typeLabel}
                      </span>
                      <span className="text-cyan-300 font-medium truncate">
                        {resolved.name}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <span className="text-[11px] text-slate-500 font-mono flex-shrink-0">
                {new Date(log.created_at).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
