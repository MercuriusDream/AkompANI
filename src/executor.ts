import OpenAI from "openai";
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

import { compileDrawflow } from "./flowCompiler";
import { FlowRecord } from "./types";
import {
  asNumber,
  asObject,
  asString,
  evaluateExpression,
  interpolateString,
  isPlainObject,
  nowIso,
  parseUnknownJson,
  renderTemplateValue,
  safeJsonStringify,
} from "./utils";

interface ExecuteRunOptions {
  flow: FlowRecord;
  input: unknown;
  initialVars?: Record<string, unknown>;
  agentInstruction?: string;
  onEvent: (event: {
    type: "run_started" | "node_started" | "node_completed" | "node_log" | "run_completed" | "run_failed";
    nodeId?: string;
    nodeType?: string;
    detail?: Record<string, unknown>;
  }) => Promise<void> | void;
  maxSteps?: number;
}

interface RuntimeState {
  whileCounts: Record<string, number>;
  forEach: Record<string, { index: number; items: unknown[] }>;
}

interface ExecutionContext {
  input: unknown;
  vars: Record<string, unknown>;
  last: unknown;
  output?: unknown;
}

let openaiClient: OpenAI | undefined;
const httpNodePrivateAddressRanges = new BlockList();

httpNodePrivateAddressRanges.addSubnet("0.0.0.0", 8, "ipv4");
httpNodePrivateAddressRanges.addSubnet("10.0.0.0", 8, "ipv4");
httpNodePrivateAddressRanges.addSubnet("100.64.0.0", 10, "ipv4");
httpNodePrivateAddressRanges.addSubnet("127.0.0.0", 8, "ipv4");
httpNodePrivateAddressRanges.addSubnet("169.254.0.0", 16, "ipv4");
httpNodePrivateAddressRanges.addSubnet("172.16.0.0", 12, "ipv4");
httpNodePrivateAddressRanges.addSubnet("192.168.0.0", 16, "ipv4");
httpNodePrivateAddressRanges.addSubnet("198.18.0.0", 15, "ipv4");
httpNodePrivateAddressRanges.addSubnet("::1", 128, "ipv6");
httpNodePrivateAddressRanges.addSubnet("fc00::", 7, "ipv6");
httpNodePrivateAddressRanges.addSubnet("fe80::", 10, "ipv6");

function normalizeHostName(hostname: string): string {
  const trimmed = hostname.trim().toLowerCase();
  if (!trimmed) return "";

  let unwrapped = trimmed;
  if (unwrapped.startsWith("[")) {
    const endBracket = unwrapped.indexOf("]");
    if (endBracket > 0) {
      unwrapped = unwrapped.slice(1, endBracket);
    }
  } else {
    const colonCount = (unwrapped.match(/:/g) ?? []).length;
    if (colonCount === 1) {
      unwrapped = unwrapped.split(":")[0];
    }
  }

  return unwrapped.replace(/\.+$/, "");
}

function normalizeAllowedHost(entry: string): string {
  const trimmed = entry.trim();
  if (!trimmed) return "";

  try {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
      return normalizeHostName(new URL(trimmed).hostname);
    }
  } catch {
    // Fall through to manual parsing.
  }

  if (trimmed.startsWith("[") && trimmed.includes("]")) {
    const end = trimmed.indexOf("]");
    if (end > 0) {
      return normalizeHostName(trimmed.slice(1, end));
    }
  }

  const colonCount = (trimmed.match(/:/g) || []).length;
  if (colonCount === 1) {
    return normalizeHostName(trimmed.split(":")[0]);
  }

  return normalizeHostName(trimmed);
}

function stripIpv6ZoneId(hostname: string): string {
  const index = hostname.indexOf("%");
  return index >= 0 ? hostname.slice(0, index) : hostname;
}

function extractMappedIpv4Address(ipv6Address: string): string | undefined {
  if (!ipv6Address.startsWith("::ffff:")) return undefined;
  const candidate = ipv6Address.slice("::ffff:".length);
  return isIP(candidate) === 4 ? candidate : undefined;
}

