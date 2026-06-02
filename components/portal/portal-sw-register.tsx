"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PortalSWRegister() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Slug é o primeiro segmento do path (ex: /arthurrusc → arthurrusc)
    const slug = pathname.split("/").filter(Boolean)[0];
    if (!slug) return;

    // Desregistra qualquer SW admin (sw.js) que possa estar ativo
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        if (reg.active?.scriptURL?.endsWith("/sw.js")) {
          reg.unregister();
        }
      }
    });

    // Registra o SW do portal com scope restrito ao slug do cliente
    navigator.serviceWorker.register("/sw-portal.js", { scope: `/${slug}/` }).catch(() => {
      // Se o scope falhar (SW não tem header Service-Worker-Allowed), registra sem scope
      navigator.serviceWorker.register("/sw-portal.js").catch(() => {});
    });
  }, [pathname]);

  return null;
}
