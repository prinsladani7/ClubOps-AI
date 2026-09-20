"use client";

import React from "react";
import Link from "next/link";
import { Compass, ArrowLeft, Home, Shield, Search, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="py-20 px-4 flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6 animate-in fade-in zoom-in-95">
      {/* 404 Visual Indicator */}
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-950/40 mx-auto">
          <Compass className="w-10 h-10 animate-spin text-indigo-400" style={{ animationDuration: "20s" }} />
        </div>
        <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-[10px] font-bold">
          404
        </span>
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-mono text-indigo-400 uppercase font-bold tracking-wider">
          Route Out of Scope
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Sector Not Located
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
          The requested operational resource or URL path does not exist within the authorized ClubOps AI event command architecture.
        </p>
      </div>

      {/* Suggested Quick Nav */}
      <div className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-left space-y-2.5">
        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
          Authorized Quick Portals:
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Link
            href="/war-room"
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-200 hover:text-white transition-colors flex items-center justify-between"
          >
            <span>War Room</span>
            <span className="text-rose-400 font-mono text-[10px]">LIVE &rarr;</span>
          </Link>
          <Link
            href="/judging"
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-200 hover:text-white transition-colors flex items-center justify-between"
          >
            <span>Expo Judging</span>
            <span className="text-yellow-400 font-mono text-[10px]">GAVEL &rarr;</span>
          </Link>
          <Link
            href="/tasks"
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-200 hover:text-white transition-colors flex items-center justify-between"
          >
            <span>Tasks Kanban</span>
            <span className="text-cyan-400 font-mono text-[10px]">KANBAN &rarr;</span>
          </Link>
          <Link
            href="/mentors"
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-200 hover:text-white transition-colors flex items-center justify-between"
          >
            <span>Mentor HelpQ</span>
            <span className="text-indigo-400 font-mono text-[10px]">QUEUE &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-aiGlow transition-all flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Return to Command Gateway</span>
        </Link>
      </div>
    </div>
  );
}
