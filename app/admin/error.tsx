"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, RotateCcw, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Boundary Exception]", error);
  }, [error]);

  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-5 animate-in fade-in">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-950/40">
        <ShieldAlert className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] font-mono text-rose-400 uppercase font-bold tracking-wider">
          Admin Clearance Fault Boundary
        </span>
        <h2 className="text-xl font-bold text-white">Administrative Module Exception</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          An operational exception occurred within the administrator console. Database persistence remains unaffected.
        </p>
      </div>

      <div className="flex items-center gap-2.5 pt-2">
        <Button
          onClick={() => reset()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-aiGlow"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reload Module</span>
        </Button>

        <Link
          href="/admin/dashboard"
          className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Admin Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
