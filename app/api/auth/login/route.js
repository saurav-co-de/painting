import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/db";
import { setAuthCookie } from "@/lib/auth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    return setAuthCookie(NextResponse.json({ user }), user);
  } catch (error) {
    console.error("/api/auth/login error:", error);

    const body = { error: String(error?.message || "Internal Server Error") };

    if (process.env.SHOW_STACK_TRACE === "true") {
      body.stack = error?.stack;
    }

    return NextResponse.json(body, { status: 500 });
  }
}
