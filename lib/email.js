function getSenderAddress() {
  return process.env.EMAIL_FROM || "BuildBill AI <onboarding@resend.dev>";
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  if (!process.env.RESEND_API_KEY) {
    return {
      sent: false,
      reason: "RESEND_API_KEY is not configured."
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: getSenderAddress(),
      to,
      subject: "Reset your BuildBill AI password",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Reset your password</h2>
          <p>Use the button below to set a new password for your BuildBill AI account.</p>
          <p>
            <a href="${resetUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;">
              Reset password
            </a>
          </p>
          <p>This link expires in 30 minutes. If you did not request it, you can ignore this email.</p>
          <p style="word-break: break-all; color: #64748b;">${resetUrl}</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Could not send reset email.");
  }

  return {
    sent: true
  };
}
