import { SignJWT, jwtVerify } from "jose";

const TTL_SECONDS = 60 * 60 * 8; // 8 horas

function secret() {
  const raw = (process.env.SESSION_SECRET || "").replace(/^﻿/, "").trim();
  return new TextEncoder().encode(raw);
}

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export const SESSION_COOKIE = "upflu-session";
export const SESSION_MAX_AGE = TTL_SECONDS;
