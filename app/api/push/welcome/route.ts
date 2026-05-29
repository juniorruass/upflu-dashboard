import { NextRequest, NextResponse } from "next/server";
import { notifyClient } from "@/lib/webpush";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { clientId, clientSlug } = await req.json();
  if (!clientId) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const supabase = createAdminClient();
  const result = await supabase.from("clients").select("name").eq("id", clientId).single();
  const client = result.data as { name?: string } | null;

  await notifyClient(clientId, {
    title: "👋 Bem-vindo ao seu painel!",
    body: `Olá${client?.name ? `, ${client.name.split(" ")[0]}` : ""}! Você vai receber atualizações de performance aqui.`,
    url: `/${clientSlug}`,
    tag: "welcome",
  });

  return NextResponse.json({ ok: true });
}
