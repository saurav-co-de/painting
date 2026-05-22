import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/db";
import { hashPasswordResetToken } from "@/lib/password-reset";

export async function POST(request) {
  const { token, password } = await request.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Reset token and password are required." }, { status: 400 });
  }

  if (String(password).length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 }
    );
  }

  const user = await resetPasswordWithToken(hashPasswordResetToken(token), password);

  if (!user) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Password updated. You can now log in with your new password."
  });
}
