import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser, requirePermission } from "@/lib/auth/guard";

export async function GET(request: Request) {
  const auth = getAuthenticatedUser(request);
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
  }

  let volunteers = db.getVolunteers();

  if (auth.user.role === "organizer") {
    // Scoped volunteers: volunteers assigned to projects or teams led by this organizer
    const assignedProjects = db.getProjects().filter(
      (p) => p.organizer_id === auth.user!.id || (p.organizers && p.organizers.includes(auth.user!.id))
    );
    const assignedProjectIds = new Set(assignedProjects.map((p) => p.id));
    
    // Collect volunteer user IDs from these projects
    const allowedUserIds = new Set<string>();
    assignedProjects.forEach((p) => {
      const members = db.getProjectMembers(p.id);
      members.forEach((m) => allowedUserIds.add(m.user_id));
    });

    volunteers = volunteers.filter(
      (v) =>
        allowedUserIds.has(v.user_id) ||
        (v.project_ids && v.project_ids.some((pid) => assignedProjectIds.has(pid)))
    );
  } else if (auth.user.role === "volunteer") {
    // Volunteers only view their own profile
    volunteers = volunteers.filter((v) => v.user_id === auth.user!.id);
  }

  return NextResponse.json({ volunteers, total: volunteers.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, userId, role } = body;

    if (!projectId || !userId) {
      return NextResponse.json({ error: "projectId and userId are required" }, { status: 400 });
    }

    const guard = requirePermission(request, "volunteer:add", undefined, { projectId });
    if (!guard.authorized) {
      return guard.response!;
    }

    const member = db.addProjectMember(projectId, userId, role || "volunteer");
    return NextResponse.json({ member }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to add volunteer to project" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectMemberId = searchParams.get("projectMemberId");
    const reassignmentUserId = searchParams.get("reassignTo") || undefined;

    if (!projectMemberId) {
      return NextResponse.json({ error: "projectMemberId is required" }, { status: 400 });
    }

    const guard = requirePermission(request, "volunteer:remove");
    if (!guard.authorized) {
      return guard.response!;
    }

    // Call db.removeProjectMember which handles permission check, soft deactivation, task impact calculation & audit logging
    const result = db.removeProjectMember(projectMemberId, reassignmentUserId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to remove member" }, { status: 400 });
  }
}
