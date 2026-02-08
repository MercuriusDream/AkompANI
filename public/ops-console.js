(() => {
  const agentSelect = document.getElementById("agentSelect");
  const flowSelect = document.getElementById("flowSelect");
  const originInput = document.getElementById("originInput");
  const refreshBtn = document.getElementById("refreshBtn");
  const resultPane = document.getElementById("resultPane");
  const promptGrid = document.getElementById("promptGrid");

  const state = {
    prompts: [],
    agents: [],
    flows: [],
  };

  function safeStringify(value) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
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

  function renderSelect(selectEl, items, emptyLabel, idKey = "id", nameKey = "name") {
    selectEl.innerHTML = "";
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = emptyLabel;
    selectEl.appendChild(empty);

    for (const item of items) {
      const option = document.createElement("option");
      option.value = item[idKey];
      option.textContent = `${item[nameKey]} (${item[idKey]})`;
      selectEl.appendChild(option);
    }
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
      out.originUrl = originInput.value || `${window.location.origin}`;
    }
    return out;
  }

  async function executePrompt(promptId, payload, button) {
    if (button) button.disabled = true;
    resultPane.textContent = "Running...";

    try {
      const patched = patchTemplatePayload(payload);
      const data = await requestJson(`/api/ops/prompts/${promptId}/execute`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: safeStringify(patched),
      });

      resultPane.textContent = safeStringify({
        promptId,
        payload: patched,
        response: data,
      });
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

      const runBtn = document.createElement("button");
      runBtn.textContent = "Run Prompt";
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
      resetBtn.className = "secondary";
      resetBtn.textContent = "Reset";
      resetBtn.type = "button";
      resetBtn.addEventListener("click", () => {
        textarea.value = safeStringify(prompt.payloadTemplate || {});
      });

      actions.appendChild(resetBtn);
      actions.appendChild(runBtn);

      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(textarea);
      card.appendChild(actions);
      promptGrid.appendChild(card);
    }
  }

  async function refreshData() {
    const [promptData, agentData, flowData] = await Promise.all([
      requestJson("/api/ops/prompts"),
      requestJson("/api/agents"),
      requestJson("/api/flows"),
    ]);

    state.prompts = promptData.prompts || [];
    state.agents = agentData.agents || [];
    state.flows = flowData.flows || [];

    const prevAgent = agentSelect.value;
    const prevFlow = flowSelect.value;

    renderSelect(agentSelect, state.agents, "(select agent)");
    renderSelect(flowSelect, state.flows, "(select flow)");

    if (prevAgent && state.agents.some((item) => item.id === prevAgent)) {
      agentSelect.value = prevAgent;
    }
    if (prevFlow && state.flows.some((item) => item.id === prevFlow)) {
      flowSelect.value = prevFlow;
    }

    renderPromptCards();
    resultPane.textContent = safeStringify({
      status: "ready",
      prompts: state.prompts.length,
      agents: state.agents.length,
      flows: state.flows.length,
    });
  }

  async function boot() {
    originInput.value = window.location.origin;
    refreshBtn.addEventListener("click", async () => {
      try {
        await refreshData();
      } catch (error) {
        resultPane.textContent = `Refresh failed: ${error.message}`;
      }
    });

    try {
      await refreshData();
    } catch (error) {
      resultPane.textContent = `Boot failed: ${error.message}`;
    }
  }

  boot();
})();
