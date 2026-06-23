import { createAdminClient } from "@/lib/supabase";
import Header from "@/components/header";
import ClientsView from "@/components/clients/clients-view";
import { Client } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getClients(): Promise<{ clients: Client[]; overdueClientIds: string[] }> {
  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    const [{ data: clients, error }, { data: services }, { data: overduePayments }] = await Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("client_services").select("*"),
      supabase.from("payments").select("client_id").is("paid_date", null).lt("due_date", today),
    ]);

    if (error) { console.error("[getClients] error:", error.message); return { clients: [], overdueClientIds: [] }; }

    const svcMap: Record<string, Client["services"]> = {};
    (services ?? []).forEach((s) => {
      if (!svcMap[s.client_id]) svcMap[s.client_id] = [];
      svcMap[s.client_id]!.push(s);
    });

    const overdueClientIds = Array.from(new Set((overduePayments ?? []).map((p) => p.client_id as string)));

    return {
      clients: (clients ?? []).map((c) => ({ ...c, services: svcMap[c.id] ?? [] })) as Client[],
      overdueClientIds,
    };
  } catch (e) {
    console.error("[getClients] exception:", e);
    return { clients: [], overdueClientIds: [] };
  }
}

export default async function ClientesPage() {
  const { clients, overdueClientIds } = await getClients();
  return (
    <>
      <Header title="Clientes" />
      <ClientsView initialClients={clients} overdueClientIds={overdueClientIds} />
    </>
  );
}
