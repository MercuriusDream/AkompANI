(() => {
  if (!("serviceWorker" in navigator)) return;

  const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
  const scriptUrl = (() => {
    try {
      if (document.currentScript?.src) {
        return new URL(document.currentScript.src);
      }
    } catch {
      // ignore
    }
    return new URL("./sw-register.js", window.location.href);
  })();
  const swUrl = new URL("./sw.js", scriptUrl);
  const swScopePath = (() => {
    const scopeUrl = new URL("./", scriptUrl);
    return scopeUrl.pathname.endsWith("/") ? scopeUrl.pathname : `${scopeUrl.pathname}/`;
  })();

  async function clearServiceWorkerState() {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch {
      // Ignore registration cleanup failures.
    }

    if (!("caches" in window)) return;
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch {
      // Ignore cache cleanup failures.
    }
  }

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register(swUrl.toString(), {
        scope: swScopePath,
        updateViaCache: "none",
      });
      registration.update().catch(() => {});
    } catch {
      // Ignore registration failures.
    }
  }

  window.addEventListener("load", async () => {
    if (LOCAL_HOSTS.has(window.location.hostname)) {
      await clearServiceWorkerState();
      return;
    }
    await registerServiceWorker();
  });
})();
