"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VolunteerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Volunteer Boundary Exception]", error);
  }, [error]);

  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-5 animate-in fade-in">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-950/40">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] font-mono text-indigo-400 uppercase font-bold tracking-wider">
          Volunteer Portal Fault Boundary
        </span>
        <h2 className="text-xl font-bold text-white">Task Console Exception</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          An exception occurred while loading your assignments. Your accepted tasks and logged hours are preserved.
        </p>
      </div>

      <div className="flex items-center gap-2.5 pt-2">
        <Button
          onClick={() => reset()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-aiGlow"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reload Tasks</span>
        </Button>

        <Link
          href="/volunteer/dashboard"
          className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>My Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
