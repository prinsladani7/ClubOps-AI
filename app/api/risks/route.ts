import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guard";

export async function GET() {
  const risks = db.getRisks();
  return NextResponse.json({ risks, total: risks.length });
}

export async function POST(request: Request) {
  const guard = requirePermission(request, "risk:manage");
  if (!guard.authorized) {
    return guard.response!;
  }

  // Trigger fresh risk analysis
  const freshRisks = db.runRiskAnalysis();
  return NextResponse.json({ risks: freshRisks, count: freshRisks.length });
}
