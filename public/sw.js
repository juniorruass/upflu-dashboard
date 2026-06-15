const CACHE = "upflu-v3";
const PRECACHE = ["/offline", "/upflu-logo.png", "/favicon.ico"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Navegação (HTML pages) — nunca servir do cache, sempre rede
  if (request.mode === "navigate") return;

  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ error: "offline" }), {
        headers: { "Content-Type": "application/json" },
      }))
    );
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(request).then(
        (cached) => cached ?? fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
      )
    );
    return;
  }
  // Outros assets estáticos (imagens, fonts etc) — cache-first
  e.respondWith(
    caches.match(request).then(
      (cached) => cached ?? fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      }).catch(() => caches.match("/offline"))
    )
  );
});

// ── Push notifications ─────────────────────────────────────
self.addEventListener("push", (e) => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title ?? "UPFLU", {
      body: data.body ?? "",
      icon: "/upflu-logo.png",
      badge: "/favicon-32.png",
      tag: data.tag ?? "upflu",
      renotify: true,
      data: { url: data.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
      const existing = cs.find((c) => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(url); }
      else clients.openWindow(url);
    })
  );
});
