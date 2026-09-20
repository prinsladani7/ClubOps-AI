import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = body.token || body.email;

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    const result = db.verifyEmail(token);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Invalid or expired verification token" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      message: "Email successfully verified. Account is now active.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Verification failed" }, { status: 500 });
  }
}
