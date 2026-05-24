import { createAdminClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Client } from "@/types";
import ClientDetail from "@/components/clients/client-detail";
import Header from "@/components/header";

async function getClient(id: string): Promise<Client | null> {
  const supabase = createAdminClient();

  // Full query with all joins
  const { data, error } = await supabase
    .from("clients")
    .select(`*, services:client_services(*), metrics:client_metrics(*), notes:client_notes(*)`)
    .eq("id", id)
    .order("month", { referencedTable: "client_metrics", ascending: true })
    .order("created_at", { referencedTable: "client_notes", ascending: false })
    .single();

  if (!error && data) return data as Client;

  // Fallback: query without joins if FK relationships not configured
  console.error("[getClient] join error, falling back:", error?.message);
  const { data: data2, error: error2 } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error2 || !data2) return null;
  return { ...data2, services: [], metrics: [], notes: [] } as Client;
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  return (
    <>
      <Header title={client.name} />
      <ClientDetail initialClient={client} />
    </>
  );
}
