"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BellRing,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MailOpen,
  Check,
  Filter,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function VolunteerNotificationsPage() {
  const { notifications, markRead, showToast } = useClubOps();
  const [filterType, setFilterType] = useState("all");

  const filtered = notifications.filter((n) => {
    if (filterType === "all") return true;
    if (filterType === "unread") return !n.read_at;
    return n.type === filterType;
  });

  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      if (!n.read_at) markRead(n.id);
    });
    showToast("All notifications marked as read.");
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/volunteer/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Volunteer Dashboard
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-mono text-cyan-400 font-semibold">Notifications</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Notification Center & Operational Alerts
          </h1>
          <p className="text-xs text-slate-400">
            Real-time feed of task assignments, deadline reminders, deliverable reviews, and announcements.
          </p>
        </div>

        <Button
          onClick={handleMarkAllRead}
          variant="outline"
          className="text-xs border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5"
        >
          <MailOpen className="w-3.5 h-3.5" />
          <span>Mark All Read</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800/60">
        {[
          { id: "all", label: "All Alerts", count: notifications.length },
          { id: "unread", label: "Unread", count: notifications.filter((n) => !n.read_at).length },
          { id: "task", label: "Tasks & Deliverables", count: notifications.filter((n) => n.type === "task").length },
          { id: "announcement", label: "Announcements", count: notifications.filter((n) => n.type === "announcement").length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filterType === tab.id
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400 space-y-2">
            <BellRing className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">No notifications found.</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all ${
                !n.read_at
                  ? "bg-slate-900/90 border-cyan-500/40 ring-1 ring-cyan-500/10"
                  : "bg-slate-900/40 border-slate-800"
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={!n.read_at ? "cyan" : "outline"} className="text-[9px] font-mono uppercase">
                    {n.type}
                  </Badge>
                  <h3 className="font-bold text-white text-xs">{n.title}</h3>
                </div>
                <p className="text-xs text-slate-300">{n.body}</p>
                <span className="text-[10px] text-slate-500 font-mono block pt-1">
                  {new Date(n.created_at).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {!n.read_at && (
                <button
                  onClick={() => markRead(n.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors flex-shrink-0"
                  title="Mark as Read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
