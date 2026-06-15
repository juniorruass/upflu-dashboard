import { createAdminClient } from "@/lib/supabase";
import Header from "@/components/header";
import ClientsView from "@/components/clients/clients-view";
import { Client } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getClients(): Promise<Client[]> {
  try {
    const supabase = createAdminClient();

    const [{ data: clients, error }, { data: services }] = await Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("client_services").select("*"),
    ]);

    if (error) { console.error("[getClients] error:", error.message); return []; }

    const svcMap: Record<string, Client["services"]> = {};
    (services ?? []).forEach((s) => {
      if (!svcMap[s.client_id]) svcMap[s.client_id] = [];
      svcMap[s.client_id]!.push(s);
    });

    return (clients ?? []).map((c) => ({ ...c, services: svcMap[c.id] ?? [] })) as Client[];
  } catch (e) {
    console.error("[getClients] exception:", e);
    return [];
  }
}

export default async function ClientesPage() {
  const clients = await getClients();
  return (
    <>
      <Header title="Clientes" />
      <ClientsView initialClients={clients} />
    </>
  );
}
