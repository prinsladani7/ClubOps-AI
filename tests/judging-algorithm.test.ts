import { describe, it, expect } from "vitest";
import {
  computeWeightedScore,
  computeJudgeProfiles,
  generateNormalizedLeaderboard,
} from "@/lib/algorithms/judging-normalizer";
import { JudgingTeam, JudgingScore } from "@/types";

describe("Bit N Build 2026: Gavel Judging & Normalization Algorithm", () => {
  it("calculates rubric weighted score according to exact 30/25/25/20 weights", () => {
    const score: JudgingScore = {
      judge_id: "judge-1",
      judge_name: "Dr. Aditi Sharma",
      technical_depth: 10,  // 10 * 0.30 = 3.0
      innovation: 8,        // 8 * 0.25 = 2.0
      impact_viability: 6,  // 6 * 0.25 = 1.5
      demo_presentation: 9, // 9 * 0.20 = 1.8
      submitted_at: new Date().toISOString(),
    };

    // Expected: 3.0 + 2.0 + 1.5 + 1.8 = 8.30
    const weighted = computeWeightedScore(score);
    expect(weighted).toBeCloseTo(8.3, 2);
  });

  it("accurately computes judge profile mean and standard deviation across evaluations", () => {
    const mockTeams: JudgingTeam[] = [
      {
        id: "team-1",
        team_name: "Team Alpha",
        project_title: "Alpha AI",
        track: "AI & Agents",
        table_location: "Lab 301, Table 1",
        member_count: 4,
        github_url: "https://github.com/alpha",
        scores: [
          {
            judge_id: "harsh-judge",
            judge_name: "Harsh Evaluator",
            technical_depth: 6,
            innovation: 6,
            impact_viability: 6,
            demo_presentation: 6,
            submitted_at: "",
          },
        ],
      },
      {
        id: "team-2",
        team_name: "Team Beta",
        project_title: "Beta Agent",
        track: "AI & Agents",
        table_location: "Lab 301, Table 2",
        member_count: 4,
        github_url: "https://github.com/beta",
        scores: [
          {
            judge_id: "harsh-judge",
            judge_name: "Harsh Evaluator",
            technical_depth: 8,
            innovation: 8,
            impact_viability: 8,
            demo_presentation: 8,
            submitted_at: "",
          },
        ],
      },
    ];

    const profiles = computeJudgeProfiles(mockTeams);
    const harshProfile = profiles["harsh-judge"];

    expect(harshProfile).toBeDefined();
    expect(harshProfile.evalCount).toBe(2);
    // Scores are 6.0 and 8.0. Mean is 7.0
    expect(harshProfile.mean).toBeCloseTo(7.0, 2);
    // Population standard deviation of [6, 8]: sqrt(((6-7)^2 + (8-7)^2) / 2) = sqrt(1) = 1.0
    expect(harshProfile.stdDev).toBeCloseTo(1.0, 2);
  });

  it("normalizes scores to mitigate harsh vs lenient judge biases", () => {
    // Scenario:
    // Harsh Judge awards Team A a 7.5 (when harsh judge's mean is 6.5) -> Team A is +1.0 above judge mean
    // Lenient Judge awards Team B an 8.5 (when lenient judge's mean is 9.0) -> Team B is -0.5 below judge mean
    // Under raw scoring, Team B (8.5) would beat Team A (7.5).
    // Under Gavel Z-score normalization, Team A should rank higher because Team A outperformed its judge's standard!
    const mockTeams: JudgingTeam[] = [
      {
        id: "team-a",
        team_name: "Team A (Harsh Judge Group)",
        project_title: "Project A",
        track: "AI & Agents",
        table_location: "Lab 301, Table 1",
        member_count: 4,
        github_url: "https://github.com/a",
        scores: [
          {
            judge_id: "judge-harsh",
            judge_name: "Harsh Judge",
            technical_depth: 8,
            innovation: 8,
            impact_viability: 8,
            demo_presentation: 8,
            submitted_at: "",
          },
        ],
      },
      {
        id: "team-anchor-harsh",
        team_name: "Harsh Anchor Team",
        project_title: "Anchor Low",
        track: "AI & Agents",
        table_location: "Lab 301, Table 2",
        member_count: 4,
        github_url: "https://github.com/anchor-h",
        scores: [
          {
            judge_id: "judge-harsh",
            judge_name: "Harsh Judge",
            technical_depth: 5,
            innovation: 5,
            impact_viability: 5,
            demo_presentation: 5,
            submitted_at: "",
          },
        ],
      },
      {
        id: "team-b",
        team_name: "Team B (Lenient Judge Group)",
        project_title: "Project B",
        track: "AI & Agents",
        table_location: "Lab 302, Table 1",
        member_count: 4,
        github_url: "https://github.com/b",
        scores: [
          {
            judge_id: "judge-lenient",
            judge_name: "Lenient Judge",
            technical_depth: 8.5,
            innovation: 8.5,
            impact_viability: 8.5,
            demo_presentation: 8.5,
            submitted_at: "",
          },
        ],
      },
      {
        id: "team-anchor-lenient",
        team_name: "Lenient Anchor Team",
        project_title: "Anchor High",
        track: "AI & Agents",
        table_location: "Lab 302, Table 2",
        member_count: 4,
        github_url: "https://github.com/anchor-l",
        scores: [
          {
            judge_id: "judge-lenient",
            judge_name: "Lenient Judge",
            technical_depth: 9.8,
            innovation: 9.8,
            impact_viability: 9.8,
            demo_presentation: 9.8,
            submitted_at: "",
          },
        ],
      },
    ];

    const leaderboard = generateNormalizedLeaderboard(mockTeams);

    const rankA = leaderboard.find((e) => e.team_id === "team-a")!;
    const rankB = leaderboard.find((e) => e.team_id === "team-b")!;

    // Team A has a positive Z-score (+0.707) while Team B has a negative Z-score (-0.707)
    // Team A's normalized score should exceed Team B's normalized score!
    expect(rankA.normalized_score).toBeGreaterThan(rankB.normalized_score);
    expect(rankA.rank).toBeLessThan(rankB.rank);
  });

  it("assigns gold, silver, and bronze medals to top 3 ranked teams", () => {
    const mockTeams: JudgingTeam[] = [
      {
        id: "t1",
        team_name: "First Place",
        project_title: "P1",
        track: "Web3 & DeFi",
        table_location: "Lab 303, Table 1",
        member_count: 4,
        github_url: "",
        scores: [
          {
            judge_id: "j1",
            judge_name: "Judge 1",
            technical_depth: 10,
            innovation: 10,
            impact_viability: 10,
            demo_presentation: 10,
            submitted_at: "",
          },
          {
            judge_id: "j1",
            judge_name: "Judge 1",
            technical_depth: 5,
            innovation: 5,
            impact_viability: 5,
            demo_presentation: 5,
            submitted_at: "",
          },
        ],
      },
      {
        id: "t2",
        team_name: "Second Place",
        project_title: "P2",
        track: "Web3 & DeFi",
        table_location: "Lab 303, Table 2",
        member_count: 4,
        github_url: "",
        scores: [
          {
            judge_id: "j2",
            judge_name: "Judge 2",
            technical_depth: 8,
            innovation: 8,
            impact_viability: 8,
            demo_presentation: 8,
            submitted_at: "",
          },
          {
            judge_id: "j2",
            judge_name: "Judge 2",
            technical_depth: 4,
            innovation: 4,
            impact_viability: 4,
            demo_presentation: 4,
            submitted_at: "",
          },
        ],
      },
      {
        id: "t3",
        team_name: "Third Place",
        project_title: "P3",
        track: "Web3 & DeFi",
        table_location: "Lab 303, Table 3",
        member_count: 4,
        github_url: "",
        scores: [
          {
            judge_id: "j3",
            judge_name: "Judge 3",
            technical_depth: 7,
            innovation: 7,
            impact_viability: 7,
            demo_presentation: 7,
            submitted_at: "",
          },
          {
            judge_id: "j3",
            judge_name: "Judge 3",
            technical_depth: 3,
            innovation: 3,
            impact_viability: 3,
            demo_presentation: 3,
            submitted_at: "",
          },
        ],
      },
    ];

    const leaderboard = generateNormalizedLeaderboard(mockTeams);

    expect(leaderboard[0].medal).toBe("gold");
    expect(leaderboard[1].medal).toBe("silver");
    expect(leaderboard[2].medal).toBe("bronze");
  });

  it("filters leaderboard by track and excludes disqualified teams", () => {
    const mockTeams: JudgingTeam[] = [
      {
        id: "t-ai",
        team_name: "AI Project",
        project_title: "AI",
        track: "AI & Agents",
        table_location: "Lab 301, Table 1",
        member_count: 4,
        github_url: "",
        scores: [],
      },
      {
        id: "t-iot",
        team_name: "IoT Project",
        project_title: "IoT",
        track: "IoT & Robotics",
        table_location: "Lab 304, Table 1",
        member_count: 4,
        github_url: "",
        scores: [],
      },
      {
        id: "t-disqualified",
        team_name: "Rule Violator",
        project_title: "Copycat",
        track: "AI & Agents",
        table_location: "Lab 301, Table 8",
        member_count: 4,
        github_url: "",
        scores: [],
        is_disqualified: true,
      },
    ];

    const aiLeaderboard = generateNormalizedLeaderboard(mockTeams, "AI & Agents");
    expect(aiLeaderboard).toHaveLength(1);
    expect(aiLeaderboard[0].team_id).toBe("t-ai");
  });
});
