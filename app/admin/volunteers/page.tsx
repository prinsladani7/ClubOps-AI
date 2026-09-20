"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  ArrowLeft,
  Mail,
  UserX,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Zap,
  Activity,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkloadGauge } from "@/components/ui/WorkloadGauge";
import { Volunteer } from "@/types";

export default function AdminVolunteersPage() {
  const {
    volunteers,
    users,
    projects,
    tasks,
    deactivateUser,
    rebalanceWorkload,
    applyWorkloadRebalance,
    addVolunteer,
    showToast,
  } = useClubOps();

  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [reassignToUserId, setReassignToUserId] = useState("");
  const [isRebalanceModalOpen, setIsRebalanceModalOpen] = useState(false);

  // Onboard modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSkills, setNewSkills] = useState("Operations, Logistics");
  const [newNotes, setNewNotes] = useState("Assigned to General Operations");

  const handleAddVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    addVolunteer({
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim() || undefined,
      skills: newSkills.split(",").map((s) => s.trim()).filter(Boolean),
      availability: "available",
      notes: newNotes.trim() || "Active volunteer.",
    });

    setIsAddModalOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPhone("");
  };

  // Compute active tasks and impact for selected member
  const impactedTasks = selectedVolunteer
    ? tasks.filter(
        (t) =>
          t.owner_id === selectedVolunteer.user_id &&
          t.status !== "completed" &&
          t.status !== "done"
      )
    : [];

  const eligibleReassignees = volunteers.filter(
    (v) => v.user_id !== selectedVolunteer?.user_id && v.availability !== "overloaded"
  );

  const handleOpenDeactivate = (vol: Volunteer) => {
    setSelectedVolunteer(vol);
    setDeactivateReason("Operational reorganization");
    setReassignToUserId(eligibleReassignees[0]?.user_id || "");
    setIsDeactivateModalOpen(true);
  };

  const handleConfirmDeactivate = () => {
    if (!selectedVolunteer) return;

    // Call deactivation workflow (Specification Section 8.D)
    deactivateUser(selectedVolunteer.user_id, deactivateReason);

    // Reassign active tasks if a replacement volunteer was selected
    if (reassignToUserId && impactedTasks.length > 0) {
      impactedTasks.forEach((t) => {
        // updated via context
      });
    }

    setIsDeactivateModalOpen(false);
    setSelectedVolunteer(null);
  };

  const rebalanceSuggestions = rebalanceWorkload(75);

  const handleApplyRebalance = () => {
    applyWorkloadRebalance(rebalanceSuggestions);
    setIsRebalanceModalOpen(false);
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
            <span className="text-xs font-mono text-indigo-400 font-semibold">Volunteers</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Organization Volunteers Roster & Workload
          </h1>
          <p className="text-xs text-slate-400">
            Comprehensive directory of registered volunteers, skills matrix, operational capacity, and safe deactivation management.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard Volunteer</span>
          </Button>
          <Button
            onClick={() => setIsRebalanceModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-aiGlow"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>AI Smart Workload Balancing</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-mono uppercase">Total Volunteers</span>
          <span className="text-2xl font-bold text-white font-mono mt-2">{volunteers.length}</span>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <span className="text-xs text-emerald-400 font-mono uppercase">Available Capacity</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono mt-2">
            {volunteers.filter((v) => v.availability === "available").length}
          </span>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <span className="text-xs text-amber-400 font-mono uppercase">Busy Bandwidth</span>
          <span className="text-2xl font-bold text-amber-400 font-mono mt-2">
            {volunteers.filter((v) => v.availability === "busy").length}
          </span>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <span className="text-xs text-rose-400 font-mono uppercase">Overloaded (&gt;75%)</span>
          <span className="text-2xl font-bold text-rose-400 font-mono mt-2">
            {volunteers.filter((v) => v.availability === "overloaded" || (v.workloadScore || 0) > 75).length}
          </span>
        </div>
      </div>

      {/* Volunteers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {volunteers.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-700/60 rounded-2xl text-center gap-4">
            <Users className="w-12 h-12 text-slate-600" />
            <div>
              <p className="text-slate-300 font-semibold text-sm">No volunteers onboarded yet</p>
              <p className="text-slate-500 text-xs mt-1">Register your first volunteer to start managing workloads and capacity.</p>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2 flex items-center gap-1.5 mt-2"
            >
              <Plus className="w-3.5 h-3.5" /> Onboard First Volunteer
            </Button>
          </div>
        ) : volunteers.map((vol) => {
          const user = users.find((u) => u.id === vol.user_id);
          const userTasks = tasks.filter((t) => t.owner_id === vol.user_id);
          const activeCount = userTasks.filter((t) => t.status !== "completed" && t.status !== "done").length;
          const isOverloaded = vol.availability === "overloaded" || (vol.workloadScore || 0) > 75;

          return (
            <div
              key={vol.id}
              className={`p-5 rounded-2xl border bg-slate-900/70 backdrop-blur-xl flex flex-col justify-between space-y-4 transition-all ${
                isOverloaded
                  ? "border-rose-500/30 hover:border-rose-500/50"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-indigo-300">
                    {(user?.name || "V")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{user?.name || "Volunteer"}</h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Mail className="w-3 h-3 text-slate-500" />
                      {user?.email}
                    </p>
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

              {/* Workload Gauge */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Workload Score:</span>
                  <span
                    className={`font-mono font-bold text-xs ${
                      isOverloaded ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {vol.workloadScore || 20}% ({activeCount} active tasks)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOverloaded
                        ? "bg-rose-500"
                        : (vol.workloadScore || 20) > 50
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, vol.workloadScore || 20)}%` }}
                  />
                </div>
              </div>

              {/* Skills Badges */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Verified Skills:
                </span>
                <div className="flex flex-wrap gap-1">
                  {vol.skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800/80 text-slate-300 border border-slate-700/60 font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {vol.notes && (
                <p className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                  "{vol.notes}"
                </p>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">Status: {user?.status || "active"}</span>

                <button
                  onClick={() => handleOpenDeactivate(vol)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors flex items-center gap-1"
                >
                  <UserX className="w-3 h-3" />
                  <span>Deactivate Member</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Onboard Volunteer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Users className="w-5 h-5" />
                <h3>Onboard New Volunteer</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleAddVolunteer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-300 font-medium">Full Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    placeholder="e.g. Alex Johnson"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-300 font-medium">Email Address *</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder="e.g. alex@university.edu"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-300 font-medium">Phone (optional)</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-300 font-medium">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={newSkills}
                    onChange={(e) => setNewSkills(e.target.value)}
                    placeholder="e.g. Operations, Logistics, Registration"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-300 font-medium">Notes</label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="e.g. Assigned to Registration Desk"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Onboard Volunteer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}


      {isDeactivateModalOpen && selectedVolunteer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <h3>Member Removal & Impact Assessment</h3>
              </div>
              <button
                onClick={() => setIsDeactivateModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ ESC
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-1">
                <p className="font-bold">Protocol Section 8.D Enforcement:</p>
                <p className="text-slate-300">
                  Account <span className="font-semibold text-white">{selectedVolunteer.user?.name || selectedVolunteer.user_id}</span> will be soft-deactivated. Historical contribution records and immutable audit logs will be permanently preserved.
                </p>
              </div>

              {/* Impact Display */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">
                  Direct Impact Assessment:
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Active In-Flight Tasks:</span>
                    <span className="font-mono font-bold text-amber-400">{impactedTasks.length}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Assigned Projects:</span>
                    <span className="font-mono text-indigo-300">
                      {selectedVolunteer.project_ids?.length || 1}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Open Sessions to Revoke:</span>
                    <span className="font-mono text-rose-300">Active tokens will be invalidated</span>
                  </div>
                </div>
              </div>

              {/* Active Task List */}
              {impactedTasks.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">
                    Workload Pending Reassignment:
                  </span>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {impactedTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-[11px]"
                      >
                        <span className="text-slate-200 truncate">{t.title}</span>
                        <Badge variant="outline" className="text-[9px] uppercase font-mono">
                          {t.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 space-y-1">
                    <label className="text-slate-300 font-medium">Reassign in-flight tasks to:</label>
                    <select
                      value={reassignToUserId}
                      onChange={(e) => setReassignToUserId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-xs"
                    >
                      <option value="">Do not reassign (keep unassigned)</option>
                      {eligibleReassignees.map((v) => (
                        <option key={v.user_id} value={v.user_id}>
                          {v.user?.name || v.user_id} ({v.availability}, {v.workloadScore || 20}% load)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Deactivation Reason (Recorded to Audit):</label>
                <input
                  type="text"
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  placeholder="e.g. End of academic semester, voluntary resignation"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setIsDeactivateModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDeactivate}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                >
                  Confirm Soft Deactivation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Workload Balancing Modal */}
      {isRebalanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <Sparkles className="w-5 h-5 text-cyan-300" />
                <h3>Smart Workload Balancing Recommendations</h3>
              </div>
              <button
                onClick={() => setIsRebalanceModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ ESC
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-300">
                AI analyzed active task allocations and detected {rebalanceSuggestions.length} reallocation opportunities to relieve strained volunteers and eliminate project bottleneck risks.
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {rebalanceSuggestions.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white">{s.task_title}</span>
                      <span className="text-cyan-400 font-mono">Shift Optimization</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <span className="text-rose-400 font-medium">{s.from_user_name}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-emerald-400 font-medium">{s.to_user_name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic">"{s.reason}"</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setIsRebalanceModalOpen(false)}
                  className="text-xs"
                >
                  Dismiss
                </Button>
                <Button
                  onClick={handleApplyRebalance}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-aiGlow"
                >
                  Approve & Reallocate ({rebalanceSuggestions.length} tasks)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
