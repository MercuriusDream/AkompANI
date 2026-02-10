(() => {
  const flowSelect = document.getElementById("flowSelect");
  const flowNameInput = document.getElementById("flowName");
  const newFlowBtn = document.getElementById("newFlowBtn");
  const saveFlowBtn = document.getElementById("saveFlowBtn");
  const deleteFlowBtn = document.getElementById("deleteFlowBtn");
  const importFlowBtn = document.getElementById("importFlowBtn");
  const exportFlowBtn = document.getElementById("exportFlowBtn");
  const flowImportInput = document.getElementById("flowImportInput");
  const blockSearch = document.getElementById("blockSearch");
  const palettePanel = document.getElementById("palettePanel");
  const paletteSections = document.getElementById("paletteSections");
  const duplicateNodeBtn = document.getElementById("duplicateNodeBtn");
  const deleteNodeBtn = document.getElementById("deleteNodeBtn");
  const nodeTypeTag = document.getElementById("nodeTypeTag");
  const nodeSummary = document.getElementById("nodeSummary");
  const nodeFormAccordions = document.getElementById("nodeFormAccordions");
  const nodeFormCustomVars = document.getElementById("nodeFormCustomVars");
  const variableHints = document.getElementById("variableHints");
  const inspectorEmpty = document.getElementById("inspectorEmpty");
  const inspectorForm = document.getElementById("inspectorForm");
  const inspectorPanel = document.getElementById("inspectorPanel");
  const inspectorBody = document.getElementById("inspectorBody");
  const nodeJson = document.getElementById("nodeJson");
  const applyNodeJsonBtn = document.getElementById("applyNodeJsonBtn");
  const runInput = document.getElementById("runInput");
  const runFlowBtn = document.getElementById("runFlowBtn");
  const runStatus = document.getElementById("runStatus");
  const eventsPane = document.getElementById("events");
  const drawflowEl = document.getElementById("drawflow");
  const modeChatTab = document.getElementById("modeChatTab");
  const modeCanvasTab = document.getElementById("modeCanvasTab");
  const modeSettingsTab = document.getElementById("modeSettingsTab");
  const navCanvasControls = document.getElementById("navCanvasControls");
  const chatFullView = document.getElementById("chatFullView");
  const canvasView = document.getElementById("canvasView");
  const chatWelcome = document.getElementById("chatWelcome");
  const chatFullScroll = document.getElementById("chatFullScroll");
  const modeDeployTab = document.getElementById("modeDeployTab");
  const deployView = document.getElementById("deployView");
  const settingsView = document.getElementById("settingsView");
  const deploySaveBtn = document.getElementById("deploySaveBtn");
  const deployStatus = document.getElementById("deployStatus");
  const deployLogList = document.getElementById("deployLogList");
  const deployCfTab = document.getElementById("deployCfTab");
  const deployGhTab = document.getElementById("deployGhTab");
  const deployCfPanel = document.getElementById("deployCfPanel");
  const deployGhPanel = document.getElementById("deployGhPanel");
  const chatPill = document.getElementById("chatPill");
  const chatPillBtn = document.getElementById("chatPillBtn");
  const chatPillWindow = document.getElementById("chatPillWindow");
  const chatPillMinimize = document.getElementById("chatPillMinimize");
  const pillChatMessages = document.getElementById("pillChatMessages");
  const pillChatInput = document.getElementById("pillChatInput");
  const pillChatSend = document.getElementById("pillChatSend");
  const buildChatInput = document.getElementById("buildChatInput");
  const buildChatSend = document.getElementById("buildChatSend");
  const buildChatMessages = document.getElementById("buildChatMessages");
  const toggleInspectorBtn = document.getElementById("toggleInspectorBtn");
  const floatInspectorBtn = document.getElementById("floatInspectorBtn");
  const floatingInspector = document.getElementById("floatingInspector");
  const floatingInspectorBody = document.getElementById("floatingInspectorBody");
  const dockInspectorBtn = document.getElementById("dockInspectorBtn");
  const paletteHoverCard = document.getElementById("paletteHoverCard");
  const generateOverlay = document.getElementById("generateOverlay");
  const generatePrompt = document.getElementById("generatePrompt");
  const generateFlowBtn = document.getElementById("generateFlowBtn");
  const generateBtn = document.getElementById("generateBtn");
  const generateError = document.getElementById("generateError");
  const runtimeStateDisplay = document.getElementById("runtimeStateDisplay");
  const oauthGithubClientIdInput = document.getElementById("oauthGithubClientId");
  const oauthCloudflareClientIdInput = document.getElementById("oauthCloudflareClientId");
  const connectGithubBtn = document.getElementById("connectGithubBtn");
  const disconnectGithubBtn = document.getElementById("disconnectGithubBtn");
  const connectCloudflareBtn = document.getElementById("connectCloudflareBtn");
  const disconnectCloudflareBtn = document.getElementById("disconnectCloudflareBtn");
  const githubConnectionState = document.getElementById("githubConnectionState");
  const cloudflareConnectionState = document.getElementById("cloudflareConnectionState");
  const deployCfAccountIdInput = document.getElementById("deployCfAccountId");
  const deployEndpointModeInput = document.getElementById("deployEndpointMode");
  const llmProviderInput = document.getElementById("llmProvider");
  const llmEndpointInput = document.getElementById("llmEndpoint");
  const llmApiKeyInput = document.getElementById("llmApiKey");
  const llmModelSelectInput = document.getElementById("llmModelSelect");
  const llmModelInput = document.getElementById("llmModel");
  const saveLlmConfigBtn = document.getElementById("saveLlmConfigBtn");
  const llmConfigStatus = document.getElementById("llmConfigStatus");
  const modeTabs = [modeChatTab, modeCanvasTab, modeDeployTab, modeSettingsTab].filter(Boolean);
  const modeViews = {
    chat: chatFullView,
    canvas: canvasView,
    deploy: deployView,
    settings: settingsView,
  };
  const editorNavModeLinks = Array.from(document.querySelectorAll("[data-editor-nav-mode]"));

  function normalizeEditorMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    if (normalized === "ops") return "deploy";
    if (normalized === "flow" || normalized === "editor") return "canvas";
    if (normalized === "setting" || normalized === "config") return "settings";
    return Object.prototype.hasOwnProperty.call(modeViews, normalized) ? normalized : "";
  }

  function readModeFromLocation() {
    try {
      const url = new URL(window.location.href);
      const queryMode = normalizeEditorMode(url.searchParams.get("mode") || url.searchParams.get("perspective"));
      if (queryMode) return queryMode;
      const hashMode = normalizeEditorMode(url.hash.replace(/^#/, ""));
      if (hashMode) return hashMode;
    } catch {
      // ignore malformed location values
    }
    return "";
  }

  function syncModeInLocation(mode) {
    if (!window?.history?.replaceState) return;
    const normalizedMode = normalizeEditorMode(mode);
    if (!normalizedMode) return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("mode") === normalizedMode) return;
      url.searchParams.set("mode", normalizedMode);
      const query = url.searchParams.toString();
      const nextHref = `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
      window.history.replaceState(null, "", nextHref);
    } catch {
      // ignore history mutation failures
    }
  }

  // Sliding mode indicator
  const editorNavLinks = document.querySelector(".editor-nav-links");
  let modeIndicator = null;
  if (editorNavLinks) {
    modeIndicator = document.createElement("div");
    modeIndicator.className = "mode-indicator";
    editorNavLinks.appendChild(modeIndicator);
  }

  function updateModeIndicator(mode) {
    if (!modeIndicator || !editorNavLinks) return;
    const activeTab = modeTabs.find((t) => t?.dataset?.mode === mode);
    if (!activeTab) return;
    // Use offsetLeft which is relative to the offsetParent (the nav-links container)
    // This avoids fractional rounding issues with getBoundingClientRect
    modeIndicator.style.width = activeTab.offsetWidth + "px";
    modeIndicator.style.transform = "translateX(" + (activeTab.offsetLeft - 4) + "px)";
  }

  function updateEditorNavModeLinks(mode) {
    for (const link of editorNavModeLinks) {
      const linkMode = normalizeEditorMode(link.dataset.editorNavMode);
      const isActive = Boolean(linkMode) && linkMode === mode;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }

  window.addEventListener("resize", () => updateModeIndicator(state.editorMode));

  const STORAGE_KEYS = {
    localFlows: "voyager_local_flows",
    localAgents: "voyager_local_agents",
    localDeployments: "voyager_local_deployments",
    llmEndpoint: "voyager_llm_endpoint",
    llmModel: "voyager_llm_model",
    llmApiKeySession: "voyager_llm_api_key",
    llmProviderProfiles: "voyager_llm_provider_profiles_v2",
    llmActiveProviderId: "voyager_llm_active_provider_id_v2",
    llmProviderKeysSession: "voyager_llm_provider_keys_v2",
    oauthGithubToken: "voyager_oauth_github_token",
    oauthCloudflareToken: "voyager_oauth_cloudflare_token",
    oauthVercelToken: "voyager_oauth_vercel_token",
    oauthGithubClientId: "voyager_oauth_github_client_id",
    oauthCloudflareClientId: "voyager_oauth_cloudflare_client_id",
    cloudflareAccountId: "voyager_cf_account_id",
    vercelProject: "voyager_vercel_project",
    vercelTeamId: "voyager_vercel_team_id",
    deployEndpointMode: "voyager_deploy_endpoint_mode",
  };

  const editor = new Drawflow(drawflowEl);
  editor.reroute = true;
  editor.reroute_fix_curvature = false;
  editor.reroute_curvature = 0.35;
  editor.reroute_curvature_start_end = 0.25;
  editor.reroute_width = 8;
  editor.line_path = 4;
  editor.start();

  const NODE_GROUPS = [
    {
      id: "makers",
      label: "IDE Makers",
      types: ["vibe_agent_maker", "agent_flow_maker", "agent_block_maker", "chat_code_to_elysia"],
    },
    {
      id: "flow",
      label: "Flow Control",
      types: ["start", "if", "while", "for_each", "delay", "assert", "end"],
    },
    {
      id: "ai",
      label: "AI / LLM",
      types: ["openai_structured", "template"],
    },
    {
      id: "integrations",
      label: "Integrations",
      types: ["http"],
    },
    {
      id: "data",
      label: "Data Processing",
      types: ["set_var", "transform", "json_parse", "json_stringify", "array_push"],
    },
    {
      id: "debug",
      label: "Debug",
      types: ["log"],
    },
    {
      id: "code",
      label: "Code / Scripts",
      types: ["python_script", "typescript_script"],
    },
  ];

  const NODE_CATALOG = {
    vibe_agent_maker: {
      group: "makers",
      label: "Vibe Agent Maker",
      icon: "Vibe",
      meta: "macro",
      color: "#7c72ff",
      ports: "macro: flow blueprint",
      description: "Generates a full multi-step vibe planning and execution flow using reusable core blocks.",
      inputs: 0,
      outputs: 0,
      isMacro: true,
      macroKind: "vibe",
      data: {},
      fields: [],
    },
    agent_flow_maker: {
      group: "makers",
      label: "Agent Flow Maker",
      icon: "Flow+",
      meta: "macro",
      color: "#26b39d",
      ports: "macro: flow blueprint",
      description: "Builds an end-to-end flow scaffold with branching, validation, and output routing.",
      inputs: 0,
      outputs: 0,
      isMacro: true,
      macroKind: "flow",
      data: {},
      fields: [],
    },
    agent_block_maker: {
      group: "makers",
      label: "Agent Block Maker",
      icon: "Block+",
      meta: "macro",
      color: "#f59e0b",
      ports: "macro: block chain",
      description: "Drops a reusable block-chain template for classify, tool call, and structured summary.",
      inputs: 0,
      outputs: 0,
      isMacro: true,
      macroKind: "block",
      data: {},
      fields: [],
    },
    chat_code_to_elysia: {
      group: "makers",
      label: "Chat Code -> Elysia",
      icon: "Ely",
      meta: "macro",
      color: "#ef476f",
      ports: "macro: chat runtime chain",
      description: "Adds chat+code conversion blocks tuned for Elysia+Bun deployment targets.",
      inputs: 0,
      outputs: 0,
      isMacro: true,
      macroKind: "chat_to_elysia",
      data: {},
      fields: [],
    },
    start: {
      group: "flow",
      label: "Start",
      icon: "Start",
      meta: "entry",
      color: "#6366f1",
      ports: "out: next",
      description: "Entry point of the flow. Receives run input as context.input.",
      inputs: 0,
      outputs: 1,
      data: {},
      fields: [],
    },
    end: {
      group: "flow",
      label: "End",
      icon: "End",
      meta: "finish",
      color: "#ef4444",
      ports: "in: input",
      description: "Stops execution and returns the value from returnExpr.",
      inputs: 1,
      outputs: 0,
      data: {
        returnExpr: "last",
      },
      fields: [
        {
          section: "Output",
          key: "returnExpr",
          label: "Return expression",
          type: "text",
          insertMode: "expression",
          help: "Expression resolved in runtime context.",
          example: "last",
          presets: ["last", "vars", "input", "({ output: last, vars })"],
        },
      ],
    },
    if: {
      group: "flow",
      label: "If / Else",
      icon: "If",
      meta: "branch",
      color: "#ff9f0a",
      ports: "out1: true · out2: false",
      description: "Evaluates condition and branches to true/false outputs.",
      inputs: 1,
      outputs: 2,
      data: {
        condition: "Boolean(vars.shouldContinue)",
      },
      fields: [
        {
          section: "Condition",
          key: "condition",
          label: "Expression",
          type: "textarea",
          insertMode: "expression",
          help: "Must evaluate to true or false.",
          example: "vars.counter > 3",
          presets: ["Boolean(last)", "vars.counter > 3", "input.flag === true"],
        },
      ],
    },
    while: {
      group: "flow",
      label: "While",
      icon: "While",
      meta: "loop",
      color: "#ff9f0a",
      ports: "out1: loop · out2: done",
      description: "Loops while condition is true. Includes max-iteration safety.",
      inputs: 1,
      outputs: 2,
      data: {
        condition: "(vars.counter || 0) < 3",
        maxIterations: 50,
      },
      fields: [
        {
          section: "Condition",
          key: "condition",
          label: "Expression",
          type: "textarea",
          insertMode: "expression",
          help: "Loop continues while true.",
          example: "(vars.counter || 0) < 3",
        },
        {
          section: "Safety",
          key: "maxIterations",
          label: "Max iterations",
          type: "number",
          help: "Stops loop when max iterations reached.",
          example: "50",
        },
      ],
    },
    for_each: {
      group: "flow",
      label: "For Each",
      icon: "For",
      meta: "iterate",
      color: "#ff9f0a",
      ports: "out1: loop · out2: done",
      description: "Iterates array items and exposes item/index variables.",
      inputs: 1,
      outputs: 2,
      data: {
        itemsExpr: "Array.isArray(input.items) ? input.items : []",
        itemVar: "item",
        indexVar: "index",
      },
      fields: [
        {
          section: "Collection",
          key: "itemsExpr",
          label: "Items expression",
          type: "textarea",
          insertMode: "expression",
          help: "Must return an array.",
          example: "input.items",
        },
        {
          section: "Variables",
          key: "itemVar",
          label: "Item var",
          type: "text",
          help: "Variable name for current item.",
          example: "item",
        },
        {
          section: "Variables",
          key: "indexVar",
          label: "Index var",
          type: "text",
          help: "Variable name for index.",
          example: "index",
        },
      ],
    },
    delay: {
      group: "flow",
      label: "Delay",
      icon: "Wait",
      meta: "pause",
      color: "#6366f1",
      ports: "out: next",
      description: "Pauses execution for calculated milliseconds.",
      inputs: 1,
      outputs: 1,
      data: {
        msExpr: "300",
        storeAs: "",
      },
      fields: [
        {
          section: "Timing",
          key: "msExpr",
          label: "Duration expr",
          type: "text",
          insertMode: "expression",
          help: "Expression returning milliseconds.",
          example: "500",
          presets: ["250", "500", "1000", "Math.min(3000, (vars.retry || 1) * 500)"],
        },
        {
          section: "Output",
          key: "storeAs",
          label: "Store as",
          type: "text",
          help: "Optional vars key for delay metadata.",
          example: "delayResult",
        },
      ],
    },
    assert: {
      group: "flow",
      label: "Assert",
      icon: "Guard",
      meta: "validate",
      color: "#ef4444",
      ports: "out: next",
      description: "Throws error when condition is false.",
      inputs: 1,
      outputs: 1,
      data: {
        condition: "Boolean(last)",
        message: "Assertion failed",
      },
      fields: [
        {
          section: "Validation",
          key: "condition",
          label: "Condition",
          type: "textarea",
          insertMode: "expression",
          help: "When false, run fails.",
          example: "last.status === 200",
        },
        {
          section: "Validation",
          key: "message",
          label: "Error message",
          type: "text",
          insertMode: "template",
          help: "Supports template interpolation.",
          example: "Expected status 200, got {{last.status}}",
        },
      ],
    },
    openai_structured: {
      group: "ai",
      label: "OpenAI JSON",
      icon: "LLM",
      meta: "structured",
      color: "#4ea1ff",
      ports: "out: next",
      description: "Calls OpenAI with strict JSON schema output.",
      inputs: 1,
      outputs: 1,
      data: {
        model: "gpt-4.1-mini",
        systemPrompt: "You output JSON only.",
        userPrompt: "Extract a compact JSON summary from: {{json input}}",
        schemaName: "summary",
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
          },
          required: ["summary"],
          additionalProperties: false,
        },
        storeAs: "llm",
      },
      fields: [
        {
          section: "Model",
          key: "model",
          label: "Model",
          type: "text",
          help: "OpenAI model id.",
          example: "gpt-4.1-mini",
          presets: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini"],
        },
        {
          section: "Prompt",
          key: "systemPrompt",
          label: "System",
          type: "textarea",
          insertMode: "template",
          help: "System instruction.",
        },
        {
          section: "Prompt",
          key: "userPrompt",
          label: "User",
          type: "textarea",
          insertMode: "template",
          help: "Supports {{json input}}, {{vars.x}} etc.",
          example: "Classify this text: {{input.text}}",
        },
        {
          section: "Schema",
          key: "schemaName",
          label: "Schema name",
          type: "text",
          help: "Name used in OpenAI schema response format.",
          example: "summary_schema",
        },
        {
          section: "Schema",
          key: "schema",
          label: "JSON schema",
          type: "json",
          help: "Strict JSON schema object.",
        },
        {
          section: "Output",
          key: "storeAs",
          label: "Store as",
          type: "text",
          help: "Saves result into vars.<name>.",
          example: "llm",
        },
      ],
    },
    template: {
      group: "ai",
      label: "Template",
      icon: "Tpl",
      meta: "render",
      color: "#6366f1",
      ports: "out: next",
      description: "Renders template with runtime variables.",
      inputs: 1,
      outputs: 1,
      data: {
        template: "Hello {{input.name}}",
        parseJson: false,
        storeAs: "",
      },
      fields: [
        {
          section: "Template",
          key: "template",
          label: "Template",
          type: "textarea",
          insertMode: "template",
          help: "Supports {{input.*}}, {{vars.*}}, {{json last}}.",
        },
        {
          section: "Template",
          key: "parseJson",
          label: "Parse JSON",
          type: "select",
          options: ["false", "true"],
          help: "If true, rendered output is parsed as JSON.",
        },
        {
          section: "Output",
          key: "storeAs",
          label: "Store as",
          type: "text",
          help: "Optional vars key.",
          example: "rendered",
        },
      ],
    },
    http: {
      group: "integrations",
      label: "HTTP Request",
      icon: "HTTP",
      meta: "api",
      color: "#4ea1ff",
      ports: "out: next",
      description: "Performs HTTP call with optional templated body/headers.",
      inputs: 1,
      outputs: 1,
      data: {
        method: "GET",
        url: "https://httpbin.org/get",
        headers: {},
        body: "",
        storeAs: "httpResult",
      },
      fields: [
        {
          section: "Request",
          key: "method",
          label: "Method",
          type: "select",
          options: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        },
        {
          section: "Request",
          key: "url",
          label: "URL",
          type: "text",
          insertMode: "template",
          help: "Supports template interpolation.",
          example: "https://api.example.com/items/{{vars.id}}",
        },
        {
          section: "Request",
          key: "headers",
          label: "Headers JSON",
          type: "json",
          help: "Object map of headers.",
          example: "{\"Authorization\":\"Bearer ...\"}",
        },
        {
          section: "Request",
          key: "body",
          label: "Body",
          type: "textarea",
          insertMode: "template",
          help: "JSON string/object or plain text.",
        },
        {
          section: "Output",
          key: "storeAs",
          label: "Store as",
          type: "text",
          help: "Saves status/headers/data bundle.",
          example: "httpResult",
        },
      ],
    },
    set_var: {
      group: "data",
      label: "Set Variable",
      icon: "Var",
      meta: "state",
      color: "#6366f1",
      ports: "out: next",
      description: "Writes expression result into vars.<varName>.",
      inputs: 1,
      outputs: 1,
      data: {
        varName: "counter",
        expression: "(vars.counter || 0) + 1",
      },
      fields: [
        {
          section: "Variable",
          key: "varName",
          label: "Name",
          type: "text",
          help: "Variable name without vars. prefix.",
          example: "counter",
        },
        {
          section: "Variable",
          key: "expression",
          label: "Expression",
          type: "textarea",
          insertMode: "expression",
          help: "Evaluated against runtime context.",
          example: "(vars.counter || 0) + 1",
        },
      ],
    },
    transform: {
      group: "data",
      label: "Transform",
      icon: "Map",
      meta: "compute",
      color: "#6366f1",
      ports: "out: next",
      description: "Calculates expression and sets it as last.",
      inputs: 1,
      outputs: 1,
      data: {
        expression: "({ input, vars, last })",
        storeAs: "transformed",
      },
      fields: [
        {
          section: "Transform",
          key: "expression",
          label: "Expression",
          type: "textarea",
          insertMode: "expression",
          help: "Any JS expression returning a value.",
          example: "({ id: last.data.id, ok: last.ok })",
        },
        {
          section: "Output",
          key: "storeAs",
          label: "Store as",
          type: "text",
          help: "Optional vars key.",
          example: "transformed",
        },
      ],
    },
    json_parse: {
      group: "data",
      label: "JSON Parse",
      icon: "Parse",
      meta: "json",
      color: "#6366f1",
      ports: "out: next",
      description: "Parses JSON text from expression result.",
      inputs: 1,
      outputs: 1,
      data: {
        sourceExpr: "last",
        onError: "throw",
        storeAs: "",
      },
      fields: [
        {
          section: "Input",
          key: "sourceExpr",
          label: "Source expression",
          type: "text",
          insertMode: "expression",
          help: "Should return string or object.",
          example: "last.data",
        },
        {
          section: "Behavior",
          key: "onError",
          label: "On parse error",
          type: "select",
          options: ["throw", "null", "original"],
        },
        {
          section: "Output",
          key: "storeAs",
          label: "Store as",
          type: "text",
          help: "Optional vars key.",
          example: "parsed",
        },
      ],
    },
    json_stringify: {
      group: "data",
      label: "JSON Stringify",
      icon: "String",
      meta: "json",
      color: "#6366f1",
      ports: "out: next",
      description: "Stringifies value from expression with indentation.",
      inputs: 1,
      outputs: 1,
      data: {
        sourceExpr: "last",
        indent: 2,
        storeAs: "",
      },
      fields: [
        {
          section: "Input",
          key: "sourceExpr",
          label: "Source expression",
          type: "text",
          insertMode: "expression",
          example: "vars.payload",
        },
        {
          section: "Format",
          key: "indent",
          label: "Indent",
          type: "number",
          help: "0 for compact output.",
          example: "2",
        },
        {
          section: "Output",
          key: "storeAs",
          label: "Store as",
          type: "text",
          example: "jsonText",
        },
      ],
    },
    array_push: {
      group: "data",
      label: "Array Push",
      icon: "Push",
      meta: "collection",
      color: "#6366f1",
      ports: "out: next",
      description: "Appends a value into vars.<arrayVar>.",
      inputs: 1,
      outputs: 1,
      data: {
        arrayVar: "items",
        valueExpr: "last",
        unique: false,
        maxLength: "",
      },
      fields: [
        {
          section: "Array",
          key: "arrayVar",
          label: "Array var",
          type: "text",
          help: "Variable key in vars.",
          example: "items",
        },
        {
          section: "Array",
          key: "valueExpr",
          label: "Value expression",
          type: "textarea",
          insertMode: "expression",
          help: "Value to push.",
          example: "vars.item",
        },
        {
          section: "Array",
          key: "unique",
          label: "Unique",
          type: "select",
          options: ["false", "true"],
          help: "Prevents duplicate values.",
        },
        {
          section: "Array",
          key: "maxLength",
          label: "Max length",
          type: "number",
          help: "Optional trim size. Empty keeps all.",
          example: "100",
        },
      ],
    },
    log: {
      group: "debug",
      label: "Log",
      icon: "Log",
      meta: "trace",
      color: "#6366f1",
      ports: "out: next",
      description: "Emits log entry in run events.",
      inputs: 1,
      outputs: 1,
      data: {
        message: "index={{vars.index}} item={{json vars.item}}",
      },
      fields: [
        {
          section: "Message",
          key: "message",
          label: "Template",
          type: "textarea",
          insertMode: "template",
          help: "Supports template interpolation.",
          example: "status={{last.status}} body={{json last.data}}",
          presets: ["{{json last}}", "{{json vars}}", "{{json input}}"],
        },
      ],
    },
    python_script: {
      group: "code",
      label: "Python Script",
      icon: "Py",
      meta: "script",
      color: "#3776ab",
      ports: "out: next",
      description: "Runs custom Python code with access to input, vars, and last. Set `result` to output.",
      inputs: 1,
      outputs: 1,
      data: { code: "# Access context via: input, vars, last\n# Set result to your output\nresult = last", timeout: 10000, storeAs: "" },
      fields: [
        { section: "Code", key: "code", label: "Python code", type: "textarea", help: "Use input, vars, last. Set result = <value>.", example: "result = {'count': len(input.get('items', []))}" },
        { section: "Execution", key: "timeout", label: "Timeout (ms)", type: "number", help: "Max execution time.", example: "10000" },
        { section: "Output", key: "storeAs", label: "Store as", type: "text", help: "Optional vars key.", example: "pyResult" },
      ],
    },
    typescript_script: {
      group: "code",
      label: "TypeScript Script",
      icon: "TS",
      meta: "script",
      color: "#3178c6",
      ports: "out: next",
      description: "Runs custom TypeScript/JS code with access to input, vars, and last. Set `result` to output.",
      inputs: 1,
      outputs: 1,
      data: { code: "// Access context via: input, vars, last\n// Set result to your output\nconst result = last;", timeout: 5000, storeAs: "" },
      fields: [
        { section: "Code", key: "code", label: "TypeScript code", type: "textarea", help: "Use input, vars, last. Define result = <value>.", example: "const result = { count: Array.isArray(input.items) ? input.items.length : 0 };" },
        { section: "Execution", key: "timeout", label: "Timeout (ms)", type: "number", help: "Max execution time.", example: "5000" },
        { section: "Output", key: "storeAs", label: "Store as", type: "text", help: "Optional vars key.", example: "tsResult" },
      ],
    },
  };

  const state = {
    currentFlowId: "",
    selectedNodeId: "",
    activeFormField: null,
    paletteQuery: "",
    paletteSearchDebounceTimer: null,
    dragCandidateNodeId: "",
    draggingCanvasNodeId: "",
    dragStart: null,
    currentRunId: "",
    cursor: 0,
    pullToken: 0,
    pullTimer: null,
    ws: null,
    wsSubscribedRunId: "",
    seenEventIds: new Set(),
    nodeRuntimeById: {},
    lastRunningNodeId: "",
    collapsedGroups: {},
    editorMode: "chat",
    isInspectorCollapsed: false,
    activeInspectorTab: "config",
    isInspectorFloating: false,
    floatingPos: { x: null, y: null },
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function toBool(value) {
    return value === true || value === "true" || value === "1";
  }

  function parseJsonString(value) {
    const text = String(value || "").trim();
    if (!text) return null;
    return JSON.parse(text);
  }

  function groupLabelById(groupId) {
    const group = NODE_GROUPS.find((item) => item.id === groupId);
    return group?.label || "General";
  }

  function ioCounts(def) {
    return {
      input: Number(def?.inputs || 0),
      output: Number(def?.outputs || 0),
    };
  }

  function ioSummary(def) {
    const counts = ioCounts(def);
    return `${counts.input} in · ${counts.output} out`;
  }

  function ioChipsHtml(def) {
    const counts = ioCounts(def);
    return `
      <div class="info-chip io io-in"><span class="io-label">In</span><span class="io-value">${counts.input}</span></div>
      <div class="info-chip io io-out"><span class="io-label">Out</span><span class="io-value">${counts.output}</span></div>
    `;
  }

  function nodeHoverInfo(def) {
    const lines = [];
    if (def?.description) {
      lines.push(def.description);
    }
    lines.push(`Category: ${groupLabelById(def?.group)}`);
    lines.push(`I/O: ${ioSummary(def)}`);
    lines.push(`Routing: ${String(def?.ports || "Single path")}`);
    return lines.join("\n");
  }

  function toFormDisplay(value, type) {
    if (value === undefined || value === null) return "";

    if (type === "json") {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          try {
            return JSON.stringify(JSON.parse(trimmed), null, 2);
          } catch {
            return value;
          }
        }
        return value;
      }
      return JSON.stringify(value, null, 2);
    }

    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizeCssColor(value, fallback = "#666") {
    const text = String(value || "").trim();
    if (!text) return fallback;
    if (/^#[0-9a-f]{3,8}$/i.test(text)) return text;
    if (/^rgba?\(\s*[\d.\s,%]+\)$/i.test(text)) return text;
    if (/^hsla?\(\s*[\d.\s,%]+\)$/i.test(text)) return text;
    if (/^[a-z]{3,20}$/i.test(text)) return text;
    return fallback;
  }

  function truncateText(value, max = 80) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1)}…`;
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
      const normalized = String(value || "").trim();
      if (normalized) {
        localStorage.setItem(key, normalized);
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore storage errors
    }
  }

  function readSession(key) {
    try {
      return String(sessionStorage.getItem(key) || "").trim();
    } catch {
      return "";
    }
  }

  function writeSession(key, value) {
    try {
      const normalized = String(value || "").trim();
      if (normalized) {
        sessionStorage.setItem(key, normalized);
      } else {
        sessionStorage.removeItem(key);
      }
    } catch {
      // ignore storage errors
    }
  }

  function readJsonArrayFromLocalStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeJsonArrayToLocalStorage(key, rows) {
    try {
      localStorage.setItem(key, JSON.stringify(Array.isArray(rows) ? rows : []));
    } catch {
      // ignore storage errors
    }
  }

  function getGithubToken() {
    return readSession(STORAGE_KEYS.oauthGithubToken);
  }

  function getCloudflareToken() {
    return readSession(STORAGE_KEYS.oauthCloudflareToken);
  }

  function getVercelToken() {
    return readSession(STORAGE_KEYS.oauthVercelToken);
  }

  function getVercelProject() {
    return readLocal(STORAGE_KEYS.vercelProject);
  }

  function getVercelTeamId() {
    return readLocal(STORAGE_KEYS.vercelTeamId);
  }

  function getCloudflareAccountId() {
    return (
      String(deployCfAccountIdInput?.value || "").trim() ||
      readLocal(STORAGE_KEYS.cloudflareAccountId) ||
      readLocal("voyager_cf_account_id")
    );
  }

  function getIdeRuntime() {
    const runtime = window.CANARIA_IDE;
    if (!runtime || typeof runtime !== "object") return null;
    return runtime;
  }

  function normalizeEndpointMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    if (normalized === "openai" || normalized === "chat" || normalized === "both") {
      return normalized;
    }
    return "both";
  }

  function parseEndpointParts(endpoint) {
    const text = String(endpoint || "").trim();
    if (!text) {
      return {
        baseUrl: "",
        path: "/v1/chat/completions",
      };
    }

    try {
      const url = new URL(text);
      return {
        baseUrl: `${url.protocol}//${url.host}`,
        path: url.pathname || "/v1/chat/completions",
      };
    } catch {
      return {
        baseUrl: text.replace(/\/v1\/chat\/completions$/i, "").replace(/\/+$/, ""),
        path: "/v1/chat/completions",
      };
    }
  }

  function buildLlmRequestHeaders(cfg) {
    const headers = cfg?.headers && typeof cfg.headers === "object" ? { ...cfg.headers } : {};
    if (!headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }

    const hasAuthHeader = Object.keys(headers).some((key) => key.toLowerCase() === "authorization");
    if (!hasAuthHeader && cfg?.apiKey) {
      headers.Authorization = `Bearer ${cfg.apiKey}`;
    }

    return headers;
  }

  function getLlmConfig() {
    const runtime = getIdeRuntime();
    if (runtime?.getActiveLlmConfig) {
      const resolved = runtime.getActiveLlmConfig() || {};
      return {
        providerId: String(resolved.providerId || "").trim(),
        providerName: String(resolved.providerName || "").trim(),
        endpoint: String(resolved.endpoint || readLocal(STORAGE_KEYS.llmEndpoint)).trim(),
        apiKey: String(resolved.apiKey || readSession(STORAGE_KEYS.llmApiKeySession)).trim(),
        model: String(resolved.model || readLocal(STORAGE_KEYS.llmModel)).trim(),
        headers: resolved.headers && typeof resolved.headers === "object" ? resolved.headers : {},
      };
    }

    return {
      providerId: "",
      providerName: "",
      endpoint: readLocal(STORAGE_KEYS.llmEndpoint),
      apiKey: readSession(STORAGE_KEYS.llmApiKeySession),
      model: readLocal(STORAGE_KEYS.llmModel),
      headers: {},
    };
  }

  function setLlmStatus(message, level) {
    if (!llmConfigStatus) return;
    llmConfigStatus.textContent = message;
    llmConfigStatus.className = "deploy-status";
    if (level === "error") {
      llmConfigStatus.classList.add("error");
      return;
    }
    if (level === "success") {
      llmConfigStatus.classList.add("success");
    }
  }

  function renderLlmProviderOptions(preferredProviderId = "") {
    if (!llmProviderInput) return [];
    const runtime = getIdeRuntime();
    if (!runtime?.listProviders) return [];

    const providers = runtime.listProviders();
    llmProviderInput.innerHTML = "";

    if (!providers.length) {
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "No providers configured";
      llmProviderInput.appendChild(empty);
      return [];
    }

    for (const provider of providers) {
      const opt = document.createElement("option");
      opt.value = provider.id;
      opt.textContent = provider.name;
      llmProviderInput.appendChild(opt);
    }

    const selected =
      String(preferredProviderId || "").trim() ||
      String(llmProviderInput.value || "").trim() ||
      String(runtime.getActiveProviderId?.() || "").trim() ||
      providers[0].id;

    llmProviderInput.value = selected;
    return providers;
  }

  function renderLlmModelOptions(providerId, preferredModel = "") {
    if (!llmModelSelectInput) return;
    const runtime = getIdeRuntime();
    if (!runtime?.getProviderById) return;

    const provider = runtime.getProviderById(providerId);
    if (!provider) {
      llmModelSelectInput.innerHTML = '<option value="">No models</option>';
      return;
    }

    const models = Array.isArray(provider.models) ? provider.models : [];
    llmModelSelectInput.innerHTML = "";
    for (const model of models) {
      const opt = document.createElement("option");
      opt.value = model;
      opt.textContent = model;
      llmModelSelectInput.appendChild(opt);
    }

    const selectedModel =
      String(preferredModel || "").trim() ||
      String(llmModelInput?.value || "").trim() ||
      String(provider.activeModel || "").trim() ||
      String(models[0] || "").trim();

    if (selectedModel && !models.includes(selectedModel)) {
      const custom = document.createElement("option");
      custom.value = selectedModel;
      custom.textContent = `${selectedModel} (custom)`;
      llmModelSelectInput.appendChild(custom);
    }

    if (selectedModel) {
      llmModelSelectInput.value = selectedModel;
    }

    if (llmModelInput) {
      llmModelInput.value = selectedModel || "";
    }

    if (llmEndpointInput) {
      llmEndpointInput.value = String(provider.endpoint || "").trim();
    }

    if (llmApiKeyInput && runtime.getProviderApiKey) {
      llmApiKeyInput.value = runtime.getProviderApiKey(provider.id) || "";
    }
  }

  function syncDeployLlmProviderUi(preferredProviderId = "", preferredModel = "") {
    const cfg = getLlmConfig();
    const selectedProviderId = String(preferredProviderId || cfg.providerId || "").trim();
    renderLlmProviderOptions(selectedProviderId);
    if (llmProviderInput) {
      renderLlmModelOptions(llmProviderInput.value, preferredModel || cfg.model);
    }

    if (llmEndpointInput && !llmEndpointInput.value) {
      llmEndpointInput.value = cfg.endpoint || "";
    }
    if (llmApiKeyInput && !llmApiKeyInput.value) {
      llmApiKeyInput.value = cfg.apiKey || "";
    }
    if (llmModelInput && !llmModelInput.value) {
      llmModelInput.value = cfg.model || "";
    }
  }

  function formatNodePreviewValue(value) {
    if (value === undefined || value === null || value === "") return "";
    if (typeof value === "number" || typeof value === "boolean") return String(value);

    if (typeof value === "string") {
      return truncateText(value, 54);
    }

    if (Array.isArray(value)) {
      return value.length === 0 ? "[]" : `[${value.length} items]`;
    }

    if (typeof value === "object") {
      const keys = Object.keys(value);
      if (keys.length === 0) return "{}";
      const head = keys.slice(0, 3).join(", ");
      return keys.length > 3 ? `{${head}, ...}` : `{${head}}`;
    }

    return truncateText(String(value), 54);
  }

  function nodePreviewItems(def, data) {
    const list = [];
    const fields = Array.isArray(def?.fields) ? def.fields : [];

    for (const field of fields) {
      if (list.length >= 4) break;
      const value = formatNodePreviewValue(data?.[field.key]);
      if (!value) continue;
      list.push({
        key: field.label || field.key,
        value,
      });
    }

    const customVars = data?.customVars;
    if (customVars && typeof customVars === "object" && !Array.isArray(customVars)) {
      for (const [key, value] of Object.entries(customVars)) {
        if (list.length >= 4) break;
        const previewValue = formatNodePreviewValue(value);
        if (!previewValue) continue;
        list.push({
          key: key || "custom",
          value: previewValue,
        });
      }
    }

    return list;
  }

  function previewGridHtml(previewItems, fallbackKey, fallbackValue) {
    const items = Array.isArray(previewItems) ? previewItems : [];

    if (items.length === 0) {
      return `
        <div class="preview-grid">
          <div class="preview-chip">
            <span class="preview-key">${escapeHtml(fallbackKey)}</span>
            <span class="preview-value">${escapeHtml(fallbackValue)}</span>
          </div>
        </div>
      `;
    }

    const previewHtml = items
      .map(
        (item) =>
          `<div class="preview-chip" title="${escapeHtml(`${item.key}: ${item.value}`)}"><span class="preview-key">${escapeHtml(item.key)}</span><span class="preview-value">${escapeHtml(item.value)}</span></div>`,
      )
      .join("");

    return `<div class="preview-grid">${previewHtml}</div>`;
  }

  function runtimeStatusClass(status) {
    if (status === "running") return "running";
    if (status === "completed") return "completed";
    if (status === "failed") return "failed";
    return "idle";
  }

  function runtimeStatusText(status) {
    if (status === "running") return "Running";
    if (status === "completed") return "Done";
    if (status === "failed") return "Failed";
    return "Idle";
  }

  function getNodeRuntime(nodeId) {
    if (!nodeId) {
      return {
        status: "idle",
        detail: "Idle",
      };
    }

    return (
      state.nodeRuntimeById[nodeId] || {
        status: "idle",
        detail: "Idle",
      }
    );
  }

  function setNodeRuntime(nodeId, patch) {
    const id = String(nodeId || "").trim();
    if (!id) return;

    const prev = getNodeRuntime(id);
    state.nodeRuntimeById[id] = {
      ...prev,
      ...patch,
      updatedAt: Date.now(),
    };
    updateNodeCard(id);

    if (state.selectedNodeId === id) {
      const selected = getSelectedNode();
      if (selected) {
        renderNodeSummary(selected, NODE_CATALOG[selected.name]);
      }
    }
  }

  function resetNodeRuntime() {
    state.nodeRuntimeById = {};
    state.lastRunningNodeId = "";
    refreshAllNodeCards();
    if (state.selectedNodeId) {
      const selected = getSelectedNode();
      if (selected) {
        renderNodeSummary(selected, NODE_CATALOG[selected.name]);
      }
    }
  }

  function applyRunEventToNodeRuntime(event) {
    if (!event || !event.type) return;

    if (event.type === "run_started") {
      resetNodeRuntime();
      return;
    }

    if (event.type === "node_started") {
      const step = event.detail?.step;
      const detail = step ? `Running step ${step}` : "Running";
      state.lastRunningNodeId = String(event.nodeId || "");
      setNodeRuntime(event.nodeId, {
        status: "running",
        detail,
      });
      return;
    }

    if (event.type === "node_completed") {
      const port = event.detail?.port ? String(event.detail.port) : "";
      const detail = port ? `Done via ${port}` : "Completed";
      setNodeRuntime(event.nodeId, {
        status: "completed",
        detail,
      });
      return;
    }

    if (event.type === "node_log") {
      const message = event.detail?.message ? truncateText(String(event.detail.message), 52) : "";
      if (!message) return;
      setNodeRuntime(event.nodeId, {
        detail: `Log: ${message}`,
      });
      return;
    }

    if (event.type === "run_failed") {
      const fallbackNode = state.lastRunningNodeId;
      const errorText = event.detail?.error ? truncateText(String(event.detail.error), 54) : "Run failed";
      if (fallbackNode) {
        setNodeRuntime(fallbackNode, {
          status: "failed",
          detail: errorText,
        });
      }
      return;
    }
  }

  const BLOCK_SVG_ICONS = {
    python_script: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="14" y1="4" x2="10" y2="20"/></svg>`,
    typescript_script: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="14" y1="4" x2="10" y2="20"/></svg>`,
  };

  function blockIconHtml(type, def) {
    const svg = BLOCK_SVG_ICONS[type];
    if (svg) return svg;
    return escapeHtml(def.icon);
  }

  function nodeTemplate(type, nodeData, nodeId = "") {
    const def = NODE_CATALOG[type] || {
      label: type,
      icon: "Node",
      meta: "",
      color: "#666",
      ports: "",
      description: "",
      fields: [],
      data: {},
    };

    const runtime = getNodeRuntime(String(nodeId || ""));
    const statusClass = runtimeStatusClass(runtime.status);
    const statusText = runtimeStatusText(runtime.status);
    const hoverInfo = nodeHoverInfo(def);
    const previewItems = nodePreviewItems(def, nodeData ?? def.data ?? {}).slice(0, 4);
    const previewHtml = previewGridHtml(previewItems, "Settings", "No variable setup");
    const safeColor = sanitizeCssColor(def.color, "#666");
    const safeLabel = escapeHtml(def.label || type || "Node");

    return `
      <div class="node-card" title="${escapeHtml(hoverInfo)}">
        <div class="node-top-row">
          <div class="node-title-wrap">
            <div class="badge" style="background:${safeColor}">${blockIconHtml(type, def)}</div>
            <div class="title">${safeLabel}</div>
          </div>
          <div class="node-status ${statusClass}">${statusText}</div>
        </div>
        <div class="node-info-row">
          ${ioChipsHtml(def)}
        </div>
        ${previewHtml}
      </div>
    `;
  }

  function updateNodeCard(nodeId) {
    const id = String(nodeId || "").trim();
    if (!id) return;
    const node = editor.getNodeFromId(Number(id));
    if (!node) return;

    const nodeEl = document.getElementById(`node-${id}`);
    const content = nodeEl?.querySelector(".drawflow_content_node");
    if (!content) return;

    content.innerHTML = nodeTemplate(node.name, node.data || {}, id);
  }

  function refreshAllNodeCards() {
    const nodes = editor?.drawflow?.drawflow?.Home?.data || {};
    for (const [nodeId, node] of Object.entries(nodes)) {
      const nodeEl = document.getElementById(`node-${nodeId}`);
      const content = nodeEl?.querySelector(".drawflow_content_node");
      if (!content) continue;
      content.innerHTML = nodeTemplate(node.name, node.data || {}, nodeId);
    }
  }

  function canvasPositionFromClient(clientX, clientY) {
    const rect = editor.precanvas.getBoundingClientRect();
    const scaleX = editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom);
    const scaleY = editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom);

    const x = clientX * scaleX - rect.x * scaleX;
    const y = clientY * scaleY - rect.y * scaleY;

    return {
      x: Math.round(x - 105),
      y: Math.round(y - 40),
    };
  }

  function connectNodesSafe(sourceId, targetId, sourcePort = "output_1", targetPort = "input_1") {
    if (!sourceId || !targetId) return;
    try {
      editor.addConnection(sourceId, targetId, sourcePort, targetPort);
    } catch {
      // Ignore macro connection errors.
    }
  }

  function insertMakerMacro(kind, x, y) {
    const baseX = Number.isFinite(x) ? x : Math.round(220 + Math.random() * 240);
    const baseY = Number.isFinite(y) ? y : Math.round(150 + Math.random() * 220);

    if (kind === "vibe") {
      const start = addNode("start", baseX, baseY);
      const template = addNode("template", baseX + 230, baseY, {
        template:
          "Vibe brief: {{input.prompt}}\\nConstraints: {{json input.constraints}}\\nBudget: {{input.budget}}\\nDeadline: {{input.deadline}}",
        parseJson: false,
        storeAs: "vibePrompt",
      });
      const llm = addNode("openai_structured", baseX + 470, baseY, {
        model: "gpt-4.1-mini",
        systemPrompt:
          "You are Vibe Agent Maker. Return JSON with intent, architecture, taskBlocks, deploymentPlan, and riskChecks.",
        userPrompt: "{{vars.vibePrompt}}",
        schemaName: "vibe_plan",
        schema: {
          type: "object",
          properties: {
            intent: { type: "string" },
            architecture: { type: "string" },
            taskBlocks: { type: "array", items: { type: "string" } },
            deploymentPlan: { type: "array", items: { type: "string" } },
            riskChecks: { type: "array", items: { type: "string" } },
          },
          required: ["intent", "architecture", "taskBlocks", "deploymentPlan", "riskChecks"],
          additionalProperties: false,
        },
        storeAs: "vibePlan",
      });
      const gate = addNode("if", baseX + 700, baseY, {
        condition: "Boolean(vars.vibePlan && vars.vibePlan.taskBlocks && vars.vibePlan.taskBlocks.length)",
      });
      const execute = addNode("http", baseX + 940, baseY - 120, {
        method: "POST",
        url: "https://example.tools/agent/execute",
        headers: { "content-type": "application/json" },
        body: "{{json vars.vibePlan}}",
        storeAs: "executionResult",
      });
      const fallback = addNode("log", baseX + 940, baseY + 120, {
        messageTemplate: "Vibe planning gate failed. Plan payload: {{json vars.vibePlan}}",
      });
      const end = addNode("end", baseX + 1180, baseY, {
        returnExpr: "({ plan: vars.vibePlan, execution: vars.executionResult, last })",
      });

      connectNodesSafe(start, template);
      connectNodesSafe(template, llm);
      connectNodesSafe(llm, gate);
      connectNodesSafe(gate, execute, "output_1", "input_1");
      connectNodesSafe(gate, fallback, "output_2", "input_1");
      connectNodesSafe(execute, end);
      connectNodesSafe(fallback, end);
      return start;
    }

    if (kind === "flow") {
      const start = addNode("start", baseX, baseY);
      const brief = addNode("template", baseX + 220, baseY, {
        template: "Flow request: {{input.goal}}\\nPriority: {{input.priority}}\\nContext: {{json input.context}}",
        parseJson: false,
        storeAs: "flowBrief",
      });
      const route = addNode("openai_structured", baseX + 460, baseY, {
        model: "gpt-4.1-mini",
        systemPrompt: "Return route, urgency, rationale in JSON.",
        userPrompt: "{{vars.flowBrief}}",
        schemaName: "flow_route",
        schema: {
          type: "object",
          properties: {
            route: { type: "string" },
            urgency: { type: "string" },
            rationale: { type: "string" },
          },
          required: ["route", "urgency", "rationale"],
          additionalProperties: false,
        },
        storeAs: "routeResult",
      });
      const gate = addNode("if", baseX + 700, baseY, {
        condition: "vars.routeResult && vars.routeResult.urgency === 'high'",
      });
      const escalate = addNode("http", baseX + 940, baseY - 120, {
        method: "POST",
        url: "https://example.internal/escalate",
        headers: { "content-type": "application/json" },
        body: "{{json vars.routeResult}}",
        storeAs: "escalationResult",
      });
      const standard = addNode("transform", baseX + 940, baseY + 120, {
        expression: "({ mode: 'standard', route: vars.routeResult.route, reason: vars.routeResult.rationale })",
        storeAs: "standardResult",
      });
      const end = addNode("end", baseX + 1170, baseY, {
        returnExpr: "({ route: vars.routeResult, escalation: vars.escalationResult, standard: vars.standardResult })",
      });

      connectNodesSafe(start, brief);
      connectNodesSafe(brief, route);
      connectNodesSafe(route, gate);
      connectNodesSafe(gate, escalate, "output_1", "input_1");
      connectNodesSafe(gate, standard, "output_2", "input_1");
      connectNodesSafe(escalate, end);
      connectNodesSafe(standard, end);
      return start;
    }

    if (kind === "block") {
      const start = addNode("start", baseX, baseY);
      const classify = addNode("openai_structured", baseX + 240, baseY, {
        model: "gpt-4.1-mini",
        systemPrompt: "Classify intent and return toolCategory and postProcess in JSON.",
        userPrompt: "{{json input}}",
        schemaName: "block_classify",
        schema: {
          type: "object",
          properties: {
            intent: { type: "string" },
            toolCategory: { type: "string" },
            postProcess: { type: "string" },
          },
          required: ["intent", "toolCategory", "postProcess"],
          additionalProperties: false,
        },
        storeAs: "blockClassify",
      });
      const tool = addNode("http", baseX + 490, baseY, {
        method: "POST",
        url: "https://example.tools/router",
        headers: { "content-type": "application/json" },
        body: "{{json vars.blockClassify}}",
        storeAs: "toolResponse",
      });
      const summary = addNode("transform", baseX + 740, baseY, {
        expression: "({ classify: vars.blockClassify, tool: vars.toolResponse })",
        storeAs: "blockSummary",
      });
      const end = addNode("end", baseX + 980, baseY, {
        returnExpr: "vars.blockSummary",
      });

      connectNodesSafe(start, classify);
      connectNodesSafe(classify, tool);
      connectNodesSafe(tool, summary);
      connectNodesSafe(summary, end);
      return start;
    }

    if (kind === "chat_to_elysia") {
      const start = addNode("start", baseX, baseY);
      const prompt = addNode("template", baseX + 220, baseY, {
        template:
          "Convert chat request to Elysia+Bun deploy spec.\\nPrompt: {{input.prompt}}\\nTarget: {{input.target}}\\nProviders: {{json input.providers}}",
        parseJson: false,
        storeAs: "conversionPrompt",
      });
      const code = addNode("typescript_script", baseX + 470, baseY, {
        code:
          "const request = String(vars.conversionPrompt || input.prompt || '');\\n" +
          "const result = {\\n" +
          "  runtime: 'elysia-bun',\\n" +
          "  deployTargets: ['cloudflare_workers_elysia_bun', 'vercel_elysia_bun', 'local_elysia_bun'],\\n" +
          "  routes: ['/health', '/flow', '/invoke', '/v1/chat/completions'],\\n" +
          "  request\\n" +
          "};",
        timeout: 5000,
        storeAs: "elysiaSpec",
      });
      const stringify = addNode("json_stringify", baseX + 730, baseY, {
        sourceExpr: "vars.elysiaSpec",
        indent: 2,
        storeAs: "elysiaSpecJson",
      });
      const checklist = addNode("openai_structured", baseX + 980, baseY, {
        model: "gpt-4.1-mini",
        systemPrompt: "Produce JSON deployment checklists for cloudflare, vercel, and local targets.",
        userPrompt: "{{vars.elysiaSpecJson}}",
        schemaName: "deploy_checklist",
        schema: {
          type: "object",
          properties: {
            cloudflare: { type: "array", items: { type: "string" } },
            vercel: { type: "array", items: { type: "string" } },
            local: { type: "array", items: { type: "string" } },
          },
          required: ["cloudflare", "vercel", "local"],
          additionalProperties: false,
        },
        storeAs: "deployChecklist",
      });
      const end = addNode("end", baseX + 1220, baseY, {
        returnExpr: "({ spec: vars.elysiaSpec, checklist: vars.deployChecklist })",
      });

      connectNodesSafe(start, prompt);
      connectNodesSafe(prompt, code);
      connectNodesSafe(code, stringify);
      connectNodesSafe(stringify, checklist);
      connectNodesSafe(checklist, end);
      return start;
    }

    return undefined;
  }

  function addNode(type, x, y, dataOverride) {
    const def = NODE_CATALOG[type];
    if (!def) return undefined;

    if (def.isMacro) {
      const created = insertMakerMacro(def.macroKind, x, y);
      if (created && typeof CANARIAToast !== "undefined") {
        CANARIAToast.success({
          title: `${def.label} inserted`,
          message: "Maker blueprint blocks were added to the canvas.",
        });
      }
      return created;
    }

    const finalX = Number.isFinite(x) ? x : Math.round(220 + Math.random() * 300);
    const finalY = Number.isFinite(y) ? y : Math.round(160 + Math.random() * 200);
    const nodeData = dataOverride ? clone(dataOverride) : clone(def.data);

    const createdId = editor.addNode(
      type,
      def.inputs,
      def.outputs,
      finalX,
      finalY,
      type,
      nodeData,
      nodeTemplate(type, nodeData),
      false,
    );

    updateNodeCard(createdId);
    return createdId;
  }

  function addNodeNearCanvasCenter(type) {
    const rect = drawflowEl.getBoundingClientRect();
    const center = canvasPositionFromClient(rect.left + rect.width / 2, rect.top + rect.height / 2);
    addNode(type, center.x, center.y);
  }

  function clearEditor() {
    if (typeof editor.clear === "function") {
      editor.clear();
      return;
    }

    editor.drawflow.drawflow.Home.data = {};
    editor.load();
  }

  function createStarterFlow() {
    clearEditor();
    resetNodeRuntime();

    const startId = addNode("start", 180, 220);
    const endId = addNode("end", 560, 220);

    if (startId && endId) {
      editor.addConnection(startId, endId, "output_1", "input_1");
    }

    state.selectedNodeId = "";
    refreshNodeInspector();
  }

  function getSelectedNode() {
    if (!state.selectedNodeId) return null;
    return editor.getNodeFromId(Number(state.selectedNodeId));
  }

  function setNodeButtonsEnabled(enabled) {
    duplicateNodeBtn.disabled = !enabled;
    deleteNodeBtn.disabled = !enabled;
  }

  function nodeIdFromDomId(domId) {
    if (!domId) return "";
    const match = String(domId).match(/^node-(\d+)$/);
    return match ? match[1] : "";
  }

  function removeNodeById(nodeId) {
    if (!nodeId) return;
    const id = String(nodeId);
    delete state.nodeRuntimeById[id];
    try {
      editor.removeNodeId(`node-${nodeId}`);
      return;
    } catch {
      try {
        editor.removeNodeId(Number(nodeId));
      } catch {
        const home = editor?.drawflow?.drawflow?.Home?.data;
        if (home && home[nodeId]) {
          delete home[nodeId];
          editor.load();
        }
      }
    }
  }

  function duplicateSelectedNode() {
    const node = getSelectedNode();
    if (!node) return;

    const cloneId = addNode(node.name, Number(node.pos_x || 180) + 50, Number(node.pos_y || 160) + 40, node.data || {});
    if (cloneId) {
      state.selectedNodeId = String(cloneId);
      refreshNodeInspector();
    }
  }

  function deleteSelectedNode() {
    if (!state.selectedNodeId) return;
    const target = state.selectedNodeId;
    removeNodeById(target);
    state.selectedNodeId = "";
    refreshNodeInspector();
  }

  function requestFocusField(inputEl) {
    if (!inputEl) return;
    state.activeFormField = inputEl;
  }

  function patchSelectedNodeData(mutator) {
    const node = getSelectedNode();
    if (!node) return;

    const next = {
      ...(node.data || {}),
    };

    mutator(next);
    editor.updateNodeDataFromId(Number(state.selectedNodeId), next);
    updateNodeCard(state.selectedNodeId);
    if (nodeJson) {
      nodeJson.value = JSON.stringify(next, null, 2);
    }
  }

  function getInsertTarget() {
    if (state.activeFormField && document.body.contains(state.activeFormField)) {
      return state.activeFormField;
    }

    const fallback = nodeFormAccordions.querySelector("input, textarea");
    if (fallback) {
      state.activeFormField = fallback;
      return fallback;
    }

    return null;
  }

  function insertIntoField(field, text) {
    if (!field || field.tagName === "SELECT") return;

    const start = Number.isFinite(field.selectionStart) ? field.selectionStart : field.value.length;
    const end = Number.isFinite(field.selectionEnd) ? field.selectionEnd : field.value.length;

    field.value = `${field.value.slice(0, start)}${text}${field.value.slice(end)}`;
    const pos = start + text.length;
    if (typeof field.setSelectionRange === "function") {
      field.setSelectionRange(pos, pos);
    }
    field.focus();
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function getDirectSourceNodeIds(node) {
    const ids = new Set();
    const inputs = node?.inputs || {};

    for (const inputDef of Object.values(inputs)) {
      const connections = Array.isArray(inputDef?.connections) ? inputDef.connections : [];
      for (const conn of connections) {
        const sourceId = conn?.node ?? conn?.source;
        if (sourceId !== undefined && sourceId !== null) {
          ids.add(String(sourceId));
        }
      }
    }

    return [...ids];
  }

  function collectUpstreamNodes(node, maxDepth = 4) {
    const results = [];
    const queue = getDirectSourceNodeIds(node).map((id) => ({ id, depth: 1 }));
    const seen = new Set(queue.map((q) => q.id));

    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) continue;
      const current = editor.getNodeFromId(Number(item.id));
      if (!current) continue;

      results.push(current);
      if (item.depth >= maxDepth) continue;

      for (const nextId of getDirectSourceNodeIds(current)) {
        if (seen.has(nextId)) continue;
        seen.add(nextId);
        queue.push({ id: nextId, depth: item.depth + 1 });
      }
    }

    return results;
  }

  function pushUniqueHint(hints, expression, from) {
    const clean = String(expression || "").trim();
    if (!clean) return;
    if (hints.some((h) => h.expression === clean)) return;
    hints.push({ expression: clean, from });
  }

  function collectVariableHints(node) {
    const hints = [];

    pushUniqueHint(hints, "input", "runtime");
    pushUniqueHint(hints, "last", "runtime");
    pushUniqueHint(hints, "vars", "runtime");
    pushUniqueHint(hints, "output", "runtime");

    const upstreamNodes = collectUpstreamNodes(node, 4);
    for (const upstream of upstreamNodes) {
      const data = upstream.data || {};

      if (upstream.name === "set_var") {
        pushUniqueHint(hints, `vars.${String(data.varName || "").trim()}`, "set_var");
      }

      if (upstream.name === "for_each") {
        pushUniqueHint(hints, `vars.${String(data.itemVar || "item").trim()}`, "for_each");
        pushUniqueHint(hints, `vars.${String(data.indexVar || "index").trim()}`, "for_each");
      }

      if (upstream.name === "while") {
        pushUniqueHint(hints, "vars.__whileIteration", "while");
      }

      if (upstream.name === "if") {
        pushUniqueHint(hints, "last.passed", "if");
      }

      if (upstream.name === "array_push") {
        pushUniqueHint(hints, `vars.${String(data.arrayVar || "").trim()}`, "array_push");
      }

      if (["http", "openai_structured", "transform", "template", "json_parse", "json_stringify", "delay", "python_script", "typescript_script"].includes(upstream.name)) {
        const key = String(data.storeAs || "").trim();
        if (key) {
          pushUniqueHint(hints, `vars.${key}`, upstream.name);
        }
      }
    }

    return hints;
  }

  function renderVariableHints(node) {
    variableHints.innerHTML = "";
    if (!node) return;

    const hints = collectVariableHints(node);

    const head = document.createElement("div");
    head.className = "hint-head";
    head.textContent = "Connected Variables (click to insert)";
    variableHints.appendChild(head);

    if (hints.length === 0) {
      const empty = document.createElement("div");
      empty.className = "hint-empty";
      empty.textContent = "No upstream variables available yet.";
      variableHints.appendChild(empty);
      return;
    }

    const list = document.createElement("div");
    list.className = "hint-list";

    for (const hint of hints) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "hint-chip";
      chip.textContent = hint.expression;
      chip.title = `from ${hint.from}`;
      chip.addEventListener("click", () => {
        const target = getInsertTarget();
        if (!target) return;
        const mode = target.dataset.insertMode || "expression";
        const snippet = mode === "template" ? `{{${hint.expression}}}` : hint.expression;
        insertIntoField(target, snippet);
      });
      list.appendChild(chip);
    }

    variableHints.appendChild(list);
  }

  function addPresetButtons(fieldInputWrap, field, input) {
    if (!Array.isArray(field.presets) || field.presets.length === 0) return;

    const wrap = document.createElement("div");
    wrap.className = "field-preset-list";

    for (const preset of field.presets) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "field-preset";
      btn.textContent = String(preset).slice(0, 24);
      btn.title = String(preset);
      btn.addEventListener("click", () => {
        input.value = String(preset);
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.focus();
      });
      wrap.appendChild(btn);
    }

    fieldInputWrap.appendChild(wrap);
  }

  function toEditableObject(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return { ...value };
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return {};
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return { ...parsed };
        }
      } catch {
        return {};
      }
    }

    return {};
  }

  function valueToEditorString(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return JSON.stringify(value);
  }

  function parseEditorValue(text) {
    const raw = String(text ?? "");
    const trimmed = raw.trim();
    if (!trimmed) return "";

    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (trimmed === "null") return null;
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("\"") && trimmed.endsWith("\""))
    ) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return raw;
      }
    }

    return raw;
  }

  function createJsonObjectEditor(currentValue, onCommit) {
    const editorWrap = document.createElement("div");
    editorWrap.className = "json-kv-editor";

    const list = document.createElement("div");
    list.className = "json-kv-list";
    editorWrap.appendChild(list);

    const rows = [];
    const initial = toEditableObject(currentValue);
    const initialEntries = Object.entries(initial);

    function commit() {
      const next = {};
      for (const row of rows) {
        const key = String(row.keyInput.value || "").trim();
        if (!key) continue;
        next[key] = parseEditorValue(row.valueInput.value);
      }
      onCommit(next);
    }

    function addRow(key = "", value = "") {
      const rowEl = document.createElement("div");
      rowEl.className = "json-kv-row";

      const keyInput = document.createElement("input");
      keyInput.type = "text";
      keyInput.className = "json-kv-key";
      keyInput.placeholder = "key";
      keyInput.value = key;

      const sep = document.createElement("span");
      sep.className = "json-kv-sep";
      sep.textContent = ":";

      const valueInput = document.createElement("input");
      valueInput.type = "text";
      valueInput.className = "json-kv-value";
      valueInput.placeholder = "value";
      valueInput.value = value;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "json-kv-remove";
      removeBtn.textContent = "Delete";

      const row = {
        rowEl,
        keyInput,
        valueInput,
      };
      rows.push(row);

      keyInput.addEventListener("input", commit);
      valueInput.addEventListener("input", commit);
      removeBtn.addEventListener("click", () => {
        const idx = rows.indexOf(row);
        if (idx >= 0) rows.splice(idx, 1);
        rowEl.remove();
        if (rows.length === 0) {
          addRow("", "");
        }
        commit();
      });

      rowEl.appendChild(keyInput);
      rowEl.appendChild(sep);
      rowEl.appendChild(valueInput);
      rowEl.appendChild(removeBtn);
      list.appendChild(rowEl);
    }

    if (initialEntries.length > 0) {
      for (const [key, value] of initialEntries) {
        addRow(String(key), valueToEditorString(value));
      }
    } else {
      addRow("", "");
    }

    const actions = document.createElement("div");
    actions.className = "json-kv-actions";
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "json-kv-add";
    addBtn.textContent = "Add";
    addBtn.addEventListener("click", () => {
      addRow("", "");
    });

    actions.appendChild(addBtn);
    editorWrap.appendChild(actions);

    return editorWrap;
  }

  function createFieldInput(node, field) {
    const wrapper = document.createElement("div");
    wrapper.className = "form-field";

    const label = document.createElement("label");
    label.textContent = field.label;
    wrapper.appendChild(label);

    const fieldInputWrap = document.createElement("div");
    fieldInputWrap.className = "field-input-wrap";

    const currentValue = (node.data || {})[field.key];
    let input;

    if (field.type === "select") {
      input = document.createElement("select");
      for (const option of field.options || []) {
        const opt = document.createElement("option");
        opt.value = option;
        opt.textContent = option;
        input.appendChild(opt);
      }
      input.value = String(currentValue ?? field.options?.[0] ?? "");
      input.addEventListener("change", () => {
        patchSelectedNodeData((next) => {
          if (field.options?.includes("true") && field.options?.includes("false")) {
            next[field.key] = toBool(input.value);
            return;
          }
          next[field.key] = input.value;
        });
      });
    } else if (field.type === "json") {
      const objectEditor = createJsonObjectEditor(currentValue, (nextObject) => {
        patchSelectedNodeData((next) => {
          next[field.key] = nextObject;
        });
      });
      fieldInputWrap.appendChild(objectEditor);
    } else if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.value = toFormDisplay(currentValue, field.type);
      if (field.placeholder) {
        input.placeholder = field.placeholder;
      }

      input.addEventListener("change", () => {
        patchSelectedNodeData((next) => {
          next[field.key] = input.value;
        });
      });
    } else {
      input = document.createElement("input");
      input.type = field.type === "number" ? "number" : "text";
      input.value = toFormDisplay(currentValue, field.type);
      if (field.placeholder) {
        input.placeholder = field.placeholder;
      }

      input.addEventListener("change", () => {
        if (field.type === "number") {
          if (String(input.value).trim() === "") {
            patchSelectedNodeData((next) => {
              next[field.key] = "";
            });
            return;
          }

          const parsed = Number(input.value);
          patchSelectedNodeData((next) => {
            next[field.key] = Number.isFinite(parsed) ? parsed : 0;
          });
          return;
        }

        patchSelectedNodeData((next) => {
          next[field.key] = input.value;
        });
      });
    }

    if (input && (input.tagName === "INPUT" || input.tagName === "TEXTAREA")) {
      input.dataset.insertMode = field.insertMode || "expression";
      input.addEventListener("focus", () => requestFocusField(input));
      input.addEventListener("click", () => requestFocusField(input));
    }

    if (input) {
      fieldInputWrap.appendChild(input);
    }

    if (field.help) {
      const help = document.createElement("div");
      help.className = "field-help";
      help.textContent = field.help;
      fieldInputWrap.appendChild(help);
    }

    if (field.example) {
      const example = document.createElement("div");
      example.className = "field-example";
      example.textContent = `ex: ${field.example}`;
      fieldInputWrap.appendChild(example);
    }

    if (input) {
      addPresetButtons(fieldInputWrap, field, input);
    }

    wrapper.appendChild(fieldInputWrap);
    return wrapper;
  }

  function renderNodeSummary(node, def) {
    nodeSummary.textContent = "";

    if (!node || !def) {
      const empty = document.createElement("div");
      empty.className = "node-summary-empty";
      empty.textContent = "Select a block to view details and edit settings.";
      nodeSummary.appendChild(empty);
      return;
    }

    const runtime = getNodeRuntime(node.id);
    const groupLabel = groupLabelById(def.group);
    const statusText = runtimeStatusText(runtime.status);
    const runtimeDetail = runtime.detail ? truncateText(runtime.detail, 80) : "-";

    const desc = document.createElement("div");
    desc.className = "summary-desc";
    desc.textContent = def.description || "";

    const grid = document.createElement("div");
    grid.className = "summary-grid";

    const rows = [
      ["Block", def.label || node.name],
      ["Category", groupLabel],
      ["Inputs", String(def.inputs ?? 0)],
      ["Outputs", String(def.outputs ?? 0)],
      ["Status", statusText],
      ["Runtime", runtimeDetail],
    ];

    for (const [label, value] of rows) {
      const item = document.createElement("div");
      item.className = "summary-item";

      const key = document.createElement("span");
      key.className = "k";
      key.textContent = label;

      const val = document.createElement("span");
      val.className = "v";
      val.textContent = value;

      item.appendChild(key);
      item.appendChild(val);
      grid.appendChild(item);
    }

    nodeSummary.appendChild(desc);
    nodeSummary.appendChild(grid);
  }

  function groupFieldsBySection(fields) {
    const map = new Map();
    for (const field of fields) {
      const section = field.section || "General";
      if (!map.has(section)) map.set(section, []);
      map.get(section).push(field);
    }
    return map;
  }

  function renderNodeForm(node) {
    nodeFormAccordions.innerHTML = "";
    nodeFormCustomVars.innerHTML = "";

    const def = NODE_CATALOG[node.name];
    const fields = def?.fields || [];

    if (fields.length === 0) {
      const empty = document.createElement("div");
      empty.className = "node-form-empty";
      empty.textContent = "No standard settings for this block yet.";
      nodeFormAccordions.appendChild(empty);
    }

    if (fields.length > 0) {
      const bySection = groupFieldsBySection(fields);

      for (const [sectionName, sectionFields] of bySection.entries()) {
        const accordion = document.createElement("div");
        accordion.className = "accordion-section open";

        const header = document.createElement("button");
        header.className = "accordion-header";
        header.innerHTML = `<span class="accordion-caret">&#x25B8;</span><span class="accordion-title">${escapeHtml(sectionName)}</span>`;
        accordion.appendChild(header);

        const body = document.createElement("div");
        body.className = "accordion-body";

        const section = document.createElement("section");
        section.className = "form-section";
        section.style.border = "none";
        section.style.background = "none";
        section.style.padding = "0";

        for (const field of sectionFields) {
          section.appendChild(createFieldInput(node, field));
        }

        body.appendChild(section);
        accordion.appendChild(body);
        nodeFormAccordions.appendChild(accordion);
      }
    }

    const customHelp = document.createElement("div");
    customHelp.className = "field-help";
    customHelp.textContent = "Add custom key/value settings for this node.";
    nodeFormCustomVars.appendChild(customHelp);

    const customEditor = createJsonObjectEditor((node.data || {}).customVars || {}, (nextObject) => {
      patchSelectedNodeData((next) => {
        next.customVars = nextObject;
      });
    });
    nodeFormCustomVars.appendChild(customEditor);
  }

  function refreshNodeInspector() {
    const node = getSelectedNode();

    if (!node) {
      inspectorEmpty.style.display = "";
      inspectorForm.style.display = "none";
      nodeTypeTag.textContent = "Pick a block to edit settings";
      nodeFormAccordions.innerHTML = '<div class="node-form-empty">Select a block to start editing.</div>';
      nodeFormCustomVars.innerHTML = "";
      if (nodeJson) {
        nodeJson.value = "";
      }
      variableHints.innerHTML = "";
      inspectorPanel.dataset.nodeType = "";
      state.activeFormField = null;
      setNodeButtonsEnabled(false);
      renderNodeSummary(null, null);
      return;
    }

    inspectorEmpty.style.display = "none";
    inspectorForm.style.display = "";
    const def = NODE_CATALOG[node.name];
    nodeTypeTag.textContent = `${def?.icon || "Node"} · ${groupLabelById(def?.group)}`;
    inspectorPanel.dataset.nodeType = node.name;
    if (nodeJson) {
      nodeJson.value = JSON.stringify(node.data || {}, null, 2);
    }

    setNodeButtonsEnabled(true);
    renderNodeSummary(node, def);
    renderNodeForm(node);
    renderVariableHints(node);
    refreshRuntimeStateDisplay();
  }

  function paletteHoverDefaults(def) {
    return nodePreviewItems(def, def?.data || {}).slice(0, 6);
  }

  function renderPaletteHoverCard(type) {
    if (!paletteHoverCard) return;
    const def = NODE_CATALOG[type];
    if (!def) return;

    const defaults = paletteHoverDefaults(def);
    const defaultRows = defaults.length
      ? defaults
          .map(
            (item) =>
              `<div class="palette-hover-default-row"><span class="k">${escapeHtml(item.key)}</span><span class="v">${escapeHtml(item.value)}</span></div>`,
          )
          .join("")
      : '<div class="palette-hover-empty">No default variables to edit before running.</div>';

    paletteHoverCard.innerHTML = `
      <div class="palette-hover-head">
        <div class="badge" style="background:${def.color || "#5f6f81"}">${escapeHtml(def.icon || "Node")}</div>
        <div class="palette-hover-title-wrap">
          <div class="palette-hover-title">${escapeHtml(def.label || type)}</div>
          <div class="palette-hover-sub">${escapeHtml(groupLabelById(def.group))}</div>
        </div>
        <div class="palette-hover-orbit" aria-hidden="true"></div>
      </div>
      <div class="palette-hover-desc">${escapeHtml(def.description || "No description available.")}</div>
      <div class="palette-hover-stats">
        <div class="palette-hover-stat"><span>Inputs</span><strong>${Number(def.inputs || 0)}</strong></div>
        <div class="palette-hover-stat"><span>Outputs</span><strong>${Number(def.outputs || 0)}</strong></div>
        <div class="palette-hover-stat"><span>Routing</span><strong>${escapeHtml(String(def.ports || "Single"))}</strong></div>
      </div>
      <div class="palette-hover-section">Default settings</div>
      <div class="palette-hover-defaults">${defaultRows}</div>
    `;
  }

  function positionPaletteHoverCard(anchorEl) {
    if (!paletteHoverCard || !anchorEl) return;

    const panelRect = palettePanel.getBoundingClientRect();
    const anchorRect = anchorEl.getBoundingClientRect();
    const hoverWidth = Math.min(360, Math.max(280, Math.floor(window.innerWidth * 0.24)));
    paletteHoverCard.style.width = `${hoverWidth}px`;

    const gap = 12;
    let left = panelRect.right + gap;
    if (left + hoverWidth > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - hoverWidth - 10);
    }

    const hoverHeight = paletteHoverCard.offsetHeight || 320;
    let top = anchorRect.top - 6;
    const maxTop = window.innerHeight - hoverHeight - 10;
    if (top > maxTop) top = maxTop;
    if (top < 52) top = 52;

    paletteHoverCard.style.left = `${Math.round(left)}px`;
    paletteHoverCard.style.top = `${Math.round(top)}px`;
  }

  function hidePaletteHoverCard() {
    if (!paletteHoverCard) return;
    paletteHoverCard.classList.remove("visible");
    paletteHoverCard.setAttribute("aria-hidden", "true");
  }

  function showPaletteHoverCard(type, anchorEl) {
    if (!paletteHoverCard || state.editorMode !== "canvas") return;
    renderPaletteHoverCard(type);
    positionPaletteHoverCard(anchorEl);
    paletteHoverCard.classList.add("visible");
    paletteHoverCard.setAttribute("aria-hidden", "false");
  }

  function refreshCanvasConnections() {
    const nodes = editor?.drawflow?.drawflow?.Home?.data || {};
    for (const nodeId of Object.keys(nodes)) {
      try {
        editor.updateConnectionNodes(`node-${nodeId}`);
      } catch {
        try {
          editor.updateConnectionNodes(nodeId);
        } catch {
          // no-op
        }
      }
    }
  }

  function persistEditorMode() {
    try {
      localStorage.setItem("voyager_editor_mode", state.editorMode);
      localStorage.setItem("voyager_right_collapsed", state.isInspectorCollapsed ? "1" : "0");
    } catch {
      // ignore storage failures
    }
  }

  function setModeViewActive(viewEl, isActive) {
    if (!viewEl) return;
    viewEl.classList.toggle("is-active", isActive);
    viewEl.setAttribute("aria-hidden", isActive ? "false" : "true");
  }

  function switchMode(mode) {
    const resolvedMode = normalizeEditorMode(mode) || "chat";
    state.editorMode = resolvedMode;
    document.body.setAttribute("data-editor-mode", resolvedMode);

    // Toggle tab active states
    for (const tab of modeTabs) {
      const isActive = tab?.dataset?.mode === resolvedMode;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    }
    updateModeIndicator(resolvedMode);
    updateEditorNavModeLinks(resolvedMode);

    // Toggle view active states with CSS transitions
    for (const [viewMode, viewEl] of Object.entries(modeViews)) {
      setModeViewActive(viewEl, viewMode === resolvedMode);
    }

    if (navCanvasControls) {
      const showCanvasControls = resolvedMode === "canvas";
      navCanvasControls.style.display = showCanvasControls ? "flex" : "none";
    }

    // Show/hide chat pill (only in canvas mode)
    if (chatPill) {
      const showPill = resolvedMode === "canvas";
      chatPill.classList.toggle("is-visible", showPill);
      if (!showPill) {
        if (chatPillWindow) chatPillWindow.style.display = "none";
        if (chatPillBtn) chatPillBtn.style.display = "";
      }
    }

    // Apply inspector collapse state in canvas mode
    if (resolvedMode === "canvas") {
      document.body.classList.toggle("right-collapsed", state.isInspectorCollapsed);
      if (toggleInspectorBtn) {
        toggleInspectorBtn.classList.toggle("collapsed", state.isInspectorCollapsed);
        toggleInspectorBtn.title = state.isInspectorCollapsed ? "Expand panel" : "Collapse panel";
      }
    } else {
      document.body.classList.remove("right-collapsed");
    }

    // Load deployment data when entering deploy mode
    if (resolvedMode === "deploy") {
      loadDeployments();
      prefillDeployAgent();
    }

    hidePaletteHoverCard();
    syncModeInLocation(resolvedMode);
    persistEditorMode();

    // Refresh canvas connections after mode switch transition
    if (resolvedMode === "canvas") {
      setTimeout(() => refreshCanvasConnections(), 150);
    }
  }

  function toggleInspectorCollapse() {
    state.isInspectorCollapsed = !state.isInspectorCollapsed;
    document.body.classList.toggle("right-collapsed", state.isInspectorCollapsed);
    if (toggleInspectorBtn) {
      toggleInspectorBtn.classList.toggle("collapsed", state.isInspectorCollapsed);
      toggleInspectorBtn.title = state.isInspectorCollapsed ? "Expand panel" : "Collapse panel";
    }
    hidePaletteHoverCard();
    persistEditorMode();
    setTimeout(() => refreshCanvasConnections(), 130);
  }

  function createBlockCard(type) {
    const def = NODE_CATALOG[type];
    const card = document.createElement("div");
    card.className = "block-item compact";
    card.draggable = true;
    card.tabIndex = 0;
    card.dataset.nodeType = type;
    card.title = nodeHoverInfo(def);
    card.style.setProperty("--block-color", def.color || "#888");

    const desc = truncateText(def.description || "", 60);

    card.innerHTML = `
      <div class="block-icon" style="background:${def.color}">${blockIconHtml(type, def)}</div>
      <div class="block-info">
        <div class="block-label">${escapeHtml(def.label)}</div>
        <div class="block-desc">${escapeHtml(desc)}</div>
      </div>
    `;

    card.addEventListener("click", () => {
      addNodeNearCanvasCenter(type);
    });

    card.addEventListener("mouseenter", () => {
      showPaletteHoverCard(type, card);
    });

    card.addEventListener("mousemove", () => {
      positionPaletteHoverCard(card);
    });

    card.addEventListener("mouseleave", () => {
      hidePaletteHoverCard();
    });

    card.addEventListener("focus", () => {
      showPaletteHoverCard(type, card);
    });

    card.addEventListener("blur", () => {
      hidePaletteHoverCard();
    });

    card.addEventListener("dragstart", (event) => {
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("application/node-type", type);
      hidePaletteHoverCard();
    });

    return card;
  }

  function matchesQuery(def, query) {
    if (!query) return true;
    const haystack = `${def.label} ${def.icon} ${def.meta} ${groupLabelById(def.group)} ${def.description}`.toLowerCase();
    return haystack.includes(query);
  }

  function renderPalette() {
    paletteSections.innerHTML = "";
    hidePaletteHoverCard();

    const query = String(state.paletteQuery || "").trim().toLowerCase();
    let totalMatches = 0;

    for (const group of NODE_GROUPS) {
      const wrap = document.createElement("section");
      wrap.className = "palette-group";

      const matchedTypes = [];
      for (const type of group.types || []) {
        const def = NODE_CATALOG[type];
        if (!def) continue;
        if (!matchesQuery(def, query)) continue;
        matchedTypes.push(type);
      }

      totalMatches += matchedTypes.length;

      const collapsed = Boolean(state.collapsedGroups[group.id]);
      if (collapsed) {
        wrap.classList.add("collapsed");
      }

      const headBtn = document.createElement("button");
      headBtn.type = "button";
      headBtn.className = "palette-group-head-btn";
      headBtn.innerHTML = `
        <svg class="palette-group-caret" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        <span class="palette-group-label">${group.label}</span>
        <span class="palette-group-count">${matchedTypes.length}</span>
      `;
      headBtn.addEventListener("click", () => {
        state.collapsedGroups[group.id] = !collapsed;
        renderPalette();
      });
      wrap.appendChild(headBtn);

      const itemsWrap = document.createElement("div");
      itemsWrap.className = "palette-group-items";

      if (matchedTypes.length === 0) {
        const empty = document.createElement("div");
        empty.className = "palette-group-empty";
        empty.textContent = query ? "No matching blocks" : "No blocks";
        itemsWrap.appendChild(empty);
      } else {
        for (const type of matchedTypes) {
          itemsWrap.appendChild(createBlockCard(type));
        }
      }

      wrap.appendChild(itemsWrap);

      paletteSections.appendChild(wrap);
    }

    if (totalMatches === 0) {
      const msg = document.createElement("div");
      msg.className = "palette-group-empty";
      msg.textContent = "No blocks found for this query.";
      paletteSections.appendChild(msg);
    }
  }

  function pointInside(el, x, y) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function clearDiscardHover() {}

  function updateDiscardHover(x, y) {}

  function resetCanvasNodeDragging() {
    state.dragCandidateNodeId = "";
    state.draggingCanvasNodeId = "";
    state.dragStart = null;
    clearDiscardHover();
  }

  function attachDiscardDragBehavior() {
    drawflowEl.addEventListener("mousedown", (event) => {
      const nodeEl = event.target.closest(".drawflow-node");
      if (!nodeEl) return;

      const nodeId = nodeIdFromDomId(nodeEl.id);
      if (!nodeId) return;

      state.dragCandidateNodeId = nodeId;
      state.dragStart = {
        x: event.clientX,
        y: event.clientY,
      };
      state.draggingCanvasNodeId = "";
    });

    document.addEventListener("mousemove", (event) => {
      if (!state.dragCandidateNodeId || !state.dragStart) return;

      const dist = Math.hypot(event.clientX - state.dragStart.x, event.clientY - state.dragStart.y);
      if (!state.draggingCanvasNodeId && dist > 5) {
        state.draggingCanvasNodeId = state.dragCandidateNodeId;
      }

      if (state.draggingCanvasNodeId) {
        updateDiscardHover(event.clientX, event.clientY);
      }
    });

    document.addEventListener("mouseup", (event) => {
      if (!state.draggingCanvasNodeId) {
        resetCanvasNodeDragging();
        return;
      }

      const shouldDiscard = pointInside(palettePanel, event.clientX, event.clientY);
      if (shouldDiscard) {
        const removingSelected = state.selectedNodeId === state.draggingCanvasNodeId;
        removeNodeById(state.draggingCanvasNodeId);
        if (removingSelected) {
          state.selectedNodeId = "";
        }
        refreshNodeInspector();
      }

      resetCanvasNodeDragging();
    });
  }

  function bindCanvasDropFromPalette() {
    drawflowEl.addEventListener("dragover", (event) => {
      event.preventDefault();
      drawflowEl.classList.add("drag-over");
    });

    drawflowEl.addEventListener("dragleave", () => {
      drawflowEl.classList.remove("drag-over");
    });

    drawflowEl.addEventListener("drop", (event) => {
      event.preventDefault();
      drawflowEl.classList.remove("drag-over");

      const type = event.dataTransfer.getData("application/node-type");
      if (!type || !NODE_CATALOG[type]) return;

      const point = canvasPositionFromClient(event.clientX, event.clientY);
      addNode(type, point.x, point.y);
    });
  }

  function listLocalFlows() {
    return readJsonArrayFromLocalStorage(STORAGE_KEYS.localFlows).sort((a, b) =>
      String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")),
    );
  }

  function saveLocalFlowRecord(record) {
    const rows = listLocalFlows();
    const idx = rows.findIndex((item) => item.id === record.id);
    if (idx >= 0) {
      rows[idx] = record;
    } else {
      rows.unshift(record);
    }
    writeJsonArrayToLocalStorage(STORAGE_KEYS.localFlows, rows.slice(0, 300));
  }

  function getLocalFlowById(id) {
    return listLocalFlows().find((item) => item.id === id) || null;
  }

  function deleteLocalFlowById(id) {
    const rows = listLocalFlows().filter((item) => item.id !== id);
    writeJsonArrayToLocalStorage(STORAGE_KEYS.localFlows, rows);
  }

  async function refreshFlowList() {
    const flows = listLocalFlows();
    const current = state.currentFlowId || flowSelect.value;

    flowSelect.innerHTML = "";

    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "(new unsaved flow)";
    flowSelect.appendChild(emptyOpt);

    for (const flow of flows) {
      const opt = document.createElement("option");
      opt.value = flow.id;
      opt.textContent = `${flow.name} (${new Date(flow.updatedAt).toLocaleString()})`;
      flowSelect.appendChild(opt);
    }

    if (current && flows.some((f) => f.id === current)) {
      flowSelect.value = current;
    } else {
      flowSelect.value = "";
    }
  }

  async function loadFlow(flowId) {
    const flow = getLocalFlowById(flowId);
    if (!flow) {
      throw new Error("Flow not found.");
    }

    clearEditor();
    editor.import(flow.drawflow);
    resetNodeRuntime();

    state.currentFlowId = flow.id;
    flowNameInput.value = flow.name;
    flowSelect.value = flow.id;
    state.selectedNodeId = "";
    refreshNodeInspector();
  }

  async function saveFlow() {
    const name = (flowNameInput.value || "Untitled Flow").trim() || "Untitled Flow";

    const payload = {
      name,
      drawflow: editor ? editor.export() : {},
    };

    const now = new Date().toISOString();
    const flow = {
      id: state.currentFlowId || `flow_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      name: payload.name,
      drawflow: payload.drawflow,
      createdAt: now,
      updatedAt: now,
    };
    const existing = getLocalFlowById(flow.id);
    if (existing) {
      flow.createdAt = existing.createdAt || now;
    }
    saveLocalFlowRecord(flow);

    state.currentFlowId = flow.id;
    flowNameInput.value = flow.name;
    await refreshFlowList();
    flowSelect.value = flow.id;

    return flow;
  }

  async function deleteCurrentFlow() {
    if (!state.currentFlowId) return;

    deleteLocalFlowById(state.currentFlowId);

    state.currentFlowId = "";
    flowNameInput.value = "Untitled Flow";
    createStarterFlow();
    await refreshFlowList();
  }

  function buildFlowExportPayload() {
    const name = (flowNameInput?.value || "Untitled Flow").trim() || "Untitled Flow";
    return {
      id: state.currentFlowId || "",
      name,
      drawflow: editor ? editor.export() : {},
      exportedAt: new Date().toISOString(),
      version: 1,
    };
  }

  function sanitizeFileBasename(value, fallback = "flow") {
    const normalized = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    return normalized || fallback;
  }

  function normalizeImportedDrawflow(payload) {
    if (!payload || typeof payload !== "object") return null;
    if (payload.drawflow && payload.drawflow.drawflow) {
      return payload.drawflow;
    }
    if (payload.drawflow && payload.drawflow.Home && payload.drawflow.Home.data) {
      return { drawflow: payload.drawflow };
    }
    if (payload.Home && payload.Home.data) {
      return { drawflow: payload };
    }
    return null;
  }

  async function exportFlowToLocalFile() {
    try {
      const snapshot = buildFlowExportPayload();
      const base = sanitizeFileBasename(snapshot.name, "flow");
      const filename = `${base}.flow.json`;
      downloadTextFile(filename, JSON.stringify(snapshot, null, 2));
      if (runStatus) {
        runStatus.textContent = `Flow exported to ${filename}.`;
      }
      if (typeof CANARIAToast !== "undefined") {
        CANARIAToast.success({ title: "Flow exported", message: filename });
      }
    } catch (error) {
      if (runStatus) {
        runStatus.textContent = `Export error: ${error.message}`;
      }
      if (typeof CANARIAToast !== "undefined") {
        CANARIAToast.error({ title: "Export failed", message: error.message || "Could not export flow file." });
      }
    }
  }

  async function importFlowFromLocalFile(file) {
    const selectedFile = file || flowImportInput?.files?.[0];
    if (!selectedFile) return;
    const text = await selectedFile.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON file.");
    }
    const drawflow = normalizeImportedDrawflow(payload);
    if (!drawflow) {
      throw new Error("File does not contain a valid Drawflow export.");
    }

    const now = new Date().toISOString();
    const id = String(payload.id || `flow_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`);
    const name = String(payload.name || selectedFile.name.replace(/\.json$/i, "") || "Imported Flow").trim() || "Imported Flow";

    clearEditor();
    editor.import(drawflow);
    resetNodeRuntime();
    refreshAllNodeCards();

    const existing = getLocalFlowById(id);
    const record = {
      id,
      name,
      drawflow,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    saveLocalFlowRecord(record);

    state.currentFlowId = record.id;
    flowNameInput.value = record.name;
    state.selectedNodeId = "";
    refreshNodeInspector();
    await refreshFlowList();
    if (flowSelect) flowSelect.value = record.id;

    if (runStatus) {
      runStatus.textContent = `Imported flow "${record.name}".`;
    }
    if (typeof CANARIAToast !== "undefined") {
      CANARIAToast.success({ title: "Flow imported", message: record.name });
    }
  }

  function clearRunRuntimeState() {
    if (state.pullTimer) {
      clearTimeout(state.pullTimer);
    }
    state.pullTimer = null;
    state.currentRunId = "";
    state.cursor = 0;
    state.pullToken = 0;
    state.wsSubscribedRunId = "";
    state.seenEventIds = new Set();
    if (state.ws && typeof state.ws.close === "function") {
      try {
        state.ws.close();
      } catch {
        // Ignore close failures.
      }
    }
    state.ws = null;
  }

  async function runCurrentFlow() {
    try {
      clearRunRuntimeState();
      if (eventsPane) {
        eventsPane.textContent = "";
      }
      resetNodeRuntime();

      let parsedInput = {};
      const raw = runInput.value.trim();
      if (raw) {
        parsedInput = JSON.parse(raw);
      }
      if (!state.currentFlowId) {
        await saveFlow();
      }
      const inputSummary = Object.keys(parsedInput || {}).length
        ? `Input keys: ${Object.keys(parsedInput).join(", ")}.`
        : "No input payload provided.";
      runStatus.textContent =
        `Static mode: local execution API is disabled. ${inputSummary} ` +
        "Deploy the generated target (Cloudflare/GitHub) to execute runtime requests.";
    } catch (error) {
      runStatus.textContent = `Run error: ${error.message}`;
    }
  }

  function isTextEntryTarget(target) {
    if (!target) return false;
    const tag = String(target.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
  }

  function isStarterFlow() {
    const nodes = editor?.drawflow?.drawflow?.Home?.data || {};
    const entries = Object.values(nodes);
    if (entries.length !== 2) return false;
    const types = entries.map((n) => n.name).sort();
    return types[0] === "end" && types[1] === "start";
  }

  function showGenerateOverlay() {
    generateOverlay.style.display = "";
    generateError.style.display = "none";
    generateError.textContent = "";
    generatePrompt.value = "";
    generatePrompt.focus();
  }

  function hideGenerateOverlay() {
    generateOverlay.style.display = "none";
  }

  function setGenerateLoading(loading) {
    const btnText = generateFlowBtn.querySelector(".generate-btn-text");
    const btnLoading = generateFlowBtn.querySelector(".generate-btn-loading");
    if (loading) {
      btnText.style.display = "none";
      btnLoading.style.display = "";
      generateFlowBtn.disabled = true;
      generatePrompt.disabled = true;
    } else {
      btnText.style.display = "";
      btnLoading.style.display = "none";
      generateFlowBtn.disabled = false;
      generatePrompt.disabled = false;
    }
  }

  function makeFallbackGeneratedFlow(prompt) {
    const label = truncateText(prompt || "Generated Agent", 42) || "Generated Agent";
    return {
      name: label,
      drawflow: {
        drawflow: {
          Home: {
            data: {
              "1": {
                id: 1,
                name: "start",
                data: {},
                inputs: {},
                outputs: {
                  output_1: { connections: [{ node: "2", output: "input_1" }] },
                },
              },
              "2": {
                id: 2,
                name: "template",
                data: {
                  template: `Prompt: ${prompt}\nInput: {{json input}}`,
                  parseJson: false,
                  storeAs: "generatedOutput",
                },
                inputs: {
                  input_1: { connections: [{ node: "1", input: "output_1" }] },
                },
                outputs: {
                  output_1: { connections: [{ node: "3", output: "input_1" }] },
                },
              },
              "3": {
                id: 3,
                name: "end",
                data: { returnExpr: "last" },
                inputs: {
                  input_1: { connections: [{ node: "2", input: "output_1" }] },
                },
                outputs: {},
              },
            },
          },
        },
      },
    };
  }

  function extractJsonObjectFromText(text) {
    if (typeof text !== "string") return null;
    const trimmed = text.trim();
    if (!trimmed) return null;

    try {
      return JSON.parse(trimmed);
    } catch {
      // Continue and try fenced/raw JSON extraction.
    }

    const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      try {
        return JSON.parse(fencedMatch[1].trim());
      } catch {
        // Continue with brace extraction.
      }
    }

    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const maybeJson = trimmed.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(maybeJson);
      } catch {
        return null;
      }
    }

    return null;
  }

  function normalizeGeneratedPayload(payload, prompt) {
    if (payload && payload.drawflow && payload.drawflow.drawflow) {
      return {
        name: String(payload.name || "Generated Flow"),
        drawflow: payload.drawflow,
      };
    }
    return makeFallbackGeneratedFlow(prompt);
  }

  function summarizeGeneratedBlocks(drawflow) {
    const data = drawflow?.drawflow?.Home?.data;
    if (!data || typeof data !== "object") {
      return {
        nodeCount: 0,
        topTypes: "",
      };
    }

    const rows = Object.values(data);
    const counts = {};
    for (const node of rows) {
      const type = String(node?.name || "unknown");
      counts[type] = Number(counts[type] || 0) + 1;
    }

    const topTypes = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => `${type} x${count}`)
      .join(", ");

    return {
      nodeCount: rows.length,
      topTypes,
    };
  }

  function generationSummaryText(flowPayload) {
    const summary = summarizeGeneratedBlocks(flowPayload?.drawflow || {});
    const parts = [];
    parts.push(`Flow "${flowPayload?.name || "Untitled"}" generated.`);
    parts.push(`Blocks: ${summary.nodeCount}.`);
    if (summary.topTypes) {
      parts.push(`Top blocks: ${summary.topTypes}.`);
    }
    parts.push("Open Canvas mode to refine blocks, provider routing, and deploy target.");
    return parts.join(" ");
  }

  async function generateFlowViaLlm(prompt) {
    const cfg = getLlmConfig();
    if (!cfg.endpoint || !cfg.apiKey || !cfg.model) {
      throw new Error("LLM provider is not configured. Configure endpoint, API key, and model in Deploy.");
    }

    const endpoint = cfg.endpoint.trim();
    const isHttps = endpoint.startsWith("https://");
    const isHttpLocalhost = endpoint.startsWith("http://localhost") || endpoint.startsWith("http://127.0.0.1");
    if (!isHttps && !isHttpLocalhost) {
      throw new Error("LLM endpoint must use HTTPS (or localhost for local development).");
    }

    const systemPrompt = [
      "You are an expert workflow planner for a block-based agent IDE.",
      "Return strict JSON with keys: name (string), drawflow (Drawflow export object).",
      "Allowed node names: start,end,http,openai_structured,if,while,for_each,transform,set_var,log,delay,json_parse,json_stringify,array_push,template,assert,python_script,typescript_script.",
      "The flow must include at least one start and one end node and valid output/input connections.",
      "Do not include markdown fences.",
    ].join(" ");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: buildLlmRequestHeaders(cfg),
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const detail = data?.error?.message || data?.error || `Request failed (${response.status})`;
      throw new Error(String(detail));
    }

    let rawContent = data?.choices?.[0]?.message?.content;
    if (Array.isArray(rawContent)) {
      rawContent = rawContent
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item.text === "string") return item.text;
          if (item && typeof item.content === "string") return item.content;
          return "";
        })
        .join("\n")
        .trim();
    }
    const parsed = extractJsonObjectFromText(rawContent);
    if (!parsed) {
      throw new Error("LLM returned invalid JSON flow payload.");
    }

    return normalizeGeneratedPayload(parsed, prompt);
  }

  async function generateFlowPayload(prompt) {
    const generated = await generateFlowViaLlm(prompt);
    return generated;
  }

  function applyGeneratedFlow(data) {
    clearEditor();
    editor.import(data.drawflow);
    resetNodeRuntime();
    refreshAllNodeCards();

    if (data.name) {
      flowNameInput.value = data.name;
    }

    state.currentFlowId = "";
    state.selectedNodeId = "";
    refreshNodeInspector();
  }

  async function generateFlow(prompt) {
    if (!prompt.trim()) return;

    setGenerateLoading(true);
    generateError.style.display = "none";

    try {
      const data = await generateFlowPayload(prompt);
      applyGeneratedFlow(data);
      hideGenerateOverlay();
      runStatus.textContent = "Flow generated from prompt.";
    } catch (error) {
      generateError.textContent = error.message || "Generation failed.";
      generateError.style.display = "";
    } finally {
      setGenerateLoading(false);
    }
  }

  /* ===== Mode Tab Switching ===== */

  function bindModeTabEvents() {
    if (modeChatTab) {
      modeChatTab.addEventListener("click", () => switchMode("chat"));
    }
    if (modeCanvasTab) {
      modeCanvasTab.addEventListener("click", () => switchMode("canvas"));
    }
    if (modeDeployTab) {
      modeDeployTab.addEventListener("click", () => switchMode("deploy"));
    }
    if (modeSettingsTab) {
      modeSettingsTab.addEventListener("click", () => switchMode("settings"));
    }
  }

  function bindEditorNavModeEvents() {
    for (const link of editorNavModeLinks) {
      const mode = normalizeEditorMode(link.dataset.editorNavMode);
      if (!mode) continue;
      link.addEventListener("click", (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
        event.preventDefault();
        switchMode(mode);
      });
    }
  }

  /* ===== Welcome Chips ===== */

  function bindWelcomeChipEvents() {
    const chips = document.querySelectorAll(".welcome-chip");
    for (const chip of chips) {
      chip.addEventListener("click", () => {
        const prompt = chip.dataset.prompt;
        if (prompt && buildChatInput) {
          buildChatInput.value = prompt;
          sendBuildChatMessage();
        }
      });
    }
  }

  /* ===== Chat Pill ===== */

  function bindPillEvents() {
    const isPillExpanded = () => Boolean(chatPillWindow && chatPillWindow.style.display !== "none");

    if (chatPillBtn) {
      chatPillBtn.addEventListener("click", () => {
        const nextExpanded = !isPillExpanded();
        if (chatPillWindow) chatPillWindow.style.display = nextExpanded ? "" : "none";
        if (chatPillBtn) chatPillBtn.style.display = nextExpanded ? "none" : "";
      });
    }

    if (chatPillMinimize) {
      chatPillMinimize.addEventListener("click", () => {
        if (chatPillWindow) chatPillWindow.style.display = "none";
        if (chatPillBtn) chatPillBtn.style.display = "";
      });
    }

    // Pill chat send - mirrors build chat logic for canvas context
    if (pillChatSend) {
      pillChatSend.addEventListener("click", () => sendPillChatMessage());
    }
    if (pillChatInput) {
      pillChatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendPillChatMessage();
        }
      });
    }

    // Pill drag behavior
    if (chatPill) {
      let isDragging = false;
      let startX = 0, startY = 0, startLeft = 0, startBottom = 0;

      const header = document.getElementById("chatPillHeader");
      if (header) {
        header.addEventListener("mousedown", (e) => {
          if (e.target.closest("button")) return;
          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;
          const rect = chatPill.getBoundingClientRect();
          startLeft = rect.left;
          startBottom = window.innerHeight - rect.bottom;
          chatPill.style.transition = "none";
          e.preventDefault();
        });
      }

      document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = startY - e.clientY;
        chatPill.style.left = (startLeft + dx) + "px";
        chatPill.style.bottom = (startBottom + dy) + "px";
        chatPill.style.right = "auto";
      });

      document.addEventListener("mouseup", () => {
        if (isDragging) {
          isDragging = false;
          chatPill.style.transition = "";
        }
      });
    }
  }

  function appendPillChatMessage(role, content) {
    if (!pillChatMessages) return;
    const empty = pillChatMessages.querySelector(".chat-pill-empty");
    if (empty) empty.remove();

    const msg = document.createElement("div");
    msg.className = `chat-pill-msg ${role}`;
    msg.textContent = content;
    pillChatMessages.appendChild(msg);
    pillChatMessages.scrollTop = pillChatMessages.scrollHeight;
  }

  async function sendPillChatMessage() {
    if (!pillChatInput) return;
    const text = pillChatInput.value.trim();
    if (!text) return;

    appendPillChatMessage("user", text);
    pillChatInput.value = "";

    try {
      const data = await generateFlowPayload(text);
      applyGeneratedFlow(data);
      appendPillChatMessage("assistant", generationSummaryText(data));
    } catch (error) {
      appendPillChatMessage("assistant", `Error: ${error.message}`);
    }
  }

  /* ===== Build Chat (generate agent from prompt) ===== */

  function appendBuildChatMessage(role, content) {
    if (!buildChatMessages) return;

    // Hide welcome state on first message
    if (chatWelcome) chatWelcome.style.display = "none";

    const avatarLabel = role === "user" ? "You" : "AI";
    const avatarClass = role === "user" ? "chat-msg-avatar user" : "chat-msg-avatar assistant";

    const msg = document.createElement("div");
    msg.className = `chat-msg ${role}`;
    msg.innerHTML = `
      <div class="${avatarClass}">${avatarLabel[0]}</div>
      <div class="chat-msg-body">
        <span class="chat-msg-role">${avatarLabel}</span>
        <div class="chat-msg-content">${escapeHtml(content)}</div>
      </div>
    `;
    buildChatMessages.appendChild(msg);

    // Scroll to bottom
    if (chatFullScroll) chatFullScroll.scrollTop = chatFullScroll.scrollHeight;
  }

  async function sendBuildChatMessage() {
    if (!buildChatInput) return;
    const text = buildChatInput.value.trim();
    if (!text) return;

    appendBuildChatMessage("user", text);
    buildChatInput.value = "";

    // Auto-resize textarea back
    buildChatInput.style.height = "auto";

    try {
      const data = await generateFlowPayload(text);
      applyGeneratedFlow(data);
      appendBuildChatMessage("assistant", generationSummaryText(data));
      runStatus.textContent = "Flow generated from chat.";

      // Auto-switch to canvas after generation
      setTimeout(() => switchMode("canvas"), 800);
    } catch (error) {
      appendBuildChatMessage("assistant", `Error: ${error.message}`);
    }
  }

  function bindBuildChatEvents() {
    if (buildChatSend) {
      buildChatSend.addEventListener("click", () => sendBuildChatMessage());
    }
    if (buildChatInput) {
      buildChatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendBuildChatMessage();
        }
      });
      // Auto-resize textarea
      buildChatInput.addEventListener("input", () => {
        buildChatInput.style.height = "auto";
        buildChatInput.style.height = Math.min(buildChatInput.scrollHeight, 160) + "px";
      });
    }
  }

  /* ===== Test Chat (chat with deployed agent) ===== */

  async function loadEditorChatAgents() {
    const select = document.getElementById("editorAgentSelect");
    if (!select) return;

    const agents = readJsonArrayFromLocalStorage(STORAGE_KEYS.localAgents).sort((a, b) =>
      String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")),
    );
    select.innerHTML = '<option value="">Select agent...</option>';
    for (const agent of agents) {
      const opt = document.createElement("option");
      opt.value = agent.id;
      opt.textContent = agent.name || agent.id;
      select.appendChild(opt);
    }
  }

  function appendEditorChatMessage(role, content) {
    const messages = document.getElementById("editorChatMessages");
    if (!messages) return;

    const emptyEl = messages.querySelector(".editor-chat-empty");
    if (emptyEl) emptyEl.remove();

    const msg = document.createElement("div");
    msg.className = `editor-chat-msg ${role}`;
    msg.textContent = content;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  async function sendEditorChatMessage() {
    const input = document.getElementById("editorChatInput");
    const select = document.getElementById("editorAgentSelect");
    if (!input || !select) return;

    const agentId = select.value;
    const text = input.value.trim();
    if (!text || !agentId) return;

    appendEditorChatMessage("user", text);
    input.value = "";

    try {
      const agent = readJsonArrayFromLocalStorage(STORAGE_KEYS.localAgents).find((item) => item.id === agentId);
      const cfg = getLlmConfig();

      if (!cfg.endpoint || !cfg.apiKey || !cfg.model) {
        throw new Error("LLM endpoint/model/key is required in Deploy settings.");
      }

      const endpoint = cfg.endpoint.trim();
      const isHttps = endpoint.startsWith("https://");
      const isLocalHttp = endpoint.startsWith("http://localhost") || endpoint.startsWith("http://127.0.0.1");
      if (!isHttps && !isLocalHttp) {
        throw new Error("LLM endpoint must use HTTPS (or localhost for development).");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: buildLlmRequestHeaders(cfg),
        body: JSON.stringify({
          model: cfg.model,
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "You are a concise assistant helping users validate and troubleshoot their deployed browser-generated agent workers.",
            },
            {
              role: "user",
              content: JSON.stringify(
                {
                  agent: agent
                    ? {
                        id: agent.id,
                        name: agent.name || "",
                        description: agent.description || "",
                      }
                    : { id: agentId },
                  prompt: text,
                },
                null,
                2,
              ),
            },
          ],
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = data?.error?.message || data?.error || `LLM request failed (${response.status})`;
        throw new Error(String(detail));
      }

      let reply = data?.choices?.[0]?.message?.content;
      if (Array.isArray(reply)) {
        reply = reply
          .map((chunk) => {
            if (typeof chunk === "string") return chunk;
            if (chunk && typeof chunk.text === "string") return chunk.text;
            if (chunk && typeof chunk.content === "string") return chunk.content;
            return "";
          })
          .join("\n")
          .trim();
      }
      if (!reply) {
        reply = JSON.stringify(data);
      }
      appendEditorChatMessage("assistant", typeof reply === "string" ? reply : JSON.stringify(reply));
    } catch (error) {
      appendEditorChatMessage("assistant", `Error: ${error.message}`);
    }
  }

  function bindEditorChatEvents() {
    const sendBtn = document.getElementById("editorChatSend");
    const chatInput = document.getElementById("editorChatInput");

    if (sendBtn) {
      sendBtn.addEventListener("click", () => sendEditorChatMessage());
    }
    if (chatInput) {
      chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendEditorChatMessage();
        }
      });
    }
  }

  /* ===== Deploy ===== */

  function prefillDeployAgent() {
    const nameInput = document.getElementById("deployAgentName");
    if (nameInput && flowNameInput && flowNameInput.value) {
      nameInput.value = flowNameInput.value;
    }
  }

  async function loadDeployments() {
    if (!deployLogList) return;
    const deps = readJsonArrayFromLocalStorage(STORAGE_KEYS.localDeployments).sort((a, b) => {
      return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    });

    if (!Array.isArray(deps) || deps.length === 0) {
      deployLogList.innerHTML = '<div class="deploy-log-empty">No deployments yet.</div>';
      return;
    }

    deployLogList.innerHTML = deps
      .map((d) => {
        const safeUrl = normalizeSafeExternalUrl(d.url);
        const link = safeUrl
          ? `<div class="deploy-log-item-meta"><a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(safeUrl)}</a></div>`
          : "";

        return `
        <div class="deploy-log-item">
          <div class="deploy-log-item-name">${escapeHtml(d.name || d.id || "Unnamed")}</div>
          <div class="deploy-log-item-meta">${escapeHtml(d.target || d.type || "")} &middot; ${escapeHtml(d.status || "unknown")} &middot; ${escapeHtml(d.updatedAt || "")}</div>
          ${link}
        </div>
      `;
      })
      .join("");
  }

  function appendDeploymentLog(entry) {
    const rows = readJsonArrayFromLocalStorage(STORAGE_KEYS.localDeployments);
    rows.unshift({
      id: entry.id || `deploy_${Date.now().toString(36)}`,
      name: entry.name || "Unnamed",
      target: entry.target || "unknown",
      status: entry.status || "generated",
      updatedAt: entry.updatedAt || new Date().toISOString(),
      url: normalizeSafeExternalUrl(entry.url || ""),
    });
    writeJsonArrayToLocalStorage(STORAGE_KEYS.localDeployments, rows.slice(0, 100));
  }

  async function saveAsAgent() {
    const nameInput = document.getElementById("deployAgentName");
    const descInput = document.getElementById("deployAgentDesc");
    const name = nameInput ? nameInput.value.trim() : "";
    const description = descInput ? descInput.value.trim() : "";
    if (!name) {
      if (deployStatus) { deployStatus.textContent = "Agent name is required."; deployStatus.className = "deploy-status error"; }
      return;
    }
    if (deployStatus) { deployStatus.textContent = "Saving..."; deployStatus.className = "deploy-status"; }
    try {
      const drawflowData = editor ? editor.export() : {};
      const deployTarget = String(document.getElementById("deployCfTarget")?.value || "cloudflare_workers_elysia_bun").trim();
      const endpointMode = normalizeEndpointMode(
        deployEndpointModeInput?.value || readLocal(STORAGE_KEYS.deployEndpointMode) || "both",
      );
      const llmConfig = getLlmConfig();
      const agents = readJsonArrayFromLocalStorage(STORAGE_KEYS.localAgents);
      const agent = {
        id: `agent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        description,
        flow: drawflowData,
        llm: {
          providerId: llmConfig.providerId || "",
          providerName: llmConfig.providerName || "",
          endpoint: llmConfig.endpoint || "",
          model: llmConfig.model || "",
        },
        deploy: {
          preferredTarget: deployTarget,
          preferredEndpointMode: endpointMode,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      agents.unshift(agent);
      writeJsonArrayToLocalStorage(STORAGE_KEYS.localAgents, agents.slice(0, 200));
      if (deployStatus) { deployStatus.textContent = `Agent "${name}" saved locally (${agent.id}).`; deployStatus.className = "deploy-status success"; }
      if (typeof CANARIAToast !== "undefined") {
        CANARIAToast.success({ title: "Saved locally", message: `${name} is ready for deploy.` });
      }
    } catch (error) {
      if (deployStatus) { deployStatus.textContent = `Error: ${error.message}`; deployStatus.className = "deploy-status error"; }
    }
  }

  function setConnectionBadge(el, connected, label) {
    if (!el) return;
    el.classList.remove("badge-warning", "badge-success");
    if (connected) {
      el.classList.add("badge-success");
      el.textContent = label || "Connected";
    } else {
      el.classList.add("badge-warning");
      el.textContent = "Disconnected";
    }
  }

  function refreshDeployConnectionState() {
    const hasGh = Boolean(getGithubToken());
    const hasCf = Boolean(getCloudflareToken());
    const hasVercel = Boolean(getVercelToken());
    const accountId = getCloudflareAccountId();
    const targetId = getSelectedDeployTarget();
    const targetDef = getDeployTargetDefinition(targetId);
    const targetPlatform = String(targetDef?.platform || "").trim();

    setConnectionBadge(githubConnectionState, hasGh, "Connected");
    setConnectionBadge(cloudflareConnectionState, hasCf, accountId ? "Connected" : "Connected (set account)");

    const cfMissing = document.getElementById("deployCfMissing");
    const cfMissingText = document.getElementById("deployCfMissingText");
    if (cfMissing) {
      let message = "";
      if (targetPlatform === "cloudflare" && !(hasCf && accountId)) {
        message = "Set Cloudflare token and account id in Settings to deploy directly.";
      } else if (targetPlatform === "vercel" && !hasVercel) {
        message = "Set a Vercel token in Settings to deploy directly.";
      }
      cfMissing.style.display = message ? "" : "none";
      if (message && cfMissingText) {
        cfMissingText.textContent = message;
      }
    }

    const ghMissing = document.getElementById("deployGhMissing");
    if (ghMissing) {
      ghMissing.style.display = hasGh ? "none" : "";
    }
  }

  async function validateGithubToken(token) {
    const res = await withRequestTimeout((signal) =>
      fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
        signal,
      }),
    );
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.login) {
      throw new Error(data?.message || `GitHub validation failed (${res.status})`);
    }
    return data.login;
  }

  async function validateCloudflareToken(token) {
    const url = "https://api.cloudflare.com/client/v4/user/tokens/verify";
    const { response, data } = await cloudflareApiRequest(url, token, { method: "GET" });
    if (!response.ok || !data?.success) {
      throw new Error(extractCloudflareErrorMessage(data, response.status));
    }
    return true;
  }

  async function connectGithub() {
    const token = window.prompt("Paste a GitHub OAuth access token (repo scope).");
    if (!token) return;
    const trimmed = token.trim();
    if (!trimmed) return;

    try {
      const login = await validateGithubToken(trimmed);
      writeSession(STORAGE_KEYS.oauthGithubToken, trimmed);
      if (typeof CANARIAToast !== "undefined") {
        CANARIAToast.success({ title: "GitHub connected", message: `Signed in as ${login}` });
      }
      refreshDeployConnectionState();
      updateAuthUiNavSignals();
      await loadGithubRepos();
    } catch (error) {
      if (typeof CANARIAToast !== "undefined") {
        CANARIAToast.error({ title: "GitHub connect failed", message: error.message || "Token rejected." });
      }
    }
  }

  async function connectCloudflare() {
    const token = window.prompt("Paste a Cloudflare OAuth access token with Workers edit permission.");
    if (!token) return;
    const trimmed = token.trim();
    if (!trimmed) return;

    try {
      await validateCloudflareToken(trimmed);
      writeSession(STORAGE_KEYS.oauthCloudflareToken, trimmed);
      if (deployCfAccountIdInput?.value?.trim()) {
        writeLocal(STORAGE_KEYS.cloudflareAccountId, deployCfAccountIdInput.value);
      }
      if (typeof CANARIAToast !== "undefined") {
        CANARIAToast.success({ title: "Cloudflare connected", message: "Token verified for this browser session." });
      }
      refreshDeployConnectionState();
      updateAuthUiNavSignals();
    } catch (error) {
      if (typeof CANARIAToast !== "undefined") {
        CANARIAToast.error({ title: "Cloudflare connect failed", message: error.message || "Token rejected." });
      }
    }
  }

  function disconnectGithub() {
    writeSession(STORAGE_KEYS.oauthGithubToken, "");
    refreshDeployConnectionState();
    updateAuthUiNavSignals();
    if (typeof CANARIAToast !== "undefined") {
      CANARIAToast.info({ title: "GitHub disconnected", message: "Session token removed." });
    }
  }

  function disconnectCloudflare() {
    writeSession(STORAGE_KEYS.oauthCloudflareToken, "");
    refreshDeployConnectionState();
    updateAuthUiNavSignals();
    if (typeof CANARIAToast !== "undefined") {
      CANARIAToast.info({ title: "Cloudflare disconnected", message: "Session token removed." });
    }
  }

  function persistDeployConnectionInputs() {
    if (oauthGithubClientIdInput) {
      writeLocal(STORAGE_KEYS.oauthGithubClientId, oauthGithubClientIdInput.value);
    }
    if (oauthCloudflareClientIdInput) {
      writeLocal(STORAGE_KEYS.oauthCloudflareClientId, oauthCloudflareClientIdInput.value);
    }
    if (deployCfAccountIdInput) {
      writeLocal(STORAGE_KEYS.cloudflareAccountId, deployCfAccountIdInput.value);
    }
    if (deployEndpointModeInput) {
      writeLocal(STORAGE_KEYS.deployEndpointMode, normalizeEndpointMode(deployEndpointModeInput.value));
    }
  }

  function loadDeployConnectionInputs() {
    if (oauthGithubClientIdInput) {
      oauthGithubClientIdInput.value = readLocal(STORAGE_KEYS.oauthGithubClientId);
    }
    if (oauthCloudflareClientIdInput) {
      oauthCloudflareClientIdInput.value = readLocal(STORAGE_KEYS.oauthCloudflareClientId);
    }
    if (deployCfAccountIdInput) {
      deployCfAccountIdInput.value = getCloudflareAccountId();
    }
    if (deployEndpointModeInput) {
      deployEndpointModeInput.value = normalizeEndpointMode(
        readLocal(STORAGE_KEYS.deployEndpointMode) || deployEndpointModeInput.value || "both",
      );
    }
  }

  function saveLlmConfig() {
    const endpoint = String(llmEndpointInput?.value || "").trim();
    const apiKey = String(llmApiKeyInput?.value || "").trim();
    const model = String(llmModelInput?.value || llmModelSelectInput?.value || "").trim();

    if (!endpoint || !model) {
      setLlmStatus("Endpoint and model are required.", "error");
      return;
    }

    const isHttps = endpoint.startsWith("https://");
    const isLocalHttp = endpoint.startsWith("http://localhost") || endpoint.startsWith("http://127.0.0.1");
    if (!isHttps && !isLocalHttp) {
      setLlmStatus("Use HTTPS endpoint (or localhost for development).", "error");
      return;
    }

    const runtime = getIdeRuntime();
    if (runtime?.upsertProvider) {
      const selectedProviderId = String(llmProviderInput?.value || runtime.getActiveProviderId?.() || "").trim();
      const selectedProvider = selectedProviderId ? runtime.getProviderById?.(selectedProviderId) : null;
      const endpointParts = parseEndpointParts(endpoint);

      const nextProvider = runtime.upsertProvider({
        ...(selectedProvider || {}),
        id: selectedProvider?.id || `provider_${Date.now().toString(36)}`,
        name: selectedProvider?.name || "Custom Provider",
        baseUrl: endpointParts.baseUrl,
        path: endpointParts.path,
        models: [model, ...(selectedProvider?.models || [])],
        activeModel: model,
        updatedAt: new Date().toISOString(),
      });

      runtime.setProviderApiKey(nextProvider.id, apiKey);
      runtime.setActiveProvider(nextProvider.id);
      if (runtime.syncLegacyFromActive) {
        runtime.syncLegacyFromActive();
      }

      syncDeployLlmProviderUi(nextProvider.id, model);
      setLlmStatus(`Saved ${nextProvider.name} (${model}).`, "success");
      return;
    }

    writeLocal(STORAGE_KEYS.llmEndpoint, endpoint);
    writeLocal(STORAGE_KEYS.llmModel, model);
    writeSession(STORAGE_KEYS.llmApiKeySession, apiKey);
    setLlmStatus("LLM provider saved for this browser session.", "success");
  }

  function loadLlmConfig() {
    const cfg = getLlmConfig();
    syncDeployLlmProviderUi(cfg.providerId, cfg.model);
    if (llmEndpointInput) llmEndpointInput.value = cfg.endpoint || llmEndpointInput.value || "";
    if (llmApiKeyInput) llmApiKeyInput.value = cfg.apiKey || llmApiKeyInput.value || "";
    if (llmModelInput) llmModelInput.value = cfg.model || llmModelInput.value || "";
    if (llmModelSelectInput && cfg.model) {
      llmModelSelectInput.value = cfg.model;
    }
    if (cfg.endpoint && cfg.apiKey && cfg.model) {
      setLlmStatus("LLM provider configured.", "success");
    } else {
      setLlmStatus("Set provider, endpoint, model, and API key for static generation.", null);
    }
  }

  // ── Deploy method tab switching ──
  function switchDeployMethod(method) {
    if (deployCfTab) deployCfTab.classList.toggle("active", method === "cloudflare");
    if (deployGhTab) deployGhTab.classList.toggle("active", method === "github");
    if (deployCfPanel) deployCfPanel.style.display = method === "cloudflare" ? "" : "none";
    if (deployGhPanel) deployGhPanel.style.display = method === "github" ? "" : "none";

    refreshDeployConnectionState();
    if (method === "github" && getGithubToken()) {
      loadGithubRepos();
    }
  }

  function sanitizeWorkerName(input, fallback = "canaria-agent") {
    const normalized = String(input || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");
    const limited = normalized.slice(0, 63).replace(/^-+|-+$/g, "");
    return limited || fallback;
  }

  function toErrorMessage(error, fallback = "Unexpected error.") {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    const text = String(error || "").trim();
    return text || fallback;
  }

  function delay(ms) {
    const waitMs = Number.isFinite(ms) ? Math.max(0, Math.floor(ms)) : 0;
    return new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  function normalizeSafeExternalUrl(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    try {
      const parsed = new URL(text);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return "";
      }
      return parsed.toString();
    } catch {
      return "";
    }
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

      const topLevel =
        String(data.message || "").trim() ||
        String(data.error || "").trim() ||
        String(data.result?.error || "").trim();
      if (topLevel) return topLevel;
    }

    return `Cloudflare API request failed (${status})`;
  }

  function isLikelyCloudflareAccountId(value) {
    return /^[a-f0-9]{32}$/i.test(String(value || "").trim());
  }

  function getDeployObjectCompatibilityDate(deployObject) {
    const files = Array.isArray(deployObject?.files) ? deployObject.files : [];
    const wranglerFile = files.find((row) => String(row?.path || "").toLowerCase() === "wrangler.toml");
    const content = String(wranglerFile?.content || "");
    const match = content.match(/^\s*compatibility_date\s*=\s*"(\d{4}-\d{2}-\d{2})"\s*$/m);
    return match?.[1] || new Date().toISOString().slice(0, 10);
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

  async function cloudflareApiRequest(url, apiToken, options = {}) {
    const init = options && typeof options === "object" ? options : {};
    const headers = {
      Authorization: `Bearer ${apiToken}`,
      ...(init.headers || {}),
    };

    const response = await withRequestTimeout((signal) =>
      fetch(url, {
        ...init,
        headers,
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

  async function vercelApiRequest(pathname, apiToken, options = {}) {
    const token = String(apiToken || "").trim();
    if (!token) {
      throw new Error("Vercel access token is required.");
    }
    const path = String(pathname || "").trim() || "/v13/deployments";
    const teamId = getVercelTeamId();
    const endpoint = `https://api.vercel.com${path}${teamId ? `${path.includes("?") ? "&" : "?"}teamId=${encodeURIComponent(teamId)}` : ""}`;

    const init = options && typeof options === "object" ? options : {};
    const response = await withRequestTimeout((signal) =>
      fetch(endpoint, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init.headers || {}),
        },
        signal,
      }),
    );

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message =
        String(data?.error?.message || "").trim() ||
        String(data?.error?.code || "").trim() ||
        String(data?.message || "").trim() ||
        `Vercel API request failed (${response.status})`;
      throw new Error(message);
    }

    return data;
  }

  async function createVercelDeployment(params) {
    const token = String(params?.token || "").trim();
    const deployObject = params?.deployObject;
    const deployName = sanitizeWorkerName(String(params?.name || deployObject?.rootDir || "canaria-app"));
    const files = (Array.isArray(deployObject?.files) ? deployObject.files : [])
      .map((row) => ({
        file: String(row?.path || "").replace(/^\/+/, ""),
        data: String(row?.content || ""),
      }))
      .filter((row) => row.file && row.data);

    if (!files.length) {
      throw new Error("Deploy object has no files for Vercel deployment.");
    }

    const payload = {
      name: deployName,
      target: "production",
      files,
      meta: {
        source: "canaria-static-ide",
      },
    };
    const project = String(params?.project || "").trim();
    if (project) {
      payload.project = project;
    }

    const data = await vercelApiRequest("/v13/deployments", token, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const rawUrl = String(data?.inspectorUrl || data?.url || "").trim();
    const normalizedUrl = normalizeSafeExternalUrl(
      rawUrl && !/^https?:\/\//i.test(rawUrl) ? `https://${rawUrl.replace(/^\/+/, "")}` : rawUrl,
    );

    return {
      id: String(data?.id || ""),
      url: normalizedUrl,
      raw: data,
    };
  }

  async function uploadCloudflareWorkerScript(params) {
    const deployUrl = String(params?.deployUrl || "").trim();
    const apiToken = String(params?.apiToken || "").trim();
    const script = String(params?.script || "");
    const compatibilityDate = String(params?.compatibilityDate || "").trim() || new Date().toISOString().slice(0, 10);

    if (!deployUrl || !apiToken) {
      throw new Error("Cloudflare deploy URL and API token are required.");
    }
    if (!script.trim()) {
      throw new Error("Generated worker script is empty.");
    }
    if (typeof FormData === "undefined" || typeof Blob === "undefined") {
      throw new Error("Browser does not support required upload APIs (FormData/Blob).");
    }
    if (script.length > 2_500_000) {
      throw new Error("Generated worker script is too large for direct browser deploy.");
    }

    const moduleFilename = "index.js";
    const attempts = [
      {
        id: "module_multipart",
        run: () =>
          cloudflareApiRequest(deployUrl, apiToken, {
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
        id: "service_worker_multipart",
        run: () =>
          cloudflareApiRequest(deployUrl, apiToken, {
            method: "PUT",
            body: (() => {
              const body = new FormData();
              body.append(
                "metadata",
                new Blob(
                  [
                    JSON.stringify({
                      body_part: "script",
                      compatibility_date: compatibilityDate,
                    }),
                  ],
                  { type: "application/json" },
                ),
              );
              body.append("script", new Blob([script], { type: "application/javascript" }), "script.js");
              return body;
            })(),
          }),
      },
      {
        id: "module_content_type",
        run: () =>
          cloudflareApiRequest(deployUrl, apiToken, {
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
          cloudflareApiRequest(deployUrl, apiToken, {
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
        return {
          strategy: attempt.id,
          data,
        };
      }

      const message = extractCloudflareErrorMessage(data, response.status);
      if (response.status === 401 || response.status === 403 || response.status === 404 || response.status === 429) {
        throw new Error(message);
      }
      lastError = new Error(message);
    }

    throw lastError || new Error("Cloudflare deploy failed.");
  }

  function getSelectedDeployTarget() {
    const targetSelect = document.getElementById("deployCfTarget");
    return String(targetSelect?.value || "cloudflare_workers_elysia_bun").trim() || "cloudflare_workers_elysia_bun";
  }

  function getDeployTargetDefinition(targetId) {
    const runtime = getIdeRuntime();
    if (runtime?.getDeployTargetById) {
      return runtime.getDeployTargetById(targetId);
    }
    return { id: targetId, label: targetId, platform: targetId.startsWith("cloudflare") ? "cloudflare" : "unknown" };
  }

  function generateWorkerScript(name, description, targetId = "cloudflare_workers", endpointMode = "both") {
    const drawflowData = editor ? editor.export() : {};
    const runtime = getIdeRuntime();
    if (runtime?.buildCloudflareWorkerModule) {
      return runtime.buildCloudflareWorkerModule({
        agentName: name,
        description,
        drawflow: drawflowData,
        providerConfig: getLlmConfig(),
        target: targetId,
        endpointMode: normalizeEndpointMode(endpointMode),
      });
    }

    return `export default { fetch() { return new Response("Generated runtime unavailable", { status: 501 }); } };`;
  }

  function buildDeployObjectForCurrentFlow(name, description, targetId, endpointMode = "both") {
    const drawflowData = editor ? editor.export() : {};
    const runtime = getIdeRuntime();
    const workerName = sanitizeWorkerName(name || "canaria-agent");
    const resolvedEndpointMode = normalizeEndpointMode(endpointMode);
    if (runtime?.buildDeployObject) {
      return runtime.buildDeployObject({
        target: targetId,
        agentName: name,
        workerName,
        description,
        drawflow: drawflowData,
        providerConfig: getLlmConfig(),
        endpointMode: resolvedEndpointMode,
      });
    }

    return {
      id: `deployobj_${Date.now().toString(36)}`,
      target: targetId,
      targetLabel: targetId,
      rootDir: workerName,
      files: [
        {
          path: "src/worker.js",
          content: generateWorkerScript(name, description, targetId, resolvedEndpointMode),
        },
      ],
      summary: {
        fileCount: 1,
      },
    };
  }

  function downloadTextFile(filename, content) {
    const blob = new Blob([String(content || "")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function renderDeployObjectResult(resultEl, deployObject, headline, opts = {}) {
    if (!resultEl || !deployObject) return;
    const safeHeadline = escapeHtml(headline || "Deploy object generated");
    const fileCount = Number(deployObject?.summary?.fileCount || deployObject?.files?.length || 0);
    const target = escapeHtml(String(deployObject.targetLabel || deployObject.target || ""));
    const rootDir = escapeHtml(String(deployObject.rootDir || ""));
    const deployUrl = normalizeSafeExternalUrl(opts.url);
    const safeDeployUrl = escapeHtml(deployUrl);

    resultEl.className = "deploy-result success";
    resultEl.innerHTML = `
      ${safeHeadline}
      <div class="result-url">Target: ${target}</div>
      <div class="result-url">Files: ${fileCount}</div>
      <div class="result-url">Folder: ${rootDir}</div>
      ${
        deployUrl
          ? `<div class="result-url"><a href="${safeDeployUrl}" target="_blank" rel="noopener noreferrer">${safeDeployUrl}</a> <button class="copy-url" data-action="copyDeployUrl">Copy URL</button></div>`
          : ""
      }
      <div class="result-url"><button class="copy-url" data-action="downloadDeployObject">Download deploy object JSON</button></div>
    `;
    resultEl.querySelector('[data-action="copyDeployUrl"]')?.addEventListener("click", () => {
      navigator.clipboard
        .writeText(deployUrl)
        .then(() => {
          if (typeof CANARIAToast !== "undefined") {
            CANARIAToast.success({ title: "Copied", message: "Deployment URL copied to clipboard." });
          }
        })
        .catch(() => {
          if (typeof CANARIAToast !== "undefined") {
            CANARIAToast.warning({ title: "Copy failed", message: "Clipboard access is not available in this browser context." });
          }
        });
    });
    resultEl.querySelector('[data-action="downloadDeployObject"]')?.addEventListener("click", () => {
      const filename = `${deployObject.rootDir || "deploy-object"}.json`;
      downloadTextFile(filename, JSON.stringify(deployObject, null, 2));
    });
    resultEl.style.display = "";
  }

  // ── Deploy / generate target object ──
  async function deployCf() {
    const nameInput = document.getElementById("deployAgentName");
    const descInput = document.getElementById("deployAgentDesc");
    const workerInput = document.getElementById("deployCfWorkerName");
    const targetSelect = document.getElementById("deployCfTarget");
    const name = nameInput ? nameInput.value.trim() : "";
    const rawWorkerName = workerInput ? workerInput.value.trim() : "";
    const workerName = sanitizeWorkerName(rawWorkerName);
    const description = descInput ? descInput.value.trim() : "";

    if (workerInput) workerInput.value = workerName;

    if (!name || !workerName) {
      if (typeof CANARIAToast !== "undefined") CANARIAToast.warning({ title: "Missing fields", message: "Agent name and worker name are required." });
      return;
    }

    const targetId = String(targetSelect?.value || "cloudflare_workers_elysia_bun").trim();
    const targetDef = getDeployTargetDefinition(targetId);
    const endpointMode = normalizeEndpointMode(
      deployEndpointModeInput?.value || readLocal(STORAGE_KEYS.deployEndpointMode) || "both",
    );
    const deployObject = buildDeployObjectForCurrentFlow(name, description, targetId, endpointMode);

    const targetPlatform = String(targetDef?.platform || "").trim();
    const canDirectCloudflare = Boolean(targetPlatform === "cloudflare" && targetDef?.canDirectDeploy !== false);
    const canDirectVercel = Boolean(targetPlatform === "vercel");
    const apiToken = getCloudflareToken();
    const accountId = String(getCloudflareAccountId() || "").trim().toLowerCase();
    const vercelToken = getVercelToken();
    const vercelProject = getVercelProject();
    const hasCloudflareCreds = Boolean(apiToken && accountId);
    if (hasCloudflareCreds && isLikelyCloudflareAccountId(accountId)) {
      writeLocal(STORAGE_KEYS.cloudflareAccountId, accountId);
    }

    const progress = document.getElementById("deployCfProgress");
    const steps = document.getElementById("deployCfSteps");
    const result = document.getElementById("deployCfResult");
    const btn = document.getElementById("deployCfBtn");
    if (progress) progress.style.display = "";
    if (result) { result.style.display = "none"; result.className = "deploy-result"; }
    if (btn) { btn.disabled = true; btn.textContent = "Running..."; }
    if (steps) steps.innerHTML = '<div class="deploy-step active"><span class="deploy-step-icon"><svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></span><span>Generating deploy object...</span></div>';

    try {
      if (canDirectVercel) {
        if (!vercelToken) {
          if (steps) {
            steps.innerHTML = '<div class="deploy-step completed"><span class="deploy-step-icon">&#x2713;</span><span>Deploy object generated</span></div>';
          }
          renderDeployObjectResult(
            result,
            deployObject,
            "Vercel token missing. Generated deploy object for Vercel CLI/API path.",
          );
          appendDeploymentLog({
            id: `obj_${Date.now().toString(36)}`,
            name,
            target: targetId,
            status: "generated",
            updatedAt: new Date().toISOString(),
            url: "",
            deployObject,
          });
          loadDeployments();
          if (typeof CANARIAToast !== "undefined") {
            CANARIAToast.info({ title: "Deploy object ready", message: "Add Vercel token in Settings for direct browser deploy." });
          }
          return;
        }

        if (steps) {
          steps.innerHTML = '<div class="deploy-step active"><span class="deploy-step-icon"><svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></span><span>Uploading deployment to Vercel...</span></div>';
        }

        const deployResult = await createVercelDeployment({
          token: vercelToken,
          project: vercelProject,
          name: workerName,
          deployObject,
        });
        const url = deployResult.url || "";
        renderDeployObjectResult(
          result,
          deployObject,
          "Vercel deploy submitted. Deploy object also generated.",
          { url },
        );
        if (steps) steps.innerHTML = '<div class="deploy-step completed"><span class="deploy-step-icon">&#x2713;</span><span>Deployed + object generated</span></div>';
        appendDeploymentLog({
          id: `vercel_${Date.now().toString(36)}`,
          name,
          target: targetId,
          status: "deployed",
          updatedAt: new Date().toISOString(),
          url,
          deployObject,
        });
        loadDeployments();
        if (typeof CANARIAToast !== "undefined") {
          CANARIAToast.success({
            title: "Vercel deploy started",
            message: url || `Deployment ${deployResult.id || "created"}`,
          });
        }
        return;
      }

      if (!canDirectCloudflare || !hasCloudflareCreds) {
        if (steps) {
          steps.innerHTML = '<div class="deploy-step completed"><span class="deploy-step-icon">&#x2713;</span><span>Deploy object generated</span></div>';
        }
        const generatedHeadline = !canDirectCloudflare
          ? "Target object generated (no direct deploy for this platform in browser mode)."
          : "Cloudflare credentials missing. Generated deploy object for Wrangler/Bun path.";
        renderDeployObjectResult(
          result,
          deployObject,
          generatedHeadline,
        );
        appendDeploymentLog({
          id: `obj_${Date.now().toString(36)}`,
          name,
          target: targetId,
          status: "generated",
          updatedAt: new Date().toISOString(),
          url: "",
          deployObject,
        });
        loadDeployments();
        if (typeof CANARIAToast !== "undefined") {
          CANARIAToast.info({ title: "Deploy object ready", message: "Download JSON or push to GitHub." });
        }
        return;
      }

      if (!isLikelyCloudflareAccountId(accountId)) {
        throw new Error("Cloudflare account ID looks invalid. Use the 32-character account ID from Cloudflare dashboard.");
      }

      if (steps) {
        steps.innerHTML = '<div class="deploy-step active"><span class="deploy-step-icon"><svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></span><span>Uploading worker script to Cloudflare...</span></div>';
      }

      const script = generateWorkerScript(name, description, targetId, endpointMode);
      const deployUrl = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts/${encodeURIComponent(workerName)}`;
      const compatibilityDate = getDeployObjectCompatibilityDate(deployObject);
      let uploadResult = null;
      let uploadError = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          uploadResult = await uploadCloudflareWorkerScript({
            deployUrl,
            apiToken,
            script,
            compatibilityDate,
          });
          uploadError = null;
          break;
        } catch (error) {
          uploadError = error;
          const message = toErrorMessage(error).toLowerCase();
          const isRetryable =
            message.includes("timed out") ||
            message.includes("network") ||
            message.includes("(500)") ||
            message.includes("(502)") ||
            message.includes("(503)") ||
            message.includes("(504)") ||
            message.includes("(429)");
          if (!isRetryable || attempt >= 2) {
            break;
          }
          await delay(450 * (attempt + 1));
        }
      }
      if (uploadError || !uploadResult) {
        throw uploadError || new Error("Cloudflare deploy failed.");
      }

      let workerUrl = "";
      try {
        if (steps) {
          steps.innerHTML = '<div class="deploy-step active"><span class="deploy-step-icon"><svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></span><span>Resolving workers.dev URL...</span></div>';
        }
        const subUrl = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/subdomain`;
        const { response: subRes, data: subData } = await cloudflareApiRequest(subUrl, apiToken, { method: "GET" });
        if (subRes.ok && subData?.success && subData?.result?.subdomain) {
          workerUrl = `https://${workerName}.${subData.result.subdomain}.workers.dev`;
        }
      } catch {
        // Keep empty URL and fall back to dashboard.
      }

      const dashboardUrl = `https://dash.cloudflare.com/?to=/:account/workers/services/view/${encodeURIComponent(workerName)}/production`;
      const url = workerUrl || dashboardUrl;
      if (result) {
        renderDeployObjectResult(
          result,
          deployObject,
          "Cloudflare deploy complete. Elysia/Bun deploy object also generated.",
          { url },
        );
      }
      if (steps) steps.innerHTML = '<div class="deploy-step completed"><span class="deploy-step-icon">&#x2713;</span><span>Deployed + object generated</span></div>';
      appendDeploymentLog({
        id: `cf_${Date.now().toString(36)}`,
        name,
        target: targetId || "cloudflare_workers",
        status: "deployed",
        updatedAt: new Date().toISOString(),
        url,
        deployObject,
      });
      loadDeployments();
      if (typeof CANARIAToast !== "undefined") {
          CANARIAToast.success({
            title: "Deployed",
            message: `${url} (${uploadResult.strategy})`,
          });
        }
    } catch (err) {
      const message = toErrorMessage(err, "Cloudflare deploy failed.");
      const likelyCorsOrNetwork = /(cors|network|failed to fetch|fetch failed|blocked|timeout)/i.test(message);
      const headline = likelyCorsOrNetwork
        ? "Direct Cloudflare deploy blocked (likely CORS/network). Generated deploy object for Wrangler/Bun path."
        : "Cloudflare deploy failed. Generated deploy object for Wrangler/Bun path.";

      if (result) {
        renderDeployObjectResult(result, deployObject, headline);
      }
      if (steps) {
        steps.innerHTML = '<div class="deploy-step completed"><span class="deploy-step-icon">&#x2713;</span><span>Deploy object generated</span></div>';
      }
      appendDeploymentLog({
        id: `obj_${Date.now().toString(36)}`,
        name,
        target: targetId,
        status: "generated",
        updatedAt: new Date().toISOString(),
        url: "",
        deployObject,
      });
      loadDeployments();
      if (typeof CANARIAToast !== "undefined") {
        CANARIAToast.warning({
          title: "Direct deploy failed",
          message,
        });
      }
    } finally {
      if (progress) {
        const bar = progress.querySelector(".progress-bar");
        if (bar) bar.style.display = "";
      }
      if (btn) { btn.disabled = false; btn.textContent = "Deploy / Generate Target Object"; }
    }
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
    const response = await withRequestTimeout((signal) =>
      fetch(`https://api.github.com${pathname}`, {
        ...options,
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          ...(options.headers || {}),
        },
        signal,
      }),
    );
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

  function githubPath(path) {
    return String(path || "")
      .split("/")
      .map((part) => encodeURIComponent(part))
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

  async function upsertGithubFile(owner, repo, branch, token, filePath, content, message) {
    const existingSha = await getGithubFileSha(owner, repo, filePath, branch, token);
    const body = {
      message,
      content: toBase64Utf8(content),
      branch,
    };
    if (existingSha) {
      body.sha = existingSha;
    }

    return githubApi(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${githubPath(filePath)}`,
      token,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
  }

  // ── Load GitHub repos ──
  async function loadGithubRepos() {
    const token = getGithubToken();
    const select = document.getElementById("deployGhRepo");
    if (!token || !select) return;
    try {
      const repos = await githubApi("/user/repos?per_page=100&sort=updated", token);
      select.innerHTML = '<option value="">Select a repository...</option>';
      for (const repo of repos) {
        const fullName = String(repo?.full_name || "").trim();
        if (!fullName) continue;
        const opt = document.createElement("option");
        opt.value = fullName;
        opt.textContent = fullName;
        select.appendChild(opt);
      }
    } catch {
      select.innerHTML = '<option value="">Could not load repos</option>';
    }
  }

  // ── Push to GitHub ──
  async function deployGithub() {
    const nameInput = document.getElementById("deployAgentName");
    const descInput = document.getElementById("deployAgentDesc");
    const repoSelect = document.getElementById("deployGhRepo");
    const branchInput = document.getElementById("deployGhBranch");
    const messageInput = document.getElementById("deployGhMessage");
    const name = nameInput ? nameInput.value.trim() : "";
    const description = descInput ? descInput.value.trim() : "";
    const repoFullName = repoSelect ? repoSelect.value : "";
    const branch = branchInput ? branchInput.value.trim() : "main";
    const message = messageInput ? messageInput.value.trim() : "Deploy agent via CANARIA";
    const targetId = getSelectedDeployTarget();

    if (!name || !repoFullName) {
      if (typeof CANARIAToast !== "undefined") CANARIAToast.warning({ title: "Missing fields", message: "Agent name and repository are required." });
      return;
    }

    const token = getGithubToken();
    if (!token) {
      if (typeof CANARIAToast !== "undefined") CANARIAToast.warning({ title: "Missing settings", message: "Set a GitHub token in Settings." });
      return;
    }

    const progress = document.getElementById("deployGhProgress");
    const result = document.getElementById("deployGhResult");
    const btn = document.getElementById("deployGhBtn");
    if (progress) progress.style.display = "";
    if (result) { result.style.display = "none"; result.className = "deploy-result"; }
    if (btn) { btn.disabled = true; btn.textContent = "Pushing..."; }

    const [owner, repo] = repoFullName.split("/");
    try {
      const endpointMode = normalizeEndpointMode(
        deployEndpointModeInput?.value || readLocal(STORAGE_KEYS.deployEndpointMode) || "both",
      );
      const deployObject = buildDeployObjectForCurrentFlow(name, description, targetId, endpointMode);
      const prefix = String(deployObject.rootDir || sanitizeWorkerName(name)).replace(/^\/+|\/+$/g, "");
      let lastCommit = null;

      for (const file of deployObject.files || []) {
        const filePath = `${prefix}/${String(file.path || "").replace(/^\/+/, "")}`;
        lastCommit = await upsertGithubFile(owner, repo, branch, token, filePath, String(file.content || ""), message);
      }

      const manifestPath = `${prefix}/deploy-object.json`;
      lastCommit = await upsertGithubFile(
        owner,
        repo,
        branch,
        token,
        manifestPath,
        JSON.stringify(deployObject, null, 2),
        message,
      );

      const commitUrl = normalizeSafeExternalUrl(lastCommit?.commit?.html_url || "");
      const fileCount = Number(deployObject?.files?.length || 0) + 1;
      if (result) {
        result.className = "deploy-result success";
        result.innerHTML = commitUrl
          ? `Pushed ${fileCount} files to GitHub (${escapeHtml(targetId)}).<div class="result-url"><a href="${escapeHtml(commitUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(commitUrl)}</a></div>`
          : `Pushed ${fileCount} files to GitHub (${escapeHtml(targetId)}).`;
        result.style.display = "";
      }

      appendDeploymentLog({
        id: `gh_${Date.now().toString(36)}`,
        name,
        target: `github:${targetId}`,
        status: "generated",
        updatedAt: new Date().toISOString(),
        url: commitUrl,
        deployObject,
      });
      loadDeployments();
      if (typeof CANARIAToast !== "undefined") CANARIAToast.success({ title: "Pushed to GitHub", message: repoFullName });
    } catch (err) {
      if (result) {
        result.className = "deploy-result error";
        result.textContent = err.message;
        result.style.display = "";
      }
      if (typeof CANARIAToast !== "undefined") CANARIAToast.error({ title: "Push failed", message: err.message });
    } finally {
      if (progress) progress.style.display = "none";
      if (btn) { btn.disabled = false; btn.textContent = "Push to GitHub"; }
    }
  }

  function initDeployPersistence() {
    loadDeployConnectionInputs();
    loadLlmConfig();
    refreshDeployConnectionState();
  }

  function bindDeployPersistenceEvents() {
    if (oauthGithubClientIdInput) {
      oauthGithubClientIdInput.addEventListener("change", persistDeployConnectionInputs);
    }
    if (oauthCloudflareClientIdInput) {
      oauthCloudflareClientIdInput.addEventListener("change", persistDeployConnectionInputs);
    }
    if (deployCfAccountIdInput) {
      deployCfAccountIdInput.addEventListener("change", () => {
        persistDeployConnectionInputs();
        refreshDeployConnectionState();
      });
    }
    if (deployEndpointModeInput) {
      deployEndpointModeInput.addEventListener("change", () => {
        persistDeployConnectionInputs();
      });
    }
    if (connectGithubBtn) connectGithubBtn.addEventListener("click", () => connectGithub());
    if (disconnectGithubBtn) disconnectGithubBtn.addEventListener("click", () => disconnectGithub());
    if (connectCloudflareBtn) connectCloudflareBtn.addEventListener("click", () => connectCloudflare());
    if (disconnectCloudflareBtn) disconnectCloudflareBtn.addEventListener("click", () => disconnectCloudflare());
    if (saveLlmConfigBtn) saveLlmConfigBtn.addEventListener("click", () => saveLlmConfig());
    if (llmProviderInput) {
      llmProviderInput.addEventListener("change", () => {
        const runtime = getIdeRuntime();
        if (runtime?.setActiveProvider) {
          runtime.setActiveProvider(llmProviderInput.value);
        }
        syncDeployLlmProviderUi(llmProviderInput.value, "");
      });
    }
    if (llmModelSelectInput) {
      llmModelSelectInput.addEventListener("change", () => {
        const nextModel = String(llmModelSelectInput.value || "").trim();
        if (llmModelInput) llmModelInput.value = nextModel;
        const runtime = getIdeRuntime();
        if (runtime?.setProviderActiveModel && llmProviderInput?.value && nextModel) {
          runtime.setProviderActiveModel(llmProviderInput.value, nextModel);
        }
      });
    }
    if (llmModelInput) {
      llmModelInput.addEventListener("change", () => {
        const nextModel = String(llmModelInput.value || "").trim();
        if (!nextModel || !llmModelSelectInput) return;
        const exists = Array.from(llmModelSelectInput.options).some((opt) => opt.value === nextModel);
        if (!exists) {
          const custom = document.createElement("option");
          custom.value = nextModel;
          custom.textContent = `${nextModel} (custom)`;
          llmModelSelectInput.appendChild(custom);
        }
        llmModelSelectInput.value = nextModel;
      });
    }
  }

  function updateAuthUiNavSignals() {
    try {
      window.dispatchEvent(new StorageEvent("storage"));
    } catch {
      // no-op
    }
  }

  function bindDeployEvents() {
    if (deploySaveBtn) {
      deploySaveBtn.addEventListener("click", () => saveAsAgent());
    }
    // Deploy method tabs
    if (deployCfTab) deployCfTab.addEventListener("click", () => switchDeployMethod("cloudflare"));
    if (deployGhTab) deployGhTab.addEventListener("click", () => switchDeployMethod("github"));
    // CF deploy
    const deployCfBtn = document.getElementById("deployCfBtn");
    if (deployCfBtn) deployCfBtn.addEventListener("click", () => deployCf());
    const deployCfTarget = document.getElementById("deployCfTarget");
    if (deployCfTarget) {
      deployCfTarget.addEventListener("change", () => {
        refreshDeployConnectionState();
      });
    }
    // GitHub push
    const deployGhBtn = document.getElementById("deployGhBtn");
    if (deployGhBtn) deployGhBtn.addEventListener("click", () => deployGithub());
    // GitHub refresh repos
    const deployGhRefresh = document.getElementById("deployGhRefresh");
    if (deployGhRefresh) deployGhRefresh.addEventListener("click", () => loadGithubRepos());
    bindDeployPersistenceEvents();
    switchDeployMethod("cloudflare");
  }

  /* ===== Inspector Tab Switching ===== */

  function switchInspectorTab(tabId) {
    state.activeInspectorTab = tabId;
    const tabs = document.querySelectorAll(".inspector-tab");
    const contents = document.querySelectorAll(".inspector-tab-content");

    for (const tab of tabs) {
      tab.classList.toggle("active", tab.dataset.inspectorTab === tabId);
    }
    for (const content of contents) {
      content.style.display = content.dataset.inspectorTabId === tabId ? "" : "none";
    }
  }

  function bindInspectorTabEvents() {
    const tabs = document.querySelectorAll(".inspector-tab");
    for (const tab of tabs) {
      tab.addEventListener("click", () => {
        switchInspectorTab(tab.dataset.inspectorTab);
      });
    }
  }

  /* ===== Accordion ===== */

  function bindAccordionEvents() {
    document.addEventListener("click", (event) => {
      const header = event.target.closest(".accordion-header");
      if (!header) return;
      const section = header.closest(".accordion-section");
      if (!section) return;
      section.classList.toggle("open");
    });
  }

  /* ===== Runtime State Display ===== */

  function refreshRuntimeStateDisplay() {
    if (!runtimeStateDisplay) return;
    const node = getSelectedNode();
    if (!node) {
      runtimeStateDisplay.innerHTML = '<div class="hint-empty">Select a node to see runtime state.</div>';
      return;
    }

    const runtime = getNodeRuntime(node.id);
    if (runtime.status === "idle") {
      runtimeStateDisplay.innerHTML = '<div class="hint-empty">Run a flow to see runtime variables.</div>';
      return;
    }

    const detail = runtime.detail || "No detail";
    runtimeStateDisplay.innerHTML = `<pre>${escapeHtml(detail)}</pre>`;
  }

  /* ===== Floating Inspector ===== */

  function toggleFloatingInspector() {
    if (state.isInspectorFloating) {
      dockInspector();
    } else {
      floatInspector();
    }
  }

  function floatInspector() {
    state.isInspectorFloating = true;

    // Move inspector body content to floating container
    if (inspectorBody && floatingInspectorBody) {
      floatingInspectorBody.appendChild(inspectorBody);
    }

    // Hide the right panel
    inspectorPanel.style.display = "none";
    floatingInspector.style.display = "";

    // Position if not already set
    if (state.floatingPos.x != null) {
      floatingInspector.style.left = state.floatingPos.x + "px";
      floatingInspector.style.top = state.floatingPos.y + "px";
    }

    // Update grid to not have right panel space
    document.body.classList.add("right-collapsed");
  }

  function dockInspector() {
    state.isInspectorFloating = false;

    // Move inspector body back
    if (inspectorBody && inspectorPanel) {
      inspectorPanel.appendChild(inspectorBody);
    }

    inspectorPanel.style.display = "";
    floatingInspector.style.display = "none";
    document.body.classList.remove("right-collapsed");
    state.isInspectorCollapsed = false;
    applyPanelCollapseState(true);
  }

  function initFloatingDrag() {
    const header = floatingInspector.querySelector(".floating-inspector-header");
    if (!header) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    header.addEventListener("mousedown", (event) => {
      if (event.target.closest("button")) return;
      isDragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startLeft = floatingInspector.offsetLeft;
      startTop = floatingInspector.offsetTop;
      event.preventDefault();
    });

    document.addEventListener("mousemove", (event) => {
      if (!isDragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const newLeft = startLeft + dx;
      const newTop = startTop + dy;
      floatingInspector.style.left = newLeft + "px";
      floatingInspector.style.top = newTop + "px";
      state.floatingPos = { x: newLeft, y: newTop };
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }

  function bindFloatingInspectorEvents() {
    if (floatInspectorBtn) {
      floatInspectorBtn.addEventListener("click", () => toggleFloatingInspector());
    }
    if (dockInspectorBtn) {
      dockInspectorBtn.addEventListener("click", () => dockInspector());
    }
    initFloatingDrag();
  }

  function bindGenerateEvents() {
    if (generateBtn) {
      generateBtn.addEventListener("click", () => {
        showGenerateOverlay();
      });
    }

    if (generateFlowBtn) {
      generateFlowBtn.addEventListener("click", () => {
        generateFlow(generatePrompt.value);
      });
    }

    if (generatePrompt) {
      generatePrompt.addEventListener("keydown", (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          event.preventDefault();
          generateFlow(generatePrompt.value);
        }
      });
    }

    if (generateOverlay) {
      generateOverlay.addEventListener("click", (event) => {
        if (event.target === generateOverlay) {
          hideGenerateOverlay();
        }
      });
    }

    const exampleChips = document.querySelectorAll(".generate-example-chip");
    for (const chip of exampleChips) {
      chip.addEventListener("click", () => {
        const exPrompt = chip.dataset.prompt;
        if (exPrompt) {
          generatePrompt.value = exPrompt;
          generateFlow(exPrompt);
        }
      });
    }
  }

  function bindKeyboardShortcuts() {
    document.addEventListener("keydown", async (event) => {
      const key = event.key.toLowerCase();
      const isMeta = event.metaKey || event.ctrlKey;

      if (isMeta && key === "s") {
        event.preventDefault();
        try {
          await saveFlow();
          runStatus.textContent = "Flow saved. (shortcut)";
        } catch (error) {
          runStatus.textContent = `Save error: ${error.message}`;
        }
        return;
      }

      if (isMeta && event.key === "Enter") {
        event.preventDefault();
        runCurrentFlow();
        return;
      }

      if (isTextEntryTarget(event.target)) return;

      if (!isMeta && key === "r") {
        event.preventDefault();
        try {
          await refreshFlowList();
          if (state.currentFlowId) {
            await loadFlow(state.currentFlowId);
          }
          runStatus.textContent = "Refreshed. (shortcut)";
        } catch (error) {
          runStatus.textContent = `Refresh error: ${error.message}`;
        }
      }
    });
  }

  /* ===== Panel Resize Handles ===== */
  (function initPanelResize() {
    const handleLeft = document.getElementById("resizeHandleLeft");
    const handleRight = document.getElementById("resizeHandleRight");
    const canvasLayout = document.getElementById("canvasView");
    if (!canvasLayout) return;

    const MIN_PANEL = 160;
    const MAX_PANEL = 480;
    let dragging = null; // "left" | "right" | null

    function onPointerDown(e, side) {
      e.preventDefault();
      dragging = side;
      const handle = side === "left" ? handleLeft : handleRight;
      if (handle) handle.classList.add("is-dragging");
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    function onPointerMove(e) {
      if (!dragging) return;
      const rect = canvasLayout.getBoundingClientRect();
      const totalW = rect.width;

      if (dragging === "left") {
        let leftW = Math.round(e.clientX - rect.left);
        leftW = Math.max(MIN_PANEL, Math.min(MAX_PANEL, leftW));
        const rightCol = document.body.classList.contains("right-collapsed") ? "44px" : (state._rightW || 300) + "px";
        canvasLayout.style.gridTemplateColumns = leftW + "px 4px 1fr 4px " + rightCol;
        state._leftW = leftW;
      } else {
        let rightW = Math.round(rect.right - e.clientX);
        rightW = Math.max(MIN_PANEL, Math.min(MAX_PANEL, rightW));
        const leftCol = (state._leftW || 280) + "px";
        canvasLayout.style.gridTemplateColumns = leftCol + " 4px 1fr 4px " + rightW + "px";
        state._rightW = rightW;
      }
    }

    function onPointerUp() {
      if (!dragging) return;
      const handle = dragging === "left" ? handleLeft : handleRight;
      if (handle) handle.classList.remove("is-dragging");
      dragging = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try {
        localStorage.setItem("voyager_panel_left_w", String(state._leftW || 280));
        localStorage.setItem("voyager_panel_right_w", String(state._rightW || 300));
      } catch {}
    }

    if (handleLeft) handleLeft.addEventListener("pointerdown", (e) => onPointerDown(e, "left"));
    if (handleRight) handleRight.addEventListener("pointerdown", (e) => onPointerDown(e, "right"));
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);

    // Restore persisted widths
    try {
      const savedL = parseInt(localStorage.getItem("voyager_panel_left_w"), 10);
      const savedR = parseInt(localStorage.getItem("voyager_panel_right_w"), 10);
      if (savedL >= MIN_PANEL && savedL <= MAX_PANEL) state._leftW = savedL;
      if (savedR >= MIN_PANEL && savedR <= MAX_PANEL) state._rightW = savedR;
      if (state._leftW || state._rightW) {
        const l = (state._leftW || 280) + "px";
        const r = (state._rightW || 300) + "px";
        canvasLayout.style.gridTemplateColumns = l + " 4px 1fr 4px " + r;
      }
    } catch {}
  })();

  function bindEvents() {
    editor.on("nodeSelected", (id) => {
      state.selectedNodeId = String(id);
      refreshNodeInspector();
    });

    editor.on("nodeUnselected", () => {
      state.selectedNodeId = "";
      refreshNodeInspector();
    });

    editor.on("connectionCreated", () => {
      if (state.selectedNodeId) refreshNodeInspector();
    });

    editor.on("connectionRemoved", () => {
      if (state.selectedNodeId) refreshNodeInspector();
    });

    if (blockSearch) {
      blockSearch.addEventListener("input", () => {
        const query = blockSearch.value || "";
        clearTimeout(state.paletteSearchDebounceTimer);
        state.paletteSearchDebounceTimer = window.setTimeout(() => {
          if (query === state.paletteQuery) return;
          state.paletteQuery = query;
          renderPalette();
        }, 140);
      });
    }

    if (toggleInspectorBtn) {
      toggleInspectorBtn.addEventListener("click", () => {
        toggleInspectorCollapse();
      });
    }

    if (palettePanel) {
      palettePanel.addEventListener("scroll", () => {
        hidePaletteHoverCard();
      });
    }

    if (drawflowEl) {
      drawflowEl.addEventListener("pointerdown", () => {
        hidePaletteHoverCard();
      });
    }

    window.addEventListener("resize", () => {
      hidePaletteHoverCard();
      refreshCanvasConnections();
    });

    if (applyNodeJsonBtn && nodeJson) {
      applyNodeJsonBtn.addEventListener("click", () => {
        if (!state.selectedNodeId) return;

        try {
          const parsed = JSON.parse(nodeJson.value || "{}");
          editor.updateNodeDataFromId(Number(state.selectedNodeId), parsed);
          updateNodeCard(state.selectedNodeId);
          refreshNodeInspector();
        } catch (error) {
          runStatus.textContent = `Invalid node JSON: ${error.message}`;
        }
      });
    }

    if (duplicateNodeBtn) {
      duplicateNodeBtn.addEventListener("click", () => {
        duplicateSelectedNode();
      });
    }

    if (deleteNodeBtn) {
      deleteNodeBtn.addEventListener("click", () => {
        deleteSelectedNode();
      });
    }

    if (newFlowBtn) {
      newFlowBtn.addEventListener("click", () => {
        state.currentFlowId = "";
        if (flowSelect) flowSelect.value = "";
        flowNameInput.value = "Untitled Flow";
        createStarterFlow();
      });
    }

    if (flowSelect) flowSelect.addEventListener("change", async () => {
      const flowId = flowSelect.value;
      if (!flowId) return;
      try {
        await loadFlow(flowId);
      } catch (error) {
        runStatus.textContent = `Load error: ${error.message}`;
      }
    });

    if (saveFlowBtn) {
      saveFlowBtn.addEventListener("click", async () => {
        try {
          await saveFlow();
          runStatus.textContent = "Flow saved.";
        } catch (error) {
          runStatus.textContent = `Save error: ${error.message}`;
        }
      });
    }

    if (deleteFlowBtn) {
      deleteFlowBtn.addEventListener("click", async () => {
        try {
          await deleteCurrentFlow();
          runStatus.textContent = "Flow deleted.";
        } catch (error) {
          runStatus.textContent = `Delete error: ${error.message}`;
        }
      });
    }

    if (exportFlowBtn) {
      exportFlowBtn.addEventListener("click", async () => {
        await exportFlowToLocalFile();
      });
    }

    if (importFlowBtn && flowImportInput) {
      importFlowBtn.addEventListener("click", () => {
        flowImportInput.value = "";
        flowImportInput.click();
      });
      flowImportInput.addEventListener("change", async () => {
        try {
          await importFlowFromLocalFile(flowImportInput.files?.[0]);
        } catch (error) {
          if (runStatus) {
            runStatus.textContent = `Import error: ${error.message}`;
          }
          if (typeof CANARIAToast !== "undefined") {
            CANARIAToast.error({ title: "Import failed", message: error.message || "Could not import flow." });
          }
        }
      });
    }

    if (runFlowBtn) {
      runFlowBtn.addEventListener("click", () => {
        runCurrentFlow();
      });
    }

    bindCanvasDropFromPalette();
    attachDiscardDragBehavior();
    bindKeyboardShortcuts();
    bindGenerateEvents();
    bindModeTabEvents();
    bindEditorNavModeEvents();
    bindBuildChatEvents();
    bindEditorChatEvents();
    bindWelcomeChipEvents();
    bindPillEvents();
    bindDeployEvents();
    bindInspectorTabEvents();
    bindAccordionEvents();
    bindFloatingInspectorEvents();
  }

  async function boot() {
    try {
      try {
        const locationMode = readModeFromLocation();
        if (locationMode) {
          state.editorMode = locationMode;
        } else {
          const savedMode = normalizeEditorMode(localStorage.getItem("voyager_editor_mode"));
          state.editorMode = savedMode || "chat";
        }
        state.isInspectorCollapsed = localStorage.getItem("voyager_right_collapsed") === "1";
      } catch {
        state.editorMode = "chat";
        state.isInspectorCollapsed = false;
      }

      initDeployPersistence();
      switchMode(state.editorMode);
      renderPalette();
      bindEvents();
      await refreshFlowList();
      flowNameInput.value = "Untitled Flow";
      createStarterFlow();
      try {
        await loadEditorChatAgents();
      } catch {
        // Optional local editor chat list bootstrap.
      }
      loadDeployments();
      if (runStatus && !runStatus.textContent) {
        runStatus.textContent = "Static mode ready. Flows save locally in this browser.";
      }
    } catch (error) {
      runStatus.textContent = `Boot error: ${error.message}`;
    }
  }

  boot();
})();
