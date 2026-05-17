import { createServerClient } from "@/lib/supabase";
import Header from "@/components/header";
import SettingsForm from "@/components/settings-form";

async function getUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export default async function ConfiguracoesPage() {
  const user = await getUser();

  return (
    <>
      <Header title="Configurações" />
      <div style={{ padding: "32px", flex: 1 }}>
        <div style={{ maxWidth: "600px" }}>
          <SettingsForm userEmail={user?.email ?? ""} />
        </div>
      </div>
    </>
  );
}
