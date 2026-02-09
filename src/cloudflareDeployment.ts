import { promises as fs } from "node:fs";
import path from "node:path";

import { AgentRecord, CloudflareDeploymentConfig, FlowRecord } from "./types";

export interface GenerateCloudflareDeploymentOptions {
  flow: FlowRecord;
  agent?: AgentRecord;
  workerName: string;
  originUrl: string;
  outputDir: string;
  compatibilityDate: string;
  route?: string;
  waitForCompletion: boolean;
  requireWorkerToken: boolean;
}

export interface GeneratedCloudflareDeployment {
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

  return normalized || "canaria-worker";
}

function buildWorkerEntrySource(options: {
  flowId: string;
  defaultOrigin: string;
  defaultWait: boolean;
  requireWorkerToken: boolean;
}): string {
  return `export interface Env {
  VOYAGER_ORIGIN?: string;
  VOYAGER_WEBHOOK_TOKEN?: string;
  WORKER_AUTH_TOKEN?: string;
}

const FLOW_ID = ${JSON.stringify(options.flowId)};
const DEFAULT_ORIGIN = ${JSON.stringify(options.defaultOrigin)};
const DEFAULT_WAIT = ${options.defaultWait ? "true" : "false"};
const REQUIRE_WORKER_TOKEN = ${options.requireWorkerToken ? "true" : "false"};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "*",
    },
  });
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
    const lowered = key.toLowerCase();
    if (denied.has(lowered)) continue;
    headers.set(key, value);
  }

  return headers;
}

function isMethodWithBody(method: string): boolean {
  const upper = method.toUpperCase();
  return upper !== "GET" && upper !== "HEAD";
}

function isAuthorized(request: Request, env: Env): boolean {
  if (!REQUIRE_WORKER_TOKEN) return true;
  const expected = env.WORKER_AUTH_TOKEN;
  if (!expected) return false;
  const got = request.headers.get("x-worker-token") || "";
  return got === expected;
}

async function forwardToAgentBuilder(request: Request, env: Env): Promise<Response> {
  const origin = (env.VOYAGER_ORIGIN || DEFAULT_ORIGIN || "").trim();
  if (!origin) {
    return jsonResponse(
      {
        error: "VOYAGER_ORIGIN is missing.",
      },
      500,
    );
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
  headers.set("x-voyager-edge", "cloudflare-worker");

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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return jsonResponse({ ok: true }, 200);
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return jsonResponse({
        ok: true,
        flowId: FLOW_ID,
        origin: (env.VOYAGER_ORIGIN || DEFAULT_ORIGIN || "").trim(),
      });
    }

    if (url.pathname !== "/invoke") {
      return jsonResponse(
        {
          error: "Not found. Use /invoke",
        },
        404,
      );
    }

    if (!isAuthorized(request, env)) {
      return jsonResponse(
        {
          error: "Unauthorized.",
        },
        401,
      );
    }

    try {
      return await forwardToAgentBuilder(request, env);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return jsonResponse(
        {
          error: "Worker forward failed.",
          detail: message,
        },
        502,
      );
    }
  },
};
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
      tail: "bunx wrangler tail",
    },
    devDependencies: {
      wrangler: "^4.50.0",
      typescript: "^5.8.2",
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
    },
  };

  return `${JSON.stringify(payload, null, 2)}\n`;
}

function buildReadme(options: {
  flow: FlowRecord;
  agent?: AgentRecord;
  workerName: string;
  requireWorkerToken: boolean;
}): string {
  const agentLine = options.agent
    ? `- Agent: ${options.agent.name} (${options.agent.id})`
    : "- Agent: (not linked)";

  const lines = [
    "# Cloudflare Worker Deployment Artifact",
    "",
    "Generated by CANARIA.",
    "",
    `- Worker: ${options.workerName}`,
    `- Flow: ${options.flow.name} (${options.flow.id})`,
    agentLine,
    "",
    "## What this Worker does",
    "",
    '- Exposes `/invoke` and forwards requests to `/api/webhooks/:flowId` on CANARIA origin',
    "- Exposes `/health` for quick health checks",
    "- Optionally requires `x-worker-token` if enabled",
    "",
    "## Deploy",
    "",
    "```bash",
    "bun install",
    "bunx wrangler secret put VOYAGER_WEBHOOK_TOKEN",
  ];

  if (options.requireWorkerToken) {
    lines.push("bunx wrangler secret put WORKER_AUTH_TOKEN");
  }

  lines.push("bun run deploy", "```", "");

  return `${lines.join("\n")}\n`;
}

export async function generateCloudflareDeployment(
  input: GenerateCloudflareDeploymentOptions,
): Promise<GeneratedCloudflareDeployment> {
  const slug = toSlug(input.workerName);
  await fs.mkdir(input.outputDir, { recursive: true });
  const artifactPath = await allocateArtifactPath(input.outputDir, slug);
  const srcDir = path.join(artifactPath, "src");

  await fs.mkdir(srcDir, { recursive: true });

  const workerEntry = buildWorkerEntrySource({
    flowId: input.flow.id,
    defaultOrigin: input.originUrl,
    defaultWait: input.waitForCompletion,
    requireWorkerToken: input.requireWorkerToken,
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
        "# Optional values for local wrangler dev",
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
        requireWorkerToken: input.requireWorkerToken,
      }),
    },
  ];

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
      runtime: "node",
      framework: "none",
      includeOpsConsole: false,
    },
  };
}
