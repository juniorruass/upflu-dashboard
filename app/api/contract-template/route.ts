import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("contract_templates")
    .select("*")
    .eq("is_default", true)
    .single();

  if (error || !data) return NextResponse.json({ content: "" });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const { content, name } = await req.json();
  const supabase = createAdminClient();

  // Upsert default template
  const { data: existing } = await supabase
    .from("contract_templates")
    .select("id")
    .eq("is_default", true)
    .single();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("contract_templates")
      .update({ content, name: name ?? "Padrão", updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from("contract_templates")
    .insert({ content, name: name ?? "Padrão", is_default: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
