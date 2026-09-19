"use client";

import React, { useState } from "react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { PermissionAction, PermissionScope } from "@/types";
import { ShieldAlert, X, Send, Lock, Clock, CheckCircle2 } from "lucide-react";

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPermission?: PermissionAction;
  defaultScope?: PermissionScope;
  defaultScopeId?: string;
  defaultResourceType?: string;
}

const PERMISSION_OPTIONS: { label: string; value: PermissionAction; description: string }[] = [
  { label: "Approve AI Actions (Sign-Off)", value: "APPROVE_AI_ACTION", description: "Authorization to execute sensitive AI recommendations and side effects" },
  { label: "Edit Team & Manage Roster", value: "EDIT_TEAM", description: "Update team mandates, transfer contributors, and adjust squad metadata" },
  { label: "Assign Volunteers & Personnel", value: "ASSIGN_VOLUNTEER", description: "Allocate volunteers to operational teams and deliverables" },
  { label: "Create & Modify Tasks", value: "CREATE_TASK", description: "Initiate operational task requirements across teams" },
  { label: "Edit Event Schedule & Parameters", value: "EDIT_EVENT", description: "Update master event timeline, staging, and logistics slots" },
  { label: "View Audit Logs & Compliance Trail", value: "VIEW_AUDIT", description: "Inspect comprehensive organization and user audit records" },
  { label: "Manage Organization Settings", value: "MANAGE_SETTINGS", description: "Configure high-level club policies and administrative options" },
];

export function RequestAccessModal({
  isOpen,
  onClose,
  defaultPermission = "APPROVE_AI_ACTION",
  defaultScope = "team",
  defaultScopeId = "team-tech-ops",
  defaultResourceType = "team",
}: RequestAccessModalProps) {
  const { currentUser, teams, createPermissionRequest } = useClubOps();

  const [permission, setPermission] = useState<PermissionAction>(defaultPermission);
  const [scopeType, setScopeType] = useState<PermissionScope>(defaultScope);
  const [scopeId, setScopeId] = useState<string>(defaultScopeId);
  const [reason, setReason] = useState<string>("");
  const [durationHours, setDurationHours] = useState<number>(24);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      createPermissionRequest({
        permission,
        scope_type: scopeType,
        scope_id: scopeId,
        resource_type: defaultResourceType,
        reason: reason.trim(),
        duration_hours: durationHours,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setIsSubmitting(false);
        onClose();
      }, 1500);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Access Request Dispatched</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your formal justification has been delivered to Organization Administrators. You will receive an in-app notification upon review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Request Elevated Clearance</h3>
                <p className="text-xs text-slate-400">
                  Submitting as <span className="text-slate-200 font-semibold">{currentUser.name}</span> ({currentUser.role.toUpperCase()})
                </p>
              </div>
            </div>

            {/* Permission Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Requested Permission / Role
              </label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as PermissionAction)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {PERMISSION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Scope Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Scope Tier
                </label>
                <select
                  value={scopeType}
                  onChange={(e) => setScopeType(e.target.value as PermissionScope)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="team">Team Scope</option>
                  <option value="event">Event Scope</option>
                  <option value="organization">Organization Scope</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Team / Context
                </label>
                <select
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Requested Duration</span>
                <span className="text-[11px] font-mono text-indigo-400">{durationHours} Hours</span>
              </label>
              <div className="flex gap-2">
                {[12, 24, 48, 72].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setDurationHours(hours)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      durationHours === hours
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>

            {/* Business Justification */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Operational Justification <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Detail the operational need, incident, or deliverable requiring elevated access..."
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Action Buttons */}
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
                disabled={!reason.trim() || isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-aiGlow hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Submitting..." : "Send Request"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
