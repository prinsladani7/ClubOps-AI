"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";

export default function RootGatewayPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isHydrated } = useClubOps();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace("/auth/role");
    } else if (currentUser.role === "admin") {
      router.replace("/admin/dashboard");
    } else if (currentUser.role === "organizer") {
      router.replace("/organizer/dashboard");
    } else if (currentUser.role === "volunteer") {
      router.replace("/volunteer/dashboard");
    } else {
      router.replace("/auth/role");
    }
  }, [currentUser, isAuthenticated, isHydrated, router]);

  return (
    <div className="min-h-screen bg-[#070A11] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-sm w-full p-8 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-2xl shadow-2xl flex flex-col items-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-aiGlow flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-base font-bold text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>ClubOps</span>
            <span className="text-xs font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              AI
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Autonomous Role-Based Operations System
          </p>
        </div>

        <div className="w-full pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-indigo-300 font-mono">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>
            {!isHydrated
              ? "Verifying security context..."
              : !isAuthenticated
              ? "Access restricted. Directing to login..."
              : `Access verified. Launching ${currentUser.role.toUpperCase()} workspace...`}
          </span>
        </div>
      </div>
    </div>
  );
}