function isPrivateOrLocalIp(hostname: string): boolean {
  const normalized = stripIpv6ZoneId(normalizeHostName(hostname));
  const family = isIP(normalized);

  if (family === 4) {
    return httpNodePrivateAddressRanges.check(normalized, "ipv4");
  }

  if (family === 6) {
    const mappedIpv4 = extractMappedIpv4Address(normalized);
    if (mappedIpv4) {
      return httpNodePrivateAddressRanges.check(mappedIpv4, "ipv4");
    }
    return httpNodePrivateAddressRanges.check(normalized, "ipv6");
  }

  return false;
}

function parseAllowedHttpHosts(envValue: string | undefined): string[] {
  if (!envValue) return [];

  const parsed: string[] = [];
  for (const rawEntry of envValue.split(",")) {
    const entry = normalizeAllowlistEntry(rawEntry);
    if (entry) parsed.push(entry);
  }
  return parsed;
}

function normalizeAllowlistEntry(rawEntry: string): string {
  const trimmed = rawEntry.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("*.")) {
    const normalized = normalizeAllowedHost(trimmed.slice(2));
    return normalized ? `*.${normalized}` : "";
  }

  return normalizeAllowedHost(trimmed);
}

function isHttpHostAllowlisted(hostname: string, allowlist: string[]): boolean {
  for (const allowedHost of allowlist) {
    if (hostname === allowedHost) return true;

    if (allowedHost.startsWith("*.")) {
      const suffix = allowedHost.slice(1);
      if (hostname.endsWith(suffix) && hostname.length > suffix.length) {
        return true;
      }
    }
  }

  return false;
}

function isScriptNodeEnabled(): boolean {
  return toBoolean(process.env.ALLOW_SCRIPT_NODES);
}

function ensureScriptNodeEnabled(node: { id: string; type: string }): void {
  if (isScriptNodeEnabled()) return;
  throw new Error(
    `${node.type} node ${node.id} is disabled by default. Set ALLOW_SCRIPT_NODES=true to enable script nodes.`,
  );
}

async function ensureSafeHttpNodeUrl(url: string, nodeId: string): Promise<void> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`HTTP node ${nodeId} has an invalid URL.`);
  }

  const protocol = parsedUrl.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    throw new Error(`HTTP node ${nodeId} only supports http:// and https:// URLs.`);
  }

  const normalizedHost = normalizeHostName(parsedUrl.hostname);
  if (!normalizedHost) {
    throw new Error(`HTTP node ${nodeId} has an invalid hostname.`);
  }

  const allowlist = parseAllowedHttpHosts(process.env.HTTP_NODE_ALLOWED_HOSTS);
  if (isHttpHostAllowlisted(normalizedHost, allowlist)) {
    return;
  }

  if (toBoolean(process.env.HTTP_NODE_ALLOW_PRIVATE_NETWORK)) {
    return;
  }

  if (normalizedHost === "localhost" || normalizedHost.endsWith(".localhost")) {
    throw new Error(`HTTP node ${nodeId} blocked private host "${parsedUrl.hostname}".`);
  }

  if (isPrivateOrLocalIp(normalizedHost)) {
    throw new Error(`HTTP node ${nodeId} blocked private host "${parsedUrl.hostname}".`);
  }

  if (isIP(stripIpv6ZoneId(normalizedHost)) !== 0) {
    return;
  }

  let records: Array<{ address: string }>;
  try {
    records = await lookup(normalizedHost, { all: true, verbatim: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error || "unknown error");
    throw new Error(`HTTP node ${nodeId} failed to resolve host "${parsedUrl.hostname}": ${detail}`);
  }

  for (const record of records) {
    if (isPrivateOrLocalIp(record.address)) {
      throw new Error(`HTTP node ${nodeId} blocked private host "${parsedUrl.hostname}".`);
    }
  }
}

