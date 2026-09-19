"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Bot,
  Bell,
  Sparkles,
  Shield,
  UserCheck,
  CheckCircle,
  Clock,
  Plus,
  LogIn,
  LogOut,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function TopBar() {
  const router = useRouter();
  const {
    currentUser,
    switchUser,
    users,
    event,
    notifications,
    markRead,
    createNewTask,
    runAICommand,
    isAuthenticated,
    logout,
  } = useClubOps();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high" | "critical">("high");
  const [taskAssignee, setTaskAssignee] = useState(users[0]?.id || "");
  const [taskDueDate, setTaskDueDate] = useState("2026-09-25T17:00:00Z");

  const unreadNotifs = notifications.filter((n) => !n.read_at);

  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    createNewTask({
      event_id: event.id,
      title: taskTitle,
      description: "Direct entry from Quick Action command bar",
      owner_id: taskAssignee,
      status: "todo",
      priority: taskPriority,
      due_at: taskDueDate,
      created_by: currentUser.id,
    });

    setTaskTitle("");
    setShowQuickTask(false);
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Search / AI Command Quick Bar */}
      <div className="flex items-center gap-3 w-1/3">
        <button
          onClick={() => router.push("/ai-assistant")}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 text-xs hover:border-indigo-500/50 hover:bg-slate-900 transition-all group"
        >
          <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
          <span className="flex-1 text-left">Ask ClubOps AI or search operations...</span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Persona Switcher, Notifications, Quick Actions */}
      <div className="flex items-center gap-4">
        {/* Persona Switcher (RBAC Live Testing) */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-slate-800 bg-slate-900/70">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] font-medium text-slate-400">Persona:</span>
          <select
            value={currentUser.id}
            onChange={(e) => switchUser(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200">
                {u.name} ({u.role.toUpperCase()})
              </option>
            ))}
          </select>
          <Badge
            variant={
              currentUser.role === "admin"
                ? "destructive"
                : currentUser.role === "organizer"
                ? "warning"
                : currentUser.role === "volunteer"
                ? "cyan"
                : "secondary"
            }
            className="text-[10px] py-0 px-1.5"
          >
            {currentUser.role}
          </Badge>
        </div>

        {/* Quick Action Button */}
        <Button
          size="sm"
          onClick={() => setShowQuickTask(true)}
          className="h-8 gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </Button>

        {/* AI Assistant Quick Trigger */}
        <Button
          size="sm"
          variant="ai"
          onClick={() => router.push("/ai-assistant")}
          className="h-8 gap-1.5 text-xs"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>AI Copilot</span>
        </Button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-white">Notifications</span>
                <span className="text-[10px] text-slate-400">
                  {unreadNotifs.length} unread
                </span>
              </div>
              <div className="mt-2 space-y-2 max-h-72 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No notifications.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        n.read_at
                          ? "border-slate-800/40 bg-slate-900/30 text-slate-400"
                          : "border-indigo-500/30 bg-indigo-950/20 text-slate-200"
                      }`}
                    >
                      <p className="font-semibold text-slate-100">{n.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{n.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Auth Portal & Sign In / Out */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/70 text-slate-300 hover:text-white hover:border-indigo-500/50 text-xs transition-colors"
            title="Switch Account or Login"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline font-medium">Auth Portal</span>
          </Link>

          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="p-1.5 rounded-lg border border-slate-800/80 bg-slate-900/40 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-950/20 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Task Creation Modal */}
      <Modal
        isOpen={showQuickTask}
        onClose={() => setShowQuickTask(false)}
        title="Create New Operational Task"
        description="Add a task to the active event backlog or schedule it directly."
      >
        <form onSubmit={handleCreateQuickTask} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300">Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Confirm Stage Rigging with Lighting Vendor"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Assignee</label>
              <select
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300">Due Date</label>
            <input
              type="datetime-local"
              value={taskDueDate.slice(0, 16)}
              onChange={(e) => setTaskDueDate(new Date(e.target.value).toISOString())}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowQuickTask(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </Modal>
    </header>
  );
}
