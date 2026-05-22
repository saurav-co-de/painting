import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/db";

export async function POST(request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const user = await findUserByEmail(email);

  return NextResponse.json({
    ok: true,
    message: user
      ? `Password reset requested for ${email}. Connect your email provider in production to send the reset link.`
      : "If this email exists, a reset link will be sent."
  });
}
