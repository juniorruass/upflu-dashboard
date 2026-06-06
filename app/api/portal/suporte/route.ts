import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { cookies } from "next/headers";

async function getClientId(): Promise<string | null> {
  const cookieStore = cookies();
  const session = cookieStore.get("upflu-portal-session")?.value;
  if (!session) return null;
  const supabase = createAdminClient();
  const { data } = await supabase.from("clients").select("id").eq("portal_password", session).single();
  return data?.id ?? null;
}

export async function GET() {
  const clientId = await getClientId();
  if (!clientId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, title, description, status, priority, created_at, updated_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: data });
}

export async function POST(req: NextRequest) {
  const clientId = await getClientId();
  if (!clientId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { title, description, priority } = await req.json();
  if (!title) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({ client_id: clientId, title, description: description ?? null, priority: priority ?? "medium" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ticket: data });
}
