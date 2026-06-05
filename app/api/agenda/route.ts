import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { evolutionSend, evolutionInstances } from "@/lib/evolution-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agenda_events")
    .select("*, clients(id, name, contact_phone, contact_email)")
    .order("starts_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data });
}

async function resolveInstance(preferred?: string): Promise<string> {
  if (preferred) return preferred;
  const env = process.env.EVOLUTION_INSTANCE;
  if (env) return env;
  const all = await evolutionInstances();
  return all.find((i) => i.connectionStatus === "open")?.name ?? "";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    title, description, client_id, starts_at, ends_at,
    notify_admin_whatsapp, notify_admin_email,
    notify_client_whatsapp, notify_client_email,
    notify_instance, notify_admin_phone,
  } = body;

  if (!title || !starts_at) {
    return NextResponse.json({ error: "Campos obrigatórios: title, starts_at" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // tenta inserir com as colunas novas, faz fallback sem elas se não existirem
  const baseInsert = {
    title,
    description: description ?? null,
    client_id: client_id ?? null,
    starts_at,
    ends_at: ends_at ?? null,
    notify_admin_whatsapp: notify_admin_whatsapp ?? true,
    notify_admin_email: notify_admin_email ?? false,
    notify_client_whatsapp: notify_client_whatsapp ?? false,
    notify_client_email: notify_client_email ?? false,
    status: "pending",
  };

  let result = await supabase
    .from("agenda_events")
    .insert({ ...baseInsert, notify_instance: notify_instance ?? null, notify_admin_phone: notify_admin_phone ?? null })
    .select("*, clients(id, name, contact_phone, contact_email)")
    .single();

  // fallback sem as colunas novas (migration ainda não rodada)
  if (result.error?.message?.includes("column")) {
    result = await supabase
      .from("agenda_events")
      .insert(baseInsert)
      .select("*, clients(id, name, contact_phone, contact_email)")
      .single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });

  // notificação imediata — usa valores do body + dados do cliente retornados pelo insert
  const notifyLog: Record<string, unknown> = {};
  const instance  = await resolveInstance(notify_instance as string);
  const startsAt  = new Date(starts_at as string).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  notifyLog.instance = instance || "(não encontrado)";

  function normalize(phone: string) {
    const d = phone.replace(/\D/g, "");
    return d.startsWith("55") ? d : `55${d}`;
  }

  // Admin
  if (notify_admin_whatsapp) {
    const adminPhone = (notify_admin_phone as string) || process.env.ADMIN_PHONE || "";
    notifyLog.adminPhone = adminPhone || "(não configurado)";
    if (adminPhone && instance) {
      const msg = `✅ *Evento agendado*\n\n*${title}*\n${description ? `${description}\n` : ""}🕐 ${startsAt}\n\nVocê receberá um lembrete 30 minutos antes.`;
      const ok = await evolutionSend(normalize(adminPhone), msg, instance);
      notifyLog.adminSent = ok;
      if (!ok) notifyLog.adminReason = "Evolution API retornou erro";
    } else {
      notifyLog.adminSent = false;
      notifyLog.adminReason = !adminPhone ? "telefone não configurado" : "instância não encontrada";
    }
  }

  // Cliente
  if (notify_client_whatsapp) {
    const clientData = result.data?.clients as { contact_phone?: string; name?: string } | null;
    const clientPhone = clientData?.contact_phone || "";
    notifyLog.clientPhone = clientPhone || "(não cadastrado no perfil do cliente)";
    if (clientPhone && instance) {
      const msg = `📅 *Compromisso agendado*\n\n*${title}*\n${description ? `${description}\n` : ""}🕐 ${startsAt}`;
      const ok = await evolutionSend(normalize(clientPhone), msg, instance);
      notifyLog.clientSent = ok;
      if (!ok) notifyLog.clientReason = "Evolution API retornou erro";
    } else {
      notifyLog.clientSent = false;
      notifyLog.clientReason = !clientPhone
        ? "cliente sem telefone cadastrado — vá em Clientes e preencha o campo Telefone"
        : "instância não encontrada";
    }
  }

  return NextResponse.json({ event: result.data, notifyLog });
}
