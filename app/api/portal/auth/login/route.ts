import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Credenciais obrigatórias" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: client, error } = await supabase
    .from("clients")
    .select("id, name, contact_email, portal_password")
    .ilike("contact_email", email.trim())
    .single();

  if (error || !client || client.portal_password !== password) {
    return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("upflu-portal-session", client.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
