import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const event = db.getEvent();
  return NextResponse.json({ event });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const updated = db.updateEvent(body);
    return NextResponse.json({ event: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
