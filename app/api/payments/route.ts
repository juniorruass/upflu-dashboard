import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("payments")
    .select("*, client:clients(id, name)")
    .order("due_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = createAdminClient();

  if (!body.client_id) return NextResponse.json({ error: "client_id obrigatório" }, { status: 400 });
  if (!body.amount || isNaN(Number(body.amount))) return NextResponse.json({ error: "amount inválido" }, { status: 400 });
  if (!body.due_date) return NextResponse.json({ error: "due_date obrigatório" }, { status: 400 });

  const { data, error } = await supabase
    .from("payments")
    .insert({
      client_id: body.client_id,
      amount: Number(body.amount),
      due_date: body.due_date,
      paid_date: body.paid_date || null,
      notes: body.notes || null,
    })
    .select("*, client:clients(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
