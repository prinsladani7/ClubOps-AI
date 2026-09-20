"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Shield,
  Briefcase,
  Users,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  LogIn,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as UserRole) || "volunteer";

  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState(() => {
    if (initialRole === "admin") return "prins@syntaxsquad.edu";
    if (initialRole === "organizer") return "jay.shah@syntaxsquad.edu";
    return "rahul.sharma@syntaxsquad.edu";
  });
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPendingVerification, setIsPendingVerification] = useState(false);

  const { login, loginAsPersona, users, showToast } = useClubOps();

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setErrorMessage(null);
    setIsPendingVerification(false);
    if (newRole === "admin") setEmail("prins@syntaxsquad.edu");
    else if (newRole === "organizer") setEmail("jay.shah@syntaxsquad.edu");
    else setEmail("rahul.sharma@syntaxsquad.edu");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsPendingVerification(false);
    setIsLoading(true);

    try {
      const res = await login(email, password, role);
      if (res.success) {
        showToast(`Authenticated successfully as ${role.toUpperCase()}`);
        if (role === "admin") router.push("/admin/dashboard");
        else if (role === "organizer") router.push("/organizer/dashboard");
        else router.push("/volunteer/dashboard");
      } else {
        setErrorMessage(res.error || "Authentication failed.");
        if (res.pendingVerification) {
          setIsPendingVerification(true);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handle1ClickPersona = (userId: string) => {
    loginAsPersona(userId);
    const u = users.find((user) => user.id === userId);
    showToast(`Quick Persona Switched to ${u?.name}`);
    if (u?.role === "admin") router.push("/admin/dashboard");
    else if (u?.role === "organizer") router.push("/organizer/dashboard");
    else router.push("/volunteer/dashboard");
  };

  return (
    <div className="max-w-md w-full mx-auto my-8 z-10">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Back to Role Selection */}
        <div className="flex items-center justify-between">
          <Link
            href="/auth/role"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Choose Different Role</span>
          </Link>

          <Badge variant="cyan" className="uppercase text-[10px] tracking-wider font-mono">
            {role} Portal
          </Badge>
        </div>

        {/* Title */}
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Sign In as {role.charAt(0).toUpperCase() + role.slice(1)}
          </h1>
          <p className="text-xs text-slate-400">
            Enter your credentials. Backend authorization validates permissions from database records.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl border border-slate-800 bg-slate-950/80 text-xs">
          <button
            type="button"
            onClick={() => handleRoleChange("admin")}
            className={`py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              role === "admin"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("organizer")}
            className={`py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              role === "organizer"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Organizer</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("volunteer")}
            className={`py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              role === "volunteer"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Volunteer</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <p className="leading-relaxed">{errorMessage}</p>
              {isPendingVerification && (
                <Link
                  href={`/auth/verify?email=${encodeURIComponent(email)}`}
                  className="inline-flex items-center gap-1 font-semibold text-rose-200 underline hover:text-white"
                >
                  Proceed to Email Verification Screen <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Campus Email</span>
              <span className="text-[10px] text-slate-400 font-mono">@syntaxsquad.edu</span>
            </label>
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">Password</label>
              <Link
                href={`/auth/forgot-password?email=${encodeURIComponent(email)}`}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white transition-all shadow-aiGlow flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating with RBAC Engine...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to {role.toUpperCase()} Console</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Persona Shortcuts */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono uppercase">Quick 1-Click Personas</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handle1ClickPersona("usr-prins")}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-left transition-all group"
            >
              <p className="font-semibold text-slate-200 group-hover:text-rose-300">Prins Patel</p>
              <p className="text-[10px] text-rose-400 font-mono">Admin</p>
            </button>

            <button
              type="button"
              onClick={() => handle1ClickPersona("usr-jay")}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group"
            >
              <p className="font-semibold text-slate-200 group-hover:text-indigo-300">Jay Shah</p>
              <p className="text-[10px] text-indigo-400 font-mono">Organizer</p>
            </button>

            <button
              type="button"
              onClick={() => handle1ClickPersona("usr-rahul")}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group"
            >
              <p className="font-semibold text-slate-200 group-hover:text-cyan-300">Rahul Sharma</p>
              <p className="text-[10px] text-cyan-400 font-mono">Volunteer</p>
            </button>
          </div>
        </div>

        {/* Switch to Register */}
        <div className="text-center pt-2 text-xs text-slate-400">
          Don&apos;t have an account yet?{" "}
          <Link
            href={`/auth/register?role=${role}`}
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
          >
            Create {role.charAt(0).toUpperCase() + role.slice(1)} Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthLoginPage() {
  return (
    <div className="min-h-screen bg-[#070A11] flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar Logo */}
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

        <div className="flex items-center gap-2">
          <Badge variant="cyan" className="text-[11px] py-1 px-3">
            LJ TechFest 2026 Active
          </Badge>
        </div>
      </header>

      {/* Main Authentication Form wrapped in Suspense for searchParams */}
      <Suspense fallback={<div className="text-center text-slate-400 py-16">Loading authentication portal...</div>}>
        <LoginForm />
      </Suspense>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/60 z-10 gap-3">
        <p>© 2026 ClubOps AI Event Operations System. Autonomous Role-Based Architecture.</p>
        <div className="flex items-center gap-4">
          <Link href="/auth/role" className="hover:text-slate-300 transition-colors">
            Role Selection
          </Link>
          <span>•</span>
          <Link href="/auth/verify" className="hover:text-slate-300 transition-colors">
            Verify Email
          </Link>
          <span>•</span>
          <Link href="/auth/forgot-password" className="hover:text-slate-300 transition-colors">
            Forgot Password
          </Link>
        </div>
      </footer>
    </div>
  );
}
