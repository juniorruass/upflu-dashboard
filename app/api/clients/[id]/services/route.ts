import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { service } = await req.json();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("client_services")
    .upsert({ client_id: id, service }, { onConflict: "client_id,service" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { service } = await req.json();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("client_services")
    .delete()
    .eq("client_id", id)
    .eq("service", service);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
