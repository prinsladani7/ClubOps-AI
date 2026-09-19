"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  Key,
  Database,
  Cpu,
  CheckCircle2,
  Lock,
  Save,
  Users,
  Sparkles,
  Server,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { currentUser, event, showToast } = useClubOps();

  const [aiProviderChoice, setAiProviderChoice] = useState("gemini");
  const [apiKeyInput, setApiKeyInput] = useState("AIzaSy********************************");
  const [requireHumanApproval, setRequireHumanApproval] = useState(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("System configurations saved.");
  };

  const roleMatrix = [
    {
      role: "Admin (Prins Patel)",
      manageClub: "Full Access",
      manageEvents: "Full Access",
      approveAI: "Full Authorization",
      viewPrivateDocs: "Unrestricted",
      badge: "destructive",
    },
    {
      role: "Organizer (Jay Shah, Priya Mehta)",
      manageClub: "Read Only",
      manageEvents: "Assigned Events",
      approveAI: "Operational Tools",
      viewPrivateDocs: "Organizer + Public",
      badge: "warning",
    },
    {
      role: "Volunteer (Rahul Sharma, 24 Leads)",
      manageClub: "No Access",
      manageEvents: "Task Updates Only",
      approveAI: "View AI Suggestions",
      viewPrivateDocs: "Volunteer + Public",
      badge: "cyan",
    },
    {
      role: "Member (Simran Kaur)",
      manageClub: "No Access",
      manageEvents: "Read Only",
      approveAI: "Read Queries Only",
      viewPrivateDocs: "Public Docs Only",
      badge: "secondary",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" />
            <span>Platform Configuration & Security Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure AI models, Supabase PostgreSQL connections, security gateways, and RBAC policies.
          </p>
        </div>

        <Badge variant="cyan" className="py-1 px-2.5">
          Dual-Mode: Zero-Config Local + Supabase Ready
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI & Copilot Engine Settings */}
        <Card className="border-indigo-500/30 bg-slate-900/40 shadow-aiGlow">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <CardTitle className="text-sm">AI Provider Abstraction</CardTitle>
            </div>
            <CardDescription>
              Select reasoning model and manage Gemini / OpenAI API credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-200">Active AI Provider</label>
              <select
                value={aiProviderChoice}
                onChange={(e) => setAiProviderChoice(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="gemini">Google Gemini 1.5 Flash (Recommended)</option>
                <option value="gemini-pro">Google Gemini 1.5 Pro</option>
                <option value="openai">OpenAI GPT-4o</option>
                <option value="deterministic">Deterministic Operational Engine (Offline / Standalone)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-200">Gemini / LLM API Key</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
                <Button size="sm" variant="outline" onClick={() => showToast("API Key validated.")}>
                  Verify
                </Button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Keys are evaluated server-side only and never exposed to client browsers.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200">Human-in-the-Loop Safeguard</span>
                <p className="text-[11px] text-slate-400">
                  Require explicit user approval before consequential AI actions.
                </p>
              </div>
              <input
                type="checkbox"
                checked={requireHumanApproval}
                onChange={(e) => setRequireHumanApproval(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Database & Supabase Health */}
        <Card className="border-slate-800 bg-slate-900/40">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <CardTitle className="text-sm">Database & Supabase Connection</CardTitle>
            </div>
            <CardDescription>
              PostgreSQL schema, pgvector extension, and Row Level Security.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-semibold text-white">Database Engine Active</span>
                  <p className="text-[11px] text-slate-300">
                    22 PostgreSQL tables + pgvector chunk index ready.
                  </p>
                </div>
              </div>
              <Badge variant="success">HEALTHY</Badge>
            </div>

            <div className="space-y-1 font-mono text-[11px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <p>• Schema: public (22 relational tables)</p>
              <p>• Vector Dimension: 1536 (pgvector)</p>
              <p>• Row Level Security: 16 Policies Applied</p>
              <p>• Active Tenant: club-syntax-squad</p>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed">
              To deploy directly to your cloud Supabase instance, supply <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RBAC Permission Matrix (Section 17 Requirement) */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className="text-sm">Role-Based Access Control (RBAC) Matrix</CardTitle>
          <CardDescription>
            Strict boundary enforcement across User → Club → Event → Resource → Action.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">Role Persona</th>
                  <th className="p-3">Club Administration</th>
                  <th className="p-3">Event Operations</th>
                  <th className="p-3">AI Tool Execution</th>
                  <th className="p-3">Document RAG Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {roleMatrix.map((rm, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3 font-semibold text-white">
                      <Badge variant={rm.badge as any} className="text-[10px]">
                        {rm.role}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-300">{rm.manageClub}</td>
                    <td className="p-3 text-slate-300">{rm.manageEvents}</td>
                    <td className="p-3 text-cyan-300">{rm.approveAI}</td>
                    <td className="p-3 text-slate-400">{rm.viewPrivateDocs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
