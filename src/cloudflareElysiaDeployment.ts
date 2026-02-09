import { promises as fs } from "node:fs";
import path from "node:path";

import { AgentRecord, CloudflareDeploymentConfig, FlowRecord } from "./types";

export interface GenerateCloudflareElysiaDeploymentOptions {
  flow: FlowRecord;
  agent?: AgentRecord;
  workerName: string;
  originUrl: string;
  outputDir: string;
  compatibilityDate: string;
  route?: string;
  waitForCompletion: boolean;
  requireWorkerToken: boolean;
  includeOpsConsole: boolean;
}

export interface GeneratedCloudflareElysiaDeployment {
  artifactPath: string;
  files: string[];
  config: CloudflareDeploymentConfig;
}

async function allocateArtifactPath(outputDir: string, slug: string): Promise<string> {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 17);
  for (let idx = 0; idx < 100; idx += 1) {
    const suffix = idx === 0 ? "" : `-${idx}`;
    const candidate = path.join(outputDir, `${slug}-${stamp}${suffix}`);
    try {
      await fs.mkdir(candidate, { recursive: false });
      return candidate;
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === "EEXIST") continue;
      throw error;
    }
  }
  throw new Error("Failed to allocate unique deployment artifact path.");
}

function toSlug(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "canaria-elysia-worker";
}

function buildWorkerEntrySource(options: {
  flowId: string;
  defaultOrigin: string;
  defaultWait: boolean;
  requireWorkerToken: boolean;
  includeOpsConsole: boolean;
}): string {
  return `import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { Cloudflare } from "elysia/adapter/cloudflare-worker";

interface Env {
  VOYAGER_ORIGIN?: string;
  VOYAGER_WEBHOOK_TOKEN?: string;
  WORKER_AUTH_TOKEN?: string;
}

const FLOW_ID = ${JSON.stringify(options.flowId)};
const DEFAULT_ORIGIN = ${JSON.stringify(options.defaultOrigin)};
const DEFAULT_WAIT = ${options.defaultWait ? "true" : "false"};
const REQUIRE_WORKER_TOKEN = ${options.requireWorkerToken ? "true" : "false"};
const INCLUDE_OPS_CONSOLE = ${options.includeOpsConsole ? "true" : "false"};

function isMethodWithBody(method: string): boolean {
  const upper = method.toUpperCase();
  return upper !== "GET" && upper !== "HEAD";
}

function sanitizeForwardHeaders(src: Headers): Headers {
  const headers = new Headers();
  const denied = new Set([
    "host",
    "cf-connecting-ip",
    "cf-ipcountry",
    "cf-ray",
    "x-forwarded-proto",
    "x-forwarded-for",
    "x-forwarded-host",
    "content-length",
    "authorization",
    "cookie",
    "set-cookie",
    "cf-access-jwt-assertion",
  ]);

  for (const [key, value] of src.entries()) {
    if (denied.has(key.toLowerCase())) continue;
    headers.set(key, value);
  }

  return headers;
}

function isAuthorized(request: Request, env: Env): boolean {
  if (!REQUIRE_WORKER_TOKEN) return true;
  const expected = (env.WORKER_AUTH_TOKEN || "").trim();
  if (!expected) return false;
  const got = request.headers.get("x-worker-token") || "";
  return got === expected;
}

async function forwardInvoke(request: Request, env: Env): Promise<Response> {
  const origin = (env.VOYAGER_ORIGIN || DEFAULT_ORIGIN || "").trim();
  if (!origin) {
    return Response.json({ error: "VOYAGER_ORIGIN missing." }, { status: 500 });
  }

  const incoming = new URL(request.url);
  const target = new URL(\`/api/webhooks/\${FLOW_ID}\`, origin);

  const waitParam = incoming.searchParams.get("wait");
  if (waitParam) {
    target.searchParams.set("wait", waitParam);
  } else if (DEFAULT_WAIT) {
    target.searchParams.set("wait", "true");
  }

  for (const [key, value] of incoming.searchParams.entries()) {
    if (key === "wait") continue;
    target.searchParams.set(key, value);
  }

  const headers = sanitizeForwardHeaders(request.headers);
  headers.set("x-voyager-edge", "cloudflare-elysia");

  const webhookToken = (env.VOYAGER_WEBHOOK_TOKEN || "").trim();
  if (webhookToken) {
    headers.set("authorization", \`Bearer \${webhookToken}\`);
  }

  const method = request.method.toUpperCase();
  const body = isMethodWithBody(method) ? await request.arrayBuffer() : undefined;
  const upstream = await fetch(target.toString(), {
    method,
    headers,
    body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}

const app = new Elysia({
  adapter: Cloudflare(),
})
  .use(
    cors({
      origin: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["*"],
    }),
  )
  .get("/health", ({ set, request }) => {
    set.headers["cache-control"] = "no-store";
    return {
      ok: true,
      flowId: FLOW_ID,
      includeOpsConsole: INCLUDE_OPS_CONSOLE,
      now: new Date().toISOString(),
      host: new URL(request.url).host,
    };
  })
  .get("/api/prompts", () => {
    return {
      prompts: [
        {
          id: "invoke_flow",
          label: "Invoke Flow",
          description: "Forward current request payload to CANARIA flow webhook.",
          endpoint: "/invoke",
          method: "POST",
        },
      ],
    };
  })
  .post("/invoke", async ({ request, set, store }) => {
    if (!isAuthorized(request, store as Env)) {
      set.status = 401;
      return { error: "Unauthorized." };
    }

    try {
      return await forwardInvoke(request, store as Env);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set.status = 502;
      return {
        error: "Worker forward failed.",
        detail: message,
      };
    }
  })
  .all("*", ({ path, set }) => {
    if (path.startsWith("/api/") || path === "/invoke" || path === "/health") {
      set.status = 404;
      return { error: "Not found." };
    }

    return new Response(null, {
      status: 404,
    });
  });

export default app;
`;
}

