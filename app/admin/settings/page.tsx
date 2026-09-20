"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Settings,
  Shield,
  KeyRound,
  AlertOctagon,
  ArrowLeft,
  Lock,
  RefreshCw,
  Sliders,
  Bell,
  CheckCircle2,
  AlertTriangle,
  UserX,
  Snowflake,
  Database,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const {
    users,
    projects,
    tasks,
    teams,
    volunteers,
    judgingTeams,
    mentorTickets,
    sponsors,
    sessions,
    revokeSession,
    revokeAllSessions,
    suspendUser,
    activateUser,
    freezeProjectChanges,
    resetToCleanSlate,
    loadDemoData,
    showToast,
  } = useClubOps();

  const [selectedUserToSuspend, setSelectedUserToSuspend] = useState("usr-rahul");
  const [suspendReason, setSuspendReason] = useState("Security policy violation");
  const [selectedProjectToFreeze, setSelectedProjectToFreeze] = useState(projects[0]?.id || "");

  // Notification toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [taskEscalationPush, setTaskEscalationPush] = useState(true);
  const [auditStreaming, setAuditStreaming] = useState(true);
  const [mfaEnforced, setMfaEnforced] = useState(false);

  const handleRevokeAll = () => {
    if (confirm("Are you sure you want to revoke all active sessions across the organization? All users will be logged out.")) {
      revokeAllSessions();
    }
  };

  const handleSuspendUser = () => {
    suspendUser(selectedUserToSuspend, suspendReason);
  };

  const handleRestoreUser = (userId: string) => {
    activateUser(userId);
  };

  const handleFreezeProject = () => {
    if (selectedProjectToFreeze) {
      freezeProjectChanges(selectedProjectToFreeze);
    }
  };

  const activeSessions = sessions.filter((s) => !s.revoked);

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
            <span className="text-xs font-mono text-indigo-400 font-semibold">Settings</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            System Controls & Emergency Protocols
          </h1>
          <p className="text-xs text-slate-400">
            Administrative role permissions, session revocation, security enforcement, and emergency safeguards.
          </p>
        </div>

        <Badge variant="destructive" className="text-xs font-mono py-1 px-3">
          Executive Authority Mode
        </Badge>
      </div>

      {/* Emergency Controls Section (Specification Section 5) */}
      <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/20 via-slate-900/80 to-slate-900/80 p-6 space-y-5 shadow-xl">
        <div className="flex items-center gap-2.5 text-rose-400">
          <AlertOctagon className="w-6 h-6" />
          <h2 className="text-lg font-bold tracking-tight text-white">
            Emergency Command & Incident Response Controls
          </h2>
        </div>
        <p className="text-xs text-slate-300">
          Execute immediate containment actions during suspected credential compromise, unauthorized operations, or audit investigations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Action 1: Revoke All Sessions */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Global Session Revocation</span>
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Immediately terminate all active bearer tokens and invalidate browser sessions across the organization.
              </p>
            </div>
            <Button
              onClick={handleRevokeAll}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold w-full"
            >
              Revoke All Active Sessions
            </Button>
          </div>

          {/* Action 2: Suspend Account */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-rose-400" />
                <span>Immediate Account Suspension</span>
              </span>
              <select
                value={selectedUserToSuspend}
                onChange={(e) => setSelectedUserToSuspend(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role}, {u.status || "active"})
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Reason for suspension"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
            <Button
              onClick={handleSuspendUser}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold w-full"
            >
              Suspend Selected Account
            </Button>
          </div>

          {/* Action 3: Freeze Project Changes */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                <span>Emergency Project Freeze</span>
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Halt all task creation, status mutations, and budget updates on the selected project scope.
              </p>
              <select
                value={selectedProjectToFreeze}
                onChange={(e) => setSelectedProjectToFreeze(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.status})
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleFreezeProject}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold w-full"
            >
              Freeze Project Scope
            </Button>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Security Configurations & Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security & Organization Policy */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Security & RBAC Enforcement Policy</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div>
                <p className="font-semibold text-white">Strict Role Matching at Login</p>
                <p className="text-slate-400 text-[11px]">Enforce role selection matches authenticated account</p>
              </div>
              <Badge variant="cyan">MANDATORY</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div>
                <p className="font-semibold text-white">Rate Limit & Cooldown Lock</p>
                <p className="text-slate-400 text-[11px]">15-minute lockout after 5 consecutive failed attempts</p>
              </div>
              <Badge variant="cyan">ACTIVE</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div>
                <p className="font-semibold text-white">Append-Only Audit Trails</p>
                <p className="text-slate-400 text-[11px]">Every state mutation generates an immutable forensic event</p>
              </div>
              <Badge variant="cyan">ACTIVE</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div>
                <p className="font-semibold text-white">Two-Factor OTP Verification</p>
                <p className="text-slate-400 text-[11px]">Require OTP for high-privilege project budget changes</p>
              </div>
              <button
                onClick={() => setMfaEnforced(!mfaEnforced)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                  mfaEnforced ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-800 text-slate-400"
                }`}
              >
                {mfaEnforced ? "ENABLED" : "OPTIONAL"}
              </button>
            </div>
          </div>
        </div>

        {/* Live Active Sessions Monitoring */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Live Active Sessions</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">
              {activeSessions.length} Active Token(s)
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {activeSessions.map((sess) => {
              const u = users.find((user) => user.id === sess.user_id);
              return (
                <div
                  key={sess.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{u?.name || sess.user_id}</span>
                      <Badge variant="outline" className="text-[9px] uppercase font-mono">
                        {u?.role}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      IP: {sess.ip_address || "127.0.0.1"} • Expires: {new Date(sess.expires_at).toLocaleDateString()}
                    </p>
                  </div>

                  <Button
                    onClick={() => revokeSession(sess.id)}
                    variant="outline"
                    className="text-[10px] text-rose-300 border-rose-500/30 hover:bg-rose-500/20 px-2 py-1 h-auto"
                  >
                    Revoke
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Database & Data Management Controls */}
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/20 via-slate-900/90 to-slate-900/90 p-6 space-y-5 shadow-xl md:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Database & Dataset State Management</h3>
                <p className="text-xs text-slate-400">
                  Switch between a clean slate zero-data production instance or pre-populate the Bit N Build Hackathon 2026 evaluation dataset.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  if (confirm("Reset website to clean slate? All projects, tasks, teams, volunteers, expo projects, tickets, and sponsors will be cleared to zero.")) {
                    resetToCleanSlate();
                  }
                }}
                variant="outline"
                className="text-xs border-rose-500/40 text-rose-300 hover:bg-rose-500/20 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Reset to Zero Data
              </Button>

              <Button
                onClick={() => {
                  loadDemoData();
                }}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                <Sparkles className="w-3.5 h-3.5" /> Load Sample Dataset
              </Button>
            </div>
          </div>

          {/* Real-time Entity Counter */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-lg font-mono font-bold text-white">{projects.length}</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Projects</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-lg font-mono font-bold text-indigo-400">{tasks.length}</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Tasks</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-lg font-mono font-bold text-cyan-400">{teams.length}</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Teams</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-lg font-mono font-bold text-emerald-400">{volunteers.length}</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Volunteers</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-lg font-mono font-bold text-amber-400">{judgingTeams.length}</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Expo Teams</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-lg font-mono font-bold text-violet-400">{mentorTickets.length}</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">HelpQ Tickets</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-lg font-mono font-bold text-pink-400">{sponsors.length}</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Sponsors</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
