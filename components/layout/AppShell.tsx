"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { ShieldAlert, LogIn } from "lucide-react";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, currentUser } = useClubOps();

  const isAuthPage = pathname === "/login";

  // If user is not authenticated and trying to access protected routes, allow preview but surface prompt
  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100">
      {isAuthPage ? (
        <main className="min-h-screen flex flex-col">{children}</main>
      ) : (
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            {!isAuthenticated && (
              <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-amber-300">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>You are currently in guest preview mode. Sign in to unlock full operational controls.</span>
                </div>
                <Link
                  href="/login"
                  className="px-3 py-1 rounded bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              </div>
            )}
            <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
