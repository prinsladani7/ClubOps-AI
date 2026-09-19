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
  Bot,
  Sparkles,
  X,
  ChevronDown,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function TasksPage() {
  const router = useRouter();
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
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");
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
    if (selectedAssignee !== "all" && t.owner_id !== selectedAssignee) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.owner?.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const columns: { label: string; status: TaskStatus; color: string; border: string; accent: string }[] = [
    { label: "Backlog", status: "backlog", color: "bg-slate-900/40", border: "border-slate-800", accent: "text-slate-400" },
    { label: "To Do", status: "todo", color: "bg-indigo-950/20", border: "border-indigo-900/50", accent: "text-indigo-400" },
    { label: "In Progress", status: "in_progress", color: "bg-amber-950/20", border: "border-amber-900/50", accent: "text-amber-400" },
    { label: "Review", status: "review", color: "bg-cyan-950/20", border: "border-cyan-900/50", accent: "text-cyan-400" },
    { label: "Blocked", status: "blocked", color: "bg-rose-950/25", border: "border-rose-900/60", accent: "text-rose-400" },
    { label: "Done", status: "done", color: "bg-emerald-950/20", border: "border-emerald-900/50", accent: "text-emerald-400" },
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

    showToast(`Task created: "${title}"`);
    setTitle("");
    setDescription("");
    setShowCreateModal(false);
  };

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    switch (current) {
      case "backlog":
        return "todo";
      case "todo":
        return "in_progress";
      case "in_progress":
        return "review";
      case "review":
        return "done";
      case "blocked":
        return "in_progress";
      case "done":
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
            <span>Critical Path Engine</span>
            <span>•</span>
            <span>{tasks.length} Total Deliverables</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 mt-0.5">
            <CheckSquare className="w-6 h-6 text-indigo-400" />
            <span>Task Management & Dependencies</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracking critical path dependencies, bottlenecks, and volunteer assignments for {event.name}.
          </p>
        </div>

        {/* View Switcher Tabs & New Task Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center p-1 rounded-xl border border-slate-800 bg-slate-900/80 text-xs shadow-sm">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === "kanban"
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <KanbanIcon className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === "table"
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === "timeline"
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Dependency Graph</span>
            </button>
            <button
              onClick={() => setViewMode("my_tasks")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === "my_tasks"
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>My Tasks</span>
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="h-9 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 shadow-aiGlow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks by title, description, or volunteer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-slate-500 hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Pill Filters */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-[11px]">
            <span className="text-slate-500 px-1.5 text-[10px] uppercase font-semibold">Priority:</span>
            {["all", "critical", "high", "medium", "low"].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPriority(p)}
                className={`px-2 py-0.5 rounded-md font-mono uppercase transition-colors ${
                  selectedPriority === p
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Assignee Filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. KANBAN BOARD VIEW */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className={`flex flex-col rounded-2xl border ${col.border} ${col.color} p-3.5 min-h-[500px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${col.accent}`}>
                    {col.label}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900/90 text-slate-300 border border-slate-800">
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks Column */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                  {colTasks.map((task) => {
                    const isOverdue = new Date(task.due_at).getTime() < Date.now() && task.status !== "done";
                    const nextStatus = getNextStatus(task.status);

                    return (
                      <div
                        key={task.id}
                        onClick={() => setActiveTaskDetail(task)}
                        className={`p-3.5 rounded-xl border bg-slate-950/80 hover:bg-slate-900 transition-all cursor-pointer space-y-2.5 group shadow-sm ${
                          task.status === "blocked"
                            ? "border-rose-500/50 hover:border-rose-400"
                            : isOverdue
                            ? "border-rose-900/60 hover:border-rose-500"
                            : "border-slate-800/80 hover:border-indigo-500/40"
                        }`}
                      >
                        {/* Task Priority & Badge */}
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={
                              task.priority === "critical"
                                ? "destructive"
                                : task.priority === "high"
                                ? "warning"
                                : "secondary"
                            }
                            className="text-[9px] py-0 px-1 font-mono uppercase"
                          >
                            {task.priority}
                          </Badge>

                          {task.dependencies && task.dependencies.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono">
                              ⛓ {task.dependencies.length} blocker(s)
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white leading-snug">
                          {task.title}
                        </h4>

                        {/* Assignee & Due Date */}
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="truncate max-w-[90px] font-medium text-slate-300">
                            {task.owner?.name || "Unassigned"}
                          </span>
                          <span className={isOverdue ? "text-rose-400 font-semibold font-mono" : "text-slate-400 font-mono"}>
                            {formatRelativeTime(task.due_at)}
                          </span>
                        </div>

                        {/* Quick Status Advance Action */}
                        {nextStatus && (
                          <div className="pt-1 flex justify-end" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                updateTaskItem(task.id, { status: nextStatus });
                                showToast(`Moved "${task.title}" to ${nextStatus.toUpperCase()}`);
                              }}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium bg-indigo-950/40 hover:bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-800/40 transition-colors"
                            >
                              <span>Move to {nextStatus.replace("_", " ")}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-slate-800/60 rounded-xl flex items-center justify-center text-[11px] text-slate-600">
                      Empty
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
        <Card className="overflow-hidden border-slate-800/80 bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono">
                <tr>
                  <th className="p-3.5">Task</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Assignee</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5">Dependencies</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-900/80 transition-colors cursor-pointer"
                    onClick={() => setActiveTaskDetail(task)}
                  >
                    <td className="p-3.5 font-semibold text-slate-200">{task.title}</td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          task.status === "done"
                            ? "success"
                            : task.status === "blocked"
                            ? "destructive"
                            : task.status === "in_progress"
                            ? "warning"
                            : "secondary"
                        }
                        className="text-[10px] uppercase font-mono"
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          task.priority === "critical"
                            ? "destructive"
                            : task.priority === "high"
                            ? "warning"
                            : "secondary"
                        }
                        className="text-[10px] uppercase font-mono"
                      >
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {task.owner?.name || <span className="text-slate-500">Unassigned</span>}
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono">
                      {formatDate(task.due_at)}
                    </td>
                    <td className="p-3.5">
                      {task.dependencies && task.dependencies.length > 0 ? (
                        <span className="text-[10px] text-amber-400 font-mono">
                          Blocked by {task.dependencies.length} task(s)
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">None</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          deleteTaskItem(task.id);
                          showToast(`Deleted task "${task.title}"`);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
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

      {/* 3. DEPENDENCY GRAPH & CRITICAL PATH VIEW */}
      {viewMode === "timeline" && (
        <Card className="p-6 space-y-6 border-slate-800/80 bg-slate-900/50">
          <div className="border-b border-slate-800/80 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <span>Critical Path Dependency Chain & Impact Radii</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Calculates real-time downstream risk propagation. Blocked upstream deliverables trigger cascading stalls.
              </p>
            </div>
            <Button
              size="sm"
              variant="ai"
              onClick={() => {
                showToast("Launching Copilot to inspect venue agreement blockers");
                router.push("/ai-assistant");
              }}
              className="text-xs h-8 gap-1.5"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Intervene via Copilot</span>
            </Button>
          </div>

          <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Active Critical Path Bottleneck</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Task #task-01 (Auditorium Booking) is BLOCKED and 2 days overdue. 3 downstream tasks are currently stalled.
                </p>
              </div>
            </div>
            <Badge variant="destructive" className="font-mono text-[10px] uppercase">
              RISK LEVEL: CRITICAL
            </Badge>
          </div>

          {/* Visual Step Chain */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-950/80">
              {/* Step 1 */}
              <div className="flex-1 w-full p-4 rounded-xl border border-rose-500/50 bg-rose-950/30 space-y-1.5 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-rose-400">STEP 1 (ROOT CAUSE)</span>
                  <Badge variant="destructive" className="text-[9px]">BLOCKED</Badge>
                </div>
                <h5 className="text-xs font-bold text-white">Confirm Grand Auditorium Booking</h5>
                <p className="text-[11px] text-slate-300">Owner: Rahul Sharma • 2 days overdue</p>
                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 text-[10px] px-2"
                    onClick={() => {
                      updateTaskItem("task-01", { status: "in_progress" });
                      showToast("Unblocked task-01: Auditorium booking moved to In Progress");
                    }}
                  >
                    Unblock Deliverable
                  </Button>
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block flex-shrink-0" />

              {/* Step 2 */}
              <div className="flex-1 w-full p-4 rounded-xl border border-amber-500/40 bg-slate-900/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-amber-400">STEP 2 (STALLED)</span>
                  <Badge variant="warning" className="text-[9px]">WAITING</Badge>
                </div>
                <h5 className="text-xs font-bold text-white">Finalize Stage Rigging & Lighting</h5>
                <p className="text-[11px] text-slate-400">Owner: Rahul Sharma • Due in 3 days</p>
                <p className="text-[10px] text-amber-400/80 font-mono">Requires Task #task-01</p>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block flex-shrink-0" />

              {/* Step 3 */}
              <div className="flex-1 w-full p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400">STEP 3 (STALLED)</span>
                  <Badge variant="secondary" className="text-[9px]">WAITING</Badge>
                </div>
                <h5 className="text-xs font-bold text-white">Sound Check & Wireless Mics</h5>
                <p className="text-[11px] text-slate-400">Owner: Rohit Nair • Due in 5 days</p>
                <p className="text-[10px] text-slate-500 font-mono">Requires Step 2</p>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block flex-shrink-0" />

              {/* Step 4 */}
              <div className="flex-1 w-full p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400">STEP 4 (FINAL)</span>
                  <Badge variant="secondary" className="text-[9px]">BACKLOG</Badge>
                </div>
                <h5 className="text-xs font-bold text-white">Full Dress Rehearsal</h5>
                <p className="text-[11px] text-slate-400">Owner: Priya Mehta • Due in 7 days</p>
                <p className="text-[10px] text-slate-500 font-mono">Requires Steps 1–3</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 4. MY TASKS VIEW */}
      {viewMode === "my_tasks" && (
        <Card className="p-6 border-slate-800/80 bg-slate-900/50 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-white">
                Personal Assignment Board: {currentUser.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tasks assigned directly to your active persona ({currentUser.role.toUpperCase()}).
              </p>
            </div>
            <Badge variant="ai" className="text-xs font-mono">
              {filteredTasks.length} Assigned
            </Badge>
          </div>

          <div className="space-y-3">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{t.title}</h4>
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
                      showToast(`Task marked ${t.status === "done" ? "In Progress" : "Done"}: "${t.title}"`);
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

      {/* Task Detail Modal */}
      <Modal
        isOpen={!!activeTaskDetail}
        onClose={() => setActiveTaskDetail(null)}
        title={activeTaskDetail?.title || "Task Detail"}
        description={`Task ID: ${activeTaskDetail?.id}`}
      >
        {activeTaskDetail && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Description:</span>
              <p className="text-slate-200 mt-1 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                {activeTaskDetail.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 font-medium">Assignee:</span>
                <p className="font-semibold text-white mt-1">
                  {activeTaskDetail.owner?.name || "Unassigned"}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Status:</span>
                <p className="font-semibold text-indigo-400 mt-1 uppercase font-mono">
                  {activeTaskDetail.status.replace("_", " ")}
                </p>
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Due Date:</span>
              <p className="font-mono text-slate-200 mt-1">
                {formatDate(activeTaskDetail.due_at)} ({formatRelativeTime(activeTaskDetail.due_at)})
              </p>
            </div>
            {activeTaskDetail.dependencies && activeTaskDetail.dependencies.length > 0 && (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-300">
                ⚠️ This task is waiting on {activeTaskDetail.dependencies.length} prerequisite deliverable(s).
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-slate-800">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  deleteTaskItem(activeTaskDetail.id);
                  showToast(`Task deleted`);
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
                  showToast(`Task updated`);
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
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300">Description</label>
            <textarea
              rows={2}
              placeholder="Operational details and expected deliverables..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
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
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
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
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
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
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
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
