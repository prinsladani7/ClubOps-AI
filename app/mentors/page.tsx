"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  MapPin,
  Flame,
  Search,
  Plus,
  ArrowRight,
  Filter,
  Check,
  HelpCircle,
  Cpu,
  Sparkles,
  Send,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { HackathonTrack, MentorTicket, MentorTicketPriority, MentorTicketStatus } from "@/types";

const ALL_TRACKS: (HackathonTrack | "ALL")[] = [
  "ALL",
  "AI & Agents",
  "Web3 & DeFi",
  "IoT & Robotics",
  "Open Innovation",
];

const PRESET_TECH_TAGS = [
  "Python",
  "FastAPI",
  "Next.js",
  "TypeScript",
  "PyTorch",
  "Solidity",
  "Solana",
  "Docker",
  "TailwindCSS",
  "OpenCV",
  "Arduino / ESP32",
  "WebSockets",
  "PostgreSQL",
  "C++",
];

export default function MentorHelpQPage() {
  const {
    mentorTickets,
    createMentorTicket,
    claimMentorTicket,
    resolveMentorTicket,
    currentUser,
    showToast,
  } = useClubOps();

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<MentorTicketStatus | "ALL">("ALL");
  const [selectedTrack, setSelectedTrack] = useState<HackathonTrack | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [resolvingTicket, setResolvingTicket] = useState<MentorTicket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Request Form state
  const [teamName, setTeamName] = useState("");
  const [tableLocation, setTableLocation] = useState("Lab 301, Table ");
  const [track, setTrack] = useState<HackathonTrack>("AI & Agents");
  const [selectedTags, setSelectedTags] = useState<string[]>(["Python", "FastAPI"]);
  const [customTag, setCustomTag] = useState("");
  const [issueSummary, setIssueSummary] = useState("");
  const [priority, setPriority] = useState<MentorTicketPriority>("medium");

  // Metrics
  const openTickets = useMemo(() => mentorTickets.filter((t) => t.status === "open"), [mentorTickets]);
  const claimedTickets = useMemo(() => mentorTickets.filter((t) => t.status === "claimed"), [mentorTickets]);
  const resolvedTickets = useMemo(() => mentorTickets.filter((t) => t.status === "resolved"), [mentorTickets]);

  const filteredTickets = useMemo(() => {
    return mentorTickets.filter((ticket) => {
      const matchStatus = selectedStatus === "ALL" || ticket.status === selectedStatus;
      const matchTrack = selectedTrack === "ALL" || ticket.track === selectedTrack;
      const matchQuery =
        searchQuery === "" ||
        ticket.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.table_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.issue_summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.tech_stack.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchStatus && matchTrack && matchQuery;
    });
  }, [mentorTickets, selectedStatus, selectedTrack, searchQuery]);

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (("key" in e && e.key === "Enter") || !("key" in e)) {
      e.preventDefault();
      if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
        setSelectedTags([...selectedTags, customTag.trim()]);
        setCustomTag("");
      }
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !tableLocation.trim() || !issueSummary.trim()) {
      showToast("Please fill in team name, table location, and issue details.");
      return;
    }

    createMentorTicket({
      team_name: teamName.trim(),
      table_location: tableLocation.trim(),
      track,
      tech_stack: selectedTags.length > 0 ? selectedTags : ["General Debugging"],
      issue_summary: issueSummary.trim(),
      priority,
    });

    // Reset
    setShowRequestModal(false);
    setTeamName("");
    setIssueSummary("");
    setTableLocation("Lab 301, Table ");
    setPriority("medium");
  };

  const handleClaim = (ticket: MentorTicket) => {
    claimMentorTicket(
      ticket.id,
      currentUser?.id || "usr-mentor",
      currentUser?.name || "Floating Technical Mentor"
    );
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket) return;
    resolveMentorTicket(resolvingTicket.id, resolutionNotes.trim() || "Assisted at table and resolved issue.");
    setResolvingTicket(null);
    setResolutionNotes("");
  };

  // Helper formatting elapsed time
  const getElapsedMinutes = (isoString: string) => {
    const elapsedMs = Date.now() - new Date(isoString).getTime();
    return Math.max(1, Math.round(elapsedMs / (1000 * 60)));
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Live HelpQ Dispatch Active
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Labs 301–304 On-Call
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <LifeBuoy className="w-8 h-8 text-indigo-400" />
            Mentor HelpQ & Dispatch Center
          </h1>
          <p className="text-slate-400 mt-1 max-w-2xl text-sm leading-relaxed">
            Real-time queue dispatching floating technical mentors directly to hacker tables. 15-minute timebox rule ensures all 112 teams receive prompt unblocking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            Request Mentor Help
          </button>
          <Link
            href="/war-room"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-sm font-medium transition-all"
          >
            <Flame className="w-4 h-4 text-orange-400" />
            War Room
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-red-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Mentor</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white">{openTickets.length} Tickets</div>
          <p className="text-xs text-red-300 mt-1">
            {openTickets.length > 0 ? "Teams actively waiting at tables" : "Queue currently clear"}
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Dispatched In Progress</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white">{claimedTickets.length} Active</div>
          <p className="text-xs text-amber-300 mt-1">Mentors currently at tables</p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tickets Resolved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{resolvedTickets.length} Resolved</div>
          <p className="text-xs text-emerald-300 mt-1">Teams unblocked successfully</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average SLA</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400">&lt; 8 min</div>
          <p className="text-xs text-slate-400 mt-1">Time from ticket to physical arrival</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/80 border border-slate-800 self-start md:self-auto">
          {(["ALL", "open", "claimed", "resolved"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${
                selectedStatus === st
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {st === "ALL" ? `All (${mentorTickets.length})` : `${st} (${mentorTickets.filter((t) => t.status === st).length})`}
            </button>
          ))}
        </div>

        {/* Track Filter & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value as HackathonTrack | "ALL")}
            className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {ALL_TRACKS.map((t) => (
              <option key={t} value={t}>
                {t === "ALL" ? "All Tracks" : t}
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search table, stack, or issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Ticket List / Grid */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center text-slate-400">
            <LifeBuoy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No Tickets Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No tickets match your active filter criteria. Check back soon or request mentor help if your team needs assistance.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTickets.map((ticket) => {
              const priorityColors: Record<MentorTicketPriority, { border: string; bg: string; text: string }> = {
                urgent: { border: "border-red-500/40", bg: "bg-red-500/10", text: "text-red-400" },
                high: { border: "border-orange-500/40", bg: "bg-orange-500/10", text: "text-orange-400" },
                medium: { border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-400" },
                low: { border: "border-slate-600", bg: "bg-slate-800", text: "text-slate-400" },
              };

              const pStyle = priorityColors[ticket.priority];

              return (
                <div
                  key={ticket.id}
                  className={`rounded-xl border bg-slate-900/50 p-5 flex flex-col justify-between backdrop-blur-sm transition-all ${
                    ticket.status === "open"
                      ? "border-red-500/30 hover:border-red-500/50"
                      : ticket.status === "claimed"
                      ? "border-amber-500/30 hover:border-amber-500/50"
                      : "border-slate-800/80 hover:border-slate-700 opacity-80"
                  }`}
                >
                  <div>
                    {/* Top Row: Location & Priority Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        {ticket.table_location}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${pStyle.border} ${pStyle.bg} ${pStyle.text}`}>
                          {ticket.priority}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            ticket.status === "open"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse"
                              : ticket.status === "claimed"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                    </div>

                    {/* Team & Track */}
                    <div className="mb-2">
                      <h3 className="text-base font-bold text-white">{ticket.team_name}</h3>
                      <span className="text-xs text-indigo-300">{ticket.track}</span>
                    </div>

                    {/* Issue Summary */}
                    <p className="text-sm text-slate-300 mb-4 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 leading-relaxed">
                      {ticket.issue_summary}
                    </p>

                    {/* Tech Stack Pills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {ticket.tech_stack.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700/80"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="border-t border-slate-800/80 pt-3 mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                    <div>
                      {ticket.status === "open" && (
                        <span className="text-red-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          Waiting {getElapsedMinutes(ticket.requested_at)}m
                        </span>
                      )}
                      {ticket.status === "claimed" && (
                        <span className="text-amber-300 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          Claimed by {ticket.claimed_by_mentor_name}
                        </span>
                      )}
                      {ticket.status === "resolved" && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resolved: {ticket.resolution_notes || "Completed"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {ticket.status === "open" && (
                        <button
                          onClick={() => handleClaim(ticket)}
                          className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-sm shadow-indigo-600/20"
                        >
                          Claim & Dispatch
                        </button>
                      )}
                      {ticket.status === "claimed" && (
                        <button
                          onClick={() => {
                            setResolvingTicket(ticket);
                            setResolutionNotes("");
                          }}
                          className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-sm"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: REQUEST MENTOR HELP */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl relative my-8 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-indigo-400" />
                  Request Floating Technical Mentor
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  A mentor will receive your physical table coordinates and walk over within ~8 minutes.
                </p>
              </div>

              <button
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. NeuralVoyage"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Physical Table Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={tableLocation}
                    onChange={(e) => setTableLocation(e.target.value)}
                    placeholder="e.g. Lab 301, Table 7"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Track</label>
                  <select
                    value={track}
                    onChange={(e) => setTrack(e.target.value as HackathonTrack)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="AI & Agents">AI & Agents</option>
                    <option value="Web3 & DeFi">Web3 & DeFi</option>
                    <option value="IoT & Robotics">IoT & Robotics</option>
                    <option value="Open Innovation">Open Innovation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Urgency / Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as MentorTicketPriority)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low (General Advice / Architecture)</option>
                    <option value="medium">Medium (Code Debugging / Syntax)</option>
                    <option value="high">High (Deployment / Library Breaking)</option>
                    <option value="urgent">Urgent (Demo Blocker / Hardware Fail)</option>
                  </select>
                </div>
              </div>

              {/* Tech Stack Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tech Stack (Helps route mentor with matching specialty)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-950/50 rounded-lg border border-slate-800">
                  {PRESET_TECH_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleToggleTag(tag)}
                        className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${
                          isSelected
                            ? "bg-indigo-600 text-white font-bold"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {isSelected && "✓ "}
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={handleAddCustomTag}
                    placeholder="Add other tech tag (e.g. LangChain)..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Issue Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Describe the Issue & What You've Tried *
                </label>
                <textarea
                  rows={3}
                  required
                  value={issueSummary}
                  onChange={(e) => setIssueSummary(e.target.value)}
                  placeholder="e.g. CUDA Out of Memory error in PyTorch training loop on RTX 4090; already set batch_size=1 and tried torch.cuda.empty_cache()."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
                >
                  Dispatch to HelpQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESOLVE TICKET */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-1">Mark Ticket as Resolved</h3>
            <p className="text-xs text-slate-400 mb-4">
              Closing ticket for <span className="text-white font-semibold">{resolvingTicket.team_name}</span> at {resolvingTicket.table_location}.
            </p>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resolution Notes / How was it fixed?
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Fixed CORS middleware headers on FastAPI app and configured allow_origins properly."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30"
                >
                  Confirm & Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
