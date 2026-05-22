import { NextResponse } from "next/server";
import { findUserByEmail, savePasswordResetToken } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { buildPasswordResetUrl, createPasswordResetToken } from "@/lib/password-reset";

export async function POST(request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return NextResponse.json({
      ok: true,
      message: "If this email exists, a reset link will be sent."
    });
  }

  const resetToken = createPasswordResetToken();
  const resetUrl = buildPasswordResetUrl(request, resetToken.token);
  await savePasswordResetToken(user.id, resetToken.tokenHash, resetToken.expiresAt);

  const emailResult = await sendPasswordResetEmail({ to: user.email, resetUrl });
  const showResetLink = process.env.NODE_ENV !== "production" && !emailResult.sent;

  return NextResponse.json({
    ok: true,
    message: emailResult.sent
      ? "Password reset link sent. Please check your email."
      : "Password reset link created. Configure RESEND_API_KEY in production to send it by email.",
    resetUrl: showResetLink ? resetUrl : undefined
  });
}
