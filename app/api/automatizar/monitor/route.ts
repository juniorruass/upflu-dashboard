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

// Retorna todos os próximos horários de execução do cron em UTC
function getCronRuns(activeDays: number[], maxRuns = 20): Date[] {
  const diasSet = new Set(activeDays.length ? activeDays : [1, 2, 3, 4, 5]);
  const nowBrt  = toBRT(new Date());
  const runs: Date[] = [];

  for (let d = 0; d <= 60 && runs.length < maxRuns; d++) {
    const dayBrt = new Date(nowBrt);
    dayBrt.setUTCDate(nowBrt.getUTCDate() + d);
    dayBrt.setUTCHours(0, 0, 0, 0);

    if (!diasSet.has(dayBrt.getUTCDay())) continue;

    const startHourBrt = d === 0 ? nowBrt.getUTCHours() : -1;
    for (const h of CRON_BRT_HOURS) {
      if (h <= startHourBrt) continue;
      const run = new Date(dayBrt);
      run.setUTCHours(h - BRT_OFFSET, 0, 0, 0);
      runs.push(run);
    }
  }
  return runs;
}

// Para follow-up: primeiro cron run após a data de vencimento
function primeiroCronApos(dueBrt: Date, activeDays: number[]): Date | null {
  const diasSet = new Set(activeDays.length ? activeDays : [1, 2, 3, 4, 5]);
  for (let d = 0; d <= 60; d++) {
    const dayBrt = new Date(dueBrt);
    dayBrt.setUTCDate(dueBrt.getUTCDate() + d);
    dayBrt.setUTCHours(0, 0, 0, 0);
    if (!diasSet.has(dayBrt.getUTCDay())) continue;
    const startHourBrt = d === 0 ? dueBrt.getUTCHours() : -1;
    const hoursAvail = CRON_BRT_HOURS.filter(h => h > startHourBrt);
    if (!hoursAvail.length) continue;
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

  // Config principal para calcular timing
  const cfg        = configs[0];
  const activeDays = cfg?.active_days        ?? [1,2,3,4,5];
  const avgDelaySec= ((cfg?.min_delay_seconds ?? 120) + (cfg?.max_delay_seconds ?? 300)) / 2;
  const followupDays = cfg?.followup_days    ?? 3;
  const SESSION_MAX  = 20; // msgs por execução do cron
  const cronRuns   = getCronRuns(activeDays, 100);

  // Busca prospects
  let query = supabase
    .from("prospects")
    .select("id, nome, telefone, cidade, tipo, status, whatsapp_enviado, whatsapp_enviado_at, followup_enviado, followup_enviado_at, created_at");

  if (mode === "pending") {
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
  const raw = rawProspects ?? [];

  // Distribui horários: novo = fila principal, followup = após vencimento
  const novoList     = raw.filter(p => p.status === "novo");
  const followupList = raw.filter(p => p.status === "contatado" || p.status === "followup");
  const outrosList   = raw.filter(p => p.status !== "novo" && p.status !== "contatado" && p.status !== "followup");

  const withTiming = (p: typeof raw[0], idx: number, baseRun: Date | null) => {
    if (!baseRun) return { ...p, proximo_envio: null };
    const runIdx   = Math.floor(idx / SESSION_MAX);
    const posInRun = idx % SESSION_MAX;
    const run      = cronRuns[runIdx] ?? baseRun;
    const ms       = posInRun * avgDelaySec * 1000;
    return { ...p, proximo_envio: new Date(run.getTime() + ms).toISOString() };
  };

  const prospects = [
    ...novoList.map((p, idx) => withTiming(p, idx, cronRuns[0] ?? null)),
    ...followupList.map((p, idx) => {
      let base = cronRuns[0] ?? null;
      if (p.whatsapp_enviado_at) {
        const dueBrt = toBRT(new Date(new Date(p.whatsapp_enviado_at).getTime() + followupDays * 86400000));
        base = primeiroCronApos(dueBrt, activeDays) ?? base;
      }
      return withTiming(p, idx, base);
    }),
    ...outrosList.map(p => ({ ...p, proximo_envio: null })),
  ];

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
