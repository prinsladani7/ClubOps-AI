import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toolCallId, approved } = body;

    if (!toolCallId) {
      return NextResponse.json({ error: "toolCallId is required" }, { status: 400 });
    }

    const result = db.approveAITool(toolCallId, Boolean(approved));
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
