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
    }, 600);
  };

  const handleProcessCustomTranscript = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTranscript.trim()) return;

    setIsProcessing(true);
    setShowPasteModal(false);

    setTimeout(() => {
      const items = extractActions(activeMeeting.id, customTranscript);
      setSelectedActionIds(items.map((i) => i.id));
      setIsProcessing(false);
      setCustomTranscript("");
    }, 800);
  };

  const handleApproveSelected = () => {
    if (selectedActionIds.length === 0) {
      showToast("Please select at least one action item to approve.");
      return;
    }
    approveActions(selectedActionIds);
    setSelectedActionIds([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-indigo-400" />
            <span>Meeting Intelligence & Action Item Extraction</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated pipeline: Transcript → AI Segmentation → Entity & Deadline Normalization → Review → Task Creation.
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Meeting Records</CardTitle>
              <CardDescription>Select a scheduled sync or post-event debrief.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {meetings.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMeetingId(m.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedMeetingId === m.id
                      ? "border-indigo-500/50 bg-indigo-950/30 shadow-aiGlow"
                      : "border-slate-800/80 bg-slate-950/50 hover:bg-slate-900/60 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100">{m.title}</span>
                    <Badge variant={m.transcript_status === "processed" ? "ai" : "secondary"}>
                      {m.transcript_status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                    <span>📅 {formatDate(m.scheduled_at)}</span>
                    <span>•</span>
                    <span>{m.action_items_count || 0} Action Items</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Transcript Content Box */}
          {activeMeeting && (
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs">Transcript Raw Audio/Text</CardTitle>
                  <CardDescription>Verified meeting transcript logs.</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="ai"
                  onClick={handleExtractFromActive}
                  disabled={isProcessing}
                  className="h-7 text-xs gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isProcessing ? "Extracting..." : "Run AI Extraction"}</span>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/80 text-xs text-slate-300 font-mono leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
                  {activeMeeting.transcript_text || "No transcript attached yet."}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: AI Extraction & One-Click Approval Board (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-indigo-500/30 bg-slate-900/40 shadow-aiGlow">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <CardTitle className="text-sm">Extracted Action Items (AI Preview)</CardTitle>
                  </div>
                  <CardDescription>
                    Review structured operational tasks before committing to the database.
                  </CardDescription>
                </div>
                {meetingActions.length > 0 && (
                  <Button
                    size="sm"
                    variant="ai"
                    onClick={handleApproveSelected}
                    disabled={selectedActionIds.length === 0}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Selected ({selectedActionIds.length})</span>
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              {isProcessing && (
                <div className="p-8 text-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs text-indigo-300">
                    Segmenting speakers, resolving owners, and inferring deadlines...
                  </p>
                </div>
              )}

              {!isProcessing && meetingActions.length === 0 && (
                <div className="p-8 text-center space-y-3 border border-dashed border-slate-800 rounded-xl">
                  <Sparkles className="w-8 h-8 text-indigo-400/50 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">
                    No action items extracted for this meeting yet.
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Click <strong>&quot;Run AI Extraction&quot;</strong> above to scan the transcript or upload a new meeting text.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExtractFromActive}
                    className="text-xs"
                  >
                    Run Extraction on Current Transcript
                  </Button>
                </div>
              )}

              {!isProcessing &&
                meetingActions.map((item) => {
                  const isSelected = selectedActionIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => !item.approved && toggleActionSelect(item.id)}
                      className={`p-4 rounded-xl border transition-all ${
                        item.approved
                          ? "border-emerald-500/30 bg-emerald-950/10 text-slate-400"
                          : isSelected
                          ? "border-indigo-500 bg-indigo-950/30 cursor-pointer shadow-aiGlow"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={item.approved || isSelected}
                            disabled={item.approved}
                            onChange={() => !item.approved && toggleActionSelect(item.id)}
                            className="mt-1 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <h4
                              className={`text-xs font-semibold ${
                                item.approved ? "text-emerald-300 line-through" : "text-white"
                              }`}
                            >
                              {item.extracted_title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2">
                              <span className="flex items-center gap-1 text-slate-200">
                                👤 <strong>Assignee:</strong> {item.owner_name || "Unassigned"}
                              </span>
                              <span>•</span>
                              <span>📅 <strong>Due:</strong> {formatDate(item.due_at)}</span>
                              <span>•</span>
                              <span className="text-cyan-400 font-mono">
                                🎯 Confidence: {Math.round(item.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          <Badge
                            variant={
                              item.priority === "critical"
                                ? "destructive"
                                : item.priority === "high"
                                ? "warning"
                                : "secondary"
                            }
                            className="text-[9px]"
                          >
                            {item.priority}
                          </Badge>
                          {item.approved && (
                            <Badge variant="success" className="text-[9px]">
                              APPROVED → TASK
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Paste / Upload Custom Transcript Modal */}
      <Modal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        title="Upload or Paste Meeting Transcript"
        description="Extract structured action items from any meeting dialog or team sync."
      >
        <form onSubmit={handleProcessCustomTranscript} className="space-y-4 text-xs">
          <div>
            <label className="font-medium text-slate-300">Transcript Text</label>
            <p className="text-[11px] text-slate-500 mb-1">
              Example: &quot;Jay will finish the registration website by Friday and Priya will publish the Instagram campaign tomorrow.&quot;
            </p>
            <textarea
              rows={6}
              required
              placeholder="Paste raw conversation notes here..."
              value={customTranscript}
              onChange={(e) => setCustomTranscript(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setShowPasteModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="ai">
              Process & Extract Action Items
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
