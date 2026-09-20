"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrganizerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Organizer Boundary Exception]", error);
  }, [error]);

  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-5 animate-in fade-in">
      <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-950/40">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] font-mono text-cyan-400 uppercase font-bold tracking-wider">
          Organizer Portal Fault Boundary
        </span>
        <h2 className="text-xl font-bold text-white">Workstream Console Exception</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          An exception occurred within the organizer view. Task assignments and project charters remain securely stored.
        </p>
      </div>

      <div className="flex items-center gap-2.5 pt-2">
        <Button
          onClick={() => reset()}
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-md"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reload View</span>
        </Button>

        <Link
          href="/organizer/dashboard"
          className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Lead Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
