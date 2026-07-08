import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase";
import { signPortalSession } from "@/lib/portal-session";

function toSlug(name: string): string {
  return name.toLowerCase().normalize("NFD")
    .split("").filter((c) => c.charCodeAt(0) < 0x0300 || c.charCodeAt(0) > 0x036f)
    .join("").replace(/[^a-z0-9]/g, "");
}

export async function POST(req: NextRequest) {
  const { slug, password } = await req.json();

  if (!slug || !password) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: all } = await supabase
    .from("clients")
    .select("id, name, slug, portal_password");

  if (!all) return NextResponse.json({ error: "Erro interno" }, { status: 500 });

  const client = all.find(
    (c: { slug: string | null; name: string }) =>
      c.slug === slug || toSlug(c.name) === slug
  );

  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const pwd = (client as { portal_password: string | null }).portal_password;
  if (!pwd) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  const senhaCorreta = pwd.startsWith("$2") ? await bcrypt.compare(password, pwd) : pwd === password;
  if (!senhaCorreta) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  // Migração lazy: re-salva como hash na primeira vez que a senha em texto puro validar
  if (!pwd.startsWith("$2")) {
    await supabase.from("clients").update({ portal_password: await bcrypt.hash(password, 10) }).eq("id", client.id);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(`portal_${slug}`, await signPortalSession(client.id), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}

export async function DELETE(req: NextRequest) {
  const { slug } = await req.json();
  const res = NextResponse.json({ ok: true });
  if (slug) res.cookies.delete(`portal_${slug}`);
  return res;
}
