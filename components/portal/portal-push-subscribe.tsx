"use client";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(Array.from(raw).map((c) => c.charCodeAt(0)));
}

export function PortalPushSubscribe({ clientId, clientSlug }: { clientId: string; clientSlug: string }) {
  const [state, setState] = useState<"idle" | "subscribed" | "denied" | "unsupported">("idle");
  const [loading, setLoading] = useState(false);
  const ACCENT = "#00CFFF";

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported"); return;
    }
    if (Notification.permission === "denied") { setState("denied"); return; }
    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub) setState("subscribed");
      });
    }
  }, []);

  async function subscribe() {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState("denied"); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), type: "client", clientId }),
      });

      // Notificação de boas-vindas
      await fetch("/api/push/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSlug }),
      });

      setState("subscribed");
    } catch {
      setState("idle");
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setState("idle");
    } finally {
      setLoading(false);
    }
  }

  if (state === "unsupported") return null;

  return (
    <button
      onClick={state === "subscribed" ? unsubscribe : subscribe}
      disabled={loading || state === "denied"}
      style={{
        background: state === "subscribed" ? `${ACCENT}18` : "rgba(255,255,255,0.05)",
        border: `1px solid ${state === "subscribed" ? `${ACCENT}44` : "rgba(255,255,255,0.08)"}`,
        borderRadius: "8px",
        padding: "6px 12px",
        fontSize: "11px",
        fontWeight: "600",
        color: state === "subscribed" ? ACCENT : state === "denied" ? "#555" : "#999",
        cursor: loading || state === "denied" ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        opacity: loading ? 0.6 : 1,
      }}
    >
      <span>{state === "subscribed" ? "🔔" : "🔔"}</span>
      {state === "subscribed" ? "Notificações ativas" : state === "denied" ? "Bloqueado" : "Receber atualizações"}
    </button>
  );
}
