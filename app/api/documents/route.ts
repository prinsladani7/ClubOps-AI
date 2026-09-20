import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser, requirePermission } from "@/lib/auth/guard";

export async function GET(request: Request) {
  const auth = getAuthenticatedUser(request);
  const userRole = auth.user?.role || "member";

  let documents = db.getDocuments();

  // Enforce document visibility clearance boundaries
  if (userRole === "member") {
    documents = documents.filter((d) => d.visibility === "public");
  } else if (userRole === "volunteer") {
    documents = documents.filter((d) => d.visibility === "public" || d.visibility === "volunteer");
  } else if (userRole === "organizer") {
    documents = documents.filter(
      (d) => d.visibility === "public" || d.visibility === "volunteer" || d.visibility === "organizer"
    );
  }
  // Admin sees all documents

  return NextResponse.json({ documents, total: documents.length });
}

export async function POST(request: Request) {
  try {
    const guard = requirePermission(request, "document:upload");
    if (!guard.authorized) {
      return guard.response!;
    }

    const body = await request.json();
    const { name, visibility, content } = body;

    if (!name || !content) {
      return NextResponse.json({ error: "Name and content are required" }, { status: 400 });
    }

    const doc = db.uploadDocument(name, visibility || "organizer", content);
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
