"use client";

import React, { useState } from "react";
import {
  BellRing,
  Plus,
  Send,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

export default function AnnouncementsPage() {
  const { announcements, publishAnnouncement, currentUser, event, showToast } = useClubOps();

  const [showDraftModal, setShowDraftModal] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    publishAnnouncement(title, body);
    setTitle("");
    setBody("");
    setShowDraftModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-400" />
            <span>Event Announcements & Broadcast Dispatch</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch announcements to hackers, volunteers, and the core committee for {event.name}.
          </p>
        </div>

        <Button
          onClick={() => setShowDraftModal(true)}
          className="gap-1.5 text-xs h-9 bg-indigo-600 hover:bg-indigo-500 shadow-aiGlow"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </Button>
      </div>

      {/* Announcements Stream */}
      <div className="space-y-4">
        {announcements.map((ann) => (
          <Card key={ann.id} className="border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{ann.title}</h3>
                  <p className="text-[11px] text-slate-400">
                    By {ann.author?.name || "Event Lead"} • {formatDate(ann.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={ann.status === "published" ? "success" : "secondary"} className="text-[10px]">
                  {ann.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {ann.body}
            </p>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60">
              <span>Audience: 500 Attendees & 24 Volunteers</span>
              <span>Audit Verified • Broadcast Delivery 100%</span>
            </div>
          </Card>
        ))}

        {announcements.length === 0 && (
          <p className="text-xs text-slate-400 py-12 text-center">
            No announcements published yet.
          </p>
        )}
      </div>

      {/* Draft Announcement Modal */}
      <Modal
        isOpen={showDraftModal}
        onClose={() => setShowDraftModal(false)}
        title="Draft Event Announcement"
        description="Publish broadcast notifications to all registered volunteers and participants."
      >
        <form onSubmit={handlePublish} className="space-y-4 text-xs">
          <div>
            <label className="font-medium text-slate-300">Announcement Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Schedule Change: Hackathon Keynote Moved to 2:00 PM"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-medium text-slate-300">Target Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Participants & Volunteers (500+)</option>
              <option value="volunteers">Volunteers Only (24 Leads)</option>
              <option value="organizers">Core Organizers (Admin & Leads)</option>
            </select>
          </div>
          <div>
            <label className="font-medium text-slate-300">Announcement Body</label>
            <textarea
              rows={4}
              required
              placeholder="Write the operational update or alert..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setShowDraftModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="ai" className="gap-1">
              <Send className="w-3.5 h-3.5" />
              <span>Publish Broadcast</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
