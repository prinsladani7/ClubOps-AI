"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Sparkles,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function OrganizerReportsPage() {
  const { currentUser, projects, tasks, progressReports, createProgressReport, showToast } = useClubOps();

  const myProjects = projects.filter(
    (p) => p.organizer_id === currentUser.id || (p.organizers && p.organizers.includes(currentUser.id))
  );
  const myProjectIds = new Set(myProjects.map((p) => p.id));

  const scopedReports = progressReports.filter(
    (r) => myProjectIds.has(r.project_id) || r.author_id === currentUser.id
  );

  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportSummary, setReportSummary] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(myProjects[0]?.id || "");
  const [risksInput, setRisksInput] = useState("Auditorium acoustic test delayed by venue management");

  const projectTasks = tasks.filter((t) => t.project_id === selectedProjectId);
  const completedCount = projectTasks.filter((t) => t.status === "completed" || t.status === "done").length;
  const pendingCount = projectTasks.filter((t) => t.status === "in_progress" || t.status === "pending").length;
  const blockedCount = projectTasks.filter((t) => t.status === "blocked").length;

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle || !selectedProjectId) return;

    createProgressReport({
      project_id: selectedProjectId,
      title: reportTitle,
      summary: reportSummary,
      completed_tasks: completedCount,
      pending_tasks: pendingCount,
      blocked_tasks: blockedCount,
      risks_identified: risksInput.split("\n").filter((r) => r.trim().length > 0),
    });

    setIsSubmitOpen(false);
    setReportTitle("");
    setReportSummary("");
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/organizer/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Organizer Dashboard
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-mono text-cyan-400 font-semibold">Reports</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Milestone Progress Reports
          </h1>
          <p className="text-xs text-slate-400">
            Publish periodic workstream status updates, completion metrics, and blocker escalations directly to executive administration.
          </p>
        </div>

        <Button
          onClick={() => setIsSubmitOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-md"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Publish Progress Report</span>
        </Button>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {scopedReports.map((report) => {
          const proj = projects.find((p) => p.id === report.project_id);

          return (
            <div
              key={report.id}
              className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="cyan" className="text-[10px] uppercase font-mono">
                      {proj?.name || "Project"}
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">
                      Published {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1">{report.title}</h2>
                </div>

                <span className="text-xs text-slate-400 font-mono">Author: {report.author?.name || currentUser.name}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{report.summary}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{report.completed_tasks} Tasks Completed</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-400">
                  <Clock className="w-4 h-4" />
                  <span>{report.pending_tasks} Tasks In-Flight</span>
                </div>
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{report.blocked_tasks} Active Blockers</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Report Modal */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Publish Scope Progress Report</h3>
              <button
                onClick={() => setIsSubmitOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Select Workstream Project:</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  required
                >
                  {myProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Report Title:</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Week 3 Milestone: Core Portal Infrastructure Online"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Executive Summary:</label>
                <textarea
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  placeholder="Outline key deliverables achieved, squad participation, and current work focus..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Identified Risks & Blockers (One per line):</label>
                <textarea
                  value={risksInput}
                  onChange={(e) => setRisksInput(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button variant="outline" type="button" onClick={() => setIsSubmitOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
                  Submit to Admin
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
