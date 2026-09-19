"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Edit,
  Users,
  DollarSign,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Archive,
  Layers,
  Sparkles,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

export default function EventsPage() {
  const { event, updateEventDetails, tasks, volunteers, currentUser, showToast } = useClubOps();

  const [showEditModal, setShowEditModal] = useState(false);
  const [eventName, setEventName] = useState(event.name);
  const [eventVenue, setEventVenue] = useState(event.venue);
  const [eventBudget, setEventBudget] = useState(event.budget);
  const [eventDesc, setEventDesc] = useState(event.description);
  const [eventStatus, setEventStatus] = useState(event.status);

  const phases = [
    {
      name: "Phase 1: Planning & Administrative Signoffs",
      status: "delayed",
      dates: "Aug 01 – Sep 20, 2026",
      desc: "Auditorium reservation, dean endorsement, budget sanction, tier-1 sponsorship decks.",
      progress: 75,
    },
    {
      name: "Phase 2: Marketing & Registrations",
      status: "active",
      dates: "Sep 15 – Oct 15, 2026",
      desc: "Vercel registration portal launch, Instagram teaser campaigns, 500 hacker applications.",
      progress: 40,
    },
    {
      name: "Phase 3: Logistics, Procurement & Arena Build",
      status: "upcoming",
      dates: "Oct 10 – Oct 23, 2026",
      desc: "RoboWars arena fencing, catering contracts, badge printing, walkie-talkie distribution.",
      progress: 20,
    },
    {
      name: "Phase 4: Live Event Execution (LJ TechFest 2026)",
      status: "upcoming",
      dates: "Oct 24 – Oct 26, 2026",
      desc: "Inauguration in Grand Auditorium, 24-hr hackathon sprint, robotics combat, executive keynotes.",
      progress: 0,
    },
    {
      name: "Phase 5: Post-Event Wrap & Hall Handover",
      status: "upcoming",
      dates: "Oct 27, 2026",
      desc: "Certificate issuance, judge score audit, waste recycling, vendor final invoices.",
      progress: 0,
    },
  ];

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateEventDetails({
      name: eventName,
      venue: eventVenue,
      budget: Number(eventBudget),
      description: eventDesc,
      status: eventStatus,
    });
    showToast("Event configuration updated successfully!");
    setShowEditModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-400" />
            <span>Event Management: {event.name}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Core configuration, milestones, financial allocation, and team oversight.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role === "admin" && (
            <Button
              onClick={() => setShowEditModal(true)}
              className="gap-1.5 text-xs h-9 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Configuration</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Event Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Target Attendance</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">500</div>
          <p className="text-[11px] text-slate-400 mt-1">College participants across 5 tracks</p>
        </Card>

        <Card className="p-4 border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Approved Budget</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            ${event.budget.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">30% advance catering committed</p>
        </Card>

        <Card className="p-4 border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Operational Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{tasks.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across 6 operational statuses</p>
        </Card>

        <Card className="p-4 border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Staff & Volunteers</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{volunteers.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Assigned student leads</p>
        </Card>
      </div>

      {/* Event Details & Phases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Phases Roadmap */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Execution Phases & Milestones</CardTitle>
                  <CardDescription>Structured timeline leading to event day.</CardDescription>
                </div>
                <Badge variant="ai" className="text-[10px]">
                  5 Phases
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {phases.map((phase, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border space-y-2 ${
                    phase.status === "delayed"
                      ? "border-rose-500/30 bg-rose-950/10"
                      : phase.status === "active"
                      ? "border-indigo-500/40 bg-indigo-950/20 shadow-aiGlow"
                      : "border-slate-800 bg-slate-950/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{phase.name}</span>
                    <Badge
                      variant={
                        phase.status === "delayed"
                          ? "destructive"
                          : phase.status === "active"
                          ? "ai"
                          : "secondary"
                      }
                      className="text-[9px]"
                    >
                      {phase.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-300">{phase.desc}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                    <span>📅 {phase.dates}</span>
                    <span>Progress: {phase.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        phase.status === "delayed" ? "bg-rose-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${phase.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Venue & Administrative Context */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-sm">Venue & Logistics Context</CardTitle>
              <CardDescription>Primary campus infrastructure assigned.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Primary Location:
                </span>
                <p className="font-semibold text-white">{event.venue}</p>
                <p className="text-[11px] text-slate-400">
                  Includes 800-seat main auditorium, 2 computer labs, and engineering robotics hall.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Key Faculty & Club Leads:
                </span>
                <ul className="space-y-1 text-[11px] text-slate-300 mt-1">
                  <li>• <strong>Faculty Coordinator:</strong> Prof. Dave</li>
                  <li>• <strong>Club President:</strong> Prins Patel</li>
                  <li>• <strong>Overall Event Lead:</strong> Jay Shah</li>
                  <li>• <strong>Head of PR & Marketing:</strong> Priya Mehta</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Compliance & Safety:
                </span>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Auditorium acoustic policy: 85 dBA continuous max. 40kVA standby generator scheduled for 24-hr hackathon continuity.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Event Configuration Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Event Configuration"
        description="Update high-level event metadata, venue, budget, or lifecycle status."
      >
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="font-medium text-slate-300">Event Name</label>
            <input
              type="text"
              required
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-medium text-slate-300">Venue</label>
            <input
              type="text"
              required
              value={eventVenue}
              onChange={(e) => setEventVenue(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-slate-300">Budget ($)</label>
              <input
                type="number"
                required
                value={eventBudget}
                onChange={(e) => setEventBudget(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-medium text-slate-300">Lifecycle Status</label>
              <select
                value={eventStatus}
                onChange={(e) => setEventStatus(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div>
            <label className="font-medium text-slate-300">Description</label>
            <textarea
              rows={3}
              value={eventDesc}
              onChange={(e) => setEventDesc(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
