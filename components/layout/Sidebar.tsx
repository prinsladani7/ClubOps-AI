"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Shield,
  Briefcase,
  UserCheck,
  Zap,
  LogIn,
  LogOut,
  FolderKanban,
  CheckCircle2,
  Clock,
  Inbox,
  User as UserIcon,
  Flame,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { tasks, risks, notifications, event, currentUser, logout, users } = useClubOps();

  const overdueCount = tasks.filter(
    (t) => new Date(t.due_at).getTime() < Date.now() && t.status !== "done" && t.status !== "completed"
  ).length;

  const unreadNotificationsCount = notifications.filter((n) => !n.read_at).length;

  const myPendingTasksCount = tasks.filter(
    (t) => t.owner_id === currentUser.id && t.status !== "completed" && t.status !== "done"
  ).length;

  // Generate Navigation Items dynamically from authenticated Role (Specification Section 12 & 13)
  const getNavItems = () => {
    if (currentUser.role === "admin") {
      return [
        { label: "Admin Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        {
          label: "Live War Room",
          href: "/war-room",
          icon: Flame,
          badge: "36H LIVE",
          badgeVariant: "destructive",
        },
        { label: "Algorithm Intelligence", href: "/algorithms", icon: Activity },
        { label: "Run-of-Show Planner", href: "/planning", icon: Clock },
        { label: "Projects Portfolio", href: "/admin/projects", icon: FolderKanban },
        { label: "Organizers & Volunteers", href: "/admin/organizers", icon: Users2 },
        { label: "Team & Squads", href: "/admin/team", icon: Shield },
        { label: "Volunteers Directory", href: "/admin/volunteers", icon: Users },
        { label: "Milestone Reports", href: "/admin/reports", icon: FileText },
        { label: "Compliance Audit", href: "/admin/history", icon: History },
        { label: "Security Settings", href: "/admin/settings", icon: Settings },
        {
          label: "Risk Command",
          href: "/risks",
          icon: AlertTriangle,
          badge: risks.filter((r) => r.status === "active").length > 0 ? `${risks.filter((r) => r.status === "active").length}` : undefined,
          badgeVariant: "warning",
        },
        {
          label: "AI Copilot",
          href: "/ai-assistant",
          icon: Bot,
          highlight: true,
          badge: "ACTIVE",
          badgeVariant: "ai",
        },
      ];
    }

    if (currentUser.role === "organizer") {
      return [
        { label: "Organizer Dashboard", href: "/organizer/dashboard", icon: LayoutDashboard },
        {
          label: "Live War Room",
          href: "/war-room",
          icon: Flame,
          badge: "36H LIVE",
          badgeVariant: "destructive",
        },
        { label: "Algorithm Intelligence", href: "/algorithms", icon: Activity },
        { label: "Run-of-Show Planner", href: "/planning", icon: Clock },
        { label: "My Projects", href: "/organizer/projects", icon: FolderKanban },
        {
          label: "Task Operations",
          href: "/organizer/tasks",
          icon: CheckSquare,
          badge: overdueCount > 0 ? `${overdueCount} overdue` : undefined,
          badgeVariant: "destructive",
        },
        { label: "Squad Volunteers", href: "/organizer/volunteers", icon: Users },
        { label: "Milestone Calendar", href: "/organizer/calendar", icon: Calendar },
        { label: "Work History", href: "/organizer/history", icon: History },
        { label: "Scope Reports", href: "/organizer/reports", icon: FileText },
        { label: "Announcements", href: "/announcements", icon: BellRing },
        {
          label: "AI Copilot",
          href: "/ai-assistant",
          icon: Bot,
          highlight: true,
          badge: "ACTIVE",
          badgeVariant: "ai",
        },
      ];
    }

    if (currentUser.role === "volunteer") {
      return [
        { label: "Volunteer Dashboard", href: "/volunteer/dashboard", icon: LayoutDashboard },
        {
          label: "Live War Room",
          href: "/war-room",
          icon: Flame,
          badge: "LIVE",
          badgeVariant: "destructive",
        },
        {
          label: "My Tasks",
          href: "/volunteer/tasks",
          icon: CheckSquare,
          badge: myPendingTasksCount > 0 ? `${myPendingTasksCount}` : undefined,
          badgeVariant: "primary",
        },
        { label: "Run-of-Show Timeline", href: "/planning", icon: Clock },
        { label: "Availability Calendar", href: "/volunteer/calendar", icon: Calendar },
        { label: "Task History & Proof", href: "/volunteer/history", icon: History },
        { label: "Profile & Skills", href: "/volunteer/profile", icon: UserIcon },
        {
          label: "Notifications",
          href: "/volunteer/notifications",
          icon: BellRing,
          badge: unreadNotificationsCount > 0 ? `${unreadNotificationsCount}` : undefined,
          badgeVariant: "destructive",
        },
        {
          label: "AI Copilot",
          href: "/ai-assistant",
          icon: Bot,
          highlight: true,
        },
      ];
    }

    // Default / Member / Guest view
    return [
      { label: "Role Selection", href: "/auth/role", icon: Shield },
      { label: "Hackathon War Room", href: "/war-room", icon: Flame },
      { label: "36h Schedule", href: "/planning", icon: Clock },
      { label: "Event Overview", href: "/events", icon: CalendarDays },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Announcements", href: "/announcements", icon: BellRing },
    ];
  };

  const navItems = getNavItems();

  const handleSignOut = () => {
    logout();
    router.push("/auth/role");
  };

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
              Autonomous Event OS
            </p>
          </div>
        </Link>
      </div>

      {/* Role Identity Banner */}
      <div className="px-4 py-2.5 bg-slate-900/50 border-b border-slate-800/60 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-mono">Role Clearance:</span>
        <Badge
          variant={
            currentUser.role === "admin"
              ? "destructive"
              : currentUser.role === "organizer"
              ? "cyan"
              : "outline"
          }
          className="text-[10px] font-mono uppercase font-bold py-0 px-2"
        >
          {currentUser.role}
        </Badge>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between">
          <span>Role Navigation</span>
          <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase">
            {currentUser.role} scope
          </span>
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
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
                      : item.badgeVariant === "primary"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
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

      {/* Active Context Card */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/30">
        <div className="rounded-xl border border-slate-800/80 p-2.5 bg-slate-950/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Project Context
            </span>
            <span className="text-[9px] text-cyan-400 font-mono">LIVE</span>
          </div>
          <p className="text-xs font-semibold text-slate-100 truncate mt-1">LJ TechFest 2026</p>
          <p className="text-[10px] text-slate-400 truncate mt-0.5">{event.venue}</p>
        </div>
      </div>

      {/* User Profile / Auth State & Role Switching in Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
        <Link href="/auth/role" className="flex items-center gap-2.5 min-w-0 group" title="Change Role or Persona">
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
            <p className="text-[10px] text-slate-400 capitalize font-mono flex items-center gap-1">
              <span>{currentUser.role}</span>
              {currentUser.status && currentUser.status !== "active" && (
                <span className="text-[9px] text-amber-400">({currentUser.status})</span>
              )}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/auth/role"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
            title="Switch Persona / Role"
          >
            <Zap className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
