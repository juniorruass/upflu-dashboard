import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = req.nextUrl;

  const status = searchParams.get("status") ?? "";
  const tipo   = searchParams.get("tipo") ?? "";
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = 50;
  const offset = (page - 1) * limit;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Stats paralelas
  const [filaRes, hojeRes, followupRes, responderamRes, configsRes] = await Promise.all([
    supabase.from("prospects").select("*", { count: "exact", head: true })
      .eq("status", "novo")
      .or("whatsapp_enviado.is.null,whatsapp_enviado.eq.false")
      .not("telefone", "is", null)
      .neq("telefone", ""),
    supabase.from("prospects").select("*", { count: "exact", head: true })
      .eq("whatsapp_enviado", true)
      .gte("whatsapp_enviado_at", hoje.toISOString()),
    supabase.from("prospects").select("*", { count: "exact", head: true })
      .eq("whatsapp_enviado", true)
      .or("followup_enviado.is.null,followup_enviado.eq.false")
      .not("status", "in", '("respondeu","fechado","sem_interesse")'),
    supabase.from("prospects").select("*", { count: "exact", head: true })
      .eq("status", "respondeu"),
    supabase.from("prospecting_configs").select("id, name, search_term, source, send_hour, end_hour, active_days, daily_limit, min_delay_seconds, max_delay_seconds").eq("active", true),
  ]);

  // Prospects com filtros
  let query = supabase
    .from("prospects")
    .select("id, nome, telefone, cidade, tipo, status, whatsapp_enviado, whatsapp_enviado_at, followup_enviado, followup_enviado_at, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (tipo)   query = query.eq("tipo", tipo);

  const { data: prospects, count: total } = await query;

  return NextResponse.json({
    stats: {
      fila:               filaRes.count        ?? 0,
      enviados_hoje:      hojeRes.count         ?? 0,
      aguardando_followup: followupRes.count    ?? 0,
      responderam:        responderamRes.count   ?? 0,
    },
    prospects: prospects ?? [],
    total:     total     ?? 0,
    configs:   configsRes.data ?? [],
  });
}
