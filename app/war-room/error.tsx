"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Radio, RotateCcw, ShieldCheck, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WarRoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[War Room Telemetry Exception]", error);
  }, [error]);

  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-5 animate-in fade-in">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-950/40">
        <Radio className="w-7 h-7 animate-pulse" />
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] font-mono text-rose-400 uppercase font-bold tracking-wider">
          Mission Control Telemetry Boundary
        </span>
        <h2 className="text-xl font-bold text-white">Live Operations Stream Interrupted</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The telemetry feed encountered an exception. Background CPM engines and incident queue records remain active.
        </p>
      </div>

      <div className="flex items-center gap-2.5 pt-2">
        <Button
          onClick={() => reset()}
          className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-md"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Re-establish Stream</span>
        </Button>

        <Link
          href="/"
          className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Command Gateway</span>
        </Link>
      </div>
    </div>
  );
}
