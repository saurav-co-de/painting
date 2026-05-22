import { createHash, randomBytes } from "node:crypto";

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_AGE_MINUTES = 30;

export function createPasswordResetToken() {
  const token = randomBytes(RESET_TOKEN_BYTES).toString("base64url");
  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_AGE_MINUTES * 60 * 1000).toISOString()
  };
}

export function hashPasswordResetToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

export function buildPasswordResetUrl(request, token) {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || new URL(request.url).origin;
  const resetUrl = new URL("/reset-password", configuredBaseUrl);
  resetUrl.searchParams.set("token", token);
  return resetUrl.toString();
}
