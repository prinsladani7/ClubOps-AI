"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Lock,
  Mail,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { forgotPassword, resetPassword, showToast } = useClubOps();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await forgotPassword(email);
      setSuccessMessage(res.message || "Reset token dispatched to your registered address.");
      setStep("reset");
      showToast("Password reset instructions dispatched.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initiate reset.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await resetPassword(token, newPassword);
      setSuccessMessage("Password has been reset successfully! You can now log in.");
      showToast("Password updated.");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-8 z-10">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/auth/login"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>

          <Badge variant="cyan" className="uppercase text-[10px] tracking-wider font-mono">
            Security Recovery
          </Badge>
        </div>

        {/* Title */}
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {step === "request" ? "Recover Account Password" : "Set New Password"}
          </h1>
          <p className="text-xs text-slate-400">
            {step === "request"
              ? "Provide your verified campus email address to receive password reset authorization."
              : "Enter the verification token received along with your updated secret password."}
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <p className="leading-relaxed">{successMessage}</p>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {step === "request" ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Registered Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@syntaxsquad.edu"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white transition-all shadow-aiGlow flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Dispatching Reset Request...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Send Password Reset Instructions</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Verification Token</label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="e.g. tok-reset-12345"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white transition-all shadow-aiGlow flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Updating Password...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm New Password</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2 text-xs text-slate-400">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
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

      <Suspense fallback={<div className="text-center text-slate-400 py-16">Loading recovery form...</div>}>
        <ForgotPasswordForm />
      </Suspense>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/60 z-10 gap-3">
        <p>© 2026 ClubOps AI Event Operations System. Security Clearance Module.</p>
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
