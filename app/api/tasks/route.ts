import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, getAuthenticatedUser } from "@/lib/auth/guard";
import { CreateTaskSchema, UpdateTaskSchema } from "@/lib/ai/tools";

export async function GET(request: Request) {
  const auth = getAuthenticatedUser(request);
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const projectId = searchParams.get("projectId");

  let tasks = db.getTasks();

  // Resource Scoping:
  // Admin: all tasks
  // Organizer: tasks within assigned projects/teams
  // Volunteer: only tasks assigned to them
  if (auth.user.role === "volunteer") {
    tasks = tasks.filter((t) => t.owner_id === auth.user!.id);
  } else if (auth.user.role === "organizer") {
    const assignedProjects = db.getProjects().filter(
      (p) => p.organizer_id === auth.user!.id || (p.organizers && p.organizers.includes(auth.user!.id))
    );
    const projectIds = new Set(assignedProjects.map((p) => p.id));
    tasks = tasks.filter((t) => (t.project_id && projectIds.has(t.project_id)) || t.created_by === auth.user!.id);
  }

  if (projectId) tasks = tasks.filter((t) => t.project_id === projectId);
  if (status) tasks = tasks.filter((t) => t.status === status);
  if (priority) tasks = tasks.filter((t) => t.priority === priority);

  return NextResponse.json({ tasks, total: tasks.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = CreateTaskSchema.parse(body);

    const projectId = body.project_id || db.getProjects()[0]?.id;

    // Server-side authorization check with project context
    const guard = requirePermission(request, "task:create", undefined, {
      projectId,
      teamId: body.team_id,
    });

    if (!guard.authorized) {
      return guard.response!;
    }

    // If Organizer, verify volunteer is within scope if owner_id provided
    if (guard.user?.role === "organizer" && validated.owner_id) {
      const isMember = db.getProjectMembers(projectId).some((m) => m.user_id === validated.owner_id);
      if (!isMember) {
        // Volunteer not in project scope
        return NextResponse.json(
          {
            error: "Scope Violation: Assigned volunteer is not part of this project's authorized squad roster.",
            code: "VOLUNTEER_OUT_OF_SCOPE",
          },
          { status: 403 }
        );
      }
    }

    const task = db.createTask({
      event_id: db.getEvent().id,
      project_id: projectId,
      title: validated.title,
      description: validated.description || "Created via API route",
      owner_id: validated.owner_id,
      status: "pending",
      priority: validated.priority,
      due_at: validated.deadline || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: guard.user!.id,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid task payload" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const validated = UpdateTaskSchema.parse(body);

    const existingTask = db.getTaskById(validated.task_id);
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Require task:update clearance on this specific task resource
    const guard = requirePermission(request, "task:update", existingTask, {
      taskId: validated.task_id,
      projectId: existingTask.project_id,
    });

    if (!guard.authorized) {
      return guard.response!;
    }

    // Volunteer vertical privilege protection:
    // Volunteers can only transition workflow status or add evidence, not reassign tasks or change deadlines
    if (guard.user?.role === "volunteer") {
      if (validated.owner_id && validated.owner_id !== guard.user.id) {
        return NextResponse.json(
          { error: "Privilege Escalation Blocked: Volunteers cannot reassign tasks." },
          { status: 403 }
        );
      }
    }

    const updated = db.updateTask(validated.task_id, {
      status: validated.status,
      priority: validated.priority,
      owner_id: validated.owner_id,
      due_at: validated.due_at,
    });

    return NextResponse.json({ task: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid update payload" }, { status: 400 });
  }
}
