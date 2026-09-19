import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";

describe("Risk Intelligence Engine", () => {
  it("should evaluate risks from active dependency chains and overdue deadlines", () => {
    const freshRisks = db.runRiskAnalysis();

    expect(freshRisks.length).toBeGreaterThan(0);

    // Verify critical venue bottleneck is identified
    const venueRisk = freshRisks.find(
      (r) => r.source_type === "dependency" && r.severity === "critical"
    );
    expect(venueRisk).toBeDefined();
    expect(venueRisk?.evidence).toContain("task-01");
    expect(venueRisk?.suggested_action).toBeDefined();
  });

  it("should detect personnel burnout for volunteers with >= 5 tasks", () => {
    const freshRisks = db.runRiskAnalysis();
    const volunteerRisk = freshRisks.find((r) => r.source_type === "volunteer");

    expect(volunteerRisk).toBeDefined();
    expect(volunteerRisk?.title).toContain("Burnout");
  });
});
