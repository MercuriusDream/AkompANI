const { cpSync } = require("node:fs");
const { resolve } = require("node:path");
const { defineConfig } = require("vite");

const APP_ROUTE_REDIRECTS = new Map([
  ["/app", "/app/"],
  ["/app/index.html", "/app/"],
  ["/editor", "/app/"],
  ["/editor/", "/app/"],
  ["/editor/index.html", "/app/"],
  ["/settings", "/app/?mode=settings"],
  ["/settings/", "/app/?mode=settings"],
  ["/settings/index.html", "/app/?mode=settings"],
  ["/chat", "/app/?mode=chat"],
  ["/chat/", "/app/?mode=chat"],
  ["/chat/index.html", "/app/?mode=chat"],
  ["/ops", "/app/?mode=deploy"],
  ["/ops/", "/app/?mode=deploy"],
  ["/ops/index.html", "/app/?mode=deploy"],
]);

function isApiPath(pathname) {
  return pathname === "/api" || pathname.startsWith("/api/");
}

function appRedirectMiddleware(req, res, next) {
  const url = String(req.url || "");
  const [pathname, query = ""] = url.split("?");
  if (isApiPath(pathname)) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Not Found");
    return;
  }
  const targetBase = APP_ROUTE_REDIRECTS.get(pathname);
  if (!targetBase) {
    next();
    return;
  }
  const target = query
    ? `${targetBase}${targetBase.includes("?") ? "&" : "?"}${query}`
    : targetBase;
  res.statusCode = 302;
  res.setHeader("Location", target);
  res.end();
}

module.exports = defineConfig({
  root: "public",
  publicDir: false,
  base: "./",
  server: {
    host: true,
    port: 3000,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  plugins: [
    {
      name: "app-route-redirects",
      configureServer(server) {
        server.middlewares.use(appRedirectMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(appRedirectMiddleware);
      },
    },
    {
      name: "copy-public-as-static-artifact",
      closeBundle() {
        cpSync(resolve(__dirname, "public"), resolve(__dirname, "dist"), {
          recursive: true,
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@public": resolve(__dirname, "public"),
    },
  },
});
