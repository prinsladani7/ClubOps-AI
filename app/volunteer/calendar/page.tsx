"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Shield,
  Save,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function VolunteerCalendarPage() {
  const { currentUser, tasks, event, showToast } = useClubOps();

  const myTasks = tasks.filter((t) => t.owner_id === currentUser.id);

  // Availability schedule
  const [schedule, setSchedule] = useState([
    { day: "Monday", slot: "16:00 - 20:00", status: "available" },
    { day: "Tuesday", slot: "16:00 - 20:00", status: "available" },
    { day: "Wednesday", slot: "All Day", status: "busy" },
    { day: "Thursday", slot: "16:00 - 20:00", status: "available" },
    { day: "Friday", slot: "14:00 - 22:00", status: "available" },
    { day: "Saturday", slot: "All Day (Event Setup)", status: "available" },
    { day: "Sunday", slot: "Morning Only", status: "unavailable" },
  ]);

  const handleSaveSchedule = () => {
    showToast("Availability schedule recorded to centralized operations database.");
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
            <span className="text-xs font-mono text-cyan-400 font-semibold">Calendar</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Assigned Deadlines & Availability Schedule
          </h1>
          <p className="text-xs text-slate-400">
            Declare your active bandwidth to prevent accidental assignment during exam or class periods.
          </p>
        </div>

        <Button
          onClick={handleSaveSchedule}
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-md"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Availability</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upcoming Task Deadlines */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Upcoming Deliverable Deadlines</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">{myTasks.length} Assigned</span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {myTasks.length === 0 ? (
              <p className="text-xs text-slate-500">No scheduled tasks.</p>
            ) : (
              myTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-white">{t.title}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Due: {new Date(t.due_at).toLocaleDateString()} ({t.estimated_hours || 4} hrs effort)
                    </p>
                  </div>
                  <Badge variant={t.status === "completed" ? "cyan" : "outline"} className="text-[10px] font-mono capitalize">
                    {t.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Availability Schedule Matrix */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Weekly Availability Schedule</h2>
            </div>
            <span className="text-xs text-emerald-400 font-mono">Live Sync</span>
          </div>

          <div className="space-y-2">
            {schedule.map((slot, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-white">{slot.day}</span>
                  <p className="text-[11px] text-slate-400 font-mono">{slot.slot}</p>
                </div>

                <select
                  value={slot.status}
                  onChange={(e) => {
                    const next = [...schedule];
                    next[idx].status = e.target.value;
                    setSchedule(next);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-900 border ${
                    slot.status === "available"
                      ? "text-emerald-400 border-emerald-500/40"
                      : slot.status === "busy"
                      ? "text-amber-400 border-amber-500/40"
                      : "text-rose-400 border-rose-500/40"
                  }`}
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy / Partial</option>
                  <option value="unavailable">Unavailable (Exams/Classes)</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