async function fetchWithRedirects(
  url: string,
  init: RequestInit,
  nodeId: string,
  maxRedirects = 5,
): Promise<Response> {
  let currentUrl = url;
  let method = String(init.method || "GET").toUpperCase();
  let body = init.body;

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const response = await fetch(currentUrl, { ...init, method, body, redirect: "manual" });
    const status = response.status;

    if (![301, 302, 303, 307, 308].includes(status)) {
      return response;
    }

    const location = response.headers.get("location");
    if (!location) {
      return response;
    }

    if (hop === maxRedirects) {
      throw new Error(`HTTP node ${nodeId} exceeded ${maxRedirects} redirects.`);
    }

    const nextUrl = new URL(location, currentUrl).toString();
    await ensureSafeHttpNodeUrl(nextUrl, nodeId);

    if (status === 303 || ((status === 301 || status === 302) && method !== "GET" && method !== "HEAD")) {
      method = "GET";
      body = undefined;
    }

    currentUrl = nextUrl;
  }

  return fetch(currentUrl, { ...init, method, body, redirect: "manual" });
}

function getOpenAIClient(): OpenAI {
  if (openaiClient) return openaiClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

function truncateValue(value: unknown, maxLen = 500): unknown {
  if (value === undefined) return undefined;
  let raw: string | undefined;
  try {
    raw = JSON.stringify(value);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error || "unknown error");
    return `[unserializable:${detail}]`;
  }

  if (raw === undefined) {
    return `[unserializable:${typeof value}]`;
  }

  if (raw.length <= maxLen) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return `${raw.slice(0, maxLen)}... [truncated]`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "y") return true;
    if (normalized === "false" || normalized === "0" || normalized === "no" || normalized === "n" || normalized === "off")
      return false;
  }
  return Boolean(value);
}

function hasValue(arr: unknown[], value: unknown): boolean {
  if (arr.includes(value)) return true;
  const target = safeJsonStringify(value);
  if (!target) return false;
  return arr.some((item) => safeJsonStringify(item) === target);
}

function buildEdgeLookup(edges: Array<{ sourceId: string; sourcePort: string; targetId: string }>) {
  const lookup = new Map<string, Map<string, string[]>>();

  for (const edge of edges) {
    let byPort = lookup.get(edge.sourceId);
    if (!byPort) {
      byPort = new Map();
      lookup.set(edge.sourceId, byPort);
    }

    const targets = byPort.get(edge.sourcePort) || [];
    targets.push(edge.targetId);
    byPort.set(edge.sourcePort, targets);
  }

  return lookup;
}

function pickNextTarget(
  edgeLookup: Map<string, Map<string, string[]>>,
  sourceId: string,
  preferredPort: string,
): { nextId?: string; fanout: number } {
  const byPort = edgeLookup.get(sourceId);
  if (!byPort) return { nextId: undefined, fanout: 0 };

  const preferred = byPort.get(preferredPort);
  if (preferred && preferred.length > 0) {
    return { nextId: preferred[0], fanout: preferred.length };
  }

  const fallback = byPort.get("next");
  if (fallback && fallback.length > 0) {
    return { nextId: fallback[0], fanout: fallback.length };
  }

  for (const targets of byPort.values()) {
    if (targets.length > 0) {
      return { nextId: targets[0], fanout: targets.length };
    }
  }

  return { nextId: undefined, fanout: 0 };
}

