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
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as UserRole) || "volunteer";

  const [role, setRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { register, showToast } = useClubOps();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters in length.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await register(name, email, role, password);
      if (res.success) {
        showToast(`Account successfully registered as ${role.toUpperCase()}`);
        if (role === "admin") router.push("/admin/dashboard");
        else if (role === "organizer") router.push("/organizer/dashboard");
        else router.push("/volunteer/dashboard");
      } else {
        setErrorMessage(res.error || "Failed to create account.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Registration error occurred.");
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
            href="/auth/role"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Choose Role</span>
          </Link>

          <Badge variant="cyan" className="uppercase text-[10px] tracking-wider font-mono">
            New Account
          </Badge>
        </div>

        {/* Title */}
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create {role.charAt(0).toUpperCase() + role.slice(1)} Profile
          </h1>
          <p className="text-xs text-slate-400">
            Join the autonomous event operating system. Roles are mapped to RBAC clearance scopes.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl border border-slate-800 bg-slate-950/80 text-xs">
          <button
            type="button"
            onClick={() => setRole("admin")}
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
            onClick={() => setRole("organizer")}
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
            onClick={() => setRole("volunteer")}
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
          <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Full Name</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Yashvardhan Joshi"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
              />
            </div>
          </div>

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
                placeholder="yash@syntaxsquad.edu"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
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

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white transition-all shadow-aiGlow flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Registering Credentials...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create {role.toUpperCase()} Account</span>
              </>
            )}
          </button>
        </form>

        {/* Switch to Login */}
        <div className="text-center pt-2 text-xs text-slate-400">
          Already have an account?{" "}
          <Link
            href={`/auth/login?role=${role}`}
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
          >
            Sign In as {role.charAt(0).toUpperCase() + role.slice(1)}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthRegisterPage() {
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

        <div className="flex items-center gap-2">
          <Badge variant="cyan" className="text-[11px] py-1 px-3">
            LJ TechFest 2026 Active
          </Badge>
        </div>
      </header>

      {/* Form with Suspense */}
      <Suspense fallback={<div className="text-center text-slate-400 py-16">Loading registration form...</div>}>
        <RegisterForm />
      </Suspense>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/60 z-10 gap-3">
        <p>© 2026 ClubOps AI Event Operations System. Autonomous Role-Based Architecture.</p>
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
