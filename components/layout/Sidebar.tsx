"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Users,
  Users2,
  Video,
  FileText,
  AlertTriangle,
  BellRing,
  Bot,
  History,
  Settings,
  Calendar,
  Sparkles,
  ShieldAlert,
  LogIn,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClubOps } from "@/components/providers/ClubOpsContext";

export function Sidebar() {
  const pathname = usePathname();
  const { tasks, risks, meetings, event, currentUser } = useClubOps();

  const overdueCount = tasks.filter(
    (t) => new Date(t.due_at).getTime() < Date.now() && t.status !== "done"
  ).length;
  const activeRisksCount = risks.filter((r) => r.status === "active").length;

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Events", href: "/events", icon: CalendarDays },
    { label: "Teams", href: "/dashboard/team-management", icon: Users2 },
    {
      label: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
      badge: overdueCount > 0 ? `${overdueCount} overdue` : undefined,
      badgeVariant: "destructive",
    },
    { label: "Volunteers", href: "/volunteers", icon: Users },
    { label: "Meetings", href: "/meetings", icon: Video },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Documents & RAG", href: "/documents", icon: FileText },
    {
      label: "Risks",
      href: "/risks",
      icon: AlertTriangle,
      badge: activeRisksCount > 0 ? `${activeRisksCount}` : undefined,
      badgeVariant: "warning",
    },
    { label: "Announcements", href: "/announcements", icon: BellRing },
    {
      label: "AI Copilot",
      href: "/ai-assistant",
      icon: Bot,
      highlight: true,
      badge: "ACTIVE",
      badgeVariant: "ai",
    },
    { label: "Audit Log", href: "/audit", icon: History },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800/80 bg-slate-950/85 backdrop-blur-2xl flex flex-col h-screen sticky top-0 z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-aiGlow">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 group-hover:text-cyan-300 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">ClubOps</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                AI
              </span>
            </div>
            <p className="text-[10px] tracking-wider text-slate-400 uppercase font-medium">
              Command Center
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between">
          <span>Operations</span>
          <span className="text-[9px] font-mono text-slate-500">v1.2</span>
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group relative",
                isActive
                  ? item.highlight
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-aiGlow font-semibold"
                    : "bg-slate-900 text-white font-semibold border border-indigo-500/30 shadow-sm"
                  : item.highlight
                  ? "text-indigo-300 hover:bg-indigo-950/40 hover:text-white border border-indigo-500/20"
                  : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200"
              )}
            >
              {isActive && !item.highlight && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-indigo-500" />
              )}
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-white"
                      : item.highlight
                      ? "text-indigo-400"
                      : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium font-mono",
                    item.badgeVariant === "destructive"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse"
                      : item.badgeVariant === "ai"
                      ? "bg-indigo-500/30 text-indigo-200 border border-indigo-400/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Active Event Card in Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/30">
        <div className="rounded-xl border border-slate-800/80 p-3 bg-slate-950/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Context
            </span>
            <span className="text-[9px] text-cyan-400 font-mono">LIVE</span>
          </div>
          <p className="text-xs font-semibold text-slate-100 truncate mt-1.5">{event.name}</p>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{event.venue}</p>
        </div>
      </div>

      {/* User Profile / Auth State in Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
        <Link href="/login" className="flex items-center gap-2.5 min-w-0 group" title="Open Auth Portal">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300 flex-shrink-0 group-hover:border-indigo-500 transition-colors shadow-sm">
            {currentUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
              {currentUser.name}
            </p>
            <p className="text-[10px] text-slate-400 capitalize font-mono">
              {currentUser.role}
            </p>
          </div>
        </Link>
        <Link
          href="/login"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Switch Account / Sign In"
        >
          <LogIn className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-400" />
        </Link>
      </div>
    </aside>
  );
}
