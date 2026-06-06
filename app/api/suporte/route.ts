import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*, clients(id, name)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { client_id, title, description, priority } = body;
  if (!title) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({ client_id: client_id ?? null, title, description: description ?? null, priority: priority ?? "medium" })
    .select("*, clients(id, name)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ticket: data });
}
