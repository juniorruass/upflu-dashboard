import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("clients")
    .select("*, services:client_services(*)")
    .order("created_at", { ascending: false });

  if (!error) return NextResponse.json(data ?? []);

  // Fallback without join
  const { data: data2, error: error2 } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error2) return NextResponse.json({ error: error2.message }, { status: 500 });
  return NextResponse.json(data2 ?? []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = createAdminClient();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nome obrigatorio" }, { status: 400 });
  }

  const base = {
    name: body.name.trim(),
    segment: body.segment || "Outro",
    contact_name: body.contact_name || null,
    contact_phone: body.contact_phone || null,
    contact_email: body.contact_email || null,
    status: body.status || "onboarding",
    monthly_value: Number(body.monthly_value) || 0,
    start_date: body.start_date || null,
  };

  // Try full insert (includes optional columns added via migration)
  const full = {
    ...base,
    appointment_date: body.appointment_date || null,
    appointment_time: body.appointment_time || null,
    captado_via: body.captado_via || null,
  };

  let { data, error } = await supabase
    .from("clients")
    .insert(full)
    .select()
    .single();

  // Fallback: if optional columns don't exist yet, insert without them
  if (error && (error.message.includes("column") || error.message.includes("schema"))) {
    const result = await supabase
      .from("clients")
      .insert(base)
      .select()
      .single();
    data = result.data;
    error = result.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Erro ao criar cliente - nenhum dado retornado" }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
