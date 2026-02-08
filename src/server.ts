import express, { NextFunction, Request, Response } from "express";
import path from "node:path";

const PORT = Number(process.env.PORT || 3000);
const publicDir = path.join(process.cwd(), "public");

const app = express();
app.disable("x-powered-by");

function setSecurityHeaders(_req: Request, res: Response, next: NextFunction): void {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "connect-src 'self' https: ws: wss:",
    "worker-src 'self' blob:",
    "object-src 'none'",
  ].join("; ");

  res.setHeader("Content-Security-Policy", csp);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

app.use(setSecurityHeaders);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    mode: "static-first",
    now: new Date().toISOString(),
  });
});

app.all("/api/*", (_req, res) => {
  res.status(410).json({
    error: "API mode is disabled in this static-first build. Use in-browser LLM/OAuth deploy flows.",
  });
});

app.use(
  express.static(publicDir, {
    extensions: ["html"],
    etag: true,
    maxAge: "1h",
  }),
);

const htmlRoutes: Array<{ route: string; file: string }> = [
  { route: "/", file: "index.html" },
  { route: "/editor", file: "editor/index.html" },
  { route: "/chat", file: "chat/index.html" },
  { route: "/ops", file: "ops/index.html" },
  { route: "/settings", file: "settings/index.html" },
  { route: "/chat-agents", file: "chat-agents.html" },
  { route: "/ops-console", file: "ops-console.html" },
];

for (const entry of htmlRoutes) {
  app.get(entry.route, (_req, res) => {
    res.sendFile(path.join(publicDir, entry.file));
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`[voyager] static-first server listening on http://localhost:${PORT}`);
});
