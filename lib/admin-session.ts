import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";

function getSecret(): Uint8Array {
  const raw = (process.env.SESSION_SECRET || "").replace(/^﻿/, "").trim();
  return new TextEncoder().encode(raw);
}

export async function isAdminAuthed(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("upflu-session")?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}
