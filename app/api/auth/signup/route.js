import { NextResponse } from "next/server";
import { createUser } from "@/lib/db";
import { setAuthCookie } from "@/lib/auth";

export async function POST(request) {
  const payload = await request.json();

  if (!payload.name || !payload.businessName || !payload.email || !payload.password) {
    return NextResponse.json(
      { error: "Name, business name, email, and password are required." },
      { status: 400 }
    );
  }

  if (String(payload.password).length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 }
    );
  }

  try {
    const user = await createUser(payload);
    return setAuthCookie(NextResponse.json({ user }), user);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
