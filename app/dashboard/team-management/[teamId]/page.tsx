"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import {
  Users2,
  ChevronLeft,
  ShieldCheck,
  Clock,
  UserPlus,
  ArrowRightLeft,
  UserMinus,
  CheckSquare,
  AlertTriangle,
  History,
  Archive,
  Ban,
  Sparkles,
} from "lucide-react";
import { AssignActingOrganizerModal } from "@/components/rbac/AssignActingOrganizerModal";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.teamId as string;

  const {
    teams,
    tasks,
    volunteers,
    roleAssignments,
    auditLogs,
    currentUser,
    addTeamMember,
    removeTeamMember,
    transferTeamMember,
    archiveTeam,
    suspendTeam,
    showToast,
  } = useClubOps();

  const [activeTab, setActiveTab] = useState<"members" | "tasks" | "audit">("members");
  const [isActingOrgModalOpen, setIsActingOrgModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [transferMemberId, setTransferMemberId] = useState<string | null>(null);
  const [targetTeamId, setTargetTeamId] = useState<string>("");

  const team = teams.find((t) => t.id === teamId);

  if (!team) {
    return (
      <div className="p-12 text-center space-y-3">
        <h2 className="text-lg font-bold text-white">Team Not Found</h2>
        <p className="text-xs text-slate-400">The requested team does not exist or has been removed.</p>
        <Link
          href="/dashboard/team-management"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-indigo-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Teams</span>
        </Link>
      </div>
    );
  }

  // Active Acting Organizer check
  const activeActingOrganizer = roleAssignments.find(
    (ra) =>
      ra.role === "ACTING_ORGANIZER" &&
      ra.scope_id === team.id &&
      ra.status === "active" &&
      new Date(ra.expires_at).getTime() > Date.now()
  );

  // Scoped tasks
  const teamTasks = tasks.filter(
    (tk) => tk.team_id === team.id || (team.members && team.members.some((m) => m.user_id === tk.owner_id))
  );

  // Scoped audit logs
  const teamLogs = auditLogs.filter(
    (l) =>
      l.entity_id === team.id ||
      l.metadata_json?.teamId === team.id ||
      l.metadata_json?.team_id === team.id
  );

  // Volunteers available to add
  const existingMemberIds = new Set(team.members?.map((m) => m.user_id) || []);
  const availableVolunteers = volunteers.filter((v) => !existingMemberIds.has(v.user_id));

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberUserId) return;

    try {
      addTeamMember(team.id, newMemberUserId, "volunteer");
      setNewMemberUserId("");
      setIsAddMemberOpen(false);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleTransferSubmit = (teamMemberId: string) => {
    if (!targetTeamId) return;
    try {
      transferTeamMember(teamMemberId, targetTeamId);
      setTransferMemberId(null);
      setTargetTeamId("");
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleRemoveMember = (teamMemberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the squad?")) return;
    try {
      removeTeamMember(teamMemberId);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const isOrganizerOrAdmin =
    currentUser.role === "admin" ||
    currentUser.id === team.organizer_id ||
    (activeActingOrganizer && activeActingOrganizer.user_id === currentUser.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumbs & Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/team-management"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>All Squads</span>
        </Link>

        {currentUser.role === "admin" && (
          <div className="flex items-center gap-2">
            {team.status === "active" && (
              <>
                <button
                  onClick={() => suspendTeam(team.id)}
                  className="px-3 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Ban className="w-3 h-3" />
                  <span>Suspend</span>
                </button>
                <button
                  onClick={() => archiveTeam(team.id)}
                  className="px-3 py-1 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Archive className="w-3 h-3" />
                  <span>Archive</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Acting Organizer Glowing Banner */}
      {activeActingOrganizer && (
        <div className="p-4 rounded-2xl border border-violet-500/40 bg-violet-950/40 shadow-aiGlow flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 flex items-center justify-center font-bold text-base animate-pulse">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Acting Organizer Active: {activeActingOrganizer.user?.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/30 text-violet-200 border border-violet-400/40 font-mono font-bold">
                  DELEGATED CLEARANCE
                </span>
              </div>
              <p className="text-xs text-violet-300/80 mt-0.5">
                Full squad managerial clearance granted until{" "}
                <span className="font-mono text-white">
                  {new Date(activeActingOrganizer.expires_at).toLocaleString()}
                </span>
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-violet-300 flex items-center gap-1 bg-violet-900/60 px-3 py-1 rounded-xl border border-violet-500/30">
            <Clock className="w-3.5 h-3.5" />
            Auto-Expiring
          </span>
        </div>
      )}

      {/* Team Header Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold border ${
                  team.status === "active"
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                }`}
              >
                {team.status}
              </span>
              <span className="text-xs font-mono text-slate-500">ID: {team.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{team.name}</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {team.description}
            </p>
          </div>

          {/* Quick Actions */}
          {isOrganizerOrAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsActingOrgModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-violet-600/30 border border-violet-500/50 text-violet-200 hover:bg-violet-600 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Appoint Acting Organizer</span>
              </button>

              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Contributor</span>
              </button>
            </div>
          )}
        </div>

        {/* Lead Organizer Info Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-sm text-indigo-300">
              {team.organizer?.name ? team.organizer.name[0] : "O"}
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-400 uppercase">Primary Lead Organizer</p>
              <p className="text-xs font-bold text-white">{team.organizer?.name || "Unassigned"}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div>
              <span className="text-white font-bold">{team.members?.length || 1}</span> Contributors
            </div>
            <div>
              <span className="text-indigo-400 font-bold">{teamTasks.filter((t) => t.status !== "done").length}</span> Active Deliverables
            </div>
            <div>
              <span className="text-rose-400 font-bold">{teamTasks.filter((t) => t.status === "blocked").length}</span> Blockers
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "members"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>Squad Roster ({team.members?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("tasks")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "tasks"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Assigned Deliverables ({teamTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "audit"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Squad Audit History ({teamLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: SQUAD ROSTER */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase">
                  <th className="p-3.5">Contributor</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Skills & Competencies</th>
                  <th className="p-3.5">Workload Capacity</th>
                  <th className="p-3.5">Joined At</th>
                  {isOrganizerOrAdmin && <th className="p-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {team.members?.map((member) => {
                  const vol = volunteers.find((v) => v.user_id === member.user_id);
                  const isOrg = member.role === "organizer";

                  return (
                    <tr key={member.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300">
                            {member.user?.name ? member.user.name[0] : "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{member.user?.name || "Member"}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{member.user?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold border ${
                            member.role === "organizer"
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : member.role === "acting_organizer"
                              ? "bg-violet-500/20 text-violet-300 border-violet-500/40 animate-pulse"
                              : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                          }`}
                        >
                          {member.role.replace("_", " ")}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {vol?.skills?.map((sk, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 font-mono"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                (vol?.workloadScore || 30) > 75
                                  ? "bg-rose-500"
                                  : (vol?.workloadScore || 30) > 50
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${vol?.workloadScore || 30}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-slate-300">
                            {vol?.workloadScore || 30}%
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                        {new Date(member.joined_at).toLocaleDateString()}
                      </td>

                      {isOrganizerOrAdmin && (
                        <td className="p-3.5 text-right">
                          {!isOrg && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setTransferMemberId(member.id)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1"
                                title="Transfer to another squad"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>Transfer</span>
                              </button>
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-1 rounded text-rose-400 hover:text-white hover:bg-rose-600 transition-colors"
                                title="Remove from squad"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNED TASKS */}
      {activeTab === "tasks" && (
        <div className="space-y-3">
          {teamTasks.length === 0 ? (
            <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/30 text-slate-400 text-xs">
              No tasks currently assigned to this squad.
            </div>
          ) : (
            teamTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold border ${
                        task.status === "blocked"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse"
                          : task.status === "done"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                      }`}
                    >
                      {task.status}
                    </span>
                    <h4 className="text-xs font-bold text-white">{task.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{task.description}</p>
                  <p className="text-[10px] font-mono text-slate-500">
                    Owner: <span className="text-slate-300">{task.owner?.name || "Unassigned"}</span> • Priority:{" "}
                    <span className="uppercase text-indigo-400">{task.priority}</span> • Due:{" "}
                    {new Date(task.due_at).toLocaleDateString()}
                  </p>
                </div>

                <Link
                  href="/tasks"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <span>View in Tasks</span>
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: AUDIT HISTORY */}
      {activeTab === "audit" && (
        <div className="space-y-2">
          {teamLogs.length === 0 ? (
            <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/30 text-slate-400 text-xs">
              No audit entries recorded for this squad.
            </div>
          ) : (
            teamLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] text-indigo-400 uppercase font-semibold">
                    {log.action}
                  </span>
                  <span className="text-slate-300 font-medium">{log.actor?.name || log.actor_user_id}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-base font-bold text-white mb-1">Add Contributor to {team.name}</h3>
            <p className="text-xs text-slate-400 mb-4">Select an available volunteer to allocate.</p>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Available Volunteers</label>
                <select
                  value={newMemberUserId}
                  onChange={(e) => setNewMemberUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose volunteer --</option>
                  {availableVolunteers.map((vol) => (
                    <option key={vol.id} value={vol.user_id}>
                      {vol.user?.name} ({vol.skills.slice(0, 2).join(", ")}) — {vol.workloadScore}% Load
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newMemberUserId}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
                >
                  Allocate Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Member Modal */}
      {transferMemberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-base font-bold text-white mb-1">Transfer Contributor</h3>
            <p className="text-xs text-slate-400 mb-4">Choose target operational squad.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Squad</label>
                <select
                  value={targetTeamId}
                  onChange={(e) => setTargetTeamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select destination squad --</option>
                  {teams
                    .filter((t) => t.id !== team.id && t.status === "active")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Org: {t.organizer?.name})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTransferMemberId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleTransferSubmit(transferMemberId)}
                  disabled={!targetTeamId}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
                >
                  Complete Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acting Organizer Appointment Modal */}
      <AssignActingOrganizerModal
        isOpen={isActingOrgModalOpen}
        onClose={() => setIsActingOrgModalOpen(false)}
        teamId={team.id}
      />
    </div>
  );
}
