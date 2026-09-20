"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Award,
  Trophy,
  Scale,
  Sparkles,
  ExternalLink,
  Github,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Filter,
  Search,
  Star,
  Users,
  MapPin,
  Flame,
  BarChart3,
  HelpCircle,
  UserCheck,
  Plus,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { HackathonTrack, JudgingTeam } from "@/types";
import { computeJudgeProfiles, computeWeightedScore } from "@/lib/algorithms/judging-normalizer";

const ALL_TRACKS: (HackathonTrack | "ALL")[] = [
  "ALL",
  "AI & Agents",
  "Web3 & DeFi",
  "IoT & Robotics",
  "Open Innovation",
];

export default function JudgingExpoPage() {
  const {
    judgingTeams,
    submitJudgeScore,
    getNormalizedLeaderboard,
    createJudgingTeam,
    currentUser,
    showToast,
  } = useClubOps();

  const [selectedTrack, setSelectedTrack] = useState<HackathonTrack | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState<"leaderboard" | "directory" | "calibration">("leaderboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [evaluatingTeam, setEvaluatingTeam] = useState<JudgingTeam | null>(null);

  // Evaluation form state
  const [judgeName, setJudgeName] = useState(currentUser?.name || "Judge Floor Evaluator");
  const [technicalDepth, setTechnicalDepth] = useState(8);
  const [innovation, setInnovation] = useState(8);
  const [impactViability, setImpactViability] = useState(8);
  const [demoPresentation, setDemoPresentation] = useState(8);
  const [feedbackNotes, setFeedbackNotes] = useState("");

  // Registration modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regTeamName, setRegTeamName] = useState("");
  const [regProjectTitle, setRegProjectTitle] = useState("");
  const [regTrack, setRegTrack] = useState<HackathonTrack>("AI & Agents");
  const [regTableLocation, setRegTableLocation] = useState("Lab 301, Table 1");
  const [regMemberCount, setRegMemberCount] = useState(4);
  const [regGithubUrl, setRegGithubUrl] = useState("https://github.com/");
  const [regDemoUrl, setRegDemoUrl] = useState("");

  const handleRegisterTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regTeamName.trim() || !regProjectTitle.trim()) return;

    createJudgingTeam({
      team_name: regTeamName.trim(),
      project_title: regProjectTitle.trim(),
      track: regTrack,
      table_location: regTableLocation.trim(),
      member_count: Number(regMemberCount),
      github_url: regGithubUrl.trim(),
      demo_url: regDemoUrl.trim() || undefined,
    });

    setIsRegisterModalOpen(false);
    setRegTeamName("");
    setRegProjectTitle("");
    setRegDemoUrl("");
  };

  // Normalized leaderboard computed reactively
  const leaderboard = useMemo(() => {
    const trackFilter = selectedTrack === "ALL" ? undefined : selectedTrack;
    return getNormalizedLeaderboard(trackFilter);
  }, [selectedTrack, getNormalizedLeaderboard, judgingTeams]);

  // Filtered directory
  const filteredTeams = useMemo(() => {
    return judgingTeams.filter((team) => {
      const matchesTrack = selectedTrack === "ALL" || team.track === selectedTrack;
      const matchesQuery =
        searchQuery === "" ||
        team.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.table_location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTrack && matchesQuery;
    });
  }, [judgingTeams, selectedTrack, searchQuery]);

  // Judge profile calibrations
  const judgeProfiles = useMemo(() => {
    return computeJudgeProfiles(judgingTeams);
  }, [judgingTeams]);

  // Preview weighted score for current modal inputs
  const currentModalWeightedScore = useMemo(() => {
    return computeWeightedScore({
      judge_id: currentUser?.id || "usr-evaluator",
      judge_name: judgeName,
      technical_depth: technicalDepth,
      innovation: innovation,
      impact_viability: impactViability,
      demo_presentation: demoPresentation,
      submitted_at: "",
    });
  }, [technicalDepth, innovation, impactViability, demoPresentation, judgeName, currentUser]);

  const handleOpenEvaluationModal = (team: JudgingTeam) => {
    setEvaluatingTeam(team);
    // If current user already evaluated this team, pre-fill values
    const existing = team.scores.find(
      (s) => s.judge_name === currentUser?.name || s.judge_id === currentUser?.id
    );
    if (existing) {
      setTechnicalDepth(existing.technical_depth);
      setInnovation(existing.innovation);
      setImpactViability(existing.impact_viability);
      setDemoPresentation(existing.demo_presentation);
      setFeedbackNotes(existing.feedback_notes || "");
    } else {
      setTechnicalDepth(8);
      setInnovation(8);
      setImpactViability(8);
      setDemoPresentation(8);
      setFeedbackNotes("");
    }
  };

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingTeam) return;

    submitJudgeScore(evaluatingTeam.id, {
      judge_id: currentUser?.id || "usr-judge-eval",
      judge_name: judgeName.trim() || currentUser?.name || "Official Evaluator",
      technical_depth: Number(technicalDepth),
      innovation: Number(innovation),
      impact_viability: Number(impactViability),
      demo_presentation: Number(demoPresentation),
      feedback_notes: feedbackNotes.trim() || undefined,
    });

    setEvaluatingTeam(null);
  };

  const handleExportCSV = () => {
    const headers = [
      "Rank",
      "Team Name",
      "Project Title",
      "Track",
      "Table Location",
      "Evaluations Count",
      "Raw Score (0-10)",
      "Z-Normalized Score (0-100)",
      "Medal",
    ];

    const rows = leaderboard.map((e) => [
      e.rank,
      `"${e.team_name.replace(/"/g, '""')}"`,
      `"${e.project_title.replace(/"/g, '""')}"`,
      `"${e.track}"`,
      `"${e.table_location}"`,
      e.scores_count,
      e.raw_average.toFixed(1),
      e.normalized_score,
      e.medal ? e.medal.toUpperCase() : "N/A",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bit_n_build_judging_leaderboard_${selectedTrack.toLowerCase().replace(/ & /g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Judging ceremony CSV exported successfully!");
  };

  const totalEvaluationsCount = useMemo(() => {
    return judgingTeams.reduce((sum, t) => sum + t.scores.length, 0);
  }, [judgingTeams]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Expo Floor Active
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Gavel Z-Score Calibration
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Scale className="w-8 h-8 text-indigo-400" />
            Project Expo & Judging Portal
          </h1>
          <p className="text-slate-400 mt-1 max-w-2xl text-sm leading-relaxed">
            Standardized multi-criteria evaluation with HackMIT Gavel-inspired Z-score normalization. Eliminates harsh/lenient judge bias to ensure fair awards across all 112 hacker teams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            Register Expo Project
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-sm font-medium transition-all shadow-sm hover:border-slate-600"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export Ceremony CSV
          </button>

          <Link
            href="/war-room"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-sm font-medium transition-all"
          >
            <Flame className="w-4 h-4 text-indigo-400" />
            War Room Sync
          </Link>
        </div>
      </div>

      {/* High-Level Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Expo Projects</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{judgingTeams.length} Teams</div>
          <p className="text-xs text-slate-400 mt-1">4 tracks across Labs 301–304</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Evaluations</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalEvaluationsCount} Scores</div>
          <p className="text-xs text-slate-400 mt-1">
            Avg {(totalEvaluationsCount / Math.max(1, judgingTeams.length)).toFixed(1)} reviews per team
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Calibration</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">80% Z + 20% Raw</div>
          <p className="text-xs text-slate-400 mt-1">Variance normalized across {Object.keys(judgeProfiles).length} judges</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Leaderboard Quality</span>
            <Trophy className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {leaderboard[0] ? `${leaderboard[0].normalized_score}/100` : "Ready"}
          </div>
          <p className="text-xs text-slate-400 mt-1 truncate">
            {leaderboard[0] ? `Top: ${leaderboard[0].team_name}` : "Awaiting evaluations"}
          </p>
        </div>
      </div>

      {/* Filter and Tab Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Track Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {ALL_TRACKS.map((track) => (
            <button
              key={track}
              onClick={() => setSelectedTrack(track)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTrack === track
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {track === "ALL" ? "All Tracks" : track}
            </button>
          ))}
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/80 border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "leaderboard"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Live Leaderboard
          </button>
          <button
            onClick={() => setActiveTab("directory")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "directory"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Expo Directory ({filteredTeams.length})
          </button>
          <button
            onClick={() => setActiveTab("calibration")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "calibration"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Judge Biases ({Object.keys(judgeProfiles).length})
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE NORMALIZED LEADERBOARD */}
      {activeTab === "leaderboard" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-slate-300">
              Rankings dynamically updated via Z-Score Normalization ({leaderboard.length} eligible teams)
            </div>
            <span className="text-xs text-slate-500">Formula: Z = (Raw - Mean) / StdDev</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4 w-16">Rank</th>
                    <th className="py-3.5 px-4">Team & Project</th>
                    <th className="py-3.5 px-4">Track</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4 text-center">Reviews</th>
                    <th className="py-3.5 px-4 text-right">Raw Avg (10)</th>
                    <th className="py-3.5 px-4 text-right">Normalized (100)</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <Award className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-300">No teams on the leaderboard yet</p>
                        <p className="text-xs text-slate-500 mt-1">Register teams or submit judge scores to dynamically populate rankings.</p>
                        <button
                          onClick={() => setIsRegisterModalOpen(true)}
                          className="mt-3 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                        >
                          Register Expo Team
                        </button>
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((entry) => {
                      const originalTeam = judgingTeams.find((t) => t.id === entry.team_id);
                      return (
                      <tr
                        key={entry.team_id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-bold">
                          {entry.medal === "gold" && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-sm">
                              🥇
                            </span>
                          )}
                          {entry.medal === "silver" && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300/20 text-slate-300 border border-slate-300/40 text-sm">
                              🥈
                            </span>
                          )}
                          {entry.medal === "bronze" && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-500 border border-amber-600/40 text-sm">
                              🥉
                            </span>
                          )}
                          {!entry.medal && (
                            <span className="text-slate-500 pl-2">#{entry.rank}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                            {entry.team_name}
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-xs md:max-w-md">
                            {entry.project_title}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-indigo-300 border border-slate-700">
                            {entry.track}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400 flex items-center gap-1 mt-2.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {entry.table_location}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              entry.scores_count >= 2
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : entry.scores_count === 1
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-slate-800 text-slate-500"
                            }`}
                          >
                            {entry.scores_count} judge{entry.scores_count === 1 ? "" : "s"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                          {entry.raw_average > 0 ? entry.raw_average.toFixed(1) : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`font-mono font-bold text-base ${
                              entry.normalized_score >= 90
                                ? "text-yellow-400"
                                : entry.normalized_score >= 80
                                ? "text-emerald-400"
                                : entry.normalized_score > 0
                                ? "text-indigo-400"
                                : "text-slate-500"
                            }`}
                          >
                            {entry.normalized_score > 0 ? entry.normalized_score : "Pending"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {originalTeam && (
                            <button
                              onClick={() => handleOpenEvaluationModal(originalTeam)}
                              className="px-3 py-1 rounded-md text-xs font-semibold bg-indigo-600/80 hover:bg-indigo-600 text-white transition-all shadow-sm"
                            >
                              Evaluate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPO FLOOR PROJECT DIRECTORY */}
      {activeTab === "directory" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search team, project, or table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="text-xs text-slate-400 self-end sm:self-auto">
              Showing {filteredTeams.length} of {judgingTeams.length} registered expo teams
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTeams.length === 0 ? (
              <div className="col-span-full p-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-bold text-white">No expo teams found</h3>
                  <p className="text-xs text-slate-400">
                    {searchQuery ? "Try refining your search terms or track filter." : "Register the first team presenting on the floor to begin evaluations."}
                  </p>
                </div>
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Register Expo Project
                </button>
              </div>
            ) : (
              filteredTeams.map((team) => (
                <div
                  key={team.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-all flex flex-col justify-between p-5 backdrop-blur-sm group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {team.track}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {team.table_location}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {team.team_name}
                    </h3>
                    <p className="text-sm font-medium text-slate-300 mt-1 mb-3">
                      {team.project_title}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {team.member_count} Hackers
                      </span>
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        {team.scores.length} Review{team.scores.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {/* External Links */}
                    <div className="flex items-center gap-3 mb-4">
                      {team.github_url && (
                        <a
                          href={team.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                          <Github className="w-3.5 h-3.5" />
                          Source Code
                        </a>
                      )}
                      {team.demo_url && (
                        <a
                          href={team.demo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Live Demo
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Score Summary & Evaluate Action */}
                  <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Evaluations</div>
                      <div className="text-sm font-semibold text-white">
                        {team.scores.length > 0 ? (
                          <span className="text-emerald-400">
                            {(
                              team.scores.reduce((sum, s) => sum + computeWeightedScore(s), 0) /
                              team.scores.length
                            ).toFixed(1)}{" "}
                            / 10
                          </span>
                        ) : (
                          <span className="text-slate-500">Unreviewed</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEvaluationModal(team)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm shadow-indigo-600/20"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Score Team
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: JUDGE BIAS & CALIBRATION INSPECTOR */}
      {activeTab === "calibration" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs text-indigo-300 flex items-start gap-3">
            <Scale className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-1">How Gavel Calibration Works</span>
              Every judge exhibits subjective bias (some rarely award above 7, others give 9s freely). The Z-Score formula computes each judge's mean (μⱼ) and standard deviation (σⱼ). Scores are transformed into standard deviation offsets, then mapped to a canonical 0–100 scale.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(judgeProfiles).length === 0 ? (
              <div className="col-span-full p-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-3">
                <Scale className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No judge calibration data recorded</h4>
                <p className="text-xs text-slate-400">
                  Judges will be calibrated dynamically once evaluations begin across floor tables.
                </p>
              </div>
            ) : (
              Object.values(judgeProfiles).map((profile) => {
                const biasTag =
                  profile.mean > 8.5
                    ? { label: "Lenient / Generous", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" }
                    : profile.mean < 7.2
                    ? { label: "Strict / Harsh", color: "text-red-400 bg-red-400/10 border-red-400/20" }
                    : { label: "Balanced / Centered", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" };

              return (
                <div
                  key={profile.judgeId}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-base">{profile.judgeName}</h4>
                      <p className="text-xs text-slate-400">ID: {profile.judgeId}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${biasTag.color}`}>
                      {biasTag.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 text-center">
                    <div>
                      <div className="text-xs text-slate-500">Evals</div>
                      <div className="text-base font-bold text-white">{profile.evalCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Mean (μ)</div>
                      <div className="text-base font-mono font-bold text-indigo-400">
                        {profile.mean.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">StdDev (σ)</div>
                      <div className="text-base font-mono font-bold text-slate-300">
                        {profile.stdDev.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>
      )}

      {/* MODAL: EVALUATION & RUBRIC SCORING */}
      {evaluatingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl relative my-8 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-5">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {evaluatingTeam.track} • {evaluatingTeam.table_location}
                </span>
                <h3 className="text-xl font-bold text-white mt-1.5">{evaluatingTeam.team_name}</h3>
                <p className="text-xs text-slate-400">{evaluatingTeam.project_title}</p>
              </div>

              <button
                onClick={() => setEvaluatingTeam(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Judge / Evaluator Identity
                </label>
                <input
                  type="text"
                  value={judgeName}
                  onChange={(e) => setJudgeName(e.target.value)}
                  required
                  placeholder="e.g. Dr. Jane Smith (AI Track Lead)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Rubric Criterion 1 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    1. Technical Depth & Architecture (Weight: 30%)
                  </span>
                  <span className="font-mono font-bold text-indigo-400">{technicalDepth} / 10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={technicalDepth}
                  onChange={(e) => setTechnicalDepth(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <p className="text-xs text-slate-500">
                  Code complexity, system design, robust error handling, algorithmic soundness.
                </p>
              </div>

              {/* Rubric Criterion 2 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    2. Innovation & Originality (Weight: 25%)
                  </span>
                  <span className="font-mono font-bold text-indigo-400">{innovation} / 10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={innovation}
                  onChange={(e) => setInnovation(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <p className="text-xs text-slate-500">
                  Novel angle, uniqueness of concept, ambitious problem statement.
                </p>
              </div>

              {/* Rubric Criterion 3 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    3. Impact & Market Viability (Weight: 25%)
                  </span>
                  <span className="font-mono font-bold text-indigo-400">{impactViability} / 10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={impactViability}
                  onChange={(e) => setImpactViability(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <p className="text-xs text-slate-500">
                  Practical utility, target demographic value, realistic deployment potential.
                </p>
              </div>

              {/* Rubric Criterion 4 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    4. Demo & Presentation (Weight: 20%)
                  </span>
                  <span className="font-mono font-bold text-indigo-400">{demoPresentation} / 10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={demoPresentation}
                  onChange={(e) => setDemoPresentation(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <p className="text-xs text-slate-500">
                  Working live software demonstration, communication clarity, crisp Q&A.
                </p>
              </div>

              {/* Feedback notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Qualitative Feedback & Commendations (Optional)
                </label>
                <textarea
                  rows={2}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Strong API architecture; recommend improving UI latency before final demo."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Real-time score preview bar */}
              <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                <span className="text-xs text-slate-300">Computed Weighted Raw Score:</span>
                <span className="text-base font-mono font-bold text-emerald-400">
                  {currentModalWeightedScore.toFixed(2)} / 10.0
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEvaluatingTeam(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30"
                >
                  Save & Calibrate Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER EXPO PROJECT */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl relative my-8 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-5">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Bit N Build Expo Floor 2026
                </span>
                <h3 className="text-xl font-bold text-white mt-1.5">Register Expo Hacker Project</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Add project details and physical table location to enable judge evaluation rounds.
                </p>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterTeam} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NeuralCrew, PulseChain"
                  value={regTeamName}
                  onChange={(e) => setRegTeamName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Real-Time Autonomous Agent Swarm"
                  value={regProjectTitle}
                  onChange={(e) => setRegProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Hackathon Track *</label>
                  <select
                    value={regTrack}
                    onChange={(e) => setRegTrack(e.target.value as HackathonTrack)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="AI & Agents">AI & Agents</option>
                    <option value="Web3 & DeFi">Web3 & DeFi</option>
                    <option value="IoT & Robotics">IoT & Robotics</option>
                    <option value="Open Innovation">Open Innovation</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Table Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lab 301, Table 4"
                    value={regTableLocation}
                    onChange={(e) => setRegTableLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Member Count</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={regMemberCount}
                    onChange={(e) => setRegMemberCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">GitHub Repo URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/org/repo"
                    value={regGithubUrl}
                    onChange={(e) => setRegGithubUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Live Demo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://my-demo-app.vercel.app"
                  value={regDemoUrl}
                  onChange={(e) => setRegDemoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
