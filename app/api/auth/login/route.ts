import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const validEmail = (process.env.DASHBOARD_EMAIL || "").replace(/^﻿/, "").trim();
  const validPassword = (process.env.DASHBOARD_PASSWORD || "").replace(/^﻿/, "").trim();
  const sessionSecret = (process.env.SESSION_SECRET || "").replace(/^﻿/, "").trim();

  if (!validEmail || !validPassword || !sessionSecret) {
    return NextResponse.json({ error: "Configuração inválida no servidor" }, { status: 500 });
  }

  if (email !== validEmail || password !== validPassword) {
    return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("upflu-session", sessionSecret, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
