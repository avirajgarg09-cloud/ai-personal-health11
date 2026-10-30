// VitalEdge Service Worker
// Offline-first app-shell caching + background sync trigger for the
// Conflict Resolution Engine (see src/lib/sync-engine.ts).

const CACHE_VERSION = "vitaledge-v1";
const APP_SHELL = [
  "/dashboard",
  "/onboarding",
  "/scribe",
  "/prescriptions",
  "/reports",
  "/appointments",
  "/settings",
  "/support",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/images/body-scan.png",
  "/tesseract/worker.min.js",
  "/tesseract/tesseract-core-lstm.wasm.js",
  "/tesseract/tesseract-core-lstm.wasm",
  "/tesseract-lang/eng.traineddata.gz",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL).catch(() => void 0)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

// Network-first for API routes (always want fresh data when online),
// falling back to cache for navigations/static assets (offline-first shell).
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(
        () => new Response(JSON.stringify({ offline: true }), { headers: { "Content-Type": "application/json" } }),
      ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});

// Background Sync: when the browser regains connectivity it fires this event
// (registered from the client via registration.sync.register('vitaledge-sync')).
// We simply notify all open tabs so the in-page Sync Engine flushes the
// IndexedDB outbox — this keeps the conflict-resolution logic in one place.
self.addEventListener("sync", (event) => {
  if (event.tag === "vitaledge-sync") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "VITALEDGE_SYNC_NOW" }));
      }),
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
