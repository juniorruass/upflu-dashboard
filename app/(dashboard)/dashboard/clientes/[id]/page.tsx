import { createAdminClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Client } from "@/types";
import ClientDetail from "@/components/clients/client-detail";
import Header from "@/components/header";

async function getClient(id: string): Promise<Client | null> {
  const supabase = createAdminClient();

  const [
    { data: client, error: clientErr },
    { data: services },
    { data: metrics },
    { data: notes },
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase.from("client_services").select("*").eq("client_id", id),
    supabase.from("client_metrics").select("*").eq("client_id", id).order("month", { ascending: true }),
    supabase.from("client_notes").select("*").eq("client_id", id).order("created_at", { ascending: false }),
  ]);

  if (clientErr || !client) return null;
  return { ...client, services: services ?? [], metrics: metrics ?? [], notes: notes ?? [] } as Client;
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
