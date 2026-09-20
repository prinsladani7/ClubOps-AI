import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, getAuthenticatedUser } from "@/lib/auth/guard";
import { can } from "@/lib/permissions";

export async function GET(request: Request) {
  const auth = getAuthenticatedUser(request);
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
  }

  const allProjects = db.getProjects();

  if (auth.user.role === "admin") {
    return NextResponse.json({ projects: allProjects, total: allProjects.length });
  }

  if (auth.user.role === "organizer") {
    const scoped = allProjects.filter((p) =>
      can(auth.user, "project:view", p, { projectId: p.id })
    );
    return NextResponse.json({ projects: scoped, total: scoped.length });
  }

  // Volunteer: can view projects they are assigned to as members
  const myProjects = allProjects.filter((p) => {
    const members = db.getProjectMembers(p.id);
    return members.some((m) => m.user_id === auth.user!.id);
  });

  return NextResponse.json({ projects: myProjects, total: myProjects.length });
}

export async function POST(request: Request) {
  try {
    const guard = requirePermission(request, "project:create");
    if (!guard.authorized) {
      return guard.response!;
    }

    const body = await request.json();
    if (!body.name || !body.organizer_id) {
      return NextResponse.json({ error: "Name and organizer_id are required" }, { status: 400 });
    }

    const project = db.createProject({
      name: body.name,
      description: body.description || "",
      organizer_id: body.organizer_id,
      budget: body.budget ? Number(body.budget) : 0,
      start_date: body.start_date,
      end_date: body.end_date,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create project" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const project = db.getProjectById(body.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const guard = requirePermission(request, "project:update", project, { projectId: body.id });
    if (!guard.authorized) {
      return guard.response!;
    }

    const updated = db.updateProject(body.id, {
      name: body.name,
      description: body.description,
      organizer_id: body.organizer_id,
      budget: body.budget,
      status: body.status,
      start_date: body.start_date,
      end_date: body.end_date,
    });

    return NextResponse.json({ project: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update project" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const guard = requirePermission(request, "project:archive", undefined, { projectId: id });
    if (!guard.authorized) {
      return guard.response!;
    }

    const success = db.archiveProject(id);
    if (!success) {
      return NextResponse.json({ error: "Project not found or already archived" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Project archived successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to archive project" }, { status: 400 });
  }
}
