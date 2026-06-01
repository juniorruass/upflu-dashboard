import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase";

export const maxDuration = 60;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function criarHTML(corpo: string): string {
  const html = corpo.replace(/\n/g, "<br/>");
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body { margin: 0; padding: 0; background: #f0f0f0; font-family: Arial, sans-serif; }
  .wrap { max-width: 520px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0; }
  .top { background: #00CFFF; padding: 22px 36px; }
  .logo { color: #000; font-size: 13px; font-weight: 700; letter-spacing: 0.15em; margin: 0; }
  .body { padding: 32px 36px; font-size: 14px; color: #444; line-height: 1.75; }
  .footer { padding: 16px 36px; background: #f9f9f9; border-top: 1px solid #e8e8e8; text-align: center; font-size: 12px; color: #aaa; }
</style>
</head>
<body>
<div class="wrap">
  <div class="top"><p class="logo">UPFLU</p></div>
  <div class="body">${html}</div>
  <div class="footer">Upflu · upflu.digital · Crescimento digital para negócios</div>
</div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const { prospectIds, assunto, corpo, template } = await req.json();

  if (!prospectIds?.length) {
    return NextResponse.json({ error: "Nenhum prospect selecionado." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("id, nome, email, mensagem")
    .in("id", prospectIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const comEmail = (prospects || []).filter((p) => p.email);
  const results: { id: string; nome: string; email: string; ok: boolean }[] = [];
  const logs: Record<string, unknown>[] = [];

  for (const p of comEmail) {
    const assuntoFinal = assunto.replace(/\{nome\}/g, p.nome);
    const corpoFinal = corpo
      .replace(/\{nome\}/g, p.nome)
      .replace(/\{mensagem\}/g, p.mensagem || "");

    try {
      await transporter.sendMail({
        from: `Upflu <${process.env.GMAIL_USER}>`,
        to: p.email,
        subject: assuntoFinal,
        text: corpoFinal,
        html: criarHTML(corpoFinal),
      });
      results.push({ id: p.id, nome: p.nome, email: p.email, ok: true });
      logs.push({ prospect_id: p.id, nome: p.nome, email: p.email, assunto: assuntoFinal, template, status: "enviado" });
    } catch {
      results.push({ id: p.id, nome: p.nome, email: p.email, ok: false });
      logs.push({ prospect_id: p.id, nome: p.nome, email: p.email, assunto: assuntoFinal, template, status: "falhou" });
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  if (logs.length > 0) {
    await supabase.from("email_logs").insert(logs);
  }

  const sent = results.filter((r) => r.ok).length;
  return NextResponse.json({ sent, failed: results.length - sent, total: comEmail.length, results });
}
