import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const TODO_COLUNAS = ["potencial", "prospectado"];
const DOING_COLUNAS = ["reuniao", "proposta", "onboarding"];
const DONE_COLUNAS = ["fechado", "ativo"];

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.ADM_API_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const in30 = new Date(now);
  in30.setDate(in30.getDate() + 30);
  const limit = in30.toISOString().split("T")[0];

  const [{ data: clients, error: clientsErr }, { data: cards, error: cardsErr }] = await Promise.all([
    supabase.from("clients").select("status, monthly_value, start_date"),
    supabase.from("kanban_cards").select("coluna"),
  ]);

  if (clientsErr) return NextResponse.json({ error: clientsErr.message }, { status: 500 });
  if (cardsErr) return NextResponse.json({ error: cardsErr.message }, { status: 500 });

  const activeClients = (clients ?? []).filter((c) => c.status === "active");
  const mrr = activeClients.reduce((sum, c) => sum + (c.monthly_value || 0), 0);
  const onboarding = (clients ?? []).filter((c) => c.status === "onboarding").length;

  const renewals_30d = activeClients.filter((c) => {
    if (!c.start_date) return false;
    const renewal = new Date(c.start_date);
    renewal.setFullYear(renewal.getFullYear() + 1);
    const renewalStr = renewal.toISOString().split("T")[0];
    return renewalStr >= today && renewalStr <= limit;
  }).length;

  const kanban = { todo: 0, doing: 0, done: 0 };
  for (const card of cards ?? []) {
    if (TODO_COLUNAS.includes(card.coluna)) kanban.todo++;
    else if (DOING_COLUNAS.includes(card.coluna)) kanban.doing++;
    else if (DONE_COLUNAS.includes(card.coluna)) kanban.done++;
  }

  return NextResponse.json({
    mrr,
    arr: mrr * 12,
    active_clients: activeClients.length,
    onboarding,
    renewals_30d,
    kanban,
  });
}
