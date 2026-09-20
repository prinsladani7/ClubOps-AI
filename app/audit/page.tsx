"use client";

import React, { useState } from "react";
import {
  History,
  Search,
  ShieldCheck,
  User,
  Bot,
  Settings,
  Filter,
  CheckCircle2,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import { resolveEntityLabel, formatActionNarrative } from "@/lib/utils/formatters";

export default function AuditPage() {
  const { auditLogs, event, tasks, users, teams } = useClubOps();

  const [filterActorType, setFilterActorType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const dbHelper = {
    getTaskById: (id: string) => tasks.find((t) => t.id === id),
    getUserById: (id: string) => users.find((u) => u.id === id),
    getTeamById: (id: string) => teams.find((t) => t.id === id),
    getEvent: () => event,
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (filterActorType !== "all" && log.actor_type !== filterActorType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const narrative = formatActionNarrative(log.action, log.metadata_json).toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        narrative.includes(q) ||
        log.actor?.name.toLowerCase().includes(q) ||
        log.entity_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" />
            <span>Immutable Security Audit Trail & Compliance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cryptographically structured ledger of all user authorizations, AI tool proposals, approvals, and mutations for {event.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="cyan" className="py-1 px-2.5">
            Total Logged Events: {auditLogs.length}
          </Badge>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search audit actions, targets, actors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Actor Filter:</span>
          <select
            value={filterActorType}
            onChange={(e) => setFilterActorType(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-200 focus:outline-none"
          >
            <option value="all">All Actors</option>
            <option value="user">Human Users</option>
            <option value="ai">AI Copilot</option>
            <option value="system">System Daemon</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Timeline */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <CardTitle className="text-sm">Audit Event Stream</CardTitle>
          <CardDescription>
            Chronological timeline reflecting Section 16 compliance standards.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 divide-y divide-slate-800/60">
          {filteredLogs.map((log) => {
            const isAI = log.actor_type === "ai";
            const isApproval = log.action.includes("APPROVE");
            return (
              <div key={log.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isAI
                          ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/40"
                          : isApproval
                          ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {isAI ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">
                          {log.actor?.name || (isAI ? "ClubOps AI Copilot" : "System")}
                        </span>
                        <Badge
                          variant={isAI ? "ai" : isApproval ? "success" : "secondary"}
                          className="text-[9px] py-0 px-1"
                        >
                          {log.actor_type.toUpperCase()}
                        </Badge>
                        <span className="text-xs font-medium text-slate-200">
                          {formatActionNarrative(log.action, log.metadata_json)}
                        </span>
                      </div>
                      
                      {(() => {
                        const resolved = resolveEntityLabel(log.entity_type, log.entity_id, dbHelper);
                        return (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {resolved.typeLabel}
                            </span>
                            <span className="text-xs text-cyan-300 font-medium">
                              {resolved.name}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[11px] font-mono text-slate-400">
                      {formatDate(log.created_at)} at {formatTime(log.created_at)}
                    </span>
                  </div>
                </div>

                {/* Human-friendly operational payload & optional technical drawer */}
                {log.metadata_json && Object.keys(log.metadata_json).length > 0 && (
                  <div className="ml-10 space-y-1.5">
                    {/* Collapsible Technical Details (Hidden by default for non-developers) */}
                    <details className="text-[10px] text-slate-500 group">
                      <summary className="cursor-pointer hover:text-slate-400 select-none transition-colors">
                        View raw event payload
                      </summary>
                      <div className="mt-1.5 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-slate-400 overflow-x-auto max-h-40">
                        {JSON.stringify(log.metadata_json, null, 2)}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <p className="text-xs text-slate-500 py-8 text-center">
              No audit records match the current filter.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
