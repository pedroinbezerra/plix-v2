const LEGACY_CACHE = "plix-cache-v1";
const CACHE_NAME = "plix-cache-v2";

const STATIC_ASSETS = [
  "/favicon.ico",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-512x512.png",
  "/icons/icon.svg",
];

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Aviso ao pre-cachear ativos:", err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos (incluindo plix-cache-v1)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME || key === LEGACY_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de Fetch: Network-First para páginas e bundles, Cache-First apenas para ícones
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Ignora requisições que não sejam GET, HMR do Next.js, API ou streaming externo
  if (
    request.method !== "GET" ||
    request.url.includes("/_next/webpack-hmr") ||
    request.url.includes("/_next/static/webpack/") ||
    request.url.includes("/api/") ||
    request.url.includes("warezcdn") ||
    request.url.includes("pomfy") ||
    request.url.includes("streambetter")
  ) {
    return;
  }

  // Apenas para imagens de ícones estáticos: Cache First
  if (request.url.includes("/icons/") || request.url.includes("/favicon.ico")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          })
        );
      })
    );
    return;
  }

  // Para navegação e chunks do Next.js (/_next/static/): Network First com fallback para cache offline
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline", { status: 503, statusText: "Offline" });
        });
      })
  );
});
