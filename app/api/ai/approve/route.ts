import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/guard";

export async function POST(request: Request) {
  try {
    const auth = getAuthenticatedUser(request);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error || "Authentication required" }, { status: auth.status || 401 });
    }

    if (auth.user.role === "member") {
      return NextResponse.json(
        { error: "Clearance Denied: Members cannot approve operational AI mutations." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { toolCallId, approved } = body;

    if (!toolCallId) {
      return NextResponse.json({ error: "toolCallId is required" }, { status: 400 });
    }

    const result = db.approveAITool(toolCallId, Boolean(approved));
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to process tool approval" }, { status: 500 });
  }
}
