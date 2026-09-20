"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Toast } from "@/components/ui/Toast";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { canAccessRoute } from "@/lib/permissions";
import { db } from "@/lib/db";
import { LogIn, Lock, ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { RequestAccessModal } from "@/components/rbac/RequestAccessModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isHydrated, currentUser, roleAssignments, toastMessage } = useClubOps();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const loggedRef = useRef<string | null>(null);

  const isAuthPage = pathname === "/login" || pathname.startsWith("/auth");

  // Compulsory Login: If not on an auth route and unauthenticated, redirect immediately
  useEffect(() => {
    if (isHydrated && !isAuthenticated && !isAuthPage) {
      router.replace("/auth/role");
    }
  }, [isHydrated, isAuthenticated, isAuthPage, router]);

  // Check RBAC route permission for authenticated user
  const isAllowed = isAuthPage || (isAuthenticated && canAccessRoute(currentUser, pathname, roleAssignments));

  // Automatically record unauthorized route attempt in audit logs (Section 15)
  useEffect(() => {
    if (isAuthenticated && !isAllowed && !isAuthPage && loggedRef.current !== pathname) {
      loggedRef.current = pathname;
      db.addAuditLog({
        actor_user_id: currentUser.id,
        actor_type: "user",
        action: "UNAUTHORIZED_ROUTE_ATTEMPT",
        entity_type: "route",
        entity_id: pathname,
        metadata_json: {
          pathname,
          userRole: currentUser.role,
          userName: currentUser.name,
        },
      });
    }
  }, [isAllowed, isAuthPage, pathname, currentUser, isAuthenticated]);

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {isAuthPage ? (
        <main className="min-h-screen flex flex-col">{children}</main>
      ) : !isHydrated ? (
        /* Gateway Initializing State */
        <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-aiGlow mb-4 animate-pulse">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-sm font-semibold text-white">ClubOps AI Secure Gateway</h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Verifying operational credentials...</span>
          </p>
        </main>
      ) : !isAuthenticated ? (
        /* MANDATORY LOGIN ENFORCEMENT: Strictly no access without login */
        <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-md w-full p-8 rounded-2xl border border-rose-500/30 bg-slate-900/80 backdrop-blur-2xl shadow-2xl flex flex-col items-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-950/50">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-rose-400 uppercase font-bold tracking-wider">
                Authentication Compulsory
              </span>
              <h1 className="text-xl font-bold text-white">Access Denied — Login Required</h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm pt-1">
                Access to ClubOps AI operations is strictly restricted. You must select an authorized role and log in before accessing club assets.
              </p>
            </div>

            <div className="pt-3 w-full flex flex-col sm:flex-row gap-3 items-center justify-center">
              <Link
                href="/auth/role"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-aiGlow transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Select Role & Sign In</span>
              </Link>
            </div>
          </div>
        </main>
      ) : (
        /* Authenticated Operational Experience */
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />

            <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
              {!isAllowed ? (
                /* ACCESS DENIED VIEW WITH REQUEST ACCESS BUTTON (Section 15) */
                <div className="py-16 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-950/50">
                    <Lock className="w-8 h-8" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-rose-400 uppercase font-bold tracking-wider">
                      Clearance Protocol 403
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Access Denied — Insufficient Clearance
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your active profile (
                      <span className="text-slate-200 font-semibold">{currentUser.name}</span>, role:{" "}
                      <span className="text-indigo-300 font-mono font-bold uppercase">{currentUser.role}</span>
                      ) does not possess the requisite operational clearance to view <span className="text-slate-200 font-mono">{pathname}</span>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono text-left w-full space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Action Attempted:</span>
                      <span className="text-rose-300">ROUTE_INSPECTION</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Security Enforcement:</span>
                      <span className="text-emerald-400">STRICT_RBAC_ACTIVE</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2">
                    <Link
                      href="/"
                      className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Return to Safe Zone</span>
                    </Link>

                    <button
                      onClick={() => setIsRequestModalOpen(true)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-aiGlow hover:from-indigo-500 hover:to-violet-500 transition-all flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Request Access</span>
                    </button>
                  </div>
                </div>
              ) : (
                children
              )}
            </main>
          </div>
        </div>
      )}

      {/* Global floating toast notification */}
      <Toast message={toastMessage} />

      {/* Global Request Access Modal */}
      <RequestAccessModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
}
