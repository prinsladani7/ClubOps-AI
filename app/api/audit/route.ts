import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/guard";

export async function GET(request: Request) {
  const auth = getAuthenticatedUser(request);
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
  }

  let logs = db.getAuditLogs();

  // Audit Log Scoping (Specification Section 4 & 5):
  // Admin: View all organization audit logs
  // Organizer: View scoped project and assignment logs
  // Volunteer: View only own activity logs
  if (auth.user.role === "volunteer") {
    logs = logs.filter(
      (l) => l.actor_user_id === auth.user!.id || l.entity_id === auth.user!.id
    );
  } else if (auth.user.role === "organizer") {
    const assignedProjects = db.getProjects().filter(
      (p) => p.organizer_id === auth.user!.id || (p.organizers && p.organizers.includes(auth.user!.id))
    );
    const assignedIds = new Set(assignedProjects.map((p) => p.id));
    logs = logs.filter(
      (l) =>
        l.actor_user_id === auth.user!.id ||
        (l.metadata_json && assignedIds.has(l.metadata_json.projectId)) ||
        (l.entity_type === "project" && assignedIds.has(l.entity_id))
    );
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const entityType = searchParams.get("entityType");
  const limit = Number(searchParams.get("limit")) || 100;

  if (action) logs = logs.filter((l) => l.action.toLowerCase() === action.toLowerCase());
  if (entityType) logs = logs.filter((l) => l.entity_type.toLowerCase() === entityType.toLowerCase());

  return NextResponse.json({ auditLogs: logs.slice(0, limit), total: logs.length });
}
