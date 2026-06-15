"use client";

import { useRouter } from "next/navigation";

const MUTED = "#777068";

export function PortalLogoutBtn({ slug }: { slug: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/portal/auth", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      style={{ background: "none", border: `1px solid var(--up-border)`, borderRadius: "8px", padding: "7px 16px", fontSize: "11px", fontWeight: "500", color: MUTED, cursor: "pointer", letterSpacing: "0.04em", transition: "all .2s" }}
      onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.color = "#F0EDE8"; }}
      onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.color = MUTED; }}
    >
      Sair
    </button>
  );
}