async function executeNode(
  node: { id: string; type: string; config: Record<string, unknown> },
  context: ExecutionContext,
  state: RuntimeState,
  onEvent: ExecuteRunOptions["onEvent"],
): Promise<{ port?: string; stop?: boolean; output?: unknown }> {
  const cfg = node.config;

  if (node.type === "start") {
    return { port: "next" };
  }

  if (node.type === "end") {
    const returnExpr = asString(cfg.returnExpr, "").trim();
    if (returnExpr) {
      context.output = evaluateExpression(returnExpr, context);
    } else {
      context.output = context.last;
    }
    return { stop: true, output: context.output };
  }

  if (node.type === "set_var") {
    const varName = asString(cfg.varName, "").trim();
    const expr = asString(cfg.expression, "").trim();
    let value: unknown;

    if (expr) {
      value = evaluateExpression(expr, context);
    } else {
      value = renderTemplateValue(cfg.value, context);
    }

    if (varName) {
      context.vars[varName] = value;
    }

    context.last = value;
    return { port: "next" };
  }

  if (node.type === "transform") {
    const expression = asString(cfg.expression, "last").trim();
    const value = evaluateExpression(expression, context);
    const storeAs = asString(cfg.storeAs, "").trim();

    if (storeAs) {
      context.vars[storeAs] = value;
    }

    context.last = value;
    return { port: "next" };
  }

  if (node.type === "log") {
    const message = interpolateString(asString(cfg.message, "{{json last}}"), context);
    await onEvent({
      type: "node_log",
      nodeId: node.id,
      nodeType: node.type,
      detail: { message },
    });
    context.last = message;
    return { port: "next" };
  }

  if (node.type === "template") {
    const template = asString(cfg.template, "").trim();
    const rendered = interpolateString(template, context);
    const output = toBoolean(cfg.parseJson) ? parseUnknownJson(rendered) : rendered;

    const storeAs = asString(cfg.storeAs, "").trim();
    if (storeAs) {
      context.vars[storeAs] = output;
    }

    context.last = output;
    return { port: "next" };
  }

  if (node.type === "delay") {
    const msExpr = asString(cfg.msExpr, "").trim();
    const msRaw = msExpr ? evaluateExpression(msExpr, context) : cfg.ms;
    const ms = Math.max(0, Math.floor(asNumber(msRaw, 0)));

    await sleep(ms);

    const result = { delayedMs: ms };
    const storeAs = asString(cfg.storeAs, "").trim();
    if (storeAs) {
      context.vars[storeAs] = result;
    }

    context.last = result;
    return { port: "next" };
  }

  if (node.type === "assert") {
    const condition = asString(cfg.condition, "false").trim();
    const passed = Boolean(evaluateExpression(condition, context));
    if (!passed) {
      const messageTpl = asString(cfg.message, "Assertion failed");
      const message = interpolateString(messageTpl, context);
      throw new Error(`Assert node ${node.id}: Assertion failed: ${message}`);
    }

    context.last = { passed: true, condition };
    return { port: "next" };
  }

  if (node.type === "json_parse") {
    const sourceExpr = asString(cfg.sourceExpr, "last").trim();
    const source = sourceExpr ? evaluateExpression(sourceExpr, context) : context.last;
    const onError = asString(cfg.onError, "throw");

    let parsed: unknown;
    if (typeof source === "string") {
      try {
        parsed = JSON.parse(source);
      } catch (error) {
        if (onError === "null") {
          parsed = null;
        } else if (onError === "original") {
          parsed = source;
        } else {
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(`json_parse node ${node.id} failed: ${message}`);
        }
      }
    } else {
      parsed = source;
    }

    const storeAs = asString(cfg.storeAs, "").trim();
    if (storeAs) {
      context.vars[storeAs] = parsed;
    }

    context.last = parsed;
    return { port: "next" };
  }

  if (node.type === "json_stringify") {
    const sourceExpr = asString(cfg.sourceExpr, "last").trim();
    const source = sourceExpr ? evaluateExpression(sourceExpr, context) : context.last;
    const indentRaw = cfg.indent;
    const indent = indentRaw === "" ? 0 : Math.max(0, asNumber(indentRaw, 2));

    const text = safeJsonStringify(source, indent);
    const storeAs = asString(cfg.storeAs, "").trim();
    if (storeAs) {
      context.vars[storeAs] = text;
    }

    context.last = text;
    return { port: "next" };
  }

  if (node.type === "array_push") {
    const arrayVar = asString(cfg.arrayVar, "").trim();
    if (!arrayVar) {
      throw new Error(`array_push node ${node.id} requires arrayVar.`);
    }

    const valueExpr = asString(cfg.valueExpr, "last").trim();
    const value = valueExpr ? evaluateExpression(valueExpr, context) : context.last;

    const existing = context.vars[arrayVar];
    let arr: unknown[];

    if (existing === undefined) {
      arr = [];
    } else if (Array.isArray(existing)) {
      arr = existing;
    } else {
      throw new Error(`array_push node ${node.id}: vars.${arrayVar} is not an array.`);
    }

    const unique = toBoolean(cfg.unique);
    if (!unique || !hasValue(arr, value)) {
      arr.push(value);
    }

    const maxLengthRaw = cfg.maxLength;
    if (maxLengthRaw !== undefined && maxLengthRaw !== null && maxLengthRaw !== "") {
      const maxLength = asNumber(maxLengthRaw, 0);
      if (maxLength > 0 && arr.length > maxLength) {
        arr.splice(0, arr.length - maxLength);
      }
    }

    context.vars[arrayVar] = arr;
    context.last = arr;
    return { port: "next" };
  }

  if (node.type === "http") {
    const method = asString(cfg.method, "GET").toUpperCase();
    const urlRaw = asString(cfg.url, "").trim();
    if (!urlRaw) {
      throw new Error(`HTTP node ${node.id} missing URL.`);
    }

    const url = interpolateString(urlRaw, context);
    await ensureSafeHttpNodeUrl(url, node.id);
    const headersIn = asObject(renderTemplateValue(cfg.headers, context));
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(headersIn)) {
      headers[k] = String(v);
    }

    let body: unknown = renderTemplateValue(cfg.body, context);
    body = parseUnknownJson(body);

    const init: RequestInit = { method, headers };
    if (method !== "GET" && method !== "HEAD" && body !== undefined && body !== null && body !== "") {
      if (typeof body === "string") {
        init.body = body;
      } else {
        if (!headers["Content-Type"] && !headers["content-type"]) {
          headers["Content-Type"] = "application/json";
        }
        init.body = JSON.stringify(body);
      }
    }

    const timeoutMs = asNumber(cfg.timeoutMs, 15000);
    const timeoutEnabled = Number.isFinite(timeoutMs) && timeoutMs > 0;
    const controller = timeoutEnabled ? new AbortController() : undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (controller) {
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      init.signal = controller.signal;
    }

    let response: Response;
    try {
      response = await fetchWithRedirects(url, init, node.id);
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (controller?.signal.aborted) {
        throw new Error(`HTTP node ${node.id} request timed out after ${timeoutMs}ms.`);
      }
      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
    const contentType = response.headers.get("content-type") || "";
    let data: unknown;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    const result = {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      data,
    };

    const storeAs = asString(cfg.storeAs, "").trim();
    if (storeAs) {
      context.vars[storeAs] = result;
    }

    context.last = result;
    return { port: "next" };
  }

  if (node.type === "openai_structured") {
    const model = asString(cfg.model, "gpt-4.1-mini");
    const schemaName = asString(cfg.schemaName, "flow_schema");
    const schemaRaw = parseUnknownJson(cfg.schema);
    if (!isPlainObject(schemaRaw)) {
      throw new Error(`OpenAI node ${node.id} requires a valid JSON schema object.`);
    }

    const fallbackSystem =
      asString(context.vars.__agentInstruction, "").trim() || "You are a JSON API.";
    const systemPrompt = interpolateString(asString(cfg.systemPrompt, fallbackSystem), context);
    const defaultUserPrompt = JSON.stringify(context.input ?? {}, null, 2);
    const userPrompt = interpolateString(asString(cfg.userPrompt, defaultUserPrompt), context);

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: schemaName,
          strict: true,
          schema: schemaRaw,
        },
      } as never,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error(`OpenAI node ${node.id} returned empty content.`);
    }

    const parsed = JSON.parse(content);
    const storeAs = asString(cfg.storeAs, "").trim();
    if (storeAs) {
      context.vars[storeAs] = parsed;
    }

    context.last = parsed;
    return { port: "next" };
  }

  if (node.type === "if") {
    const condition = asString(cfg.condition, "false").trim();
    const passed = Boolean(evaluateExpression(condition, context));
    context.last = { condition, passed };
    return { port: passed ? "true" : "false" };
  }

  if (node.type === "while") {
    const key = node.id;
    const count = state.whileCounts[key] || 0;
    const maxIterations = asNumber(cfg.maxIterations, 50);

    if (count >= maxIterations) {
      delete state.whileCounts[key];
      context.last = { doneReason: "maxIterations", maxIterations };
      return { port: "done" };
    }

    const condition = asString(cfg.condition, "false").trim();
    const passed = Boolean(evaluateExpression(condition, context));
    if (!passed) {
      delete state.whileCounts[key];
      context.last = { doneReason: "conditionFalse", iteration: count };
      return { port: "done" };
    }

    state.whileCounts[key] = count + 1;
    context.vars.__whileIteration = state.whileCounts[key];
    context.last = { iteration: state.whileCounts[key], condition };
    return { port: "loop" };
  }

  if (node.type === "for_each") {
    const key = node.id;
    let entry = state.forEach[key];

    if (!entry) {
      const itemsExpr = asString(cfg.itemsExpr, "[]").trim();
      const resolved = evaluateExpression(itemsExpr, context);
      if (!Array.isArray(resolved)) {
        throw new Error(`for_each node ${node.id} expression must return an array.`);
      }

      entry = {
        index: 0,
        items: resolved,
      };
      state.forEach[key] = entry;
    }

    if (entry.index >= entry.items.length) {
      delete state.forEach[key];
      context.last = {
        doneReason: "exhausted",
        count: entry.items.length,
      };
      return { port: "done" };
    }

    const itemVar = asString(cfg.itemVar, "item").trim();
    const indexVar = asString(cfg.indexVar, "index").trim();
    const item = entry.items[entry.index];

    context.vars[itemVar] = item;
    context.vars[indexVar] = entry.index;
    context.last = item;

    entry.index += 1;
    return { port: "loop" };
  }

  if (node.type === "python_script") {
    ensureScriptNodeEnabled(node);

    const code = asString(cfg.code, "").trim();
    if (!code) throw new Error(`Python node ${node.id}: code is empty.`);

    const timeoutMs = Math.max(100, asNumber(cfg.timeout, 10000));
    const inputJson = JSON.stringify({ input: context.input, vars: context.vars, last: context.last });

    const wrappedCode = [
      "import json, sys",
      "ctx = json.loads(sys.stdin.read())",
      'input_val = ctx["input"]',
      'vars_val = ctx["vars"]',
      'last_val = ctx["last"]',
      "input = input_val",
      "vars = vars_val",
      "last = last_val",
      "result = None",
      code,
      "print(json.dumps(result))",
    ].join("\n");

    const { spawnSync } = await import("node:child_process");
    const proc = spawnSync("python3", ["-c", wrappedCode], {
      input: inputJson,
      timeout: timeoutMs,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });

    if (proc.error) {
      throw new Error(`Python node ${node.id}: ${proc.error.message}`);
    }
    if (proc.status !== 0) {
      const stderr = (proc.stderr || "").trim();
      throw new Error(`Python node ${node.id} exited with code ${proc.status}: ${stderr}`);
    }

    const stdout = (proc.stdout || "").trim();
    const parsed = stdout ? JSON.parse(stdout) : null;
    const storeAs = asString(cfg.storeAs, "").trim();
    if (storeAs) context.vars[storeAs] = parsed;
    context.last = parsed;
    return { port: "next" };
  }

  if (node.type === "typescript_script") {
    ensureScriptNodeEnabled(node);

    const code = asString(cfg.code, "").trim();
    if (!code) throw new Error(`TypeScript node ${node.id}: code is empty.`);

    const timeoutMs = Math.max(50, asNumber(cfg.timeout, 5000));

    const wrappedCode = `(function() { ${code}\n; return typeof result !== 'undefined' ? result : undefined; })()`;
    const vm = await import("node:vm");
    const script = new vm.Script(wrappedCode);

    const sandbox = {
      input: context.input,
      vars: context.vars,
      last: context.last,
      output: context.output,
      Math, Date, JSON, Number, String, Boolean, Array, Object,
      console: { log: (...args: unknown[]) => args.map((a) => typeof a === "string" ? a : JSON.stringify(a)).join(" ") },
    };

    const vmContext = vm.createContext(sandbox, { codeGeneration: { strings: false, wasm: false } });
    const result = script.runInContext(vmContext, { timeout: timeoutMs });

    const storeAs = asString(cfg.storeAs, "").trim();
    if (storeAs) context.vars[storeAs] = result;
    context.last = result;
    return { port: "next" };
  }

  throw new Error(`Unsupported node type: ${node.type}`);
}

