import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("clients")
    .select(`*, services:client_services(*), metrics:client_metrics(* ), notes:client_notes(*)`)
    .eq("id", id)
    .order("month", { referencedTable: "client_metrics", ascending: true })
    .order("created_at", { referencedTable: "client_notes", ascending: false })
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  const supabase = createAdminClient();

  const allowed = ["name","segment","contact_name","contact_phone","contact_email","status","monthly_value","start_date","appointment_date","appointment_time","captado_via","portal_password"];
  const patch = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

  // Convert empty strings to null for date/time fields
  for (const field of ["start_date", "appointment_date", "appointment_time"]) {
    if (patch[field] === "") patch[field] = null;
  }

  const { data, error } = await supabase
    .from("clients").update(patch).eq("id", id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
