import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("client_metrics")
    .select("*")
    .eq("client_id", id)
    .order("month", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("client_metrics")
    .upsert({
      client_id: id,
      month: body.month,
      leads: body.leads ?? null,
      conversions: body.conversions ?? null,
      revenue: body.revenue ?? null,
      ad_spend: body.ad_spend ?? null,
    }, { onConflict: "client_id,month" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
