import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  const supabase = createAdminClient();

  const patch: Record<string, unknown> = {};
  if ("paid_date" in body) patch.paid_date = body.paid_date || null;
  if ("amount" in body) patch.amount = Number(body.amount);
  if ("due_date" in body) patch.due_date = body.due_date;
  if ("notes" in body) patch.notes = body.notes || null;

  const { data, error } = await supabase
    .from("payments")
    .update(patch)
    .eq("id", id)
    .select("*, client:clients(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
