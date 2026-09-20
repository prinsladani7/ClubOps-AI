"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Briefcase,
  Users,
  Sparkles,
  ArrowRight,
  UserPlus,
  LogIn,
  CheckCircle2,
  Lock,
  Zap,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types";

interface RoleOption {
  id: UserRole;
  title: string;
  tagline: string;
  description: string;
  badge: string;
  icon: React.ElementType;
  glowColor: string;
  borderActive: string;
  demoUser: {
    name: string;
    email: string;
    id: string;
  };
  features: string[];
}

const ROLES: RoleOption[] = [
  {
    id: "admin",
    title: "Admin",
    tagline: "Executive Governance & Club Authority",
    description: "Create projects, define organizational scope, oversee organizers, manage global permissions, view immutable audit logs, and revoke sessions.",
    badge: "Full Organization Scope",
    icon: Shield,
    glowColor: "from-rose-500/20 to-indigo-500/20",
    borderActive: "border-rose-500/60 ring-rose-500/20 shadow-rose-950/40",
    demoUser: {
      name: "Prins Patel",
      email: "prins@syntaxsquad.edu",
      id: "usr-prins",
    },
    features: [
      "Project creation & archival",
      "Assign & remove organizers",
      "Global team & audit log access",
      "Security & session controls",
    ],
  },
  {
    id: "organizer",
    title: "Organizer",
    tagline: "Project Leadership & Team Operations",
    description: "Lead designated projects, assign tasks to available volunteers, validate deliverables, manage dependencies, and request scope elevations.",
    badge: "Assigned Project Scope",
    icon: Briefcase,
    glowColor: "from-indigo-500/20 to-cyan-500/20",
    borderActive: "border-indigo-500/60 ring-indigo-500/20 shadow-indigo-950/40",
    demoUser: {
      name: "Jay Shah",
      email: "jay.shah@syntaxsquad.edu",
      id: "usr-jay",
    },
    features: [
      "Assigned project operations",
      "Task creation & volunteer assignment",
      "Evidence verification & signoff",
      "Milestone progress reporting",
    ],
  },
  {
    id: "volunteer",
    title: "Volunteer",
    tagline: "Task Execution & Deliverable Delivery",
    description: "Accept and work on assigned tasks, submit verification evidence, log hours spent, report blockers, and collaborate with project squads.",
    badge: "Assigned Task Scope",
    icon: Users,
    glowColor: "from-cyan-500/20 to-emerald-500/20",
    borderActive: "border-cyan-500/60 ring-cyan-500/20 shadow-cyan-950/40",
    demoUser: {
      name: "Rahul Sharma",
      email: "rahul.sharma@syntaxsquad.edu",
      id: "usr-rahul",
    },
    features: [
      "Execute assigned tasks & checklists",
      "Upload deliverable evidence",
      "Log hours & attendance",
      "Escalate blockers to organizer",
    ],
  },
];

export default function RoleSelectionPage() {
  const router = useRouter();
  const { loginAsPersona, showToast } = useClubOps();
  const [selectedRole, setSelectedRole] = useState<UserRole>("organizer");

  const currentRole = ROLES.find((r) => r.id === selectedRole) || ROLES[1];

  const handleQuickDemo = () => {
    loginAsPersona(currentRole.demoUser.id);
    showToast(`Logged in as ${currentRole.demoUser.name} (${currentRole.title})`);
    if (selectedRole === "admin") {
      router.push("/admin/dashboard");
    } else if (selectedRole === "organizer") {
      router.push("/organizer/dashboard");
    } else {
      router.push("/volunteer/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#070A11] flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

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

        <div className="flex items-center gap-3">
          <Badge variant="cyan" className="text-xs py-1 px-3">
            LJ TechFest 2026 Active Context
          </Badge>
        </div>
      </header>

      {/* Main Question Container */}
      <main className="max-w-4xl w-full mx-auto my-auto py-8 z-10 space-y-8">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-xs px-3 py-1 border-indigo-500/30 text-indigo-300 bg-indigo-500/10">
            Step 1 • Role Verification
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Who are you logging in as?
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Select your operational role. Permissions and resource scopes will be strictly enforced by the backend access control engine.
          </p>
        </div>

        {/* 3 Primary Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between border bg-slate-900/60 backdrop-blur-xl ${
                  isSelected
                    ? `${role.borderActive} ring-2 bg-slate-900/90 shadow-2xl scale-[1.02]`
                    : "border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80"
                }`}
              >
                {/* Active Indicator Radio Check */}
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    isSelected
                      ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md"
                      : "bg-slate-800/60 border-slate-700 text-slate-400"
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "border-slate-700 bg-slate-800/40"
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {role.title}
                    </h3>
                  </div>
                  <p className="text-[11px] font-mono text-indigo-400 font-semibold uppercase tracking-wider">
                    {role.tagline}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {role.description}
                  </p>
                </div>

                {/* Role Features List */}
                <div className="mt-5 pt-4 border-t border-slate-800/60 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Capabilities:
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {role.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-indigo-400" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 pt-3 flex items-center justify-between border-t border-slate-800/40">
                  <span className="text-[10px] font-mono text-slate-400">Demo Persona:</span>
                  <span className="text-xs font-semibold text-indigo-300">{role.demoUser.name}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Panel for Selected Role */}
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900/90 via-indigo-950/20 to-slate-900/90 p-6 sm:p-8 backdrop-blur-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs text-slate-400 font-mono">Selected Role:</span>
              <Badge variant="cyan" className="font-bold text-xs uppercase">
                {currentRole.title}
              </Badge>
              <span className="text-[11px] text-slate-400 font-mono">({currentRole.badge})</span>
            </div>
            <p className="text-xs text-slate-300">
              Ready to authenticate as {currentRole.title}. Choose your authentication mode below:
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
            {/* 1-Click Instant Persona */}
            <button
              onClick={handleQuickDemo}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Demo ({currentRole.demoUser.name})</span>
            </button>

            {/* Standard Login */}
            <Link
              href={`/auth/login?role=${selectedRole}`}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white transition-all shadow-aiGlow flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In as {currentRole.title}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Create Account */}
            <Link
              href={`/auth/register?role=${selectedRole}`}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/40 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create {currentRole.title} Account</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/60 z-10 gap-3">
        <p>© 2026 ClubOps AI Event Operations System. Autonomous Role-Based Architecture.</p>
        <div className="flex items-center gap-4">
          <Link href="/auth/forgot-password" className="hover:text-slate-300 transition-colors">
            Forgot Password
          </Link>
          <span>•</span>
          <Link href="/auth/verify" className="hover:text-slate-300 transition-colors">
            Verify Email
          </Link>
          <span>•</span>
          <Link href="/login" className="hover:text-slate-300 transition-colors">
            Classic Login Portal
          </Link>
        </div>
      </footer>
    </div>
  );
}
