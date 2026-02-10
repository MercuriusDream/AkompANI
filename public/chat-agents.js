(() => {
  const refreshBtn = document.getElementById("refreshBtn");
  const showAllToggle = document.getElementById("showAllToggle");
  const chatModeSelect = document.getElementById("chatModeSelect");
  const agentList = document.getElementById("agentList");
  const threadList = document.getElementById("threadList");
  const newThreadBtn = document.getElementById("newThreadBtn");
  const renameThreadBtn = document.getElementById("renameThreadBtn");
  const archiveThreadBtn = document.getElementById("archiveThreadBtn");
  const deleteThreadBtn = document.getElementById("deleteThreadBtn");
  const agentBadge = document.getElementById("agentBadge");
  const threadBadge = document.getElementById("threadBadge");
  const chatTitle = document.getElementById("chatTitle");
  const finalizeBtn = document.getElementById("finalizeBtn");
  const messagesEl = document.getElementById("messages");
  const promptInput = document.getElementById("promptInput");
  const sendBtn = document.getElementById("sendBtn");
  const sendHint = document.getElementById("sendHint");
  const statusPane = document.getElementById("statusPane");
  const agentDetails = document.getElementById("agentDetails");
  const statEval = document.getElementById("statEval");
  const statDeployments = document.getElementById("statDeployments");
  const statThreads = document.getElementById("statThreads");

  const STORAGE = {
    localAgents: "voyager_local_agents",
    localDeployments: "voyager_local_deployments",
    localEvals: "voyager_local_evals",
    localReleases: "voyager_local_releases",
    localThreads: "voyager_local_chat_threads",
    localMessages: "voyager_local_chat_messages",
    chatMode: "voyager_chat_runtime_mode",
    llmEndpoint: "voyager_llm_endpoint",
    llmModel: "voyager_llm_model",
    llmApiKey: "voyager_llm_api_key",
    llmApiKeyLegacy: "voyager_openai_key",
    cfToken: "voyager_oauth_cloudflare_token",
    cfTokenLegacy: "voyager_cf_api_token",
    cfAccountId: "voyager_cf_account_id",
  };

  const state = {
    agents: [],
    evals: [],
    deployments: [],
    releases: [],
    allThreads: [],
    allMessages: [],
    threads: [],
    selectedAgentId: "",
    selectedThreadId: "",
    showAll: false,
    busy: false,
  };

  function stringify(value) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  function setStatus(value) {
    if (!statusPane) return;
    statusPane.textContent = stringify(value);
  }

  function readLocal(key) {
    try {
      return String(localStorage.getItem(key) || "").trim();
    } catch {
      return "";
    }
  }

  function writeLocal(key, value) {
    try {
      const clean = String(value || "").trim();
      if (clean) {
        localStorage.setItem(key, clean);
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignore storage errors.
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

  function writeJsonArray(key, rows) {
    try {
      localStorage.setItem(key, JSON.stringify(Array.isArray(rows) ? rows : []));
    } catch {
      // Ignore storage errors.
    }
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function randomId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  }

  function sortByNewest(rows, keys = ["updatedAt", "finishedAt", "createdAt"]) {
    return [...rows].sort((a, b) => {
      const aKey = keys.map((k) => String(a?.[k] || "")).find(Boolean) || "";
      const bKey = keys.map((k) => String(b?.[k] || "")).find(Boolean) || "";
      return bKey.localeCompare(aKey);
    });
  }

  function selectedAgent() {
    return state.agents.find((agent) => agent.id === state.selectedAgentId) || null;
  }

  function selectedThread() {
    return state.threads.find((thread) => thread.id === state.selectedThreadId) || null;
  }

  function latestEval(agentId) {
    return state.evals.find((item) => item.agentId === agentId) || null;
  }

  function latestRelease(agentId) {
    return state.releases.find((item) => item.agentId === agentId) || null;
  }

  function deploymentMatchesAgent(deployment, agent) {
    if (!deployment || !agent) return false;
    if (deployment.agentId === agent.id) return true;

    const depName = String(deployment.name || "").trim().toLowerCase();
    const agentName = String(agent.name || "").trim().toLowerCase();
    return Boolean(depName && agentName && depName === agentName);
  }

  function deploymentsForAgent(agentId) {
    const agent = state.agents.find((item) => item.id === agentId);
    if (!agent) return [];
    return state.deployments.filter((deployment) => deploymentMatchesAgent(deployment, agent));
  }

  function latestDeployment(agentId) {
    const rows = deploymentsForAgent(agentId).filter((item) => item.status === "generated");
    return rows[0] || null;
  }

  function latestCloudflareDeployment(agentId) {
    const rows = deploymentsForAgent(agentId).filter((item) => {
      if (item.status !== "generated") return false;
      const target = String(item.target || "").toLowerCase();
      const url = String(item.url || "").trim();
      return target.includes("cloudflare") && /^https?:\/\//i.test(url);
    });
    return rows[0] || null;
  }

  function isFinalized(agentId) {
    const release = latestRelease(agentId);
    if (release && String(release.status || "") === "released") {
      return true;
    }

    const evalRun = latestEval(agentId);
    const deploy = latestDeployment(agentId);
    if (!evalRun || !deploy) return false;

    return Number(evalRun?.summary?.passRate || 0) >= 100;
  }

  function getCloudflareToken() {
    return readSession(STORAGE.cfToken) || readSession(STORAGE.cfTokenLegacy);
  }

  function getCloudflareAccountId() {
    return readLocal(STORAGE.cfAccountId);
  }

  function getIdeRuntime() {
    const ide = window.CANARIA_IDE;
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

    const endpoint =
      readLocal(STORAGE.llmEndpoint) ||
      "https://api.openai.com/v1/chat/completions";

    const model =
      readLocal(STORAGE.llmModel) ||
      "gpt-4o-mini";

    const apiKey =
      readSession(STORAGE.llmApiKey) ||
      readSession(STORAGE.llmApiKeyLegacy);

    return {
      endpoint,
      model,
      apiKey,
      headers: {},
    };
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
        description: "Flow exists",
        passed: Boolean(flow && flow.drawflow),
      },
      {
        id: "has_nodes",
        description: "Has at least one node",
        passed: summary.nodeCount > 0,
      },
      {
        id: "has_start",
        description: "Contains start node",
        passed: summary.startCount > 0,
      },
      {
        id: "has_end",
        description: "Contains end node",
        passed: summary.endCount > 0,
      },
      {
        id: "valid_connections",
        description: "No broken node connections",
        passed: summary.brokenConnections === 0,
      },
    ];

    if (strict) {
      checks.push({
        id: "has_exec_path",
        description: "Has at least one executable connection",
        passed: summary.validConnections > 0,
      });
    }

    const passed = checks.filter((row) => row.passed).length;
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

  function sanitizeWorkerName(input, fallback = "canaria-agent") {
    const normalized = String(input || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");
    return normalized || fallback;
  }

  function generateWorkerScript(agent) {
    const name = String(agent?.name || "CANARIA Agent");
    const description = String(agent?.description || "").replace(/\*\//g, "* /");
    const drawflow = agent?.flow || { drawflow: { Home: { data: {} } } };

    return `// Generated by CANARIA Chat Console (static mode)\n// Agent: ${name.replace(/\n/g, " ")}\n// ${description}\n\nconst FLOW = ${JSON.stringify(drawflow, null, 2)};\nconst AGENT_NAME = ${JSON.stringify(name)};\n\nfunction json(data, status = 200) {\n  return new Response(JSON.stringify(data, null, 2), {\n    status,\n    headers: {\n      \"content-type\": \"application/json; charset=utf-8\",\n      \"cache-control\": \"no-store\",\n      \"access-control-allow-origin\": \"*\",\n      \"access-control-allow-methods\": \"GET,POST,OPTIONS\",\n      \"access-control-allow-headers\": \"content-type,authorization,x-debug-token\",\n    },\n  });\n}\n\nexport default {\n  async fetch(request) {\n    if (request.method === \"OPTIONS\") return json({ ok: true });\n    const url = new URL(request.url);\n\n    if (url.pathname === \"/health\") {\n      return json({\n        ok: true,\n        agent: AGENT_NAME,\n        nodeCount: Object.keys(FLOW?.drawflow?.Home?.data || {}).length,\n      });\n    }\n\n    if (request.method === \"POST\") {\n      let input = null;\n      try {\n        input = await request.json();\n      } catch {\n        // Keep null.\n      }\n\n      return json({\n        ok: true,\n        agent: AGENT_NAME,\n        reply: \"Worker is reachable. Attach your runtime + tool logic to execute FLOW.\",\n        received: input,\n      });\n    }\n\n    return json({\n      status: \"ready\",\n      agent: AGENT_NAME,\n      endpoints: [\"POST /\", \"GET /health\"],\n    });\n  },\n};\n`;
  }

  function persistDeployments() {
    writeJsonArray(STORAGE.localDeployments, state.deployments.slice(0, 300));
  }

  function persistEvals() {
    writeJsonArray(STORAGE.localEvals, state.evals.slice(0, 500));
  }

  function persistReleases() {
    writeJsonArray(STORAGE.localReleases, state.releases.slice(0, 300));
  }

  function persistThreads() {
    writeJsonArray(STORAGE.localThreads, state.allThreads.slice(0, 500));
  }

  function persistMessages() {
    if (state.allMessages.length > 5000) {
      state.allMessages = state.allMessages.slice(-5000);
    }
    writeJsonArray(STORAGE.localMessages, state.allMessages);
  }

  function updateThreadRecord(threadId, patch) {
    const idx = state.allThreads.findIndex((item) => item.id === threadId);
    if (idx < 0) return;

    state.allThreads[idx] = {
      ...state.allThreads[idx],
      ...patch,
      updatedAt: nowIso(),
    };
    persistThreads();
  }

  function listMessagesForThread(threadId) {
    return sortByNewest(
      state.allMessages.filter((msg) => msg.threadId === threadId),
      ["createdAt"],
    ).reverse();
  }

  function appendMessage(threadId, role, content, metadata = {}) {
    const message = {
      id: randomId("msg"),
      threadId,
      role,
      content: String(content || ""),
      createdAt: nowIso(),
      metadata,
    };

    state.allMessages.push(message);
    persistMessages();
    updateThreadRecord(threadId, { lastMessageAt: message.createdAt });
    return message;
  }

  function getRuntimeMode() {
    const value = String(chatModeSelect?.value || "auto");
    if (value === "cloudflare" || value === "local") return value;
    return "auto";
  }

  function resolveRuntime(agentId) {
    const mode = getRuntimeMode();
    const deployment = latestCloudflareDeployment(agentId);

    if (mode === "cloudflare") {
      if (!deployment) {
        throw new Error("No Cloudflare deployment found for this agent.");
      }
      return {
        mode: "cloudflare",
        deployment,
      };
    }

    if (mode === "local") {
      return {
        mode: "local",
        deployment: null,
      };
    }

    if (deployment) {
      return {
        mode: "cloudflare",
        deployment,
      };
    }

    return {
      mode: "local",
      deployment: null,
    };
  }

  async function deployToCloudflare(agent) {
    const token = getCloudflareToken();
    const accountId = getCloudflareAccountId();

    if (!token || !accountId) {
      throw new Error("Cloudflare token and account ID are required for deploy.");
    }

    if (!agent?.flow?.drawflow) {
      throw new Error("Agent has no flow snapshot to deploy.");
    }

    const workerName = sanitizeWorkerName(agent.name || agent.id);
    const script = generateWorkerScript(agent);
    const deployUrl = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts/${encodeURIComponent(workerName)}`;

    const response = await fetch(deployUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/javascript",
      },
      body: script,
    });

    const data = await response.json().catch(() => null);
    if (!(response.ok && data?.success)) {
      const firstError = Array.isArray(data?.errors) && data.errors[0] ? data.errors[0].message : "";
      throw new Error(firstError || data?.error || `Cloudflare deploy failed (${response.status})`);
    }

    let workerUrl = "";
    try {
      const subRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/subdomain`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const subData = await subRes.json().catch(() => null);
      if (subRes.ok && subData?.success && subData?.result?.subdomain) {
        workerUrl = `https://${workerName}.${subData.result.subdomain}.workers.dev`;
      }
    } catch {
      // Keep dashboard fallback.
    }

    const dashboardUrl = `https://dash.cloudflare.com/?to=/:account/workers/services/view/${encodeURIComponent(workerName)}/production`;
    const url = workerUrl || dashboardUrl;

    const record = {
      id: randomId("cf"),
      agentId: agent.id,
      name: agent.name || workerName,
      target: "cloudflare_workers",
      status: "generated",
      updatedAt: nowIso(),
      url,
      workerName,
      accountId,
      source: "chat_agents_static",
    };

    state.deployments.unshift(record);
    state.deployments = sortByNewest(state.deployments);
    persistDeployments();
    return record;
  }

  function parseChatCompletionsContent(data) {
    let content = data?.choices?.[0]?.message?.content;
    if (Array.isArray(content)) {
      content = content
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item.text === "string") return item.text;
          if (item && typeof item.content === "string") return item.content;
          return "";
        })
        .join("\n")
        .trim();
    }

    if (typeof content === "string" && content.trim()) {
      return content.trim();
    }

    if (typeof data?.output_text === "string" && data.output_text.trim()) {
      return data.output_text.trim();
    }

    return "";
  }

  function buildMessageHistory(threadId) {
    const rows = listMessagesForThread(threadId).slice(-12);
    return rows
      .filter((item) => item.role === "user" || item.role === "assistant")
      .map((item) => ({
        role: item.role,
        content: String(item.content || ""),
      }));
  }

  async function localByokReply(agent, threadId, text) {
    const cfg = getLlmConfig();
    if (!cfg.apiKey || !cfg.endpoint || !cfg.model) {
      throw new Error("BYOK not configured. Set LLM endpoint/model/key in Deploy settings.");
    }

    const endpoint = cfg.endpoint.trim();
    const isHttps = endpoint.startsWith("https://");
    const isLocal = endpoint.startsWith("http://localhost") || endpoint.startsWith("http://127.0.0.1");
    if (!isHttps && !isLocal) {
      throw new Error("LLM endpoint must use HTTPS (or localhost for development).");
    }

    const summary = flowSummary(agent.flow || {});
    const history = buildMessageHistory(threadId);

    const systemPrompt = [
      "You are a practical AI agent runtime assistant for a browser IDE.",
      `Agent name: ${agent.name || agent.id}`,
      `Agent instruction: ${agent.instruction || agent.description || "(none)"}`,
      `Flow summary: ${summary.nodeCount} nodes, starts ${summary.startCount}, ends ${summary.endCount}.`,
      "Answer concisely and directly for user requests.",
    ].join(" ");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: buildLlmHeaders(cfg),
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...history,
          {
            role: "user",
            content: text,
          },
        ],
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = data?.error?.message || data?.error || `LLM request failed (${response.status})`;
      throw new Error(String(detail));
    }

    const content = parseChatCompletionsContent(data);
    if (content) return content;
    return stringify(data);
  }

  async function cloudflareReply(agent, deployment, threadId, text) {
    const baseUrl = String(deployment?.url || "").trim().replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(baseUrl)) {
      throw new Error("Selected deployment has no valid URL.");
    }

    const history = buildMessageHistory(threadId);
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: text,
        message: text,
        threadId,
        agentId: agent.id,
        history,
        source: "chat_agents_static",
      }),
    });

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    const isJson = contentType.includes("application/json");
    const body = isJson
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");

    if (!response.ok) {
      if (isJson) {
        throw new Error(body?.error || body?.message || `Worker request failed (${response.status})`);
      }
      throw new Error(String(body || `Worker request failed (${response.status})`));
    }

    if (!isJson) {
      return String(body || "").trim() || "Worker replied with empty text.";
    }

    const reply =
      body?.reply ||
      body?.response ||
      body?.content ||
      body?.message ||
      body?.output?.text ||
      body?.result?.output;

    if (typeof reply === "string" && reply.trim()) {
      return reply.trim();
    }

    if (reply && typeof reply === "object") {
      return stringify(reply);
    }

    return stringify(body);
  }

  function renderAgentRows() {
    const rows = state.agents
      .map((agent) => ({
        agent,
        finalized: isFinalized(agent.id),
      }))
      .filter((row) => (state.showAll ? true : row.finalized));

    agentList.innerHTML = "";
    if (rows.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = "<p>No agents found. Save one from Deploy view first.</p>";
      agentList.appendChild(empty);
      return;
    }

    for (const row of rows) {
      const card = document.createElement("article");
      card.className = "agent-item";
      if (state.selectedAgentId === row.agent.id) {
        card.classList.add("active");
      }

      const header = document.createElement("div");
      header.className = "agent-header";

      const name = document.createElement("span");
      name.className = "agent-name";
      name.textContent = row.agent.name || row.agent.id;

      const status = document.createElement("span");
      status.className = "agent-status";
      if (row.finalized) {
        status.classList.add("finalized");
        status.textContent = "Finalized";
      } else if (latestEval(row.agent.id) || latestDeployment(row.agent.id)) {
        status.classList.add("pending");
        status.textContent = "Partial";
      } else {
        status.classList.add("pending");
        status.textContent = "Draft";
      }

      header.appendChild(name);
      header.appendChild(status);

      const desc = document.createElement("p");
      desc.className = "agent-desc";
      desc.textContent = row.agent.description || row.agent.instruction || "No description";

      card.appendChild(header);
      card.appendChild(desc);

      card.addEventListener("click", () => {
        state.selectedAgentId = row.agent.id;
        state.selectedThreadId = "";
        refreshThreads();
        render();
      });

      agentList.appendChild(card);
    }
  }

  function renderThreadRows() {
    threadList.innerHTML = "";

    if (!state.selectedAgentId) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = "<p>Select an agent to load threads.</p>";
      threadList.appendChild(empty);
      return;
    }

    if (state.threads.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = "<p>No threads yet. Create one.</p>";
      threadList.appendChild(empty);
      return;
    }

    for (const thread of state.threads) {
      const card = document.createElement("article");
      card.className = "thread-item";
      if (state.selectedThreadId === thread.id) {
        card.classList.add("active");
      }

      const name = document.createElement("p");
      name.className = "thread-name";
      name.textContent = thread.title || "Untitled thread";

      const meta = document.createElement("p");
      meta.className = "thread-meta";
      const runtime = String(thread.lastRuntime || thread.runtime || "local");
      meta.textContent = `${thread.status || "active"} · ${runtime} · ${formatDate(thread.updatedAt || thread.createdAt)}`;

      card.appendChild(name);
      card.appendChild(meta);

      card.addEventListener("click", () => {
        state.selectedThreadId = thread.id;
        render();
      });

      threadList.appendChild(card);
    }
  }

  function appendMessageNode(role, content, metaText) {
    const row = document.createElement("article");
    row.className = `message ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = role === "user" ? "U" : role === "assistant" ? "A" : "S";

    const body = document.createElement("div");
    body.className = "message-content";

    const text = document.createElement("div");
    text.className = "message-text";
    text.textContent = content;

    body.appendChild(text);

    if (metaText) {
      const meta = document.createElement("div");
      meta.className = "message-meta";
      meta.textContent = metaText;
      body.appendChild(meta);
    }

    row.appendChild(avatar);
    row.appendChild(body);
    messagesEl.appendChild(row);
  }

  function renderMessages() {
    messagesEl.innerHTML = "";

    const thread = selectedThread();
    if (!thread) {
      appendMessageNode("system", "Select or create a thread to chat.", "");
      return;
    }

    const rows = listMessagesForThread(thread.id);
    if (rows.length === 0) {
      appendMessageNode("system", "Thread is empty. Send your first prompt.", "");
      return;
    }

    for (const row of rows) {
      const runtime = row.metadata?.runtime ? ` · ${row.metadata.runtime}` : "";
      appendMessageNode(row.role || "system", row.content || "", `${formatDate(row.createdAt)}${runtime}`);
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderDetailsRows(rows) {
    agentDetails.innerHTML = "";
    for (const [keyText, valueText] of rows) {
      const item = document.createElement("div");
      item.className = "detail-item";

      const key = document.createElement("div");
      key.className = "detail-key";
      key.textContent = keyText;

      const value = document.createElement("div");
      value.className = "detail-value";
      value.textContent = String(valueText);

      item.appendChild(key);
      item.appendChild(value);
      agentDetails.appendChild(item);
    }
  }

  function renderHeaderAndDetails() {
    const agent = selectedAgent();
    const thread = selectedThread();

    if (!agent) {
      agentBadge.classList.remove("active");
      agentBadge.textContent = "Select an agent";
      threadBadge.textContent = "No thread selected";
      chatTitle.textContent = "Chat Console";
      renderDetailsRows([["Agent", "Select an agent"]]);
      if (statEval) statEval.textContent = "-";
      if (statDeployments) statDeployments.textContent = "-";
      if (statThreads) statThreads.textContent = "-";
      return;
    }

    const finalized = isFinalized(agent.id);
    const evalRun = latestEval(agent.id);
    const release = latestRelease(agent.id);
    const deploy = latestDeployment(agent.id);
    const cfDeploy = latestCloudflareDeployment(agent.id);

    let runtimeInfo;
    try {
      runtimeInfo = resolveRuntime(agent.id);
    } catch (error) {
      runtimeInfo = { mode: "unavailable", deployment: null, error: error.message };
    }

    agentBadge.classList.add("active");
    agentBadge.innerHTML = `<span class=\"badge-dot\"></span>${finalized ? "Finalized" : "Needs finalization"} · runtime ${runtimeInfo.mode}`;
    chatTitle.textContent = agent.name || agent.id;
    threadBadge.textContent = thread ? `Thread: ${thread.title || "Untitled thread"}` : "No thread selected";

    const rows = [
      ["Agent ID", agent.id],
      ["Description", agent.description || "(none)"],
      ["Runtime Mode", getRuntimeMode()],
      ["Resolved Runtime", runtimeInfo.mode],
      ["Latest Cloudflare URL", cfDeploy?.url || "(none)"],
      ["Latest Eval", evalRun ? `${evalRun.summary?.passRate || 0}%` : "(none)"],
      ["Latest Release", release ? `${release.status} @ ${formatDate(release.updatedAt)}` : "(none)"],
      ["Local Threads", String(state.threads.length)],
      ["BYOK Configured", getLlmConfig().apiKey ? "yes" : "no"],
      ["Cloudflare Connected", getCloudflareToken() && getCloudflareAccountId() ? "yes" : "no"],
    ];

    renderDetailsRows(rows);

    if (statEval) statEval.textContent = evalRun ? `${Math.round(Number(evalRun.summary?.passRate || 0))}%` : "0%";
    if (statDeployments) statDeployments.textContent = String(deploymentsForAgent(agent.id).length);
    if (statThreads) statThreads.textContent = String(state.threads.length);
  }

  function refreshThreads() {
    const agent = selectedAgent();
    if (!agent) {
      state.threads = [];
      state.selectedThreadId = "";
      return;
    }

    state.threads = sortByNewest(
      state.allThreads.filter((thread) => thread.agentId === agent.id),
      ["updatedAt", "createdAt"],
    );

    if (!state.threads.some((thread) => thread.id === state.selectedThreadId)) {
      state.selectedThreadId = state.threads[0]?.id || "";
    }
  }

  function render() {
    renderAgentRows();
    renderThreadRows();
    renderHeaderAndDetails();
    renderMessages();

    const agent = selectedAgent();
    const thread = selectedThread();
    const finalized = agent ? isFinalized(agent.id) : false;
    const chatAllowed = Boolean(agent) && (state.showAll || finalized);

    if (promptInput) promptInput.disabled = state.busy || !chatAllowed;
    if (sendBtn) sendBtn.disabled = state.busy || !chatAllowed;
    if (finalizeBtn) finalizeBtn.disabled = state.busy || !agent;

    if (renameThreadBtn) renameThreadBtn.disabled = state.busy || !thread;
    if (archiveThreadBtn) archiveThreadBtn.disabled = state.busy || !thread;
    if (deleteThreadBtn) deleteThreadBtn.disabled = state.busy || !thread;

    if (sendHint) {
      if (!agent) {
        sendHint.textContent = "Select an agent to start chatting.";
      } else if (!state.showAll && !finalized) {
        sendHint.textContent = "Only finalized agents can be prompted by default. Toggle Show all to test drafts.";
      } else {
        try {
          const runtime = resolveRuntime(agent.id);
          if (runtime.mode === "cloudflare") {
            sendHint.textContent = "Runtime: Cloudflare deployed worker.";
          } else {
            sendHint.textContent = "Runtime: Local BYOK test via your configured LLM endpoint.";
          }
        } catch (error) {
          sendHint.textContent = error.message;
        }
      }
    }
  }

  function loadCollections() {
    state.agents = sortByNewest(readJsonArray(STORAGE.localAgents));
    state.evals = sortByNewest(readJsonArray(STORAGE.localEvals), ["finishedAt", "updatedAt", "createdAt"]);
    state.deployments = sortByNewest(readJsonArray(STORAGE.localDeployments));
    state.releases = sortByNewest(readJsonArray(STORAGE.localReleases));
    state.allThreads = sortByNewest(readJsonArray(STORAGE.localThreads));
    state.allMessages = sortByNewest(readJsonArray(STORAGE.localMessages), ["createdAt"]);
  }

  async function refreshData(options = {}) {
    const preserveStatus = Boolean(options.preserveStatus);

    loadCollections();

    if (state.selectedAgentId && !state.agents.some((agent) => agent.id === state.selectedAgentId)) {
      state.selectedAgentId = "";
      state.selectedThreadId = "";
    }

    if (!state.selectedAgentId) {
      const firstFinalized = state.agents.find((agent) => isFinalized(agent.id));
      state.selectedAgentId = firstFinalized?.id || state.agents[0]?.id || "";
    }

    refreshThreads();

    if (!preserveStatus) {
      setStatus({
        status: "ready",
        mode: "serverless-static",
        runtimePreference: getRuntimeMode(),
        agents: state.agents.length,
        finalizedAgents: state.agents.filter((agent) => isFinalized(agent.id)).length,
        deployments: state.deployments.length,
        evals: state.evals.length,
        releases: state.releases.length,
        threads: state.allThreads.length,
      });
    }

    render();
  }

  function createThreadTitle() {
    const date = new Date();
    return `Thread ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  function createThreadIfMissing() {
    const agent = selectedAgent();
    if (!agent) {
      throw new Error("Select an agent first.");
    }

    if (state.selectedThreadId) {
      const existing = selectedThread();
      if (existing) return existing;
    }

    let runtime = "local";
    try {
      runtime = resolveRuntime(agent.id).mode;
    } catch {
      runtime = "local";
    }

    const thread = {
      id: randomId("thread"),
      agentId: agent.id,
      title: createThreadTitle(),
      status: "active",
      runtime,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    state.allThreads.unshift(thread);
    persistThreads();
    state.selectedThreadId = thread.id;
    refreshThreads();
    return thread;
  }

  async function createThread() {
    const thread = createThreadIfMissing();
    render();
    return thread;
  }

  async function renameThread() {
    const thread = selectedThread();
    if (!thread) {
      throw new Error("Select a thread first.");
    }

    const next = window.prompt("Thread title", thread.title || "New thread");
    if (next === null) return;

    const title = String(next || "").trim();
    if (!title) return;

    updateThreadRecord(thread.id, { title });
    refreshThreads();
    render();
  }

  async function archiveThread() {
    const thread = selectedThread();
    if (!thread) {
      throw new Error("Select a thread first.");
    }

    updateThreadRecord(thread.id, {
      status: thread.status === "archived" ? "active" : "archived",
    });
    refreshThreads();
    render();
  }

  async function deleteThread() {
    const thread = selectedThread();
    if (!thread) {
      throw new Error("Select a thread first.");
    }

    const ok = window.confirm(`Delete thread \"${thread.title || "Untitled"}\"?`);
    if (!ok) return;

    state.allThreads = state.allThreads.filter((item) => item.id !== thread.id);
    state.allMessages = state.allMessages.filter((item) => item.threadId !== thread.id);
    persistThreads();
    persistMessages();

    state.selectedThreadId = "";
    refreshThreads();
    render();
  }

  async function finalizeAgent() {
    const agent = selectedAgent();
    if (!agent) {
      throw new Error("Select an agent first.");
    }

    if (!agent?.flow?.drawflow) {
      throw new Error("Selected agent has no flow snapshot.");
    }

    const evalResult = evaluateFlow(agent.flow, true);
    const evalRecord = {
      id: randomId("eval"),
      agentId: agent.id,
      flowId: agent.flowId || "",
      summary: {
        passed: evalResult.passed,
        total: evalResult.total,
        passRate: evalResult.passRate,
      },
      checks: evalResult.checks,
      createdAt: nowIso(),
      finishedAt: nowIso(),
      source: "chat_agents_static",
    };

    state.evals.unshift(evalRecord);
    state.evals = sortByNewest(state.evals, ["finishedAt", "updatedAt", "createdAt"]);
    persistEvals();

    if (evalResult.passRate < 100) {
      throw new Error(`Finalize blocked: pass rate ${evalResult.passRate}% is below 100%.`);
    }

    const releaseRecord = {
      id: randomId("release"),
      agentId: agent.id,
      flowId: agent.flowId || "",
      status: "released",
      evalId: evalRecord.id,
      updatedAt: nowIso(),
      source: "chat_agents_static",
    };

    state.releases.unshift(releaseRecord);
    state.releases = sortByNewest(state.releases);
    persistReleases();

    let deployment = null;
    if (getCloudflareToken() && getCloudflareAccountId()) {
      deployment = await deployToCloudflare(agent);
    }

    setStatus({
      status: "finalized",
      eval: evalRecord,
      release: releaseRecord,
      deployment: deployment || "skipped (no Cloudflare connection)",
    });

    await refreshData({ preserveStatus: true });
  }

  async function sendPrompt() {
    const text = String(promptInput?.value || "").trim();
    if (!text) return;

    const agent = selectedAgent();
    if (!agent) {
      throw new Error("Select an agent first.");
    }

    const finalized = isFinalized(agent.id);
    if (!state.showAll && !finalized) {
      throw new Error("Agent must be finalized first (or enable Show all to test draft agents).");
    }

    const thread = createThreadIfMissing();
    appendMessage(thread.id, "user", text, {
      runtime: "queued",
    });
    promptInput.value = "";

    const runtime = resolveRuntime(agent.id);
    updateThreadRecord(thread.id, {
      runtime: runtime.mode,
      lastRuntime: runtime.mode,
    });

    let reply;
    if (runtime.mode === "cloudflare") {
      reply = await cloudflareReply(agent, runtime.deployment, thread.id, text);
    } else {
      reply = await localByokReply(agent, thread.id, text);
    }

    appendMessage(thread.id, "assistant", reply, {
      runtime: runtime.mode,
      deploymentUrl: runtime.deployment?.url || "",
    });

    state.selectedThreadId = thread.id;
    refreshThreads();

    setStatus({
      status: "ok",
      threadId: thread.id,
      runtime: runtime.mode,
      deploymentUrl: runtime.deployment?.url || null,
    });

    render();
  }

  function bindEvents() {
    if (refreshBtn) {
      refreshBtn.addEventListener("click", async () => {
        try {
          await refreshData();
        } catch (error) {
          setStatus({ error: error.message });
        }
      });
    }

    if (showAllToggle) {
      showAllToggle.addEventListener("change", () => {
        state.showAll = Boolean(showAllToggle.checked);
        render();
      });
    }

    if (chatModeSelect) {
      chatModeSelect.addEventListener("change", () => {
        writeLocal(STORAGE.chatMode, chatModeSelect.value || "auto");
        render();
      });
    }

    if (newThreadBtn) {
      newThreadBtn.addEventListener("click", async () => {
        try {
          await createThread();
        } catch (error) {
          setStatus({ error: error.message });
        }
      });
    }

    if (renameThreadBtn) {
      renameThreadBtn.addEventListener("click", async () => {
        try {
          await renameThread();
        } catch (error) {
          setStatus({ error: error.message });
        }
      });
    }

    if (archiveThreadBtn) {
      archiveThreadBtn.addEventListener("click", async () => {
        try {
          await archiveThread();
        } catch (error) {
          setStatus({ error: error.message });
        }
      });
    }

    if (deleteThreadBtn) {
      deleteThreadBtn.addEventListener("click", async () => {
        try {
          await deleteThread();
        } catch (error) {
          setStatus({ error: error.message });
        }
      });
    }

    if (finalizeBtn) {
      finalizeBtn.addEventListener("click", async () => {
        if (state.busy) return;
        state.busy = true;
        render();
        try {
          await finalizeAgent();
        } catch (error) {
          setStatus({ error: error.message });
        } finally {
          state.busy = false;
          render();
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", async () => {
        if (state.busy) return;
        state.busy = true;
        render();
        try {
          await sendPrompt();
        } catch (error) {
          setStatus({ error: error.message });
          const thread = selectedThread();
          if (thread) {
            appendMessage(thread.id, "assistant", `Error: ${error.message}`, {
              runtime: "error",
            });
          }
        } finally {
          state.busy = false;
          refreshThreads();
          render();
        }
      });
    }

    if (promptInput) {
      promptInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          if (sendBtn && !sendBtn.disabled) {
            sendBtn.click();
          }
        }
      });
    }
  }

  async function boot() {
    if (chatModeSelect) {
      const savedMode = readLocal(STORAGE.chatMode);
      if (savedMode === "cloudflare" || savedMode === "local" || savedMode === "auto") {
        chatModeSelect.value = savedMode;
      }
    }

    bindEvents();

    try {
      await refreshData();
    } catch (error) {
      setStatus({ error: error.message });
    }
  }

  boot();
})();
