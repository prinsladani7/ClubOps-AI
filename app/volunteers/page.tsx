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
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Volunteer } from "@/types";
import { db } from "@/lib/db";

export default function VolunteersPage() {
  const { volunteers, tasks, currentUser, showToast } = useClubOps();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterAvailability, setFilterAvailability] = useState<string>("all");
  const [activeVolunteer, setActiveVolunteer] = useState<Volunteer | null>(null);

  // AI Assignment Recommendation state
  const [showAiSuggestModal, setShowAiSuggestModal] = useState(false);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            <span>Volunteer & Personnel Workload Intelligence</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracking 24 student committee volunteers across engineering, hospitality, stage, and logistics tracks.
          </p>
        </div>

        <Button
          onClick={() => {
            setShowAiSuggestModal(true);
            const results = db.suggestVolunteersForTask(taskQuery, ["generator", "electrical", "setup"]);
            setAiSuggestions(results.slice(0, 4));
          }}
          className="gap-2 text-xs h-9 bg-indigo-600 hover:bg-indigo-500 shadow-aiGlow"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Task Assignment Assistant</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search volunteers by name or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Availability:</span>
          <select
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-200 focus:outline-none"
          >
            <option value="all">All ({volunteers.length})</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="overloaded">Overloaded (Alert)</option>
          </select>
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
              className={`p-4 cursor-pointer hover:border-indigo-500/50 hover:shadow-aiGlow transition-all ${
                vol.availability === "overloaded"
                  ? "border-rose-500/40 bg-rose-950/10"
                  : "border-slate-800 bg-slate-950/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-indigo-300">
                    {vol.user?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">{vol.user?.name}</h3>
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
                  className="text-[9px]"
                >
                  {vol.availability.toUpperCase()}
                </Badge>
              </div>

              {/* Workload Progress Bar */}
              <div className="mt-4 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Workload Capacity:</span>
                  <span
                    className={`font-mono font-semibold ${
                      loadScore > 80
                        ? "text-rose-400"
                        : loadScore > 50
                        ? "text-amber-400"
                        : "text-indigo-400"
                    }`}
                  >
                    {loadScore}% ({vol.assignedTasks?.length || 0} tasks)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      loadScore > 80
                        ? "bg-rose-500"
                        : loadScore > 50
                        ? "bg-amber-500"
                        : "bg-indigo-500"
                    }`}
                    style={{ width: `${loadScore}%` }}
                  />
                </div>
              </div>

              {/* Skill Tags */}
              <div className="mt-3 flex flex-wrap gap-1">
                {vol.skills.slice(0, 3).map((skill, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono"
                  >
                    {skill}
                  </span>
                ))}
                {vol.skills.length > 3 && (
                  <span className="text-[10px] text-slate-500 self-center">
                    +{vol.skills.length - 3}
                  </span>
                )}
              </div>

              {/* Notes */}
              <p className="mt-3 text-[11px] text-slate-400 line-clamp-2 border-t border-slate-900 pt-2">
                {vol.notes}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Volunteer Detail Modal */}
      <Modal
        isOpen={!!activeVolunteer}
        onClose={() => setActiveVolunteer(null)}
        title={activeVolunteer?.user?.name || "Volunteer Profile"}
        description={`Role: ${activeVolunteer?.user?.role.toUpperCase()} • ${activeVolunteer?.availability.toUpperCase()}`}
      >
        {activeVolunteer && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Assigned Skills:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {activeVolunteer.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-500/30 text-[11px]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-medium">Assigned Tasks ({activeVolunteer.assignedTasks?.length || 0}):</span>
              <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {activeVolunteer.assignedTasks && activeVolunteer.assignedTasks.length > 0 ? (
                  activeVolunteer.assignedTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded border border-slate-800 bg-slate-950 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-200 truncate">{t.title}</span>
                      <Badge variant={t.priority === "critical" ? "destructive" : "warning"} className="text-[9px]">
                        {t.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-[11px]">No active tasks assigned.</p>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-medium">Operational Notes:</span>
              <p className="mt-1 p-3 rounded bg-slate-950 border border-slate-800 text-slate-300">
                {activeVolunteer.notes}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setActiveVolunteer(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* AI Task Assignment Recommendation Modal (Section 9 Requirement) */}
      <Modal
        isOpen={showAiSuggestModal}
        onClose={() => setShowAiSuggestModal(false)}
        title="AI-Assisted Personnel Assignment"
        description="Recommend optimal volunteer based on skills, current workload, and availability."
      >
        <div className="space-y-4 text-xs">
          <form onSubmit={handleRunAiSuggestion} className="space-y-2">
            <label className="font-medium text-slate-300">Target Task Title / Requirements</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={taskQuery}
                onChange={(e) => setTaskQuery(e.target.value)}
                placeholder="e.g. Stage Rigging or Sound Equipment Setup"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
              <Button type="submit" variant="ai">
                Analyze
              </Button>
            </div>
          </form>

          <div className="pt-2 border-t border-slate-800 space-y-2.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Recommended Personnel (Evidence-Backed):
            </span>
            {aiSuggestions.map((sug, i) => (
              <div
                key={sug.volunteer.id}
                className="p-3 rounded-lg border border-slate-800 bg-slate-950 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">
                      #{i + 1} {sug.volunteer.user?.name}
                    </span>
                    <Badge variant={sug.volunteer.availability === "available" ? "success" : "warning"} className="text-[9px]">
                      {sug.volunteer.availability}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">
                    Fit Score: {sug.score}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {sug.rationale}
                </p>
                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] text-indigo-300 border-indigo-500/40"
                    onClick={() => {
                      showToast(`AI Assignment recommended: ${sug.volunteer.user?.name}`);
                      setShowAiSuggestModal(false);
                    }}
                  >
                    Select Volunteer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
