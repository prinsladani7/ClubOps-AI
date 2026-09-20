import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guard";

export async function GET() {
  const event = db.getEvent();
  return NextResponse.json({ event });
}

export async function PATCH(request: Request) {
  try {
    const guard = requirePermission(request, "event:update");
    if (!guard.authorized) {
      return guard.response!;
    }

    const body = await request.json();
    const updated = db.updateEvent(body);
    return NextResponse.json({ event: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update event parameters" }, { status: 400 });
  }
}
