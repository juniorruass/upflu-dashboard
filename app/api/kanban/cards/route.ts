import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("kanban_cards")
    .select("*")
    .order("posicao", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cards: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("kanban_cards")
    .select("posicao")
    .eq("coluna", body.coluna || "prospectado")
    .order("posicao", { ascending: false })
    .limit(1);

  const nextPos = existing && existing.length > 0 ? existing[0].posicao + 1 : 0;

  const { data, error } = await supabase
    .from("kanban_cards")
    .insert({ ...body, posicao: nextPos })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ card: data });
}
