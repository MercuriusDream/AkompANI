(() => {
  const STORAGE = {
    llmProviders: "akompani_llm_provider_profiles_v2",
    llmProviderKeys: "akompani_llm_provider_keys_v2",
    llmActiveProviderId: "akompani_llm_active_provider_id_v2",
    llmLegacyMigrated: "akompani_llm_legacy_migrated_v2",
    llmEndpointLegacy: "akompani_llm_endpoint",
    llmModelLegacy: "akompani_llm_model",
    llmApiKeyLegacy: "akompani_llm_api_key",
    llmApiKeyLegacyOpenAi: "akompani_openai_key",
  };

  const PROVIDER_PRESETS = [
    {
      id: "openai",
      name: "OpenAI",
      baseUrl: "https://api.openai.com",
      path: "/v1/chat/completions",
      models: ["gpt-4.1", "gpt-4.1-mini", "gpt-4o-mini"],
    },
    {
      id: "openrouter",
      name: "OpenRouter",
      baseUrl: "https://openrouter.ai/api",
      path: "/v1/chat/completions",
      models: ["openai/gpt-4.1", "anthropic/claude-3.7-sonnet", "google/gemini-2.0-flash-001"],
    },
    {
      id: "groq",
      name: "Groq",
      baseUrl: "https://api.groq.com",
      path: "/openai/v1/chat/completions",
      models: ["llama-3.3-70b-versatile", "deepseek-r1-distill-llama-70b", "qwen-2.5-32b"],
    },
    {
      id: "xai",
      name: "xAI",
      baseUrl: "https://api.x.ai",
      path: "/v1/chat/completions",
      models: ["grok-4", "grok-3-mini", "grok-2-vision"],
    },
    {
      id: "mistral",
      name: "Mistral",
      baseUrl: "https://api.mistral.ai",
      path: "/v1/chat/completions",
      models: ["mistral-large-latest", "mistral-small-latest", "codestral-latest"],
    },
    {
      id: "together",
      name: "Together AI",
      baseUrl: "https://api.together.xyz",
      path: "/v1/chat/completions",
      models: ["meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", "Qwen/Qwen2.5-Coder-32B-Instruct", "deepseek-ai/DeepSeek-R1"],
    },
    {
      id: "local",
      name: "Local OpenAI-Compatible",
      baseUrl: "http://localhost:11434",
      path: "/v1/chat/completions",
      models: ["llama3.2", "qwen2.5-coder", "deepseek-r1"],
    },
  ];

  const DEPLOY_TARGETS = [
    {
      id: "cloudflare_workers_elysia_bun",
      label: "Cloudflare Workers (Elysia + Wrangler + Bun)",
      platform: "cloudflare",
      runtime: "elysia-bun",
      canDirectDeploy: true,
    },
    {
      id: "vercel_elysia_bun",
      label: "Vercel (Elysia + Bun)",
      platform: "vercel",
      runtime: "elysia-bun",
      canDirectDeploy: true,
    },
    {
      id: "local_elysia_bun",
      label: "Local Environment (Elysia + Bun)",
      platform: "local",
      runtime: "elysia-bun",
      canDirectDeploy: false,
    },
    {
      id: "cloudflare_workers",
      label: "Cloudflare Workers (Module Fallback)",
      platform: "cloudflare",
      runtime: "worker-module",
      canDirectDeploy: true,
    },
  ];

  function nowIso() {
    return new Date().toISOString();
  }

  function makeId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readLocal(key) {
    try {
      return String(localStorage.getItem(key) || "");
    } catch {
      return "";
    }
  }

  function writeLocal(key, value) {
    try {
      const text = String(value || "").trim();
      if (!text) {
        localStorage.removeItem(key);
        return;
      }
      localStorage.setItem(key, text);
    } catch {
      // Ignore storage errors.
    }
  }

  function readSession(key) {
    try {
      return String(sessionStorage.getItem(key) || "");
    } catch {
      return "";
    }
  }

  function writeSession(key, value) {
    try {
      const text = String(value || "").trim();
      if (!text) {
        sessionStorage.removeItem(key);
        return;
      }
      sessionStorage.setItem(key, text);
    } catch {
      // Ignore storage errors.
    }
  }

  function readJsonArray(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeJsonArray(key, rows) {
    try {
      localStorage.setItem(key, JSON.stringify(Array.isArray(rows) ? rows : []));
    } catch {
      // Ignore storage errors.
    }
  }

  function readJsonObjectFromSession(key) {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeJsonObjectToSession(key, value) {
    try {
      const payload = value && typeof value === "object" ? value : {};
      sessionStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Ignore storage errors.
    }
  }

  function slugify(input, fallback = "provider") {
    const normalized = String(input || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");
    return normalized || fallback;
  }

  function uniqueModels(models) {
    const seen = new Set();
    const out = [];
    for (const model of Array.isArray(models) ? models : []) {
      const clean = String(model || "").trim();
      if (!clean) continue;
      if (seen.has(clean.toLowerCase())) continue;
      seen.add(clean.toLowerCase());
      out.push(clean);
    }
    return out;
  }

  function parseModelText(rawText) {
    const pieces = String(rawText || "")
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
    return uniqueModels(pieces);
  }

  function sanitizeBaseUrl(baseUrl) {
    const clean = String(baseUrl || "").trim();
    if (!clean) return "";
    return clean.replace(/\/+$/, "");
  }

  function sanitizePath(path) {
    const clean = String(path || "").trim();
    if (!clean) return "/v1/chat/completions";
    return clean.startsWith("/") ? clean : `/${clean}`;
  }

  function normalizeEndpointMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    if (normalized === "openai" || normalized === "chat" || normalized === "both") {
      return normalized;
    }
    return "both";
  }

  function joinEndpoint(baseUrl, path) {
    const root = sanitizeBaseUrl(baseUrl);
    if (!root) return "";
    return `${root}${sanitizePath(path)}`;
  }

  function normalizeProfile(profile, fallback) {
    const source = profile && typeof profile === "object" ? profile : {};
    const defaults = fallback || {};

    const name = String(source.name || defaults.name || "Custom Provider").trim() || "Custom Provider";
    const id = slugify(String(source.id || defaults.id || name), "provider");
    const baseUrl = sanitizeBaseUrl(source.baseUrl || defaults.baseUrl || "https://api.openai.com");
    const path = sanitizePath(source.path || defaults.path || "/v1/chat/completions");
    const models = uniqueModels(source.models || defaults.models || ["gpt-4.1-mini"]);
    const activeModel = String(source.activeModel || defaults.activeModel || models[0] || "").trim() || models[0] || "gpt-4.1-mini";

    return {
      id,
      name,
      baseUrl,
      path,
      endpoint: joinEndpoint(baseUrl, path),
      models,
      activeModel,
      apiKeyHeader: String(source.apiKeyHeader || defaults.apiKeyHeader || "Authorization").trim() || "Authorization",
      apiKeyPrefix:
        source.apiKeyPrefix === undefined
          ? String(defaults.apiKeyPrefix || "Bearer ")
          : String(source.apiKeyPrefix || ""),
      extraHeaders: source.extraHeaders && typeof source.extraHeaders === "object" ? source.extraHeaders : {},
      readonly: Boolean(source.readonly || defaults.readonly || false),
      source: String(source.source || defaults.source || "custom"),
      createdAt: String(source.createdAt || defaults.createdAt || nowIso()),
      updatedAt: String(source.updatedAt || nowIso()),
    };
  }

  function buildPresetProfiles() {
    return PROVIDER_PRESETS.map((preset) =>
      normalizeProfile(
        {
          ...preset,
          readonly: false,
          source: "preset",
        },
        {
          createdAt: nowIso(),
        },
      ),
    );
  }

  function findLegacyImportProfile(profiles) {
    return profiles.find((row) => row.id === "legacy-import") || null;
  }

  function migrateLegacyConfig(profiles) {
    if (readLocal(STORAGE.llmLegacyMigrated).trim() === "1") {
      return profiles;
    }

    const legacyEndpoint = readLocal(STORAGE.llmEndpointLegacy).trim();
    const legacyModel = readLocal(STORAGE.llmModelLegacy).trim();
    const legacyKey = readSession(STORAGE.llmApiKeyLegacy).trim() || readSession(STORAGE.llmApiKeyLegacyOpenAi).trim();

    if (!legacyEndpoint && !legacyModel && !legacyKey) {
      return profiles;
    }

    const endpointMatch = legacyEndpoint.match(/^(https?:\/\/[^/]+)(\/.*)$/i);
    const baseUrl = endpointMatch?.[1] || legacyEndpoint || "https://api.openai.com";
    const path = endpointMatch?.[2] || "/v1/chat/completions";
    const model = legacyModel || "gpt-4.1-mini";

    let next = [...profiles];
    const existing = findLegacyImportProfile(next);
    if (existing) {
      const idx = next.findIndex((row) => row.id === existing.id);
      next[idx] = normalizeProfile(
        {
          ...existing,
          name: "Legacy Import",
          baseUrl,
          path,
          models: uniqueModels([model, ...(existing.models || [])]),
          activeModel: model,
          source: "legacy",
          updatedAt: nowIso(),
        },
        existing,
      );
    } else {
      next.unshift(
        normalizeProfile(
          {
            id: "legacy-import",
            name: "Legacy Import",
            baseUrl,
            path,
            models: [model],
            activeModel: model,
            source: "legacy",
          },
          { createdAt: nowIso() },
        ),
      );
    }

    writeLocal(STORAGE.llmActiveProviderId, "legacy-import");
    if (legacyKey) {
      setProviderApiKey("legacy-import", legacyKey);
    }
    writeLocal(STORAGE.llmLegacyMigrated, "1");
    return next;
  }

  function ensureProviderState() {
    let profiles = readJsonArray(STORAGE.llmProviders)
      .map((row) => normalizeProfile(row))
      .filter((row) => row.id && row.baseUrl);

    if (!profiles.length) {
      profiles = buildPresetProfiles();
    }

    const presetById = new Map(PROVIDER_PRESETS.map((preset) => [preset.id, preset]));
    for (const preset of PROVIDER_PRESETS) {
      if (profiles.some((row) => row.id === preset.id)) continue;
      profiles.push(
        normalizeProfile(
          {
            ...preset,
            source: "preset",
            readonly: false,
          },
          { createdAt: nowIso() },
        ),
      );
    }

    profiles = migrateLegacyConfig(profiles);

    profiles = profiles
      .map((row) => {
        const preset = presetById.get(row.id);
        if (!preset) return normalizeProfile(row, row);
        return normalizeProfile(
          {
            ...row,
            name: row.name || preset.name,
            baseUrl: row.baseUrl || preset.baseUrl,
            path: row.path || preset.path,
            models: uniqueModels([...(row.models || []), ...(preset.models || [])]),
            source: row.source || "preset",
          },
          row,
        );
      })
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

    const activeIdRaw = readLocal(STORAGE.llmActiveProviderId).trim();
    const activeId = profiles.some((row) => row.id === activeIdRaw) ? activeIdRaw : profiles[0]?.id || "";
    if (activeId) {
      writeLocal(STORAGE.llmActiveProviderId, activeId);
    }

    writeJsonArray(STORAGE.llmProviders, profiles);
    return profiles;
  }

  function listProviders() {
    const profiles = ensureProviderState();
    const activeId = getActiveProviderId();

    return [...profiles].sort((a, b) => {
      if (a.id === activeId && b.id !== activeId) return -1;
      if (b.id === activeId && a.id !== activeId) return 1;
      return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    });
  }

  function getActiveProviderId() {
    const active = readLocal(STORAGE.llmActiveProviderId).trim();
    if (active) return active;
    const profiles = ensureProviderState();
    return profiles[0]?.id || "";
  }

  function getProviderById(providerId) {
    const id = String(providerId || "").trim();
    if (!id) return null;
    const profiles = ensureProviderState();
    return profiles.find((row) => row.id === id) || null;
  }

  function getActiveProvider() {
    const activeId = getActiveProviderId();
    return getProviderById(activeId);
  }

  function persistProviders(nextProfiles) {
    const normalized = (Array.isArray(nextProfiles) ? nextProfiles : [])
      .map((row) => normalizeProfile(row))
      .filter((row) => row.id && row.baseUrl)
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

    writeJsonArray(STORAGE.llmProviders, normalized);

    const active = readLocal(STORAGE.llmActiveProviderId).trim();
    if (!normalized.some((row) => row.id === active)) {
      writeLocal(STORAGE.llmActiveProviderId, normalized[0]?.id || "");
    }

    syncLegacyFromActive();
    return normalized;
  }

  function upsertProvider(input) {
    const payload = input && typeof input === "object" ? input : {};
    const profiles = ensureProviderState();

    const requestedId = slugify(payload.id || payload.name || makeId("provider"), "provider");
    const existing = profiles.find((row) => row.id === requestedId) || null;
    const next = normalizeProfile(
      {
        ...existing,
        ...payload,
        id: requestedId,
        models: uniqueModels(payload.models || existing?.models || ["gpt-4.1-mini"]),
        updatedAt: nowIso(),
      },
      {
        id: requestedId,
        createdAt: existing?.createdAt || nowIso(),
      },
    );

    const nextRows = profiles.filter((row) => row.id !== requestedId);
    nextRows.unshift(next);
    persistProviders(nextRows);
    return next;
  }

  function removeProvider(providerId) {
    const id = String(providerId || "").trim();
    if (!id) return false;

    const profiles = ensureProviderState();
    if (profiles.length <= 1) {
      return false;
    }

    const nextRows = profiles.filter((row) => row.id !== id);
    if (nextRows.length === profiles.length) {
      return false;
    }

    persistProviders(nextRows);

    const keyMap = readJsonObjectFromSession(STORAGE.llmProviderKeys);
    if (keyMap[id]) {
      delete keyMap[id];
      writeJsonObjectToSession(STORAGE.llmProviderKeys, keyMap);
    }

    return true;
  }

  function setActiveProvider(providerId) {
    const id = String(providerId || "").trim();
    if (!id) return false;
    const provider = getProviderById(id);
    if (!provider) return false;
    writeLocal(STORAGE.llmActiveProviderId, provider.id);
    syncLegacyFromActive();
    return true;
  }

  function setProviderModels(providerId, models, activeModel) {
    const provider = getProviderById(providerId);
    if (!provider) return null;

    const normalizedModels = uniqueModels(models);
    const finalModels = normalizedModels.length ? normalizedModels : provider.models;
    const nextActive =
      String(activeModel || "").trim() ||
      (finalModels.includes(provider.activeModel) ? provider.activeModel : finalModels[0]) ||
      "gpt-4.1-mini";

    return upsertProvider({
      ...provider,
      models: finalModels,
      activeModel: nextActive,
      updatedAt: nowIso(),
    });
  }

  function setProviderActiveModel(providerId, model) {
    const provider = getProviderById(providerId);
    const nextModel = String(model || "").trim();
    if (!provider || !nextModel) return null;

    const nextModels = uniqueModels([nextModel, ...(provider.models || [])]);
    return upsertProvider({
      ...provider,
      models: nextModels,
      activeModel: nextModel,
      updatedAt: nowIso(),
    });
  }

  function setProviderApiKey(providerId, apiKey) {
    const id = String(providerId || "").trim();
    if (!id) return;

    const keyMap = readJsonObjectFromSession(STORAGE.llmProviderKeys);
    const clean = String(apiKey || "").trim();
    if (!clean) {
      delete keyMap[id];
    } else {
      keyMap[id] = clean;
    }
    writeJsonObjectToSession(STORAGE.llmProviderKeys, keyMap);

    const active = readLocal(STORAGE.llmActiveProviderId).trim();
    if (active === id) {
      syncLegacyFromActive();
    }
  }

  function getProviderApiKey(providerId) {
    const id = String(providerId || "").trim();
    if (!id) return "";

    const keyMap = readJsonObjectFromSession(STORAGE.llmProviderKeys);
    const direct = String(keyMap[id] || "").trim();
    if (direct) return direct;

    const activeId = getActiveProviderId();
    if (activeId === id) {
      return readSession(STORAGE.llmApiKeyLegacy).trim() || readSession(STORAGE.llmApiKeyLegacyOpenAi).trim();
    }

    return "";
  }

  function buildProviderHeaders(provider, apiKey) {
    const headerName = String(provider?.apiKeyHeader || "Authorization").trim() || "Authorization";
    const prefix = String(provider?.apiKeyPrefix || "");
    const headers = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers[headerName] = `${prefix}${apiKey}`;
    }

    const extra = provider?.extraHeaders && typeof provider.extraHeaders === "object" ? provider.extraHeaders : {};
    for (const [key, value] of Object.entries(extra)) {
      const cleanKey = String(key || "").trim();
      const cleanValue = String(value || "").trim();
      const lowered = cleanKey.toLowerCase();
      if (lowered === "__proto__" || lowered === "constructor" || lowered === "prototype") continue;
      if (!cleanKey || !cleanValue) continue;
      headers[cleanKey] = cleanValue;
    }

    return headers;
  }

  function getActiveLlmConfig() {
    const provider = getActiveProvider();
    if (!provider) {
      return {
        providerId: "",
        providerName: "",
        endpoint: "",
        model: "",
        apiKey: "",
        authHeader: "Authorization",
        authPrefix: "Bearer ",
        extraHeaders: {},
        headers: { "Content-Type": "application/json" },
      };
    }

    const endpoint = joinEndpoint(provider.baseUrl, provider.path);
    const model = String(provider.activeModel || provider.models?.[0] || "").trim();
    const apiKey = getProviderApiKey(provider.id);
    const authHeader = String(provider.apiKeyHeader || "Authorization").trim() || "Authorization";
    const authPrefix = typeof provider.apiKeyPrefix === "string" ? provider.apiKeyPrefix : "Bearer ";
    const extraHeaders = {};
    const sourceExtraHeaders = provider.extraHeaders && typeof provider.extraHeaders === "object" ? provider.extraHeaders : {};
    for (const [key, value] of Object.entries(sourceExtraHeaders)) {
      const cleanKey = String(key || "").trim();
      const cleanValue = String(value || "").trim();
      const lowered = cleanKey.toLowerCase();
      if (!cleanKey || !cleanValue) continue;
      if (lowered === "__proto__" || lowered === "constructor" || lowered === "prototype") continue;
      extraHeaders[cleanKey] = cleanValue;
    }

    return {
      providerId: provider.id,
      providerName: provider.name,
      endpoint,
      model,
      apiKey,
      authHeader,
      authPrefix,
      extraHeaders,
      headers: buildProviderHeaders(provider, apiKey),
    };
  }

  function syncLegacyFromActive() {
    const provider = getActiveProvider();
    if (!provider) return;

    const endpoint = joinEndpoint(provider.baseUrl, provider.path);
    const model = String(provider.activeModel || provider.models?.[0] || "").trim();
    const apiKey = getProviderApiKey(provider.id);

    writeLocal(STORAGE.llmEndpointLegacy, endpoint);
    writeLocal(STORAGE.llmModelLegacy, model);
    writeSession(STORAGE.llmApiKeyLegacy, apiKey);
  }

  function formatDateForSlug(date = new Date()) {
    return date.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  }

  function summarizeFlow(drawflow) {
    const data = drawflow?.drawflow?.Home?.data;
    const nodes = data && typeof data === "object" ? Object.values(data) : [];
    const byType = {};
    for (const node of nodes) {
      const type = String(node?.name || "unknown");
      byType[type] = Number(byType[type] || 0) + 1;
    }

    return {
      nodeCount: nodes.length,
      nodeTypes: Object.keys(byType).sort(),
      nodeTypeCounts: byType,
    };
  }

  function buildSharedAgenticRuntimeSource(options = {}) {
    const drawflow = options.drawflow || { drawflow: { Home: { data: {} } } };
    const summary = summarizeFlow(drawflow);
    const providerConfig = options.providerConfig || {};
    const endpointMode = normalizeEndpointMode(options.endpointMode || "both");
    const defaultAuthHeader = String(providerConfig.authHeader || "Authorization").trim() || "Authorization";
    const defaultAuthPrefix = typeof providerConfig.authPrefix === "string" ? providerConfig.authPrefix : "Bearer ";
    const defaultExtraHeaders = {};
    const sourceExtraHeaders =
      providerConfig.extraHeaders && typeof providerConfig.extraHeaders === "object" ? providerConfig.extraHeaders : {};
    for (const [key, value] of Object.entries(sourceExtraHeaders)) {
      const cleanKey = String(key || "").trim();
      const cleanValue = String(value || "").trim();
      const lowered = cleanKey.toLowerCase();
      if (!cleanKey || !cleanValue) continue;
      if (lowered === "__proto__" || lowered === "constructor" || lowered === "prototype") continue;
      defaultExtraHeaders[cleanKey] = cleanValue;
    }

    return `import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

const FLOW = ${JSON.stringify(drawflow, null, 2)};
const FLOW_SUMMARY = ${JSON.stringify(summary, null, 2)};
const AGENT_NAME = ${JSON.stringify(String(options.agentName || "Agent Builder Runtime"))};
const AGENT_DESCRIPTION = ${JSON.stringify(String(options.description || ""))};
const DEFAULT_LLM_ENDPOINT = ${JSON.stringify(String(providerConfig.endpoint || ""))};
const DEFAULT_LLM_MODEL = ${JSON.stringify(String(providerConfig.model || ""))};
const DEFAULT_LLM_AUTH_HEADER = ${JSON.stringify(defaultAuthHeader)};
const DEFAULT_LLM_AUTH_PREFIX = ${JSON.stringify(defaultAuthPrefix)};
const DEFAULT_LLM_EXTRA_HEADERS = ${JSON.stringify(defaultExtraHeaders, null, 2)};
const ENDPOINT_MODE = ${JSON.stringify(endpointMode)};

function readEnvValue(source, key) {
  if (source && typeof source === "object" && typeof source[key] === "string") {
    return String(source[key]).trim();
  }

  try {
    if (typeof process !== "undefined" && process?.env && typeof process.env[key] === "string") {
      return String(process.env[key]).trim();
    }
  } catch {
    // Ignore process env errors.
  }

  return "";
}

function isAllowedEndpoint(endpoint) {
  const value = String(endpoint || "").trim();
  if (!value) return false;
  if (value.startsWith("https://")) return true;
  if (value.startsWith("http://localhost") || value.startsWith("http://127.0.0.1")) return true;
  return false;
}

function hasWorkerAccess(headers, envSource) {
  const required = readEnvValue(envSource, "WORKER_AUTH_TOKEN");
  if (!required) return true;
  const provided = String(headers.get("x-worker-token") || "").trim();
  return provided && provided === required;
}

function hasFlowDebugAccess(headers, envSource) {
  const required = readEnvValue(envSource, "FLOW_DEBUG_TOKEN");
  if (!required) return false;
  const provided = String(headers.get("x-debug-token") || "").trim();
  return provided && provided === required;
}

function hasOpenAiEndpoint() {
  return ENDPOINT_MODE === "openai" || ENDPOINT_MODE === "both";
}

function hasChatWebUiEndpoint() {
  return ENDPOINT_MODE === "chat" || ENDPOINT_MODE === "both";
}

function normalizeHeaderMap(source) {
  const result = {};
  if (!source || typeof source !== "object") return result;
  for (const [key, value] of Object.entries(source)) {
    const cleanKey = String(key || "").trim();
    const cleanValue = String(value || "").trim();
    const lowered = cleanKey.toLowerCase();
    if (!cleanKey || !cleanValue) continue;
    if (lowered === "__proto__" || lowered === "constructor" || lowered === "prototype") continue;
    result[cleanKey] = cleanValue;
  }
  return result;
}

function parseEnvHeaders(raw) {
  const value = String(raw || "").trim();
  if (!value) return {};
  try {
    return normalizeHeaderMap(JSON.parse(value));
  } catch {
    return {};
  }
}

function buildLlmRequestHeaders(envSource, apiKey) {
  const authHeader = readEnvValue(envSource, "LLM_AUTH_HEADER") || DEFAULT_LLM_AUTH_HEADER || "Authorization";
  const authPrefix = readEnvValue(envSource, "LLM_AUTH_PREFIX") || DEFAULT_LLM_AUTH_PREFIX;
  const defaultExtra = normalizeHeaderMap(DEFAULT_LLM_EXTRA_HEADERS);
  const envExtra = parseEnvHeaders(readEnvValue(envSource, "LLM_EXTRA_HEADERS_JSON"));
  const headers = {
    ...defaultExtra,
    ...envExtra,
    "content-type": "application/json",
  };
  if (apiKey) {
    headers[authHeader] = String(authPrefix || "") + apiKey;
  }
  return headers;
}

function escHtml(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

function buildChatWebUiPage() {
  const safeName = escHtml(AGENT_NAME);
  const safeDesc = escHtml(AGENT_DESCRIPTION);
  return "<!doctype html><html><head><meta charset=\\"utf-8\\" /><meta name=\\"viewport\\" content=\\"width=device-width,initial-scale=1\\" /><title>" +
    safeName +
    " Chat</title><style>body{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;max-width:860px;margin:24px auto;padding:0 16px;color:#111}textarea,input,button{font:inherit}textarea{width:100%;min-height:100px;padding:10px}#log{margin-top:14px;padding:12px;border:1px solid #ddd;border-radius:10px;white-space:pre-wrap;background:#fafafa}button{padding:10px 14px;border:0;border-radius:8px;background:#111;color:#fff;cursor:pointer}small{color:#666}</style></head><body><h1>" +
    safeName +
    "</h1><p>" +
    safeDesc +
    "</p><textarea id=\\"prompt\\" placeholder=\\"Ask your agent...\\"></textarea><div style=\\"margin-top:8px\\"><button id=\\"send\\">Send</button></div><div id=\\"log\\">Ready.</div><small>Auth-enabled deployments require x-worker-token via custom client/script.</small><script>const b=document.getElementById('send');const p=document.getElementById('prompt');const log=document.getElementById('log');b.onclick=async()=>{const prompt=String(p.value||'').trim();if(!prompt){log.textContent='Enter a prompt.';return;}log.textContent='Running...';try{const r=await fetch('/invoke',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt})});const d=await r.json();log.textContent=JSON.stringify(d,null,2);}catch(e){log.textContent=String(e&&e.message||e);}};</script></body></html>";
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value ?? "");
  }
}

function clampText(value, max = 12000) {
  const text = String(value || "");
  if (text.length <= max) return text;
  return text.slice(0, max);
}

function buildPromptFromInput(input) {
  if (!input || typeof input !== "object") {
    return "Run this flow using default behavior.";
  }

  const text = String(input.prompt || input.message || "").trim();
  if (text) return text;
  return safeStringify(input);
}

async function readResponsePayload(response) {
  const raw = await response.text().catch(() => "");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function callConfiguredLlm(input, envSource) {
  const endpoint = readEnvValue(envSource, "LLM_ENDPOINT") || DEFAULT_LLM_ENDPOINT;
  const model = readEnvValue(envSource, "LLM_MODEL") || DEFAULT_LLM_MODEL;
  const apiKey = readEnvValue(envSource, "LLM_API_KEY");
  const prompt = clampText(buildPromptFromInput(input));

  if (!endpoint || !model || !apiKey) {
    return {
      mode: "static",
      note: "LLM_ENDPOINT, LLM_MODEL, and LLM_API_KEY are required for live inference.",
      prompt,
    };
  }

  if (!isAllowedEndpoint(endpoint)) {
    throw new Error("LLM endpoint must use HTTPS (or localhost in local mode).");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: buildLlmRequestHeaders(envSource, apiKey),
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "You are an agent runtime for an Elysia+Bun IDE deployment. Reply with practical execution guidance.",
          },
          {
            role: "user",
            content: JSON.stringify(
              {
                agent: AGENT_NAME,
                description: AGENT_DESCRIPTION,
                flowSummary: FLOW_SUMMARY,
                input,
                prompt,
              },
              null,
              2,
            ),
          },
        ],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error && typeof error === "object" && error.name === "AbortError") {
      throw new Error("LLM request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const payload = await readResponsePayload(response);
  const data = payload && typeof payload === "object" ? payload : null;
  if (!response.ok) {
    const detail =
      data?.error?.message ||
      data?.error ||
      (typeof payload === "string" ? payload : "") ||
      "LLM request failed (" + response.status + ")";
    throw new Error(String(detail));
  }

  let content = data?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    content = content
      .map((piece) => {
        if (typeof piece === "string") return piece;
        if (piece && typeof piece.text === "string") return piece.text;
        if (piece && typeof piece.content === "string") return piece.content;
        return "";
      })
      .join("\\n")
      .trim();
  }

  return {
    mode: "live",
    model,
    endpoint,
    reply: typeof content === "string" && content ? content : safeStringify(data || payload),
  };
}

const app = new Elysia()
  .use(
    cors({
      origin: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["*"],
    }),
  )
  .get("/health", () => ({
    ok: true,
    agent: AGENT_NAME,
    summary: FLOW_SUMMARY,
    now: new Date().toISOString(),
  }))
  .get("/flow", ({ request, set, store }) => {
    if (!hasFlowDebugAccess(request.headers, store)) {
      set.status = 401;
      return {
        error: "Unauthorized. Provide FLOW_DEBUG_TOKEN and x-debug-token.",
      };
    }

    return {
      agent: AGENT_NAME,
      description: AGENT_DESCRIPTION,
      flow: FLOW,
      summary: FLOW_SUMMARY,
    };
  })
  .get("/chat", ({ set }) => {
    if (!hasChatWebUiEndpoint()) {
      set.status = 404;
      return {
        error: "Not found.",
      };
    }
    set.headers["content-type"] = "text/html; charset=utf-8";
    return buildChatWebUiPage();
  })
  .post("/invoke", async ({ body, store, set, request }) => {
    if (!hasChatWebUiEndpoint()) {
      set.status = 404;
      return {
        ok: false,
        error: "Not found.",
      };
    }

    if (!hasWorkerAccess(request.headers, store)) {
      set.status = 401;
      return {
        ok: false,
        error: "Unauthorized. Invalid x-worker-token.",
      };
    }

    try {
      const completion = await callConfiguredLlm(body, store);
      return {
        ok: true,
        agent: AGENT_NAME,
        completion,
        summary: FLOW_SUMMARY,
      };
    } catch (error) {
      set.status = 502;
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  })
  .post("/v1/chat/completions", async ({ body, store, set, request }) => {
    if (!hasOpenAiEndpoint()) {
      set.status = 404;
      return {
        error: "Not found.",
      };
    }

    if (!hasWorkerAccess(request.headers, store)) {
      set.status = 401;
      return {
        error: "Unauthorized. Invalid x-worker-token.",
      };
    }

    try {
      const completion = await callConfiguredLlm(body, store);
      return {
        id: "chatcmpl_agent_builder",
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: completion.model || DEFAULT_LLM_MODEL || "agent-builder-sim",
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: {
              role: "assistant",
              content: completion.reply || JSON.stringify(completion),
            },
          },
        ],
      };
    } catch (error) {
      set.status = 500;
      return {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

export default app;
`;
  }

  function buildCloudflareElysiaSource(options = {}) {
    const base = buildSharedAgenticRuntimeSource(options);
    return `import { Cloudflare } from "elysia/adapter/cloudflare-worker";
${base.replace("const app = new Elysia()", "const app = new Elysia({ adapter: Cloudflare() })")}`;
  }

  function buildLocalElysiaSource(options = {}) {
    const base = buildSharedAgenticRuntimeSource(options);
    return `${base}

const port = Number(process.env.PORT || 8787);
app.listen(port);
console.log("[agent-builder] local Elysia runtime on http://localhost:" + port);
`;
  }

  function buildVercelElysiaSource(options = {}) {
    const base = buildSharedAgenticRuntimeSource(options);
    return `${base}

export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const PATCH = app.handle;
export const DELETE = app.handle;
export const OPTIONS = app.handle;
`;
  }

  function buildCloudflareWorkerModule(options = {}) {
    const drawflow = options.drawflow || { drawflow: { Home: { data: {} } } };
    const summary = summarizeFlow(drawflow);
    const providerConfig = options.providerConfig || {};
    const defaultAuthHeader = String(providerConfig.authHeader || "Authorization").trim() || "Authorization";
    const defaultAuthPrefix = typeof providerConfig.authPrefix === "string" ? providerConfig.authPrefix : "Bearer ";
    const defaultExtraHeaders = {};
    const sourceExtraHeaders =
      providerConfig.extraHeaders && typeof providerConfig.extraHeaders === "object" ? providerConfig.extraHeaders : {};
    for (const [key, value] of Object.entries(sourceExtraHeaders)) {
      const cleanKey = String(key || "").trim();
      const cleanValue = String(value || "").trim();
      const lowered = cleanKey.toLowerCase();
      if (!cleanKey || !cleanValue) continue;
      if (lowered === "__proto__" || lowered === "constructor" || lowered === "prototype") continue;
      defaultExtraHeaders[cleanKey] = cleanValue;
    }

    return `// Generated by Agent Builder IDE
// Target: Cloudflare Worker module fallback

const FLOW = ${JSON.stringify(drawflow, null, 2)};
const FLOW_SUMMARY = ${JSON.stringify(summary, null, 2)};
const AGENT_NAME = ${JSON.stringify(String(options.agentName || "Agent Builder Runtime"))};
const AGENT_DESCRIPTION = ${JSON.stringify(String(options.description || ""))};
const ENDPOINT_MODE = ${JSON.stringify(normalizeEndpointMode(options.endpointMode || "both"))};
const DEFAULT_LLM_AUTH_HEADER = ${JSON.stringify(defaultAuthHeader)};
const DEFAULT_LLM_AUTH_PREFIX = ${JSON.stringify(defaultAuthPrefix)};
const DEFAULT_LLM_EXTRA_HEADERS = ${JSON.stringify(defaultExtraHeaders, null, 2)};

function json(data, status = 200) {
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

function isAllowedEndpoint(endpoint) {
  const value = String(endpoint || "").trim();
  if (!value) return false;
  if (value.startsWith("https://")) return true;
  if (value.startsWith("http://localhost") || value.startsWith("http://127.0.0.1")) return true;
  return false;
}

function hasWorkerAccess(request, env) {
  const required = String(env.WORKER_AUTH_TOKEN || "").trim();
  if (!required) return true;
  const provided = String(request.headers.get("x-worker-token") || "").trim();
  return provided && provided === required;
}

function hasFlowAccess(request, env) {
  const required = String(env.FLOW_DEBUG_TOKEN || "").trim();
  if (!required) return false;
  const provided = String(request.headers.get("x-debug-token") || "").trim();
  return provided && provided === required;
}

function hasOpenAiEndpoint() {
  return ENDPOINT_MODE === "openai" || ENDPOINT_MODE === "both";
}

function hasChatWebUiEndpoint() {
  return ENDPOINT_MODE === "chat" || ENDPOINT_MODE === "both";
}

function normalizeHeaderMap(source) {
  const result = {};
  if (!source || typeof source !== "object") return result;
  for (const [key, value] of Object.entries(source)) {
    const cleanKey = String(key || "").trim();
    const cleanValue = String(value || "").trim();
    const lowered = cleanKey.toLowerCase();
    if (!cleanKey || !cleanValue) continue;
    if (lowered === "__proto__" || lowered === "constructor" || lowered === "prototype") continue;
    result[cleanKey] = cleanValue;
  }
  return result;
}

function parseEnvHeaders(raw) {
  const value = String(raw || "").trim();
  if (!value) return {};
  try {
    return normalizeHeaderMap(JSON.parse(value));
  } catch {
    return {};
  }
}

function buildLlmRequestHeaders(env, apiKey) {
  const authHeader = String(env.LLM_AUTH_HEADER || DEFAULT_LLM_AUTH_HEADER || "Authorization").trim() || "Authorization";
  const authPrefix = String(env.LLM_AUTH_PREFIX || DEFAULT_LLM_AUTH_PREFIX || "");
  const defaultExtra = normalizeHeaderMap(DEFAULT_LLM_EXTRA_HEADERS);
  const envExtra = parseEnvHeaders(env.LLM_EXTRA_HEADERS_JSON);
  const headers = {
    ...defaultExtra,
    ...envExtra,
    "content-type": "application/json",
  };
  if (apiKey) {
    headers[authHeader] = authPrefix + apiKey;
  }
  return headers;
}

function escHtml(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

function buildChatWebUiPage() {
  const safeName = escHtml(AGENT_NAME);
  const safeDesc = escHtml(AGENT_DESCRIPTION);
  return "<!doctype html><html><head><meta charset=\\"utf-8\\" /><meta name=\\"viewport\\" content=\\"width=device-width,initial-scale=1\\" /><title>" +
    safeName +
    " Chat</title><style>body{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;max-width:860px;margin:24px auto;padding:0 16px;color:#111}textarea,input,button{font:inherit}textarea{width:100%;min-height:100px;padding:10px}#log{margin-top:14px;padding:12px;border:1px solid #ddd;border-radius:10px;white-space:pre-wrap;background:#fafafa}button{padding:10px 14px;border:0;border-radius:8px;background:#111;color:#fff;cursor:pointer}small{color:#666}</style></head><body><h1>" +
    safeName +
    "</h1><p>" +
    safeDesc +
    "</p><textarea id=\\"prompt\\" placeholder=\\"Ask your agent...\\"></textarea><div style=\\"margin-top:8px\\"><button id=\\"send\\">Send</button></div><div id=\\"log\\">Ready.</div><small>Auth-enabled deployments require x-worker-token via custom client/script.</small><script>const b=document.getElementById('send');const p=document.getElementById('prompt');const log=document.getElementById('log');b.onclick=async()=>{const prompt=String(p.value||'').trim();if(!prompt){log.textContent='Enter a prompt.';return;}log.textContent='Running...';try{const r=await fetch('/invoke',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt})});const d=await r.json();log.textContent=JSON.stringify(d,null,2);}catch(e){log.textContent=String(e&&e.message||e);}};</script></body></html>";
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value ?? "");
  }
}

function clampText(value, max = 12000) {
  const text = String(value || "");
  if (text.length <= max) return text;
  return text.slice(0, max);
}

async function readResponsePayload(response) {
  const raw = await response.text().catch(() => "");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return json({ ok: true });
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({ ok: true, agent: AGENT_NAME, summary: FLOW_SUMMARY });
    }

    if (url.pathname === "/flow") {
      if (!hasFlowAccess(request, env)) {
        return json({ error: "Unauthorized. Provide FLOW_DEBUG_TOKEN and x-debug-token." }, 401);
      }
      return json({ flow: FLOW, summary: FLOW_SUMMARY });
    }

    if (url.pathname === "/chat") {
      if (!hasChatWebUiEndpoint()) {
        return json({ error: "Not found" }, 404);
      }
      return new Response(buildChatWebUiPage(), {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    if (url.pathname === "/" || url.pathname === "") {
      return json({
        ok: true,
        agent: AGENT_NAME,
        endpointMode: ENDPOINT_MODE,
        endpoints: [
          "/health",
          "/flow (debug token required)",
          ...(hasChatWebUiEndpoint() ? ["/chat", "/invoke"] : []),
          ...(hasOpenAiEndpoint() ? ["/v1/chat/completions"] : []),
        ],
      });
    }

    if (url.pathname === "/invoke" || url.pathname === "/v1/chat/completions") {
      const isInvokeRoute = url.pathname === "/invoke";
      const isOpenAiRoute = url.pathname === "/v1/chat/completions";

      if (isInvokeRoute && !hasChatWebUiEndpoint()) {
        return json({ error: "Not found" }, 404);
      }
      if (isOpenAiRoute && !hasOpenAiEndpoint()) {
        return json({ error: "Not found" }, 404);
      }
      if (!hasWorkerAccess(request, env)) {
        return json({ error: "Unauthorized. Invalid x-worker-token." }, 401);
      }

      let input = {};
      try {
        input = await request.json();
      } catch {
        // Keep empty input.
      }

      const endpoint = String(env.LLM_ENDPOINT || "").trim();
      const model = String(env.LLM_MODEL || "").trim();
      const apiKey = String(env.LLM_API_KEY || "").trim();

      if (!endpoint || !model || !apiKey) {
        if (isOpenAiRoute) {
          return json({ error: "Set LLM_ENDPOINT, LLM_MODEL, and LLM_API_KEY for live inference." }, 503);
        }
        return json({
          ok: true,
          mode: "static",
          note: "Set LLM_ENDPOINT, LLM_MODEL, and LLM_API_KEY for live inference.",
          input,
          summary: FLOW_SUMMARY,
        });
      }

      if (!isAllowedEndpoint(endpoint)) {
        return json({ ok: false, error: "LLM endpoint must use HTTPS (or localhost for local mode)." }, 400);
      }

      try {
        const prompt = clampText(String(input?.prompt || input?.message || safeStringify(input || {})));
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30000);
        let upstream;
        try {
          upstream = await fetch(endpoint, {
            method: "POST",
            headers: buildLlmRequestHeaders(env, apiKey),
            body: JSON.stringify({
              model,
              temperature: 0.2,
              messages: [
                {
                  role: "system",
                  content: "You are a practical runtime assistant for a flow-based agent IDE.",
                },
                {
                  role: "user",
                  content: JSON.stringify({ input, prompt, summary: FLOW_SUMMARY }, null, 2),
                },
              ],
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timer);
        }

        const payload = await readResponsePayload(upstream);
        const llmData = payload && typeof payload === "object" ? payload : { raw: String(payload || "") };
        if (!upstream.ok) {
          return json(
            {
              ok: false,
              error:
                llmData?.error?.message ||
                llmData?.error ||
                (typeof payload === "string" ? payload : "") ||
                "LLM request failed (" + upstream.status + ")",
            },
            502,
          );
        }

        if (isOpenAiRoute) {
          const contentValue =
            llmData?.choices?.[0]?.message?.content ||
            llmData?.reply ||
            safeStringify(llmData);
          return json({
            id: "chatcmpl_agent_builder",
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [
              {
                index: 0,
                finish_reason: "stop",
                message: {
                  role: "assistant",
                  content: String(contentValue || ""),
                },
              },
            ],
          });
        }

        return json({ ok: true, agent: AGENT_NAME, llm: llmData, summary: FLOW_SUMMARY });
      } catch (error) {
        if (error && typeof error === "object" && error.name === "AbortError") {
          return json(
            {
              ok: false,
              error: "LLM request timed out.",
            },
            504,
          );
        }

        return json(
          {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          },
          500,
        );
      }
    }

    return json({ error: "Not found" }, 404);
  },
};
`;
  }

  function buildPackageJson(name, targetId) {
    const scripts = {
      check: "bunx tsc --noEmit",
    };

    if (targetId === "cloudflare_workers_elysia_bun") {
      scripts.dev = "bunx wrangler dev";
      scripts.deploy = "bunx wrangler deploy";
    } else if (targetId === "vercel_elysia_bun") {
      scripts.dev = "vercel dev";
      scripts.deploy = "vercel --prod";
    } else if (targetId === "local_elysia_bun") {
      scripts.dev = "bun run src/index.ts";
      scripts.start = "bun run src/index.ts";
    } else {
      scripts.dev = "bunx wrangler dev";
      scripts.deploy = "bunx wrangler deploy";
    }

    const payload = {
      name: slugify(name, "agent-builder-runtime"),
      version: "0.1.0",
      private: true,
      type: "module",
      scripts,
      dependencies: {
        "@elysiajs/cors": "^1.4.0",
        elysia: "^1.4.7",
      },
      devDependencies: {
        typescript: "^5.8.2",
        wrangler: "^4.50.0",
      },
    };

    if (targetId === "vercel_elysia_bun") {
      payload.devDependencies.vercel = "^37.0.0";
    }

    return `${JSON.stringify(payload, null, 2)}\n`;
  }

  function buildTsconfig() {
    return `${JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          strict: true,
          skipLibCheck: true,
          types: ["bun-types"],
        },
        include: ["src/**/*.ts", "api/**/*.ts"],
      },
      null,
      2,
    )}\n`;
  }

  function buildReadme(options = {}) {
    const endpointMode = normalizeEndpointMode(options.endpointMode || "both");
    const endpointLines = ["- /health", "- /flow (requires FLOW_DEBUG_TOKEN + x-debug-token)"];
    if (endpointMode === "openai" || endpointMode === "both") {
      endpointLines.push("- /v1/chat/completions (OpenAI-style)");
    }
    if (endpointMode === "chat" || endpointMode === "both") {
      endpointLines.push("- /chat (web UI)", "- /invoke (chat submit endpoint)");
    }

    const lines = [
      "# Agent Builder Deploy Object",
      "",
      `Target: ${options.targetLabel || options.target || "unknown"}`,
      `Agent: ${options.agentName || "Unnamed Agent"}`,
      `Endpoint mode: ${endpointMode}`,
      "",
      "Generated from Agent Builder IDE.",
      "",
      "## Runtime",
      "",
      "- Elysia + Bun",
      ...endpointLines,
      "",
      "## Required env vars",
      "",
      "- LLM_ENDPOINT",
      "- LLM_MODEL",
      "- LLM_API_KEY",
      "",
      "## Optional auth env vars",
      "",
      "- WORKER_AUTH_TOKEN (protect agent invoke endpoints)",
      "- FLOW_DEBUG_TOKEN (protect /flow endpoint)",
      "",
    ];

    if (options.target === "cloudflare_workers_elysia_bun") {
      lines.push("## Deploy (Cloudflare)", "", "```bash", "bun install", "bun run deploy", "```");
    } else if (options.target === "vercel_elysia_bun") {
      lines.push("## Deploy (Vercel)", "", "```bash", "bun install", "bun run deploy", "```");
    } else if (options.target === "local_elysia_bun") {
      lines.push("## Run local", "", "```bash", "bun install", "bun run dev", "```");
    } else {
      lines.push("## Deploy", "", "```bash", "bun install", "bun run deploy", "```");
    }

    lines.push(
      "",
      "## Notes",
      "",
      "This object is generated in-browser and can be pushed to GitHub from the Deploy view.",
      "Configure secrets and auth tokens in your platform dashboard (Cloudflare/Vercel/GitHub), not in the IDE.",
      "",
    );
    return lines.join("\n");
  }

  function buildCloudflareWranglerToml(workerName) {
    const compatibilityDate = new Date().toISOString().slice(0, 10);
    return `name = "${slugify(workerName, "agent-builder-runtime")}"\nmain = "src/index.ts"\ncompatibility_date = "${compatibilityDate}"\nworkers_dev = true\n\n[vars]\nLLM_ENDPOINT = ""\nLLM_MODEL = ""\n`;
  }

  function buildVercelJson() {
    return `${JSON.stringify(
      {
        functions: {
          "api/index.ts": {
            runtime: "bun",
            maxDuration: 60,
          },
        },
        routes: [
          {
            src: "/(.*)",
            dest: "/api/index.ts",
          },
        ],
      },
      null,
      2,
    )}\n`;
  }

  function buildDeployObject(options = {}) {
    const target = String(options.target || "cloudflare_workers_elysia_bun").trim() || "cloudflare_workers_elysia_bun";
    const targetDef = DEPLOY_TARGETS.find((row) => row.id === target) || DEPLOY_TARGETS[0];
    const agentName = String(options.agentName || options.workerName || "agent-builder-runtime").trim() || "agent-builder-runtime";
    const description = String(options.description || "").trim();
    const providerConfig = options.providerConfig || getActiveLlmConfig();
    const endpointMode = normalizeEndpointMode(options.endpointMode || "both");
    const drawflow = options.drawflow || { drawflow: { Home: { data: {} } } };

    const rootDir = `${slugify(agentName, "agent-builder-runtime")}-${targetDef.id}-${formatDateForSlug(new Date())}`;
    const files = [];

    if (targetDef.id === "cloudflare_workers_elysia_bun") {
      files.push({ path: "src/index.ts", content: buildCloudflareElysiaSource({ agentName, description, drawflow, providerConfig, endpointMode }) });
      files.push({ path: "wrangler.toml", content: buildCloudflareWranglerToml(agentName) });
      files.push({ path: "package.json", content: buildPackageJson(agentName, targetDef.id) });
      files.push({ path: "tsconfig.json", content: buildTsconfig() });
      files.push({ path: "README.md", content: buildReadme({ target: targetDef.id, targetLabel: targetDef.label, agentName, endpointMode }) });
    } else if (targetDef.id === "vercel_elysia_bun") {
      files.push({ path: "api/index.ts", content: buildVercelElysiaSource({ agentName, description, drawflow, providerConfig, endpointMode }) });
      files.push({ path: "vercel.json", content: buildVercelJson() });
      files.push({ path: "package.json", content: buildPackageJson(agentName, targetDef.id) });
      files.push({ path: "tsconfig.json", content: buildTsconfig() });
      files.push({ path: "README.md", content: buildReadme({ target: targetDef.id, targetLabel: targetDef.label, agentName, endpointMode }) });
    } else if (targetDef.id === "local_elysia_bun") {
      files.push({ path: "src/index.ts", content: buildLocalElysiaSource({ agentName, description, drawflow, providerConfig, endpointMode }) });
      files.push({ path: "package.json", content: buildPackageJson(agentName, targetDef.id) });
      files.push({ path: "tsconfig.json", content: buildTsconfig() });
      files.push({ path: ".env.example", content: "LLM_ENDPOINT=\nLLM_MODEL=\nLLM_API_KEY=\nPORT=8787\n" });
      files.push({ path: "README.md", content: buildReadme({ target: targetDef.id, targetLabel: targetDef.label, agentName, endpointMode }) });
    } else {
      files.push({ path: "src/worker.js", content: buildCloudflareWorkerModule({ agentName, description, drawflow, providerConfig, endpointMode }) });
      files.push({ path: "wrangler.toml", content: buildCloudflareWranglerToml(agentName).replace('main = "src/index.ts"', 'main = "src/worker.js"') });
      files.push({ path: "README.md", content: buildReadme({ target: targetDef.id, targetLabel: targetDef.label, agentName, endpointMode }) });
    }

    return {
      id: makeId("deployobj"),
      createdAt: nowIso(),
      target: targetDef.id,
      targetLabel: targetDef.label,
      endpointMode,
      rootDir,
      files,
      summary: {
        fileCount: files.length,
        endpointMode,
        flow: summarizeFlow(drawflow),
      },
    };
  }

  function listDeployTargets() {
    return DEPLOY_TARGETS.map((row) => ({ ...row }));
  }

  function getDeployTargetById(id) {
    const key = String(id || "").trim();
    return DEPLOY_TARGETS.find((row) => row.id === key) || DEPLOY_TARGETS[0];
  }

  function ensureProviderAndReturn() {
    ensureProviderState();
    syncLegacyFromActive();
    return {
      providers: listProviders(),
      activeProviderId: getActiveProviderId(),
      activeConfig: getActiveLlmConfig(),
    };
  }

  ensureProviderState();
  syncLegacyFromActive();

  window.AKOMPANI_IDE = {
    storage: STORAGE,
    providerPresets: clone(PROVIDER_PRESETS),
    parseModelText,
    listProviders,
    getProviderById,
    getActiveProvider,
    getActiveProviderId,
    setActiveProvider,
    upsertProvider,
    removeProvider,
    setProviderModels,
    setProviderActiveModel,
    getProviderApiKey,
    setProviderApiKey,
    getActiveLlmConfig,
    buildProviderHeaders,
    listDeployTargets,
    getDeployTargetById,
    buildDeployObject,
    buildCloudflareWorkerModule,
    summarizeFlow,
    syncLegacyFromActive,
    ensureProviderAndReturn,
  };
})();
