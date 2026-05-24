import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("proposals")
    .select("*, client:clients(id, name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = createAdminClient();

  if (!body.title?.trim()) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      client_id:       body.client_id       || null,
      type:            body.type            || "proposal",
      title:           body.title.trim(),
      description:     body.description     || null,
      services:        body.services        ?? [],
      total_value:     Number(body.total_value) || 0,
      valid_until:     body.valid_until      || null,
      signer_name:     body.signer_name     || null,
      signer_email:    body.signer_email    || null,
      payment_day:     body.payment_day     ? Number(body.payment_day)     : null,
      contract_start:  body.contract_start  || null,
      duration_months: body.duration_months ? Number(body.duration_months) : null,
      status:          "draft",
    })
    .select("*, client:clients(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
