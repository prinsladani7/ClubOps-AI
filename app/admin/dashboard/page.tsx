"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Briefcase,
  Users,
  CheckSquare,
  AlertTriangle,
  History,
  Settings,
  Plus,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FolderPlus,
  FileText,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveEntityLabel } from "@/lib/utils/formatters";

export default function AdminDashboardPage() {
  const {
    projects,
    users,
    volunteers,
    tasks,
    teams,
    event,
    risks,
    auditLogs,
    createProject,
    currentUser,
    showToast,
  } = useClubOps();

  const dbHelper = {
    getTaskById: (id: string) => tasks.find((t) => t.id === id),
    getUserById: (id: string) => users.find((u) => u.id === id),
    getTeamById: (id: string) => teams.find((t) => t.id === id),
    getProjectById: (id: string) => projects.find((p) => p.id === id),
    getEvent: () => event,
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjOrganizer, setNewProjOrganizer] = useState("usr-jay");
  const [newProjBudget, setNewProjBudget] = useState(10000);

  const organizers = users.filter((u) => u.role === "organizer");
  const activeTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "done");
  const overdueTasks = activeTasks.filter((t) => new Date(t.due_at).getTime() < Date.now());

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName) return;

    createProject({
      name: newProjName,
      description: newProjDesc,
      organizer_id: newProjOrganizer,
      budget: Number(newProjBudget),
    });

    setIsCreateModalOpen(false);
    setNewProjName("");
    setNewProjDesc("");
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Badge variant="destructive" className="text-xs px-2.5 py-0.5 font-mono">
              ADMIN CLEARANCE
            </Badge>
            <span className="text-xs text-slate-400 font-mono">Executive Command Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Club Operations & Governance Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Full organizational scope authority. Manage projects, organizers, global policies, and immutable audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-aiGlow text-xs font-semibold px-4 py-2 flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Charter New Project</span>
          </Button>

          <Link
            href="/admin/settings"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Access Security & RBAC Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">Active Projects</span>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{projects.length}</span>
            <span className="text-xs text-emerald-400">100% Chartered</span>
          </div>
        </div>

        <Link
          href="/admin/organizers"
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between hover:border-indigo-500/50 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">Lead Organizers</span>
            <Shield className="w-4 h-4 text-rose-400 group-hover:text-rose-300 transition-colors" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono">{organizers.length}</span>
            <span className="text-[11px] text-cyan-300 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform font-medium">
              <span>View Hierarchy</span> &rarr;
            </span>
          </div>
        </Link>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">Active Volunteers</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{volunteers.length}</span>
            <span className="text-xs text-emerald-400 font-mono">
              {volunteers.filter((v) => v.availability === "available").length} Available
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">Tasks Overdue</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">{overdueTasks.length}</span>
            <span className="text-xs text-slate-400">of {activeTasks.length} in flight</span>
          </div>
        </div>
      </div>

      {/* Projects Portfolio Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Organization Projects Portfolio</h2>
            <p className="text-xs text-slate-400">All collegiate initiatives governed by executive administration.</p>
          </div>
          <Link
            href="/admin/projects"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>View Detailed Project Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {projects.length === 0 ? (
            <div className="col-span-full p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">No active projects yet</h3>
                <p className="text-xs text-slate-400">
                  Start fresh by chartering your club's first initiative, or load the Bit N Build sample dataset in Settings to explore pre-filled data.
                </p>
              </div>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Charter First Project
              </Button>
            </div>
          ) : (
            projects.map((proj) => {
              const org = users.find((u) => u.id === proj.organizer_id);
              return (
                <div
                  key={proj.id}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={proj.status === "active" ? "cyan" : "outline"} className="text-[10px] uppercase font-mono">
                        {proj.status}
                      </Badge>
                      <span className="text-xs text-emerald-400 font-mono font-bold">
                        ₹{proj.budget?.toLocaleString() || "0"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {proj.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Lead Organizer:</span>
                      <span className="font-semibold text-slate-200">{org?.name || "Unassigned"}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Deliverable Tasks:</span>
                      <span className="font-mono text-slate-200">
                        {proj.completed_task_count || 0} / {proj.task_count || 0} Done
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/admin/projects#${proj.id}`}
                    className="w-full py-2 rounded-xl text-center text-xs font-semibold bg-slate-800/80 hover:bg-indigo-600 hover:text-white text-slate-300 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Manage Project Scope</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Two Column Section: Recent Audit Log & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Log Preview (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Live Audit & Compliance Trail
              </h2>
            </div>
            <Link
              href="/admin/history"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Full Log ({auditLogs.length}) &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60 space-y-1 overflow-hidden">
            {auditLogs.slice(0, 6).map((log) => {
              const resolved = resolveEntityLabel(log.entity_type, log.entity_id, dbHelper);
              return (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-300 uppercase flex-shrink-0">
                      {log.action.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-slate-300 font-semibold truncate">
                      {log.actor?.name || log.actor_user_id}
                    </span>
                    <span className="text-slate-400 truncate hidden sm:inline text-[11px]">
                      &bull; {resolved.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Admin Navigation Hub (1 Col) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">Admin Operations Hub</h2>
          <p className="text-xs text-slate-400">Direct navigation to administrative consoles:</p>

          <div className="space-y-2 text-xs">
            <Link
              href="/admin/projects"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 text-slate-200 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>Projects Portfolio</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            <Link
              href="/admin/team"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 text-slate-200 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Team & Squad Hierarchy</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            <Link
              href="/admin/organizers"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 text-slate-200 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-rose-400" />
                <span>Organizers Directory</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            <Link
              href="/admin/volunteers"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 text-slate-200 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Volunteers & Workload</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            <Link
              href="/admin/reports"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 text-slate-200 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Progress Milestone Reports</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            <Link
              href="/admin/settings"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 text-slate-200 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-violet-400" />
                <span>Session & Security Controls</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Charter New Project</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="e.g. AI Symposium 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Description & Goals</label>
                <textarea
                  required
                  rows={3}
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Operational purpose, target attendance, scope of work..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Lead Organizer</label>
                  <select
                    value={newProjOrganizer}
                    onChange={(e) => setNewProjOrganizer(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {organizers.length === 0 && (
                      <option value={currentUser.id}>
                        {currentUser.name} (Admin / Self)
                      </option>
                    )}
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
                    value={newProjBudget}
                    onChange={(e) => setNewProjBudget(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-bold hover:from-rose-500 hover:to-indigo-500 shadow-aiGlow"
                >
                  Confirm Charter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
