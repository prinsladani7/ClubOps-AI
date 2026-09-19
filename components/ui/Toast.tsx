"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, Info, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  message: string | null;
  type?: "success" | "warning" | "error" | "ai" | "info";
  onClose?: () => void;
}

export function Toast({ message, type = "success", onClose }: ToastProps) {
  if (!message) return null;

  const isAi = type === "ai" || message.toLowerCase().includes("ai") || message.toLowerCase().includes("copilot");
  const isWarning = type === "warning" || message.toLowerCase().includes("burnout") || message.toLowerCase().includes("risk");
  const isError = type === "error" || message.toLowerCase().includes("failed") || message.toLowerCase().includes("denied");

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl max-w-md text-xs",
          isAi
            ? "border-indigo-500/50 bg-indigo-950/90 text-indigo-100 shadow-aiGlow"
            : isWarning
            ? "border-amber-500/50 bg-amber-950/90 text-amber-100"
            : isError
            ? "border-rose-500/50 bg-rose-950/90 text-rose-100"
            : "border-emerald-500/40 bg-slate-900/95 text-slate-100"
        )}
      >
        <div
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
            isAi
              ? "bg-indigo-600/30 text-indigo-400"
              : isWarning
              ? "bg-amber-500/20 text-amber-400"
              : isError
              ? "bg-rose-500/20 text-rose-400"
              : "bg-emerald-500/20 text-emerald-400"
          )}
        >
          {isAi ? (
            <Sparkles className="w-4 h-4 animate-pulse" />
          ) : isWarning ? (
            <AlertTriangle className="w-4 h-4" />
          ) : isError ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold">{message}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">ClubOps Live Telemetry</p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
