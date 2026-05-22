import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findUserById, sanitizeUser } from "@/lib/db";

const AUTH_COOKIE = "buildbill_auth";
const TOKEN_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  return process.env.SESSION_SECRET || "buildbill-dev-session-secret";
}

function encode(value) {
  return Buffer.from(value).toString("base64url");
}

function decode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function createTokenPayload(user) {
  const now = Math.floor(Date.now() / 1000);

  return {
    sub: user.id,
    email: user.email,
    role: user.role || "business_user",
    iat: now,
    exp: now + TOKEN_AGE_SECONDS
  };
}

export class UnauthorizedError extends Error {
  constructor(message = "Please log in to continue.") {
    super(message);
    this.name = "UnauthorizedError";
    this.status = 401;
  }
}

export function createAuthToken(user) {
  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encode(JSON.stringify(createTokenPayload(user)));
  const signature = sign(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

export function verifyAuthToken(token) {
  if (!token) {
    return null;
  }

  const [header, payload, signature] = token.split(".");

  if (!header || !payload || !signature) {
    return null;
  }

  const expectedSignature = sign(`${header}.${payload}`);
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(expectedBuffer, receivedBuffer)) {
    return null;
  }

  const decodedPayload = JSON.parse(decode(payload));

  if (decodedPayload.exp * 1000 < Date.now()) {
    return null;
  }

  return decodedPayload;
}

function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_AGE_SECONDS
  };
}

export function setAuthCookie(response, user) {
  response.cookies.set(AUTH_COOKIE, createAuthToken(user), authCookieOptions());
  return response;
}

export function clearAuthCookie(response = NextResponse.json({ ok: true })) {
  response.cookies.set(AUTH_COOKIE, "", {
    ...authCookieOptions(),
    maxAge: 0,
    expires: new Date(0)
  });
  return response;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  const payload = verifyAuthToken(token);

  if (!payload?.sub) {
    return null;
  }

  const user = await findUserById(payload.sub);
  return sanitizeUser(user);
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}
