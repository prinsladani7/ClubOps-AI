import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const meetings = db.getMeetings();
  return NextResponse.json({ meetings });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, meetingId, transcriptText, actionItemIds } = body;

    if (action === "extract" && meetingId && transcriptText) {
      const items = db.extractActionItemsFromTranscript(meetingId, transcriptText);
      return NextResponse.json({ actionItems: items });
    }

    if (action === "approve" && actionItemIds && Array.isArray(actionItemIds)) {
      const tasks = db.approveActionItems(actionItemIds);
      return NextResponse.json({ createdTasks: tasks });
    }

    return NextResponse.json({ error: "Invalid meeting action specification" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
