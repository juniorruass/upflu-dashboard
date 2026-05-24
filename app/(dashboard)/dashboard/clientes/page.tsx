import { createAdminClient } from "@/lib/supabase";
import Header from "@/components/header";
import ClientsView from "@/components/clients/clients-view";
import { Client } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getClients(): Promise<Client[]> {
  try {
    const supabase = createAdminClient();

    // Try with services join (requires FK relationship in Supabase)
    const { data, error } = await supabase
      .from("clients")
      .select("*, services:client_services(*)")
      .order("created_at", { ascending: false });

    if (!error) return (data ?? []) as Client[];

    // Fallback: query without join if FK relationship not configured
    console.error("[getClients] join error, falling back:", error.message);
    const { data: data2, error: error2 } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error2) console.error("[getClients] fallback error:", error2.message);
    return (data2 ?? []) as Client[];
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
