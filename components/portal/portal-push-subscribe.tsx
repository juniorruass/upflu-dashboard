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

  const isActive = state === "subscribed";
  const isDenied = state === "denied";

  return (
    <button
      onClick={isActive ? unsubscribe : subscribe}
      disabled={loading || isDenied}
      title={isDenied ? "Notificações bloqueadas no navegador" : isActive ? "Clique para desativar notificações" : "Ativar notificações de performance"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        background: isActive
          ? "linear-gradient(135deg, rgba(0,207,255,0.15) 0%, rgba(0,207,255,0.05) 100%)"
          : "rgba(255,255,255,0.04)",
        border: `1px solid ${isActive ? "rgba(0,207,255,0.35)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: "10px",
        padding: "8px 14px",
        fontSize: "11px",
        fontWeight: "600",
        color: isActive ? "#00CFFF" : isDenied ? "#444" : "#888",
        cursor: loading || isDenied ? "default" : "pointer",
        opacity: loading ? 0.6 : isDenied ? 0.4 : 1,
        transition: "all .2s",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: "13px" }}>
        {loading ? "⏳" : isActive ? "🔔" : isDenied ? "🔕" : "🔔"}
      </span>
      {loading
        ? "..."
        : isActive
        ? "Notificações ativas"
        : isDenied
        ? "Bloqueado"
        : "Ativar notificações"}
      {isActive && (
        <span style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: "#4ADE80",
          boxShadow: "0 0 6px #4ADE8088",
          animation: "bellPulse 2s ease-in-out infinite",
          flexShrink: 0,
        }} />
      )}
      <style>{`@keyframes bellPulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </button>
  );
}
