/// <reference lib="webworker" />

// Bumped from cartlo-v1 to force eviction of the old cache, which may contain
// authenticated navigation responses (private shopping lists, settings, etc.).
const CACHE_NAME = 'cartlo-v2';

// Only pre-cache non-sensitive, public static assets. Never the app shell '/',
// which renders the current user's private shopping list.
const STATIC_ASSETS = ['/manifest.webmanifest'];

// Install: cache static assets only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// Activate: delete every cache except the current one (evicts cartlo-v1)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

// Fetch: cache-first ONLY for public, immutable static assets.
// Navigations and every other request go straight to the network and are never
// cached — the Cache API is shared per-origin across accounts, so caching an
// authenticated page would leak one user's data to the next.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.hostname !== self.location.hostname) return;

  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest';

  if (!isStaticAsset) {
    // Let the browser handle navigations and dynamic/authenticated requests
    // over the network. Nothing is cached, nothing is served from cache.
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          // Only cache successful, basic (same-origin) responses.
          if (response.ok && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }),
    ),
  );
});
