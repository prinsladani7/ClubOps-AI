"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users2,
  Plus,
  ArrowLeft,
  Shield,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminTeamPage() {
  const {
    teams,
    users,
    roleAssignments,
    createTeam,
    assignActingOrganizer,
    showToast,
  } = useClubOps();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [organizerId, setOrganizerId] = useState("usr-jay");

  const organizers = users.filter((u) => u.role === "organizer");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName) return;

    createTeam({
      name: teamName,
      description: teamDesc,
      organizer_id: organizerId,
    });

    setIsCreateOpen(false);
    setTeamName("");
    setTeamDesc("");
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Admin Dashboard
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-mono text-indigo-400 font-semibold">Team Management</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Organizational Team & Squad Hierarchy
          </h1>
          <p className="text-xs text-slate-400">
            Structure club operations into functional squads, assign organizers, and manage temporary delegations.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-aiGlow"
        >
          <Plus className="w-4 h-4" />
          <span>Create Squad</span>
        </Button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-slate-400 space-y-3">
            <Users2 className="w-10 h-10 mx-auto text-slate-600" />
            <h3 className="text-base font-bold text-white">No Squads Formed Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create functional squads to delegate roles and organize club operations.
            </p>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 mt-2 shadow-aiGlow"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Create First Squad</span>
            </Button>
          </div>
        ) : (
          teams.map((team) => {
          const org = users.find((u) => u.id === team.organizer_id);
          return (
            <div
              key={team.id}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="cyan" className="uppercase text-[10px] font-mono">
                    {team.status}
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">
                    {team.member_count || 0} Members
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{team.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{team.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Squad Lead:</span>
                  <span className="font-semibold text-slate-200">{org?.name || "Unassigned"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Tasks:</span>
                  <span className="font-mono text-slate-200">{team.active_tasks_count || 0}</span>
                </div>
              </div>

              <Link
                href={`/dashboard/team-management/${team.id}`}
                className="w-full py-2 rounded-xl text-center text-xs font-semibold bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 transition-all"
              >
                Inspect Squad Roster
              </Link>
            </div>
          );
        })
        )}
      </div>

      {/* Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Form New Team</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Team Name</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Media & PR Squad"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Description</label>
                <textarea
                  required
                  rows={3}
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  placeholder="Responsibilities, scope..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Appointed Lead Organizer</label>
                <select
                  value={organizerId}
                  onChange={(e) => setOrganizerId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {organizers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Confirm Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
