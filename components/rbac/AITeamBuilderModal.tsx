"use client";

import React, { useState } from "react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { AITeamRecommendation } from "@/types";
import { Sparkles, X, Users, CheckCircle2, ShieldAlert, Cpu, ArrowRight, Loader2 } from "lucide-react";

interface AITeamBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AITeamBuilderModal({ isOpen, onClose }: AITeamBuilderModalProps) {
  const { recommendTeam, createTeamFromRecommendation, currentUser, showToast } = useClubOps();

  const [prompt, setPrompt] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendation, setRecommendation] = useState<AITeamRecommendation | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      try {
        const skillsExtracted: string[] = [];
        const pLower = prompt.toLowerCase();
        if (pLower.includes("av") || pLower.includes("audio") || pLower.includes("sound") || pLower.includes("stage")) {
          skillsExtracted.push("Audio/Visual", "Stage Rigging");
        }
        if (pLower.includes("tech") || pLower.includes("web") || pLower.includes("code") || pLower.includes("robowars")) {
          skillsExtracted.push("Technical", "Python", "Database Architecture");
        }
        if (pLower.includes("sponsor") || pLower.includes("finance") || pLower.includes("vendor")) {
          skillsExtracted.push("Vendor Negotiation", "Corporate Pitching");
        }
        if (skillsExtracted.length === 0) {
          skillsExtracted.push("Coordination", "Logistics", "Operations");
        }

        const rec = recommendTeam({
          goal: prompt.trim(),
          required_skills: skillsExtracted,
          max_members: maxMembers,
        });

        setRecommendation(rec);
      } catch (err: any) {
        showToast(`AI generation error: ${err.message}`);
      } finally {
        setIsGenerating(false);
      }
    }, 600);
  };

  const handleConfirmCreate = () => {
    if (!recommendation) return;

    if (currentUser.role !== "admin") {
      showToast("Unauthorized: Only Admins can finalize team creation. Request access or ask an Admin.");
      return;
    }

    setIsCreating(true);
    try {
      createTeamFromRecommendation(recommendation);
      setRecommendation(null);
      setPrompt("");
      onClose();
    } catch (err: any) {
      showToast(`Creation error: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-indigo-500/30 bg-slate-900/95 p-6 shadow-aiGlow backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-[1px] shadow-aiGlow">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">AI Team Builder</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                PROMPT-TO-SQUAD
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Synthesize balanced squads based on volunteer skills, current workloads, and event requirements.
            </p>
          </div>
        </div>

        {!recommendation ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Describe the Operational Mission or Initiative
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="e.g., Build a rapid-response team of 4 for main auditorium audio-visual calibration and stage rigging..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Squad Size
                </label>
                <select
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value={3}>3 Contributors</option>
                  <option value={4}>4 Contributors (Recommended)</option>
                  <option value={5}>5 Contributors</option>
                  <option value={6}>6 Contributors</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Optimization Target
                </label>
                <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>Burnout Protection</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">ENFORCED</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-indigo-200">Autonomous Capacity Balancing</p>
                <p className="text-[11px] text-indigo-400/90 mt-0.5">
                  The engine automatically filters out volunteers with &gt;75% workload and selects optimal lead organizers.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-aiGlow hover:from-indigo-500 hover:to-cyan-500 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Roster...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Squad Recommendation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Header info */}
            <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">
                  Synthesized Team Recommendation
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">{recommendation.team_name}</h4>
              </div>
              <button
                onClick={() => setRecommendation(null)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Modify Prompt
              </button>
            </div>

            {/* Recommended Organizer */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs">
                  👑
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-semibold">
                    Recommended Lead Organizer
                  </span>
                  <p className="text-xs font-bold text-white">{recommendation.recommended_organizer}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                Verified Availability
              </span>
            </div>

            {/* Recommended Members */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span>Recommended Core Contributors ({recommendation.recommended_members.length})</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Avg Load: {recommendation.workload_analysis.average_team_workload_pct}%
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {recommendation.recommended_members.map((mem, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                      {mem[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{mem}</p>
                      <p className="text-[10px] text-slate-400 capitalize">Volunteer Contributor</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Coverage */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Competency Coverage
              </label>
              <div className="flex flex-wrap gap-1.5">
                {recommendation.skill_coverage.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] text-cyan-300 font-medium"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Strategic Reasoning */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 space-y-1.5">
              <p className="text-[10px] font-mono text-slate-400 uppercase font-semibold">AI Rationale</p>
              {recommendation.reasoning.map((r, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-indigo-400">•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>

            {/* Admin Confirmation Warning */}
            {currentUser.role !== "admin" ? (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  You are logged in as <strong>{currentUser.role.toUpperCase()}</strong>. Finalizing new team charters requires Admin clearance.
                </span>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRecommendation(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={isCreating}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-aiGlow hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Chartering Team...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Create Team</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
