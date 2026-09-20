import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";

/**
 * GET /api/algorithms?type=cpm|rebalance|risk|run_of_show&delayTaskId=...&delayHours=...
 * Unified endpoint for hackathon algorithms.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";
    const currentHour = Number(searchParams.get("currentHour") || "6");

    if (type === "cpm") {
      const cpm = db.getCriticalPathAnalysis();
      return NextResponse.json({ success: true, data: cpm });
    }

    if (type === "simulate_delay") {
      const taskId = searchParams.get("taskId");
      const delayHours = Number(searchParams.get("delayHours") || "2");
      if (!taskId) {
        return NextResponse.json(
          { success: false, error: "taskId query parameter is required" },
          { status: 400 }
        );
      }
      const simulation = db.simulateTaskDelay(taskId, delayHours);
      return NextResponse.json({ success: true, data: simulation });
    }

    if (type === "rebalance") {
      const optimization = db.getOptimizedWorkload();
      return NextResponse.json({ success: true, data: optimization });
    }

    if (type === "risk") {
      const riskReport = db.getHackathonRiskReport();
      return NextResponse.json({ success: true, data: riskReport });
    }

    if (type === "run_of_show") {
      const runOfShow = db.getRunOfShowAnalysis(currentHour);
      return NextResponse.json({ success: true, data: runOfShow });
    }

    // Default: return comprehensive operational telemetry bundle
    const cpm = db.getCriticalPathAnalysis();
    const workload = db.getOptimizedWorkload();
    const risk = db.getHackathonRiskReport();
    const runOfShow = db.getRunOfShowAnalysis(currentHour);

    return NextResponse.json({
      success: true,
      data: {
        cpm,
        workload,
        risk,
        runOfShow,
      },
    });
  } catch (err: any) {
    console.error("[API /api/algorithms] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Algorithm computation error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/algorithms
 * Trigger algorithmic actions: e.g. execute rebalance or simulate delay
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "simulate_delay") {
      const { taskId, delayHours } = body;
      if (!taskId) {
        return NextResponse.json(
          { success: false, error: "taskId is required" },
          { status: 400 }
        );
      }
      const result = db.simulateTaskDelay(taskId, Number(delayHours || 2));
      return NextResponse.json({ success: true, data: result });
    }

    if (action === "apply_rebalance") {
      const { rebalanceActions } = body;
      const appliedCount = 0;
      if (Array.isArray(rebalanceActions)) {
        rebalanceActions.forEach((act: any) => {
          if (act.taskId && act.toVolunteerId) {
            db.updateTask(act.taskId, { owner_id: act.toVolunteerId });
          }
        });
      }
      return NextResponse.json({
        success: true,
        message: `Applied ${rebalanceActions?.length || 0} rebalancing adjustments successfully.`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action specified" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Algorithm execution failed" },
      { status: 500 }
    );
  }
}
