"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  ArrowLeft,
  Mail,
  Phone,
  BookOpen,
  Sparkles,
  Save,
  CheckCircle2,
  Bell,
  Sliders,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function VolunteerProfilePage() {
  const { currentUser, volunteers, showToast } = useClubOps();

  const myVolunteer = volunteers.find((v) => v.user_id === currentUser.id);

  const [name, setName] = useState(currentUser.name);
  const [email] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || "+91 98765 43210");
  const [bio, setBio] = useState(currentUser.bio || "Computer Engineering Sophomore, Syntax Squad Core Volunteer.");
  const [skills, setSkills] = useState(myVolunteer?.skills || ["Web Dev", "Next.js", "Tailwind CSS"]);
  const [newSkill, setNewSkill] = useState("");

  // Notification Preferences
  const [notifyTaskAssigned, setNotifyTaskAssigned] = useState(true);
  const [notifyDeadlineReminder, setNotifyDeadlineReminder] = useState(true);
  const [notifyAnnouncement, setNotifyAnnouncement] = useState(true);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim() || skills.includes(newSkill.trim())) return;
    setSkills([...skills, newSkill.trim()]);
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Profile & skills configuration successfully saved.");
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
            <span className="text-xs font-mono text-cyan-400 font-semibold">Profile</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Volunteer Profile & Skills Configuration
          </h1>
          <p className="text-xs text-slate-400">
            Keep your skills updated so the AI workload allocator and organizers match you with relevant deliverables.
          </p>
        </div>

        <Button
          onClick={handleSave}
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-md"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Identity & Contact */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-lg text-cyan-300">
                {name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{name}</h3>
                <p className="text-xs text-slate-400 font-mono capitalize">{currentUser.role} Clearance</p>
                <Badge variant="cyan" className="text-[10px] font-mono uppercase mt-1">
                  Active Member
                </Badge>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Campus Email (Read-Only):</label>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                  {email}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Contact Phone:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Short Bio / Department:</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Middle & Right: Skills Matrix & Notification Preferences (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills Matrix */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Verified Skills Matrix</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">{skills.length} Registered</span>
            </div>

            <p className="text-xs text-slate-300">
              Add technical, operational, or creative skills to be suggested during smart workload balancing.
            </p>

            {/* Existing Skills Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 text-xs font-mono"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-500 hover:text-rose-400 font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Add New Skill Input */}
            <form onSubmit={handleAddSkill} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add new skill (e.g. Stage AV, Python, Canva)..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
              />
              <Button type="submit" variant="outline" className="text-xs border-slate-700 bg-slate-800 text-white">
                Add Skill
              </Button>
            </form>
          </div>

          {/* Notification Preferences (Section 7) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Notification & Alert Preferences</h3>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
                <div>
                  <p className="font-semibold text-white">Task Assignment Alerts</p>
                  <p className="text-slate-400 text-[11px]">Instant in-app notice when an organizer assigns a new deliverable</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyTaskAssigned}
                  onChange={(e) => setNotifyTaskAssigned(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-0 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
                <div>
                  <p className="font-semibold text-white">Deadline Reminders</p>
                  <p className="text-slate-400 text-[11px]">24-hour advance warning before deliverable cutoff</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyDeadlineReminder}
                  onChange={(e) => setNotifyDeadlineReminder(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-0 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
                <div>
                  <p className="font-semibold text-white">Club Announcements</p>
                  <p className="text-slate-400 text-[11px]">Broadcast updates from organizers and administrators</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyAnnouncement}
                  onChange={(e) => setNotifyAnnouncement(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-0 bg-slate-900 border-slate-700"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
