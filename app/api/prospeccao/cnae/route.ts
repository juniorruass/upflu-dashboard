import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const maxDuration = 30;

const BRASILIO_URL = "https://brasil.io/api/dataset/socios-brasil/empresas/data/";

// Remove BOM e espaços que o PowerShell pode adicionar nas env vars
function limparToken(t: string | undefined): string {
  return (t || "").replace(/^﻿/, "").trim();
}

function normalizarMunicipio(nome: string): string {
  return nome
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function formatarCNPJ(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function gerarMensagem(nome: string, cidade: string): string {
  const nomeFmt =
    nome.length > 50
      ? nome.substring(0, 50).trim() + "..."
      : nome.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return `Olá! Vi que a ${nomeFmt} atua em ${cidade} e queria apresentar algo que pode impactar diretamente o crescimento digital do negócio.\n\nA Upflu oferece um diagnóstico digital gratuito de 2 minutos, sem compromisso. Posso enviar o link?\n\nUpflu | upflu.digital`;
}

export async function POST(req: NextRequest) {
  try {
    const { cnae, municipio, uf, tipoProspect } = await req.json();

    const token = limparToken(process.env.BRASILIO_TOKEN);
    if (!token) {
      return NextResponse.json(
        { error: "BRASILIO_TOKEN não configurada. Adicione nas variáveis de ambiente da Vercel." },
        { status: 500 }
      );
    }

    if (!cnae || !municipio) {
      return NextResponse.json({ error: "CNAE e município são obrigatórios." }, { status: 400 });
    }

    const cnaeLimpo = cnae.replace(/\D/g, "");
    const municipioNorm = normalizarMunicipio(municipio);

    const params = new URLSearchParams({
      cnae_fiscal: cnaeLimpo,
      municipio: municipioNorm,
      situacao_cadastral: "ATIVA",
      page_size: "100",
    });
    if (uf) params.set("uf", uf.toUpperCase());

    const res = await fetch(`${BRASILIO_URL}?${params}`, {
      headers: { Authorization: `Token ${token}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json(
        { error: `Brasil.io retornou ${res.status}: ${txt.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const empresas: Record<string, string>[] = data.results || [];

    // Dedup por CNPJ contra prospects existentes
    const supabase = createAdminClient();
    const { data: existentes } = await supabase
      .from("prospects")
      .select("cnpj")
      .not("cnpj", "is", null);
    const cnpjsExistentes = new Set(
      (existentes || []).map((r: { cnpj: string }) => r.cnpj)
    );

    const novas = empresas.filter((e) => !cnpjsExistentes.has(e.cnpj));
    const cidadeDisplay = `${municipio.trim().split(",")[0]}, ${uf || ""}`.replace(/, $/, "");

    const resultados = novas.map((e) => ({
      cnpj: e.cnpj,
      cnpj_formatado: formatarCNPJ(e.cnpj),
      nome: e.nome_fantasia?.trim() || e.razao_social,
      razao_social: e.razao_social,
      cidade: cidadeDisplay,
      uf: e.uf || uf,
      situacao_cadastral: "ATIVA",
      cnae,
      tipo: tipoProspect || "empresa",
      telefone: e.ddd_telefone_1 ? `(${e.ddd_telefone_1}) ${e.telefone_1}` : "",
      email: e.email?.toLowerCase().trim() || "",
      mensagem: gerarMensagem(
        e.nome_fantasia?.trim() || e.razao_social,
        municipio.trim().split(",")[0].trim()
      ),
    }));

    // Auto-salvar todos no CRM
    if (resultados.length > 0) {
      const toInsert = resultados.map((r) => ({
        place_id: `cnpj:${r.cnpj}`,
        nome: r.nome,
        tipo: r.tipo,
        cidade: r.cidade,
        telefone: r.telefone,
        website: "",
        email: r.email,
        mensagem: r.mensagem,
        status: "potencial",
        email_enviado: false,
        cnpj: r.cnpj,
        cnae: r.cnae,
        situacao_cadastral: "ATIVA",
      }));
      const { error: insertError } = await supabase.from("prospects").insert(toInsert);
      if (insertError) console.error("Auto-save CRM error:", insertError);
    }

    return NextResponse.json({
      empresas: resultados,
      total: resultados.length,
      total_existentes: empresas.length - novas.length,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
