import { NextResponse } from "next/server";
import { aiProvider } from "@/lib/ai/provider";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { command, userId } = body;

    if (!command) {
      return NextResponse.json({ error: "Command string is required" }, { status: 400 });
    }

    const user = userId ? db.getUserById(userId) || db.getCurrentUser() : db.getCurrentUser();
    const result = await aiProvider.processCommand(command, user);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
