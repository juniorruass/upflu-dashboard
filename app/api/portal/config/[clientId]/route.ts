import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ clientId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { clientId } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("clients")
    .select("portal_metrics")
    .eq("id", clientId)
    .single();

  if (error || !data) return NextResponse.json({ portal_metrics: null });
  return NextResponse.json({ portal_metrics: data.portal_metrics ?? null });
}
