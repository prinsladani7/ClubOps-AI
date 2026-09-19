import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const risks = db.getRisks();
  return NextResponse.json({ risks, total: risks.length });
}

export async function POST() {
  // Trigger fresh risk analysis
  const freshRisks = db.runRiskAnalysis();
  return NextResponse.json({ risks: freshRisks, count: freshRisks.length });
}
