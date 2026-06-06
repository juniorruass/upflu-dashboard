import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("followup_steps")
    .select("*")
    .order("sequence_name")
    .order("step_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ steps: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sequence_name, step_order, day_offset, message } = body;
  if (!message || !day_offset) return NextResponse.json({ error: "message e day_offset obrigatórios" }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("followup_steps")
    .insert({ sequence_name: sequence_name ?? "Padrão", step_order: step_order ?? 1, day_offset, message })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ step: data });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const supabase = createAdminClient();
  const { error } = await supabase.from("followup_steps").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
