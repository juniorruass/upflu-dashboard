import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { normalizePhone } from "@/lib/blacklist";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("blacklist")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ blacklist: data });
}

export async function POST(req: NextRequest) {
  const { phone, reason } = await req.json();
  if (!phone) return NextResponse.json({ error: "Telefone obrigatório" }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("blacklist")
    .insert({ phone: normalizePhone(phone), reason: reason ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}
