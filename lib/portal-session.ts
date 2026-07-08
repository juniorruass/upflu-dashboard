import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

function getSecret(): Uint8Array {
  const raw = (process.env.SESSION_SECRET || "").replace(/^﻿/, "").trim();
  return new TextEncoder().encode(raw);
}

export async function signPortalSession(clientId: string): Promise<string> {
  return new SignJWT({ typ: "portal", clientId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyPortalSession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.typ !== "portal" || typeof payload.clientId !== "string") return null;
    return payload.clientId;
  } catch {
    return null;
  }
}

// Retorna os clientId de todas as sessões de portal válidas presentes nos cookies (nome portal_*)
export async function getPortalClientIds(req: NextRequest): Promise<string[]> {
  const candidates = req.cookies.getAll().filter((c) => c.name.startsWith("portal_"));
  const ids = await Promise.all(candidates.map((c) => verifyPortalSession(c.value)));
  return ids.filter((id): id is string => id !== null);
}
