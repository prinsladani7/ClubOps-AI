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
    }, 500);
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docContent.trim()) return;

    uploadNewDocument(docName, docVisibility, docContent);
    setDocName("");
    setDocContent("");
    setShowUploadModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>Document Knowledge Base & Permission-Aware RAG</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grounded vector retrieval across verified policies, agreements, and venue rules. Access filtered by persona: <strong>{currentUser.role.toUpperCase()}</strong>.
          </p>
        </div>

        <Button
          onClick={() => setShowUploadModal(true)}
          className="gap-1.5 text-xs h-9 bg-indigo-600 hover:bg-indigo-500 shadow-aiGlow"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </Button>
      </div>

      {/* "Ask Club Knowledge" RAG Query Section (Section 11 Core Requirement) */}
      <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950 p-6 shadow-aiGlow space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Ask Club Knowledge (RAG)</h2>
            <p className="text-xs text-slate-400">
              Query policies and retrieve verifiable quotes. AI answers are strictly grounded in permitted documents.
            </p>
          </div>
        </div>

        {/* Query Input */}
        <form onSubmit={handleAskKnowledge} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
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
          <span className="text-[11px] text-slate-500">Quick queries:</span>
          <button
            type="button"
            onClick={() => {
              setAskQuery("What are the sponsorship approval requirements?");
              db.searchKnowledgeRAG("What are the sponsorship approval requirements?", currentUser.role);
              const res = db.searchKnowledgeRAG("What are the sponsorship approval requirements?", currentUser.role);
              setRagResult(res);
            }}
            className="px-2.5 py-1 rounded-full border border-slate-800 bg-slate-900 text-slate-300 hover:border-indigo-500/50 hover:text-white transition-colors text-[11px]"
          >
            Sponsorship Approval Hierarchy
          </button>
          <button
            type="button"
            onClick={() => {
              setAskQuery("What are the hackathon team rules and code integrity guidelines?");
              const res = db.searchKnowledgeRAG("What are the hackathon team rules and code integrity guidelines?", currentUser.role);
              setRagResult(res);
            }}
            className="px-2.5 py-1 rounded-full border border-slate-800 bg-slate-900 text-slate-300 hover:border-indigo-500/50 hover:text-white transition-colors text-[11px]"
          >
            Hackathon Team & Code Rules
          </button>
          <button
            type="button"
            onClick={() => {
              setAskQuery("What are the sound decibel limits for the Grand Auditorium?");
              const res = db.searchKnowledgeRAG("What are the sound decibel limits for the Grand Auditorium?", currentUser.role);
              setRagResult(res);
            }}
            className="px-2.5 py-1 rounded-full border border-slate-800 bg-slate-900 text-slate-300 hover:border-indigo-500/50 hover:text-white transition-colors text-[11px]"
          >
            Auditorium Decibel & Safety Limits
          </button>
        </div>

        {/* Grounded RAG Result Panel */}
        {ragResult && (
          <div className="mt-4 p-5 rounded-xl border border-indigo-500/30 bg-slate-950/90 space-y-4 animate-in fade-in duration-300">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Grounded Synthesis
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {ragResult.permittedCount} permitted chunk(s) scanned
                  {ragResult.restrictedCount > 0 && ` • ${ragResult.restrictedCount} restricted`}
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-2 leading-relaxed whitespace-pre-wrap">
                {ragResult.answer}
              </p>
            </div>

            {/* Source Citation Cards */}
            {ragResult.sources.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Verified Sources & Citations:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ragResult.sources.map((src, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-cyan-300 truncate">
                          📄 {src.document_name}
                        </span>
                        <span className="text-[10px] font-mono text-indigo-400">
                          Match: {Math.round(src.similarity * 100)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 italic line-clamp-3">
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

      {/* Document Library Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm">Indexed Document Repository</CardTitle>
            <CardDescription>
              {visibleDocs.length} documents indexed for pgvector similarity search.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filter documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">Document Name</th>
                  <th className="p-3">Visibility / Clearance</th>
                  <th className="p-3">Chunks Indexed</th>
                  <th className="p-3">Uploaded</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {visibleDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span className="font-semibold text-slate-100">{doc.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          doc.visibility === "admin"
                            ? "destructive"
                            : doc.visibility === "organizer"
                            ? "warning"
                            : doc.visibility === "volunteer"
                            ? "cyan"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {doc.visibility.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      {doc.chunk_count || 2} chunks (1536-dim)
                    </td>
                    <td className="p-3 text-slate-400">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveDocPreview(doc)}
                        className="h-7 text-xs"
                      >
                        Preview
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      <Modal
        isOpen={!!activeDocPreview}
        onClose={() => setActiveDocPreview(null)}
        title={activeDocPreview?.name || "Document Preview"}
        description={`Visibility: ${activeDocPreview?.visibility.toUpperCase()}`}
      >
        {activeDocPreview && (
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono leading-relaxed max-h-72 overflow-y-auto">
              {activeDocPreview.name.includes("Sponsorship") && (
                <p>
                  Sponsorship Approval Requirements & Hierarchy: All corporate sponsorship contracts exceeding ₹1,00,000 require dual sign-off from the Faculty Coordinator (Prof. Dave) and the Club President (Prins Patel). Sponsorship deliverables must include logo placement on all stage banners, 3 complimentary VIP keynote passes, and a dedicated 3m x 3m networking booth.
                </p>
              )}
              {activeDocPreview.name.includes("Conduct") && (
                <p>
                  Hackathon Eligibility & Team Rules: Teams must consist of 2 to 4 registered college students with valid student ID cards. Cross-college teams are permitted. All code submitted for judging must be written during the official 24-hour hackathon window starting Oct 24, 11:00 AM.
                </p>
              )}
              {activeDocPreview.name.includes("Venue") && (
                <p>
                  Grand Auditorium Safety & Decibel Restrictions: Sound pressure levels must not exceed 85 dBA continuous during daytime sessions and 70 dBA after 10:00 PM. No open flames, pyrotechnics, or smoke generators are permitted on stage without written fire department endorsement.
                </p>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setActiveDocPreview(null)}>Close Preview</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Index New Club Document"
        description="Upload text or paste policy document to segment and generate pgvector embeddings."
      >
        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          <div>
            <label className="font-medium text-slate-300">Document Title</label>
            <input
              type="text"
              required
              placeholder="e.g. LJ_TechFest_2026_Catering_Agreement.pdf"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-medium text-slate-300">Access Visibility</label>
            <select
              value={docVisibility}
              onChange={(e) => setDocVisibility(e.target.value as any)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="public">Public (All Members & Hackers)</option>
              <option value="volunteer">Volunteer (Volunteers & Leads)</option>
              <option value="organizer">Organizer (Core Committee)</option>
              <option value="admin">Admin (Strictly Confidential)</option>
            </select>
          </div>
          <div>
            <label className="font-medium text-slate-300">Document Text Content</label>
            <textarea
              rows={5}
              required
              placeholder="Paste raw contract clauses, guidelines or operational instructions..."
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="ai">
              Ingest & Embed Chunks
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
