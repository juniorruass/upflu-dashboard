import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const { clinics } = await req.json();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const results: { nome: string; email: string; ok: boolean }[] = [];

  for (const clinic of clinics) {
    if (!clinic.email) continue;

    try {
      await transporter.sendMail({
        from: `Upflu <${process.env.GMAIL_USER}>`,
        to: clinic.email,
        subject: `Diagnóstico Digital Gratuito — ${clinic.nome}`,
        text: clinic.mensagem,
      });
      results.push({ nome: clinic.nome, email: clinic.email, ok: true });
    } catch {
      results.push({ nome: clinic.nome, email: clinic.email, ok: false });
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  const sent = results.filter((r) => r.ok).length;
  return NextResponse.json({ sent, failed: results.length - sent, results });
}
