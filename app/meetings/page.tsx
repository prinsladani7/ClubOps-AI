"use client";

import React, { useState } from "react";
import {
  Video,
  FileText,
  Sparkles,
  CheckCircle,
  Clock,
  User,
  Plus,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  FileUp,
  Mic,
  Volume2,
  Play,
  RotateCw,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

export default function MeetingsPage() {
  const {
    meetings,
    actionItems,
    extractActions,
    approveActions,
    currentUser,
    event,
    showToast,
  } = useClubOps();

  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(meetings[0]?.id || "");
  const [customTranscript, setCustomTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [showPasteModal, setShowPasteModal] = useState(false);

  const activeMeeting = meetings.find((m) => m.id === selectedMeetingId) || meetings[0];
  const meetingActions = actionItems.filter((a) => a.meeting_id === activeMeeting?.id);

  // Toggle single action selection for approval
  const toggleActionSelect = (id: string) => {
    setSelectedActionIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExtractFromActive = () => {
    if (!activeMeeting?.transcript_text) return;
    setIsProcessing(true);
    setTimeout(() => {
      const items = extractActions(activeMeeting.id, activeMeeting.transcript_text!);
      setSelectedActionIds(items.map((i) => i.id));
      setIsProcessing(false);
      showToast(`AI extracted ${items.length} action item(s) from meeting transcript.`);
    }, 600);
  };

  const handleProcessCustomTranscript = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTranscript.trim()) return;

    setIsProcessing(true);
    setShowPasteModal(false);

    setTimeout(() => {
      const targetMeetingId = activeMeeting?.id || meetings[0]?.id || "mtg-custom";
      const items = extractActions(targetMeetingId, customTranscript);
      setSelectedActionIds(items.map((i) => i.id));
      setIsProcessing(false);
      setCustomTranscript("");
      showToast(`Custom transcript parsed: ${items.length} action items surfaced.`);
    }, 800);
  };

  const handleApproveSelected = () => {
    if (selectedActionIds.length === 0) {
      showToast("Please select at least one action item to approve.");
      return;
    }
    approveActions(selectedActionIds);
    showToast(`Approved ${selectedActionIds.length} action item(s) into active database tasks!`);
    setSelectedActionIds([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
            <span>Audio & Transcript Pipeline</span>
            <span>•</span>
            <span>Zod Schema Extraction</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 mt-0.5">
            <Video className="w-6 h-6 text-indigo-400" />
            <span>Meeting Intelligence & Action Item Extraction</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated pipeline: Transcript → AI Segmentation → Entity & Deadline Normalization → Review → 1-Click Task Creation.
          </p>
        </div>

        <Button
          onClick={() => setShowPasteModal(true)}
          className="gap-1.5 text-xs h-9 bg-indigo-600 hover:bg-indigo-500 shadow-aiGlow"
        >
          <FileUp className="w-4 h-4" />
          <span>Upload / Paste Transcript</span>
        </Button>
      </div>

      {/* Main Grid: Meeting Selector & Transcript Viewer + Extraction Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Meeting List & Transcript Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-800/80 bg-slate-900/50">
            <CardHeader className="pb-3 border-b border-slate-800/60">
              <CardTitle className="text-sm">Meeting Records & Archives</CardTitle>
              <CardDescription>Select a scheduled sync or committee debrief.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-4">
              {meetings.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                  <Video className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                  <p className="font-semibold text-slate-300">No meetings recorded</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Click &quot;Paste Custom Transcript&quot; to extract operational action items.</p>
                </div>
              ) : (
                meetings.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMeetingId(m.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedMeetingId === m.id
                        ? "border-indigo-500/60 bg-indigo-950/40 shadow-aiGlow"
                        : "border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/80 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">{m.title}</span>
                      <Badge variant={m.transcript_status === "processed" ? "ai" : "secondary"} className="text-[9px] font-mono uppercase">
                        {m.transcript_status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                      <span>📅 {formatDate(m.scheduled_at)}</span>
                      <span>•</span>
                      <span>{m.action_items_count || 0} Action Items</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Transcript Reader Card with Animated Soundwave simulation */}
          {activeMeeting && (
            <Card className="border-slate-800/80 bg-slate-900/50">
              <CardHeader className="pb-3 border-b border-slate-800/60 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Raw Audio Transcript</span>
                  </CardTitle>
                  <CardDescription>Verified timestamped audio sync transcript.</CardDescription>
                </div>

                {/* Simulated Audio Player Toggle */}
                <button
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                    isPlayingAudio
                      ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                  title="Simulate audio playback"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="font-mono text-[10px]">{isPlayingAudio ? "PLAYING" : "PLAY AUDIO"}</span>
                </button>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {/* Audio Equalizer animation if playing */}
                {isPlayingAudio && (
                  <div className="flex items-center justify-center gap-1 py-2 bg-slate-950/80 rounded-xl border border-slate-800">
                    {[40, 75, 90, 60, 30, 85, 100, 45, 65, 80, 50, 95, 35].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full animate-pulse"
                        style={{ height: `${h * 0.25}px`, animationDelay: `${i * 70}ms` }}
                      />
                    ))}
                    <span className="text-[10px] font-mono text-cyan-400 ml-2">Audio Stream: 128kbps</span>
                  </div>
                )}

                <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/80 text-xs text-slate-300 max-h-64 overflow-y-auto leading-relaxed font-mono whitespace-pre-wrap">
                  {activeMeeting.transcript_text || "No transcript content uploaded for this meeting record."}
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="ai"
                    onClick={handleExtractFromActive}
                    disabled={isProcessing || !activeMeeting.transcript_text}
                    className="gap-1.5 text-xs h-8"
                  >
                    {isProcessing ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Extracting Deliverables...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Run AI Extraction</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Extracted Action Items & Conversion Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-800/80 bg-slate-900/50">
            <CardHeader className="pb-3 border-b border-slate-800/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Structured Action Items</span>
                </CardTitle>
                <CardDescription>
                  Zod schema normalized tasks ready for one-click approval into the database.
                </CardDescription>
              </div>

              {meetingActions.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedActionIds.length}/{meetingActions.length} Selected
                  </span>
                  <Button
                    size="sm"
                    onClick={handleApproveSelected}
                    disabled={selectedActionIds.length === 0}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Approve Selected
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {meetingActions.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-800/80 rounded-2xl">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-400">
                    No action items extracted for this meeting yet.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                    Click &quot;Run AI Extraction&quot; to parse the meeting transcript into normalized tasks with assignees and due dates.
                  </p>
                </div>
              ) : (
                meetingActions.map((action) => {
                  const isSelected = selectedActionIds.includes(action.id);
                  return (
                    <div
                      key={action.id}
                      onClick={() => toggleActionSelect(action.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-indigo-500/60 bg-indigo-950/30 shadow-aiGlow"
                          : "border-slate-800/80 bg-slate-950/80 hover:bg-slate-900/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-600 text-white"
                                : "border-slate-700 bg-slate-900 text-transparent"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-100">{action.extracted_title}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">Priority: {action.priority.toUpperCase()}</p>
                          </div>
                        </div>

                        <Badge
                          variant={action.confidence > 0.9 ? "ai" : "warning"}
                          className="text-[9px] font-mono"
                        >
                          {Math.round(action.confidence * 100)}% CONFIDENCE
                        </Badge>
                      </div>

                      {/* Details & Assignee */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                        <div className="flex items-center gap-2">
                          <span>Assignee: <strong className="text-slate-300">{action.owner_name || "Unassigned"}</strong></span>
                          <span>•</span>
                          <span>Due: <strong className="text-slate-300 font-mono">{formatDate(action.due_at || "")}</strong></span>
                        </div>

                        <Badge
                          variant={
                            action.priority === "high" || action.priority === "critical"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[9px] uppercase font-mono"
                        >
                          {action.priority}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload / Custom Transcript Modal */}
      <Modal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        title="Upload or Paste Sync Transcript"
        description="Run real-time LLM entity extraction to pull structured deliverables from messy transcripts."
      >
        <form onSubmit={handleProcessCustomTranscript} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300">Raw Transcript Text</label>
            <textarea
              rows={8}
              required
              placeholder="Paste raw Google Meet or Zoom transcript..."
              value={customTranscript}
              onChange={(e) => setCustomTranscript(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setShowPasteModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="ai" disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Run AI Extraction"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
