import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const auditLogs = db.getAuditLogs();
  return NextResponse.json({ auditLogs, count: auditLogs.length });
}
