import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST() {
  const supabase = createAdminClient();

  // Get all active clients with monthly_value > 0
  const { data: clients, error: clientErr } = await supabase
    .from("clients")
    .select("id, name, monthly_value, start_date")
    .eq("status", "active")
    .gt("monthly_value", 0);

  if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 });
  if (!clients?.length) return NextResponse.json({ created: 0, skipped: 0 });

  // Current month string: YYYY-MM
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Get existing payments for this month to avoid duplicates
  const { data: existing } = await supabase
    .from("payments")
    .select("client_id")
    .gte("due_date", `${currentMonth}-01`)
    .lte("due_date", `${currentMonth}-31`);

  const alreadyHas = new Set((existing ?? []).map((p) => p.client_id));

  // Default due day = 10 of current month
  const dueDay = 10;
  const dueDate = `${currentMonth}-${String(dueDay).padStart(2, "0")}`;

  const toInsert = (clients ?? [])
    .filter((c) => !alreadyHas.has(c.id))
    .map((c) => ({
      client_id: c.id,
      amount: c.monthly_value,
      due_date: dueDate,
      notes: `Mensalidade ${currentMonth.replace("-", "/")}`,
    }));

  if (toInsert.length === 0) {
    return NextResponse.json({ created: 0, skipped: clients.length });
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("payments")
    .insert(toInsert)
    .select("*, client:clients(id, name)");

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json({
    created: inserted?.length ?? 0,
    skipped: alreadyHas.size,
    payments: inserted,
  });
}
