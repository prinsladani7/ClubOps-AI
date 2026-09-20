import { describe, it, expect } from "vitest";
import {
  WorkloadOptimizer,
  OptimizerVolunteer,
  OptimizerTask,
} from "@/lib/algorithms/workload-optimizer";

describe("Workload Optimizer & Bipartite Matching", () => {
  const volunteers: OptimizerVolunteer[] = [
    {
      id: "v-rahul",
      name: "Rahul Sharma",
      skills: ["Networking", "Cisco Switches", "Hardware", "Linux"],
      currentWorkload: 92, // Overloaded
      availability: "overloaded",
      committee: "Tech & Infrastructure",
      activeTaskCount: 6,
    },
    {
      id: "v-arjun",
      name: "Arjun Pillai",
      skills: ["Hardware", "Stage AV", "Networking", "Logistics"],
      currentWorkload: 30, // Underutilized
      availability: "available",
      committee: "Tech & Infrastructure",
      activeTaskCount: 1,
    },
    {
      id: "v-sneha",
      name: "Sneha Mehta",
      skills: ["Design", "Figma", "Branding"],
      currentWorkload: 50,
      availability: "available",
      committee: "Design & Media",
      activeTaskCount: 2,
    },
  ];

  const tasks: OptimizerTask[] = [
    {
      id: "t-switches",
      title: "Deploy Cisco 2960 Switches in Lab 302",
      priority: "high",
      requiredSkills: ["Networking", "Hardware"],
      estimatedHours: 4,
      currentAssigneeId: "v-rahul",
      committee: "Tech & Infrastructure",
    },
    {
      id: "t-wifi",
      title: "Configure UniFi U6-Pro Access Points",
      priority: "critical",
      requiredSkills: ["Networking", "Linux"],
      estimatedHours: 5,
      currentAssigneeId: "v-rahul",
      committee: "Tech & Infrastructure",
    },
  ];

  it("should calculate Jaccard skill match accurately", () => {
    const match = WorkloadOptimizer.calculateSkillMatch(
      ["Networking", "Hardware"],
      ["Hardware", "Stage AV", "Networking"]
    );
    expect(match.score).toBe(1.0); // Both required skills are in available list
    expect(match.matched).toContain("networking");
    expect(match.matched).toContain("hardware");
  });

  it("should reduce workload variance and offload overloaded leads", () => {
    const result = WorkloadOptimizer.optimize(volunteers, tasks);

    expect(result.rebalanceActions.length).toBeGreaterThan(0);
    // Workload standard deviation should decrease
    expect(result.optimizedStandardDeviation).toBeLessThan(
      result.initialStandardDeviation
    );
    expect(result.varianceReductionPercentage).toBeGreaterThan(0);

    // Rahul's simulated load should drop from 92
    const rahulForecast = result.volunteerWorkloadForecast.find(
      (v) => v.volunteerId === "v-rahul"
    );
    expect(rahulForecast?.optimizedLoad).toBeLessThan(92);

    // Arjun's simulated load should increase from 30
    const arjunForecast = result.volunteerWorkloadForecast.find(
      (v) => v.volunteerId === "v-arjun"
    );
    expect(arjunForecast?.optimizedLoad).toBeGreaterThan(30);
  });
});
