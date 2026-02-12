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

  function normalizeCloudflareZeroTrustMode(mode) {
    const normalized = String(mode || "")
      .trim()
      .toLowerCase();
    if (normalized === "access_jwt" || normalized === "service_token") {
      return normalized;
    }
    return "off";
  }

  function normalizeCloudflareD1BindingName(value) {
    const clean = String(value || "").trim().toUpperCase();
    if (!clean) return "DB";
    return clean
      .replace(/[^A-Z0-9_]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_+|_+$/g, "") || "DB";
  }

  function normalizeCloudflareDoBindingName(value) {
    const clean = String(value || "").trim().toUpperCase();
    if (!clean) return "AGENT_DO";
    return clean
      .replace(/[^A-Z0-9_]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_+|_+$/g, "") || "AGENT_DO";
  }

  function normalizeCloudflareDoClassName(value) {
    const raw = String(value || "").trim();
    if (!raw) return "AgentDurableObject";
    const clean = raw.replace(/[^A-Za-z0-9_$]/g, "_");
    const head = /^[A-Za-z_$]/.test(clean) ? clean : `_${clean}`;
    return head || "AgentDurableObject";
  }

  function normalizeCloudflareDeployConfig(config = {}) {
    const source = config && typeof config === "object" ? config : {};
    const mode = normalizeCloudflareZeroTrustMode(source.zeroTrustMode);
    const hasRoute = Boolean(String(source.routePattern || "").trim() && String(source.zoneId || "").trim());
    const workersDevRequested = source.workersDevEnabled !== false;
    const workersDevEnabled = mode === "access_jwt" && hasRoute ? false : workersDevRequested;

    return {
      workersDevEnabled,
      zoneId: String(source.zoneId || "").trim(),
      routePattern: String(source.routePattern || "").trim(),
      zeroTrustMode: mode,
      accessAud: String(source.accessAud || "").trim(),
      accessServiceTokenId: String(source.accessServiceTokenId || "").trim(),
      d1Binding: normalizeCloudflareD1BindingName(source.d1Binding || "DB"),
      d1DatabaseId: String(source.d1DatabaseId || "").trim(),
      d1DatabaseName: String(source.d1DatabaseName || "").trim(),
      doBinding: normalizeCloudflareDoBindingName(source.doBinding || "AGENT_DO"),
      doClassName: normalizeCloudflareDoClassName(source.doClassName || "AgentDurableObject"),
      doScriptName: String(source.doScriptName || "").trim(),
      doEnvironment: String(source.doEnvironment || "").trim(),
    };
  }

  function buildSharedAgenticRuntimeSource(options = {}) {
    const drawflow = options.drawflow || { drawflow: { Home: { data: {} } } };
    const summary = summarizeFlow(drawflow);
    const providerConfig = options.providerConfig || {};
    const cloudflareConfig = normalizeCloudflareDeployConfig(options.cloudflareConfig);
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
    const durableObjectClassName = normalizeCloudflareDoClassName(cloudflareConfig.doClassName || "AgentDurableObject");

    return `// @ts-nocheck
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

declare const process: any;
declare const Buffer: any;

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
const DEFAULT_CF_ZERO_TRUST_MODE = ${JSON.stringify(cloudflareConfig.zeroTrustMode)};
const DEFAULT_CF_ACCESS_AUD = ${JSON.stringify(cloudflareConfig.accessAud)};
const DEFAULT_CF_ACCESS_SERVICE_TOKEN_ID = ${JSON.stringify(cloudflareConfig.accessServiceTokenId)};
const DEFAULT_CF_D1_BINDING = ${JSON.stringify(cloudflareConfig.d1Binding)};
const DEFAULT_CF_D1_DATABASE_ID = ${JSON.stringify(cloudflareConfig.d1DatabaseId)};
const DEFAULT_CF_D1_DATABASE_NAME = ${JSON.stringify(cloudflareConfig.d1DatabaseName)};
const DEFAULT_CF_DO_BINDING = ${JSON.stringify(cloudflareConfig.doBinding)};
const DEFAULT_CF_DO_CLASS_NAME = ${JSON.stringify(durableObjectClassName)};
const DEFAULT_CF_DO_SCRIPT_NAME = ${JSON.stringify(cloudflareConfig.doScriptName)};
const DEFAULT_CF_DO_ENVIRONMENT = ${JSON.stringify(cloudflareConfig.doEnvironment)};
const DEFAULT_RUNTIME_SYSTEM_PROMPT = [
  "You are Agent Builder Runtime, an execution assistant for deployed flow-based agents.",
  "Priority order: (1) safety and correctness, (2) explicit tool usage when provided, (3) concise user-facing output.",
  "When tools are provided, prefer calling tools for factual or external-data tasks instead of fabricating answers.",
  "Do not expose secrets, API keys, hidden tokens, or internal headers.",
  "If a request is ambiguous, ask one focused clarification question.",
  "If constraints prevent completion, explain the exact blocker and suggest the smallest viable next step.",
  "Keep responses practical, deterministic, and deployment-friendly.",
].join("\\n");

function durableObjectJson(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export class ${durableObjectClassName} {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return durableObjectJson({
        ok: true,
        className: DEFAULT_CF_DO_CLASS_NAME,
        now: new Date().toISOString(),
      });
    }

    if (request.method !== "POST") {
      return durableObjectJson({ ok: false, error: "Method not allowed." }, 405);
    }

    let payload = {};
    try {
      payload = await request.json();
    } catch {
      // Keep empty payload.
    }

    const action = String(payload.action || payload.op || payload.mode || "echo").trim().toLowerCase();
    const key = String(payload.key || payload.name || "default").trim() || "default";

    try {
      if (action === "get") {
        const value = await this.state.storage.get(key);
        return durableObjectJson({ ok: true, action, key, value: value ?? null });
      }
      if (action === "set" || action === "put") {
        await this.state.storage.put(key, payload.value);
        return durableObjectJson({ ok: true, action: "set", key });
      }
      if (action === "delete" || action === "del") {
        await this.state.storage.delete(key);
        return durableObjectJson({ ok: true, action: "delete", key });
      }
      if (action === "list") {
        const limit = Math.max(1, Math.min(Number(payload.limit || 50) || 50, 200));
        const rows = await this.state.storage.list({ limit });
        const items = [];
        for (const [entryKey, entryValue] of rows.entries()) {
          items.push({ key: String(entryKey), value: entryValue });
        }
        return durableObjectJson({ ok: true, action: "list", items });
      }
      return durableObjectJson({
        ok: true,
        action: "echo",
        payload,
        now: new Date().toISOString(),
      });
    } catch (error) {
      return durableObjectJson(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  }
}

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

function normalizeZeroTrustMode(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "access_jwt" || normalized === "service_token") {
    return normalized;
  }
  return "off";
}

function decodeBase64Url(value) {
  const input = String(value || "").trim();
  if (!input) return "";
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  try {
    if (typeof atob === "function") {
      return atob(padded);
    }
  } catch {
    // Ignore browser decode errors.
  }
  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(padded, "base64").toString("utf8");
    }
  } catch {
    // Ignore server decode errors.
  }
  return "";
}

function parseJwtPayload(token) {
  const parts = String(token || "").split(".");
  if (parts.length < 2) return null;
  const decoded = decodeBase64Url(parts[1]);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function hasZeroTrustAccess(headers, envSource) {
  const mode = normalizeZeroTrustMode(readEnvValue(envSource, "CF_ZERO_TRUST_MODE") || DEFAULT_CF_ZERO_TRUST_MODE);
  if (mode === "off") {
    return true;
  }

  if (mode === "service_token") {
    const requiredId = readEnvValue(envSource, "CF_ACCESS_SERVICE_TOKEN_ID") || DEFAULT_CF_ACCESS_SERVICE_TOKEN_ID;
    const requiredSecret = readEnvValue(envSource, "CF_ACCESS_SERVICE_TOKEN_SECRET");
    if (!requiredId || !requiredSecret) return false;
    const incomingId = String(headers.get("cf-access-client-id") || "").trim();
    const incomingSecret = String(headers.get("cf-access-client-secret") || "").trim();
    return incomingId === requiredId && incomingSecret === requiredSecret;
  }

  const jwt = String(headers.get("cf-access-jwt-assertion") || "").trim();
  if (!jwt) return false;
  const requiredAud = readEnvValue(envSource, "CF_ACCESS_AUD") || DEFAULT_CF_ACCESS_AUD;
  if (!requiredAud) return false;
  const payload = parseJwtPayload(jwt);
  const now = Math.floor(Date.now() / 1000);
  const exp = Number(payload?.exp || 0);
  if (Number.isFinite(exp) && exp > 0 && exp <= now) return false;
  const nbf = Number(payload?.nbf || 0);
  if (Number.isFinite(nbf) && nbf > 0 && nbf > now + 30) return false;
  const aud = payload?.aud;
  if (Array.isArray(aud)) {
    return aud.map((value) => String(value || "").trim()).includes(requiredAud);
  }
  return String(aud || "").trim() === requiredAud;
}

function hasWorkerAccess(headers, envSource) {
  if (!hasZeroTrustAccess(headers, envSource)) return false;
  const required = readEnvValue(envSource, "WORKER_AUTH_TOKEN");
  if (!required) return true;
  const provided = String(headers.get("x-worker-token") || "").trim();
  return provided && provided === required;
}

function hasFlowDebugAccess(headers, envSource) {
  if (!hasZeroTrustAccess(headers, envSource)) return false;
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

function normalizeD1BindingName(value) {
  const clean = String(value || "").trim().toUpperCase();
  if (!clean) return "DB";
  return clean
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "") || "DB";
}

function resolveD1Binding(envSource) {
  const fromEnv = readEnvValue(envSource, "CF_D1_BINDING");
  const bindingName = normalizeD1BindingName(fromEnv || DEFAULT_CF_D1_BINDING || "DB");
  const candidate = envSource && typeof envSource === "object" ? envSource[bindingName] : null;
  const available = Boolean(candidate && typeof candidate.prepare === "function");
  return {
    bindingName,
    db: available ? candidate : null,
    available,
    databaseId: readEnvValue(envSource, "CF_D1_DATABASE_ID") || DEFAULT_CF_D1_DATABASE_ID || "",
    databaseName: readEnvValue(envSource, "CF_D1_DATABASE_NAME") || DEFAULT_CF_D1_DATABASE_NAME || "",
  };
}

function normalizeDoBindingName(value) {
  const clean = String(value || "").trim().toUpperCase();
  if (!clean) return "AGENT_DO";
  return clean
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "") || "AGENT_DO";
}

function normalizeDoClassName(value) {
  const raw = String(value || "").trim();
  if (!raw) return "AgentDurableObject";
  const clean = raw.replace(/[^A-Za-z0-9_$]/g, "_");
  const head = /^[A-Za-z_$]/.test(clean) ? clean : "_" + clean;
  return head || "AgentDurableObject";
}

function resolveDurableObjectBinding(envSource) {
  const fromEnv = readEnvValue(envSource, "CF_DO_BINDING");
  const bindingName = normalizeDoBindingName(fromEnv || DEFAULT_CF_DO_BINDING || "AGENT_DO");
  const candidate = envSource && typeof envSource === "object" ? envSource[bindingName] : null;
  const available = Boolean(
    candidate &&
      typeof candidate.get === "function" &&
      (typeof candidate.idFromName === "function" ||
        typeof candidate.idFromString === "function" ||
        typeof candidate.newUniqueId === "function"),
  );
  return {
    bindingName,
    namespace: available ? candidate : null,
    available,
    className: normalizeDoClassName(readEnvValue(envSource, "CF_DO_CLASS_NAME") || DEFAULT_CF_DO_CLASS_NAME || "AgentDurableObject"),
    scriptName: readEnvValue(envSource, "CF_DO_SCRIPT_NAME") || DEFAULT_CF_DO_SCRIPT_NAME || "",
    environment: readEnvValue(envSource, "CF_DO_ENVIRONMENT") || DEFAULT_CF_DO_ENVIRONMENT || "",
  };
}

function resolveDurableObjectId(namespace, input) {
  const payload = input && typeof input === "object" ? input : {};
  const explicit = String(payload.objectId || payload.id || "").trim();
  if (explicit && typeof namespace.idFromString === "function") {
    try {
      return namespace.idFromString(explicit);
    } catch {
      // Fall through to name based id.
    }
  }
  const name = String(payload.name || payload.key || "default").trim() || "default";
  if (typeof namespace.idFromName === "function") {
    return namespace.idFromName(name);
  }
  if (typeof namespace.newUniqueId === "function") {
    return namespace.newUniqueId();
  }
  throw new Error("Durable Object namespace cannot resolve object id.");
}

function normalizeDurableObjectMethod(value) {
  const method = String(value || "POST").trim().toUpperCase();
  if (method === "GET" || method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
    return method;
  }
  return "POST";
}

async function runDurableObjectRequest(input, envSource) {
  const binding = resolveDurableObjectBinding(envSource);
  if (!binding.available || !binding.namespace) {
    throw new Error("Durable Object binding \"" + binding.bindingName + "\" is unavailable.");
  }

  const payload = input && typeof input === "object" ? input : {};
  const objectId = resolveDurableObjectId(binding.namespace, payload);
  const stub = binding.namespace.get(objectId);
  if (!stub || typeof stub.fetch !== "function") {
    throw new Error("Durable Object stub fetch is unavailable.");
  }

  const method = normalizeDurableObjectMethod(payload.method);
  const pathValue = String(payload.path || payload.pathname || "/invoke").trim() || "/invoke";
  const path = pathValue.startsWith("/") ? pathValue : "/" + pathValue;
  const headers = normalizeHeaderMap(payload.headers);
  let body = null;
  if (payload.body !== undefined && payload.body !== null) {
    if (typeof payload.body === "string") {
      body = payload.body;
    } else {
      if (!headers["content-type"] && !headers["Content-Type"]) {
        headers["content-type"] = "application/json";
      }
      body = safeStringify(payload.body);
    }
  } else if (payload.json !== undefined) {
    if (!headers["content-type"] && !headers["Content-Type"]) {
      headers["content-type"] = "application/json";
    }
    body = safeStringify(payload.json);
  }

  const response = await stub.fetch("https://do" + path, {
    method,
    headers,
    ...(method === "GET" || body === null ? {} : { body }),
  });
  const text = await response.text().catch(() => "");
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    response: data !== null ? data : text,
  };
}

function normalizeD1Mode(mode) {
  const clean = String(mode || "").trim().toLowerCase();
  if (clean === "all" || clean === "first" || clean === "raw" || clean === "run") return clean;
  return "all";
}

function normalizeD1Params(params) {
  if (!Array.isArray(params)) return [];
  return params.slice(0, 64);
}

function listRuntimeEndpoints() {
  return [
    "/health",
    "/flow (requires FLOW_DEBUG_TOKEN + x-debug-token)",
    "/api (GET/POST)",
    "/api/invoke (POST)",
    "/api/db/health (GET, auth required)",
    "/api/db/query (POST, auth required)",
    "/db/health (GET, auth required)",
    "/db/query (POST, auth required)",
    "/api/do/health (GET, auth required)",
    "/api/do/invoke (POST, auth required)",
    "/do/health (GET, auth required)",
    "/do/invoke (POST, auth required)",
    ...(hasOpenAiEndpoint() ? ["/v1/models", "/v1/chat/completions"] : []),
    ...(hasChatWebUiEndpoint() ? ["/chat", "/invoke"] : []),
  ];
}

async function runD1Query(input, envSource) {
  const binding = resolveD1Binding(envSource);
  if (!binding.available || !binding.db) {
    throw new Error(`D1 binding "${binding.bindingName}" is unavailable.`);
  }

  const payload = input && typeof input === "object" ? input : {};
  const sql = String(payload.sql || payload.query || "").trim();
  if (!sql) {
    throw new Error("SQL query is required.");
  }
  if (sql.length > 20000) {
    throw new Error("SQL query exceeds max length.");
  }

  const params = normalizeD1Params(payload.params);
  const mode = normalizeD1Mode(payload.mode || payload.resultMode || "all");
  const statement = binding.db.prepare(sql).bind(...params);

  if (mode === "first") {
    const row = await statement.first();
    return { mode, row: row || null, success: true };
  }
  if (mode === "raw") {
    const raw = await statement.raw();
    return { mode, rows: raw, success: true };
  }
  if (mode === "run") {
    const result = await statement.run();
    return { mode, result, success: true };
  }

  const result = await statement.all();
  return { mode, result, rows: Array.isArray(result?.results) ? result.results : [], success: true };
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
    " Chat</title><style>body{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;max-width:900px;margin:24px auto;padding:0 16px;color:#111}textarea,input,button{font:inherit}textarea,input{width:100%;padding:10px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box}textarea{min-height:110px}#log{margin-top:14px;padding:12px;border:1px solid #ddd;border-radius:10px;white-space:pre-wrap;background:#fafafa;min-height:120px}button{padding:10px 14px;border:0;border-radius:8px;background:#111;color:#fff;cursor:pointer}small{color:#666;display:block;margin-top:8px}.row{display:grid;gap:8px;margin-top:8px}</style></head><body><h1>" +
    safeName +
    "</h1><p>" +
    safeDesc +
    "</p><div class=\\"row\\"><label for=\\"token\\"><small>Optional worker token (for WORKER_AUTH_TOKEN protected deployments)</small></label><input id=\\"token\\" placeholder=\\"x-worker-token (optional)\\" /><textarea id=\\"prompt\\" placeholder=\\"Ask your agent...\\"></textarea></div><div style=\\"margin-top:8px\\"><button id=\\"send\\">Send</button></div><div id=\\"log\\">Ready.</div><small>This UI calls /v1/chat/completions with OpenAI-style stream mode for ChatKit-compatible clients.</small><script>const b=document.getElementById('send');const p=document.getElementById('prompt');const t=document.getElementById('token');const log=document.getElementById('log');async function readSse(response){const reader=response.body&&response.body.getReader?response.body.getReader():null;if(!reader){const text=await response.text();return text||'';}const dec=new TextDecoder();let buf='';let out='';for(;;){const {done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});const parts=buf.split('\\\\n\\\\n');buf=parts.pop()||'';for(const raw of parts){const line=raw.split('\\\\n').find(l=>l.startsWith('data: '));if(!line)continue;const payload=line.slice(6).trim();if(payload==='[DONE]')continue;try{const json=JSON.parse(payload);const delta=json&&json.choices&&json.choices[0]&&json.choices[0].delta||{};if(typeof delta.content==='string')out+=delta.content;if(Array.isArray(delta.tool_calls)&&delta.tool_calls.length){out+=out?'\\\\n':'';out+='[tool_calls] '+JSON.stringify(delta.tool_calls);} }catch{} }}return out.trim();}b.onclick=async()=>{const prompt=String(p.value||'').trim();if(!prompt){log.textContent='Enter a prompt.';return;}log.textContent='Running...';try{const headers={'content-type':'application/json'};const token=String(t.value||'').trim();if(token)headers['x-worker-token']=token;const r=await fetch('/v1/chat/completions',{method:'POST',headers,body:JSON.stringify({model:'runtime-default',stream:true,messages:[{role:'user',content:prompt}]})});if(!r.ok){let err='Request failed ('+r.status+')';try{const j=await r.json();err=(j&&j.error&&j.error.message)||j&&j.error||err;}catch{}throw new Error(String(err));}const text=await readSse(r);log.textContent=text||'No response';}catch(e){log.textContent=String(e&&e.message||e);}};</script></body></html>";
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

function extractTextFromMessageContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((piece) => {
        if (typeof piece === "string") return piece;
        if (piece && typeof piece.text === "string") return piece.text;
        if (piece && typeof piece.content === "string") return piece.content;
        return "";
      })
      .join("\\n")
      .trim();
  }
  if (content && typeof content === "object") {
    return safeStringify(content);
  }
  return "";
}

function normalizeIncomingMessages(input, prompt) {
  const source = Array.isArray(input?.messages) ? input.messages : [];
  const normalized = [];
  for (const row of source) {
    if (!row || typeof row !== "object") continue;
    const role = String(row.role || "").trim();
    if (!role) continue;
    const next = { role };
    if (row.name && typeof row.name === "string") {
      next.name = row.name;
    }
    if (row.tool_call_id && typeof row.tool_call_id === "string") {
      next.tool_call_id = row.tool_call_id;
    }
    if (Array.isArray(row.tool_calls)) {
      next.tool_calls = row.tool_calls;
    }
    if (role === "assistant" || role === "user" || role === "system" || role === "tool") {
      if (row.content !== undefined) {
        next.content = row.content;
      } else if (!next.tool_calls) {
        next.content = "";
      }
      normalized.push(next);
    }
  }
  if (!normalized.length) {
    normalized.push({
      role: "user",
      content: JSON.stringify(
        {
          agent: AGENT_NAME,
          description: AGENT_DESCRIPTION,
          flowSummary: FLOW_SUMMARY,
          prompt,
          input: input || {},
        },
        null,
        2,
      ),
    });
  }
  return normalized;
}

function normalizeToolsArray(tools) {
  if (!Array.isArray(tools)) return undefined;
  const next = [];
  for (const tool of tools) {
    if (!tool || typeof tool !== "object") continue;
    if (String(tool.type || "") !== "function") continue;
    if (!tool.function || typeof tool.function !== "object") continue;
    const functionName = String(tool.function.name || "").trim();
    if (!functionName) continue;
    next.push(tool);
    if (next.length >= 32) break;
  }
  return next.length ? next : undefined;
}

function normalizeToolChoice(toolChoice) {
  if (!toolChoice) return undefined;
  if (typeof toolChoice === "string") return toolChoice;
  if (toolChoice && typeof toolChoice === "object") return toolChoice;
  return undefined;
}

function buildRuntimeSystemPrompt(input, prompt) {
  const hint = String(input?.runtimePrompt || "").trim();
  const parts = [
    DEFAULT_RUNTIME_SYSTEM_PROMPT,
    "Agent: " + AGENT_NAME,
    AGENT_DESCRIPTION ? "Agent description: " + AGENT_DESCRIPTION : "",
    "Flow summary: " + safeStringify(FLOW_SUMMARY),
    "Current user prompt: " + prompt,
    hint ? "Runtime override: " + hint : "",
  ].filter(Boolean);
  return clampText(parts.join("\\n\\n"), 12000);
}

function toFiniteNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function buildUpstreamPayload(input, resolvedModel, prompt) {
  const requestBody = input && typeof input === "object" ? input : {};
  const payload = {
    model: resolvedModel,
    messages: [
      {
        role: "system",
        content: buildRuntimeSystemPrompt(requestBody, prompt),
      },
      ...normalizeIncomingMessages(requestBody, prompt),
    ],
    temperature: toFiniteNumber(requestBody.temperature, 0.2),
  };

  if (requestBody.top_p !== undefined) payload.top_p = toFiniteNumber(requestBody.top_p, 1);
  if (requestBody.max_tokens !== undefined) payload.max_tokens = Math.max(1, Math.floor(toFiniteNumber(requestBody.max_tokens, 512)));
  if (requestBody.max_completion_tokens !== undefined && payload.max_tokens === undefined) {
    payload.max_tokens = Math.max(1, Math.floor(toFiniteNumber(requestBody.max_completion_tokens, 512)));
  }
  if (requestBody.frequency_penalty !== undefined) {
    payload.frequency_penalty = toFiniteNumber(requestBody.frequency_penalty, 0);
  }
  if (requestBody.presence_penalty !== undefined) {
    payload.presence_penalty = toFiniteNumber(requestBody.presence_penalty, 0);
  }
  if (requestBody.stop !== undefined) payload.stop = requestBody.stop;
  if (requestBody.response_format && typeof requestBody.response_format === "object") {
    payload.response_format = requestBody.response_format;
  }

  const tools = normalizeToolsArray(requestBody.tools);
  if (tools) payload.tools = tools;
  const toolChoice = normalizeToolChoice(requestBody.tool_choice);
  if (toolChoice !== undefined) payload.tool_choice = toolChoice;
  if (requestBody.parallel_tool_calls !== undefined) {
    payload.parallel_tool_calls = Boolean(requestBody.parallel_tool_calls);
  }

  return payload;
}

function normalizeCompletionMessage(message, fallbackPayload) {
  const source = message && typeof message === "object" ? message : {};
  const content = extractTextFromMessageContent(source.content);
  const toolCalls = Array.isArray(source.tool_calls) ? source.tool_calls : [];
  if (toolCalls.length) {
    return {
      role: "assistant",
      content: content || "",
      tool_calls: toolCalls,
    };
  }
  if (content) {
    return {
      role: "assistant",
      content,
    };
  }
  return {
    role: "assistant",
    content: safeStringify(fallbackPayload || {}),
  };
}

function buildOpenAiCompletionPayload(completion) {
  const created = Math.floor(Date.now() / 1000);
  const message = completion?.message || { role: "assistant", content: completion?.reply || "" };
  const finishReason = completion?.finishReason || (Array.isArray(message.tool_calls) && message.tool_calls.length ? "tool_calls" : "stop");
  const response = {
    id: "chatcmpl_agent_builder",
    object: "chat.completion",
    created,
    model: completion?.model || DEFAULT_LLM_MODEL || "agent-builder-sim",
    choices: [
      {
        index: 0,
        finish_reason: finishReason,
        message,
      },
    ],
  };
  if (completion?.usage && typeof completion.usage === "object") {
    response.usage = completion.usage;
  }
  return response;
}

function buildOpenAiStreamResponse(completion) {
  const payload = buildOpenAiCompletionPayload(completion);
  const choice = payload.choices?.[0] || {};
  const message = choice.message || {};
  const created = payload.created || Math.floor(Date.now() / 1000);
  const model = payload.model || DEFAULT_LLM_MODEL || "agent-builder-sim";
  const encoder = new TextEncoder();

  const chunks = [];
  chunks.push({
    id: payload.id,
    object: "chat.completion.chunk",
    created,
    model,
    choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }],
  });

  const hasToolCalls = Array.isArray(message.tool_calls) && message.tool_calls.length > 0;
  if (hasToolCalls) {
    chunks.push({
      id: payload.id,
      object: "chat.completion.chunk",
      created,
      model,
      choices: [{ index: 0, delta: { tool_calls: message.tool_calls }, finish_reason: null }],
    });
  } else if (typeof message.content === "string" && message.content) {
    chunks.push({
      id: payload.id,
      object: "chat.completion.chunk",
      created,
      model,
      choices: [{ index: 0, delta: { content: message.content }, finish_reason: null }],
    });
  }

  chunks.push({
    id: payload.id,
    object: "chat.completion.chunk",
    created,
    model,
    choices: [{ index: 0, delta: {}, finish_reason: choice.finish_reason || "stop" }],
  });

  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode("data: " + JSON.stringify(chunk) + "\\n\\n"));
        }
        controller.enqueue(encoder.encode("data: [DONE]\\n\\n"));
        controller.close();
      },
    }),
    {
      status: 200,
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store",
        "x-accel-buffering": "no",
      },
    },
  );
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
  const requestBody = input && typeof input === "object" ? input : {};
  const endpoint = readEnvValue(envSource, "LLM_ENDPOINT") || DEFAULT_LLM_ENDPOINT;
  const configuredModel = readEnvValue(envSource, "LLM_MODEL") || DEFAULT_LLM_MODEL;
  const requestedModel = String(requestBody.model || "").trim();
  const resolvedModel = requestedModel || configuredModel;
  const apiKey = readEnvValue(envSource, "LLM_API_KEY");
  const prompt = clampText(buildPromptFromInput(requestBody));

  if (!endpoint || !resolvedModel || !apiKey) {
    return {
      mode: "static",
      note: "LLM_ENDPOINT, LLM_MODEL, and LLM_API_KEY are required for live inference.",
      prompt,
      model: resolvedModel || configuredModel || "",
      reply: "Runtime is in static mode. Configure provider env vars for live inference.",
      message: {
        role: "assistant",
        content: "Runtime is in static mode. Configure provider env vars for live inference.",
      },
    };
  }

  if (!isAllowedEndpoint(endpoint)) {
    throw new Error("LLM endpoint must use HTTPS (or localhost in local mode).");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let response;
  try {
    const payload = buildUpstreamPayload(requestBody, resolvedModel, prompt);
    response = await fetch(endpoint, {
      method: "POST",
      headers: buildLlmRequestHeaders(envSource, apiKey),
      body: JSON.stringify(payload),
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

  const message = normalizeCompletionMessage(data?.choices?.[0]?.message, data || payload);
  const finishReason = String(data?.choices?.[0]?.finish_reason || (Array.isArray(message.tool_calls) && message.tool_calls.length ? "tool_calls" : "stop"));

  return {
    mode: "live",
    model: resolvedModel,
    endpoint,
    reply: message.content || "",
    message,
    finishReason,
    usage: data?.usage && typeof data.usage === "object" ? data.usage : null,
    raw: data || payload,
  };
}

async function handleGenericApiPost(body, envSource) {
  const input = body && typeof body === "object" ? body : {};
  const completion = await callConfiguredLlm(input, envSource);
  const format = String(input.format || "").trim().toLowerCase();
  const wantsOpenAi = format === "openai" || input.openai === true;
  const wantsStream = wantsOpenAi && Boolean(input.stream);
  if (wantsStream) {
    return buildOpenAiStreamResponse(completion);
  }
  if (wantsOpenAi) {
    return buildOpenAiCompletionPayload(completion);
  }
  return {
    ok: true,
    agent: AGENT_NAME,
    completion,
    summary: FLOW_SUMMARY,
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
  .get("/api", ({ store }) => {
    const d1 = resolveD1Binding(store);
    const durableObject = resolveDurableObjectBinding(store);
    return {
      ok: true,
      agent: AGENT_NAME,
      description: AGENT_DESCRIPTION,
      endpointMode: ENDPOINT_MODE,
      endpoints: listRuntimeEndpoints(),
      d1: {
        binding: d1.bindingName,
        available: d1.available,
        databaseId: d1.databaseId,
        databaseName: d1.databaseName,
      },
      durableObject: {
        binding: durableObject.bindingName,
        className: durableObject.className,
        scriptName: durableObject.scriptName,
        environment: durableObject.environment,
        available: durableObject.available,
      },
      summary: FLOW_SUMMARY,
    };
  })
  .post("/api", async ({ body, store, set, request }) => {
    if (!hasWorkerAccess(request.headers, store)) {
      set.status = 401;
      return {
        ok: false,
        error: "Unauthorized. Missing or invalid worker auth / zero-trust headers.",
      };
    }
    try {
      return await handleGenericApiPost(body, store);
    } catch (error) {
      set.status = 502;
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  })
  .post("/api/invoke", async ({ body, store, set, request }) => {
    if (!hasWorkerAccess(request.headers, store)) {
      set.status = 401;
      return {
        ok: false,
        error: "Unauthorized. Missing or invalid worker auth / zero-trust headers.",
      };
    }
    try {
      return await handleGenericApiPost(body, store);
    } catch (error) {
      set.status = 502;
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  })
  .get("/db/health", ({ store, set, request }) => {
    if (!hasWorkerAccess(request.headers, store)) {
      set.status = 401;
      return {
        ok: false,
        error: "Unauthorized. Missing or invalid worker auth / zero-trust headers.",
      };
    }
    const d1 = resolveD1Binding(store);
    return {
      ok: true,
      d1: {
        binding: d1.bindingName,
        available: d1.available,
        databaseId: d1.databaseId,
        databaseName: d1.databaseName,
      },
    };
  })
  .get("/api/db/health", ({ store, set, request }) => {
    if (!hasWorkerAccess(request.headers, store)) {
      set.status = 401;
      return {
        ok: false,
        error: "Unauthorized. Missing or invalid worker auth / zero-trust headers.",
      };
    }
    const d1 = resolveD1Binding(store);
    return {
      ok: true,
      d1: {
        binding: d1.bindingName,
        available: d1.available,
        databaseId: d1.databaseId,
        databaseName: d1.databaseName,
      },
    };
  })
  .post("/db/query", async ({ body, store, set, request }) => {
    if (!hasWorkerAccess(request.headers, store)) {
      set.status = 401;
      return {
        ok: false,
        error: "Unauthorized. Missing or invalid worker auth / zero-trust headers.",
      };
    }
    try {
      const query = await runD1Query(body, store);
      return {
        ok: true,
        d1: query,
      };
    } catch (error) {
      set.status = 502;
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  })
  .post("/api/db/query", async ({ body, store, set, request }) => {
    if (!hasWorkerAccess(request.headers, store)) {
      set.status = 401;
      return {
        ok: false,
        error: "Unauthorized. Missing or invalid worker auth / zero-trust headers.",
      };
    }
    try {
      const query = await runD1Query(body, store);
      return {
        ok: true,
        d1: query,
      };
    } catch (error) {
      set.status = 502;
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  })
  .get("/do/health", ({ store, set, request }) => {
    if (!hasWorkerAccess(request.headers, store)) {
      set.status = 401;
      return {
        ok: false,
        error: "Unauthorized. Missing or invalid worker auth / zero-trust headers.",
      };
    }
    const durableObject = resolveDurableObjectBinding(store);
    return {
      ok: true,
      durableObject: {
        binding: durableObject.bindingName,
        className: durableObject.className,
        scriptName: durableObject.scriptName,
        environment: durableObject.environment,
        available: durableObject.available,
      },
    };
  })
  .get("/api/do/health", ({ store, set, request }) => {
    if (!hasWorkerAccess(request.headers, store)) {
      set.status = 401;
      return {
        ok: false,
        error: "Unauthorized. Missing or invalid worker auth / zero-trust headers.",
      };
    }
    const durableObject = resolveDurableObjectBinding(store);
    return {
      ok: true,
      durableObject: {
        binding: durableObject.bindingName,
        className: durableObject.className,
        scriptName: durableObject.scriptName,
        environment: durableObject.environment,
        available: durableObject.available,
      },
    };
  })
  .post("/do/invoke", async ({ body, store, set, request }) => {
    if (!hasWorkerAccess(request.headers, store)) {
      set.status = 401;
      return {
        ok: false,
        error: "Unauthorized. Missing or invalid worker auth / zero-trust headers.",
      };
    }
    try {
      const response = await runDurableObjectRequest(body, store);
      return {
        ok: true,
        durableObject: response,
      };
    } catch (error) {
      set.status = 502;
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  })
  .post("/api/do/invoke", async ({ body, store, set, request }) => {
    if (!hasWorkerAccess(request.headers, store)) {
      set.status = 401;
      return {
        ok: false,
        error: "Unauthorized. Missing or invalid worker auth / zero-trust headers.",
      };
    }
    try {
      const response = await runDurableObjectRequest(body, store);
      return {
        ok: true,
        durableObject: response,
      };
    } catch (error) {
      set.status = 502;
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  })
  .get("/v1/models", ({ set, store, request }) => {
    if (!hasOpenAiEndpoint()) {
      set.status = 404;
      return {
        error: "Not found.",
      };
    }

    if (!hasWorkerAccess(request.headers, store)) {
      set.status = 401;
      return {
        error: "Unauthorized. Missing or invalid worker auth / zero-trust headers.",
      };
    }

    const configured = readEnvValue(store, "LLM_MODEL") || DEFAULT_LLM_MODEL || "agent-builder-sim";
    return {
      object: "list",
      data: [
        {
          id: configured,
          object: "model",
          created: Math.floor(Date.now() / 1000),
          owned_by: "agent-builder-runtime",
        },
      ],
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
        error: "Unauthorized. Missing or invalid worker auth / zero-trust headers.",
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
        error: "Unauthorized. Missing or invalid worker auth / zero-trust headers.",
      };
    }

    try {
      const completion = await callConfiguredLlm(body, store);
      const wantsStream = Boolean(body && typeof body === "object" && body.stream);
      if (wantsStream) {
        return buildOpenAiStreamResponse(completion);
      }
      return buildOpenAiCompletionPayload(completion);
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
    const withoutTsNocheck = base.replace(/^\/\/ @ts-nocheck\s*/m, "");
    return `// @ts-nocheck
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";
${withoutTsNocheck.replace("const app = new Elysia()", "const app = new Elysia({ adapter: CloudflareAdapter, aot: false })")}`;
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
    const cloudflareConfig = normalizeCloudflareDeployConfig(options.cloudflareConfig);
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
    const durableObjectClassName = normalizeCloudflareDoClassName(cloudflareConfig.doClassName || "AgentDurableObject");

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
const DEFAULT_CF_ZERO_TRUST_MODE = ${JSON.stringify(cloudflareConfig.zeroTrustMode)};
const DEFAULT_CF_ACCESS_AUD = ${JSON.stringify(cloudflareConfig.accessAud)};
const DEFAULT_CF_ACCESS_SERVICE_TOKEN_ID = ${JSON.stringify(cloudflareConfig.accessServiceTokenId)};
const DEFAULT_CF_D1_BINDING = ${JSON.stringify(cloudflareConfig.d1Binding)};
const DEFAULT_CF_D1_DATABASE_ID = ${JSON.stringify(cloudflareConfig.d1DatabaseId)};
const DEFAULT_CF_D1_DATABASE_NAME = ${JSON.stringify(cloudflareConfig.d1DatabaseName)};
const DEFAULT_CF_DO_BINDING = ${JSON.stringify(cloudflareConfig.doBinding)};
const DEFAULT_CF_DO_CLASS_NAME = ${JSON.stringify(durableObjectClassName)};
const DEFAULT_CF_DO_SCRIPT_NAME = ${JSON.stringify(cloudflareConfig.doScriptName)};
const DEFAULT_CF_DO_ENVIRONMENT = ${JSON.stringify(cloudflareConfig.doEnvironment)};
const DEFAULT_RUNTIME_SYSTEM_PROMPT = [
  "You are Agent Builder Runtime, an execution assistant for deployed flow-based agents.",
  "Priority order: (1) safety and correctness, (2) explicit tool usage when provided, (3) concise user-facing output.",
  "When tools are provided, prefer calling tools for factual or external-data tasks instead of fabricating answers.",
  "Do not expose secrets, API keys, hidden tokens, or internal headers.",
  "If a request is ambiguous, ask one focused clarification question.",
  "If constraints prevent completion, explain the exact blocker and suggest the smallest viable next step.",
  "Keep responses practical, deterministic, and deployment-friendly.",
].join("\\n");

function durableObjectJson(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export class ${durableObjectClassName} {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return durableObjectJson({
        ok: true,
        className: DEFAULT_CF_DO_CLASS_NAME,
        now: new Date().toISOString(),
      });
    }

    if (request.method !== "POST") {
      return durableObjectJson({ ok: false, error: "Method not allowed." }, 405);
    }

    let payload = {};
    try {
      payload = await request.json();
    } catch {
      // Keep empty payload.
    }

    const action = String(payload.action || payload.op || payload.mode || "echo").trim().toLowerCase();
    const key = String(payload.key || payload.name || "default").trim() || "default";

    try {
      if (action === "get") {
        const value = await this.state.storage.get(key);
        return durableObjectJson({ ok: true, action, key, value: value ?? null });
      }
      if (action === "set" || action === "put") {
        await this.state.storage.put(key, payload.value);
        return durableObjectJson({ ok: true, action: "set", key });
      }
      if (action === "delete" || action === "del") {
        await this.state.storage.delete(key);
        return durableObjectJson({ ok: true, action: "delete", key });
      }
      if (action === "list") {
        const limit = Math.max(1, Math.min(Number(payload.limit || 50) || 50, 200));
        const rows = await this.state.storage.list({ limit });
        const items = [];
        for (const [entryKey, entryValue] of rows.entries()) {
          items.push({ key: String(entryKey), value: entryValue });
        }
        return durableObjectJson({ ok: true, action: "list", items });
      }
      return durableObjectJson({
        ok: true,
        action: "echo",
        payload,
        now: new Date().toISOString(),
      });
    } catch (error) {
      return durableObjectJson(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  }
}

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

function normalizeZeroTrustMode(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "access_jwt" || normalized === "service_token") {
    return normalized;
  }
  return "off";
}

function decodeBase64Url(value) {
  const input = String(value || "").trim();
  if (!input) return "";
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  try {
    if (typeof atob === "function") {
      return atob(padded);
    }
  } catch {
    // Ignore browser decode errors.
  }
  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(padded, "base64").toString("utf8");
    }
  } catch {
    // Ignore server decode errors.
  }
  return "";
}

function parseJwtPayload(token) {
  const parts = String(token || "").split(".");
  if (parts.length < 2) return null;
  const decoded = decodeBase64Url(parts[1]);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function hasZeroTrustAccess(headers, env) {
  const mode = normalizeZeroTrustMode(String(env.CF_ZERO_TRUST_MODE || DEFAULT_CF_ZERO_TRUST_MODE || "").trim());
  if (mode === "off") {
    return true;
  }

  if (mode === "service_token") {
    const requiredId = String(env.CF_ACCESS_SERVICE_TOKEN_ID || DEFAULT_CF_ACCESS_SERVICE_TOKEN_ID || "").trim();
    const requiredSecret = String(env.CF_ACCESS_SERVICE_TOKEN_SECRET || "").trim();
    if (!requiredId || !requiredSecret) return false;
    const incomingId = String(headers.get("cf-access-client-id") || "").trim();
    const incomingSecret = String(headers.get("cf-access-client-secret") || "").trim();
    return incomingId === requiredId && incomingSecret === requiredSecret;
  }

  const jwt = String(headers.get("cf-access-jwt-assertion") || "").trim();
  if (!jwt) return false;
  const requiredAud = String(env.CF_ACCESS_AUD || DEFAULT_CF_ACCESS_AUD || "").trim();
  if (!requiredAud) return false;
  const payload = parseJwtPayload(jwt);
  const now = Math.floor(Date.now() / 1000);
  const exp = Number(payload?.exp || 0);
  if (Number.isFinite(exp) && exp > 0 && exp <= now) return false;
  const nbf = Number(payload?.nbf || 0);
  if (Number.isFinite(nbf) && nbf > 0 && nbf > now + 30) return false;
  const aud = payload?.aud;
  if (Array.isArray(aud)) {
    return aud.map((value) => String(value || "").trim()).includes(requiredAud);
  }
  return String(aud || "").trim() === requiredAud;
}

function hasWorkerAccess(request, env) {
  if (!hasZeroTrustAccess(request.headers, env)) return false;
  const required = String(env.WORKER_AUTH_TOKEN || "").trim();
  if (!required) return true;
  const provided = String(request.headers.get("x-worker-token") || "").trim();
  return provided && provided === required;
}

function hasFlowAccess(request, env) {
  if (!hasZeroTrustAccess(request.headers, env)) return false;
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

function normalizeD1BindingName(value) {
  const clean = String(value || "").trim().toUpperCase();
  if (!clean) return "DB";
  return clean
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "") || "DB";
}

function resolveD1Binding(env) {
  const bindingName = normalizeD1BindingName(String(env.CF_D1_BINDING || DEFAULT_CF_D1_BINDING || "").trim() || "DB");
  const candidate = env && typeof env === "object" ? env[bindingName] : null;
  const available = Boolean(candidate && typeof candidate.prepare === "function");
  return {
    bindingName,
    db: available ? candidate : null,
    available,
    databaseId: String(env.CF_D1_DATABASE_ID || DEFAULT_CF_D1_DATABASE_ID || "").trim(),
    databaseName: String(env.CF_D1_DATABASE_NAME || DEFAULT_CF_D1_DATABASE_NAME || "").trim(),
  };
}

function normalizeDoBindingName(value) {
  const clean = String(value || "").trim().toUpperCase();
  if (!clean) return "AGENT_DO";
  return clean
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "") || "AGENT_DO";
}

function normalizeDoClassName(value) {
  const raw = String(value || "").trim();
  if (!raw) return "AgentDurableObject";
  const clean = raw.replace(/[^A-Za-z0-9_$]/g, "_");
  const head = /^[A-Za-z_$]/.test(clean) ? clean : "_" + clean;
  return head || "AgentDurableObject";
}

function resolveDurableObjectBinding(env) {
  const bindingName = normalizeDoBindingName(String(env.CF_DO_BINDING || DEFAULT_CF_DO_BINDING || "").trim() || "AGENT_DO");
  const candidate = env && typeof env === "object" ? env[bindingName] : null;
  const available = Boolean(
    candidate &&
      typeof candidate.get === "function" &&
      (typeof candidate.idFromName === "function" ||
        typeof candidate.idFromString === "function" ||
        typeof candidate.newUniqueId === "function"),
  );
  return {
    bindingName,
    namespace: available ? candidate : null,
    available,
    className: normalizeDoClassName(String(env.CF_DO_CLASS_NAME || DEFAULT_CF_DO_CLASS_NAME || "").trim() || "AgentDurableObject"),
    scriptName: String(env.CF_DO_SCRIPT_NAME || DEFAULT_CF_DO_SCRIPT_NAME || "").trim(),
    environment: String(env.CF_DO_ENVIRONMENT || DEFAULT_CF_DO_ENVIRONMENT || "").trim(),
  };
}

function resolveDurableObjectId(namespace, input) {
  const payload = input && typeof input === "object" ? input : {};
  const explicit = String(payload.objectId || payload.id || "").trim();
  if (explicit && typeof namespace.idFromString === "function") {
    try {
      return namespace.idFromString(explicit);
    } catch {
      // Fall through to name based id.
    }
  }
  const name = String(payload.name || payload.key || "default").trim() || "default";
  if (typeof namespace.idFromName === "function") {
    return namespace.idFromName(name);
  }
  if (typeof namespace.newUniqueId === "function") {
    return namespace.newUniqueId();
  }
  throw new Error("Durable Object namespace cannot resolve object id.");
}

function normalizeDurableObjectMethod(value) {
  const method = String(value || "POST").trim().toUpperCase();
  if (method === "GET" || method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
    return method;
  }
  return "POST";
}

async function runDurableObjectRequest(input, env) {
  const binding = resolveDurableObjectBinding(env);
  if (!binding.available || !binding.namespace) {
    throw new Error("Durable Object binding \"" + binding.bindingName + "\" is unavailable.");
  }

  const payload = input && typeof input === "object" ? input : {};
  const objectId = resolveDurableObjectId(binding.namespace, payload);
  const stub = binding.namespace.get(objectId);
  if (!stub || typeof stub.fetch !== "function") {
    throw new Error("Durable Object stub fetch is unavailable.");
  }

  const method = normalizeDurableObjectMethod(payload.method);
  const pathValue = String(payload.path || payload.pathname || "/invoke").trim() || "/invoke";
  const path = pathValue.startsWith("/") ? pathValue : "/" + pathValue;
  const headers = normalizeHeaderMap(payload.headers);
  let body = null;
  if (payload.body !== undefined && payload.body !== null) {
    if (typeof payload.body === "string") {
      body = payload.body;
    } else {
      if (!headers["content-type"] && !headers["Content-Type"]) {
        headers["content-type"] = "application/json";
      }
      body = safeStringify(payload.body);
    }
  } else if (payload.json !== undefined) {
    if (!headers["content-type"] && !headers["Content-Type"]) {
      headers["content-type"] = "application/json";
    }
    body = safeStringify(payload.json);
  }

  const response = await stub.fetch("https://do" + path, {
    method,
    headers,
    ...(method === "GET" || body === null ? {} : { body }),
  });
  const text = await response.text().catch(() => "");
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    response: data !== null ? data : text,
  };
}

function normalizeD1Mode(mode) {
  const clean = String(mode || "").trim().toLowerCase();
  if (clean === "all" || clean === "first" || clean === "raw" || clean === "run") return clean;
  return "all";
}

function normalizeD1Params(params) {
  if (!Array.isArray(params)) return [];
  return params.slice(0, 64);
}

function listRuntimeEndpoints() {
  return [
    "/health",
    "/flow (debug token required)",
    "/api (GET/POST)",
    "/api/invoke (POST)",
    "/api/db/health (GET, auth required)",
    "/api/db/query (POST, auth required)",
    "/db/health (GET, auth required)",
    "/db/query (POST, auth required)",
    "/api/do/health (GET, auth required)",
    "/api/do/invoke (POST, auth required)",
    "/do/health (GET, auth required)",
    "/do/invoke (POST, auth required)",
    ...(hasOpenAiEndpoint() ? ["/v1/models", "/v1/chat/completions"] : []),
    ...(hasChatWebUiEndpoint() ? ["/chat", "/invoke"] : []),
  ];
}

async function runD1Query(input, env) {
  const binding = resolveD1Binding(env);
  if (!binding.available || !binding.db) {
    throw new Error(`D1 binding "${binding.bindingName}" is unavailable.`);
  }

  const payload = input && typeof input === "object" ? input : {};
  const sql = String(payload.sql || payload.query || "").trim();
  if (!sql) {
    throw new Error("SQL query is required.");
  }
  if (sql.length > 20000) {
    throw new Error("SQL query exceeds max length.");
  }

  const params = normalizeD1Params(payload.params);
  const mode = normalizeD1Mode(payload.mode || payload.resultMode || "all");
  const statement = binding.db.prepare(sql).bind(...params);

  if (mode === "first") {
    const row = await statement.first();
    return { mode, row: row || null, success: true };
  }
  if (mode === "raw") {
    const rows = await statement.raw();
    return { mode, rows, success: true };
  }
  if (mode === "run") {
    const result = await statement.run();
    return { mode, result, success: true };
  }

  const result = await statement.all();
  return { mode, result, rows: Array.isArray(result?.results) ? result.results : [], success: true };
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
    " Chat</title><style>body{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;max-width:900px;margin:24px auto;padding:0 16px;color:#111}textarea,input,button{font:inherit}textarea,input{width:100%;padding:10px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box}textarea{min-height:110px}#log{margin-top:14px;padding:12px;border:1px solid #ddd;border-radius:10px;white-space:pre-wrap;background:#fafafa;min-height:120px}button{padding:10px 14px;border:0;border-radius:8px;background:#111;color:#fff;cursor:pointer}small{color:#666;display:block;margin-top:8px}.row{display:grid;gap:8px;margin-top:8px}</style></head><body><h1>" +
    safeName +
    "</h1><p>" +
    safeDesc +
    "</p><div class=\\"row\\"><label for=\\"token\\"><small>Optional worker token (for WORKER_AUTH_TOKEN protected deployments)</small></label><input id=\\"token\\" placeholder=\\"x-worker-token (optional)\\" /><textarea id=\\"prompt\\" placeholder=\\"Ask your agent...\\"></textarea></div><div style=\\"margin-top:8px\\"><button id=\\"send\\">Send</button></div><div id=\\"log\\">Ready.</div><small>This UI calls /v1/chat/completions with OpenAI-style stream mode for ChatKit-compatible clients.</small><script>const b=document.getElementById('send');const p=document.getElementById('prompt');const t=document.getElementById('token');const log=document.getElementById('log');async function readSse(response){const reader=response.body&&response.body.getReader?response.body.getReader():null;if(!reader){const text=await response.text();return text||'';}const dec=new TextDecoder();let buf='';let out='';for(;;){const {done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});const parts=buf.split('\\\\n\\\\n');buf=parts.pop()||'';for(const raw of parts){const line=raw.split('\\\\n').find(l=>l.startsWith('data: '));if(!line)continue;const payload=line.slice(6).trim();if(payload==='[DONE]')continue;try{const json=JSON.parse(payload);const delta=json&&json.choices&&json.choices[0]&&json.choices[0].delta||{};if(typeof delta.content==='string')out+=delta.content;if(Array.isArray(delta.tool_calls)&&delta.tool_calls.length){out+=out?'\\\\n':'';out+='[tool_calls] '+JSON.stringify(delta.tool_calls);} }catch{} }}return out.trim();}b.onclick=async()=>{const prompt=String(p.value||'').trim();if(!prompt){log.textContent='Enter a prompt.';return;}log.textContent='Running...';try{const headers={'content-type':'application/json'};const token=String(t.value||'').trim();if(token)headers['x-worker-token']=token;const r=await fetch('/v1/chat/completions',{method:'POST',headers,body:JSON.stringify({model:'runtime-default',stream:true,messages:[{role:'user',content:prompt}]})});if(!r.ok){let err='Request failed ('+r.status+')';try{const j=await r.json();err=(j&&j.error&&j.error.message)||j&&j.error||err;}catch{}throw new Error(String(err));}const text=await readSse(r);log.textContent=text||'No response';}catch(e){log.textContent=String(e&&e.message||e);}};</script></body></html>";
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

function extractTextFromMessageContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((piece) => {
        if (typeof piece === "string") return piece;
        if (piece && typeof piece.text === "string") return piece.text;
        if (piece && typeof piece.content === "string") return piece.content;
        return "";
      })
      .join("\\n")
      .trim();
  }
  if (content && typeof content === "object") {
    return safeStringify(content);
  }
  return "";
}

function normalizeIncomingMessages(input, prompt) {
  const source = Array.isArray(input?.messages) ? input.messages : [];
  const normalized = [];
  for (const row of source) {
    if (!row || typeof row !== "object") continue;
    const role = String(row.role || "").trim();
    if (!role) continue;
    const next = { role };
    if (row.name && typeof row.name === "string") next.name = row.name;
    if (row.tool_call_id && typeof row.tool_call_id === "string") next.tool_call_id = row.tool_call_id;
    if (Array.isArray(row.tool_calls)) next.tool_calls = row.tool_calls;
    if (row.content !== undefined) {
      next.content = row.content;
    } else if (!next.tool_calls) {
      next.content = "";
    }
    if (role === "assistant" || role === "user" || role === "system" || role === "tool") {
      normalized.push(next);
    }
  }

  if (!normalized.length) {
    normalized.push({
      role: "user",
      content: JSON.stringify(
        {
          agent: AGENT_NAME,
          description: AGENT_DESCRIPTION,
          flowSummary: FLOW_SUMMARY,
          prompt,
          input: input || {},
        },
        null,
        2,
      ),
    });
  }
  return normalized;
}

function normalizeToolsArray(tools) {
  if (!Array.isArray(tools)) return undefined;
  const next = [];
  for (const tool of tools) {
    if (!tool || typeof tool !== "object") continue;
    if (String(tool.type || "") !== "function") continue;
    if (!tool.function || typeof tool.function !== "object") continue;
    const functionName = String(tool.function.name || "").trim();
    if (!functionName) continue;
    next.push(tool);
    if (next.length >= 32) break;
  }
  return next.length ? next : undefined;
}

function normalizeToolChoice(toolChoice) {
  if (!toolChoice) return undefined;
  if (typeof toolChoice === "string") return toolChoice;
  if (toolChoice && typeof toolChoice === "object") return toolChoice;
  return undefined;
}

function buildRuntimeSystemPrompt(input, prompt) {
  const hint = String(input?.runtimePrompt || "").trim();
  const parts = [
    DEFAULT_RUNTIME_SYSTEM_PROMPT,
    "Agent: " + AGENT_NAME,
    AGENT_DESCRIPTION ? "Agent description: " + AGENT_DESCRIPTION : "",
    "Flow summary: " + safeStringify(FLOW_SUMMARY),
    "Current user prompt: " + prompt,
    hint ? "Runtime override: " + hint : "",
  ].filter(Boolean);
  return clampText(parts.join("\\n\\n"), 12000);
}

function toFiniteNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function buildUpstreamPayload(input, resolvedModel, prompt) {
  const requestBody = input && typeof input === "object" ? input : {};
  const payload = {
    model: resolvedModel,
    messages: [
      {
        role: "system",
        content: buildRuntimeSystemPrompt(requestBody, prompt),
      },
      ...normalizeIncomingMessages(requestBody, prompt),
    ],
    temperature: toFiniteNumber(requestBody.temperature, 0.2),
  };

  if (requestBody.top_p !== undefined) payload.top_p = toFiniteNumber(requestBody.top_p, 1);
  if (requestBody.max_tokens !== undefined) payload.max_tokens = Math.max(1, Math.floor(toFiniteNumber(requestBody.max_tokens, 512)));
  if (requestBody.max_completion_tokens !== undefined && payload.max_tokens === undefined) {
    payload.max_tokens = Math.max(1, Math.floor(toFiniteNumber(requestBody.max_completion_tokens, 512)));
  }
  if (requestBody.frequency_penalty !== undefined) payload.frequency_penalty = toFiniteNumber(requestBody.frequency_penalty, 0);
  if (requestBody.presence_penalty !== undefined) payload.presence_penalty = toFiniteNumber(requestBody.presence_penalty, 0);
  if (requestBody.stop !== undefined) payload.stop = requestBody.stop;
  if (requestBody.response_format && typeof requestBody.response_format === "object") {
    payload.response_format = requestBody.response_format;
  }

  const tools = normalizeToolsArray(requestBody.tools);
  if (tools) payload.tools = tools;
  const toolChoice = normalizeToolChoice(requestBody.tool_choice);
  if (toolChoice !== undefined) payload.tool_choice = toolChoice;
  if (requestBody.parallel_tool_calls !== undefined) {
    payload.parallel_tool_calls = Boolean(requestBody.parallel_tool_calls);
  }
  return payload;
}

function normalizeCompletionMessage(message, fallbackPayload) {
  const source = message && typeof message === "object" ? message : {};
  const content = extractTextFromMessageContent(source.content);
  const toolCalls = Array.isArray(source.tool_calls) ? source.tool_calls : [];
  if (toolCalls.length) {
    return {
      role: "assistant",
      content: content || "",
      tool_calls: toolCalls,
    };
  }
  if (content) {
    return {
      role: "assistant",
      content,
    };
  }
  return {
    role: "assistant",
    content: safeStringify(fallbackPayload || {}),
  };
}

function buildOpenAiCompletionPayload(completion) {
  const created = Math.floor(Date.now() / 1000);
  const message = completion?.message || { role: "assistant", content: completion?.reply || "" };
  const finishReason = completion?.finishReason || (Array.isArray(message.tool_calls) && message.tool_calls.length ? "tool_calls" : "stop");
  const response = {
    id: "chatcmpl_agent_builder",
    object: "chat.completion",
    created,
    model: completion?.model || String(completion?.raw?.model || "") || "agent-builder-sim",
    choices: [
      {
        index: 0,
        finish_reason: finishReason,
        message,
      },
    ],
  };
  if (completion?.usage && typeof completion.usage === "object") {
    response.usage = completion.usage;
  }
  return response;
}

function buildOpenAiStreamResponse(completion) {
  const payload = buildOpenAiCompletionPayload(completion);
  const choice = payload.choices?.[0] || {};
  const message = choice.message || {};
  const created = payload.created || Math.floor(Date.now() / 1000);
  const model = payload.model || "agent-builder-sim";
  const encoder = new TextEncoder();

  const chunks = [];
  chunks.push({
    id: payload.id,
    object: "chat.completion.chunk",
    created,
    model,
    choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }],
  });

  const hasToolCalls = Array.isArray(message.tool_calls) && message.tool_calls.length > 0;
  if (hasToolCalls) {
    chunks.push({
      id: payload.id,
      object: "chat.completion.chunk",
      created,
      model,
      choices: [{ index: 0, delta: { tool_calls: message.tool_calls }, finish_reason: null }],
    });
  } else if (typeof message.content === "string" && message.content) {
    chunks.push({
      id: payload.id,
      object: "chat.completion.chunk",
      created,
      model,
      choices: [{ index: 0, delta: { content: message.content }, finish_reason: null }],
    });
  }

  chunks.push({
    id: payload.id,
    object: "chat.completion.chunk",
    created,
    model,
    choices: [{ index: 0, delta: {}, finish_reason: choice.finish_reason || "stop" }],
  });

  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode("data: " + JSON.stringify(chunk) + "\\n\\n"));
        }
        controller.enqueue(encoder.encode("data: [DONE]\\n\\n"));
        controller.close();
      },
    }),
    {
      status: 200,
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store",
        "x-accel-buffering": "no",
        "access-control-allow-origin": "*",
      },
    },
  );
}

async function callConfiguredLlm(input, env) {
  const requestBody = input && typeof input === "object" ? input : {};
  const endpoint = String(env.LLM_ENDPOINT || "").trim();
  const configuredModel = String(env.LLM_MODEL || "").trim();
  const requestedModel = String(requestBody.model || "").trim();
  const resolvedModel = requestedModel || configuredModel;
  const apiKey = String(env.LLM_API_KEY || "").trim();
  const prompt = clampText(buildPromptFromInput(requestBody));

  if (!endpoint || !resolvedModel || !apiKey) {
    return {
      mode: "static",
      note: "LLM_ENDPOINT, LLM_MODEL, and LLM_API_KEY are required for live inference.",
      model: resolvedModel || configuredModel || "",
      prompt,
      reply: "Runtime is in static mode. Configure provider env vars for live inference.",
      message: {
        role: "assistant",
        content: "Runtime is in static mode. Configure provider env vars for live inference.",
      },
    };
  }

  if (!isAllowedEndpoint(endpoint)) {
    throw new Error("LLM endpoint must use HTTPS (or localhost in local mode).");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let response;
  try {
    const payload = buildUpstreamPayload(requestBody, resolvedModel, prompt);
    response = await fetch(endpoint, {
      method: "POST",
      headers: buildLlmRequestHeaders(env, apiKey),
      body: JSON.stringify(payload),
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

  const message = normalizeCompletionMessage(data?.choices?.[0]?.message, data || payload);
  const finishReason = String(data?.choices?.[0]?.finish_reason || (Array.isArray(message.tool_calls) && message.tool_calls.length ? "tool_calls" : "stop"));
  return {
    mode: "live",
    model: resolvedModel,
    endpoint,
    reply: message.content || "",
    message,
    finishReason,
    usage: data?.usage && typeof data.usage === "object" ? data.usage : null,
    raw: data || payload,
  };
}

async function handleGenericApiPost(input, env) {
  const payload = input && typeof input === "object" ? input : {};
  const completion = await callConfiguredLlm(payload, env);
  const format = String(payload.format || "").trim().toLowerCase();
  const wantsOpenAi = format === "openai" || payload.openai === true;
  const wantsStream = wantsOpenAi && Boolean(payload.stream);
  if (wantsStream) {
    return buildOpenAiStreamResponse(completion);
  }
  if (wantsOpenAi) {
    return buildOpenAiCompletionPayload(completion);
  }
  return { ok: true, agent: AGENT_NAME, completion, summary: FLOW_SUMMARY };
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

    if (url.pathname === "/api") {
      if (request.method === "GET") {
        const d1 = resolveD1Binding(env);
        const durableObject = resolveDurableObjectBinding(env);
        return json({
          ok: true,
          agent: AGENT_NAME,
          endpointMode: ENDPOINT_MODE,
          endpoints: listRuntimeEndpoints(),
          d1: {
            binding: d1.bindingName,
            available: d1.available,
            databaseId: d1.databaseId,
            databaseName: d1.databaseName,
          },
          durableObject: {
            binding: durableObject.bindingName,
            className: durableObject.className,
            scriptName: durableObject.scriptName,
            environment: durableObject.environment,
            available: durableObject.available,
          },
          summary: FLOW_SUMMARY,
        });
      }

      if (request.method === "POST") {
        if (!hasWorkerAccess(request, env)) {
          return json({ error: "Unauthorized. Missing or invalid worker auth / zero-trust headers." }, 401);
        }
        let input = {};
        try {
          input = await request.json();
        } catch {
          // Keep empty input.
        }
        try {
          const responsePayload = await handleGenericApiPost(input, env);
          if (responsePayload instanceof Response) {
            return responsePayload;
          }
          return json(responsePayload);
        } catch (error) {
          return json(
            {
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            },
            500,
          );
        }
      }
    }

    if (url.pathname === "/api/invoke") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }
      if (!hasWorkerAccess(request, env)) {
        return json({ error: "Unauthorized. Missing or invalid worker auth / zero-trust headers." }, 401);
      }
      let input = {};
      try {
        input = await request.json();
      } catch {
        // Keep empty input.
      }
      try {
        const responsePayload = await handleGenericApiPost(input, env);
        if (responsePayload instanceof Response) {
          return responsePayload;
        }
        return json(responsePayload);
      } catch (error) {
        return json(
          {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          },
          500,
        );
      }
    }

    if (url.pathname === "/db/health" || url.pathname === "/api/db/health") {
      if (!hasWorkerAccess(request, env)) {
        return json({ error: "Unauthorized. Missing or invalid worker auth / zero-trust headers." }, 401);
      }
      const d1 = resolveD1Binding(env);
      return json({
        ok: true,
        d1: {
          binding: d1.bindingName,
          available: d1.available,
          databaseId: d1.databaseId,
          databaseName: d1.databaseName,
        },
      });
    }

    if (url.pathname === "/db/query" || url.pathname === "/api/db/query") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }
      if (!hasWorkerAccess(request, env)) {
        return json({ error: "Unauthorized. Missing or invalid worker auth / zero-trust headers." }, 401);
      }
      let input = {};
      try {
        input = await request.json();
      } catch {
        // Keep empty input.
      }
      try {
        const result = await runD1Query(input, env);
        return json({ ok: true, d1: result });
      } catch (error) {
        return json(
          {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          },
          500,
        );
      }
    }

    if (url.pathname === "/do/health" || url.pathname === "/api/do/health") {
      if (!hasWorkerAccess(request, env)) {
        return json({ error: "Unauthorized. Missing or invalid worker auth / zero-trust headers." }, 401);
      }
      const durableObject = resolveDurableObjectBinding(env);
      return json({
        ok: true,
        durableObject: {
          binding: durableObject.bindingName,
          className: durableObject.className,
          scriptName: durableObject.scriptName,
          environment: durableObject.environment,
          available: durableObject.available,
        },
      });
    }

    if (url.pathname === "/do/invoke" || url.pathname === "/api/do/invoke") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }
      if (!hasWorkerAccess(request, env)) {
        return json({ error: "Unauthorized. Missing or invalid worker auth / zero-trust headers." }, 401);
      }
      let input = {};
      try {
        input = await request.json();
      } catch {
        // Keep empty input.
      }
      try {
        const result = await runDurableObjectRequest(input, env);
        return json({ ok: true, durableObject: result });
      } catch (error) {
        return json(
          {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          },
          500,
        );
      }
    }

    if (url.pathname === "/" || url.pathname === "") {
      const d1 = resolveD1Binding(env);
      const durableObject = resolveDurableObjectBinding(env);
      return json({
        ok: true,
        agent: AGENT_NAME,
        endpointMode: ENDPOINT_MODE,
        endpoints: listRuntimeEndpoints(),
        d1: {
          binding: d1.bindingName,
          available: d1.available,
          databaseId: d1.databaseId,
          databaseName: d1.databaseName,
        },
        durableObject: {
          binding: durableObject.bindingName,
          className: durableObject.className,
          scriptName: durableObject.scriptName,
          environment: durableObject.environment,
          available: durableObject.available,
        },
      });
    }

    if (url.pathname === "/v1/models") {
      if (!hasOpenAiEndpoint()) {
        return json({ error: "Not found" }, 404);
      }
      if (!hasWorkerAccess(request, env)) {
        return json({ error: "Unauthorized. Missing or invalid worker auth / zero-trust headers." }, 401);
      }
      const model = String(env.LLM_MODEL || "").trim() || "agent-builder-sim";
      return json({
        object: "list",
        data: [
          {
            id: model,
            object: "model",
            created: Math.floor(Date.now() / 1000),
            owned_by: "agent-builder-runtime",
          },
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
        return json({ error: "Unauthorized. Missing or invalid worker auth / zero-trust headers." }, 401);
      }

      let input = {};
      try {
        input = await request.json();
      } catch {
        // Keep empty input.
      }

      try {
        const completion = await callConfiguredLlm(input, env);
        if (isOpenAiRoute) {
          const wantsStream = Boolean(input && typeof input === "object" && input.stream);
          if (wantsStream) {
            return buildOpenAiStreamResponse(completion);
          }
          return json(buildOpenAiCompletionPayload(completion));
        }
        return json({ ok: true, agent: AGENT_NAME, completion, summary: FLOW_SUMMARY });
      } catch (error) {
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

    if (targetId === "cloudflare_workers_elysia_bun" || targetId === "cloudflare_workers") {
      payload.devDependencies["@cloudflare/workers-types"] = "^4.20260205.0";
    }

    if (targetId === "local_elysia_bun" || targetId === "vercel_elysia_bun") {
      payload.devDependencies["bun-types"] = "^1.2.2";
    }

    if (targetId === "vercel_elysia_bun") {
      payload.devDependencies.vercel = "^37.0.0";
    }

    return `${JSON.stringify(payload, null, 2)}\n`;
  }

  function buildTsconfig(targetId = "") {
    const target = String(targetId || "").trim();
    const isCloudflareTarget = target === "cloudflare_workers_elysia_bun" || target === "cloudflare_workers";
    const compilerOptions = {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "Bundler",
      strict: false,
      noImplicitAny: false,
      skipLibCheck: true,
      ...(isCloudflareTarget
        ? {
            lib: ["ES2022", "WebWorker", "DOM.Iterable"],
            types: ["@cloudflare/workers-types"],
          }
        : {
            types: ["bun-types"],
          }),
    };

    return `${JSON.stringify(
      {
        compilerOptions,
        include: ["src/**/*.ts", "api/**/*.ts"],
      },
      null,
      2,
    )}\n`;
  }

  function buildReadme(options = {}) {
    const endpointMode = normalizeEndpointMode(options.endpointMode || "both");
    const endpointLines = [
      "- /health",
      "- /flow (requires FLOW_DEBUG_TOKEN + x-debug-token)",
      "- /api (GET metadata + POST invoke)",
      "- /api/invoke (POST alias)",
      "- /api/db/health (auth required)",
      "- /api/db/query (auth required)",
      "- /db/health (auth required)",
      "- /db/query (auth required)",
      "- /api/do/health (auth required)",
      "- /api/do/invoke (auth required)",
      "- /do/health (auth required)",
      "- /do/invoke (auth required)",
    ];
    if (endpointMode === "openai" || endpointMode === "both") {
      endpointLines.push("- /v1/models (OpenAI model list)");
      endpointLines.push("- /v1/chat/completions (OpenAI-style, supports stream + tools)");
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
      "- CF_ZERO_TRUST_MODE (off | access_jwt | service_token)",
      "- CF_ACCESS_AUD (required when CF_ZERO_TRUST_MODE=access_jwt)",
      "- CF_ACCESS_SERVICE_TOKEN_ID (required when CF_ZERO_TRUST_MODE=service_token)",
      "- CF_ACCESS_SERVICE_TOKEN_SECRET (configure via wrangler secret for service_token mode)",
      "- CF_D1_BINDING (optional, default DB)",
      "- CF_D1_DATABASE_ID (optional metadata hint)",
      "- CF_D1_DATABASE_NAME (optional metadata hint)",
      "- CF_DO_BINDING (optional, default AGENT_DO)",
      "- CF_DO_CLASS_NAME (optional, default AgentDurableObject)",
      "- CF_DO_SCRIPT_NAME (optional external DO worker)",
      "- CF_DO_ENVIRONMENT (optional external DO environment)",
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
      "OpenAI-style clients (including ChatKit-style frontends) can target /v1/chat/completions directly.",
      "Configure secrets and auth tokens in your platform dashboard (Cloudflare/Vercel/GitHub), not in the IDE.",
      "For service-token mode, set secret via: wrangler secret put CF_ACCESS_SERVICE_TOKEN_SECRET",
      "Durable Object bindings are emitted when CF_DO_SCRIPT_NAME is set (external namespace binding).",
      "",
    );
    return lines.join("\n");
  }

  function escapeTomlString(value) {
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
  }

  function buildCloudflareWranglerToml(workerName, cloudflareConfig = {}) {
    const config = normalizeCloudflareDeployConfig(cloudflareConfig);
    const compatibilityDate = new Date().toISOString().slice(0, 10);
    const lines = [
      `name = "${escapeTomlString(slugify(workerName, "agent-builder-runtime"))}"`,
      'main = "src/index.ts"',
      `compatibility_date = "${compatibilityDate}"`,
      `workers_dev = ${config.workersDevEnabled ? "true" : "false"}`,
    ];

    if (config.zoneId && config.routePattern) {
      lines.push("", "[[routes]]", `pattern = "${escapeTomlString(config.routePattern)}"`, `zone_id = "${escapeTomlString(config.zoneId)}"`);
    }

    if (config.d1DatabaseId) {
      lines.push(
        "",
        "[[d1_databases]]",
        `binding = "${escapeTomlString(config.d1Binding || "DB")}"`,
        `database_id = "${escapeTomlString(config.d1DatabaseId)}"`,
      );
      if (config.d1DatabaseName) {
        lines.push(`database_name = "${escapeTomlString(config.d1DatabaseName)}"`);
      }
    }

    if (config.doScriptName) {
      lines.push(
        "",
        "[[durable_objects.bindings]]",
        `name = "${escapeTomlString(config.doBinding || "AGENT_DO")}"`,
        `class_name = "${escapeTomlString(config.doClassName || "AgentDurableObject")}"`,
        `script_name = "${escapeTomlString(config.doScriptName)}"`,
      );
      if (config.doEnvironment) {
        lines.push(`environment = "${escapeTomlString(config.doEnvironment)}"`);
      }
    }

    lines.push(
      "",
      "[vars]",
      'LLM_ENDPOINT = ""',
      'LLM_MODEL = ""',
      `CF_ZERO_TRUST_MODE = "${escapeTomlString(config.zeroTrustMode)}"`,
      `CF_ACCESS_AUD = "${escapeTomlString(config.accessAud)}"`,
      `CF_ACCESS_SERVICE_TOKEN_ID = "${escapeTomlString(config.accessServiceTokenId)}"`,
      `CF_D1_BINDING = "${escapeTomlString(config.d1Binding || "DB")}"`,
      `CF_D1_DATABASE_ID = "${escapeTomlString(config.d1DatabaseId)}"`,
      `CF_D1_DATABASE_NAME = "${escapeTomlString(config.d1DatabaseName)}"`,
      `CF_DO_BINDING = "${escapeTomlString(config.doBinding || "AGENT_DO")}"`,
      `CF_DO_CLASS_NAME = "${escapeTomlString(config.doClassName || "AgentDurableObject")}"`,
      `CF_DO_SCRIPT_NAME = "${escapeTomlString(config.doScriptName)}"`,
      `CF_DO_ENVIRONMENT = "${escapeTomlString(config.doEnvironment)}"`,
      "",
      "# Set auth/debug tokens via Wrangler secrets (recommended):",
      "# wrangler secret put WORKER_AUTH_TOKEN",
      "# wrangler secret put FLOW_DEBUG_TOKEN",
      "",
      "# Set service-token secret via Wrangler secret when using service_token mode:",
      "# wrangler secret put CF_ACCESS_SERVICE_TOKEN_SECRET",
    );

    return `${lines.join("\n")}\n`;
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
    const cloudflareConfig = normalizeCloudflareDeployConfig(options.cloudflareConfig);
    const nonCloudflareConfig = normalizeCloudflareDeployConfig({ zeroTrustMode: "off" });
    const endpointMode = normalizeEndpointMode(options.endpointMode || "both");
    const drawflow = options.drawflow || { drawflow: { Home: { data: {} } } };

    const rootDir = `${slugify(agentName, "agent-builder-runtime")}-${targetDef.id}-${formatDateForSlug(new Date())}`;
    const files = [];

    if (targetDef.id === "cloudflare_workers_elysia_bun") {
      files.push({ path: "src/index.ts", content: buildCloudflareElysiaSource({ agentName, description, drawflow, providerConfig, endpointMode, cloudflareConfig }) });
      files.push({ path: "wrangler.toml", content: buildCloudflareWranglerToml(agentName, cloudflareConfig) });
      files.push({ path: "package.json", content: buildPackageJson(agentName, targetDef.id) });
      files.push({ path: "tsconfig.json", content: buildTsconfig(targetDef.id) });
      files.push({ path: "README.md", content: buildReadme({ target: targetDef.id, targetLabel: targetDef.label, agentName, endpointMode }) });
    } else if (targetDef.id === "vercel_elysia_bun") {
      files.push({ path: "api/index.ts", content: buildVercelElysiaSource({ agentName, description, drawflow, providerConfig, endpointMode, cloudflareConfig: nonCloudflareConfig }) });
      files.push({ path: "vercel.json", content: buildVercelJson() });
      files.push({ path: "package.json", content: buildPackageJson(agentName, targetDef.id) });
      files.push({ path: "tsconfig.json", content: buildTsconfig(targetDef.id) });
      files.push({ path: "README.md", content: buildReadme({ target: targetDef.id, targetLabel: targetDef.label, agentName, endpointMode }) });
    } else if (targetDef.id === "local_elysia_bun") {
      files.push({ path: "src/index.ts", content: buildLocalElysiaSource({ agentName, description, drawflow, providerConfig, endpointMode, cloudflareConfig: nonCloudflareConfig }) });
      files.push({ path: "package.json", content: buildPackageJson(agentName, targetDef.id) });
      files.push({ path: "tsconfig.json", content: buildTsconfig(targetDef.id) });
      files.push({ path: ".env.example", content: "LLM_ENDPOINT=\nLLM_MODEL=\nLLM_API_KEY=\nPORT=8787\n" });
      files.push({ path: "README.md", content: buildReadme({ target: targetDef.id, targetLabel: targetDef.label, agentName, endpointMode }) });
    } else {
      files.push({ path: "src/worker.js", content: buildCloudflareWorkerModule({ agentName, description, drawflow, providerConfig, endpointMode, cloudflareConfig }) });
      files.push({ path: "wrangler.toml", content: buildCloudflareWranglerToml(agentName, cloudflareConfig).replace('main = "src/index.ts"', 'main = "src/worker.js"') });
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
