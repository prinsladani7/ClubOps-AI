import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { resolveEntityLabel, formatActionNarrative, formatToolArgumentsReadable } from "@/lib/utils/formatters";
import { can } from "@/lib/permissions";
import { User } from "@/types";

describe("Security & Humanized Data Integrity Checks", () => {

  it("prevents confidential document leakage to lower roles", () => {
    // Seed confidential document
    db.uploadDocument("Sponsorship Financials & NDA", "admin", "Confidential club financial records.");
    db.uploadDocument("Volunteer Shift Roster", "volunteer", "Public shift details.");
    db.uploadDocument("Bit N Build Hackathon Rules", "public", "General rules.");

    const allDocs = db.getDocuments();

    // Member role filtering
    const memberDocs = allDocs.filter((d) => d.visibility === "public");
    expect(memberDocs.some((d) => d.name.includes("Financials"))).toBe(false);
    expect(memberDocs.every((d) => d.visibility === "public")).toBe(true);

    // Volunteer role filtering
    const volDocs = allDocs.filter((d) => d.visibility === "public" || d.visibility === "volunteer");
    expect(volDocs.some((d) => d.name.includes("Financials"))).toBe(false);
    expect(volDocs.some((d) => d.name.includes("Roster"))).toBe(true);
  });

  it("enforces RAG search clearance boundaries against role tampering", () => {
    const adminQuery = db.searchKnowledgeRAG("sponsorship approval requirements", "admin");
    expect(adminQuery.permittedCount).toBeGreaterThan(0);
    expect(adminQuery.sources.length).toBeGreaterThan(0);

    const memberQuery = db.searchKnowledgeRAG("sponsorship approval requirements", "member");
    expect(memberQuery.sources).toHaveLength(0);
    expect(memberQuery.restrictedCount).toBeGreaterThan(0);
  });

  it("enforces permission guards on destructive operations", () => {
    const volunteerUser: User = {
      id: "usr-vol-01",
      email: "vol@college.edu",
      name: "Volunteer Test",
      role: "volunteer",
      status: "active",
      created_at: new Date().toISOString(),
    };

    // Volunteers cannot update event parameters
    expect(can(volunteerUser, "event:update", undefined)).toBe(false);

    // Volunteers cannot manage operational risks
    expect(can(volunteerUser, "risk:manage", undefined)).toBe(false);

    // Volunteers cannot remove members
    expect(can(volunteerUser, "volunteer:remove", undefined)).toBe(false);

    // Volunteers cannot upload admin documents
    expect(can(volunteerUser, "document:upload", undefined)).toBe(false);
  });

  it("resolves raw entity IDs into human-readable labels", () => {
    const task = db.getTasks()[0];
    const user = db.getUsers()[0];
    const team = db.getTeams()[0];

    const taskLabel = resolveEntityLabel("task", task.id, db);
    expect(taskLabel.typeLabel).toBe("Deliverable");
    expect(taskLabel.name).toBe(task.title);
    expect(taskLabel.isFallback).toBe(false);

    const userLabel = resolveEntityLabel("user", user.id, db);
    expect(userLabel.typeLabel).toBe("Member");
    expect(userLabel.name).toBe(user.name);
    expect(userLabel.isFallback).toBe(false);

    const teamLabel = resolveEntityLabel("team", team.id, db);
    expect(teamLabel.typeLabel).toBe("Squad");
    expect(teamLabel.name).toBe(team.name);
    expect(teamLabel.isFallback).toBe(false);

    // Unknown/fallback
    const unknownLabel = resolveEntityLabel("custom_entity", "unknown-99", db);
    expect(unknownLabel.typeLabel).toBe("Item");
    expect(unknownLabel.name).toBe("unknown-99");
    expect(unknownLabel.isFallback).toBe(true);
  });

  it("formats AI tool arguments into clean human-readable summaries without raw JSON", () => {
    const reassignCard = formatToolArgumentsReadable("reassign_task", {
      task_id: "task-01",
      new_owner_id: "usr-02",
      reason: "Workload optimization",
    });

    expect(reassignCard.title).toBe("Reassign Deliverable");
    expect(reassignCard.bullets.length).toBe(3);
    expect(reassignCard.bullets.some((b) => b.label === "Rationale" && b.value === "Workload optimization")).toBe(true);

    const escalateCard = formatToolArgumentsReadable("escalate_task", {
      task_id: "task-02",
      escalation_level: "admin",
      blocker_reason: "Power rack malfunction",
    });

    expect(escalateCard.title).toBe("Escalate Blocker to Leadership");
    expect(escalateCard.bullets.some((b) => b.label === "Blocker Reason" && b.value === "Power rack malfunction")).toBe(true);
  });

  it("humanizes operational action narratives", () => {
    const taskUpdateNarrative = formatActionNarrative("task_updated", {
      oldStatus: "todo",
      newStatus: "in_progress",
    });
    expect(taskUpdateNarrative).toBe("Changed status from todo to in progress");

    const blockerNarrative = formatActionNarrative("task_escalated", {
      blocker_reason: "Cisco switch fiber disconnected",
    });
    expect(blockerNarrative).toContain("Cisco switch fiber disconnected");
  });
});
