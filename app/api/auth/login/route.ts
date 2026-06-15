import { NextRequest, NextResponse } from "next/server";
import { signAdminToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const validEmail    = (process.env.DASHBOARD_EMAIL    || "").replace(/^﻿/, "").trim();
  const validPassword = (process.env.DASHBOARD_PASSWORD || "").replace(/^﻿/, "").trim();
  const sessionSecret = (process.env.SESSION_SECRET     || "").replace(/^﻿/, "").trim();

  if (!validEmail || !validPassword || !sessionSecret) {
    return NextResponse.json({ error: "Configuração inválida no servidor" }, { status: 500 });
  }

  const emailMatch    = (email    || "").trim().toLowerCase() === validEmail.toLowerCase();
  const passwordMatch = (password || "").trim() === validPassword;

  if (!emailMatch || !passwordMatch) {
    return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
  }

  const token    = await signAdminToken();
  const response = NextResponse.json({ success: true });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   SESSION_MAX_AGE,
    path:     "/",
  });

  return response;
}
