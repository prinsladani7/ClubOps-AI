"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  ArrowLeft,
  Mail,
  UserPlus,
  Briefcase,
  CheckSquare,
  Sparkles,
  Calendar,
  Activity,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function OrganizerVolunteersPage() {
  const { currentUser, projects, volunteers, users, tasks, addProjectMember, showToast } = useClubOps();

  const myProjects = projects.filter(
    (p) => p.organizer_id === currentUser.id || (p.organizers && p.organizers.includes(currentUser.id))
  );
  const myProjectIds = new Set(myProjects.map((p) => p.id));

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [targetProjectId, setTargetProjectId] = useState(myProjects[0]?.id || "");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    showToast(`Volunteer invitation dispatched to ${inviteEmail} for ${myProjects.find((p) => p.id === targetProjectId)?.name || "project"}.`);
    setIsInviteOpen(false);
    setInviteEmail("");
  };

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
            <span className="text-xs font-mono text-cyan-400 font-semibold">Volunteers</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Squad Volunteers & Capacity Management
          </h1>
          <p className="text-xs text-slate-400">
            View volunteer roster, verify skills and workloads within your authorized project scopes.
          </p>
        </div>

        <Button
          onClick={() => setIsInviteOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-md"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Volunteer to Scope</span>
        </Button>
      </div>

      {/* Grid of Volunteers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {volunteers.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-700/60 rounded-2xl text-center gap-4">
            <Users className="w-12 h-12 text-slate-600" />
            <div>
              <p className="text-slate-300 font-semibold text-sm">No volunteers in the system yet</p>
              <p className="text-slate-500 text-xs mt-1">Admin can onboard volunteers from the Admin Volunteers page.</p>
            </div>
            <Link
              href="/admin/volunteers"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Go to Volunteer Roster
            </Link>
          </div>
        ) : volunteers.map((vol) => {
          const user = users.find((u) => u.id === vol.user_id);
          const userTasks = tasks.filter((t) => t.owner_id === vol.user_id && t.project_id && myProjectIds.has(t.project_id));
          const isOverloaded = vol.availability === "overloaded" || (vol.workloadScore || 0) > 75;

          return (
            <div
              key={vol.id}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-cyan-300">
                    {(user?.name || "V")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{user?.name || "Volunteer"}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{user?.email}</p>
                  </div>
                </div>

                <Badge
                  variant={
                    vol.availability === "available"
                      ? "cyan"
                      : vol.availability === "busy"
                      ? "warning"
                      : vol.availability === "overloaded"
                      ? "destructive"
                      : "outline"
                  }
                  className="text-[10px] font-mono uppercase"
                >
                  {vol.availability}
                </Badge>
              </div>

              {/* Workload */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Workload:</span>
                  <span className={`font-mono font-bold text-xs ${isOverloaded ? "text-rose-400" : "text-emerald-400"}`}>
                    {vol.workloadScore || 20}% ({userTasks.length} tasks in scope)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isOverloaded ? "bg-rose-500" : "bg-cyan-500"
                    }`}
                    style={{ width: `${Math.min(100, vol.workloadScore || 20)}%` }}
                  />
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Skills:</span>
                <div className="flex flex-wrap gap-1">
                  {vol.skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <Link
                  href={`/organizer/tasks?assignee=${vol.user_id}`}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  <span>Assign Work</span>
                  <CheckSquare className="w-3.5 h-3.5" />
                </Link>
                <span className="text-[11px] text-slate-500 font-mono">
                  {vol.total_hours_logged || 14} hrs logged
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Invite Volunteer to Scope</h3>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Volunteer Campus Email:</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="volunteer@syntaxsquad.edu"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Target Workstream Project:</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  {myProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button variant="outline" type="button" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
                  Send Scope Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
