"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Clock,
  Briefcase,
  AlertTriangle,
  ArrowRight,
  Filter,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { WorkloadGauge } from "@/components/ui/WorkloadGauge";
import { useVolunteerRebalance } from "@/lib/hooks/useVolunteerRebalance";
import { Volunteer } from "@/types";
import { db } from "@/lib/db";

export default function VolunteersPage() {
  const { volunteers, tasks, currentUser, updateTaskItem, showToast } = useClubOps();
  const { recommendations } = useVolunteerRebalance(volunteers, tasks);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterAvailability, setFilterAvailability] = useState<string>("all");
  const [activeVolunteer, setActiveVolunteer] = useState<Volunteer | null>(null);

  // AI Assignment Recommendation modal
  const [showAiSuggestModal, setShowAiSuggestModal] = useState(false);
  const [showRebalanceModal, setShowRebalanceModal] = useState(false);
  const [taskQuery, setTaskQuery] = useState("Setup 40kVA standby diesel generator and circuit transfer switch");
  const [aiSuggestions, setAiSuggestions] = useState<
    { volunteer: Volunteer; score: number; rationale: string }[]
  >([]);

  const filteredVolunteers = volunteers.filter((vol) => {
    if (filterAvailability !== "all" && vol.availability !== filterAvailability) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = vol.user?.name.toLowerCase().includes(q);
      const skillMatch = vol.skills.some((s) => s.toLowerCase().includes(q));
      return nameMatch || skillMatch;
    }
    return true;
  });

  const handleRunAiSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskQuery.trim()) return;

    const keywords = taskQuery.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const results = db.suggestVolunteersForTask(taskQuery, keywords);
    setAiSuggestions(results.slice(0, 4));
  };

  const executeRebalance = (rec: typeof recommendations[0]) => {
    updateTaskItem(rec.taskToReassign.id, {
      owner_id: rec.suggestedVolunteer.id,
      owner: rec.suggestedVolunteer.user,
    });
    showToast(
      `Reassigned "${rec.taskToReassign.title}" from ${rec.overloadedVolunteer.user?.name} to ${rec.suggestedVolunteer.user?.name}`
    );
    setShowRebalanceModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
            <span>Personnel Telemetry</span>
            <span>•</span>
            <span>24 Active Committee Leads</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 mt-0.5">
            <Users className="w-6 h-6 text-indigo-400" />
            <span>Volunteer & Personnel Workload Intelligence</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracking student committee leads across technical, hospitality, stage, and logistics tracks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {recommendations.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRebalanceModal(true)}
              className="gap-2 text-xs h-9 border-amber-500/50 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>AI Rebalance ({recommendations.length})</span>
            </Button>
          )}

          <Button
            onClick={() => {
              setShowAiSuggestModal(true);
              const results = db.suggestVolunteersForTask(taskQuery, ["generator", "electrical", "setup"]);
              setAiSuggestions(results.slice(0, 4));
            }}
            className="gap-2 text-xs h-9 bg-indigo-600 hover:bg-indigo-500 shadow-aiGlow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Task Assignment</span>
          </Button>
        </div>
      </div>

      {/* Burnout Risk Notification Banner if any overloaded */}
      {recommendations.length > 0 && (
        <div className="p-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                Volunteer Burnout Risk Detected: {recommendations[0].overloadedVolunteer.user?.name}
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {recommendations[0].reason}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowRebalanceModal(true)}
            className="h-8 text-xs bg-amber-600 hover:bg-amber-500 text-black font-semibold flex-shrink-0"
          >
            Review Rebalance
          </Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search volunteers by name, email, or skill tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Availability:</span>
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-[11px]">
            {["all", "available", "busy", "overloaded"].map((opt) => (
              <button
                key={opt}
                onClick={() => setFilterAvailability(opt)}
                className={`px-2 py-0.5 rounded-md font-mono uppercase transition-colors ${
                  filterAvailability === opt
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Volunteer Grid (24 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVolunteers.map((vol) => {
          const loadScore = vol.workloadScore || 30;
          return (
            <Card
              key={vol.id}
              onClick={() => setActiveVolunteer(vol)}
              className={`p-4 cursor-pointer hover:border-indigo-500/50 hover:shadow-aiGlow transition-all space-y-3.5 group rounded-2xl ${
                vol.availability === "overloaded"
                  ? "border-rose-500/50 bg-rose-950/15"
                  : "border-slate-800/80 bg-slate-950/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-indigo-300 group-hover:border-indigo-500 transition-colors shadow-sm">
                    {vol.user?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {vol.user?.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">{vol.user?.email}</p>
                  </div>
                </div>

                <Badge
                  variant={
                    vol.availability === "overloaded"
                      ? "destructive"
                      : vol.availability === "busy"
                      ? "warning"
                      : "success"
                  }
                  className="text-[9px] uppercase font-mono"
                >
                  {vol.availability}
                </Badge>
              </div>

              {/* Workload Gauge */}
              <WorkloadGauge
                score={loadScore}
                taskCount={vol.assignedTasks?.length || 0}
              />

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {vol.skills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
                {vol.skills.length > 3 && (
                  <span className="text-[10px] text-slate-500 self-center">
                    +{vol.skills.length - 3} more
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* AI Rebalance Modal */}
      <Modal
        isOpen={showRebalanceModal}
        onClose={() => setShowRebalanceModal(false)}
        title="AI Workload Rebalance Recommendation"
        description="Automated optimization to alleviate volunteer burnout and protect critical path timelines."
      >
        <div className="space-y-4 text-xs">
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-indigo-500/40 bg-slate-950 space-y-3"
            >
              <div className="flex items-center justify-between">
                <Badge variant="ai" className="text-[10px]">
                  CONFIDENCE: {rec.confidence}%
                </Badge>
                <span className="text-slate-400 font-mono text-[10px]">
                  Optimization #0{i + 1}
                </span>
              </div>

              <p className="text-slate-300 leading-relaxed">{rec.reason}</p>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Deliverable:</span>
                  <p className="font-semibold text-white">{rec.taskToReassign.title}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Suggested Lead:</span>
                  <p className="font-semibold text-emerald-400">{rec.suggestedVolunteer.user?.name}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="ai"
                  onClick={() => executeRebalance(rec)}
                  className="gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Execute Rebalance</span>
                </Button>
              </div>
            </div>
          ))}

          {recommendations.length === 0 && (
            <p className="text-slate-400 py-4 text-center">
              All volunteer workloads are currently balanced within optimal parameters.
            </p>
          )}
        </div>
      </Modal>

      {/* AI Task Suggestion Modal */}
      <Modal
        isOpen={showAiSuggestModal}
        onClose={() => setShowAiSuggestModal(false)}
        title="AI Personnel Assignment Assistant"
        description="Matches volunteer skills and availability to specific task constraints."
      >
        <div className="space-y-4">
          <form onSubmit={handleRunAiSuggestion} className="space-y-2">
            <label className="text-xs font-medium text-slate-300">
              Describe Operational Task Requirements:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={taskQuery}
                onChange={(e) => setTaskQuery(e.target.value)}
                placeholder="e.g. Design keynote presentation and stage visual assets"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <Button type="submit" size="sm" variant="ai" className="h-9">
                Match
              </Button>
            </div>
          </form>

          <div className="space-y-2.5 pt-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              AI Recommendation Ranked Candidates:
            </span>
            {aiSuggestions.map((sug, idx) => (
              <div
                key={sug.volunteer.id}
                className="p-3 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      #{idx + 1} {sug.volunteer.user?.name}
                    </span>
                    <Badge variant={sug.score > 80 ? "success" : "warning"} className="text-[9px]">
                      {sug.score}% MATCH
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {sug.rationale}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] flex-shrink-0"
                  onClick={() => {
                    showToast(`Candidate selected: ${sug.volunteer.user?.name}`);
                    setShowAiSuggestModal(false);
                  }}
                >
                  Select Lead
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Volunteer Detail Modal */}
      <Modal
        isOpen={!!activeVolunteer}
        onClose={() => setActiveVolunteer(null)}
        title={activeVolunteer?.user?.name || "Volunteer Profile"}
        description={`Volunteer ID: ${activeVolunteer?.id}`}
      >
        {activeVolunteer && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 font-medium">Email:</span>
                <p className="font-semibold text-white mt-0.5">{activeVolunteer.user?.email}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Availability:</span>
                <p className="font-semibold text-emerald-400 mt-0.5 capitalize">
                  {activeVolunteer.availability}
                </p>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-medium">Current Workload:</span>
              <WorkloadGauge
                score={activeVolunteer.workloadScore || 30}
                taskCount={activeVolunteer.assignedTasks?.length || 0}
                className="mt-1.5"
              />
            </div>

            <div>
              <span className="text-slate-400 font-medium">Skills & Specializations:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {activeVolunteer.skills.map((s) => (
                  <span
                    key={s}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  showToast(`Assigned direct communication with ${activeVolunteer.user?.name}`);
                  setActiveVolunteer(null);
                }}
              >
                Close Profile
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
