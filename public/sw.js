const CACHE_NAME = "akompani-v7";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./app/",
  "./chat-agents.html",
  "./ops-console.html",
  "./design-system.css",
  "./landing.css",
  "./editor/editor.css",
  "./chat/chat.css",
  "./ops/ops.css",
  "./settings/settings.css",
  "./toast.js",
  "./auth-ui.js",
  "./sw-register.js",
  "./manifest.json",
];

const EXTERNAL_CACHE_ALLOWLIST = new Set([
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdn.jsdelivr.net",
]);

const SENSITIVE_QUERY_KEYS = new Set([
  "access_token",
  "auth",
  "authorization",
  "code",
  "id_token",
  "key",
  "password",
  "pat",
  "refresh_token",
  "secret",
  "signature",
  "sig",
  "state",
  "token",
  "x-debug-token",
  "x-worker-token",
]);

const NETWORK_FIRST_RUNTIME_PATHS = new Set([
  "/app.js",
  "/settings.js",
  "/chat-agents.js",
  "/ops-console.js",
  "/ide-runtime.js",
  "/auth-ui.js",
  "/toast.js",
  "/sw-register.js",
]);

const SCOPE_PATH = (() => {
  try {
    return new URL(self.registration.scope).pathname.replace(/\/+$/, "/");
  } catch {
    return "/";
  }
})();

function toScopedPathname(pathname) {
  const raw = String(pathname || "/");
  if (SCOPE_PATH !== "/" && raw.startsWith(SCOPE_PATH)) {
    const stripped = raw.slice(SCOPE_PATH.length);
    return `/${stripped.replace(/^\/+/, "") || ""}`.replace(/\/+$/, "") || "/";
  }
  return raw;
}

function hasSensitiveHeaders(request) {
  const headers = request.headers;
  return (
    headers.has("authorization") ||
    headers.has("cookie") ||
    headers.has("x-worker-token") ||
    headers.has("x-debug-token")
  );
}

function hasSensitiveQueryParams(url) {
  for (const [rawKey] of url.searchParams.entries()) {
    const key = String(rawKey || "").trim().toLowerCase();
    if (!key) continue;
    if (SENSITIVE_QUERY_KEYS.has(key)) return true;
    if (key.endsWith("_token") || key.endsWith("_secret") || key.endsWith("_key")) return true;
  }
  return false;
}

function isCacheableResponse(response) {
  if (!response || !response.ok) return false;
  return response.type === "basic" || response.type === "cors";
}

async function putInCache(request, response) {
  if (!isCacheableResponse(response)) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function networkFirst(request, opts = {}) {
  const { ignoreSearch = false, cacheOnSuccess = true, fallbackUrl = "" } = opts;
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(request);
    if (cacheOnSuccess) {
      await putInCache(request, fresh);
    }
    return fresh;
  } catch {
    const cached = await cache.match(request, ignoreSearch ? { ignoreSearch: true } : undefined);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl, { ignoreSearch: true });
      if (fallback) return fallback;
    }
    throw new Error("Network unavailable");
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((asset) => cache.add(asset).catch(() => {})),
      );
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const path = toScopedPathname(url.pathname);

  if (request.method !== "GET") return;
  if (request.cache === "no-store") return;
  if (hasSensitiveHeaders(request)) return;
  if (hasSensitiveQueryParams(url)) return;
  if (url.protocol === "ws:" || url.protocol === "wss:") return;

  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, {
        ignoreSearch: true,
        cacheOnSuccess: true,
        fallbackUrl: "./index.html",
      }).catch(() => fetch(request)),
    );
    return;
  }

  if (isSameOrigin && path === "/health") {
    return;
  }

  if (!isSameOrigin) {
    if (!EXTERNAL_CACHE_ALLOWLIST.has(url.hostname)) return;
    event.respondWith(
      networkFirst(request, { ignoreSearch: false, cacheOnSuccess: true }).catch(() => caches.match(request)),
    );
    return;
  }

  if (NETWORK_FIRST_RUNTIME_PATHS.has(path)) {
    event.respondWith(
      networkFirst(request, { ignoreSearch: true, cacheOnSuccess: true }).catch(() =>
        caches.match(request, { ignoreSearch: true }),
      ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const refresh = fetch(request)
        .then((response) => {
          putInCache(request, response).catch(() => {});
          return response;
        })
        .catch(() => cached || Response.error());
      return cached || refresh;
    }),
  );
});
