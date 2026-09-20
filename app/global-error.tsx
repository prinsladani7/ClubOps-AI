"use client";

import React from "react";
import { AlertOctagon, RotateCcw, ShieldAlert, Home, Trash2 } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleResetSystemState = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch {
      // Ignore storage clear failures in private browsing
    }
    window.location.href = "/";
  };

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col items-center justify-center p-6 antialiased font-sans">
        <div className="relative max-w-lg w-full p-8 rounded-3xl border border-rose-500/30 bg-slate-900/90 backdrop-blur-2xl shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95">
          {/* Ambient error glow */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/50">
            <AlertOctagon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono text-rose-400 uppercase font-bold tracking-wider">
              Critical System Boundary Triggered
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Operational Exception Caught
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              ClubOps AI caught an unhandled application exception and contained it safely. No operational state was lost.
            </p>
          </div>

          {/* Error Digest Diagnostic */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-left space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Incident Classification:</span>
              <span className="text-rose-400 font-semibold">REACT_RENDER_FAULT</span>
            </div>
            {error?.digest && (
              <div className="flex justify-between text-slate-500">
                <span>Incident Digest:</span>
                <span className="text-slate-300">{error.digest}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Containment Protocol:</span>
              <span className="text-emerald-400">STATE_ISOLATED</span>
            </div>
          </div>

          {/* Recovery Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-aiGlow transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Operation</span>
            </button>

            <button
              onClick={handleResetSystemState}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4 text-amber-400" />
              <span>Reset Local Cache</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
