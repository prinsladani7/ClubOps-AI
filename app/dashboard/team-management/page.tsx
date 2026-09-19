"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import {
  Users2,
  Sparkles,
  Plus,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Filter,
  UserPlus,
  Archive,
  Ban,
  Lock,
} from "lucide-react";
import { AITeamBuilderModal } from "@/components/rbac/AITeamBuilderModal";
import { RequestAccessModal } from "@/components/rbac/RequestAccessModal";

export default function TeamManagementPage() {
  const {
    teams,
    roleAssignments,
    permissionRequests,
    currentUser,
    createTeam,
    reviewPermissionRequest,
    revokeRoleAssignment,
    archiveTeam,
    suspendTeam,
    showToast,
  } = useClubOps();

  const [activeTab, setActiveTab] = useState<"teams" | "requests" | "roles">("teams");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended" | "archived">("all");
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Team Form state
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [newTeamOrgId, setNewTeamOrgId] = useState(currentUser.id);

  const filteredTeams = teams.filter((t) => {
    if (statusFilter === "all") return true;
    return t.status === statusFilter;
  });

  const pendingRequests = permissionRequests.filter((r) => r.status === "pending");
  const activeRoleAssignments = roleAssignments.filter((ra) => ra.status === "active");

  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      createTeam({
        name: newTeamName.trim(),
        description: newTeamDesc.trim() || "Operational Event Team",
        organizer_id: newTeamOrgId,
      });
      setNewTeamName("");
      setNewTeamDesc("");
      setIsCreateModalOpen(false);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-1">
            <span>GOVERNANCE & ROSTER</span>
            <span>/</span>
            <span className="text-slate-400">HIERARCHY & RBAC</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users2 className="w-7 h-7 text-indigo-400" />
            <span>Team Management Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Orchestrate scoped teams, appoint acting organizers, manage temporary event roles, and review clearance requests.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Request Clearance</span>
          </button>

          <button
            onClick={() => setIsAIModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-aiGlow hover:from-indigo-500 hover:to-cyan-400 transition-all flex items-center gap-2 group"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200 group-hover:rotate-12 transition-transform" />
            <span>AI Team Builder</span>
          </button>

          {currentUser.role === "admin" && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Charter Team</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Operational Squads</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-white">{teams.length}</span>
            <span className="text-xs text-emerald-400 font-mono">
              {teams.filter((t) => t.status === "active").length} Active
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Acting Organizers</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-violet-300">
              {roleAssignments.filter((ra) => ra.role === "ACTING_ORGANIZER" && ra.status === "active").length}
            </span>
            <span className="text-xs text-violet-400 font-mono">Temporary</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Event Role Grants</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-cyan-300">{activeRoleAssignments.length}</span>
            <span className="text-xs text-cyan-400 font-mono">Active</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Pending Requests</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-amber-300">{pendingRequests.length}</span>
            <span className={`text-xs font-mono ${pendingRequests.length > 0 ? "text-amber-400 animate-pulse" : "text-slate-500"}`}>
              {pendingRequests.length > 0 ? "Review Required" : "All Clear"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("teams")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "teams"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users2 className="w-4 h-4" />
            <span>Teams & Squads ({filteredTeams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "requests"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Permission Requests</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("roles")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "roles"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Temporary Event Roles ({activeRoleAssignments.length})</span>
          </button>
        </div>

        {activeTab === "teams" && (
          <div className="flex items-center gap-1.5 pb-2">
            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {(["all", "active", "suspended", "archived"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all ${
                  statusFilter === filter
                    ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: TEAMS GRID */}
      {activeTab === "teams" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => {
            const actingAssignment = roleAssignments.find(
              (ra) =>
                ra.role === "ACTING_ORGANIZER" &&
                ra.scope_id === team.id &&
                ra.status === "active" &&
                new Date(ra.expires_at).getTime() > Date.now()
            );

            return (
              <div
                key={team.id}
                className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all flex flex-col justify-between shadow-sm hover:shadow-aiGlow"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold border ${
                        team.status === "active"
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : team.status === "suspended"
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {team.status}
                    </span>

                    {/* Acting Organizer Active Badge */}
                    {actingAssignment && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40 font-mono font-semibold flex items-center gap-1 animate-pulse">
                        <Clock className="w-3 h-3" />
                        Acting Org Active
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {team.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {team.description}
                  </p>

                  {/* Primary Organizer */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300">
                        {team.organizer?.name ? team.organizer.name[0] : "O"}
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-slate-400 uppercase">Team Organizer</p>
                        <p className="text-xs font-semibold text-slate-200">
                          {team.organizer?.name || "Unassigned"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center">
                    <div className="bg-slate-950/60 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-mono">Members</span>
                      <span className="text-xs font-bold text-slate-100">{team.member_count || 1}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-mono">Active</span>
                      <span className="text-xs font-bold text-indigo-400">{team.active_tasks_count || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-mono">Blocked</span>
                      <span className={`text-xs font-bold ${team.blocked_tasks_count ? "text-rose-400 animate-pulse" : "text-slate-400"}`}>
                        {team.blocked_tasks_count || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-800/80">
                  <Link
                    href={`/dashboard/team-management/${team.id}`}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group/btn"
                  >
                    <span>Manage Squad Roster</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>

                  {currentUser.role === "admin" && team.status === "active" && (
                    <button
                      onClick={() => archiveTeam(team.id)}
                      className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors text-[11px]"
                      title="Archive Team"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: ACCESS REQUESTS */}
      {activeTab === "requests" && (
        <div className="space-y-3">
          {permissionRequests.length === 0 ? (
            <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/30 text-slate-400 text-xs">
              No permission requests submitted yet.
            </div>
          ) : (
            permissionRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold border ${
                        req.status === "pending"
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse"
                          : req.status === "approved" || req.status === "temporarily_approved"
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {req.status.replace("_", " ")}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {req.permission}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Scope: {req.scope_type.toUpperCase()} ({req.scope_id})
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    <strong className="text-slate-100">{req.requester?.name || "Requester"}</strong>: "{req.reason}"
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Submitted {new Date(req.created_at).toLocaleString()}
                    {req.reviewer && ` • Reviewed by ${req.reviewer.name}`}
                  </p>
                </div>

                {req.status === "pending" && (currentUser.role === "admin" || currentUser.role === "organizer") && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => reviewPermissionRequest(req.id, "temporarily_approve", 24, "Granted 24h temp clearance")}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-600/30 border border-violet-500 text-violet-200 hover:bg-violet-600 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Temp Approve (24h)</span>
                    </button>
                    <button
                      onClick={() => reviewPermissionRequest(req.id, "approve", undefined, "Permanent access approved")}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => reviewPermissionRequest(req.id, "reject", undefined, "Insufficient justification")}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600/20 border border-rose-500 text-rose-300 hover:bg-rose-600 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: ACTIVE TEMPORARY ROLES */}
      {activeTab === "roles" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase">
                <th className="p-3.5">Appointee</th>
                <th className="p-3.5">Role Designation</th>
                <th className="p-3.5">Scope Tier</th>
                <th className="p-3.5">Expires At</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {roleAssignments.map((ra) => {
                const isExpired = new Date(ra.expires_at).getTime() < Date.now();
                return (
                  <tr key={ra.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="p-3.5 font-semibold text-white">
                      {ra.user?.name || ra.user_id}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-semibold text-[10px]">
                        {ra.role}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300 uppercase text-[11px]">
                      {ra.scope_type}: {ra.scope_id}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                      {new Date(ra.expires_at).toLocaleDateString()} {new Date(ra.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold border ${
                          ra.status === "active" && !isExpired
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                        }`}
                      >
                        {isExpired ? "EXPIRED" : ra.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {ra.status === "active" && !isExpired && currentUser.role === "admin" && (
                        <button
                          onClick={() => revokeRoleAssignment(ra.id)}
                          className="px-2.5 py-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-600 transition-colors text-[11px]"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Team Creation Modal (Admin Only) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-base font-bold text-white mb-1">Charter New Team</h3>
            <p className="text-xs text-slate-400 mb-4">Form a new organizational unit within this club.</p>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Team Name</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. VIP Hospitality & Protocols"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Mandate</label>
                <textarea
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="Scope of work, venue areas, and core objectives..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  Confirm & Charter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Team Builder Modal */}
      <AITeamBuilderModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />

      {/* Permission Elevation Request Modal */}
      <RequestAccessModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
}
