import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";

describe("Permission-Aware RAG Engine", () => {
  it("allows Organizer to retrieve confidential sponsorship policy", () => {
    const result = db.searchKnowledgeRAG("sponsorship approval requirements", "organizer");
    expect(result.permittedCount).toBeGreaterThan(0);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources[0].document_name).toContain("Sponsorship_Policy");
    expect(result.answer).toContain("Prof. Dave");
  });

  it("blocks Member from retrieving confidential organizer documents", () => {
    // Member only has access to public documents
    const result = db.searchKnowledgeRAG("sponsorship approval requirements", "member");
    expect(result.sources).toHaveLength(0);
    expect(result.restrictedCount).toBeGreaterThan(0);
    expect(result.answer).toContain("higher clearance");
  });

  it("allows Member to retrieve public code of conduct", () => {
    const result = db.searchKnowledgeRAG("hackathon team rules and code integrity", "member");
    expect(result.permittedCount).toBeGreaterThan(0);
    expect(result.sources.some((s) => s.document_name.includes("Code_of_Conduct"))).toBe(true);
  });
});
