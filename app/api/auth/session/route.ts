import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/guard";

export async function GET(request: Request) {
  const auth = getAuthenticatedUser(request);
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || "No active session" }, { status: auth.status || 401 });
  }

  const sessions = db.getUserSessions(auth.user.id);
  return NextResponse.json({
    user: auth.user,
    session: auth.session,
    activeSessions: sessions,
  });
}

export async function DELETE(request: Request) {
  const auth = getAuthenticatedUser(request);
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const all = searchParams.get("all") === "true";

  if (all) {
    // Revoke all sessions for current user or admin target
    const targetUserId = searchParams.get("userId") || auth.user.id;
    if (targetUserId !== auth.user.id && auth.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized to revoke other users' sessions" }, { status: 403 });
    }
    const count = db.revokeAllSessions(targetUserId);
    return NextResponse.json({ success: true, revokedCount: count });
  }

  if (sessionId) {
    const success = db.revokeSession(sessionId);
    return NextResponse.json({ success });
  }

  return NextResponse.json({ error: "sessionId or all=true required" }, { status: 400 });
}
