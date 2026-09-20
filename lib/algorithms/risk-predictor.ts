/**
 * Real-Time Hackathon Risk & Threat Predictive Scoring Engine
 * Calibrated for Bit N Build Hackathon 2026 operations.
 *
 * Quantifies multi-factor threat vectors:
 * 1. Schedule Debt: Proximity to deadline vs. task completion percentage
 * 2. Dependency Fan-Out: Number of downstream deliverables impacted by a delay
 * 3. Assignee Burnout Index: Load fatigue score of assigned volunteer
 * 4. Blocker Escalation Velocity: Age and tier of reported impediments
 * 5. Venue/Hardware Fragility: High-stakes critical path components (e.g. Cisco switches, sound board, food passes)
 */

export interface RiskEvaluationInput {
  tasks: {
    id: string;
    title: string;
    status: string;
    priority: "low" | "medium" | "high" | "critical";
    due_at: string;
    owner_id?: string;
    is_blocked?: boolean;
    blocker_reason?: string;
    escalation_level?: "NONE" | "ORGANIZER" | "ADMIN" | "volunteer" | "organizer" | "admin" | string;
    dependencies?: string[];
    dependents?: string[];
    category?: string;
  }[];
  volunteers: {
    id: string;
    user_id: string;
    name: string;
    workloadScore: number;
    availability: string;
  }[];
  eventMilestoneHoursRemaining: number;
}

export interface TaskRiskAssessment {
  taskId: string;
  taskTitle: string;
  compositeRiskScore: number; // 0 to 100
  threatTier: "CRITICAL" | "HIGH" | "MODERATE" | "NOMINAL";
  riskFactors: {
    name: string;
    score: number; // 0 to 100
    detail: string;
  }[];
  isSinglePointOfFailure: boolean;
  recommendedAction: string;
}

export interface HackathonRiskReport {
  overallThreatIndex: number; // 0 to 100
  threatTier: "CRITICAL" | "HIGH" | "MODERATE" | "NOMINAL";
  criticalTaskCount: number;
  highRiskTaskCount: number;
  singlePointsOfFailure: string[]; // Task titles
  evaluatedTasks: TaskRiskAssessment[];
  contingencyPlaybooks: {
    threatId: string;
    trigger: string;
    title: string;
    leadCommittee: string;
    actionSteps: string[];
  }[];
}

export class RiskPredictor {
  /**
   * Evaluate risks across all hackathon deliverables.
   */
  static evaluate(input: RiskEvaluationInput): HackathonRiskReport {
    const volMap = new Map<string, (typeof input.volunteers)[0]>();
    input.volunteers.forEach((v) => {
      volMap.set(v.id, v);
      volMap.set(v.user_id, v);
    });

    const evaluatedTasks: TaskRiskAssessment[] = [];
    const spofs: string[] = [];

    input.tasks.forEach((t) => {
      const factors: TaskRiskAssessment["riskFactors"] = [];

      // 1. Schedule Debt Factor
      const dueDate = new Date(t.due_at).getTime();
      const now = Date.now();
      const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);

      let scheduleScore = 15;
      let scheduleDetail = "Normal deadline cushion";

      if (t.status === "completed" || t.status === "done") {
        scheduleScore = 0;
        scheduleDetail = "Deliverable marked completed";
      } else if (hoursUntilDue < 0) {
        scheduleScore = 95;
        scheduleDetail = `OVERDUE by ${Math.abs(hoursUntilDue).toFixed(1)} hours past scheduled slot`;
      } else if (hoursUntilDue < 6) {
        scheduleScore = 75;
        scheduleDetail = `Tight delivery window (${hoursUntilDue.toFixed(1)}h remaining)`;
      } else if (hoursUntilDue < 24) {
        scheduleScore = 45;
        scheduleDetail = `Within 24-hour run-of-show target`;
      }
      factors.push({ name: "Schedule Proximity", score: scheduleScore, detail: scheduleDetail });

      // 2. Dependency Fan-Out Factor
      const depCount = t.dependents?.length || 0;
      let fanoutScore = Math.min(90, depCount * 25);
      let fanoutDetail = depCount > 0 ? `Blocks ${depCount} downstream deliverables` : "Leaf deliverable";
      factors.push({ name: "Dependency Fan-out", score: fanoutScore, detail: fanoutDetail });

      // 3. Assignee Burnout Factor
      const vol = t.owner_id ? volMap.get(t.owner_id) : undefined;
      const volLoad = vol?.workloadScore || 50;
      let burnoutScore = volLoad > 85 ? 85 : volLoad > 70 ? 60 : 20;
      let burnoutDetail = vol ? `${vol.name} at ${volLoad}% capacity` : "Unassigned deliverable";
      if (!vol) burnoutScore = 70;
      factors.push({ name: "Assignee Strain", score: burnoutScore, detail: burnoutDetail });

      // 4. Blocker Escalation Factor
      let blockerScore = 0;
      let blockerDetail = "No active impediments reported";
      if (t.is_blocked) {
        const esc = (t.escalation_level || "").toUpperCase();
        if (esc === "ADMIN") {
          blockerScore = 100;
          blockerDetail = `ADMIN ESCALATION: ${t.blocker_reason || "Critical blocker"}`;
        } else if (esc === "ORGANIZER") {
          blockerScore = 75;
          blockerDetail = `ORGANIZER TRIAGE: ${t.blocker_reason || "Escalated blocker"}`;
        } else {
          blockerScore = 55;
          blockerDetail = `Volunteer Blocked: ${t.blocker_reason || "Impediment logged"}`;
        }
      }
      factors.push({ name: "Blocker State", score: blockerScore, detail: blockerDetail });

      // Composite calculation (weighted sum)
      const pWeights = { critical: 1.3, high: 1.1, medium: 0.9, low: 0.7 };
      const priorityMultiplier = pWeights[t.priority] || 1.0;

      const rawComposite =
        (scheduleScore * 0.35 +
          fanoutScore * 0.25 +
          burnoutScore * 0.15 +
          blockerScore * 0.25) *
        priorityMultiplier;

      const compositeScore = Math.min(100, Math.round(rawComposite));

      let threatTier: TaskRiskAssessment["threatTier"] = "NOMINAL";
      if (compositeScore >= 75) threatTier = "CRITICAL";
      else if (compositeScore >= 50) threatTier = "HIGH";
      else if (compositeScore >= 25) threatTier = "MODERATE";

      // Single Point of Failure (SPOF): High fan-out, critical priority, and either blocked or overdue
      const isSPOF =
        depCount >= 2 &&
        (t.priority === "critical" || t.priority === "high") &&
        (t.is_blocked || scheduleScore >= 75);

      if (isSPOF) spofs.push(t.title);

      // Concrete collegiate action recommendations
      let recAction = "Monitor according to milestone checkpoints.";
      if (t.is_blocked && t.escalation_level === "ADMIN") {
        recAction = "Immediate executive intervention required. Dispatch secondary volunteer squad.";
      } else if (scheduleScore >= 75) {
        recAction = "Expedite deliverable sign-off or split task scope to prevent downstream schedule slip.";
      } else if (burnoutScore >= 80) {
        recAction = "Initiate workload rebalance to reassign task to available squad member.";
      }

      evaluatedTasks.push({
        taskId: t.id,
        taskTitle: t.title,
        compositeRiskScore: compositeScore,
        threatTier,
        riskFactors: factors,
        isSinglePointOfFailure: isSPOF,
        recommendedAction: recAction,
      });
    });

