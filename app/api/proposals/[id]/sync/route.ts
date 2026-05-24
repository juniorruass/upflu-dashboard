import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getDocument } from "@/lib/autentique";

type Ctx = { params: Promise<{ id: string }> };

// Checks Autentique if the proposal was signed and updates status
export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("autentique_document_id, status")
    .eq("id", id)
    .single();

  if (error || !proposal) return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
  if (!proposal.autentique_document_id) return NextResponse.json({ error: "Proposta não enviada ainda" }, { status: 400 });
  if (proposal.status === "signed") return NextResponse.json({ signed: true });

  const doc = await getDocument(proposal.autentique_document_id);
  if (!doc) return NextResponse.json({ error: "Erro ao consultar Autentique" }, { status: 500 });

  const allSigned = doc.signatures.every(s => s.signed);

  if (allSigned) {
    const signedAt = doc.signatures[0]?.signed_at ?? new Date().toISOString();
    await supabase
      .from("proposals")
      .update({ status: "signed", signed_at: signedAt, updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ signed: true, signed_at: signedAt });
  }

  return NextResponse.json({ signed: false });
}
