"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  History,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  Calendar,
  Clock,
  Search,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { resolveEntityLabel, formatActionNarrative } from "@/lib/utils/formatters";

export default function VolunteerHistoryPage() {
  const { currentUser, tasks, auditLogs, users, teams, event } = useClubOps();
  const [search, setSearch] = useState("");

  const dbHelper = {
    getTaskById: (id: string) => tasks.find((t) => t.id === id),
    getUserById: (id: string) => users.find((u) => u.id === id),
    getTeamById: (id: string) => teams.find((t) => t.id === id),
    getEvent: () => event,
  };

  const completedTasks = tasks.filter(
    (t) => t.owner_id === currentUser.id && (t.status === "completed" || t.status === "done")
  );

  const ownAuditLogs = auditLogs.filter(
    (l) => l.actor_user_id === currentUser.id || l.entity_id === currentUser.id
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/volunteer/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Volunteer Dashboard
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-mono text-cyan-400 font-semibold">History</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Task Completion & Deliverables Proof History
          </h1>
          <p className="text-xs text-slate-400">
            Verified proof-of-work records, deliverable links, and personal audit events.
          </p>
        </div>

        <Badge variant="cyan" className="text-xs font-mono py-1 px-3">
          {completedTasks.length} Completed Deliverables
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completed Tasks & Proofs (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">Verified Deliverables & Evidence</h2>

          <div className="space-y-3">
            {completedTasks.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400">
                <p className="text-xs">No completed tasks yet. Finish assigned tasks and submit evidence for sign-off.</p>
              </div>
            ) : (
              completedTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-bold text-white text-sm">{t.title}</h3>
                    </div>
                    <Badge variant="cyan" className="text-[10px] font-mono uppercase">
                      VERIFIED
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-300">{t.description}</p>

                  {t.evidence && t.evidence.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Proof Record:</span>
                      {t.evidence.map((ev, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <a
                            href={ev.evidence_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                          >
                            <span>{ev.evidence_url}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(ev.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Personal Activity Timeline (1 Col) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <History className="w-5 h-5" />
            <h2 className="text-base text-white">Your Activity Log</h2>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {ownAuditLogs.map((log) => {
              const resolved = resolveEntityLabel(log.entity_type, log.entity_id, dbHelper);
              return (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[9px] font-mono uppercase border-slate-700">
                      {log.action.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase font-mono px-1 rounded bg-slate-800 text-slate-400">
                      {resolved.typeLabel}
                    </span>
                    <span className="text-xs text-white font-medium truncate">
                      {resolved.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {formatActionNarrative(log.action, log.metadata_json)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
