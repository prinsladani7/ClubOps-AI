"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  Radio,
  Wifi,
  Zap,
  Coffee,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  Shield,
  Send,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  Server,
  Layers,
  HelpCircle,
  RefreshCw,
  BellRing,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HackathonWarRoomPage() {
  const {
    currentUser,
    tasks,
    volunteers,
    risks,
    auditLogs,
    resolveTaskBlocker,
    showToast,
    getRunOfShowAnalysis,
    getHackathonRiskReport,
  } = useClubOps();

  const [currentHour, setCurrentHour] = useState(14);
  const [selectedTrack, setSelectedTrack] = useState<"ALL" | "AI_ML" | "WEB3" | "FINTECH">("ALL");
  const [quickBroadcastMsg, setQuickBroadcastMsg] = useState("");
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Compute live algorithmic reports
  const runOfShow = getRunOfShowAnalysis(currentHour);
  const riskReport = getHackathonRiskReport();

  const blockedTasks = tasks.filter((t) => t.is_blocked || t.status === "blocked");
  const activeTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "done");

  const handleResolveBlocker = (taskId: string, title: string) => {
    resolveTaskBlocker(taskId, "Resolved on-site by War Room floor lead.");
    showToast(`Blocker resolved for: "${title}"`);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBroadcastMsg.trim()) return;
    showToast(`Broadcast sent to Hacker Discord & Main Hall Screens: "${quickBroadcastMsg.slice(0, 40)}..."`);
    setQuickBroadcastMsg("");
    setShowBroadcastModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top War-Room Mission Header */}
      <div className="relative p-6 sm:p-8 rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-slate-950 to-indigo-950/30 backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold tracking-wider animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                LIVE MISSION CONTROL
              </span>
              <Badge variant="outline" className="font-mono text-xs text-slate-300 border-slate-700">
                BIT N BUILD HACKATHON 2026
              </Badge>
              <span className="text-xs text-slate-400 font-mono">LJ University Campus Arena</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>War Room Operations Triage</span>
              <span className="text-base sm:text-lg font-mono px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-700 text-indigo-300 font-normal">
                T-PLUS: 14h 22m / 36h
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time telemetry and incident command for 450 national participants, 112 hacker teams, 24 industry mentors, and 12 corporate sponsor booths across Labs 301–304 and the Grand Auditorium.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setShowBroadcastModal(true)}
              className="bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-aiGlow text-xs font-bold px-4 py-2 flex items-center gap-2"
            >
              <BellRing className="w-4 h-4" />
              <span>Broadcast to Hackers</span>
            </Button>

            <Link
              href="/algorithms"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Algorithm Sandbox</span>
            </Link>

            <Link
              href="/planning"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>36h Schedule</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Critical Vitals Grid (Hardware, WiFi, Power, Catering, Hackers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hacker Check-in Status */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">Hacker Teams Live</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-white font-mono">112</span>
              <span className="text-xs text-slate-400 ml-1.5">/ 112 Teams</span>
            </div>
            <Badge variant="cyan" className="text-[10px] font-mono">
              450 HACKERS
            </Badge>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Devfolio API QR Check-in</span>
            <span className="text-emerald-400 font-bold">100% Synced</span>
          </div>
        </div>

        {/* Campus Network Mesh */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">WiFi & LAN Arena Mesh</span>
            <Wifi className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-white font-mono">4.8</span>
              <span className="text-xs text-slate-400 ml-1.5">Gbps Aggregate</span>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-semibold">0 Dropouts</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Ubiquiti UniFi U6-Pro APs</span>
            <span className="text-slate-300 font-mono">18 APs Online</span>
          </div>
        </div>

        {/* Power Distribution Arena */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">Coding Arena Power</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-white font-mono">232</span>
              <span className="text-xs text-slate-400 ml-1.5">Volts Nominal</span>
            </div>
            <span className="text-xs text-amber-400 font-mono font-semibold">UPS Backup Ready</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Labs 301–304 Strips</span>
            <span className="text-slate-300 font-mono">112 Benches Live</span>
          </div>
        </div>

        {/* Midnight Catering Countdown */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider">Midnight Catering</span>
            <Coffee className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-rose-400 font-mono">01:00 AM</span>
              <span className="text-xs text-slate-400 ml-1.5">Target</span>
            </div>
            <Badge variant="destructive" className="text-[10px] font-mono">
              STAGE 17
            </Badge>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>500 Maggi & Red Bull</span>
            <span className="text-amber-300 font-mono">Cafeteria Primed</span>
          </div>
        </div>
      </div>

      {/* Main War-Room 2-Column Command Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2-Columns: Live Incident Triage & Critical Blockers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Phase Banner */}
          <div className="p-5 rounded-2xl border border-indigo-500/30 bg-slate-900/60 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono text-emerald-400 uppercase font-bold tracking-wider">
                  Current Run-of-Show Phase
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {runOfShow.activeSlot?.title || "Hacking Arena Round 1 & Technical Scrimmage"}
              </h2>
              <p className="text-xs text-slate-400">
                Venue: <span className="text-slate-200 font-semibold">{runOfShow.activeSlot?.venue}</span> | Lead Coordinator: <span className="text-indigo-300 font-semibold">{runOfShow.activeSlot?.leadVolunteerName || "Rahul Sharma"}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/planning"
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <span>View Full Schedule</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Critical Blockers Triage Desk */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-500" />
                  <span>Critical Blockers & Incident Escalation Queue</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Impediments flagged by floor leads requiring immediate coordinator intervention.
                </p>
              </div>

              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                {blockedTasks.length} Active Incidents
              </span>
            </div>

            {blockedTasks.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-semibold text-white">All Operational Pipelines Flowing</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Zero active blockers reported across Tech, Hospitality, AV, or Judging committees.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {blockedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl border border-rose-500/40 bg-rose-950/20 hover:border-rose-500/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-[10px] font-mono uppercase">
                          {task.escalation_level || "ORGANIZER"} ESCALATION
                        </Badge>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ID: {task.id}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{task.title}</h4>
                      <p className="text-xs text-rose-300 font-medium">
                        🚨 <span className="underline font-semibold">Blocker:</span> {task.blocker_reason || "Critical dependency stalled by external vendor or venue delay."}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Assigned Lead: <span className="text-slate-300 font-medium">{volunteers.find(v => v.user_id === task.owner_id)?.user?.name || "Floor Volunteer"}</span> | Deadline: {new Date(task.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleResolveBlocker(task.id, task.title)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve Blocker</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Track Operations Breakdown */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Hackathon Tracks & Mentor Deployment</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Monitoring team progress across the 4 primary tracks.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                {(["ALL", "AI_ML", "WEB3", "FINTECH"] as const).map((trk) => (
                  <button
                    key={trk}
                    onClick={() => setSelectedTrack(trk)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      selectedTrack === trk
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {trk === "ALL" ? "All Tracks" : trk.replace("_", "/")}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-indigo-300">AI / Machine Learning</span>
                  <span className="font-mono">42 Teams</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: "88%" }} />
                </div>
                <p className="text-[11px] text-slate-400">
                  Mentor Lead: Dev Joshi | 8 Mentors Active
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-cyan-300">Web3 & Decentralized</span>
                  <span className="font-mono">38 Teams</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: "75%" }} />
                </div>
                <p className="text-[11px] text-slate-400">
                  Polygon / zkEVM Sandbox | 7 Mentors Active
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-emerald-300">FinTech & Open Innovation</span>
                  <span className="font-mono">32 Teams</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "92%" }} />
                </div>
                <p className="text-[11px] text-slate-400">
                  Account Aggregator APIs | 9 Mentors Active
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1-Column: Live Event Log & Contingency Status */}
        <div className="space-y-6">
          {/* Contingency Playbooks Status */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Active Contingency Protocols</span>
              </h3>
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                STANDBY
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              {riskReport.contingencyPlaybooks.map((cpg) => (
                <div
                  key={cpg.threatId}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{cpg.title}</span>
                    <span className="text-[10px] font-mono text-indigo-400">{cpg.leadCommittee}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{cpg.trigger}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Real-Time Immutable Audit Log Stream */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>Live Floor Telemetry Stream</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Auto-syncing</span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {auditLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl border border-slate-800/60 bg-slate-950/40 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-indigo-400 font-semibold">{log.action}</span>
                    <span className="text-slate-500 text-[10px]">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{log.resource || log.entity_type}</p>
                  <p className="text-slate-500 text-[10px] font-mono">Actor: {log.actor_role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="max-w-lg w-full p-6 rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BellRing className="w-5 h-5 text-rose-400" />
                <span>Emergency Broadcast to Hacker Arena</span>
              </h3>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              This will immediately send an alert to the participant Discord announcements channel, push notification to volunteer mobile clients, and flash on the auditorium main screens.
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <textarea
                value={quickBroadcastMsg}
                onChange={(e) => setQuickBroadcastMsg(e.target.value)}
                placeholder="e.g., Midnight Maggi service starting in Cafeteria at 01:00 AM! Please collect food passes from Desk 2."
                className="w-full h-28 p-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />

              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBroadcastModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Broadcast Now
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
