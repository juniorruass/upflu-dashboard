import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createDocument } from "@/lib/autentique";
import { generateProposalPdf, generateContractPdf } from "@/lib/generate-proposal-pdf";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: proposal, error: fetchErr } = await supabase
    .from("proposals")
    .select("*, client:clients(id, name, contact_email)")
    .eq("id", id)
    .single();

  if (fetchErr || !proposal) return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
  if (proposal.status === "signed") return NextResponse.json({ error: "Documento já assinado" }, { status: 400 });

  const signerName  = proposal.signer_name  || proposal.client?.name  || "Cliente";
  const signerEmail = proposal.signer_email || proposal.client?.contact_email;

  if (!signerEmail) return NextResponse.json({ error: "Email do destinatário não informado" }, { status: 400 });

  let pdfBuffer: Buffer;

  if (proposal.type === "contract") {
    // Load template
    const { data: tmpl } = await supabase
      .from("contract_templates")
      .select("content")
      .eq("is_default", true)
      .single();

    if (!tmpl?.content) return NextResponse.json({ error: "Template de contrato não encontrado. Configure em Propostas → Template." }, { status: 400 });

    pdfBuffer = await generateContractPdf({
      title:           proposal.title,
      signerName,
      signerEmail,
      clientName:      proposal.client?.name ?? signerName,
      services:        proposal.services ?? [],
      totalValue:      Number(proposal.total_value) || 0,
      paymentDay:      proposal.payment_day ?? 5,
      contractStart:   proposal.contract_start ?? new Date().toISOString().split("T")[0],
      durationMonths:  proposal.duration_months ?? 12,
      templateContent: tmpl.content,
    });
  } else {
    pdfBuffer = await generateProposalPdf({
      title:       proposal.title,
      clientName:  signerName,
      clientEmail: signerEmail,
      services:    proposal.services ?? [],
      totalValue:  Number(proposal.total_value) || 0,
      validUntil:  proposal.valid_until ?? new Date().toISOString().split("T")[0],
      description: proposal.description ?? undefined,
    });
  }

  const doc = await createDocument({
    title:       proposal.title,
    pdfBuffer,
    signerName,
    signerEmail,
    message:     proposal.type === "contract"
      ? `Olá ${signerName}, seu contrato com a UPFLU está pronto para assinatura.`
      : `Olá ${signerName}, segue proposta da UPFLU para sua análise.`,
  });

  const shortLink = doc.signatures[0]?.link?.short_link ?? null;

  const { data: updated, error: updateErr } = await supabase
    .from("proposals")
    .update({
      status:                 "sent",
      autentique_document_id: doc.id,
      autentique_short_link:  shortLink,
      updated_at:             new Date().toISOString(),
    })
    .eq("id", id)
    .select("*, client:clients(id, name)")
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  return NextResponse.json(updated);
}
