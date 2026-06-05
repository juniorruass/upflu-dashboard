import { createAdminClient } from "./supabase";

export function normalizePhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("55") ? d : `55${d}`;
}

export async function isBlacklisted(phone: string): Promise<boolean> {
  const normalized = normalizePhone(phone);
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blacklist")
    .select("id")
    .eq("phone", normalized)
    .limit(1);
  return (data?.length ?? 0) > 0;
}
