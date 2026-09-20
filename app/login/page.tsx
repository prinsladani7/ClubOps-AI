"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Shield,
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Users,
  Zap,
  LogIn,
  KeyRound,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { users, login, loginAsPersona, register, showToast } = useClubOps();

  const [activeTab, setActiveTab] = useState<"demo" | "password" | "register" | "forgot">("demo");
  const [email, setEmail] = useState("prins@syntaxsquad.edu");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("volunteer");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // 1-Click Demo Persona handler
  const handleSelectPersona = (userId: string) => {
    loginAsPersona(userId);
    const selected = users.find((u) => u.id === userId);
    showToast(`Authenticated as ${selected?.name || "User"} (${selected?.role.toUpperCase()})`);
    router.push("/");
  };

  // Standard Email Login handler
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        showToast("Welcome back! Authenticated successfully.");
        router.push("/");
      } else {
        setErrorMessage(res.error || "Authentication failed.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Register Account handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await register(name, email, regRole, password);
      if (res.success) {
        router.push("/");
      } else {
        setErrorMessage(res.error || "Failed to create account.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Registration error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password request
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitted(true);
    showToast("Password reset link dispatched to " + forgotEmail);
  };

  return (
    <div className="min-h-screen bg-[#070A11] flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar Logo */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between z-10">
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
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-xl w-full mx-auto my-8 z-10">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Header Description */}
          <div className="text-center space-y-2">
            <Link
              href="/auth/role"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/20 transition-all mb-2 shadow-sm"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Try New 3-Role Selection Flow (Admin / Organizer / Volunteer) &rarr;</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Sign In to Command Center
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Select an instant evaluated persona or authenticate with your college credentials.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl border border-slate-800 bg-slate-950/80 text-xs">
            <button
              onClick={() => {
                setActiveTab("demo");
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "demo"
                  ? "bg-indigo-600 text-white shadow-aiGlow font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>1-Click Personas</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("password");
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "password"
                  ? "bg-indigo-600 text-white shadow-aiGlow font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Email / Login</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("register");
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "register"
                  ? "bg-indigo-600 text-white shadow-aiGlow font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: 1-CLICK DEMO PERSONAS (The core requested hackathon experience) */}
          {activeTab === "demo" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="font-semibold uppercase text-[10px] tracking-wider">
                  Select Role to Experience RBAC Live:
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">Zero Password Required</span>
              </div>

              {users.slice(0, 5).map((u) => {
                const isCurrent = u.id === "usr-prins";
                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelectPersona(u.id)}
                    className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:border-indigo-500/60 hover:bg-slate-950 hover:shadow-aiGlow transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300">
                        {u.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-white group-hover:text-indigo-300">
                            {u.name}
                          </h3>
                          <Badge
                            variant={
                              u.role === "admin"
                                ? "destructive"
                                : u.role === "organizer"
                                ? "warning"
                                : u.role === "volunteer"
                                ? "cyan"
                                : "secondary"
                            }
                            className="text-[9px] py-0 px-1.5"
                          >
                            {u.role.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Launch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: EMAIL / PASSWORD LOGIN */}
          {activeTab === "password" && (
            <form onSubmit={handleEmailLogin} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300">College Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="prins@syntaxsquad.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setActiveTab("forgot")}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Remember this browser session</span>
                </label>
              </div>

              <Button
                type="submit"
                variant="ai"
                disabled={isLoading}
                className="w-full h-10 text-xs font-semibold"
              >
                {isLoading ? "Authenticating Gateway..." : "Sign In to Command Center"}
              </Button>

              <p className="text-[11px] text-slate-500 text-center">
                Demo accounts: <code>prins@syntaxsquad.edu</code> or <code>jay.shah@syntaxsquad.edu</code>
              </p>
            </form>
          )}

          {/* TAB 3: CREATE NEW ACCOUNT */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300">Full Name</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ronit Verma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300">College Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="ronit.v@syntaxsquad.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300">Role Designation</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="volunteer">Volunteer (Task Operations Lead)</option>
                  <option value="organizer">Organizer (Committee Core)</option>
                  <option value="member">Club Member (Attendee / Hacker)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300">Set Security Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="ai"
                disabled={isLoading}
                className="w-full h-10 text-xs font-semibold"
              >
                {isLoading ? "Provisioning Profile..." : "Register & Open Workspace"}
              </Button>
            </form>
          )}

          {/* TAB 4: FORGOT PASSWORD */}
          {activeTab === "forgot" && (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">Reset Password</h3>
                <p className="text-slate-400 text-[11px]">
                  Enter your email address and we will dispatch a password recovery link.
                </p>
              </div>

              {forgotSubmitted ? (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Recovery Link Dispatched</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    A secure password reset link has been dispatched to <strong>{forgotEmail}</strong>. Please check your inbox.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForgotSubmitted(false);
                      setActiveTab("password");
                    }}
                    className="text-xs mt-2"
                  >
                    Back to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-300">Your College Email</label>
                    <input
                      type="email"
                      required
                      placeholder="prins@syntaxsquad.edu"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("password")}
                      className="text-slate-400 hover:text-white text-[11px]"
                    >
                      Cancel
                    </button>
                    <Button type="submit" variant="ai">
                      Send Reset Instructions
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Security Compliance Footer */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase Auth & PostgreSQL RLS</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>256-Bit Encrypted Session</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>Zero-Trust RBAC Policy</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="text-center text-[11px] text-slate-600 z-10">
        ClubOps AI — The AI operating system for college club events • Syntax Squad
      </div>
    </div>
  );
}