function buildWranglerToml(options: {
  workerName: string;
  compatibilityDate: string;
  originUrl: string;
  route?: string;
}): string {
  const lines = [
    `name = "${options.workerName}"`,
    `main = "src/index.ts"`,
    `compatibility_date = "${options.compatibilityDate}"`,
    `workers_dev = true`,
    "",
    "[assets]",
    `directory = "public"`,
    `binding = "ASSETS"`,
    `run_worker_first = ["/api/*", "/invoke", "/health"]`,
    "",
    "[vars]",
    `VOYAGER_ORIGIN = "${options.originUrl}"`,
  ];

  if (options.route && options.route.trim()) {
    lines.push("", `routes = ["${options.route.trim()}"]`);
  }

  return `${lines.join("\n")}\n`;
}

function buildPackageJson(workerName: string): string {
  const payload = {
    name: workerName,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      dev: "bunx wrangler dev",
      deploy: "bunx wrangler deploy",
      check: "bunx tsc --noEmit",
    },
    dependencies: {
      "@elysiajs/cors": "^1.4.0",
      elysia: "^1.4.7",
    },
    devDependencies: {
      "@cloudflare/workers-types": "^4.20260205.0",
      typescript: "^5.8.2",
      wrangler: "^4.50.0",
    },
  };

  return `${JSON.stringify(payload, null, 2)}\n`;
}

function buildTsConfig(): string {
  const payload = {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "Bundler",
      strict: true,
      lib: ["ES2022", "WebWorker"],
      types: ["@cloudflare/workers-types"],
      skipLibCheck: true,
    },
    include: ["src/**/*.ts"],
  };

  return `${JSON.stringify(payload, null, 2)}\n`;
}

