import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/auth/guard";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Rate limiting (Specification Section 3 & 10)
    const rateLimitKey = `login:${email.toLowerCase()}`;
    if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many failed login attempts. Account temporarily throttled for 15 minutes." },
        { status: 429 }
      );
    }

    const result = db.loginUser(email, password, role);

    if (!result.success) {
      const status = result.pendingVerification
        ? 403
        : result.error?.includes("Role mismatch")
        ? 403
        : result.error?.includes("temporarily locked")
        ? 423
        : result.error?.includes("suspended") || result.error?.includes("deactivated")
        ? 403
        : 401;

      return NextResponse.json(
        {
          error: result.error || "Authentication failed",
          pendingVerification: result.pendingVerification,
        },
        { status }
      );
    }

    return NextResponse.json({
      user: result.user,
      session: result.session,
      message: "Authenticated successfully",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error during authentication" }, { status: 500 });
  }
}
