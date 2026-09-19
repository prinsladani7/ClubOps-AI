import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CreateTaskSchema, UpdateTaskSchema } from "@/lib/ai/tools";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  let tasks = db.getTasks();
  if (status) tasks = tasks.filter((t) => t.status === status);
  if (priority) tasks = tasks.filter((t) => t.priority === priority);

  return NextResponse.json({ tasks, total: tasks.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = CreateTaskSchema.parse(body);

    const task = db.createTask({
      event_id: db.getEvent().id,
      title: validated.title,
      description: validated.description || "Created via API route",
      owner_id: validated.owner_id,
      status: "todo",
      priority: validated.priority,
      due_at: validated.deadline || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: db.getCurrentUser().id,
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

    const updated = db.updateTask(validated.task_id, {
      status: validated.status,
      priority: validated.priority,
      owner_id: validated.owner_id,
      due_at: validated.due_at,
    });

    if (!updated) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid update payload" }, { status: 400 });
  }
}
