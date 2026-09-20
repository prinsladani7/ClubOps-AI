"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  History,
  Download,
  ArrowLeft,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Lock,
  User,
  Clock,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveEntityLabel, formatActionNarrative } from "@/lib/utils/formatters";

export default function AdminHistoryPage() {
  const { auditLogs, users, tasks, teams, event, showToast } = useClubOps();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");

  const dbHelper = {
    getTaskById: (id: string) => tasks.find((t) => t.id === id),
    getUserById: (id: string) => users.find((u) => u.id === id),
    getTeamById: (id: string) => teams.find((t) => t.id === id),
    getEvent: () => event,
  };

  const actions = Array.from(new Set(auditLogs.map((l) => l.action)));

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.actor?.name || log.actor_user_id).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = selectedAction === "all" || log.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  const handleExportCSV = () => {
    const headers = ["Timestamp", "Action", "Actor", "Actor Type", "Entity Type", "Entity ID", "Metadata"];
    const rows = filteredLogs.map((l) => [
      l.created_at,
      l.action,
      l.actor?.name || l.actor_user_id,
      l.actor_type,
      l.entity_type,
      l.entity_id,
      `"${JSON.stringify(l.metadata_json || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clubops_audit_evidence_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Audit evidence CSV exported.");
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Admin Dashboard
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-mono text-indigo-400 font-semibold">History</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Immutable Audit Trail & Compliance Evidence
          </h1>
          <p className="text-xs text-slate-400">
            Append-only chronological log of security events, authentication attempts, role modifications, project changes, and member actions.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="text-xs flex items-center gap-1.5 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Forensic Audit CSV</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, actor, entity ID, or resource..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
          >
            <option value="all">All Actions ({auditLogs.length})</option>
            {actions.map((act) => (
              <option key={act} value={act}>
                {act.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target Subject</th>
                <th className="py-3 px-4">Operational Narrative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-300">No audit records found</p>
                    <p className="text-xs text-slate-500 mt-1">Audit logs will record security events and operational actions chronologically.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                const actorName = log.actor?.name || log.actor_user_id;
                const isAuthEvent = log.action.includes("LOGIN") || log.action.includes("SESSION");
                const isAlertEvent = log.action.includes("FAILED") || log.action.includes("SUSPEND") || log.action.includes("UNAUTHORIZED");
                const resolved = resolveEntityLabel(log.entity_type, log.entity_id, dbHelper);

                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString([], {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={isAlertEvent ? "destructive" : isAuthEvent ? "cyan" : "outline"}
                        className="text-[10px] font-mono uppercase"
                      >
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{actorName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({log.actor_type})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {resolved.typeLabel}
                        </span>
                        <span className="text-xs text-white font-medium max-w-[200px] truncate">
                          {resolved.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300">
                      <span>{formatActionNarrative(log.action, log.metadata_json)}</span>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
