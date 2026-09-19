import { describe, it, expect } from "vitest";
import { CreateTaskSchema, canUserExecuteTool } from "@/lib/ai/tools";
import { db } from "@/lib/db";

describe("AI Tool Registry & Safety Architecture", () => {
  it("validates structured task schema with Zod", () => {
    const validTask = {
      title: "Confirm Grand Auditorium booking",
      owner: "Rahul Sharma",
      priority: "high",
      deadline: "2026-09-25T17:00:00Z",
    };

    const parsed = CreateTaskSchema.safeParse(validTask);
    expect(parsed.success).toBe(true);

    const invalidTask = {
      title: "X", // too short
    };
    const invalidParsed = CreateTaskSchema.safeParse(invalidTask);
    expect(invalidParsed.success).toBe(false);
  });

  it("enforces role permission hierarchy", () => {
    // Creating events requires admin role
    const memberCheck = canUserExecuteTool("member", "create_event");
    expect(memberCheck.allowed).toBe(false);

    const adminCheck = canUserExecuteTool("admin", "create_event");
    expect(adminCheck.allowed).toBe(true);
  });

  it("requires human confirmation before creating consequential tasks", () => {
    const { toolCall, requiresApproval } = db.executeAITool(
      "create_task",
      {
        title: "Test Task from AI",
        priority: "high",
      },
      "Test task creation safety tier"
    );

    expect(requiresApproval).toBe(true);
    expect(toolCall.status).toBe("pending_approval");
    expect(toolCall.side_effect_tier).toBe("confirm");

    // Approve the tool call
    const approvalRes = db.approveAITool(toolCall.id, true);
    expect(approvalRes.success).toBe(true);

    // Verify audit log has the approval recorded
    const logs = db.getAuditLogs();
    const approvedLog = logs.find((l) => l.action === "APPROVE_AI_ACTION");
    expect(approvedLog).toBeDefined();
  });
});
