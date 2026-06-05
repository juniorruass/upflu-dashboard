import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Horários do cron em BRT (Brasília = UTC-3)
const CRON_BRT_HOURS = [8, 14];
const BRT_OFFSET = -3; // horas

// Converte Date UTC para "Date em BRT" (getUTCHours() = hora BRT)
function toBRT(date: Date): Date {
  return new Date(date.getTime() + BRT_OFFSET * 3600000);
}

function calcProximoEnvio(
  status: string,
  whatsappEnviadoAt: string | null,
  followupDays: number,
  activeDays: number[],
): Date | null {
  const diasSet = new Set(activeDays.length ? activeDays : [1, 2, 3, 4, 5]);
  const nowBrt  = toBRT(new Date());
  let startBrt: Date;

  if (status === "novo") {
    startBrt = nowBrt;
  } else if ((status === "contatado" || status === "followup") && whatsappEnviadoAt) {
    const dueBrt = toBRT(new Date(new Date(whatsappEnviadoAt).getTime() + followupDays * 86400000));
    startBrt = dueBrt > nowBrt ? dueBrt : nowBrt;
  } else {
    return null;
  }

  for (let d = 0; d <= 30; d++) {
    // Avança d dias em BRT
    const dayBrt = new Date(startBrt);
    dayBrt.setUTCDate(startBrt.getUTCDate() + d);
    dayBrt.setUTCHours(0, 0, 0, 0);

    const dow = dayBrt.getUTCDay();
    if (!diasSet.has(dow)) continue;

    // Hora BRT atual no dia de início; -1 nos dias seguintes (todas as horas disponíveis)
    const startHourBrt = d === 0 ? startBrt.getUTCHours() : -1;
    const hoursAvail   = CRON_BRT_HOURS.filter((h) => h > startHourBrt);
    if (!hoursAvail.length) continue;

    // Converte hora BRT de volta para UTC: UTC = BRT - BRT_OFFSET = BRT + 3
    const result = new Date(dayBrt);
    result.setUTCHours(hoursAvail[0] - BRT_OFFSET, 0, 0, 0);
    return result;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = req.nextUrl;

  const status  = searchParams.get("status") ?? "";
  const tipo    = searchParams.get("tipo")   ?? "";
  const mode    = searchParams.get("mode")   ?? "pending"; // pending | all
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit   = 50;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Stats + configs em paralelo
  const [filaRes, hojeRes, followupRes, responderamRes, configsRes] = await Promise.all([
    supabase.from("prospects").select("*", { count: "exact", head: true })
      .eq("status", "novo")
      .or("whatsapp_enviado.is.null,whatsapp_enviado.eq.false")
      .not("telefone", "is", null).neq("telefone", ""),
    supabase.from("prospects").select("*", { count: "exact", head: true })
      .eq("whatsapp_enviado", true).gte("whatsapp_enviado_at", hoje.toISOString()),
    supabase.from("prospects").select("*", { count: "exact", head: true })
      .eq("whatsapp_enviado", true)
      .or("followup_enviado.is.null,followup_enviado.eq.false")
      .not("status", "in", '("respondeu","fechado","sem_interesse")'),
    supabase.from("prospects").select("*", { count: "exact", head: true })
      .eq("status", "respondeu"),
    supabase.from("prospecting_configs")
      .select("id, name, search_term, source, send_hour, end_hour, active_days, daily_limit, min_delay_seconds, max_delay_seconds, followup_days")
      .eq("active", true),
  ]);

  const configs = configsRes.data ?? [];

  // Mapa: search_term → config
  const configMap = new Map(configs.map((c) => [(c.search_term ?? "").toLowerCase().trim(), c]));
  const defaultCfg = configs[0];

  // Busca prospects
  let query = supabase
    .from("prospects")
    .select("id, nome, telefone, cidade, tipo, status, whatsapp_enviado, whatsapp_enviado_at, followup_enviado, followup_enviado_at, created_at");

  if (mode === "pending") {
    // Novo sem envio OU contatado/followup sem follow-up enviado
    query = query.or(
      "status.eq.novo," +
      "and(status.eq.contatado,followup_enviado.is.null)," +
      "and(status.eq.contatado,followup_enviado.eq.false)," +
      "and(status.eq.followup,followup_enviado.is.null)," +
      "and(status.eq.followup,followup_enviado.eq.false)"
    );
    if (tipo) query = query.eq("tipo", tipo);
  } else {
    if (status) query = query.eq("status", status);
    if (tipo)   query = query.eq("tipo", tipo);
    query = query.order("created_at", { ascending: false });
  }

  const { data: rawProspects } = await query.limit(500);

  // Calcula proximo_envio para cada prospect
  const prospects = (rawProspects ?? []).map((p) => {
    const cfg = configMap.get((p.tipo ?? "").toLowerCase().trim()) ?? defaultCfg;
    const followupDays = cfg?.followup_days ?? 3;
    const activeDays   = cfg?.active_days   ?? [1,2,3,4,5];
    const proximo = calcProximoEnvio(p.status, p.whatsapp_enviado_at, followupDays, activeDays);
    return { ...p, proximo_envio: proximo?.toISOString() ?? null };
  });

  // Ordena por proximo_envio asc (nulls no final)
  if (mode === "pending") {
    prospects.sort((a, b) => {
      if (!a.proximo_envio && !b.proximo_envio) return 0;
      if (!a.proximo_envio) return 1;
      if (!b.proximo_envio) return -1;
      return new Date(a.proximo_envio).getTime() - new Date(b.proximo_envio).getTime();
    });
  }

  const total    = prospects.length;
  const offset   = (page - 1) * limit;
  const paginated = prospects.slice(offset, offset + limit);

  return NextResponse.json({
    stats: {
      fila:                filaRes.count     ?? 0,
      enviados_hoje:       hojeRes.count      ?? 0,
      aguardando_followup: followupRes.count  ?? 0,
      responderam:         responderamRes.count ?? 0,
    },
    prospects: paginated,
    total,
    configs,
  });
}
