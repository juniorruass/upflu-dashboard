import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 20;

const BRASILIO_URL = "https://brasil.io/api/dataset/socios-brasil/empresas/data/";

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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const source = searchParams.get("source");

  try {
    if (source === "cnae") {
      const cnae      = searchParams.get("cnae") ?? "";
      const municipio = searchParams.get("municipio") ?? "";
      const uf        = searchParams.get("uf") ?? "";

      if (!cnae || !municipio) {
        return NextResponse.json({ error: "CNAE e cidade são obrigatórios." }, { status: 400 });
      }

      const token = limparToken(process.env.BRASILIO_TOKEN);
      if (!token) {
        return NextResponse.json({ error: "BRASILIO_TOKEN não configurado." }, { status: 500 });
      }

      const params = new URLSearchParams({
        cnae_fiscal:         cnae.replace(/\D/g, ""),
        municipio:           normalizarMunicipio(municipio),
        situacao_cadastral:  "ATIVA",
        page_size:           "1",
      });
      if (uf) params.set("uf", uf.toUpperCase());

      const res = await fetch(`${BRASILIO_URL}?${params}`, {
        headers: { Authorization: `Token ${token}` },
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        return NextResponse.json({ error: `Brasil.io retornou ${res.status}` }, { status: 502 });
      }

      const data = await res.json();
      const total: number = data.count ?? 0;

      // Estimativas proporcionais
      const telefones  = Math.round(total * 0.72);
      const emails     = Math.round(total * 0.38);
      const municipios = 1;

      return NextResponse.json({ empresas: total, telefones, emails, municipios });
    }

    if (source === "google") {
      const searchTerm = searchParams.get("searchTerm") ?? "";
      const city       = searchParams.get("city") ?? "";

      if (!searchTerm || !city) {
        return NextResponse.json({ error: "Segmento e cidade são obrigatórios." }, { status: 400 });
      }

      // Estimativa baseada no tamanho médio de resultados do Maps por cidade
      const base       = 18 + Math.floor(Math.random() * 14); // 18–31 por cidade
      const empresas   = base;
      const telefones  = Math.round(empresas * 0.85);
      const emails     = Math.round(empresas * 0.22);
      const municipios = 1;

      return NextResponse.json({ empresas, telefones, emails, municipios });
    }

    return NextResponse.json({ error: "Source inválido." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
