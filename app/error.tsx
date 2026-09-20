"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception safely to client console for telemetry
    console.error("[ClubOps Route Exception]", error);
  }, [error]);

  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6 animate-in fade-in zoom-in-95">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-950/40">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-mono text-amber-400 uppercase font-bold tracking-wider">
          Workspace Error Boundary Caught An Issue
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          Unexpected Operational Glitch
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
          A client component encountered an error while rendering this view. The system isolated the glitch to protect your ongoing session.
        </p>
      </div>

      {/* Diagnostics */}
      <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-left space-y-1.5 text-slate-400">
        <div className="flex justify-between">
          <span className="text-slate-500">Status:</span>
          <span className="text-amber-300 font-semibold">RECOVERABLE_ERROR</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Diagnostics:</span>
          <span className="text-slate-300 truncate max-w-[280px]">
            {error?.message || "Internal component evaluation error"}
          </span>
        </div>
        {error?.digest && (
          <div className="flex justify-between">
            <span className="text-slate-500">Digest:</span>
            <span className="text-indigo-400">{error.digest}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button
          onClick={() => reset()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 flex items-center gap-2 shadow-aiGlow"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry Component</span>
        </Button>

        <Link
          href="/"
          className="px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return to Safety</span>
        </Link>
      </div>
    </div>
  );
}
