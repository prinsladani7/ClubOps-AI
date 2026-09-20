import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, getAuthenticatedUser } from "@/lib/auth/guard";

export async function GET(request: Request) {
  const guard = requirePermission(request, "report:view");
  if (!guard.authorized) {
    return guard.response!;
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  let reports = db.getProgressReports(projectId || undefined);

  if (guard.user?.role === "organizer") {
    const assignedProjects = db.getProjects().filter(
      (p) => p.organizer_id === guard.user!.id || (p.organizers && p.organizers.includes(guard.user!.id))
    );
    const assignedIds = new Set(assignedProjects.map((p) => p.id));
    reports = reports.filter((r) => assignedIds.has(r.project_id) || r.author_id === guard.user!.id);
  }

  return NextResponse.json({ reports, total: reports.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.project_id || !body.title || !body.summary) {
      return NextResponse.json({ error: "project_id, title, and summary are required." }, { status: 400 });
    }

    const guard = requirePermission(request, "report:create", undefined, { projectId: body.project_id });
    if (!guard.authorized) {
      return guard.response!;
    }

    const report = db.createProgressReport({
      project_id: body.project_id,
      title: body.title,
      summary: body.summary,
      completed_tasks: body.completed_tasks || 0,
      pending_tasks: body.pending_tasks || 0,
      blocked_tasks: body.blocked_tasks || 0,
      risks_identified: body.risks_identified || [],
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create report" }, { status: 400 });
  }
}
