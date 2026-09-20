import { describe, it, expect } from "vitest";
import { CriticalPathEngine, CPMTask } from "@/lib/algorithms/cpm";

describe("Critical Path Method (CPM) Engine", () => {
  const sampleTasks: CPMTask[] = [
    {
      id: "t1",
      title: "Confirm Auditorium & Lab Bookings",
      durationHours: 4,
      dependencies: [],
    },
    {
      id: "t2",
      title: "Deploy Cisco Switches & WiFi Mesh",
      durationHours: 6,
      dependencies: ["t1"],
    },
    {
      id: "t3",
      title: "Print 450 Hacker Badges & Swag Bags",
      durationHours: 3,
      dependencies: ["t1"],
    },
    {
      id: "t4",
      title: "Main Stage AV & Yamaha Mixer Sound Check",
      durationHours: 5,
      dependencies: ["t2"],
    },
    {
      id: "t5",
      title: "Opening Keynote & Problem Statement Release",
      durationHours: 2,
      dependencies: ["t4", "t3"],
    },
  ];

  it("should correctly identify critical path and compute project duration", () => {
    const result = CriticalPathEngine.solve(sampleTasks);

    expect(result.hasCycles).toBe(false);
    // Path 1: t1(4) -> t2(6) -> t4(5) -> t5(2) = 17 hours (CRITICAL)
    // Path 2: t1(4) -> t3(3) -> t5(2) = 9 hours (Slack = 8 hours)
    expect(result.projectDurationHours).toBe(17);

    // Nodes on critical path should have totalFloat === 0
    expect(result.nodes["t1"].isCritical).toBe(true);
    expect(result.nodes["t1"].totalFloat).toBe(0);

    expect(result.nodes["t2"].isCritical).toBe(true);
    expect(result.nodes["t2"].totalFloat).toBe(0);

    expect(result.nodes["t4"].isCritical).toBe(true);
    expect(result.nodes["t4"].totalFloat).toBe(0);

    expect(result.nodes["t5"].isCritical).toBe(true);
    expect(result.nodes["t5"].totalFloat).toBe(0);

    // t3 is NOT on critical path, should have totalFloat === 8
    expect(result.nodes["t3"].isCritical).toBe(false);
    expect(result.nodes["t3"].totalFloat).toBe(8);
    expect(result.nodes["t3"].freeFloat).toBe(8);
  });

  it("should simulate delay propagation on critical path tasks", () => {
    // Delaying t2 (on critical path) by 3 hours should slip project duration by 3 hours
    const delay = CriticalPathEngine.simulateDelay(sampleTasks, "t2", 3);

    expect(delay.originalProjectDuration).toBe(17);
    expect(delay.newProjectDuration).toBe(20);
    expect(delay.projectSlipHours).toBe(3);

    const affectedIds = delay.affectedTasks.map((t) => t.taskId);
    expect(affectedIds).toContain("t2");
    expect(affectedIds).toContain("t4");
    expect(affectedIds).toContain("t5");
  });

  it("should absorb delays on non-critical tasks without slipping project deadline", () => {
    // Delaying t3 by 4 hours (which has 8 hours of slack) should NOT slip project duration
    const delay = CriticalPathEngine.simulateDelay(sampleTasks, "t3", 4);

    expect(delay.projectSlipHours).toBe(0);
    expect(delay.newProjectDuration).toBe(17);
  });

  it("should detect dependency cycles and return cycle error", () => {
    const cycleTasks: CPMTask[] = [
      { id: "a", title: "A", durationHours: 2, dependencies: ["c"] },
      { id: "b", title: "B", durationHours: 2, dependencies: ["a"] },
      { id: "c", title: "C", durationHours: 2, dependencies: ["b"] },
    ];

    const result = CriticalPathEngine.solve(cycleTasks);
    expect(result.hasCycles).toBe(true);
    expect(result.cycleNodes?.length).toBeGreaterThan(0);
  });
});
