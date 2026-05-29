import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { notifyClient } from "@/lib/webpush";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("client_notes")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { content, author } = await req.json();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("client_notes")
    .insert({ client_id: id, content, author: author || "Junior" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notifica o cliente se a nota for marcada como importante ou novidade
  const lower = (content as string).toLowerCase();
  const isUpdate = lower.includes("[novidade]") || lower.includes("[update]");
  const isNote = lower.includes("[nota]") || lower.includes("[importante]");

  if (isUpdate || isNote) {
    const { data: client } = await supabase.from("clients").select("name, slug").eq("id", id).single();
    const slug = client?.slug ?? client?.name?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? id;
    await notifyClient(id, {
      title: isUpdate ? "🚀 Novidade no seu projeto" : "📌 Mensagem da equipe",
      body: (content as string).replace(/\[(novidade|update|nota|importante)\]/gi, "").trim().slice(0, 100),
      url: `/${slug}`,
      tag: isUpdate ? "service-update" : "team-note",
    }).catch(() => {});
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get("noteId");
  if (!noteId) return NextResponse.json({ error: "noteId required" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("client_notes")
    .delete()
    .eq("id", noteId)
    .eq("client_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
