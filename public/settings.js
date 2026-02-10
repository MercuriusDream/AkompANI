/**
 * CANARIA Settings - localStorage/sessionStorage settings management
 * Includes multi-provider LLM profiles via window.CANARIA_IDE.
 */
(function () {
  const runtime = window.CANARIA_IDE || null;

  const KEYS = {
    githubPat: "voyager_oauth_github_token",
    cfApiToken: "voyager_oauth_cloudflare_token",
    cfAccountId: "voyager_cf_account_id",
    vercelToken: "voyager_oauth_vercel_token",
    vercelProject: "voyager_vercel_project",
    vercelTeamId: "voyager_vercel_team_id",
    openaiKey: "voyager_llm_api_key",
  };

  const LEGACY_KEYS = {
    githubPat: "voyager_github_pat",
    cfApiToken: "voyager_cf_api_token",
    openaiKey: "voyager_openai_key",
  };

  const SESSION_SECRET_KEYS = new Set(["githubPat", "cfApiToken", "vercelToken", "openaiKey"]);

  const els = {
    githubPat: document.getElementById("githubPat"),
    cfApiToken: document.getElementById("cfApiToken"),
    cfAccountId: document.getElementById("cfAccountId"),
    vercelToken: document.getElementById("vercelToken"),
    vercelProject: document.getElementById("vercelProject"),
    vercelTeamId: document.getElementById("vercelTeamId"),
    openaiKey: document.getElementById("openaiKey"),
    githubStatus: document.getElementById("githubStatus"),
    cfStatus: document.getElementById("cfStatus"),
    vercelStatus: document.getElementById("vercelStatus"),
    testGithub: document.getElementById("testGithub"),
    testCf: document.getElementById("testCf"),
    testVercel: document.getElementById("testVercel"),
    themePicker: document.getElementById("themePicker"),
    clearSettings: document.getElementById("clearSettings"),
    llmProviderSelect: document.getElementById("llmProviderSelect"),
    llmProviderName: document.getElementById("llmProviderName"),
    llmProviderBaseUrl: document.getElementById("llmProviderBaseUrl"),
    llmProviderPath: document.getElementById("llmProviderPath"),
    llmProviderModels: document.getElementById("llmProviderModels"),
    llmProviderModelSelect: document.getElementById("llmProviderModelSelect"),
    llmProviderApiKey: document.getElementById("llmProviderApiKey"),
    saveLlmProvider: document.getElementById("saveLlmProvider"),
    removeLlmProvider: document.getElementById("removeLlmProvider"),
    setActiveLlmProvider: document.getElementById("setActiveLlmProvider"),
    newLlmProvider: document.getElementById("newLlmProvider"),
    llmProviderStatus: document.getElementById("llmProviderStatus"),
  };

  let providerDraftId = "";

  function readValue(id) {
    const key = KEYS[id];
    if (!key) return "";

    try {
      if (SESSION_SECRET_KEYS.has(id)) {
        return sessionStorage.getItem(key) || "";
      }
      return localStorage.getItem(key) || "";
    } catch {
      return "";
    }
  }

  function writeValue(id, value) {
    const key = KEYS[id];
    if (!key) return;

    const clean = String(value || "").trim();
    try {
      if (!clean) {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
        return;
      }

      if (SESSION_SECRET_KEYS.has(id)) {
        sessionStorage.setItem(key, clean);
        localStorage.removeItem(key);
        return;
      }

      localStorage.setItem(key, clean);
    } catch {
      // Ignore storage errors.
    }
  }

  function migrateLegacyValues() {
    Object.keys(LEGACY_KEYS).forEach(function (id) {
      const nextKey = KEYS[id];
      const legacyKey = LEGACY_KEYS[id];
      if (!nextKey || !legacyKey) return;

      const current = readValue(id);
      if (current) return;

      let legacy = "";
      try {
        legacy = String(sessionStorage.getItem(legacyKey) || localStorage.getItem(legacyKey) || "").trim();
      } catch {
        legacy = "";
      }
      if (!legacy) return;

      writeValue(id, legacy);
      try {
        sessionStorage.removeItem(legacyKey);
        localStorage.removeItem(legacyKey);
      } catch {
        // Ignore cleanup errors.
      }
    });
  }

  function setInlineStatus(text, level) {
    if (!els.llmProviderStatus) return;
    els.llmProviderStatus.textContent = text;
    els.llmProviderStatus.className = "settings-inline-status";
    if (level === "success") {
      els.llmProviderStatus.classList.add("success");
    }
    if (level === "error") {
      els.llmProviderStatus.classList.add("error");
    }
  }

  function setStatus(statusEl, connected) {
    if (!statusEl) return;
    const dot = statusEl.querySelector(".connection-dot");
    const label = statusEl.querySelector(".status-label");
    if (connected) {
      statusEl.classList.add("connected");
      if (dot) dot.classList.add("connected");
      if (label) label.textContent = "Connected";
    } else {
      statusEl.classList.remove("connected");
      if (dot) dot.classList.remove("connected");
      if (label) label.textContent = "Not connected";
    }
  }

  function updateStatuses() {
    const hasGh = !!readValue("githubPat");
    const hasCf = !!(readValue("cfApiToken") && readValue("cfAccountId"));
    const hasVercel = !!readValue("vercelToken");
    setStatus(els.githubStatus, hasGh);
    setStatus(els.cfStatus, hasCf);
    setStatus(els.vercelStatus, hasVercel);
  }

  function isLikelyCloudflareAccountId(value) {
    return /^[a-f0-9]{32}$/i.test(String(value || "").trim());
  }

  function updateThemePicker() {
    if (!els.themePicker) return;
    const stored = localStorage.getItem("voyager-theme");
    const current = stored || "system";
    els.themePicker.querySelectorAll(".theme-option").forEach(function (opt) {
      opt.classList.toggle("active", opt.getAttribute("data-theme") === current);
    });
  }

  function activeProvider() {
    if (!runtime?.getActiveProvider) return null;
    return runtime.getActiveProvider();
  }

  function selectedProviderId() {
    const uiValue = String(els.llmProviderSelect?.value || "").trim();
    if (uiValue) return uiValue;
    if (runtime?.getActiveProviderId) return String(runtime.getActiveProviderId() || "").trim();
    return "";
  }

  function parseModelsFromForm() {
    const text = String(els.llmProviderModels?.value || "").trim();
    if (!text) return [];
    if (runtime?.parseModelText) {
      return runtime.parseModelText(text);
    }
    return text
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function renderProviderModelSelect(models, preferredModel) {
    if (!els.llmProviderModelSelect) return;
    const list = Array.isArray(models) ? models : [];
    els.llmProviderModelSelect.innerHTML = "";

    if (!list.length) {
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "No models";
      els.llmProviderModelSelect.appendChild(empty);
      return;
    }

    for (const model of list) {
      const opt = document.createElement("option");
      opt.value = model;
      opt.textContent = model;
      els.llmProviderModelSelect.appendChild(opt);
    }

    const selected = String(preferredModel || list[0] || "").trim();
    if (selected) {
      const exists = list.includes(selected);
      if (!exists) {
        const custom = document.createElement("option");
        custom.value = selected;
        custom.textContent = `${selected} (custom)`;
        els.llmProviderModelSelect.appendChild(custom);
      }
      els.llmProviderModelSelect.value = selected;
    }
  }

  function fillProviderForm(provider) {
    const row = provider || null;
    providerDraftId = row?.id || "";

    if (els.llmProviderName) {
      els.llmProviderName.value = row?.name || "";
    }
    if (els.llmProviderBaseUrl) {
      els.llmProviderBaseUrl.value = row?.baseUrl || "";
    }
    if (els.llmProviderPath) {
      els.llmProviderPath.value = row?.path || "/v1/chat/completions";
    }

    const models = Array.isArray(row?.models) ? row.models : [];
    if (els.llmProviderModels) {
      els.llmProviderModels.value = models.join("\n");
    }

    renderProviderModelSelect(models, row?.activeModel || models[0] || "");

    if (els.llmProviderApiKey && runtime?.getProviderApiKey && row?.id) {
      els.llmProviderApiKey.value = runtime.getProviderApiKey(row.id) || "";
    }

    if (els.openaiKey && runtime?.getProviderApiKey && row?.id) {
      els.openaiKey.value = runtime.getProviderApiKey(row.id) || "";
    }
  }

  function renderProviderSelect(preferredId) {
    if (!runtime?.listProviders || !els.llmProviderSelect) return;

    const providers = runtime.listProviders();
    const activeId = String(preferredId || runtime.getActiveProviderId?.() || "").trim();

    els.llmProviderSelect.innerHTML = "";
    for (const provider of providers) {
      const opt = document.createElement("option");
      opt.value = provider.id;
      opt.textContent = provider.name;
      els.llmProviderSelect.appendChild(opt);
    }

    const selected = providers.some((row) => row.id === activeId)
      ? activeId
      : providers[0]?.id || "";

    if (selected) {
      els.llmProviderSelect.value = selected;
      const provider = providers.find((row) => row.id === selected) || null;
      fillProviderForm(provider);
    }
  }

  function syncActiveProviderKeysToLegacyFields() {
    const provider = activeProvider();
    if (!provider) return;

    if (runtime?.getProviderApiKey) {
      const key = runtime.getProviderApiKey(provider.id) || "";
      if (els.openaiKey) {
        els.openaiKey.value = key;
      }
    }
  }

  function saveProviderFromForm() {
    if (!runtime?.upsertProvider) {
      setInlineStatus("Provider runtime is unavailable.", "error");
      return;
    }

    const name = String(els.llmProviderName?.value || "").trim();
    const baseUrl = String(els.llmProviderBaseUrl?.value || "").trim();
    const path = String(els.llmProviderPath?.value || "").trim() || "/v1/chat/completions";
    const models = parseModelsFromForm();
    const modelFromSelect = String(els.llmProviderModelSelect?.value || "").trim();
    const activeModel = modelFromSelect || models[0] || "";

    if (!name || !baseUrl || !activeModel) {
      setInlineStatus("Provider name, base URL, and at least one model are required.", "error");
      return;
    }

    const provider = runtime.upsertProvider({
      id: providerDraftId || undefined,
      name,
      baseUrl,
      path,
      models: models.length ? models : [activeModel],
      activeModel,
    });

    const key = String(els.llmProviderApiKey?.value || "").trim();
    if (runtime.setProviderApiKey) {
      runtime.setProviderApiKey(provider.id, key);
    }

    if (runtime.setActiveProvider) {
      runtime.setActiveProvider(provider.id);
    }

    renderProviderSelect(provider.id);
    syncActiveProviderKeysToLegacyFields();
    setInlineStatus(`Saved ${provider.name}.`, "success");
  }

  function removeSelectedProvider() {
    if (!runtime?.removeProvider) {
      setInlineStatus("Provider runtime is unavailable.", "error");
      return;
    }

    const id = selectedProviderId();
    if (!id) {
      setInlineStatus("Select a provider first.", "error");
      return;
    }

    const current = runtime.getProviderById?.(id);
    const label = current?.name || id;
    const ok = runtime.removeProvider(id);
    if (!ok) {
      setInlineStatus("Cannot remove provider. Keep at least one provider profile.", "error");
      return;
    }

    renderProviderSelect("");
    syncActiveProviderKeysToLegacyFields();
    setInlineStatus(`Removed ${label}.`, "success");
  }

  function setSelectedProviderActive() {
    if (!runtime?.setActiveProvider) {
      setInlineStatus("Provider runtime is unavailable.", "error");
      return;
    }

    const id = selectedProviderId();
    if (!id) {
      setInlineStatus("Select a provider first.", "error");
      return;
    }

    const ok = runtime.setActiveProvider(id);
    if (!ok) {
      setInlineStatus("Could not set active provider.", "error");
      return;
    }

    renderProviderSelect(id);
    syncActiveProviderKeysToLegacyFields();
    setInlineStatus("Active provider updated.", "success");
  }

  function resetProviderForm() {
    providerDraftId = "";
    if (els.llmProviderName) els.llmProviderName.value = "";
    if (els.llmProviderBaseUrl) els.llmProviderBaseUrl.value = "";
    if (els.llmProviderPath) els.llmProviderPath.value = "/v1/chat/completions";
    if (els.llmProviderModels) els.llmProviderModels.value = "";
    if (els.llmProviderApiKey) els.llmProviderApiKey.value = "";
    renderProviderModelSelect([], "");
    setInlineStatus("Creating new provider profile.", null);
  }

  function load() {
    Object.entries(KEYS).forEach(function (entry) {
      const id = entry[0];
      const el = els[id];
      if (!el) return;
      if (id === "openaiKey" && runtime?.getProviderApiKey) {
        const active = activeProvider();
        el.value = active ? runtime.getProviderApiKey(active.id) || "" : "";
      } else {
        el.value = readValue(id);
      }
    });

    if (runtime?.ensureProviderAndReturn) {
      runtime.ensureProviderAndReturn();
      renderProviderSelect(runtime.getActiveProviderId?.() || "");
      syncActiveProviderKeysToLegacyFields();
    }

    updateStatuses();
    updateThemePicker();
  }

  // Reveal / hide password fields.
  document.querySelectorAll(".reveal-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      const eyeOpen = btn.querySelector(".eye-open");
      const eyeClosed = btn.querySelector(".eye-closed");
      if (eyeOpen) eyeOpen.style.display = isPassword ? "none" : "";
      if (eyeClosed) eyeClosed.style.display = isPassword ? "" : "none";
    });
  });

  // Auto-save for simple key fields.
  const timers = {};
  ["githubPat", "cfApiToken", "cfAccountId", "vercelToken", "vercelProject", "vercelTeamId"].forEach(function (id) {
    const el = els[id];
    if (!el) return;
    el.addEventListener("input", function () {
      clearTimeout(timers[id]);
      timers[id] = setTimeout(function () {
        writeValue(id, el.value.trim());
        updateStatuses();
      }, 300);
    });
  });

  if (els.openaiKey) {
    els.openaiKey.addEventListener("input", function () {
      clearTimeout(timers.openaiKey);
      timers.openaiKey = setTimeout(function () {
        const value = els.openaiKey.value.trim();
        if (runtime?.setProviderApiKey) {
          const active = activeProvider();
          if (active) {
            runtime.setProviderApiKey(active.id, value);
            if (els.llmProviderApiKey) {
              els.llmProviderApiKey.value = value;
            }
          }
        }
        writeValue("openaiKey", value);
      }, 250);
    });
  }

  // Provider events.
  if (els.llmProviderSelect) {
    els.llmProviderSelect.addEventListener("change", function () {
      const id = String(els.llmProviderSelect.value || "").trim();
      if (!id || !runtime?.getProviderById) return;
      if (runtime.setActiveProvider) {
        runtime.setActiveProvider(id);
      }
      fillProviderForm(runtime.getProviderById(id));
      syncActiveProviderKeysToLegacyFields();
      setInlineStatus("Loaded provider profile.", null);
    });
  }

  if (els.llmProviderModels) {
    els.llmProviderModels.addEventListener("input", function () {
      const models = parseModelsFromForm();
      const preferred = String(els.llmProviderModelSelect?.value || models[0] || "").trim();
      renderProviderModelSelect(models, preferred);
    });
  }

  if (els.llmProviderModelSelect) {
    els.llmProviderModelSelect.addEventListener("change", function () {
      const model = String(els.llmProviderModelSelect.value || "").trim();
      if (!model || !runtime?.setProviderActiveModel) return;
      const id = selectedProviderId();
      if (!id) return;
      runtime.setProviderActiveModel(id, model);
      setInlineStatus(`Model set to ${model}.`, null);
    });
  }

  if (els.saveLlmProvider) {
    els.saveLlmProvider.addEventListener("click", saveProviderFromForm);
  }

  if (els.removeLlmProvider) {
    els.removeLlmProvider.addEventListener("click", removeSelectedProvider);
  }

  if (els.setActiveLlmProvider) {
    els.setActiveLlmProvider.addEventListener("click", setSelectedProviderActive);
  }

  if (els.newLlmProvider) {
    els.newLlmProvider.addEventListener("click", resetProviderForm);
  }

  // Test GitHub connection.
  if (els.testGithub) {
    els.testGithub.addEventListener("click", function () {
      const pat = (els.githubPat && els.githubPat.value.trim()) || "";
      if (!pat) {
        CANARIAToast.warning({ title: "Missing token", message: "Enter a GitHub Personal Access Token first." });
        return;
      }
      els.testGithub.disabled = true;
      els.testGithub.textContent = "Testing...";

      fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${pat}`,
          Accept: "application/vnd.github+json",
        },
      })
        .then(function (r) {
          return r.json().then(function (d) {
            return { ok: r.ok, data: d };
          });
        })
        .then(function (res) {
          if (res.ok && res.data.login) {
            CANARIAToast.success({ title: "GitHub connected", message: `Authenticated as ${res.data.login}` });
            writeValue("githubPat", pat);
            updateStatuses();
          } else {
            CANARIAToast.error({ title: "GitHub failed", message: res.data.message || "Invalid token" });
          }
        })
        .catch(function () {
          CANARIAToast.error({ title: "Network error", message: "Could not reach GitHub API." });
        })
        .finally(function () {
          els.testGithub.disabled = false;
          els.testGithub.textContent = "Test Connection";
        });
    });
  }

  // Test Cloudflare connection.
  if (els.testCf) {
    els.testCf.addEventListener("click", function () {
      const token = (els.cfApiToken && els.cfApiToken.value.trim()) || "";
      const accountId = (els.cfAccountId && els.cfAccountId.value.trim()) || "";
      if (!token) {
        CANARIAToast.warning({ title: "Missing token", message: "Enter a Cloudflare API Token first." });
        return;
      }
      if (accountId && !isLikelyCloudflareAccountId(accountId)) {
        CANARIAToast.warning({
          title: "Invalid account ID",
          message: "Cloudflare Account ID should be a 32-character hex string.",
        });
        return;
      }
      els.testCf.disabled = true;
      els.testCf.textContent = "Testing...";

      fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(function (r) {
          return r.json().then(function (d) {
            return { ok: r.ok, data: d };
          });
        })
        .then(function (res) {
          if (res.ok && res.data && res.data.success) {
            writeValue("cfApiToken", token);
            if (accountId) {
              writeValue("cfAccountId", accountId);
              CANARIAToast.success({ title: "Cloudflare connected", message: "API token is valid." });
            } else {
              CANARIAToast.warning({ title: "Token valid", message: "Add your Account ID to enable deployments." });
            }
            updateStatuses();
          } else {
            const firstError =
              res.data && Array.isArray(res.data.errors) && res.data.errors[0]
                ? res.data.errors[0].message
                : "";
            CANARIAToast.error({ title: "Cloudflare failed", message: firstError || "Invalid token" });
          }
        })
        .catch(function () {
          CANARIAToast.error({ title: "Network error", message: "Could not reach Cloudflare API." });
        })
        .finally(function () {
          els.testCf.disabled = false;
          els.testCf.textContent = "Test Connection";
        });
    });
  }

  // Test Vercel connection.
  if (els.testVercel) {
    els.testVercel.addEventListener("click", function () {
      const token = (els.vercelToken && els.vercelToken.value.trim()) || "";
      const project = (els.vercelProject && els.vercelProject.value.trim()) || "";
      const teamId = (els.vercelTeamId && els.vercelTeamId.value.trim()) || "";
      if (!token) {
        CANARIAToast.warning({ title: "Missing token", message: "Enter a Vercel access token first." });
        return;
      }
      els.testVercel.disabled = true;
      els.testVercel.textContent = "Testing...";

      const endpoint = `https://api.vercel.com/v2/user${teamId ? `?teamId=${encodeURIComponent(teamId)}` : ""}`;
      fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(function (r) {
          return r.json().then(function (d) {
            return { ok: r.ok, data: d };
          });
        })
        .then(function (res) {
          const user = res.data?.user || null;
          if (res.ok && user) {
            writeValue("vercelToken", token);
            writeValue("vercelProject", project);
            writeValue("vercelTeamId", teamId);
            const label = String(user.username || user.name || user.email || "Vercel user");
            CANARIAToast.success({ title: "Vercel connected", message: `Authenticated as ${label}` });
            updateStatuses();
          } else {
            const msg =
              res.data?.error?.message ||
              res.data?.message ||
              "Invalid token";
            CANARIAToast.error({ title: "Vercel failed", message: msg });
          }
        })
        .catch(function () {
          CANARIAToast.error({ title: "Network error", message: "Could not reach Vercel API." });
        })
        .finally(function () {
          els.testVercel.disabled = false;
          els.testVercel.textContent = "Test Connection";
        });
    });
  }

  // Theme picker.
  if (els.themePicker) {
    els.themePicker.addEventListener("click", function (e) {
      const btn = e.target.closest(".theme-option");
      if (!btn) return;
      const theme = btn.getAttribute("data-theme");
      const root = document.documentElement;
      root.classList.add("theme-transition");

      if (theme === "system") {
        localStorage.removeItem("voyager-theme");
        const sys = matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light";
        root.setAttribute("data-theme", sys);
      } else {
        localStorage.setItem("voyager-theme", theme);
        root.setAttribute("data-theme", theme);
      }

      updateThemePicker();
      setTimeout(function () {
        root.classList.remove("theme-transition");
      }, 400);
    });
  }

  // Clear settings.
  if (els.clearSettings) {
    els.clearSettings.addEventListener("click", function () {
      if (!confirm("Clear all CANARIA settings? This removes stored API keys and preferences.")) return;

      Object.values(KEYS).forEach(function (key) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      Object.values(LEGACY_KEYS).forEach(function (key) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      if (runtime?.storage) {
        const runtimeKeys = Object.values(runtime.storage || {});
        runtimeKeys.forEach(function (key) {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
      }

      localStorage.removeItem("voyager-theme");
      localStorage.removeItem("voyager_editor_mode");
      localStorage.removeItem("voyager_right_collapsed");

      Object.keys(KEYS).forEach(function (id) {
        if (els[id]) {
          els[id].value = "";
        }
      });

      resetProviderForm();
      if (runtime?.ensureProviderAndReturn) {
        runtime.ensureProviderAndReturn();
        renderProviderSelect(runtime.getActiveProviderId?.() || "");
      }

      updateStatuses();

      const sys = matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", sys);
      updateThemePicker();

      CANARIAToast.info({ title: "Cleared", message: "All settings have been removed." });
    });
  }

  migrateLegacyValues();
  load();
})();
