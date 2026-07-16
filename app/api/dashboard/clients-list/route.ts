import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Lista de clientes reais (nome + se tem Meta Ads conectado), consumida pelo
// Lilly's na página de Grupos pra garantir que o "cliente" escolhido por
// grupo bate exatamente com o cadastro que alimenta os relatórios de campanha.
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.ADM_API_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, name, status, meta_account_id, meta_access_token")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    clients: (clients ?? []).map((c) => ({
      name: c.name,
      status: c.status,
      has_meta: Boolean(c.meta_account_id && (c.meta_access_token || process.env.META_ACCESS_TOKEN)),
    })),
  });
}
