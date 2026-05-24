import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("proposals")
    .select("*, client:clients(id, name)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  const supabase = createAdminClient();

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fields = ["title", "description", "services", "total_value", "valid_until", "status", "signer_name", "signer_email", "client_id"];
  for (const f of fields) {
    if (f in body) patch[f] = body[f] === "" ? null : body[f];
  }

  const { data, error } = await supabase
    .from("proposals")
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

  const { error } = await supabase.from("proposals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
