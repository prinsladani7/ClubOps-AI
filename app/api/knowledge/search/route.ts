import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AnswerFromKnowledgeSchema } from "@/lib/ai/tools";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, userRole } = body;

    if (!question) {
      return NextResponse.json({ error: "Question parameter is required" }, { status: 400 });
    }

    const role = userRole || db.getCurrentUser().role;
    const result = db.searchKnowledgeRAG(question, role);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
