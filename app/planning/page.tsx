"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Users,
  MapPin,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  ChevronRight,
  ShieldCheck,
  Flame,
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BIT_N_BUILD_36H_TIMELINE, RunOfShowSlot } from "@/lib/algorithms/run-of-show";

export default function HackathonPlanningPage() {
  const { getRunOfShowAnalysis, showToast } = useClubOps();

  const [currentHour, setCurrentHour] = useState(14);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const runOfShow = getRunOfShowAnalysis(currentHour);

  const categories = [
    { id: "ALL", label: "All Phases" },
    { id: "ceremony", label: "Ceremonies" },
    { id: "hacking", label: "Hacking Arena" },
    { id: "catering", label: "Catering & Maggi" },
    { id: "mentoring", label: "Mentoring Rounds" },
    { id: "judging", label: "Judging & Pitches" },
    { id: "ops", label: "Ops & Logistics" },
  ];

  const filteredSlots = BIT_N_BUILD_36H_TIMELINE.filter(
    (slot) => selectedCategory === "ALL" || slot.category === selectedCategory
  );

  const handleExportCSV = () => {
    const headers = [
      "Slot ID",
      "Title",
      "Hour Mark (H+)",
      "Clock Time",
      "Venue",
      "Category",
      "Duration (Min)",
      "Lead Committee",
      "Status",
    ];

    const rows = BIT_N_BUILD_36H_TIMELINE.map((slot) => [
      slot.id,
      `"${slot.title.replace(/"/g, '""')}"`,
      `H+${slot.hourMark}`,
      `"${slot.clockTime}"`,
      `"${slot.venue}"`,
      slot.category,
      slot.durationMinutes,
      `"${slot.leadCommittee}"`,
      slot.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bit_n_build_36h_run_of_show.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Run-of-Show Master CSV exported successfully!");
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold">
              <Clock className="w-3.5 h-3.5" />
              RUN-OF-SHOW MASTER
            </span>
            <span className="text-xs text-slate-400 font-mono">Bit N Build Hackathon 2026</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            36-Hour Master Operations Timeline
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Hour-by-hour operational run-of-show schedule across the Grand Auditorium, Labs 301–304, Dining Hall, and Seminar Halls with automated venue conflict and volunteer fatigue detection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.print();
              }
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print Sheet</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <Link
            href="/war-room"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-aiGlow flex items-center gap-2"
          >
            <span>Live War Room</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Schedule Integrity & Clash Alerts */}
      {runOfShow.clashes.length > 0 && (
        <div className="p-5 rounded-3xl border border-rose-500/40 bg-rose-950/20 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Algorithmic Timeline Conflict & Fatigue Warnings ({runOfShow.clashes.length})</span>
            </h3>
            <span className="text-xs font-mono font-bold text-rose-300">
              Integrity Score: {runOfShow.timelineIntegrityScore}/100
            </span>
          </div>

          <div className="space-y-2">
            {runOfShow.clashes.map((clash, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-rose-500/30 bg-slate-950/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">{clash.message}</p>
                  <p className="text-slate-400 text-[11px]">{clash.resolution}</p>
                </div>
                <Badge variant={clash.severity === "CRITICAL" ? "destructive" : "warning"} className="text-[10px] font-mono">
                  {clash.severity}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredSlots.length} of {BIT_N_BUILD_36H_TIMELINE.length} Milestones
        </div>
      </div>

      {/* 36-Hour Timeline Visual Stream */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-800 space-y-8 my-4">
        {filteredSlots.map((slot) => {
          const isPassed = slot.hourMark + slot.durationMinutes / 60 <= currentHour;
          const isCurrent = slot.hourMark <= currentHour && slot.hourMark + slot.durationMinutes / 60 > currentHour;

          return (
            <div key={slot.id} className="relative group">
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isCurrent
                    ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-pulse"
                    : isPassed
                    ? "bg-slate-900 border-emerald-500/80 text-emerald-400"
                    : "bg-slate-950 border-slate-700 text-slate-500"
                }`}
              >
                {isPassed ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span className="text-[10px] font-mono font-bold">{slot.hourMark}</span>
                )}
              </div>

              {/* Slot Card */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  isCurrent
                    ? "border-indigo-500/60 bg-gradient-to-r from-indigo-950/40 to-slate-900/60 shadow-aiGlow"
                    : isPassed
                    ? "border-slate-800/80 bg-slate-900/30 opacity-80"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      Hour {slot.hourMark.toString().padStart(2, "0")}:00
                    </span>
                    <span className="text-xs text-slate-400 font-mono">({slot.clockTime})</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {slot.category}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400">Duration: {slot.durationMinutes} mins</span>
                    {slot.avRequired && (
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px]">
                        AV Required
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{slot.title}</span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold animate-pulse">
                        CURRENTLY LIVE
                      </span>
                    )}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">{slot.description}</p>

                  <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300 font-medium">{slot.venue}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{slot.leadCommittee}</span>
                      <span className="text-indigo-400 font-semibold">({slot.leadVolunteerName})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