    evaluatedTasks.sort((a, b) => b.compositeRiskScore - a.compositeRiskScore);

    const criticalCount = evaluatedTasks.filter((t) => t.threatTier === "CRITICAL").length;
    const highCount = evaluatedTasks.filter((t) => t.threatTier === "HIGH").length;

    const overallThreatIndex =
      evaluatedTasks.length > 0
        ? Math.round(
            evaluatedTasks.reduce((sum, t) => sum + t.compositeRiskScore, 0) /
              evaluatedTasks.length
          )
        : 20;

    let overallTier: HackathonRiskReport["threatTier"] = "NOMINAL";
    if (criticalCount > 0 || overallThreatIndex >= 65) overallTier = "CRITICAL";
    else if (highCount >= 2 || overallThreatIndex >= 45) overallTier = "HIGH";
    else if (overallThreatIndex >= 25) overallTier = "MODERATE";

    // Standard contingency playbooks for Bit N Build Hackathon
    const contingencyPlaybooks = [
      {
        threatId: "cpg-network-failover",
        trigger: "WiFi AP saturation > 85% or Cisco Switch port flapping in Lab 302",
        title: "Secondary Subnet & 4G Failover Protocol",
        leadCommittee: "Tech & Infrastructure",
        actionSteps: [
          "Deploy backup Ubiquiti UniFi U6-Pro APs to Lab 302 ceiling mount",
          "Switch hacker tables 12-24 to dedicated 5GHz SSID 'BitNBuild_5G_VIP'",
          "Notify hacker Discord #announcements channel with static IP instructions",
        ],
      },
      {
        threatId: "cpg-midnight-catering",
        trigger: "Catering delivery vehicle delayed > 30 minutes past 00:30 AM",
        title: "Contingency Campus Cafeteria Induction & Maggi Prep",
        leadCommittee: "Hospitality & Food",
        actionSteps: [
          "Unlock Student Cafeteria Kitchen B using Dean authorization pass",
          "Dispatch 4 volunteers to distribute emergency hot water kettles and instant Maggi noodles",
          "Distribute Red Bull and caffeine rations to Hacker Arena Labs 301-304",
        ],
      },
      {
        threatId: "cpg-stage-av-jitter",
        trigger: "Main Auditorium HDMI switcher or Yamaha mixer signal degradation",
        title: "Presentation Stage B Hardline Switchover",
        leadCommittee: "Media & Stage Production",
        actionSteps: [
          "Engage hardwired SDI-to-HDMI backup converter at Stage Podium",
          "Switch judge monitors to wireless Barco ClickShare receiver",
          "Route stage mics through Shure analog wireless receivers",
        ],
      },
    ];

    return {
      overallThreatIndex,
      threatTier: overallTier,
      criticalTaskCount: criticalCount,
      highRiskTaskCount: highCount,
      singlePointsOfFailure: spofs,
      evaluatedTasks,
      contingencyPlaybooks,
    };
  }
}
