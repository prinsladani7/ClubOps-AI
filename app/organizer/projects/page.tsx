"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Users,
  CheckSquare,
  ArrowLeft,
  Plus,
  Calendar,
  UserPlus,
  IndianRupee,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function OrganizerProjectsPage() {
  const { currentUser, projects, tasks, volunteers, addProjectMember, showToast } = useClubOps();

  const myProjects = projects.filter(
    (p) => p.organizer_id === currentUser.id || (p.organizers && p.organizers.includes(currentUser.id))
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string>(myProjects[0]?.id || "");
  const [isAddVolunteerModalOpen, setIsAddVolunteerModalOpen] = useState(false);
  const [selectedVolunteerUserId, setSelectedVolunteerUserId] = useState("");

  const currentProject = projects.find((p) => p.id === selectedProjectId) || myProjects[0];
  const projectTasks = tasks.filter((t) => t.project_id === currentProject?.id);
  const completedTasks = projectTasks.filter((t) => t.status === "completed" || t.status === "done").length;
  const progressPercent = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;

  const handleAddVolunteerToProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !selectedVolunteerUserId) return;

    addProjectMember(currentProject.id, selectedVolunteerUserId, "volunteer");
    setIsAddVolunteerModalOpen(false);
    setSelectedVolunteerUserId("");
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
            <span className="text-xs font-mono text-cyan-400 font-semibold">Projects</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Assigned Workstream Projects
          </h1>
          <p className="text-xs text-slate-400">
            Lead projects authorized under your operational charter. Manage deliverables and squad membership.
          </p>
        </div>

        {currentProject && (
          <Button
            onClick={() => setIsAddVolunteerModalOpen(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-md"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Enroll Volunteer to Project</span>
          </Button>
        )}
      </div>

      {/* Project Selector Tabs if multiple */}
      {myProjects.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {myProjects.map((proj) => (
            <button
              key={proj.id}
              onClick={() => setSelectedProjectId(proj.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                proj.id === currentProject?.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              {proj.name}
            </button>
          ))}
        </div>
      )}

      {currentProject ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Project Overview (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between">
                <Badge variant="cyan" className="text-xs font-mono uppercase">
                  {currentProject.status}
                </Badge>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  ₹{currentProject.budget?.toLocaleString() || "0"} Allocated Budget
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{currentProject.name}</h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{currentProject.description}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-3 border-t border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Overall Deliverable Completion:</span>
                  <span className="font-mono text-white font-bold">{progressPercent}% ({completedTasks}/{projectTasks.length} Done)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Date Metadata */}
              <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-slate-400 font-mono">
                <div>
                  <span className="text-slate-500">Charter Date:</span>{" "}
                  <span className="text-slate-300">{new Date(currentProject.created_at).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-500">Target Deadline:</span>{" "}
                  <span className="text-slate-300">{currentProject.end_date || "2026-10-28"}</span>
                </div>
              </div>
            </div>

            {/* Task Deliverables List */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white tracking-tight">Project Tasks & Deliverables</h3>
                <Link
                  href={`/organizer/tasks?projectId=${currentProject.id}`}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  Manage All Tasks ({projectTasks.length}) &rarr;
                </Link>
              </div>

              <div className="space-y-2">
                {projectTasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-white">{task.title}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Assignee: {task.owner?.name || "Unassigned"} • Due: {new Date(task.due_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={task.status === "completed" ? "cyan" : "outline"} className="text-[10px] font-mono capitalize">
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Assigned Squad Members (1 Col) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white tracking-tight">Squad Roster</h3>
                <button
                  onClick={() => setIsAddVolunteerModalOpen(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enroll</span>
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {volunteers.slice(0, 8).map((v) => {
                  const u = v.user;
                  return (
                    <div
                      key={v.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-cyan-300">
                          {(u?.name || "V")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{u?.name || "Volunteer"}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{v.skills[0] || "Generalist"}</p>
                        </div>
                      </div>

                      <Badge variant="outline" className="text-[9px] uppercase font-mono">
                        {v.availability}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <Link
                href="/organizer/reports"
                className="w-full py-2.5 rounded-xl text-center text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors block"
              >
                Submit Milestone Progress Report
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400 space-y-3">
          <FolderKanban className="w-10 h-10 mx-auto text-slate-600" />
          <p>No projects currently assigned to this organizer account.</p>
        </div>
      )}

      {/* Enroll Volunteer Modal */}
      {isAddVolunteerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Enroll Volunteer to Squad</h3>
              <button
                onClick={() => setIsAddVolunteerModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleAddVolunteerToProject} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Select Volunteer:</label>
                <select
                  value={selectedVolunteerUserId}
                  onChange={(e) => setSelectedVolunteerUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  required
                >
                  <option value="">-- Choose Volunteer --</option>
                  {volunteers.map((v) => (
                    <option key={v.user_id} value={v.user_id}>
                      {v.user?.name || v.user_id} ({v.availability}, skills: {v.skills.join(", ")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button variant="outline" type="button" onClick={() => setIsAddVolunteerModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
                  Add to Project Scope
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
