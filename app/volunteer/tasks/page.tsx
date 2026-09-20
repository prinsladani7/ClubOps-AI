"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Upload,
  ExternalLink,
  RotateCcw,
  Check,
  Calendar,
  MessageSquare,
  HelpCircle,
  Shield,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task } from "@/types";

export default function VolunteerTasksPage() {
  const {
    currentUser,
    tasks,
    projects,
    acceptTask,
    startTask,
    blockTask,
    submitTaskEvidence,
    toggleChecklistItem,
    escalateTask,
    resolveTaskBlocker,
    showToast,
  } = useClubOps();

  const myTasks = tasks.filter((t) => t.owner_id === currentUser.id);

  // Modal States
  const [selectedTaskForEvidence, setSelectedTaskForEvidence] = useState<Task | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState("https://drive.google.com/deliverable-verification-proof");
  const [evidenceNotes, setEvidenceNotes] = useState("");

  const [selectedTaskForBlocker, setSelectedTaskForBlocker] = useState<Task | null>(null);
  const [blockerReason, setBlockerReason] = useState("");

  const [selectedTaskForExtension, setSelectedTaskForExtension] = useState<Task | null>(null);
  const [extensionReason, setExtensionReason] = useState("");

  const handleAccept = (taskId: string) => {
    acceptTask(taskId);
    startTask(taskId);
  };

  const handleStart = (taskId: string) => {
    startTask(taskId);
  };

  const handleSubmitEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForEvidence || !evidenceUrl) return;

    submitTaskEvidence(selectedTaskForEvidence.id, evidenceUrl, evidenceNotes);
    setSelectedTaskForEvidence(null);
    setEvidenceUrl("");
    setEvidenceNotes("");
  };

  const handleReportBlocker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForBlocker || !blockerReason) return;

    blockTask(selectedTaskForBlocker.id, blockerReason);
    escalateTask(selectedTaskForBlocker.id, blockerReason);
    setSelectedTaskForBlocker(null);
    setBlockerReason("");
  };

  const handleRequestExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForExtension) return;

    showToast(`Extension request submitted to project organizer: "${extensionReason}"`);
    setSelectedTaskForExtension(null);
    setExtensionReason("");
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
            <span className="text-xs font-mono text-cyan-400 font-semibold">My Tasks</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            My Operational Tasks & Deliverables
          </h1>
          <p className="text-xs text-slate-400">
            Work through assigned deliverables across standard 6-stage workflow: Pending &rarr; Accepted &rarr; In Progress &rarr; Blocked &rarr; Submitted &rarr; Completed.
          </p>
        </div>

        <Badge variant="cyan" className="text-xs font-mono py-1 px-3">
          {myTasks.length} Assigned Deliverables
        </Badge>
      </div>

      {/* Task Workflow Stage Legend */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] flex flex-wrap items-center gap-2 text-slate-400">
        <span className="font-bold text-white uppercase font-mono">Workflow Protocol:</span>
        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">1. Pending</span>
        <span>&rarr;</span>
        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">2. Accepted</span>
        <span>&rarr;</span>
        <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">3. In Progress</span>
        <span>&rarr;</span>
        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">4. Submitted</span>
        <span>&rarr;</span>
        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">5. Completed</span>
      </div>

      {/* Task Cards Grid */}
      <div className="space-y-4">
        {myTasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400 space-y-2">
            <CheckSquare className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">No tasks currently assigned to your account.</p>
          </div>
        ) : (
          myTasks.map((task) => {
            const proj = projects.find((p) => p.id === task.project_id);
            const isOverdue = new Date(task.due_at).getTime() < Date.now() && task.status !== "completed" && task.status !== "done";

            return (
              <div
                key={task.id}
                id={task.id}
                className={`p-6 rounded-2xl border bg-slate-900/70 backdrop-blur-xl space-y-4 transition-all ${
                  task.status === "pending"
                    ? "border-amber-500/50 ring-1 ring-amber-500/20"
                    : task.status === "blocked"
                    ? "border-rose-500/40"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={task.priority === "critical" ? "destructive" : task.priority === "high" ? "warning" : "outline"}
                        className="text-[9px] uppercase font-mono"
                      >
                        {task.priority}
                      </Badge>

                      <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-300">
                        {proj?.name || "Workstream"}
                      </Badge>

                      <Badge
                        variant={
                          task.status === "completed" || task.status === "done"
                            ? "cyan"
                            : task.status === "submitted"
                            ? "warning"
                            : task.status === "blocked"
                            ? "destructive"
                            : "outline"
                        }
                        className="text-[10px] font-mono uppercase"
                      >
                        {task.status}
                      </Badge>
                    </div>

                    <h2 className="text-base font-bold text-white tracking-tight">{task.title}</h2>
                  </div>

                  <div className="text-right text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Due: {new Date(task.due_at).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{task.description}</p>

                {/* Interactive Checklist (Specification Section 7) */}
                {task.checklist && task.checklist.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-slate-300 uppercase">Deliverable Checklist:</span>
                      <span className="text-slate-500 font-mono">
                        {task.checklist.filter((c) => c.completed).length}/{task.checklist.length} Completed
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {task.checklist.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => toggleChecklistItem(task.id, item.id)}
                          className="flex items-center gap-2 cursor-pointer text-xs text-slate-200 hover:text-white p-1 rounded transition-colors group"
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              item.completed
                                ? "bg-emerald-600 border-emerald-500 text-white"
                                : "border-slate-700 bg-slate-900 group-hover:border-slate-600"
                            }`}
                          >
                            {item.completed && <Check className="w-3 h-3" />}
                          </div>
                          <span className={item.completed ? "line-through text-slate-500" : ""}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submitted Evidence View */}
                {task.evidence && task.evidence.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                      Your Uploaded Proof:
                    </span>
                    {task.evidence.map((ev, eIdx) => (
                      <div key={eIdx} className="space-y-0.5">
                        <a
                          href={ev.evidence_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline flex items-center gap-1 font-mono break-all text-[11px]"
                        >
                          <span>{ev.evidence_url}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {ev.notes && <p className="text-slate-400 italic text-[11px]">"{ev.notes}"</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Bar based on State */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    {task.status === "pending" && (
                      <Button
                        onClick={() => handleAccept(task.id)}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-1.5"
                      >
                        <Play className="w-3.5 h-3.5 mr-1" />
                        <span>Accept & Start Work</span>
                      </Button>
                    )}

                    {(task.status === "in_progress" || task.status === "accepted") && (
                      <Button
                        onClick={() => setSelectedTaskForEvidence(task)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-1.5 shadow-aiGlow"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1" />
                        <span>Submit Proof of Work</span>
                      </Button>
                    )}

                    {task.status === "blocked" && (
                      <Button
                        onClick={() => resolveTaskBlocker(task.id, "Blocker resolved by volunteer.")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        <span>Resume Work (Blocker Resolved)</span>
                      </Button>
                    )}

                    {task.status === "submitted" && (
                      <span className="text-xs text-amber-400 font-mono flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>Pending Organizer Review</span>
                      </span>
                    )}

                    {(task.status === "completed" || task.status === "done") && (
                      <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Deliverable Verified & Signed Off</span>
                      </span>
                    )}
                  </div>

                  {/* Help / Escalation Controls (Section 7) */}
                  {task.status !== "completed" && task.status !== "done" && (
                    <div className="flex items-center gap-2 text-xs">
                      {task.status !== "blocked" && (
                        <button
                          onClick={() => setSelectedTaskForBlocker(task)}
                          className="text-rose-400 hover:text-rose-300 font-mono text-[11px] underline"
                        >
                          Report Blocker
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedTaskForExtension(task)}
                        className="text-slate-400 hover:text-slate-200 font-mono text-[11px]"
                      >
                        Request Extension
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Proof of Work Modal */}
      {selectedTaskForEvidence && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Submit Proof of Work</h3>
              <button
                onClick={() => setSelectedTaskForEvidence(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleSubmitEvidence} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Deliverable Link / Evidence URL:</label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://github.com/..., https://drive.google.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Submission Notes for Organizer:</label>
                <textarea
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  placeholder="Summarize what was completed and any verification notes..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button variant="outline" type="button" onClick={() => setSelectedTaskForEvidence(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
                  Submit Deliverable
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Blocker Modal */}
      {selectedTaskForBlocker && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <h3>Escalate Blocker to Organizer</h3>
              </div>
              <button
                onClick={() => setSelectedTaskForBlocker(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleReportBlocker} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Blocker Description:</label>
                <textarea
                  value={blockerReason}
                  onChange={(e) => setBlockerReason(e.target.value)}
                  placeholder="Describe what is preventing progress (e.g. missing API keys, venue access denied)..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button variant="outline" type="button" onClick={() => setSelectedTaskForBlocker(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-500 text-white font-semibold">
                  Escalate Blocker
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Extension Modal */}
      {selectedTaskForExtension && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Request Deadline Extension</h3>
              <button
                onClick={() => setSelectedTaskForExtension(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ ESC
              </button>
            </div>

            <form onSubmit={handleRequestExtension} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Justification / Reason:</label>
                <textarea
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="Explain why additional time is requested..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button variant="outline" type="button" onClick={() => setSelectedTaskForExtension(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
                  Send Extension Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
