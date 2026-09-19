import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";

describe("Dependency Engine", () => {
  it("should calculate downstream impact of a blocked upstream task", () => {
    // Task 1 (Confirm Grand Auditorium Booking) blocks Task 2, which blocks Task 3, which blocks Task 4
    const impact = db.calculateDownstreamImpact("task-01");

    expect(impact.affectedTaskIds).toContain("task-02");
    expect(impact.affectedTaskIds).toContain("task-03");
    expect(impact.affectedTaskIds).toContain("task-04");
    expect(impact.affectedTaskIds.length).toBeGreaterThanOrEqual(3);
  });

  it("should return empty impact for a leaf task with no dependents", () => {
    const impact = db.calculateDownstreamImpact("task-04");
    expect(impact.affectedTaskIds).toHaveLength(0);
  });
});
