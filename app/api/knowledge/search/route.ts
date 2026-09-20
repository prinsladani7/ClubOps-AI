import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/guard";

export async function POST(request: Request) {
  try {
    const auth = getAuthenticatedUser(request);
    const body = await request.json();
    const { question, simulateRole } = body;

    if (!question) {
      return NextResponse.json({ error: "Question parameter is required" }, { status: 400 });
    }

    // Role cannot be escalated by client body:
    // If the authenticated user is an Admin, they may optionally simulate a lower role for testing.
    // Otherwise, the authenticated user's actual role is strictly enforced.
    let effectiveRole = auth.user?.role || "member";
    if (auth.user?.role === "admin" && simulateRole) {
      effectiveRole = simulateRole;
    }

    const result = db.searchKnowledgeRAG(question, effectiveRole);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to perform knowledge search" }, { status: 500 });
  }
}
