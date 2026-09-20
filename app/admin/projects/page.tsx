"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  Archive,
  Edit,
  Trash2,
  Users,
  CheckSquare,
  Sparkles,
  ArrowLeft,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminProjectsPage() {
  const {
    projects,
    users,
    createProject,
    updateProject,
    archiveProject,
    addProjectMember,
    removeProjectMember,
    breakdownProject,
    showToast,
  } = useClubOps();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [organizerId, setOrganizerId] = useState("usr-jay");
  const [budget, setBudget] = useState(12000);
  const [startDate, setStartDate] = useState("2026-10-01");
  const [endDate, setEndDate] = useState("2026-10-28");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const organizers = users.filter((u) => u.role === "organizer");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    createProject({
      name,
      description,
      organizer_id: organizerId,
      budget: Number(budget),
      start_date: startDate,
      end_date: endDate,
    });

    setIsCreateOpen(false);
    setName("");
    setDescription("");
  };

  const handleArchive = (id: string) => {
    if (confirm("Are you sure you want to archive this project?")) {
      archiveProject(id);
    }
  };

  const handleAIBreakdown = (projName: string, projId: string) => {
    const res = breakdownProject({ goal: projName, project_id: projId });
    showToast(`AI generated ${res.suggested_tasks.length} recommended breakdown tasks.`);
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
            <span className="text-xs font-mono text-indigo-400 font-semibold">Projects</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Project Scope & Charter Governance
          </h1>
          <p className="text-xs text-slate-400">
            Define organizational projects, allocate fiscal budgets, and appoint lead organizers.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-aiGlow"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Projects Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-slate-400 font-bold">Active Projects Portfolio</span>
          <span className="text-xs text-slate-500 font-mono">Count: {projects.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-4">Project Title</th>
                <th className="p-4">Lead Organizer</th>
                <th className="p-4">Budget</th>
                <th className="p-4">Dates</th>
                <th className="p-4">Tasks</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-300">No projects defined yet</p>
                    <p className="text-xs text-slate-500 mt-1">Create your first project charter to organize operations.</p>
                  </td>
                </tr>
              ) : (
                projects.map((proj) => {
                const org = users.find((u) => u.id === proj.organizer_id);
                return (
                  <tr key={proj.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-semibold text-white">
                      <div>
                        <span>{proj.name}</span>
                        <p className="text-[11px] text-slate-400 font-normal line-clamp-1">{proj.description}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] text-indigo-300">
                          {org?.name.charAt(0) || "O"}
                        </div>
                        <span className="font-medium text-slate-200">{org?.name || "Unassigned"}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      ₹{proj.budget?.toLocaleString() || "0"}
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-400">
                      {proj.start_date || "—"} to {proj.end_date || "—"}
                    </td>
                    <td className="p-4 font-mono">
                      <span className="text-emerald-400">{proj.completed_task_count || 0}</span> /{" "}
                      <span>{proj.task_count || 0}</span>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={proj.status === "active" ? "cyan" : "outline"}
                        className="uppercase text-[10px] font-mono"
                      >
                        {proj.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAIBreakdown(proj.name, proj.id)}
                          className="px-2.5 py-1 rounded bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          title="Generate AI Task Breakdown"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>AI Breakdown</span>
                        </button>

                        <button
                          onClick={() => handleArchive(proj.id)}
                          disabled={proj.status === "archived"}
                          className="p-1.5 rounded hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors disabled:opacity-30"
                          title="Archive Project"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Create New Project</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Annual Winter Hackathon"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Operational scope, target outcomes..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Lead Organizer</label>
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

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Budget (₹)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-aiGlow"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
