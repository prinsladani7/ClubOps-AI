"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  CheckSquare,
  Users,
  Video,
  FileText,
  AlertTriangle,
  BellRing,
  Bot,
  History,
  Settings,
  Calendar,
  LogIn,
  UserCheck,
  Plus,
  Sparkles,
  ArrowRight,
  Shield,
  X,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navigation" | "Quick Action" | "Switch Persona" | "Active Tasks";
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "warning" | "cyan" | "ai";
  action: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const {
    tasks,
    users,
    switchUser,
    triggerRiskAnalysis,
    showToast,
  } = useClubOps();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener handled by parent or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Assemble searchable items
  const baseItems: CommandItem[] = [
    // Navigation
    {
      id: "nav-dash",
      title: "Command Center Dashboard",
      subtitle: "Overview, Health Gauge & Operational Alerts",
      category: "Navigation",
      icon: LayoutDashboard,
      action: () => {
        router.push("/");
        onClose();
      },
    },
    {
      id: "nav-tasks",
      title: "Task Management & Dependencies",
      subtitle: "Kanban board, table view, and critical paths",
      category: "Navigation",
      icon: CheckSquare,
      action: () => {
        router.push("/tasks");
        onClose();
      },
    },
    {
      id: "nav-volunteers",
      title: "Volunteer Workload & Roster",
      subtitle: "Committee leads, workload scores, and skill matching",
      category: "Navigation",
      icon: Users,
      action: () => {
        router.push("/volunteers");
        onClose();
      },
    },
    {
      id: "nav-meetings",
      title: "Meeting Intelligence & Syncs",
      subtitle: "Audio transcripts and AI action item extraction",
      category: "Navigation",
      icon: Video,
      action: () => {
        router.push("/meetings");
        onClose();
      },
    },
    {
      id: "nav-docs",
      title: "Documents & Permission RAG",
      subtitle: "Grounded semantic search across club knowledge",
      category: "Navigation",
      icon: FileText,
      action: () => {
        router.push("/documents");
        onClose();
      },
    },
    {
      id: "nav-risks",
      title: "Risk Intelligence & Heatmap",
      subtitle: "Automated threat detection across operational pillars",
      category: "Navigation",
      icon: AlertTriangle,
      action: () => {
        router.push("/risks");
        onClose();
      },
    },
    {
      id: "nav-copilot",
      title: "AI Copilot & Tool Engine",
      subtitle: "Autonomous actions with human-in-the-loop approvals",
      category: "Navigation",
      icon: Bot,
      badge: "AI CORE",
      badgeVariant: "ai",
      action: () => {
        router.push("/ai-assistant");
        onClose();
      },
    },
    {
      id: "nav-audit",
      title: "Security Audit Log",
      subtitle: "Cryptographically verifiable ledger of actions",
      category: "Navigation",
      icon: History,
      action: () => {
        router.push("/audit");
        onClose();
      },
    },
    {
      id: "nav-login",
      title: "Auth & Demo Persona Portal",
      subtitle: "Sign in, switch roles, or manage accounts",
      category: "Navigation",
      icon: LogIn,
      action: () => {
        router.push("/login");
        onClose();
      },
    },

    // Quick Actions
    {
      id: "action-risk-scan",
      title: "Run Live AI Risk Scan",
      subtitle: "Recalibrate dependency graph and detect bottlenecks",
      category: "Quick Action",
      icon: Sparkles,
      badge: "AI ACTION",
      badgeVariant: "ai",
      action: () => {
        triggerRiskAnalysis();
        showToast("AI Risk Scan completed. Heatmap and dependencies recalibrated.");
        router.push("/risks");
        onClose();
      },
    },
    {
      id: "action-copilot-task",
      title: "Ask Copilot to Assign Task",
      subtitle: "Launch AI task recommendation workflow",
      category: "Quick Action",
      icon: Bot,
      action: () => {
        router.push("/ai-assistant");
        onClose();
      },
    },

    // Switch Personas
    ...users.map((u) => ({
      id: `persona-${u.id}`,
      title: `Switch Persona: ${u.name}`,
      subtitle: `Role: ${u.role.toUpperCase()} • Email: ${u.email}`,
      category: "Switch Persona" as const,
      icon: Shield,
      badge: u.role.toUpperCase(),
      badgeVariant: (u.role === "admin"
        ? "destructive"
        : u.role === "organizer"
        ? "warning"
        : "cyan") as any,
      action: () => {
        switchUser(u.id);
        showToast(`Switched active persona to ${u.name} (${u.role.toUpperCase()})`);
        onClose();
      },
    })),

    // Active Tasks
    ...tasks.slice(0, 8).map((t) => ({
      id: `task-${t.id}`,
      title: t.title,
      subtitle: `Priority: ${t.priority.toUpperCase()} • Assignee: ${t.owner?.name || "Unassigned"}`,
      category: "Active Tasks" as const,
      icon: CheckSquare,
      badge: t.status.replace("_", " "),
      badgeVariant: (t.status === "blocked"
        ? "destructive"
        : t.status === "in_progress"
        ? "warning"
        : t.status === "done"
        ? "success"
        : "secondary") as any,
      action: () => {
        router.push("/tasks");
        onClose();
      },
    })),
  ];

  // Filter items by query
  const filteredItems = query.trim()
    ? baseItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : baseItems;

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/50">
          <Search className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, pages, tasks, personas, or ask AI..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-500 hover:text-slate-300 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching commands found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? "bg-indigo-600/20 border border-indigo-500/40 text-white"
                      : "hover:bg-slate-900 text-slate-300 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-900 border border-slate-800 text-slate-400"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-100 truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.badge && (
                      <Badge variant={item.badgeVariant || "secondary"} className="text-[10px] py-0 px-1.5">
                        {item.badge}
                      </Badge>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono uppercase">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-500 px-4">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-indigo-400 font-medium">ClubOps AI Command Bus</span>
        </div>
      </div>
    </div>
  );
}
