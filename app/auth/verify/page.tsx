"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  MailCheck,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialToken = searchParams.get("token") || "";

  const [inputVal, setInputVal] = useState(initialToken || initialEmail || "verify-token-12345");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { verifyEmail, showToast } = useClubOps();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await verifyEmail(inputVal);
      if (res.success) {
        setSuccess(true);
        showToast("Email verified successfully! Account is now Active.");
      } else {
        setErrorMessage(res.error || "Verification code not found or expired.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-8 z-10">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/auth/login"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>

          <Badge variant="cyan" className="uppercase text-[10px] tracking-wider font-mono">
            Verification Protocol
          </Badge>
        </div>

        {/* Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
            <MailCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Verify Campus Email
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Accounts must complete email verification before clearance is granted. Enter your confirmation token below.
          </p>
        </div>

        {/* Success Alert */}
        {success ? (
          <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Verification Successful! Account is now ACTIVE.</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Your status has been updated in the centralized security database. You may now sign in to your dashboard.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all gap-1.5 shadow-md"
            >
              <span>Continue to Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Verification Token or Campus Email
              </label>
              <input
                type="text"
                required
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="e.g. verify-token-12345 or user@syntaxsquad.edu"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Demo Hint: Test account <span className="text-indigo-300 font-mono">usr-pending</span> can be verified using token <span className="text-indigo-300 font-mono">verify-token-12345</span>.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white transition-all shadow-aiGlow flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Confirming Clearance...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Account</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2 text-xs text-slate-400">
          Already verified?{" "}
          <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
            Proceed to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-[#070A11] flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-aiGlow">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 group-hover:text-cyan-300 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-lg">ClubOps</span>
              <span className="text-xs font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                AI
              </span>
            </div>
            <p className="text-[10px] tracking-wider text-slate-400 uppercase font-medium">
              Autonomous Event OS
            </p>
          </div>
        </Link>
      </header>

      <Suspense fallback={<div className="text-center text-slate-400 py-16">Loading verification page...</div>}>
        <VerifyForm />
      </Suspense>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/60 z-10 gap-3">
        <p>© 2026 ClubOps AI Event Operations System. Autonomous Verification Service.</p>
        <div className="flex items-center gap-4">
          <Link href="/auth/role" className="hover:text-slate-300 transition-colors">
            Role Selection
          </Link>
          <span>•</span>
          <Link href="/auth/login" className="hover:text-slate-300 transition-colors">
            Sign In
          </Link>
        </div>
      </footer>
    </div>
  );
}
