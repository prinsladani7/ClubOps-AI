import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const documents = db.getDocuments();
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, visibility, content } = body;

    if (!name || !content) {
      return NextResponse.json({ error: "Name and content are required" }, { status: 400 });
    }

    const doc = db.uploadDocument(name, visibility || "organizer", content);
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
