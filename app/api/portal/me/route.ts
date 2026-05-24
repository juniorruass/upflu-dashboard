import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const clientId = req.cookies.get("upflu-portal-session")?.value;
  if (!clientId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const supabase = createAdminClient();

  const clientRes = await supabase
    .from("clients")
    .select("id, name, contact_email, segment, monthly_value, start_date, services:client_services(service)")
    .eq("id", clientId)
    .single();

  if (clientRes.error || !clientRes.data) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const [proposalsRes, paymentsRes] = await Promise.all([
    supabase.from("proposals").select("id, title, type, status, total_value, created_at, valid_until, autentique_short_link").eq("client_id", clientId).order("created_at", { ascending: false }),
    supabase.from("payments").select("id, amount, due_date, paid_date, notes").eq("client_id", clientId).order("due_date", { ascending: false }),
  ]);

  return NextResponse.json({
    client: clientRes.data,
    proposals: proposalsRes.data ?? [],
    payments: paymentsRes.data ?? [],
  });
}
