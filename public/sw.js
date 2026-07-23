// ThriveDeck service worker.
// Privacy-first: only immutable static build assets and icons are cached.
// Page navigations, API calls, and RSC payloads (which can contain personal
// health data) always go to the network and are never stored on-device.

const STATIC_CACHE = "td-static-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache the service worker itself.
  if (url.pathname === "/sw.js") return;

  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:css|js|woff2?|png|jpe?g|svg|webp|gif|ico)$/.test(url.pathname);

  // Everything else (navigations, /api, RSC data) falls through to the network.
  if (!isStaticAsset) return;

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
  );
});
