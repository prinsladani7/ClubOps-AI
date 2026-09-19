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
  Shield,
  RotateCw,
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
    showToast(
      approved
        ? `AI Action approved and committed to database & audit log!`
        : `AI Action rejected.`
    );
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
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
            <span>Autonomous Intelligence Bus</span>
            <span>•</span>
            <span>Human-in-the-Loop Safeguards</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 mt-0.5">
            <Bot className="w-6 h-6 text-indigo-400" />
            <span>AI Copilot & Autonomous Command Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Controlled AI tool execution with human-in-the-loop approvals, schema validation, and role permission inheritance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Badge variant="ai" className="gap-1.5 py-1 px-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Safety Tier: Human Approval Required</span>
          </Badge>
        </div>
      </div>

      {/* Main Chat Interface */}
      <Card className="flex flex-col h-[700px] border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-2xl rounded-3xl">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-aiGlow flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 shadow-sm ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-br-xs"
                      : "bg-slate-950/90 border border-slate-800/90 text-slate-200 rounded-bl-xs"
                  }`}
                >
                  {/* Sender title */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pb-1 border-b border-white/10">
                    <span>{isUser ? currentUser.name : "ClubOps Copilot"}</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                    {msg.content}
                  </div>

                  {/* Grounded Sources / Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] space-y-1 mt-2">
                      <span className="font-bold text-indigo-400 font-mono uppercase text-[10px]">
                        Grounded Sources Cited:
                      </span>
                      {msg.sources.map((s, i) => (
                        <p key={i} className="text-slate-300 italic">
                          • {s.document_name} ({Math.round(s.similarity * 100)}% match)
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Interactive AI ACTION REQUEST Card */}
                  {msg.tool_call && (
                    <div className="mt-3 p-4 rounded-xl border border-indigo-500/50 bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 space-y-3 shadow-aiGlow">
                      <div className="flex items-center justify-between pb-2 border-b border-indigo-500/30">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-indigo-400" />
                          <span className="font-bold text-white uppercase tracking-wider text-[11px] font-mono">
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
                          className="text-[9px] uppercase font-mono"
                        >
                          {msg.tool_call.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[10px] uppercase font-mono">Tool:</span>
                          <span className="font-bold text-indigo-300 font-mono">
                            {msg.tool_call.tool_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[10px] uppercase font-mono">Role Clearance:</span>
                          <span className="text-slate-200">{currentUser.role.toUpperCase()} (VERIFIED)</span>
                        </div>
                      </div>

                      {/* Tool Payload */}
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto">
                        {JSON.stringify(msg.tool_call.arguments_json, null, 2)}
                      </div>

                      {/* Decision buttons */}
                      {msg.tool_call.status === "pending_approval" && (
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleToolDecision(msg.tool_call!.id, false)}
                            className="h-8 text-xs gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject Action</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ai"
                            onClick={() => handleToolDecision(msg.tool_call!.id, true)}
                            className="h-8 text-xs gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Execute</span>
                          </Button>
                        </div>
                      )}

                      {msg.tool_call.status === "executed" && (
                        <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Action executed and recorded to verifiable Audit Ledger.</span>
                        </div>
                      )}

                      {msg.tool_call.status === "rejected" && (
                        <div className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Action rejected by user. No database mutations occurred.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300 flex-shrink-0 mt-1 shadow-sm">
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
            <div className="flex gap-3 items-center text-xs text-slate-400">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-2 font-mono text-[11px] text-slate-400">Copilot analyzing operations...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase font-mono flex-shrink-0">
            Suggested Prompts:
          </span>
          {sampleCommands.map((cmd, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(cmd)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:text-white whitespace-nowrap transition-colors flex-shrink-0"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask ClubOps AI or propose operational actions (e.g. 'Create task', 'Check venue bottleneck')..."
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Button
              type="submit"
              variant="ai"
              disabled={!inputMessage.trim() || isTyping}
              className="h-10 px-5 text-xs gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
