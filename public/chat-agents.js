(() => {
  const refreshBtn = document.getElementById("refreshBtn");
  const showAllToggle = document.getElementById("showAllToggle");
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
  const statusPane = document.getElementById("statusPane");
  const agentDetails = document.getElementById("agentDetails");

  const state = {
    agents: [],
    evals: [],
    deployments: [],
    threads: [],
    selectedAgentId: "",
    selectedThreadId: "",
    threadMessages: {},
    agentOperational: null,
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
    statusPane.textContent = stringify(value);
  }

  function getServerApiKey() {
    try {
      return String(sessionStorage.getItem("voyager_server_api_key") || "").trim();
    } catch {
      return "";
    }
  }

  function withServerAuthHeaders(url, headers) {
    const merged = new Headers(headers || {});
    if (!String(url || "").startsWith("/api/")) return merged;

    const key = getServerApiKey();
    if (!key) return merged;

    merged.set("Authorization", `Bearer ${key}`);
    merged.set("x-api-key", key);
    return merged;
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: withServerAuthHeaders(url, options.headers),
    });
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok) {
      throw new Error(data?.error || `Request failed (${response.status})`);
    }
    return data;
  }

  function selectedAgent() {
    return state.agents.find((agent) => agent.id === state.selectedAgentId) || null;
  }

  function selectedThread() {
    return state.threads.find((thread) => thread.id === state.selectedThreadId) || null;
  }

  function latestEval(agentId) {
    return state.evals
      .filter((item) => item.agentId === agentId)
      .sort((a, b) => String(b.finishedAt || "").localeCompare(String(a.finishedAt || "")))[0];
  }

  function latestDeployment(agentId) {
    return state.deployments
      .filter((item) => item.agentId === agentId && item.status === "generated")
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))[0];
  }

  function isFinalized(agentId) {
    const evalRun = latestEval(agentId);
    const deployment = latestDeployment(agentId);
    const fromRelease = state.agentOperational?.release?.status === "released" && state.agentOperational?.release?.agentId === agentId;
    const fromBase = Boolean(evalRun && deployment && Number(evalRun.summary?.passRate || 0) >= 100);
    return Boolean(fromRelease || fromBase);
  }

  function renderAgentRows() {
    const rows = state.agents
      .map((agent) => ({
        agent,
        finalized: isFinalized(agent.id),
      }))
      .filter((item) => (state.showAll ? true : item.finalized));

    agentList.innerHTML = "";
    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = state.showAll ? "No agents yet." : "No finalized agents. Toggle Show all.";
      empty.className = "empty";
      agentList.appendChild(empty);
      return;
    }

    for (const row of rows) {
      const item = document.createElement("article");
      item.className = "agent-item";
      if (state.selectedAgentId === row.agent.id) item.classList.add("active");

      const title = document.createElement("h4");
      title.textContent = row.agent.name;
      item.appendChild(title);

      const sub = document.createElement("p");
      sub.textContent = `flow: ${row.agent.flowId}`;
      item.appendChild(sub);

      const badge = document.createElement("span");
      badge.className = "badge";
      if (row.finalized) {
        badge.classList.add("finalized");
        badge.textContent = "Finalized";
      } else if (latestEval(row.agent.id) || latestDeployment(row.agent.id)) {
        badge.classList.add("pending");
        badge.textContent = "Partial";
      } else {
        badge.classList.add("missing");
        badge.textContent = "Not finalized";
      }
      item.appendChild(badge);

      item.addEventListener("click", async () => {
        state.selectedAgentId = row.agent.id;
        state.selectedThreadId = "";
        await refreshOperational();
        await refreshThreads();
        render();
      });

      agentList.appendChild(item);
    }
  }

  function renderThreadRows() {
    threadList.innerHTML = "";
    if (!state.selectedAgentId) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "Select an agent to load threads.";
      threadList.appendChild(empty);
      return;
    }

    if (state.threads.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No threads. Create one.";
      threadList.appendChild(empty);
      return;
    }

    for (const thread of state.threads) {
      const item = document.createElement("article");
      item.className = "thread-item";
      if (state.selectedThreadId === thread.id) item.classList.add("active");

      const title = document.createElement("h5");
      title.textContent = thread.title || "Untitled thread";
      item.appendChild(title);

      const sub = document.createElement("p");
      sub.textContent = `${thread.status} · ${thread.updatedAt ? new Date(thread.updatedAt).toLocaleString() : ""}`;
      item.appendChild(sub);

      item.addEventListener("click", async () => {
        state.selectedThreadId = thread.id;
        await refreshThreadMessages(thread.id);
        renderMessages();
        renderHeaderAndDetails();
      });

      threadList.appendChild(item);
    }
  }

  function renderMessages() {
    messagesEl.innerHTML = "";
    const thread = selectedThread();
    if (!thread) {
      const empty = document.createElement("article");
      empty.className = "msg system";
      empty.textContent = "Select or create a thread to chat.";
      messagesEl.appendChild(empty);
      return;
    }

    const rows = state.threadMessages[thread.id] || [];
    if (rows.length === 0) {
      const empty = document.createElement("article");
      empty.className = "msg system";
      empty.textContent = "Thread is empty. Send your first prompt.";
      messagesEl.appendChild(empty);
      return;
    }

    for (const msg of rows) {
      const node = document.createElement("article");
      node.className = `msg ${msg.role}`;
      node.textContent = msg.content;
      messagesEl.appendChild(node);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderHeaderAndDetails() {
    const agent = selectedAgent();
    const thread = selectedThread();

    if (!agent) {
      agentBadge.textContent = "No agent selected";
      threadBadge.textContent = "No thread selected";
      chatTitle.textContent = "Select an agent";
      agentDetails.innerHTML = "";
      return;
    }

    const finalized = isFinalized(agent.id);
    agentBadge.textContent = finalized ? "Finalized + Deployable" : "Needs Finalization";
    threadBadge.textContent = thread ? `Thread: ${thread.title}` : "No thread selected";
    chatTitle.textContent = agent.name;

    const evalRun = latestEval(agent.id);
    const deploy = latestDeployment(agent.id);
    const release = state.agentOperational?.release || null;
    const policy = agent.policy || {
      minEvalPassRate: 100,
      requireReleaseForChat: true,
      maxThreadMessages: 500,
    };

    const rows = [
      ["Agent ID", agent.id],
      ["Flow ID", agent.flowId],
      ["Instruction", agent.instruction || "(empty)"],
      ["Context Packs", (agent.contextPackIds || []).join(", ") || "(none)"],
      ["Permissions", (agent.permissions || []).map((p) => `${p.resource}:${p.access}`).join(", ") || "(none)"],
      ["Latest Eval", evalRun ? `${evalRun.summary.passRate}% (${evalRun.summary.passed}/${evalRun.summary.total})` : "(none)"],
      ["Latest Deploy", deploy ? `${deploy.target} @ ${deploy.updatedAt}` : "(none)"],
      ["Release", release ? `${release.status} @ ${release.updatedAt}` : "(none)"],
      ["Policy.minEvalPassRate", String(policy.minEvalPassRate)],
      ["Policy.requireReleaseForChat", String(policy.requireReleaseForChat)],
      ["Policy.maxThreadMessages", String(policy.maxThreadMessages)],
      ["Thread Count", String(state.threads.length)],
    ];

    agentDetails.innerHTML = "";
    for (const [k, v] of rows) {
      const block = document.createElement("div");
      block.className = "meta-item";
      const key = document.createElement("p");
      key.className = "k";
      key.textContent = k;
      const val = document.createElement("p");
      val.className = "v";
      val.textContent = v;
      block.appendChild(key);
      block.appendChild(val);
      agentDetails.appendChild(block);
    }
  }

  function render() {
    renderAgentRows();
    renderThreadRows();
    renderHeaderAndDetails();
    renderMessages();
    sendBtn.disabled = state.busy;
    finalizeBtn.disabled = state.busy;
  }

  async function refreshOperational() {
    const agent = selectedAgent();
    if (!agent) {
      state.agentOperational = null;
      return;
    }

    try {
      const data = await requestJson(`/api/agents/${agent.id}/operational`);
      state.agentOperational = data.operational || null;
    } catch {
      state.agentOperational = null;
    }
  }

  async function refreshThreads() {
    const agent = selectedAgent();
    state.threads = [];
    state.selectedThreadId = "";
    if (!agent) return;

    const data = await requestJson(`/api/threads?agentId=${encodeURIComponent(agent.id)}`);
    state.threads = data.threads || [];
    if (state.threads.length > 0) {
      state.selectedThreadId = state.threads[0].id;
      await refreshThreadMessages(state.selectedThreadId);
    }
  }

  async function refreshThreadMessages(threadId) {
    if (!threadId) return;
    const data = await requestJson(`/api/threads/${threadId}/messages`);
    state.threadMessages[threadId] = data.messages || [];
  }

  async function refreshData() {
    const [agentsRes, evalsRes, deploymentsRes] = await Promise.all([
      requestJson("/api/agents"),
      requestJson("/api/evals"),
      requestJson("/api/deployments"),
    ]);

    state.agents = agentsRes.agents || [];
    state.evals = evalsRes.evals || [];
    state.deployments = deploymentsRes.deployments || [];

    if (state.selectedAgentId && !state.agents.some((a) => a.id === state.selectedAgentId)) {
      state.selectedAgentId = "";
    }
    if (!state.selectedAgentId) {
      const firstFinalized = state.agents.find((agent) => {
        const evalRun = latestEval(agent.id);
        const deployment = latestDeployment(agent.id);
        return Boolean(evalRun && deployment && Number(evalRun.summary?.passRate || 0) >= 100);
      });
      state.selectedAgentId = firstFinalized?.id || state.agents[0]?.id || "";
    }

    await refreshOperational();
    await refreshThreads();

    setStatus({
      status: "ready",
      agents: state.agents.length,
      finalizedAgents: state.agents.filter((a) => isFinalized(a.id)).length,
      deployments: state.deployments.length,
      evals: state.evals.length,
      threads: state.threads.length,
    });
    render();
  }

  async function createThread() {
    const agent = selectedAgent();
    if (!agent) {
      setStatus({ error: "Select an agent first." });
      return;
    }

    const data = await requestJson("/api/threads", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: stringify({
        agentId: agent.id,
        title: "New thread",
      }),
    });

    const thread = data.thread;
    if (!thread?.id) return;
    state.selectedThreadId = thread.id;
    await refreshThreads();
    if (state.selectedThreadId) {
      await refreshThreadMessages(state.selectedThreadId);
    }
    render();
  }

  async function renameThread() {
    const thread = selectedThread();
    if (!thread) {
      setStatus({ error: "Select a thread first." });
      return;
    }

    const next = window.prompt("Thread title", thread.title || "New thread");
    if (next === null) return;
    const title = String(next || "").trim();
    if (!title) return;

    await requestJson(`/api/threads/${thread.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: stringify({ title }),
    });
    await refreshThreads();
    render();
  }

  async function archiveThread() {
    const thread = selectedThread();
    if (!thread) {
      setStatus({ error: "Select a thread first." });
      return;
    }

    await requestJson(`/api/threads/${thread.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: stringify({
        status: thread.status === "archived" ? "active" : "archived",
      }),
    });
    await refreshThreads();
    render();
  }

  async function deleteThread() {
    const thread = selectedThread();
    if (!thread) {
      setStatus({ error: "Select a thread first." });
      return;
    }

    const ok = window.confirm(`Delete thread "${thread.title}"?`);
    if (!ok) return;

    await requestJson(`/api/threads/${thread.id}`, {
      method: "DELETE",
    });

    await refreshThreads();
    render();
  }

  async function finalizeAgent() {
    const agent = selectedAgent();
    if (!agent) {
      setStatus({ error: "Select an agent first." });
      return;
    }

    if (state.busy) return;
    state.busy = true;
    render();

    try {
      const data = await requestJson(`/api/agents/${agent.id}/finalize`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: stringify({
          deploymentTarget: "cloudflare_workers_elysia",
          requirePassRate: 100,
          includeOpsConsole: true,
          requireWorkerToken: true,
          originUrl: window.location.origin,
          cases: [
            {
              name: "chat_finalization",
              input: {
                prompt: "ready",
                channel: "chat_console_finalize",
              },
              expectExpr: "output !== undefined",
              maxDurationMs: 5000,
            },
          ],
          notes: "finalized from chat-agents console",
        }),
      });

      setStatus({
        status: "finalized",
        result: data,
      });
      await refreshData();
    } catch (error) {
      setStatus({
        error: error.message,
      });
    } finally {
      state.busy = false;
      render();
    }
  }

  async function sendPrompt() {
    const text = (promptInput.value || "").trim();
    if (!text) return;

    const agent = selectedAgent();
    if (!agent) {
      setStatus({ error: "Select an agent first." });
      return;
    }

    if (state.busy) return;
    state.busy = true;
    render();

    try {
      if (!state.selectedThreadId) {
        await createThread();
      }
      const thread = selectedThread();
      if (!thread) {
        throw new Error("Thread could not be created.");
      }

      const requireFinalized = !state.showAll;
      const response = await requestJson(`/api/threads/${thread.id}/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: stringify({
          role: "user",
          content: text,
          autoRun: true,
          requireFinalized,
          metadata: {
            channel: "chat_agents_ui",
          },
        }),
      });

      promptInput.value = "";

      if (response.thread) {
        const idx = state.threads.findIndex((t) => t.id === response.thread.id);
        if (idx >= 0) {
          state.threads[idx] = response.thread;
        }
      }

      await refreshThreadMessages(thread.id);
      await refreshOperational();

      setStatus({
        status: "ok",
        runId: response?.run?.id,
        runStatus: response?.run?.status,
        threadId: thread.id,
      });
    } catch (error) {
      setStatus({
        error: error.message,
      });
    } finally {
      state.busy = false;
      render();
    }
  }

  function bindEvents() {
    refreshBtn.addEventListener("click", async () => {
      try {
        await refreshData();
      } catch (error) {
        setStatus({ error: error.message });
      }
    });

    showAllToggle.addEventListener("change", () => {
      state.showAll = showAllToggle.checked;
      render();
    });

    newThreadBtn.addEventListener("click", async () => {
      try {
        await createThread();
      } catch (error) {
        setStatus({ error: error.message });
      }
    });

    renameThreadBtn.addEventListener("click", async () => {
      try {
        await renameThread();
      } catch (error) {
        setStatus({ error: error.message });
      }
    });

    archiveThreadBtn.addEventListener("click", async () => {
      try {
        await archiveThread();
      } catch (error) {
        setStatus({ error: error.message });
      }
    });

    deleteThreadBtn.addEventListener("click", async () => {
      try {
        await deleteThread();
      } catch (error) {
        setStatus({ error: error.message });
      }
    });

    finalizeBtn.addEventListener("click", () => {
      finalizeAgent();
    });

    sendBtn.addEventListener("click", () => {
      sendPrompt();
    });

    promptInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendPrompt();
      }
    });
  }

  async function boot() {
    bindEvents();
    try {
      await refreshData();
    } catch (error) {
      setStatus({ error: error.message });
    }
  }

  boot();
})();
