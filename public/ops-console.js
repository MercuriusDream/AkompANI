(() => {
  const agentSelect = document.getElementById("agentSelect");
  const flowSelect = document.getElementById("flowSelect");
  const originInput = document.getElementById("originInput");
  const refreshBtn = document.getElementById("refreshBtn");
  const resultPane = document.getElementById("resultPane");
  const promptGrid = document.getElementById("promptGrid");

  const STORAGE = {
    localFlows: "akompani_local_flows",
    localAgents: "akompani_local_agents",
    localDeployments: "akompani_local_deployments",
    localEvals: "akompani_local_evals",
    localReleases: "akompani_local_releases",
    oauthGithubToken: "akompani_oauth_github_token",
    oauthCloudflareToken: "akompani_oauth_cloudflare_token",
    cloudflareAccountId: "akompani_cf_account_id",
    llmEndpoint: "akompani_llm_endpoint",
    llmModel: "akompani_llm_model",
    llmApiKeySession: "akompani_llm_api_key",
  };

  const PROMPTS = [
    {
      id: "agent_run_wait",
      title: "Run Agent (Static)",
      description: "Static dry-run and flow inspection from local browser data.",
      payloadTemplate: {
        input: {
          prompt: "Hello agent",
        },
        useLlm: false,
      },
      badge: "Agent",
      badgeClass: "badge-info",
    },
    {
      id: "agent_eval_quick",
      title: "Quick Eval",
      description: "Run static structural checks and record eval in local storage.",
      payloadTemplate: {
        strict: true,
      },
      badge: "Eval",
      badgeClass: "badge-warning",
    },
    {
      id: "deploy_cf_elysia",
      title: "Deploy to Cloudflare",
      description: "Direct browser deploy to Cloudflare Workers (session token required).",
      payloadTemplate: {
        workerName: "",
        accountId: "",
        target: "cloudflare_workers",
      },
      badge: "Deploy",
      badgeClass: "badge-info",
    },
    {
      id: "push_github_worker",
      title: "Push Worker to GitHub",
      description: "Push generated worker files to a repository with GitHub token.",
      payloadTemplate: {
        repository: "owner/repo",
        branch: "main",
        commitMessage: "Deploy agent via Akompani",
      },
      badge: "GitHub",
      badgeClass: "badge-success",
    },
    {
      id: "finalize_agent",
      title: "Finalize Agent",
      description: "Create local release gate (eval + release artifact + optional deploy).",
      payloadTemplate: {
        requirePassRate: 100,
        autoDeployCloudflare: false,
        notes: "finalized from static ops console",
      },
      badge: "Release",
      badgeClass: "badge-success",
    },
  ];

  const state = {
    prompts: PROMPTS,
    agents: [],
    flows: [],
  };

  function readLocal(key) {
    try {
      return String(localStorage.getItem(key) || "").trim();
    } catch {
      return "";
    }
  }

  function readSession(key) {
    try {
      return String(sessionStorage.getItem(key) || "").trim();
    } catch {
      return "";
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

  function writeJsonArray(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
    } catch {
      // Ignore storage quota errors.
    }
  }

  function safeStringify(value) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  function randomId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function sortedByUpdatedAt(rows) {
    return [...rows].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  }

  function getGithubToken() {
    return readSession(STORAGE.oauthGithubToken);
  }

  function getCloudflareToken() {
    return readSession(STORAGE.oauthCloudflareToken);
  }

  function getCloudflareAccountId(payloadAccountId = "") {
    return String(payloadAccountId || "").trim() || readLocal(STORAGE.cloudflareAccountId);
  }

  function getIdeRuntime() {
    const ide = window.AKOMPANI_IDE;
    if (!ide || typeof ide !== "object") return null;
    return ide;
  }

  function buildLlmHeaders(cfg) {
    const headers = cfg?.headers && typeof cfg.headers === "object" ? { ...cfg.headers } : {};
    if (!headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }
    const hasAuth = Object.keys(headers).some((key) => key.toLowerCase() === "authorization");
    if (!hasAuth && cfg?.apiKey) {
      headers.Authorization = `Bearer ${cfg.apiKey}`;
    }
    return headers;
  }

  function getLlmConfig() {
    const ide = getIdeRuntime();
    if (ide?.getActiveLlmConfig) {
      const cfg = ide.getActiveLlmConfig() || {};
      return {
        endpoint: String(cfg.endpoint || "").trim(),
        model: String(cfg.model || "").trim(),
        apiKey: String(cfg.apiKey || "").trim(),
        headers: cfg.headers && typeof cfg.headers === "object" ? cfg.headers : {},
      };
    }

    return {
      endpoint: readLocal(STORAGE.llmEndpoint),
      model: readLocal(STORAGE.llmModel),
      apiKey: readSession(STORAGE.llmApiKeySession),
      headers: {},
    };
  }

  function selectedAgent() {
    if (!agentSelect) return null;
    return state.agents.find((agent) => agent.id === agentSelect.value) || null;
  }

  function resolveFlowOption(optionValue) {
    if (!optionValue) return null;

    if (optionValue.startsWith("flow:")) {
      const flowId = optionValue.slice("flow:".length);
      return state.flows.find((flow) => flow.id === flowId) || null;
    }

    if (optionValue.startsWith("agent:")) {
      const agentId = optionValue.slice("agent:".length);
      const agent = state.agents.find((item) => item.id === agentId);
      if (!agent || !agent.flow || !agent.flow.drawflow) return null;
      return {
        id: `agent_flow_${agent.id}`,
        name: `${agent.name || agent.id} snapshot`,
        drawflow: agent.flow,
        updatedAt: agent.updatedAt || agent.createdAt || nowIso(),
      };
    }

    return null;
  }

  function selectedFlow() {
    const selected = resolveFlowOption(flowSelect.value);
    if (selected) return selected;

    const agent = selectedAgent();
    if (agent && agent.flow && agent.flow.drawflow) {
      return {
        id: `agent_flow_${agent.id}`,
        name: `${agent.name || agent.id} snapshot`,
        drawflow: agent.flow,
        updatedAt: agent.updatedAt || agent.createdAt || nowIso(),
      };
    }

    return null;
  }

  function flowNodes(flow) {
    const data = flow?.drawflow?.drawflow?.Home?.data;
    if (!data || typeof data !== "object") return [];
    return Object.values(data);
  }

  function flowSummary(flow) {
    const nodes = flowNodes(flow);
    const nodeTypes = Array.from(new Set(nodes.map((node) => String(node?.name || "unknown")))).sort();

    let validConnections = 0;
    let brokenConnections = 0;
    const nodeIdSet = new Set(nodes.map((node) => String(node?.id || "")));

    for (const node of nodes) {
      const outputs = node?.outputs || {};
      for (const output of Object.values(outputs)) {
        const connections = Array.isArray(output?.connections) ? output.connections : [];
        for (const conn of connections) {
          const targetId = String(conn?.node || "");
          if (targetId && nodeIdSet.has(targetId)) {
            validConnections += 1;
          } else {
            brokenConnections += 1;
          }
        }
      }
    }

    return {
      nodeCount: nodes.length,
      nodeTypes,
      startCount: nodes.filter((node) => node?.name === "start").length,
      endCount: nodes.filter((node) => node?.name === "end").length,
      validConnections,
      brokenConnections,
    };
  }

  function evaluateFlow(flow, strict = true) {
    const summary = flowSummary(flow);
    const checks = [
      {
        id: "flow_exists",
        description: "Flow is selected and loaded",
        passed: Boolean(flow && flow.drawflow),
      },
      {
        id: "has_nodes",
        description: "Flow has at least one node",
        passed: summary.nodeCount > 0,
      },
      {
        id: "has_start",
        description: "Flow has at least one start node",
        passed: summary.startCount > 0,
      },
      {
        id: "has_end",
        description: "Flow has at least one end node",
        passed: summary.endCount > 0,
      },
      {
        id: "size_budget",
        description: "Flow is within node budget (<= 220 nodes)",
        passed: summary.nodeCount <= 220,
      },
      {
        id: "valid_connections",
        description: "Flow has no broken node connections",
        passed: summary.brokenConnections === 0,
      },
    ];

    if (strict) {
      checks.push({
        id: "has_exec_path",
        description: "Flow has at least one valid connection",
        passed: summary.validConnections > 0,
      });
    }

    const passed = checks.filter((check) => check.passed).length;
    const total = checks.length;
    const passRate = total > 0 ? Number(((passed / total) * 100).toFixed(2)) : 0;

    return {
      summary,
      checks,
      passed,
      total,
      passRate,
    };
  }

  function appendEvalRecord(record) {
    const rows = readJsonArray(STORAGE.localEvals);
    rows.unshift(record);
    writeJsonArray(STORAGE.localEvals, rows.slice(0, 500));
  }

  function appendReleaseRecord(record) {
    const rows = readJsonArray(STORAGE.localReleases);
    rows.unshift(record);
    writeJsonArray(STORAGE.localReleases, rows.slice(0, 300));
  }

  function appendDeploymentRecord(record) {
    const rows = readJsonArray(STORAGE.localDeployments);
    rows.unshift(record);
    writeJsonArray(STORAGE.localDeployments, rows.slice(0, 200));
  }

  function sanitizeWorkerName(input, fallback = "akompani-agent") {
    const normalized = String(input || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");
    const limited = normalized.slice(0, 63).replace(/^-+|-+$/g, "");
    return limited || fallback;
  }

  function delay(ms) {
    const value = Number.isFinite(ms) ? Math.max(0, Math.floor(ms)) : 0;
    return new Promise((resolve) => setTimeout(resolve, value));
  }

  function toErrorMessage(error, fallback = "Unexpected error.") {
    if (error instanceof Error && error.message) return error.message;
    const text = String(error || "").trim();
    return text || fallback;
  }

  function extractCloudflareErrorMessage(data, status) {
    if (data && typeof data === "object") {
      if (Array.isArray(data.errors) && data.errors.length) {
        const lines = data.errors
          .map((item) => {
            if (!item) return "";
            const code = item.code ? `[${item.code}] ` : "";
            const message = String(item.message || "").trim();
            return `${code}${message}`.trim();
          })
          .filter(Boolean);
        if (lines.length) return lines.join("; ");
      }
      const topLevel = String(data.message || "").trim() || String(data.error || "").trim();
      if (topLevel) return topLevel;
    }
    return `Cloudflare API request failed (${status})`;
  }

  async function withRequestTimeout(requestFactory, timeoutMs = 30000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await requestFactory(controller.signal);
    } catch (error) {
      if (error && error.name === "AbortError") {
        throw new Error("Request timed out.");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async function cloudflareApiRequest(url, token, options = {}) {
    const init = options && typeof options === "object" ? options : {};
    const response = await withRequestTimeout((signal) =>
      fetch(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init.headers || {}),
        },
        signal,
      }),
    );

    const raw = await response.text().catch(() => "");
    let data = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = { error: raw };
      }
    }
    return { response, data };
  }

  async function uploadCloudflareWorkerScript({ deployUrl, token, script }) {
    const compatibilityDate = new Date().toISOString().slice(0, 10);
    const moduleFilename = "index.js";
    const attempts = [
      {
        id: "module_multipart",
        run: () =>
          cloudflareApiRequest(deployUrl, token, {
            method: "PUT",
            body: (() => {
              const body = new FormData();
              body.append(
                "metadata",
                new Blob(
                  [
                    JSON.stringify({
                      main_module: moduleFilename,
                      compatibility_date: compatibilityDate,
                    }),
                  ],
                  { type: "application/json" },
                ),
              );
              body.append(moduleFilename, new Blob([script], { type: "application/javascript+module" }), moduleFilename);
              return body;
            })(),
          }),
      },
      {
        id: "module_content_type",
        run: () =>
          cloudflareApiRequest(deployUrl, token, {
            method: "PUT",
            headers: {
              "Content-Type": "application/javascript+module",
            },
            body: script,
          }),
      },
      {
        id: "plain_javascript",
        run: () =>
          cloudflareApiRequest(deployUrl, token, {
            method: "PUT",
            headers: {
              "Content-Type": "application/javascript",
            },
            body: script,
          }),
      },
    ];

    let lastError = null;
    for (const attempt of attempts) {
      const { response, data } = await attempt.run();
      if (response.ok && (data?.success === true || data === null)) {
        return { strategy: attempt.id, data };
      }
      const message = extractCloudflareErrorMessage(data, response.status);
      if (response.status === 401 || response.status === 403 || response.status === 404 || response.status === 429) {
        throw new Error(message);
      }
      lastError = new Error(message);
    }
    throw lastError || new Error("Cloudflare deploy failed.");
  }

  function generateWorkerScript(name, description, flow) {
    const safeName = JSON.stringify(name || "Akompani Agent");
    const safeDescription = String(description || "").replace(/\*\//g, "* /");

    return `// Generated by Akompani Ops Console (static mode)\n// Agent: ${String(name || "Unnamed").replace(/\n/g, " ")}\n// ${safeDescription}\n\nconst FLOW = ${JSON.stringify(flow?.drawflow || { drawflow: { Home: { data: {} } } }, null, 2)};\nconst AGENT_NAME = ${safeName};\n\nfunction json(data, status = 200) {\n  return new Response(JSON.stringify(data, null, 2), {\n    status,\n    headers: {\n      "content-type": "application/json; charset=utf-8",\n      "cache-control": "no-store",\n      "access-control-allow-origin": "*",\n      "access-control-allow-methods": "GET,POST,OPTIONS",\n      "access-control-allow-headers": "content-type,authorization,x-debug-token",\n    },\n  });\n}\n\nexport default {\n  async fetch(request, env) {\n    if (request.method === "OPTIONS") return json({ ok: true });\n    const url = new URL(request.url);\n\n    if (url.pathname === "/health") {\n      return json({\n        ok: true,\n        agent: AGENT_NAME,\n        nodeCount: Object.keys(FLOW?.drawflow?.Home?.data || {}).length,\n      });\n    }\n\n    if (url.pathname === "/flow") {\n      const expected = String(env.FLOW_DEBUG_TOKEN || env.DEBUG_FLOW_TOKEN || "").trim();\n      const got = String(request.headers.get("x-debug-token") || "").trim();\n      if (!expected || got !== expected) {\n        return json({ error: "Unauthorized." }, 401);\n      }\n      return json({ flow: FLOW });\n    }\n\n    if (request.method === "POST") {\n      let input = null;\n      try {\n        input = await request.json();\n      } catch {\n        // Keep null.\n      }\n      return json({\n        ok: true,\n        agent: AGENT_NAME,\n        received: input !== null,\n        note: "Attach your own runtime/LLM handler to execute FLOW.",\n      });\n    }\n\n    return json({\n      agent: AGENT_NAME,\n      status: "ready",\n      endpoints: ["/health", "/flow (debug-token)", "/ (POST)"],\n    });\n  },\n};\n`;
  }

  async function deployToCloudflare(agent, flow, payload) {
    const token = getCloudflareToken();
    if (!token) {
      throw new Error("Cloudflare token not found in session. Connect in Deploy settings first.");
    }

    const accountId = getCloudflareAccountId(payload.accountId);
    if (!accountId) {
      throw new Error("Cloudflare account ID is required.");
    }

    const workerName = sanitizeWorkerName(payload.workerName || agent?.name || "akompani-agent");
    const target = String(payload.target || "cloudflare_workers").trim() || "cloudflare_workers";
    const script = generateWorkerScript(agent?.name || workerName, payload.description || agent?.description || "", flow);
    if (!script.trim()) {
      throw new Error("Generated worker script is empty.");
    }
    if (typeof FormData === "undefined" || typeof Blob === "undefined") {
      throw new Error("Browser does not support required upload APIs (FormData/Blob).");
    }
    if (script.length > 2_500_000) {
      throw new Error("Generated worker script is too large for direct browser deploy.");
    }

    const deployUrl = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts/${encodeURIComponent(workerName)}`;
    let deployData = null;
    let deployError = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const uploaded = await uploadCloudflareWorkerScript({ deployUrl, token, script });
        deployData = uploaded.data;
        deployError = null;
        break;
      } catch (error) {
        deployError = error;
        const message = toErrorMessage(error).toLowerCase();
        const isRetryable =
          message.includes("timed out") ||
          message.includes("network") ||
          message.includes("(500)") ||
          message.includes("(502)") ||
          message.includes("(503)") ||
          message.includes("(504)") ||
          message.includes("(429)");
        if (!isRetryable || attempt >= 2) break;
        await delay(450 * (attempt + 1));
      }
    }
    if (deployError) throw deployError;

    let workerUrl = "";
    try {
      const { response: subdomainRes, data: subdomainData } = await cloudflareApiRequest(
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/subdomain`,
        token,
        { method: "GET" },
      );
      if (subdomainRes.ok && subdomainData?.success && subdomainData?.result?.subdomain) {
        workerUrl = `https://${workerName}.${subdomainData.result.subdomain}.workers.dev`;
      }
    } catch {
      // Keep dashboard fallback.
    }

    const dashboardUrl = `https://dash.cloudflare.com/?to=/:account/workers/services/view/${encodeURIComponent(workerName)}/production`;
    const finalUrl = workerUrl || dashboardUrl;

    appendDeploymentRecord({
      id: randomId("cf"),
      agentId: agent?.id || "",
      name: agent?.name || workerName,
      target,
      status: "generated",
      updatedAt: nowIso(),
      url: finalUrl,
      workerName,
      accountId,
    });

    return {
      success: true,
      workerName,
      accountId,
      target,
      url: finalUrl,
      cloudflare: deployData,
    };
  }

  function toBase64Utf8(value) {
    const text = String(value || "");
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  async function githubApi(pathname, token, options = {}) {
    const response = await fetch(`https://api.github.com${pathname}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.headers || {}),
      },
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const error = new Error(data?.message || `GitHub API failed (${response.status})`);
      error.status = response.status;
      throw error;
    }

    return data;
  }

  function githubPath(value) {
    return String(value || "")
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
  }

  async function getGithubFileSha(owner, repo, path, branch, token) {
    try {
      const data = await githubApi(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${githubPath(path)}?ref=${encodeURIComponent(branch)}`,
        token,
      );
      return String(data?.sha || "");
    } catch (error) {
      if (Number(error?.status || 0) === 404 || String(error?.message || "").toLowerCase() === "not found") {
        return "";
      }
      throw error;
    }
  }

  async function upsertGithubFile(owner, repo, branch, token, path, content, message) {
    const existingSha = await getGithubFileSha(owner, repo, path, branch, token);
    const body = {
      message,
      content: toBase64Utf8(content),
      branch,
    };
    if (existingSha) {
      body.sha = existingSha;
    }

    return githubApi(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${githubPath(path)}`,
      token,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
  }

  async function pushWorkerToGithub(agent, flow, payload) {
    const token = getGithubToken();
    if (!token) {
      throw new Error("GitHub token not found in session. Connect in Deploy settings first.");
    }

    const repository = String(payload.repository || "").trim();
    if (!repository || !repository.includes("/")) {
      throw new Error("repository must be in owner/repo format.");
    }

    const [owner, repo] = repository.split("/");
    const branch = String(payload.branch || "main").trim() || "main";
    const message = String(payload.commitMessage || "Deploy agent via Akompani").trim() || "Deploy agent via Akompani";
    const workerName = sanitizeWorkerName(payload.workerName || agent?.name || "akompani-agent");

    const script = generateWorkerScript(agent?.name || workerName, payload.description || agent?.description || "", flow);
    const wranglerConfig = [
      `name = "${workerName}"`,
      'main = "src/worker.js"',
      `compatibility_date = "${new Date().toISOString().split("T")[0]}"`,
      "",
    ].join("\n");

    await upsertGithubFile(owner, repo, branch, token, "src/worker.js", script, message);
    const wranglerCommit = await upsertGithubFile(owner, repo, branch, token, "wrangler.toml", wranglerConfig, message);

    const commitUrl = String(wranglerCommit?.commit?.html_url || "");

    appendDeploymentRecord({
      id: randomId("gh"),
      agentId: agent?.id || "",
      name: agent?.name || workerName,
      target: "github",
      status: "generated",
      updatedAt: nowIso(),
      url: commitUrl,
      repository,
      branch,
    });

    return {
      success: true,
      repository,
      branch,
      workerName,
      commitUrl,
    };
  }

  async function llmStaticReply(agent, flow, payload) {
    const cfg = getLlmConfig();
    if (!cfg.endpoint || !cfg.model || !cfg.apiKey) {
      throw new Error("LLM endpoint/model/key not configured. Set them in Deploy view.");
    }

    const endpoint = cfg.endpoint.trim();
    const isHttps = endpoint.startsWith("https://");
    const isLocal = endpoint.startsWith("http://localhost") || endpoint.startsWith("http://127.0.0.1");
    if (!isHttps && !isLocal) {
      throw new Error("LLM endpoint must use HTTPS (or localhost).");
    }

    const summary = flowSummary(flow);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: buildLlmHeaders(cfg),
        body: JSON.stringify({
          model: cfg.model,
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "You are a deployment assistant for a static browser IDE. Reply concisely and technically. Use plain text.",
            },
            {
              role: "user",
              content: safeStringify({
                request: "Generate a helpful static dry-run reply for this agent invocation.",
                originUrl: payload.originUrl || (originInput ? originInput.value : "") || window.location.origin,
                agent: {
                  id: agent?.id || "",
                  name: agent?.name || "",
                  description: agent?.description || "",
                },
                flowSummary: summary,
                input: payload.input || null,
              }),
            },
          ],
        }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") throw new Error("LLM request timed out (45s). Try again.");
      throw new Error(`Network error: ${err.message}`);
    }
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const msg = data?.error?.message || data?.error || `LLM request failed (${response.status})`;
      throw new Error(String(msg));
    }

    let content = data?.choices?.[0]?.message?.content;
    if (Array.isArray(content)) {
      content = content
        .map((chunk) => {
          if (typeof chunk === "string") return chunk;
          if (chunk && typeof chunk.text === "string") return chunk.text;
          if (chunk && typeof chunk.content === "string") return chunk.content;
          return "";
        })
        .join("\n")
        .trim();
    }

    return String(content || "").trim() || "No LLM output.";
  }

  async function runAgentPrompt(agent, flow, payload) {
    if (!flow) {
      throw new Error("Select an agent or flow first.");
    }

    const evaluation = evaluateFlow(flow, true);
    let llmReply = "";
    if (payload.useLlm) {
      llmReply = await llmStaticReply(agent, flow, payload);
    }

    return {
      status: "static_run_complete",
      mode: "static-first",
      runtime: "browser",
      agentId: agent?.id || null,
      flowId: flow?.id || null,
      input: payload.input || null,
      summary: evaluation.summary,
      checks: evaluation.checks,
      note:
        "This is a static dry-run summary. For full execution semantics, deploy the worker and call its runtime endpoint.",
      llmReply: llmReply || undefined,
    };
  }

  async function runEvalPrompt(agent, flow, payload) {
    if (!agent) {
      throw new Error("Select an agent first.");
    }
    if (!flow) {
      throw new Error("Selected agent has no flow snapshot. Save current flow as agent first.");
    }

    const evaluation = evaluateFlow(flow, payload.strict !== false);
    const record = {
      id: randomId("eval"),
      agentId: agent.id,
      flowId: flow.id,
      summary: {
        passed: evaluation.passed,
        total: evaluation.total,
        passRate: evaluation.passRate,
      },
      checks: evaluation.checks,
      createdAt: nowIso(),
      finishedAt: nowIso(),
      source: "ops_console_static",
    };
    appendEvalRecord(record);

    return {
      status: "evaluated",
      eval: record,
    };
  }

  async function runFinalizePrompt(agent, flow, payload) {
    if (!agent) {
      throw new Error("Select an agent first.");
    }

    const evalResult = await runEvalPrompt(agent, flow, {
      strict: true,
    });

    const required = Number(payload.requirePassRate || 100);
    const passRate = Number(evalResult.eval?.summary?.passRate || 0);
    if (passRate < required) {
      throw new Error(`Finalize blocked: passRate ${passRate}% is below required ${required}%.`);
    }

    const release = {
      id: randomId("release"),
      agentId: agent.id,
      flowId: flow?.id || "",
      status: "released",
      notes: String(payload.notes || "finalized from static ops console").trim(),
      evalId: evalResult.eval.id,
      updatedAt: nowIso(),
      source: "ops_console_static",
    };
    appendReleaseRecord(release);

    let deployment = null;
    if (payload.autoDeployCloudflare) {
      deployment = await deployToCloudflare(agent, flow, payload);
    }

    return {
      status: "finalized",
      release,
      deployment,
    };
  }

  function renderSelect(selectEl, options, emptyLabel, optionLabel) {
    const previous = selectEl.value;
    selectEl.innerHTML = "";

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = emptyLabel;
    selectEl.appendChild(emptyOption);

    for (const option of options) {
      const node = document.createElement("option");
      node.value = option.value;
      node.textContent = optionLabel(option);
      selectEl.appendChild(node);
    }

    if (previous && options.some((item) => item.value === previous)) {
      selectEl.value = previous;
    }
  }

  function computeFlowOptions() {
    const rows = [];

    for (const flow of sortedByUpdatedAt(state.flows)) {
      rows.push({
        value: `flow:${flow.id}`,
        name: flow.name || flow.id,
        id: flow.id,
        source: "flow",
        updatedAt: flow.updatedAt || flow.createdAt || "",
      });
    }

    for (const agent of sortedByUpdatedAt(state.agents)) {
      if (agent && agent.flow && agent.flow.drawflow) {
        rows.push({
          value: `agent:${agent.id}`,
          name: `${agent.name || agent.id} snapshot`,
          id: agent.id,
          source: "agent",
          updatedAt: agent.updatedAt || agent.createdAt || "",
        });
      }
    }

    return rows.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  }

  function patchTemplatePayload(payload) {
    const out = typeof payload === "object" && payload !== null ? JSON.parse(JSON.stringify(payload)) : {};

    if (!out.agentId && agentSelect.value) {
      out.agentId = agentSelect.value;
    }

    if (!out.flowId && flowSelect.value) {
      out.flowId = flowSelect.value;
    }

    if (!out.originUrl) {
      out.originUrl = originInput.value || window.location.origin;
    }

    return out;
  }

  async function executePrompt(promptId, payload, button) {
    if (button) button.disabled = true;
    resultPane.textContent = "Running...";

    const agent = selectedAgent();
    const flow = selectedFlow();

    try {
      const patched = patchTemplatePayload(payload);
      let response;

      if (promptId === "agent_run_wait") {
        response = await runAgentPrompt(agent, flow, patched);
      } else if (promptId === "agent_eval_quick") {
        response = await runEvalPrompt(agent, flow, patched);
      } else if (promptId === "deploy_cf_elysia") {
        if (!agent && !flow) {
          throw new Error("Select an agent or flow first.");
        }
        response = await deployToCloudflare(agent, flow, patched);
      } else if (promptId === "push_github_worker") {
        if (!agent && !flow) {
          throw new Error("Select an agent or flow first.");
        }
        response = await pushWorkerToGithub(agent, flow, patched);
      } else if (promptId === "finalize_agent") {
        response = await runFinalizePrompt(agent, flow, patched);
      } else {
        throw new Error(`Unsupported prompt: ${promptId}`);
      }

      resultPane.textContent = safeStringify({
        promptId,
        payload: patched,
        response,
      });

      await refreshData({ preserveResult: true });
    } catch (error) {
      resultPane.textContent = `Prompt execution failed: ${error.message}`;
    } finally {
      if (button) button.disabled = false;
    }
  }

  function renderPromptCards() {
    promptGrid.innerHTML = "";

    for (const prompt of state.prompts) {
      const card = document.createElement("article");
      card.className = "prompt-card";

      const title = document.createElement("h3");
      title.className = "prompt-title";
      title.textContent = prompt.title || prompt.id;

      const desc = document.createElement("p");
      desc.className = "prompt-desc";
      desc.textContent = prompt.description || "";

      const textarea = document.createElement("textarea");
      textarea.spellcheck = false;
      textarea.value = safeStringify(prompt.payloadTemplate || {});

      const actions = document.createElement("div");
      actions.className = "prompt-actions";

      const badge = document.createElement("span");
      badge.className = `badge ${prompt.badgeClass || "badge-info"}`;
      badge.textContent = prompt.badge || "Action";

      const runBtn = document.createElement("button");
      runBtn.className = "btn btn-primary btn-sm";
      runBtn.textContent = "Execute";
      runBtn.type = "button";
      runBtn.addEventListener("click", async () => {
        let payload;
        try {
          payload = JSON.parse(textarea.value || "{}");
        } catch (error) {
          resultPane.textContent = `Invalid JSON for ${prompt.id}: ${error.message}`;
          return;
        }
        await executePrompt(prompt.id, payload, runBtn);
      });

      const resetBtn = document.createElement("button");
      resetBtn.className = "btn btn-ghost btn-sm";
      resetBtn.textContent = "Reset";
      resetBtn.type = "button";
      resetBtn.addEventListener("click", () => {
        textarea.value = safeStringify(prompt.payloadTemplate || {});
      });

      actions.appendChild(badge);
      const right = document.createElement("div");
      right.style.display = "flex";
      right.style.gap = "8px";
      right.appendChild(resetBtn);
      right.appendChild(runBtn);
      actions.appendChild(right);

      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(textarea);
      card.appendChild(actions);
      promptGrid.appendChild(card);
    }
  }

  async function refreshData(options = {}) {
    const preserveResult = Boolean(options.preserveResult);
    state.agents = sortedByUpdatedAt(readJsonArray(STORAGE.localAgents));
    state.flows = sortedByUpdatedAt(readJsonArray(STORAGE.localFlows));

    const agentOptions = state.agents.map((agent) => ({
      value: agent.id,
      name: agent.name || agent.id,
      flowId: agent.flowId || "",
      updatedAt: agent.updatedAt || agent.createdAt || "",
    }));

    renderSelect(agentSelect, agentOptions, "(select agent)", (option) => `${option.name} (${option.value})`);

    const flowOptions = computeFlowOptions();
    renderSelect(
      flowSelect,
      flowOptions,
      "(select flow)",
      (option) =>
        option.source === "agent"
          ? `${option.name} [agent snapshot]`
          : `${option.name} (${option.id})`,
    );

    const activeAgent = selectedAgent();
    if (!flowSelect.value && activeAgent && activeAgent.flow && activeAgent.flow.drawflow) {
      flowSelect.value = `agent:${activeAgent.id}`;
    }

    renderPromptCards();
    if (!preserveResult) {
      resultPane.textContent = safeStringify({
        status: "ready",
        mode: "static-first",
        origin: originInput.value || window.location.origin,
        agents: state.agents.length,
        flows: state.flows.length,
        deployments: readJsonArray(STORAGE.localDeployments).length,
        evals: readJsonArray(STORAGE.localEvals).length,
        releases: readJsonArray(STORAGE.localReleases).length,
        integrations: {
          githubConnected: Boolean(getGithubToken()),
          cloudflareConnected: Boolean(getCloudflareToken()),
          llmConfigured: Boolean(getLlmConfig().endpoint && getLlmConfig().model && getLlmConfig().apiKey),
        },
      });
    }
  }

  async function boot() {
    originInput.value = window.location.origin;

    agentSelect.addEventListener("change", () => {
      if (agentSelect.value) {
        const preferredAgentFlow = `agent:${agentSelect.value}`;
        const hasAgentFlow = Array.from(flowSelect.options).some((item) => item.value === preferredAgentFlow);
        if (hasAgentFlow) {
          flowSelect.value = preferredAgentFlow;
        }
      }
    });

    if (refreshBtn) {
      refreshBtn.addEventListener("click", async () => {
        try {
          await refreshData();
        } catch (error) {
          resultPane.textContent = `Refresh failed: ${error.message}`;
        }
      });
    }

    try {
      await refreshData();
    } catch (error) {
      resultPane.textContent = `Boot failed: ${error.message}`;
    }
  }

  boot();
})();
