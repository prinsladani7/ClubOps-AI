"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  ArrowRight,
  Clock,
  Terminal,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AIToolCall, AIMessage } from "@/types";

export default function AIAssistantPage() {
  const { currentUser, event, runAICommand, approveTool, showToast } = useClubOps();

  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "msg-welcome",
      conversation_id: "conv-main",
      role: "assistant",
      content: `Greetings **${currentUser.name}**! I am **ClubOps AI**, the operational command copilot for **${event.name}**.\n\nI inherit your active permissions (**${currentUser.role.toUpperCase()}**) and can answer procedural questions, analyze risks, inspect volunteer workloads, or propose structured operational actions with your approval.`,
      created_at: new Date().toISOString(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isTyping) return;

    const userMsg: AIMessage = {
      id: `msg-${Date.now()}-user`,
      conversation_id: "conv-main",
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await runAICommand(text);

      const aiMsg: AIMessage = {
        id: `msg-${Date.now()}-ai`,
        conversation_id: "conv-main",
        role: "assistant",
        content: response.content,
        created_at: new Date().toISOString(),
        tool_call: response.toolCall,
        sources: response.sources,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          conversation_id: "conv-main",
          role: "assistant",
          content: `⚠️ Error executing operational command: ${e?.message || "Unknown error"}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleToolDecision = (toolCallId: string, approved: boolean) => {
    const res = approveTool(toolCallId, approved);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.tool_call?.id === toolCallId) {
          return {
            ...m,
            tool_call: {
              ...m.tool_call,
              status: approved ? "executed" : "rejected",
              result_json: res.result,
            },
          };
        }
        return m;
      })
    );
  };

  const sampleCommands = [
    "What needs my attention right now?",
    "Create a high-priority task for Rahul to confirm the venue by Friday.",
    "Who has the highest workload?",
    "What are the sponsorship approval requirements?",
    "What could delay this event?",
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-400" />
            <span>AI Copilot & Autonomous Action Command Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Controlled AI tool execution with human-in-the-loop approvals, Zod validation, and permission inheritance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Badge variant="ai" className="gap-1.5 py-1 px-2.5">
            <Sparkles className="w-3 h-3" />
            <span>Safety Tier: Human-in-the-Loop</span>
          </Badge>
        </div>
      </div>

      {/* Suggested Command Prompts */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Suggested Commands:
        </span>
        {sampleCommands.map((cmd, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(cmd)}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-900 hover:text-white transition-all text-xs text-left"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Interactive Chat Console */}
      <Card className="border-indigo-500/30 bg-slate-950/80 shadow-2xl flex flex-col h-[650px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => {
            const isAI = msg.role === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isAI ? "justify-start" : "justify-end"}`}
              >
                {isAI && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                )}

                <div
                  className={`rounded-2xl p-4 max-w-2xl text-xs space-y-3 leading-relaxed ${
                    isAI
                      ? "border border-slate-800/80 bg-slate-900/70 text-slate-200"
                      : "bg-indigo-600 text-white shadow-aiGlow"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Grounded Sources Panel */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Verified Evidence & Citations:
                      </span>
                      {msg.sources.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1"
                        >
                          <div className="flex items-center justify-between text-cyan-400 font-semibold">
                            <span>📄 {s.document_name}</span>
                            <span className="text-[10px] font-mono">
                              Match: {Math.round(s.similarity * 100)}%
                            </span>
                          </div>
                          <p className="italic text-slate-400">&quot;{s.content}&quot;</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section 15 Compliant AI ACTION REQUEST Card */}
                  {msg.tool_call && (
                    <div className="rounded-xl border border-indigo-500/50 bg-slate-950 p-4 space-y-3 shadow-aiGlow">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                            AI ACTION REQUEST
                          </span>
                        </div>
                        <Badge
                          variant={
                            msg.tool_call.status === "executed"
                              ? "success"
                              : msg.tool_call.status === "rejected"
                              ? "destructive"
                              : "warning"
                          }
                          className="text-[9px]"
                        >
                          {msg.tool_call.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Action:</span>
                          <span className="font-semibold text-white">
                            {msg.tool_call.tool_name.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </div>
                        {msg.tool_call.arguments_json.owner && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Target Assignee:</span>
                            <span className="font-semibold text-cyan-300">
                              {msg.tool_call.arguments_json.owner}
                            </span>
                          </div>
                        )}
                        {msg.tool_call.arguments_json.priority && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Priority:</span>
                            <span className="font-semibold text-rose-400 uppercase">
                              {msg.tool_call.arguments_json.priority}
                            </span>
                          </div>
                        )}
                        {msg.tool_call.arguments_json.reason && (
                          <div className="mt-2 p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            <strong>Reason:</strong> {msg.tool_call.arguments_json.reason}
                          </div>
                        )}
                      </div>

                      {/* Pending Decision Buttons */}
                      {msg.tool_call.status === "pending_approval" && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleToolDecision(msg.tool_call!.id, false)}
                            className="h-7 text-xs px-3"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="ai"
                            onClick={() => handleToolDecision(msg.tool_call!.id, true)}
                            className="h-7 text-xs px-4 gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve Action</span>
                          </Button>
                        </div>
                      )}

                      {/* Success Execution Result */}
                      {msg.tool_call.status === "executed" && (
                        <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>
                              Action executed. Task created and committed to database.
                            </span>
                          </div>
                          <span className="font-mono text-[10px]">Audit ID logged</span>
                        </div>
                      )}

                      {/* Rejected State */}
                      {msg.tool_call.status === "rejected" && (
                        <div className="p-2.5 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span>Action was cancelled by user. No database modifications made.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!isAI && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 border border-indigo-400 flex items-center justify-center font-bold text-xs text-white flex-shrink-0 mt-0.5">
                    {currentUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>ClubOps AI is reasoning with event context...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Ask ClubOps AI or invoke tools (e.g. "Create a high-priority task for Rahul to confirm the venue by Friday")...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Button
              type="submit"
              variant="ai"
              disabled={!inputMessage.trim() || isTyping}
              className="h-11 px-5"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1">
            <span>
              Inheriting role: <strong>{currentUser.role.toUpperCase()}</strong> ({currentUser.name})
            </span>
            <span>Audited & verified by ClubOps Real-World Security Gateway</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