function buildConsoleHtml(workerName: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${workerName} Ops Console</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="shell">
      <header class="top">
        <h1>${workerName} Ops Console</h1>
        <p>One-click prompt for edge flow invocation.</p>
      </header>

      <section class="card">
        <h2>Invoke Flow</h2>
        <p>Payload is forwarded to <code>/invoke</code>, which proxies to CANARIA webhook.</p>
        <textarea id="payload" spellcheck="false">{
  "event": "ops.manual.invoke",
  "source": "cloudflare-console"
}</textarea>
        <div class="row">
          <label><input id="wait" type="checkbox" /> wait=true</label>
          <button id="runBtn">Run Prompt</button>
        </div>
      </section>

      <section class="card">
        <h2>Output</h2>
        <pre id="result">{ "status": "ready" }</pre>
      </section>
    </main>

    <script src="/console.js"></script>
  </body>
</html>
`;
}

function buildConsoleJs(): string {
  return `(() => {
  const payloadEl = document.getElementById("payload");
  const waitEl = document.getElementById("wait");
  const runBtn = document.getElementById("runBtn");
  const resultEl = document.getElementById("result");

  async function run() {
    let payload = {};
    try {
      payload = JSON.parse(payloadEl.value || "{}");
    } catch (error) {
      resultEl.textContent = \`Invalid JSON payload: \${error.message}\`;
      return;
    }

    runBtn.disabled = true;
    resultEl.textContent = "Running...";

    try {
      const url = waitEl.checked ? "/invoke?wait=true" : "/invoke";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }

      resultEl.textContent = JSON.stringify(
        {
          status: response.status,
          ok: response.ok,
          data,
        },
        null,
        2,
      );
    } catch (error) {
      resultEl.textContent = \`Request failed: \${error.message}\`;
    } finally {
      runBtn.disabled = false;
    }
  }

  runBtn.addEventListener("click", run);
})();
`;
}

function buildConsoleCss(): string {
  return `:root {
  --bg: #111823;
  --card: #1c2634;
  --card-2: #253347;
  --text: #e7edf6;
  --muted: #9eaec4;
  --accent: #4ea1ff;
  --accent-2: #6366f1;
}

* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background: radial-gradient(circle at 15% 15%, #20324b 0%, var(--bg) 55%);
  color: var(--text);
  font-family: "Gothic A1", "Segoe UI", sans-serif;
}

.shell {
  max-width: 920px;
  margin: 0 auto;
  padding: 28px 16px 56px;
}

.top h1 {
  margin: 0 0 8px;
  font-size: 30px;
}

.top p {
  margin: 0 0 20px;
  color: var(--muted);
}

.card {
  background: linear-gradient(145deg, var(--card) 0%, var(--card-2) 100%);
  border: 1px solid #2f415b;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 14px;
}

h2 {
  margin: 0 0 8px;
  font-size: 18px;
}

p {
  margin: 0 0 12px;
  color: var(--muted);
}

textarea {
  width: 100%;
  min-height: 170px;
  background: #0d1420;
  color: #eaf2fb;
  border: 1px solid #334865;
  border-radius: 10px;
  padding: 12px;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 13px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}

button {
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  background: linear-gradient(120deg, var(--accent) 0%, var(--accent-2) 120%);
  color: white;
  font-weight: 700;
  cursor: pointer;
}

pre {
  margin: 0;
  padding: 12px;
  border-radius: 10px;
  background: #0d1420;
  border: 1px solid #334865;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  white-space: pre-wrap;
  word-break: break-word;
}
`;
}

function buildReadme(options: {
  flow: FlowRecord;
  agent?: AgentRecord;
  workerName: string;
  includeOpsConsole: boolean;
  requireWorkerToken: boolean;
}): string {
  const agentLine = options.agent
    ? `- Agent: ${options.agent.name} (${options.agent.id})`
    : "- Agent: (not linked)";

  const lines = [
    "# Bun + Wrangler + Elysia Worker Artifact",
    "",
    "Generated by CANARIA.",
    "",
    `- Worker: ${options.workerName}`,
    `- Flow: ${options.flow.name} (${options.flow.id})`,
    agentLine,
    `- Ops Console: ${options.includeOpsConsole ? "enabled" : "disabled"}`,
    "",
    "## Stack",
    "",
    "- Runtime and package manager: Bun",
    "- Edge deployment: Cloudflare Workers + Wrangler",
    "- HTTP framework: Elysia",
    "",
    "## Local Dev and Deploy",
    "",
    "```bash",
    "bun install",
    "bunx wrangler secret put VOYAGER_WEBHOOK_TOKEN",
  ];

  if (options.requireWorkerToken) {
    lines.push("bunx wrangler secret put WORKER_AUTH_TOKEN");
  }

  lines.push("bun run dev", "bun run deploy", "```", "");
  lines.push("## Endpoints", "", "- `GET /health`", "- `POST /invoke`", "- `GET /api/prompts`");
  if (options.includeOpsConsole) {
    lines.push("- `/` serves one-click prompt console");
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

export async function generateCloudflareElysiaDeployment(
  input: GenerateCloudflareElysiaDeploymentOptions,
): Promise<GeneratedCloudflareElysiaDeployment> {
  const slug = toSlug(input.workerName);
  await fs.mkdir(input.outputDir, { recursive: true });
  const artifactPath = await allocateArtifactPath(input.outputDir, slug);
  const srcDir = path.join(artifactPath, "src");
  const publicDir = path.join(artifactPath, "public");

  await fs.mkdir(srcDir, { recursive: true });
  await fs.mkdir(publicDir, { recursive: true });

  const workerEntry = buildWorkerEntrySource({
    flowId: input.flow.id,
    defaultOrigin: input.originUrl,
    defaultWait: input.waitForCompletion,
    requireWorkerToken: input.requireWorkerToken,
    includeOpsConsole: input.includeOpsConsole,
  });

  const wranglerToml = buildWranglerToml({
    workerName: slug,
    compatibilityDate: input.compatibilityDate,
    originUrl: input.originUrl,
    route: input.route,
  });

  const files: Array<{ rel: string; content: string }> = [
    { rel: "src/index.ts", content: workerEntry },
    { rel: "wrangler.toml", content: wranglerToml },
    { rel: "package.json", content: buildPackageJson(slug) },
    { rel: "tsconfig.json", content: buildTsConfig() },
    {
      rel: ".dev.vars.example",
      content: [
        "# Optional local values for wrangler dev",
        `VOYAGER_ORIGIN=${input.originUrl}`,
        "VOYAGER_WEBHOOK_TOKEN=replace_me",
        "WORKER_AUTH_TOKEN=replace_me",
        "",
      ].join("\n"),
    },
    {
      rel: "README.md",
      content: buildReadme({
        flow: input.flow,
        agent: input.agent,
        workerName: slug,
        includeOpsConsole: input.includeOpsConsole,
        requireWorkerToken: input.requireWorkerToken,
      }),
    },
  ];

  if (input.includeOpsConsole) {
    files.push({ rel: "public/index.html", content: buildConsoleHtml(slug) });
    files.push({ rel: "public/console.js", content: buildConsoleJs() });
    files.push({ rel: "public/styles.css", content: buildConsoleCss() });
  } else {
    files.push({
      rel: "public/index.html",
      content: "<!doctype html><html><body><h1>Elysia Worker</h1></body></html>\n",
    });
  }

  for (const file of files) {
    const target = path.join(artifactPath, file.rel);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.content, "utf8");
  }

  return {
    artifactPath,
    files: files.map((f) => f.rel),
    config: {
      workerName: slug,
      flowId: input.flow.id,
      agentId: input.agent?.id,
      originUrl: input.originUrl,
      outputDir: input.outputDir,
      compatibilityDate: input.compatibilityDate,
      route: input.route,
      waitForCompletion: input.waitForCompletion,
      requireWorkerToken: input.requireWorkerToken,
      runtime: "bun",
      framework: "elysia",
      includeOpsConsole: input.includeOpsConsole,
    },
  };
}
