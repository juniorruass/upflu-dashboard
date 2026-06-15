import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createAdminClient();

  if (body.cnpj) {
    const { data: existente } = await supabase
      .from("prospects")
      .select("id")
      .eq("cnpj", body.cnpj)
      .limit(1);
    if (existente && existente.length > 0) {
      return NextResponse.json({ error: "Empresa já está no CRM." }, { status: 409 });
    }
  }

  const prospect = {
    place_id: body.cnpj ? `cnpj:${body.cnpj}` : `manual:${Date.now()}`,
    nome: body.nome,
    tipo: body.tipo || "empresa",
    cidade: body.cidade || "",
    telefone: body.telefone || "",
    website: "",
    email: body.email || "",
    mensagem: body.mensagem || "",
    status: "novo",
    email_enviado: false,
    cnpj: body.cnpj || null,
    cnae: body.cnae || null,
    cnae_descricao: body.cnae_descricao || null,
    situacao_cadastral: body.situacao_cadastral || "ATIVA",
  };

  const { data, error } = await supabase
    .from("prospects")
    .insert(prospect)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prospect: data });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const cidade = searchParams.get("cidade");
  const tipo   = searchParams.get("tipo");
  const busca  = searchParams.get("busca");
  const cnae   = searchParams.get("cnae");
  const fonte  = searchParams.get("fonte"); // "cnae" | "maps"

  const supabase = createAdminClient();
  let query = supabase.from("prospects").select("*")
    .order("contatado_em", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (status && status !== "todos") query = query.eq("status", status);
  if (cidade && cidade !== "todas") query = query.eq("cidade", cidade);
  if (tipo   && tipo   !== "todos") query = query.eq("tipo", tipo);
  if (busca)                        query = query.ilike("nome", `%${busca}%`);
  if (cnae)                         query = query.eq("cnae", cnae);
  if (fonte === "cnae")             query = query.not("cnpj", "is", null);
  if (fonte === "maps")             query = query.is("cnpj", null);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ prospects: data });
}
