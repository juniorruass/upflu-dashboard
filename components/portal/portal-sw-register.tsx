"use client";
import { useEffect } from "react";

export function PortalSWRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Desregistra o SW admin (sw.js) se estiver ativo neste scope
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        if (reg.active?.scriptURL?.endsWith("/sw.js")) {
          reg.unregister();
        }
      }
    });
    // Registra o SW do portal
    navigator.serviceWorker.register("/sw-portal.js").catch(() => {});
  }, []);
  return null;
}
