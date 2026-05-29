import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const cidade = searchParams.get("cidade");
  const tipo   = searchParams.get("tipo");
  const busca  = searchParams.get("busca");
  const cnae   = searchParams.get("cnae");

  const supabase = createAdminClient();
  let query = supabase.from("prospects").select("*").order("created_at", { ascending: false });

  if (status && status !== "todos") query = query.eq("status", status);
  if (cidade && cidade !== "todas") query = query.eq("cidade", cidade);
  if (tipo   && tipo   !== "todos") query = query.eq("tipo", tipo);
  if (busca)                        query = query.ilike("nome", `%${busca}%`);
  if (cnae)                         query = query.eq("cnae", cnae);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ prospects: data });
}