export async function executeFlowRun(options: ExecuteRunOptions): Promise<unknown> {
  const compiled = compileDrawflow(options.flow.id, options.flow.name, options.flow.drawflow);
  const edgeLookup = buildEdgeLookup(compiled.edges);
  const maxSteps = options.maxSteps ?? 500;
  const seededVars: Record<string, unknown> = { ...(options.initialVars || {}) };

  const instruction = options.agentInstruction?.trim();
  if (instruction) {
    seededVars.__agentInstruction = instruction;
  }

  const context: ExecutionContext = {
    input: options.input,
    vars: seededVars,
    last: options.input,
  };

  const state: RuntimeState = {
    whileCounts: {},
    forEach: {},
  };

  let step = 0;
  let currentId: string | undefined = compiled.entryNodeId;
  let lastNode: { id: string; type: string } | undefined;

  await options.onEvent({
    type: "run_started",
    detail: {
      flowId: compiled.id,
      flowName: compiled.name,
      at: nowIso(),
    },
  });

  try {
    while (currentId) {
      step += 1;
      if (step > maxSteps) {
        throw new Error(`Execution exceeded maxSteps=${maxSteps}.`);
      }

      const node = compiled.nodes[currentId];
      if (!node) {
        throw new Error(`Node ${currentId} not found in compiled flow.`);
      }
      lastNode = { id: node.id, type: node.type };

      await options.onEvent({
        type: "node_started",
        nodeId: node.id,
        nodeType: node.type,
        detail: {
          step,
          vars: truncateValue(context.vars),
        },
      });

      const result = await executeNode(node, context, state, options.onEvent);
      const chosenPort = result.port || "next";

      await options.onEvent({
        type: "node_completed",
        nodeId: node.id,
        nodeType: node.type,
        detail: {
          step,
          port: chosenPort,
          last: truncateValue(context.last),
        },
      });

      if (result.stop) {
        const out = result.output ?? context.output ?? context.last;
        await options.onEvent({
          type: "run_completed",
          detail: {
            output: truncateValue(out),
          },
        });
        return out;
      }

      const { nextId, fanout } = pickNextTarget(edgeLookup, node.id, chosenPort);
      if (!nextId) {
        const out = context.output ?? context.last;
        await options.onEvent({
          type: "run_completed",
          detail: {
            output: truncateValue(out),
            reason: "no_next_edge",
          },
        });
        return out;
      }

      if (fanout > 1) {
        await options.onEvent({
          type: "node_log",
          nodeId: node.id,
          nodeType: node.type,
          detail: {
            message: `Port fanout is ${fanout}; selecting first target ${nextId}.`,
          },
        });
      }

      currentId = nextId;
    }

    await options.onEvent({
      type: "run_completed",
      detail: {
        output: truncateValue(context.output ?? context.last),
        reason: "graph_ended",
      },
    });
    return context.output ?? context.last;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    try {
      await options.onEvent({
        type: "run_failed",
        nodeId: lastNode?.id,
        nodeType: lastNode?.type,
        detail: {
          step,
          at: nowIso(),
          error: message,
        },
      });
    } catch {
      // Swallow event emission failures; preserve the original error.
    }
    throw error;
  }
}
