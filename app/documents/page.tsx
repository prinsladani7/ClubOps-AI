"use client";

import React, { useState } from "react";
import {
  FileText,
  Search,
  Upload,
  Shield,
  Sparkles,
  Lock,
  Eye,
  FileCheck,
  ChevronRight,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useClubOps } from "@/components/providers/ClubOpsContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Document, DocumentVisibility } from "@/types";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default function DocumentsPage() {
  const { documents, currentUser, uploadNewDocument, showToast } = useClubOps();

  const [searchQuery, setSearchQuery] = useState("");
  const [askQuery, setAskQuery] = useState("");
  const [ragResult, setRagResult] = useState<{
    answer: string;
    sources: { document_name: string; chunk_index: number; content: string; similarity: number }[];
    permittedCount: number;
    restrictedCount: number;
  } | null>(null);
  const [isSearchingRag, setIsSearchingRag] = useState(false);

  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docName, setDocName] = useState("");
  const [docVisibility, setDocVisibility] = useState<DocumentVisibility>("organizer");
  const [docContent, setDocContent] = useState("");
  const [activeDocPreview, setActiveDocPreview] = useState<Document | null>(null);

  // Filter documents accessible by the current persona
  const visibleDocs = documents.filter((doc) => {
    if (searchQuery.trim()) {
      return doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const handleAskKnowledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuery.trim()) return;

    setIsSearchingRag(true);
    setTimeout(() => {
      const result = db.searchKnowledgeRAG(askQuery, currentUser.role);
      setRagResult(result);
      setIsSearchingRag(false);
      showToast("Knowledge Base searched with grounded vector retrieval.");
    }, 500);
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docContent.trim()) return;

    uploadNewDocument(docName, docVisibility, docContent);
    showToast(`Document uploaded: "${docName}" (${docVisibility.toUpperCase()})`);
    setDocName("");
    setDocContent("");
    setShowUploadModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
            <span>Knowledge Engine</span>
            <span>•</span>
            <span>Active Clearance: {currentUser.role.toUpperCase()}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 mt-0.5">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>Document Knowledge Base & Permission-Aware RAG</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grounded vector retrieval across verified policies, contracts, and campus rules. RBAC strictly enforces document boundaries.
          </p>
        </div>

        <Button
          onClick={() => setShowUploadModal(true)}
          className="gap-1.5 text-xs h-9 bg-indigo-600 hover:bg-indigo-500 shadow-aiGlow"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Policy / Doc</span>
        </Button>
      </div>

      {/* "Ask Club Knowledge" RAG Query Section */}
      <div className="rounded-3xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-950/95 p-6 sm:p-7 shadow-aiGlow space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-aiGlow flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Ask Club Knowledge (Permission-Aware RAG)
              <Badge variant="ai" className="text-[9px] py-0 px-1.5 font-mono">
                GROUNDED SYNTHESIS
              </Badge>
            </h2>
            <p className="text-xs text-slate-400">
              Query policies and agreements. Answers are strictly synthesized from documents permitted for your role (<strong>{currentUser.role.toUpperCase()}</strong>).
            </p>
          </div>
        </div>

        {/* Query Input */}
        <form onSubmit={handleAskKnowledge} className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="e.g. What are the sponsorship approval requirements? or What are the hackathon team rules?"
              value={askQuery}
              onChange={(e) => setAskQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/90 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <Button type="submit" variant="ai" disabled={isSearchingRag} className="h-10 px-5 text-xs">
            {isSearchingRag ? "Searching..." : "Search & Ground"}
          </Button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] text-slate-500 font-semibold">Quick queries:</span>
          <button
            type="button"
            onClick={() => {
              setAskQuery("What are the sponsorship approval requirements?");
              const res = db.searchKnowledgeRAG("What are the sponsorship approval requirements?", currentUser.role);
              setRagResult(res);
              showToast("Queried sponsorship approval requirements");
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:border-indigo-500/50 hover:text-white transition-colors"
          >
            💰 Sponsorship Approval Requirements
          </button>
          <button
            type="button"
            onClick={() => {
              setAskQuery("What are the campus acoustic rules for outdoor music?");
              const res = db.searchKnowledgeRAG("What are the campus acoustic rules for outdoor music?", currentUser.role);
              setRagResult(res);
              showToast("Queried campus acoustic regulations");
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:border-indigo-500/50 hover:text-white transition-colors"
          >
            🔊 Campus Acoustic Rules (Outdoor Music)
          </button>
          <button
            type="button"
            onClick={() => {
              setAskQuery("What is the hackathon team size and eligibility?");
              const res = db.searchKnowledgeRAG("What is the hackathon team size and eligibility?", currentUser.role);
              setRagResult(res);
              showToast("Queried hackathon eligibility guidelines");
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:border-indigo-500/50 hover:text-white transition-colors"
          >
            💻 Hackathon Rules & Team Size
          </button>
        </div>

        {/* RAG Synthesis Result Card */}
        {ragResult && (
          <div className="p-5 rounded-2xl border border-indigo-500/40 bg-slate-950/90 space-y-4 animate-in fade-in duration-300 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  Grounded Intelligence Synthesis
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="ai" className="text-[10px] font-mono">
                  {ragResult.sources.length} Cited Sources
                </Badge>
                {ragResult.restrictedCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] font-mono">
                    {ragResult.restrictedCount} Restricted by RBAC
                  </Badge>
                )}
              </div>
            </div>

            {/* Answer body */}
            <div className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
              {ragResult.answer}
            </div>

            {/* Verifiable Cited Sources */}
            {ragResult.sources.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Verifiable Document Citations
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {ragResult.sources.map((src, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-950 text-[11px] space-y-1 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-300 truncate">
                          {src.document_name}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {Math.round(src.similarity * 100)}% match
                        </span>
                      </div>
                      <p className="text-slate-400 italic line-clamp-3 leading-snug">
                        &quot;{src.content}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Library Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">Repository Knowledge Base</h2>
            <p className="text-xs text-slate-400">
              {visibleDocs.length} policy documents indexed with pgvector chunks and role permissions.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter documents by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-b border-slate-800 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Document Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleDocs.length === 0 ? (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl p-8 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Documents Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No policy documents match your search or your current clearance level.
              </p>
              {currentUser.role === "admin" && (
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs mt-2"
                >
                  Upload Policy Document
                </Button>
              )}
            </div>
          ) : (
            visibleDocs.map((doc) => {
            const hasAccess =
              currentUser.role === "admin" ||
              (currentUser.role === "organizer" && doc.visibility !== "admin") ||
              (currentUser.role === "volunteer" && (doc.visibility === "volunteer" || doc.visibility === "public")) ||
              (currentUser.role === "member" && doc.visibility === "public");

            return (
              <Card
                key={doc.id}
                onClick={() => {
                  if (hasAccess) {
                    setActiveDocPreview(doc);
                  } else {
                    showToast(`Access Denied: Higher clearance required to view "${doc.name}"`);
                  }
                }}
                className={`p-4 cursor-pointer hover:border-indigo-500/40 transition-all rounded-2xl flex flex-col justify-between ${
                  !hasAccess
                    ? "border-slate-800/40 bg-slate-950/30 opacity-60"
                    : "border-slate-800/80 bg-slate-950/60"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white truncate">{doc.name}</h3>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Indexed {formatDate(doc.created_at)}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={
                        doc.visibility === "admin"
                          ? "destructive"
                          : doc.visibility === "organizer"
                          ? "warning"
                          : doc.visibility === "volunteer"
                          ? "cyan"
                          : "success"
                      }
                      className="text-[9px] uppercase font-mono"
                    >
                      {doc.visibility}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-3 line-clamp-3 leading-relaxed font-sans">
                    Path: {doc.storage_path} • File: {doc.mime_type}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono text-[10px]">
                    {doc.chunk_count || 1} pgvector chunks
                  </span>
                  {hasAccess ? (
                    <span className="text-indigo-400 font-medium flex items-center gap-1">
                      Read Document <ChevronRight className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="text-rose-400 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Restricted
                    </span>
                  )}
                </div>
              </Card>
            );
          })
          )}
        </div>
      </div>

      {/* Document Detail Preview Modal */}
      <Modal
        isOpen={!!activeDocPreview}
        onClose={() => setActiveDocPreview(null)}
        title={activeDocPreview?.name || "Document Preview"}
        description={`Clearance: ${activeDocPreview?.visibility.toUpperCase()} • Indexed with Vector Chunks`}
      >
        {activeDocPreview && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
              {`Document Name: ${activeDocPreview.name}\nStorage Path: ${activeDocPreview.storage_path}\nMIME Type: ${activeDocPreview.mime_type}\nCreated: ${activeDocPreview.created_at}\nIndexed Chunks: ${activeDocPreview.chunk_count || 1}`}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono">
                Document ID: {activeDocPreview.id}
              </span>
              <Button size="sm" onClick={() => setActiveDocPreview(null)}>
                Close Viewer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document to Knowledge Base"
        description="Indexes text into semantic chunks for grounded RAG query synthesis."
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300">Document Title</label>
            <input
              type="text"
              required
              placeholder="e.g. LJ_TechFest_Campus_WiFi_Credentials.pdf"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Visibility & Clearance</label>
            <select
              value={docVisibility}
              onChange={(e) => setDocVisibility(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="admin">Admin Only (Strict Confidential)</option>
              <option value="organizer">Organizer (Internal Operations)</option>
              <option value="volunteer">Volunteer (Task Instructions)</option>
              <option value="public">Public (Open to All Members)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Document Text Content</label>
            <textarea
              rows={6}
              required
              placeholder="Paste document text or policy rules here..."
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="ai">
              Upload & Vector Index
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
