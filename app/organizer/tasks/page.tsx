"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Plus,
  ArrowLeft,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  RotateCcw,
  Sparkles,
  ExternalLink,
  MessageSquare,
  User,
  Calendar,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task, TaskPriority, TaskStatus } from "@/types";

export default function OrganizerTasksPage() {
  const {
    currentUser,
    projects,
    tasks,
    volunteers,
    createNewTask,
    completeTask,
    requestTaskChanges,
    showToast,
  } = useClubOps();

  const myProjects = projects.filter(
    (p) => p.organizer_id === currentUser.id || (p.organizers && p.organizers.includes(currentUser.id))
  );
  const myProjectIds = new Set(myProjects.map((p) => p.id));

  const scopedTasks = tasks.filter((t) => t.project_id && myProjectIds.has(t.project_id));

  // Tabs: all, pending, in_progress, blocked, submitted, completed
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTaskToReview, setSelectedTaskToReview] = useState<Task | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");

  // Create Task Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskProjectId, setTaskProjectId] = useState(myProjects[0]?.id || "");
  const [taskOwnerId, setTaskOwnerId] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskDeadline, setTaskDeadline] = useState("2026-10-22");
  const [taskEstimatedHours, setTaskEstimatedHours] = useState(6);
  const [checklistInput, setChecklistInput] = useState("Step 1: Planning\nStep 2: Execution\nStep 3: Verification");

  const filteredTasks = scopedTasks.filter((t) => {
    if (activeTab === "all") return true;
    if (activeTab === "review") return t.status === "submitted";
    return t.status === activeTab;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskProjectId) return;

    const checklistItems = checklistInput
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((text, idx) => ({
        id: `chk-${Date.now()}-${idx}`,
        text,
        completed: false,
      }));

    createNewTask({
      project_id: taskProjectId,
      title: taskTitle,
      description: taskDesc,
      owner_id: taskOwnerId || undefined,
      status: "pending",
      priority: taskPriority,
      due_at: new Date(taskDeadline).toISOString(),
      created_by: currentUser.id,
      estimated_hours: Number(taskEstimatedHours),
      checklist: checklistItems,
    });

    setIsCreateOpen(false);
    setTaskTitle("");
    setTaskDesc("");
  };

  const handleApproveSubmission = (taskId: string) => {
    completeTask(taskId);
    setSelectedTaskToReview(null);
  };

  const handleRequestRevisions = (taskId: string) => {
    if (!reviewFeedback) {
      showToast("Please enter feedback explaining the changes required.");
      return;
    }
    requestTaskChanges(taskId, reviewFeedback);
    setSelectedTaskToReview(null);
    setReviewFeedback("");
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
            <span className="text-xs font-mono text-cyan-400 font-semibold">Tasks</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Task Operations & Deliverable Sign-Off
          </h1>
          <p className="text-xs text-slate-400">
            Create tasks, allocate squad volunteers, set criteria, and verify submitted proof-of-work deliverables.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Task</span>
        </Button>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800/60">
        {[
          { id: "all", label: "All Tasks", count: scopedTasks.length },
          { id: "pending", label: "Pending Acceptance", count: scopedTasks.filter((t) => t.status === "pending").length },
          { id: "in_progress", label: "In Progress", count: scopedTasks.filter((t) => t.status === "in_progress").length },
          { id: "blocked", label: "Blocked", count: scopedTasks.filter((t) => t.status === "blocked").length },
          { id: "review", label: "Review Queue", count: scopedTasks.filter((t) => t.status === "submitted").length, highlight: true },
          { id: "completed", label: "Completed", count: scopedTasks.filter((t) => t.status === "completed" || t.status === "done").length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.id
                ? tab.highlight
                  ? "bg-amber-500 text-black shadow-md font-bold"
                  : "bg-slate-800 text-white border border-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === tab.id ? "bg-black/20 text-current" : "bg-slate-800 text-slate-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tasks Table */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400 space-y-2">
            <CheckSquare className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">No tasks found matching this status filter.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isOverdue = new Date(task.due_at).getTime() < Date.now() && task.status !== "completed" && task.status !== "done";
            const proj = projects.find((p) => p.id === task.project_id);

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl border bg-slate-900/70 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  task.status === "submitted"
                    ? "border-amber-500/50 ring-1 ring-amber-500/20 bg-slate-900/90"
                    : isOverdue
                    ? "border-rose-500/40"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={task.priority === "critical" ? "destructive" : task.priority === "high" ? "warning" : "outline"}
                      className="text-[9px] uppercase font-mono"
                    >
                      {task.priority}
                    </Badge>

                    <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-300">
                      {proj?.name || "Project"}
                    </Badge>

                    {isOverdue && (
                      <Badge variant="destructive" className="text-[9px] font-mono animate-pulse">
                        OVERDUE
                      </Badge>
                    )}

                    <Badge
                      variant={
                        task.status === "submitted"
                          ? "warning"
                          : task.status === "completed" || task.status === "done"
                          ? "cyan"
                          : task.status === "blocked"
                          ? "destructive"
                          : "outline"
                      }
                      className="text-[10px] font-mono uppercase"
                    >
                      {task.status}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{task.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{task.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Assignee: {task.owner?.name || "Unassigned"}</span>
                    </span>

                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Due: {new Date(task.due_at).toLocaleDateString()}</span>
                    </span>

                    {task.checklist && task.checklist.length > 0 && (
                      <span>
                        Checklist: {task.checklist.filter((c) => c.completed).length}/{task.checklist.length}
                      </span>
                    )}

                    {task.evidence && task.evidence.length > 0 && (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>{task.evidence.length} Evidence Uploaded</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Review / Status Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.status === "submitted" ? (
                    <Button
                      onClick={() => setSelectedTaskToReview(task)}
                      className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 py-1.5"
                    >
                      Inspect Deliverable
                    </Button>
                  ) : task.status !== "completed" && task.status !== "done" ? (
                    <Button
                      onClick={() => completeTask(task.id)}
                      variant="outline"
                      className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800 px-3 py-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                      <span>Mark Complete</span>
                    </Button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Deliverable Modal */}
      {selectedTaskToReview && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <FileCheck className="w-5 h-5" />
                <h3>Review Deliverable Proof</h3>
              </div>
              <button
                onClick={() => setSelectedTaskToReview(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ ESC
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-white text-sm">{selectedTaskToReview.title}</h4>
                <p className="text-slate-400 mt-1">{selectedTaskToReview.description}</p>
              </div>

              {/* Submitted Evidence Links */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">
                  Submitted Proof of Work:
                </span>
                {selectedTaskToReview.evidence?.map((ev, idx) => (
                  <div key={idx} className="space-y-1">
                    <a
                      href={ev.evidence_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-mono break-all"
                    >
                      <span>{ev.evidence_url}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                    {ev.notes && <p className="text-slate-300 italic">"{ev.notes}"</p>}
                  </div>
                ))}
              </div>

              {/* Revision Feedback Input */}
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Organizer Revision Notes (if requesting changes):</label>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Explain what additions or modifications the volunteer needs to make before completion..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <Button
                  onClick={() => handleRequestRevisions(selectedTaskToReview.id)}
                  variant="outline"
                  className="text-rose-300 border-rose-500/30 hover:bg-rose-500/10 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  <span>Request Changes</span>
                </Button>

                <Button
                  onClick={() => handleApproveSubmission(selectedTaskToReview.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>Approve & Complete Task</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Task in Authorized Scope</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Task Title:</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Design Hackathon Participant Badges"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Project Workstream:</label>
                <select
                  value={taskProjectId}
                  onChange={(e) => setTaskProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  required
                >
                  {myProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Assign Volunteer:</label>
                <select
                  value={taskOwnerId}
                  onChange={(e) => setTaskOwnerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Leave Unassigned (Volunteer Pool)</option>
                  {volunteers.map((v) => (
                    <option key={v.user_id} value={v.user_id}>
                      {v.user?.name || v.user_id} ({v.availability}, {v.skills[0] || "General"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Priority:</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Deadline:</label>
                  <input
                    type="date"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Description & Acceptance Criteria:</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Detail deliverable requirements, format, and verification proof..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Checklist Steps (One per line):</label>
                <textarea
                  value={checklistInput}
                  onChange={(e) => setChecklistInput(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
                  Publish Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
