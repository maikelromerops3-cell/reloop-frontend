// Service worker mínimo para que Ropelin sea instalable como PWA.
// A propósito NO cachea nada de /api/ — los datos del marketplace (artículos, precios,
// mensajes...) siempre deben venir frescos del servidor, nunca de una copia guardada.
const CACHE_NAME = "ropelin-shell-v1";
const APP_SHELL = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Nunca tocar peticiones a la API ni a otros orígenes (Stripe, Cloudinary, Shippo...)
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) return;

  // Solo cacheamos peticiones GET de nuestro propio origen (la app shell y assets estáticos)
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
  );
});
