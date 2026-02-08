const CACHE_NAME = 'voyager-v1';
const STATIC_ASSETS = [
  '/',
  '/editor',
  '/chat',
  '/ops',
  '/settings',
  '/design-system.css',
  '/landing.css',
  '/editor/editor.css',
  '/chat/chat.css',
  '/ops/ops.css',
  '/settings/settings.css',
  '/app.js',
  '/chat-agents.js',
  '/ops-console.js',
  '/settings.js',
  '/toast.js',
  '/auth-ui.js',
  '/manifest.json',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Some assets may not exist yet, that's ok
        return Promise.allSettled(
          STATIC_ASSETS.map((url) => cache.add(url).catch(() => {}))
        );
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch — network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // API calls — network only
  if (url.pathname.startsWith('/api/')) return;

  // WebSocket — skip
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return;

  // External resources (fonts, CDN) — network first, fallback to cache
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets — stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return res;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
