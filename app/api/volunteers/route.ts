import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const volunteers = db.getVolunteers();
  return NextResponse.json({ volunteers, total: volunteers.length });
}
