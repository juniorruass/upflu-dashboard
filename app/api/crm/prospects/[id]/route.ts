import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prospects")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Quando status muda para "contatado", cria card no Kanban automaticamente
  if (body.status === "contatado" && data) {
    const { data: existing } = await supabase
      .from("kanban_cards")
      .select("id")
      .eq("prospect_id", params.id)
      .limit(1);

    if (!existing || existing.length === 0) {
      const { data: lastPos } = await supabase
        .from("kanban_cards")
        .select("posicao")
        .eq("coluna", "prospectado")
        .order("posicao", { ascending: false })
        .limit(1);

      const nextPos = lastPos && lastPos.length > 0 ? lastPos[0].posicao + 1 : 0;

      await supabase.from("kanban_cards").insert({
        coluna: "prospectado",
        posicao: nextPos,
        nome: data.nome,
        telefone: data.telefone || "",
        email: data.email || "",
        cidade: data.cidade || "",
        tipo: data.tipo || "",
        prospect_id: params.id,
      });
    }
  }

  return NextResponse.json({ prospect: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("prospects").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
