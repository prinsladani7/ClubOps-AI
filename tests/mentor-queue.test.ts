import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";

describe("Bit N Build 2026: HelpQ Mentor Dispatch Lifecycle", () => {
  it("creates a new mentor ticket with physical table coordinates and tech stack", () => {
    const ticket = db.createMentorTicket({
      team_name: "QuantumBots",
      table_location: "Lab 304, Table 12",
      track: "IoT & Robotics",
      tech_stack: ["C++", "ROS2", "ESP32"],
      issue_summary: "Serial communication dropped between ESP32 and motor driver board.",
      priority: "urgent",
    });

    expect(ticket).toBeDefined();
    expect(ticket.id).toMatch(/^ticket-/);
    expect(ticket.team_name).toBe("QuantumBots");
    expect(ticket.table_location).toBe("Lab 304, Table 12");
    expect(ticket.status).toBe("open");
    expect(ticket.priority).toBe("urgent");
    expect(ticket.tech_stack).toEqual(["C++", "ROS2", "ESP32"]);
  });

  it("claims a mentor ticket and records mentor attribution and timestamp", () => {
    const ticket = db.createMentorTicket({
      team_name: "DeFiPulse",
      table_location: "Lab 303, Table 5",
      track: "Web3 & DeFi",
      tech_stack: ["Solidity", "Hardhat"],
      issue_summary: "Revert with unhandled error on staking contract deployment.",
      priority: "high",
    });

    const claimed = db.claimMentorTicket(ticket.id, "mentor-rohan", "Rohan Mehta");
    expect(claimed.status).toBe("claimed");
    expect(claimed.claimed_by_mentor_id).toBe("mentor-rohan");
    expect(claimed.claimed_by_mentor_name).toBe("Rohan Mehta");
    expect(claimed.claimed_at).toBeDefined();
  });

  it("resolves a mentor ticket and stores resolution notes", () => {
    const ticket = db.createMentorTicket({
      team_name: "AgentHive",
      table_location: "Lab 301, Table 9",
      track: "AI & Agents",
      tech_stack: ["Python", "FastAPI"],
      issue_summary: "LangChain tool calling hanging on streaming output.",
      priority: "medium",
    });

    db.claimMentorTicket(ticket.id, "mentor-priya", "Priya Nair");
    const resolved = db.resolveMentorTicket(
      ticket.id,
      "Switched agent callback handler to async streaming queue. Issue solved."
    );

    expect(resolved.status).toBe("resolved");
    expect(resolved.resolved_at).toBeDefined();
    expect(resolved.resolution_notes).toContain("async streaming queue");
  });

  it("toggles sponsor deliverable status correctly", () => {
    const sponsors = db.getSponsors();
    expect(sponsors.length).toBeGreaterThan(0);

    const firstSponsor = sponsors[0];
    const firstDeliverable = firstSponsor.deliverables[0];
    const initialStatus = firstDeliverable.completed;

    const success = db.toggleSponsorDeliverable(firstSponsor.id, firstDeliverable.id);
    expect(success).toBe(true);

    const updatedDeliverable = db
      .getSponsors()
      .find((s) => s.id === firstSponsor.id)!
      .deliverables.find((d) => d.id === firstDeliverable.id)!;

    expect(updatedDeliverable.completed).toBe(!initialStatus);
  });
});
