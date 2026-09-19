"use client";

import React, { useState } from "react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { X, ShieldCheck, Clock, UserCheck } from "lucide-react";

interface AssignActingOrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
}

export function AssignActingOrganizerModal({
  isOpen,
  onClose,
  teamId,
}: AssignActingOrganizerModalProps) {
  const { teams, volunteers, assignActingOrganizer, currentUser, showToast } = useClubOps();

  const team = teams.find((t) => t.id === teamId);
  const eligibleVolunteers = volunteers.filter((v) => v.user_id !== team?.organizer_id);

  const [selectedUserId, setSelectedUserId] = useState<string>(
    eligibleVolunteers[0]?.user_id || ""
  );
  const [durationHours, setDurationHours] = useState<number>(48);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !team) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setIsSubmitting(true);
    try {
      assignActingOrganizer(team.id, selectedUserId, durationHours);
      onClose();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Appoint Acting Organizer</h3>
              <p className="text-xs text-slate-400">
                Squad: <span className="text-slate-200 font-semibold">{team.name}</span>
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Appointee
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            >
              {eligibleVolunteers.map((vol) => (
                <option key={vol.id} value={vol.user_id}>
                  {vol.user?.name} ({vol.skills.slice(0, 2).join(", ")}) — {vol.workloadScore}% Load
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Appointment Duration (Auto-Expiring)</span>
              <span className="text-[11px] font-mono text-indigo-400">{durationHours} Hours</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[24, 48, 72, 168].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setDurationHours(hours)}
                  className={`py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    durationHours === hours
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {hours === 168 ? "7 Days" : `${hours}h`}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/20 text-xs text-violet-300">
            <p className="font-semibold text-violet-200">Temporary Elevation Rules:</p>
            <p className="text-[11px] text-violet-400/90 mt-0.5">
              The appointee gains full organizer clearance scoped exclusively to this team. Once the duration expires, permissions instantly revert without manual intervention.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedUserId || isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-aiGlow hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Appointing..." : "Confirm Appointment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
