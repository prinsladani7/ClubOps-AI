"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Calendar,
  Share2,
  Filter,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminReportsPage() {
  const { progressReports, projects, tasks, volunteers, showToast } = useClubOps();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");

  const filteredReports =
    selectedProjectId === "all"
      ? progressReports
      : progressReports.filter((r) => r.project_id === selectedProjectId);

  const completedTasksCount = tasks.filter((t) => t.status === "completed" || t.status === "done").length;
  const totalTasksCount = Math.max(1, tasks.length);
  const completionRate = Math.round((completedTasksCount / totalTasksCount) * 100);

  const handleExportCSV = () => {
    const headers = ["ID", "Project", "Title", "Completed Tasks", "Pending Tasks", "Blocked Tasks", "Date"];
    const rows = filteredReports.map((r) => [
      r.id,
      projects.find((p) => p.id === r.project_id)?.name || r.project_id,
      `"${r.title.replace(/"/g, '""')}"`,
      r.completed_tasks,
      r.pending_tasks,
      r.blocked_tasks,
      r.created_at,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clubops_progress_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV report generated and downloaded.");
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Admin Dashboard
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-mono text-indigo-400 font-semibold">Reports</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Operational Progress & Milestone Reports
          </h1>
          <p className="text-xs text-slate-400">
            Exportable executive summaries, completion rates, volunteer participation metrics, and risk assessments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="text-xs flex items-center gap-1.5 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            onClick={handleExportPDF}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-aiGlow"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Print / PDF Report</span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-mono uppercase">Overall Completion</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{completionRate}%</span>
            <span className="text-xs text-emerald-400 font-mono font-semibold">{completedTasksCount} done</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <span className="text-xs text-indigo-400 font-mono uppercase">Published Reports</span>
          <span className="text-3xl font-bold text-indigo-400 font-mono mt-2">{progressReports.length}</span>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <span className="text-xs text-cyan-400 font-mono uppercase">Governed Projects</span>
          <span className="text-3xl font-bold text-cyan-400 font-mono mt-2">{projects.length}</span>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <span className="text-xs text-amber-400 font-mono uppercase">Active Volunteers</span>
          <span className="text-3xl font-bold text-amber-400 font-mono mt-2">{volunteers.length}</span>
        </div>
      </div>

      {/* Project Filter */}
      <div className="flex items-center gap-3 print:hidden">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-slate-300 font-medium">Filter by Project:</span>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Organization Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Reports Listing */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-slate-400 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-white">No progress reports filed</p>
            <p className="text-xs text-slate-500">Milestone progress reports submitted by project organizers will appear here.</p>
          </div>
        ) : (
          filteredReports.map((report) => {
          const proj = projects.find((p) => p.id === report.project_id);

          return (
            <div
              key={report.id}
              className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl space-y-4 shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="cyan" className="text-[10px] font-mono uppercase">
                      {proj?.name || "Initiative"}
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">
                      Report ID: {report.id}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-tight">{report.title}</h2>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {report.summary}
              </p>

              {/* Progress Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-400">Completed Tasks:</span>
                  <span className="font-mono font-bold text-white">{report.completed_tasks}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-400">Pending Tasks:</span>
                  <span className="font-mono font-bold text-white">{report.pending_tasks}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400">Blocked Tasks:</span>
                  <span className="font-mono font-bold text-amber-400">{report.blocked_tasks}</span>
                </div>
              </div>

              {/* Risks Flagged */}
              {report.risks_identified && report.risks_identified.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Risks & Blockers Documented:
                  </span>
                  <ul className="space-y-1">
                    {report.risks_identified.map((risk, rIdx) => (
                      <li
                        key={rIdx}
                        className="text-xs text-rose-300 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })
        )}
      </div>
    </div>
  );
}
