import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { evolutionSend } from "@/lib/evolution-api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function normalize(tel: string) {
  const d = tel.replace(/\D/g, "");
  return d.startsWith("55") ? d : `55${d}`;
}

function render(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  // Busca todos os steps ativos agrupados por sequência
  const { data: allSteps } = await supabase
    .from("followup_steps")
    .select("*")
    .eq("active", true)
    .order("step_order");

  if (!allSteps?.length) return NextResponse.json({ ok: true, enviados: 0, message: "Nenhum step configurado" });

  // Prospects que receberam o contato inicial e não completaram a sequência
  const { data: candidates } = await supabase
    .from("prospects")
    .select("id, nome, telefone, cidade, tipo, whatsapp_enviado_at")
    .eq("whatsapp_enviado", true)
    .eq("status", "followup")
    .not("telefone", "is", null)
    .limit(50);

  if (!candidates?.length) return NextResponse.json({ ok: true, enviados: 0 });

  // Busca progresso existente
  const candidateIds = candidates.map((c) => c.id);
  const { data: progressData } = await supabase
    .from("followup_progress")
    .select("*")
    .in("prospect_id", candidateIds);

  const progressMap = new Map((progressData ?? []).map((p) => [p.prospect_id, p]));

  let enviados = 0;

  for (const prospect of candidates) {
    if (!prospect.telefone) continue;

    const progress = progressMap.get(prospect.id);
    const currentStep = progress?.current_step ?? 0;
    if (progress?.completed) continue;

    // Próximo step disponível
    const nextStep = allSteps.find((s) => s.step_order === currentStep + 1);
    if (!nextStep) continue;

    // Verifica se já passou o day_offset desde o contato inicial
    const sentAt = new Date(prospect.whatsapp_enviado_at ?? prospect.created_at);
    const daysSince = Math.floor((now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince < nextStep.day_offset) continue;

    // Verifica se já enviou esse step recentemente (evita duplicar)
    if (progress?.last_sent_at) {
      const lastSent = new Date(progress.last_sent_at);
      const hoursSince = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 20) continue;
    }

    const message = render(nextStep.message, {
      nome: prospect.nome ?? "", nome_empresa: prospect.nome ?? "",
      cidade: prospect.cidade ?? "", ramo: prospect.tipo ?? "",
    });

    if (enviados > 0) await sleep(3000 + Math.random() * 5000);

    const ok = await evolutionSend(normalize(prospect.telefone), message);
    if (ok) {
      // Upsert progress
      if (progress) {
        await supabase.from("followup_progress").update({
          current_step: nextStep.step_order,
          last_sent_at: now.toISOString(),
          completed: !allSteps.find((s) => s.step_order === nextStep.step_order + 1),
        }).eq("id", progress.id);
      } else {
        await supabase.from("followup_progress").insert({
          prospect_id: prospect.id,
          sequence_name: nextStep.sequence_name,
          current_step: nextStep.step_order,
          last_sent_at: now.toISOString(),
        });
      }
      enviados++;
    }
  }

  return NextResponse.json({ ok: true, enviados });
}
