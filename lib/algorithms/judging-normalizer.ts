import { JudgingTeam, JudgingScore, JudgingLeaderboardEntry, HackathonTrack } from "@/types";

/**
 * Computes weighted raw score for a single evaluation rubric:
 * - Technical Depth: 30%
 * - Innovation: 25%
 * - Impact & Viability: 25%
 * - Demo & Presentation: 20%
 */
export function computeWeightedScore(score: JudgingScore): number {
  return (
    score.technical_depth * 0.3 +
    score.innovation * 0.25 +
    score.impact_viability * 0.25 +
    score.demo_presentation * 0.2
  );
}

export interface JudgeProfile {
  judgeId: string;
  judgeName: string;
  mean: number;
  stdDev: number;
  evalCount: number;
}

/**
 * Computes individual judge scoring profiles to quantify judge harshness/leniency.
 */
export function computeJudgeProfiles(teams: JudgingTeam[]): Record<string, JudgeProfile> {
  const scoresByJudge: Record<string, { name: string; scores: number[] }> = {};

  teams.forEach((t) => {
    t.scores.forEach((s) => {
      if (!scoresByJudge[s.judge_id]) {
        scoresByJudge[s.judge_id] = { name: s.judge_name, scores: [] };
      }
      scoresByJudge[s.judge_id].scores.push(computeWeightedScore(s));
    });
  });

  const profiles: Record<string, JudgeProfile> = {};

  Object.entries(scoresByJudge).forEach(([judgeId, data]) => {
    const n = data.scores.length;
    if (n === 0) return;

    const mean = data.scores.reduce((sum, val) => sum + val, 0) / n;
    const variance =
      data.scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / Math.max(1, n);
    const stdDev = Math.sqrt(variance);

    profiles[judgeId] = {
      judgeId,
      judgeName: data.name,
      mean,
      stdDev: stdDev === 0 ? 1 : stdDev, // avoid division by zero
      evalCount: n,
    };
  });

  return profiles;
}

/**
 * Normalizes project scores using Z-score standardization:
 * Z = (Score - Mean_judge) / StdDev_judge
 * Normalized = clamp(50 + 15 * avg(Z), 0, 100)
 */
export function generateNormalizedLeaderboard(
  teams: JudgingTeam[],
  trackFilter?: HackathonTrack
): JudgingLeaderboardEntry[] {
  let eligibleTeams = teams.filter((t) => !t.is_disqualified);
  if (trackFilter) {
    eligibleTeams = eligibleTeams.filter((t) => t.track === trackFilter);
  }

  const judgeProfiles = computeJudgeProfiles(teams);

  const entries: JudgingLeaderboardEntry[] = eligibleTeams.map((team) => {
    if (team.scores.length === 0) {
      return {
        rank: 0,
        team_id: team.id,
        team_name: team.team_name,
        project_title: team.project_title,
        track: team.track,
        table_location: team.table_location,
        raw_average: 0,
        normalized_score: 0,
        scores_count: 0,
      };
    }

    const rawScores = team.scores.map(computeWeightedScore);
    const rawAverage = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;

    // Compute average Z-score
    let sumZ = 0;
    team.scores.forEach((s) => {
      const profile = judgeProfiles[s.judge_id];
      const raw = computeWeightedScore(s);
      if (profile && profile.evalCount >= 2) {
        const z = (raw - profile.mean) / profile.stdDev;
        sumZ += z;
      } else {
        // Fallback for single evaluations: scale 1-10 to 0 mean
        sumZ += (raw - 5.5) / 2.5;
      }
    });

    const avgZ = sumZ / team.scores.length;
    // Map Z-score (typically -2.5 to +2.5) to a clean 0 - 100 scale:
    // Z = 0 -> 75, Z = +1.67 -> 100, Z = -1.67 -> 50
    let normalized = Math.round(Math.min(100, Math.max(0, 75 + avgZ * 15)));

    // Blend slightly with raw score (80% normalized, 20% raw scaled) to retain absolute quality floor
    const rawScaled = (rawAverage / 10) * 100;
    const finalScore = Math.round(normalized * 0.8 + rawScaled * 0.2);

    return {
      rank: 0,
      team_id: team.id,
      team_name: team.team_name,
      project_title: team.project_title,
      track: team.track,
      table_location: team.table_location,
      raw_average: Math.round(rawAverage * 10) / 10,
      normalized_score: finalScore,
      scores_count: team.scores.length,
    };
  });

  // Sort descending by normalized score, break ties by raw average
  entries.sort((a, b) => {
    if (b.normalized_score !== a.normalized_score) {
      return b.normalized_score - a.normalized_score;
    }
    return b.raw_average - a.raw_average;
  });

  // Assign ranks & medals
  entries.forEach((e, idx) => {
    e.rank = idx + 1;
    if (idx === 0) e.medal = "gold";
    else if (idx === 1) e.medal = "silver";
    else if (idx === 2) e.medal = "bronze";
  });

  return entries;
}
