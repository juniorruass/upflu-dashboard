import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { calcScore } from "@/lib/lead-scoring";

export const dynamic = "force-dynamic";

// Retorna prospects que responderam ou estão em estágios avançados
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, nome, telefone, email, cidade, tipo, status, anotacoes, cnpj, situacao_cadastral, followup_enviado, whatsapp_enviado_at, score, created_at")
    .in("status", ["respondeu", "reuniao", "proposta", "followup"])
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const prospects = (data ?? []).map((p) => ({
    ...p,
    score: p.score ?? calcScore(p),
  }));

  return NextResponse.json({ prospects });
}

// Atualiza status e anotações de um prospect via pipeline
export async function PATCH(req: NextRequest) {
  const { id, status, anotacoes, proximo_contato } = await req.json();
  const supabase = createAdminClient();

  const update: Record<string, unknown> = {};
  if (status)          update.status = status;
  if (anotacoes !== undefined) update.anotacoes = anotacoes;
  if (proximo_contato) update.proximo_contato = proximo_contato;

  // recalcula score ao mudar status
  if (status) {
    const { data: full } = await supabase.from("prospects").select("*").eq("id", id).single();
    if (full) {
      update.score = calcScore({ ...full, status });
      update.score_updated_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("prospects")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prospect: data });
}
