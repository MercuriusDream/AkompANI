import vm from "node:vm";

import { ExecutionContext } from "./types";

const EXPRESSION_SCRIPT_CACHE_MAX = 128;
const expressionScriptCache = new Map<string, vm.Script>();

export function nowIso(): string {
  return new Date().toISOString();
}

export function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

export function resolvePath(path: string, context: ExecutionContext): unknown {
  const clean = path.trim();
  if (!clean) return undefined;

  const rootMap: Record<string, unknown> = {
    input: context.input,
    vars: context.vars,
    last: context.last,
    output: context.output,
  };

  const parts = clean.split(".");
  const rootName = parts.shift() as string;
  let cursor: unknown = rootMap[rootName];

  for (const part of parts) {
    if (cursor === null || cursor === undefined) return undefined;
    if (Array.isArray(cursor) && /^\d+$/.test(part)) {
      cursor = cursor[Number(part)];
      continue;
    }
    if (typeof cursor === "object") {
      cursor = (cursor as Record<string, unknown>)[part];
      continue;
    }
    return undefined;
  }

  return cursor;
}

export function interpolateString(template: string, context: ExecutionContext): string {
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, exprRaw: string) => {
    const expr = exprRaw.trim();

    if (expr.startsWith("json ")) {
      const value = resolvePath(expr.slice(5), context);
      return safeJsonStringify(value ?? null);
    }

    const value = resolvePath(expr, context);
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return safeJsonStringify(value);
    return String(value);
  });
}

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
export function safeJsonStringify(value: unknown, indent = 0): string {
  const safeIndent = Number.isFinite(indent) && indent > 0 ? Math.floor(indent) : 0;
=======
export function safeJsonStringify(value: unknown, indent?: number): string {
>>>>>>> theirs
=======
export function safeJsonStringify(value: unknown, indent?: number): string {
>>>>>>> theirs
=======
export function safeJsonStringify(value: unknown, indent?: number): string {
>>>>>>> theirs
  try {
    const seen = new WeakSet<object>();
    const json = JSON.stringify(value, (_key, val) => {
      if (typeof val === "bigint") {
        return val.toString();
      }
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
      }
      return val;
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    }, safeIndent);
=======
    }, indent);
>>>>>>> theirs
=======
    }, indent);
>>>>>>> theirs
  } catch {
    try {
      return JSON.stringify(String(value), null, safeIndent);
=======
    }, indent);
    return json ?? "null";
  } catch {
    try {
      return JSON.stringify(String(value), null, indent) ?? "null";
>>>>>>> theirs
    } catch {
      return "null";
    }
  }
}

export function renderTemplateValue<T = unknown>(value: T, context: ExecutionContext): T {
  if (typeof value === "string") {
    return interpolateString(value, context) as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => renderTemplateValue(v, context)) as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = renderTemplateValue(v, context);
    }
    return out as T;
  }
  return value;
}

function getCompiledExpressionScript(expression: string): vm.Script {
  const cached = expressionScriptCache.get(expression);
  if (cached) {
    // Touch key to keep recently used entries in the cache.
    expressionScriptCache.delete(expression);
    expressionScriptCache.set(expression, cached);
    return cached;
  }

  const compiled = new vm.Script(expression);
  expressionScriptCache.set(expression, compiled);

  if (expressionScriptCache.size > EXPRESSION_SCRIPT_CACHE_MAX) {
    const oldestKey = expressionScriptCache.keys().next().value;
    if (oldestKey !== undefined) {
      expressionScriptCache.delete(oldestKey);
    }
  }

  return compiled;
}

export function clearEvaluateExpressionCache(): void {
  expressionScriptCache.clear();
}

export function evaluateExpression<T = unknown>(expression: string, context: ExecutionContext): T {
  const script = getCompiledExpressionScript(expression);

  const sandbox = {
    input: context.input,
    vars: context.vars,
    last: context.last,
    output: context.output,
    Math,
    Date,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
  } as Record<string, unknown>;

  const vmContext = vm.createContext(sandbox, {
    codeGeneration: { strings: false, wasm: false },
  });

  return script.runInContext(vmContext, { timeout: 75 }) as T;
}

export function parseUnknownJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

export function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function asNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function asObject(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {};
}
