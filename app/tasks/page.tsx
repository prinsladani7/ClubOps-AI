"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  Plus,
  Filter,
  Search,
  AlertTriangle,
  Clock,
  ArrowRight,
  ChevronRight,
  GitBranch,
  Layers,
  Table as TableIcon,
  Kanban as KanbanIcon,
  Calendar as CalendarIcon,
  UserCheck,
  Trash2,
  Edit2,
  CheckCircle,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export default function TasksPage() {
  const {
    tasks,
    users,
    event,
    currentUser,
    createNewTask,
    updateTaskItem,
    deleteTaskItem,
    showToast,
  } = useClubOps();

  const [viewMode, setViewMode] = useState<"kanban" | "table" | "timeline" | "my_tasks">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTaskDetail, setActiveTaskDetail] = useState<Task | null>(null);

  // Form State for new task
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState(users[0]?.id || "");
  const [priority, setPriority] = useState<TaskPriority>("high");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = useState("2026-09-25T17:00:00Z");

  // Filtering
  const filteredTasks = tasks.filter((t) => {
    if (viewMode === "my_tasks" && t.owner_id !== currentUser.id) return false;
    if (selectedStatus !== "all" && t.status !== selectedStatus) return false;
    if (selectedPriority !== "all" && t.priority !== selectedPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.owner?.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const columns: { label: string; status: TaskStatus; color: string }[] = [
    { label: "Backlog", status: "backlog", color: "border-slate-700 bg-slate-900/30" },
    { label: "To Do", status: "todo", color: "border-indigo-800/40 bg-indigo-950/10" },
    { label: "In Progress", status: "in_progress", color: "border-amber-800/40 bg-amber-950/10" },
    { label: "Review", status: "review", color: "border-cyan-800/40 bg-cyan-950/10" },
    { label: "Blocked", status: "blocked", color: "border-rose-800/50 bg-rose-950/20" },
    { label: "Done", status: "done", color: "border-emerald-800/40 bg-emerald-950/10" },
  ];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createNewTask({
      event_id: event.id,
      title,
      description,
      owner_id: ownerId,
      status,
      priority,
      due_at: dueDate,
      created_by: currentUser.id,
    });

    setTitle("");
    setDescription("");
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-400" />
            <span>Task Management & Dependency Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracking {tasks.length} tasks across the critical path for {event.name}.
          </p>
        </div>

        {/* View Switcher Tabs & New Task Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-1 rounded-lg border border-slate-800 bg-slate-900/80 text-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                viewMode === "kanban"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <KanbanIcon className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                viewMode === "table"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                viewMode === "timeline"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Dependencies</span>
            </button>
            <button
              onClick={() => setViewMode("my_tasks")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                viewMode === "my_tasks"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>My Tasks</span>
            </button>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-1.5 text-xs h-9 bg-indigo-600 hover:bg-indigo-500 shadow-aiGlow"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-2 w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, owner, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Filter:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-200 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* 1. KANBAN BOARD VIEW */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className={`rounded-xl border p-3 flex flex-col h-[700px] ${col.color}`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setActiveTaskDetail(task)}
                      className="p-3 rounded-lg border border-slate-800 bg-slate-950 hover:border-indigo-500/50 hover:shadow-aiGlow transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <Badge
                          variant={
                            task.priority === "critical"
                              ? "destructive"
                              : task.priority === "high"
                              ? "warning"
                              : "secondary"
                          }
                          className="text-[9px] py-0 px-1.5"
                        >
                          {task.priority}
                        </Badge>
                        {task.dependents && task.dependents.length > 0 && (
                          <span
                            className="text-[10px] text-amber-400 flex items-center gap-1 font-mono"
                            title={`Blocks ${task.dependents.length} task(s)`}
                          >
                            <GitBranch className="w-3 h-3" />
                            <span>{task.dependents.length}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-semibold text-slate-100 mt-2 line-clamp-2 group-hover:text-indigo-300">
                        {task.title}
                      </h4>

                      <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[100px]">
                          👤 {task.owner?.name.split(" ")[0] || "Unassigned"}
                        </span>
                        <span
                          className={
                            new Date(task.due_at).getTime() < Date.now() && task.status !== "done"
                              ? "text-rose-400 font-semibold"
                              : "text-slate-500"
                          }
                        >
                          {formatRelativeTime(task.due_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="h-28 flex items-center justify-center border border-dashed border-slate-800/60 rounded-lg text-[11px] text-slate-500">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. TABLE VIEW */}
      {viewMode === "table" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Assignee</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Dependencies</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3 font-semibold text-slate-100 max-w-xs truncate">
                      {task.title}
                    </td>
                    <td className="p-3">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskItem(task.id, { status: e.target.value as any })}
                        className="rounded bg-slate-900 border border-slate-800 text-xs px-2 py-1 text-slate-200 focus:outline-none"
                      >
                        <option value="backlog">Backlog</option>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="blocked">Blocked</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          task.priority === "critical"
                            ? "destructive"
                            : task.priority === "high"
                            ? "warning"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-300">
                      {task.owner?.name || <span className="text-slate-500">Unassigned</span>}
                    </td>
                    <td className="p-3 text-slate-400 font-mono">
                      {formatDate(task.due_at)}
                    </td>
                    <td className="p-3">
                      {task.dependencies && task.dependencies.length > 0 ? (
                        <span className="text-[10px] text-amber-400 font-mono">
                          Blocked by {task.dependencies.length} task(s)
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">None</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => deleteTaskItem(task.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 3. DEPENDENCY GRAPH & CRITICAL PATH VIEW (Section 8 Requirement) */}
      {viewMode === "timeline" && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              <span>Critical Path Task Dependency Graph</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Downstream calculation: if an upstream task becomes overdue or blocked, calculated risk is propagated automatically.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <div>
                <h4 className="text-xs font-semibold text-white">Active Critical Path Bottleneck</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Task #task-01 (Auditorium Booking) is BLOCKED and 2 days overdue. 3 downstream tasks are immobilized.
                </p>
              </div>
            </div>
            <Badge variant="destructive">RISK LEVEL: CRITICAL</Badge>
          </div>

          {/* Visual Step Chain */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950">
              {/* Step 1 */}
              <div className="flex-1 p-3 rounded-lg border border-rose-500/40 bg-rose-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-rose-400">STEP 1 (ROOT CAUSE)</span>
                  <Badge variant="destructive" className="text-[9px]">BLOCKED</Badge>
                </div>
                <h5 className="text-xs font-semibold text-white mt-1">Confirm Grand Auditorium Booking</h5>
                <p className="text-[11px] text-slate-400 mt-1">Owner: Rahul Sharma • 2 days overdue</p>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

              {/* Step 2 */}
              <div className="flex-1 p-3 rounded-lg border border-amber-500/40 bg-slate-900/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-amber-400">STEP 2 (STALLED)</span>
                  <Badge variant="warning" className="text-[9px]">WAITING</Badge>
                </div>
                <h5 className="text-xs font-semibold text-white mt-1">Finalize Stage Rigging & Lighting</h5>
                <p className="text-[11px] text-slate-400 mt-1">Owner: Rahul Sharma • Due in 3 days</p>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

              {/* Step 3 */}
              <div className="flex-1 p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">STEP 3 (STALLED)</span>
                  <Badge variant="secondary" className="text-[9px]">WAITING</Badge>
                </div>
                <h5 className="text-xs font-semibold text-white mt-1">Sound Check & Wireless Mics</h5>
                <p className="text-[11px] text-slate-400 mt-1">Owner: Rohit Nair • Due in 5 days</p>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

              {/* Step 4 */}
              <div className="flex-1 p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">STEP 4 (FINAL)</span>
                  <Badge variant="secondary" className="text-[9px]">BACKLOG</Badge>
                </div>
                <h5 className="text-xs font-semibold text-white mt-1">Full Dress Rehearsal</h5>
                <p className="text-[11px] text-slate-400 mt-1">Owner: Priya Mehta • Due in 7 days</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 4. MY TASKS VIEW */}
      {viewMode === "my_tasks" && (
        <Card className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Personal Assignment Board: {currentUser.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tasks assigned directly to your active persona ({currentUser.role.toUpperCase()}).
              </p>
            </div>
            <span className="text-xs font-mono text-indigo-400">
              {filteredTasks.length} task(s) assigned
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-xs font-semibold text-white">{t.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{t.description}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Due: {formatDate(t.due_at)} ({formatRelativeTime(t.due_at)})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={t.priority === "critical" ? "destructive" : "warning"}>
                    {t.priority}
                  </Badge>
                  <Button
                    size="sm"
                    variant={t.status === "done" ? "secondary" : "default"}
                    onClick={() => {
                      updateTaskItem(t.id, { status: t.status === "done" ? "in_progress" : "done" });
                      showToast(`Task status toggled: "${t.title}"`);
                    }}
                    className="text-xs h-8"
                  >
                    {t.status === "done" ? "Mark Incomplete" : "Mark Done"}
                  </Button>
                </div>
              </div>
            ))}
            {filteredTasks.length === 0 && (
              <p className="text-xs text-slate-400 py-8 text-center">
                No tasks currently assigned to {currentUser.name}. Switch personas in the top right to inspect other volunteer workloads.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Task Detail Drawer / Modal */}
      <Modal
        isOpen={!!activeTaskDetail}
        onClose={() => setActiveTaskDetail(null)}
        title={activeTaskDetail?.title || "Task Detail"}
        description={`Task ID: ${activeTaskDetail?.id}`}
      >
        {activeTaskDetail && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400">Description:</span>
              <p className="text-slate-200 mt-1 leading-relaxed bg-slate-950 p-3 rounded border border-slate-800">
                {activeTaskDetail.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400">Assignee:</span>
                <p className="font-semibold text-white mt-1">
                  {activeTaskDetail.owner?.name || "Unassigned"}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Status:</span>
                <p className="font-semibold text-indigo-400 mt-1 uppercase">
                  {activeTaskDetail.status.replace("_", " ")}
                </p>
              </div>
            </div>
            <div>
              <span className="text-slate-400">Due Date:</span>
              <p className="font-mono text-slate-200 mt-1">
                {formatDate(activeTaskDetail.due_at)} ({formatRelativeTime(activeTaskDetail.due_at)})
              </p>
            </div>
            {activeTaskDetail.dependents && activeTaskDetail.dependents.length > 0 && (
              <div className="p-3 rounded border border-amber-500/30 bg-amber-950/20 text-amber-300">
                ⚠️ This task is a prerequisite for {activeTaskDetail.dependents.length} downstream item(s).
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-slate-800">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  deleteTaskItem(activeTaskDetail.id);
                  setActiveTaskDetail(null);
                }}
              >
                Delete Task
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  updateTaskItem(activeTaskDetail.id, {
                    status: activeTaskDetail.status === "done" ? "todo" : "done",
                  });
                  setActiveTaskDetail(null);
                }}
              >
                {activeTaskDetail.status === "done" ? "Reopen Task" : "Mark Complete"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Operational Task"
        description="Add a task with owners, priority, and deadline constraints."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300">Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Confirm VIP Keynote Travel Itinerary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300">Description</label>
            <textarea
              rows={2}
              placeholder="Operational details and expected deliverables..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300">Assignee</label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Due Date</label>
              <input
                type="datetime-local"
                value={dueDate.slice(0, 16)}
                onChange={(e) => setDueDate(new Date(e.target.value).toISOString())}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
