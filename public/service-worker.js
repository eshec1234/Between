/* Between PWA — v3: never serve stale bundles after deploy (fixes white screen). */
const CACHE_NAME = 'between-v3';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/manifest.json', '/icons/icon-192x192.png'])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.url.includes('supabase') || event.request.url.includes('mapbox')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Vite hashed JS/CSS — always network first (stale cache = white screen)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // HTML / SPA shell — network first so new deploys load immediately
  if (
    event.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('index.html')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((res) => (res && res.ok ? res : caches.match(event.request)))
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Other static (icons, etc.) — cache first
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
