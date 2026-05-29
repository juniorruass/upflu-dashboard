import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("due_date", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.title?.trim()) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
  if (!body.amount || isNaN(Number(body.amount))) return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  if (!body.due_date) return NextResponse.json({ error: "Vencimento obrigatório" }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      title: body.title.trim(),
      amount: Number(body.amount),
      due_date: body.due_date,
      paid_date: body.paid_date || null,
      type: body.type ?? "expense",
      category: body.category || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
