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

  const firstName = client?.name ? client.name.split(" ")[0] : null;
  await notifyClient(clientId, {
    title: "🚀 Painel ativado!",
    body: firstName
      ? `${firstName}, seu relatório de performance está no ar. Vamos crescer juntos.`
      : "Seu relatório de performance está no ar. Você receberá atualizações por aqui.",
    url: `/${clientSlug}`,
    tag: "welcome",
  });

  return NextResponse.json({ ok: true });
}
