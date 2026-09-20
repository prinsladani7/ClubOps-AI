import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UserRole } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role, password } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.getUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const targetRole: UserRole = role || "volunteer";
    const newUser = db.registerUser(name.trim(), normalizedEmail, targetRole);

    return NextResponse.json(
      {
        user: newUser,
        message: "Account created successfully.",
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Registration failed" }, { status: 500 });
  }
}
