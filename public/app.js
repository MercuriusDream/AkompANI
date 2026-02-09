(() => {
  const flowSelect = document.getElementById("flowSelect");
  const flowNameInput = document.getElementById("flowName");
  const newFlowBtn = document.getElementById("newFlowBtn");
  const saveFlowBtn = document.getElementById("saveFlowBtn");
  const deleteFlowBtn = document.getElementById("deleteFlowBtn");
  const blockSearch = document.getElementById("blockSearch");
  const palettePanel = document.getElementById("palettePanel");
  const paletteSections = document.getElementById("paletteSections");
  const discardZone = document.getElementById("discardZone");
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
  const navCanvasControls = document.getElementById("navCanvasControls");
  const chatFullView = document.getElementById("chatFullView");
  const canvasView = document.getElementById("canvasView");
  const chatWelcome = document.getElementById("chatWelcome");
  const chatFullScroll = document.getElementById("chatFullScroll");
  const modeDeployTab = document.getElementById("modeDeployTab");
  const deployView = document.getElementById("deployView");
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
  const llmEndpointInput = document.getElementById("llmEndpoint");
  const llmApiKeyInput = document.getElementById("llmApiKey");
  const llmModelInput = document.getElementById("llmModel");
  const saveLlmConfigBtn = document.getElementById("saveLlmConfigBtn");
  const llmConfigStatus = document.getElementById("llmConfigStatus");
  const modeTabs = [modeChatTab, modeCanvasTab, modeDeployTab].filter(Boolean);
  const modeViews = {
    chat: chatFullView,
    canvas: canvasView,
    deploy: deployView,
  };

  const STORAGE_KEYS = {
    localFlows: "voyager_local_flows",
    localAgents: "voyager_local_agents",
    localDeployments: "voyager_local_deployments",
    llmEndpoint: "voyager_llm_endpoint",
    llmModel: "voyager_llm_model",
    llmApiKeySession: "voyager_llm_api_key",
    oauthGithubToken: "voyager_oauth_github_token",
    oauthCloudflareToken: "voyager_oauth_cloudflare_token",
    oauthGithubClientId: "voyager_oauth_github_client_id",
    oauthCloudflareClientId: "voyager_oauth_cloudflare_client_id",
    cloudflareAccountId: "voyager_cf_account_id",
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
    apiAvailable: true,
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

  function getCloudflareAccountId() {
    return (
      String(deployCfAccountIdInput?.value || "").trim() ||
      readLocal(STORAGE_KEYS.cloudflareAccountId) ||
      readLocal("voyager_cf_account_id")
    );
  }

  function getLlmConfig() {
    return {
      endpoint: readLocal(STORAGE_KEYS.llmEndpoint),
      apiKey: readSession(STORAGE_KEYS.llmApiKeySession),
      model: readLocal(STORAGE_KEYS.llmModel),
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

  function getServerApiKey() {
    return readSession("voyager_server_api_key");
  }

  function withServerAuthHeaders(url, headers) {
    const merged = new Headers(headers || {});
    if (!String(url || "").startsWith("/api/")) {
      return merged;
    }

    const apiKey = getServerApiKey();
    if (!apiKey) return merged;

    merged.set("Authorization", `Bearer ${apiKey}`);
    merged.set("x-api-key", apiKey);
    return merged;
  }

  function withServerAuth(url, options = {}) {
    return {
      ...options,
      headers: withServerAuthHeaders(url, options.headers),
    };
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

    return `
      <div class="node-card" title="${escapeHtml(hoverInfo)}">
        <div class="node-top-row">
          <div class="node-title-wrap">
            <div class="badge" style="background:${def.color}">${blockIconHtml(type, def)}</div>
            <div class="title">${def.label}</div>
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

  function addNode(type, x, y, dataOverride) {
    const def = NODE_CATALOG[type];
    if (!def) return undefined;

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
    if (!modeViews[mode]) mode = "chat";
    state.editorMode = mode;
    document.body.setAttribute("data-editor-mode", mode);

    // Toggle tab active states
    for (const tab of modeTabs) {
      const isActive = tab?.dataset?.mode === mode;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    }

    // Toggle view active states with CSS transitions
    for (const [viewMode, viewEl] of Object.entries(modeViews)) {
      setModeViewActive(viewEl, viewMode === mode);
    }

    // Show/hide canvas-specific nav controls
    if (navCanvasControls) {
      navCanvasControls.classList.toggle("is-visible", mode === "canvas");
    }

    // Show/hide chat pill (only in canvas mode)
    if (chatPill) {
      const showPill = mode === "canvas";
      chatPill.classList.toggle("is-visible", showPill);
      if (!showPill) {
        if (chatPillWindow) chatPillWindow.style.display = "none";
        if (chatPillBtn) chatPillBtn.style.display = "";
      }
    }

    // Apply inspector collapse state in canvas mode
    if (mode === "canvas") {
      document.body.classList.toggle("right-collapsed", state.isInspectorCollapsed);
      if (toggleInspectorBtn) {
        toggleInspectorBtn.classList.toggle("collapsed", state.isInspectorCollapsed);
        toggleInspectorBtn.title = state.isInspectorCollapsed ? "Expand panel" : "Collapse panel";
      }
    } else {
      document.body.classList.remove("right-collapsed");
    }

    // Load deployment data when entering deploy mode
    if (mode === "deploy") {
      loadDeployments();
      prefillDeployAgent();
    }

    hidePaletteHoverCard();
    persistEditorMode();

    // Refresh canvas connections after mode switch transition
    if (mode === "canvas") {
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
        <span class="palette-group-caret">${collapsed ? "+" : "-"}</span>
        <span class="palette-group-label">${group.label}</span>
        <span class="palette-group-count">${matchedTypes.length}</span>
      `;
      headBtn.addEventListener("click", () => {
        state.collapsedGroups[group.id] = !collapsed;
        renderPalette();
      });
      wrap.appendChild(headBtn);

      if (!collapsed) {
        if (matchedTypes.length === 0) {
          const empty = document.createElement("div");
          empty.className = "palette-group-empty";
          empty.textContent = query ? "No matching blocks" : "No blocks";
          wrap.appendChild(empty);
        } else {
          for (const type of matchedTypes) {
            wrap.appendChild(createBlockCard(type));
          }
        }
      }

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

  function clearDiscardHover() {
    discardZone.classList.remove("active");
  }

  function updateDiscardHover(x, y) {
    const active = pointInside(discardZone, x, y) || pointInside(palettePanel, x, y);
    discardZone.classList.toggle("active", active);
  }

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

      const shouldDiscard = pointInside(discardZone, event.clientX, event.clientY) || pointInside(palettePanel, event.clientX, event.clientY);
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

  async function requestJson(url, options = {}) {
    const res = await fetch(url, withServerAuth(url, options));
    let data;

    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      if (res.status === 410 && String(url || "").startsWith("/api/")) {
        state.apiAvailable = false;
      }
      throw new Error(data?.error || `Request failed (${res.status})`);
    }

    if (String(url || "").startsWith("/api/")) {
      state.apiAvailable = true;
    }
    return data;
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
    let flows = [];
    try {
      const data = await requestJson("/api/flows");
      flows = Array.isArray(data?.flows) ? data.flows : [];
      state.apiAvailable = true;
    } catch {
      state.apiAvailable = false;
      flows = listLocalFlows();
    }
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
    let flow;
    try {
      const data = await requestJson(`/api/flows/${flowId}`);
      flow = data.flow;
    } catch {
      flow = getLocalFlowById(flowId);
    }
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

    let flow;
    try {
      if (state.currentFlowId) {
        const data = await requestJson(`/api/flows/${state.currentFlowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        flow = data.flow;
      } else {
        const data = await requestJson("/api/flows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        flow = data.flow;
      }
    } catch {
      const now = new Date().toISOString();
      flow = {
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
    }

    state.currentFlowId = flow.id;
    flowNameInput.value = flow.name;
    await refreshFlowList();
    flowSelect.value = flow.id;

    return flow;
  }

  async function deleteCurrentFlow() {
    if (!state.currentFlowId) return;

    try {
      await requestJson(`/api/flows/${state.currentFlowId}`, {
        method: "DELETE",
      });
    } catch {
      deleteLocalFlowById(state.currentFlowId);
    }

    state.currentFlowId = "";
    flowNameInput.value = "Untitled Flow";
    createStarterFlow();
    await refreshFlowList();
  }

  function clearPullTimer() {
    if (state.pullTimer) {
      clearTimeout(state.pullTimer);
      state.pullTimer = null;
    }
  }

  function hasHealthyWsForRun(runId) {
    return Boolean(
      runId &&
        state.ws &&
        state.ws.readyState === WebSocket.OPEN &&
        state.wsSubscribedRunId === runId,
    );
  }

  function schedulePullFallback(runId, token, delayMs = 1000) {
    if (!runId || runId !== state.currentRunId) return;
    if (token !== state.pullToken) return;
    clearPullTimer();
    state.pullTimer = window.setTimeout(() => {
      state.pullTimer = null;
      pullRunEvents(runId, token);
    }, delayMs);
  }

  function subscribeRun(runId) {
    const targetRunId = String(runId || "");
    if (!targetRunId || !state.ws || state.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    if (state.wsSubscribedRunId === targetRunId) return;
    state.wsSubscribedRunId = "";
    state.ws.send(
      JSON.stringify({
        type: "subscribe",
        runId: targetRunId,
      }),
    );
  }

  function appendEvent(event) {
    if (!event || typeof event.idx !== "number") return;
    if (state.seenEventIds.has(event.idx)) return;

    state.seenEventIds.add(event.idx);
    applyRunEventToNodeRuntime(event);

    const nodeLabel = event.nodeType ? ` ${event.nodeType}:${event.nodeId}` : "";
    const detail = event.detail ? ` ${JSON.stringify(event.detail)}` : "";

    eventsPane.textContent += `[${event.idx}] ${event.type}${nodeLabel}${detail}\n`;
    eventsPane.scrollTop = eventsPane.scrollHeight;

    if (event.type === "run_completed" || event.type === "run_failed") {
      clearPullTimer();
      if (state.currentRunId) {
        setTimeout(() => {
          fetchRun(state.currentRunId).catch(() => {});
        }, 150);
      }
    }
  }

  async function fetchRun(runId) {
    const data = await requestJson(`/api/runs/${runId}`);
    const run = data.run;

    runStatus.textContent = JSON.stringify(
      {
        id: run.id,
        status: run.status,
        output: run.output,
        error: run.error,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
      },
      null,
      2,
    );
  }

  async function pullRunEvents(runId, token) {
    if (token !== state.pullToken) return;
    if (!runId || runId !== state.currentRunId) return;
    clearPullTimer();

    try {
      const data = await requestJson(`/api/runs/${runId}/pull?cursor=${state.cursor}`);
      const events = data.events || [];

      for (const event of events) {
        appendEvent(event);
      }

      state.cursor = data.nextCursor || state.cursor;

      if (data.done) {
        clearPullTimer();
        await fetchRun(runId);
        return;
      }
    } catch (error) {
      runStatus.textContent = `Pull error: ${error.message}`;
      schedulePullFallback(runId, token, 1200);
      return;
    }

    if (!hasHealthyWsForRun(runId)) {
      schedulePullFallback(runId, token, 1000);
    }
  }

  function wsUrl() {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const token = getServerApiKey();
    const suffix = token ? `?token=${encodeURIComponent(token)}` : "";
    return `${protocol}://${window.location.host}/ws${suffix}`;
  }

  function ensureWs() {
    if (!state.apiAvailable) {
      return;
    }
    if (state.ws && (state.ws.readyState === WebSocket.OPEN || state.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    state.ws = new WebSocket(wsUrl());

    state.ws.addEventListener("open", () => {
      if (state.currentRunId) {
        subscribeRun(state.currentRunId);
      }
    });

    state.ws.addEventListener("message", (msg) => {
      let payload;
      try {
        payload = JSON.parse(msg.data);
      } catch {
        return;
      }

      if (payload.type === "subscribed") {
        if (payload.runId === state.currentRunId) {
          state.wsSubscribedRunId = payload.runId;
          clearPullTimer();
        }
        return;
      }

      if (payload.type !== "run.event") return;
      if (payload.runId !== state.currentRunId) return;

      appendEvent(payload.payload);
    });

    state.ws.addEventListener("close", () => {
      state.wsSubscribedRunId = "";
      if (state.currentRunId) {
        schedulePullFallback(state.currentRunId, state.pullToken, 250);
      }
      setTimeout(() => ensureWs(), 1200);
    });

    state.ws.addEventListener("error", () => {
      state.wsSubscribedRunId = "";
      if (state.currentRunId) {
        schedulePullFallback(state.currentRunId, state.pullToken, 250);
      }
    });
  }

  async function runCurrentFlow() {
    try {
      if (!state.apiAvailable) {
        throw new Error("Run requires backend runtime API. Deploy your worker or start an API server to execute flows.");
      }

      if (!state.currentFlowId) {
        await saveFlow();
      }

      let parsedInput = {};
      const raw = runInput.value.trim();
      if (raw) {
        parsedInput = JSON.parse(raw);
      }

      eventsPane.textContent = "";
      state.seenEventIds = new Set();
      state.cursor = 0;
      state.pullToken += 1;
      clearPullTimer();
      resetNodeRuntime();

      const data = await requestJson(`/api/flows/${state.currentFlowId}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: parsedInput }),
      });

      state.currentRunId = data.runId;
      state.wsSubscribedRunId = "";
      runStatus.textContent = `Run queued: ${state.currentRunId}`;

      ensureWs();
      if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        subscribeRun(state.currentRunId);
      }

      pullRunEvents(state.currentRunId, state.pullToken);
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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
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
    try {
      const generated = await generateFlowViaLlm(prompt);
      return generated;
    } catch (primaryError) {
      if (!state.apiAvailable) {
        throw primaryError;
      }
      try {
        const fallbackApi = await requestJson("/api/flows/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        return normalizeGeneratedPayload(fallbackApi, prompt);
      } catch {
        // Keep the original message when both strategies fail.
        throw primaryError;
      }
    }
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
      appendPillChatMessage("assistant", `Flow "${data.name || "Untitled"}" generated.`);
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
      appendBuildChatMessage("assistant", `Flow "${data.name || "Untitled"}" has been generated and loaded onto the canvas. Switch to Canvas mode to view and edit it.`);
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
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
        const link = d.url
          ? `<div class="deploy-log-item-meta"><a href="${escapeHtml(d.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(d.url)}</a></div>`
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
      url: entry.url || "",
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
      const agents = readJsonArrayFromLocalStorage(STORAGE_KEYS.localAgents);
      const agent = {
        id: `agent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        description,
        flow: drawflowData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      agents.unshift(agent);
      writeJsonArrayToLocalStorage(STORAGE_KEYS.localAgents, agents.slice(0, 200));
      if (deployStatus) { deployStatus.textContent = `Agent "${name}" saved locally (${agent.id}).`; deployStatus.className = "deploy-status success"; }
      if (typeof VoyagerToast !== "undefined") {
        VoyagerToast.success({ title: "Saved locally", message: `${name} is ready for deploy.` });
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
    const accountId = getCloudflareAccountId();

    setConnectionBadge(githubConnectionState, hasGh, "Connected");
    setConnectionBadge(cloudflareConnectionState, hasCf, accountId ? "Connected" : "Connected (set account)");

    const cfMissing = document.getElementById("deployCfMissing");
    if (cfMissing) {
      cfMissing.style.display = hasCf && accountId ? "none" : "";
    }

    const ghMissing = document.getElementById("deployGhMissing");
    if (ghMissing) {
      ghMissing.style.display = hasGh ? "none" : "";
    }
  }

  async function validateGithubToken(token) {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.login) {
      throw new Error(data?.message || `GitHub validation failed (${res.status})`);
    }
    return data.login;
  }

  async function validateCloudflareToken(token) {
    const res = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      const firstError = Array.isArray(data?.errors) && data.errors[0] ? data.errors[0].message : "";
      throw new Error(firstError || `Cloudflare validation failed (${res.status})`);
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
      if (typeof VoyagerToast !== "undefined") {
        VoyagerToast.success({ title: "GitHub connected", message: `Signed in as ${login}` });
      }
      refreshDeployConnectionState();
      updateAuthUiNavSignals();
      await loadGithubRepos();
    } catch (error) {
      if (typeof VoyagerToast !== "undefined") {
        VoyagerToast.error({ title: "GitHub connect failed", message: error.message || "Token rejected." });
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
      if (typeof VoyagerToast !== "undefined") {
        VoyagerToast.success({ title: "Cloudflare connected", message: "Token verified for this browser session." });
      }
      refreshDeployConnectionState();
      updateAuthUiNavSignals();
    } catch (error) {
      if (typeof VoyagerToast !== "undefined") {
        VoyagerToast.error({ title: "Cloudflare connect failed", message: error.message || "Token rejected." });
      }
    }
  }

  function disconnectGithub() {
    writeSession(STORAGE_KEYS.oauthGithubToken, "");
    refreshDeployConnectionState();
    updateAuthUiNavSignals();
    if (typeof VoyagerToast !== "undefined") {
      VoyagerToast.info({ title: "GitHub disconnected", message: "Session token removed." });
    }
  }

  function disconnectCloudflare() {
    writeSession(STORAGE_KEYS.oauthCloudflareToken, "");
    refreshDeployConnectionState();
    updateAuthUiNavSignals();
    if (typeof VoyagerToast !== "undefined") {
      VoyagerToast.info({ title: "Cloudflare disconnected", message: "Session token removed." });
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
  }

  function saveLlmConfig() {
    const endpoint = String(llmEndpointInput?.value || "").trim();
    const apiKey = String(llmApiKeyInput?.value || "").trim();
    const model = String(llmModelInput?.value || "").trim();

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

    writeLocal(STORAGE_KEYS.llmEndpoint, endpoint);
    writeLocal(STORAGE_KEYS.llmModel, model);
    writeSession(STORAGE_KEYS.llmApiKeySession, apiKey);
    setLlmStatus("LLM provider saved for this browser session.", "success");
  }

  function loadLlmConfig() {
    const cfg = getLlmConfig();
    if (llmEndpointInput) llmEndpointInput.value = cfg.endpoint || "";
    if (llmApiKeyInput) llmApiKeyInput.value = cfg.apiKey || "";
    if (llmModelInput) llmModelInput.value = cfg.model || "";
    if (cfg.endpoint && cfg.apiKey && cfg.model) {
      setLlmStatus("LLM provider configured.", "success");
    } else {
      setLlmStatus("Set endpoint, API key, and model for static generation.", null);
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

  function sanitizeWorkerName(input, fallback = "voyager-agent") {
    const normalized = String(input || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");
    return normalized || fallback;
  }

  // ── Generate worker script from flow ──
  function generateWorkerScript(name, description) {
    const drawflowData = editor ? editor.export() : {};
    const safeName = JSON.stringify(name);
    const safeDesc = (description || "").replace(/\*\//g, "* /");
    return `// Generated by Voyager IDE
// Agent: ${safeDesc ? name.replace(/\n/g, " ") : "Unnamed"}
// ${safeDesc}

const FLOW = ${JSON.stringify(drawflowData, null, 2)};
const AGENT_NAME = ${safeName};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization,x-debug-token",
    },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return json({ ok: true });
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({
        ok: true,
        agent: AGENT_NAME,
        nodeCount: Object.keys(FLOW?.drawflow?.Home?.data || {}).length,
      });
    }

    if (url.pathname === "/flow") {
      const expected = String(env.DEBUG_FLOW_TOKEN || "").trim();
      const got = String(request.headers.get("x-debug-token") || "").trim();
      if (!expected || got !== expected) {
        return json({ error: "Unauthorized." }, 401);
      }
      return json({ flow: FLOW });
    }

    if (request.method === "POST") {
      let input = null;
      try {
        input = await request.json();
      } catch {
        // Keep null.
      }
      return json({
        ok: true,
        agent: AGENT_NAME,
        received: input !== null,
        note: "Attach your own runtime/LLM handler to execute FLOW.",
      });
    }

    return json(
      {
        agent: AGENT_NAME,
        status: "ready",
        endpoints: ["/health", "/flow (debug-token)", "/ (POST)"],
      },
      200,
    );
  },
};
`;
  }

  // ── Deploy to Cloudflare ──
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
      if (typeof VoyagerToast !== "undefined") VoyagerToast.warning({ title: "Missing fields", message: "Agent name and worker name are required." });
      return;
    }

    const apiToken = getCloudflareToken();
    const accountId = getCloudflareAccountId();
    if (!apiToken || !accountId) {
      if (typeof VoyagerToast !== "undefined") VoyagerToast.warning({ title: "Missing connection", message: "Connect Cloudflare and set Account ID." });
      return;
    }
    writeLocal(STORAGE_KEYS.cloudflareAccountId, accountId);

    const progress = document.getElementById("deployCfProgress");
    const steps = document.getElementById("deployCfSteps");
    const result = document.getElementById("deployCfResult");
    const btn = document.getElementById("deployCfBtn");
    if (progress) progress.style.display = "";
    if (result) { result.style.display = "none"; result.className = "deploy-result"; }
    if (btn) { btn.disabled = true; btn.textContent = "Deploying..."; }
    if (steps) steps.innerHTML = '<div class="deploy-step active"><span class="deploy-step-icon"><svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></span><span>Deploying to Cloudflare...</span></div>';

    try {
      const script = generateWorkerScript(name, description);
      const deployUrl = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts/${encodeURIComponent(workerName)}`;
      const res = await fetch(deployUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/javascript",
        },
        body: script,
      });
      const data = await res.json().catch(() => null);
      if (!(res.ok && data?.success)) {
        const errMessage = Array.isArray(data?.errors) && data.errors[0]
          ? data.errors[0].message
          : data?.error || `Deploy failed (${res.status})`;
        throw new Error(errMessage);
      }

      let workerUrl = "";
      try {
        const subRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/subdomain`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        });
        const subData = await subRes.json().catch(() => null);
        if (subRes.ok && subData?.success && subData?.result?.subdomain) {
          workerUrl = `https://${workerName}.${subData.result.subdomain}.workers.dev`;
        }
      } catch {
        // Keep empty URL and fall back to dashboard.
      }

      const dashboardUrl = `https://dash.cloudflare.com/?to=/:account/workers/services/view/${encodeURIComponent(workerName)}/production`;
      const url = workerUrl || dashboardUrl;
      const safeUrl = escapeHtml(url);
      if (result) {
        result.className = "deploy-result success";
        result.innerHTML = `Deployed successfully!<div class="result-url"><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a><button class="copy-url" data-url="${safeUrl}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div>`;
        result.querySelector(".copy-url")?.addEventListener("click", function() {
          navigator.clipboard.writeText(url);
        });
        result.style.display = "";
      }
      if (steps) steps.innerHTML = '<div class="deploy-step completed"><span class="deploy-step-icon">&#x2713;</span><span>Deployed</span></div>';
      appendDeploymentLog({
        id: `cf_${Date.now().toString(36)}`,
        name,
        target: targetSelect?.value || "cloudflare_workers",
        status: "generated",
        updatedAt: new Date().toISOString(),
        url,
      });
      loadDeployments();
      if (typeof VoyagerToast !== "undefined") VoyagerToast.success({ title: "Deployed", message: url });
    } catch (err) {
      if (result) {
        result.className = "deploy-result error";
        result.textContent = err.message;
        result.style.display = "";
      }
      if (steps) steps.innerHTML = '<div class="deploy-step error"><span class="deploy-step-icon">&#x2717;</span><span>Failed</span></div>';
      if (typeof VoyagerToast !== "undefined") VoyagerToast.error({ title: "Deploy failed", message: err.message });
    } finally {
      if (progress) { const bar = progress.querySelector(".progress-bar"); if (bar) bar.style.display = "none"; }
      if (btn) { btn.disabled = false; btn.textContent = "Deploy to Cloudflare"; }
    }
  }

  function toBase64Utf8(value) {
    return btoa(unescape(encodeURIComponent(value)));
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
    const message = messageInput ? messageInput.value.trim() : "Deploy agent via Voyager";

    if (!name || !repoFullName) {
      if (typeof VoyagerToast !== "undefined") VoyagerToast.warning({ title: "Missing fields", message: "Agent name and repository are required." });
      return;
    }

    const token = getGithubToken();
    if (!token) {
      if (typeof VoyagerToast !== "undefined") VoyagerToast.warning({ title: "Missing connection", message: "Connect GitHub OAuth first." });
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
      const workerName = sanitizeWorkerName(name);
      const script = generateWorkerScript(name, description);
      const wranglerConfig = [
        `name = "${workerName}"`,
        'main = "src/worker.js"',
        `compatibility_date = "${new Date().toISOString().split("T")[0]}"`,
        "",
      ].join("\n");

      await upsertGithubFile(owner, repo, branch, token, "src/worker.js", script, message);
      const wranglerCommit = await upsertGithubFile(owner, repo, branch, token, "wrangler.toml", wranglerConfig, message);

      const commitUrl = String(wranglerCommit?.commit?.html_url || "");
      if (result) {
        result.className = "deploy-result success";
        result.innerHTML = commitUrl
          ? `Pushed to GitHub!<div class="result-url"><a href="${escapeHtml(commitUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(commitUrl)}</a></div>`
          : "Pushed to GitHub!";
        result.style.display = "";
      }

      appendDeploymentLog({
        id: `gh_${Date.now().toString(36)}`,
        name,
        target: "github",
        status: "generated",
        updatedAt: new Date().toISOString(),
        url: commitUrl,
      });
      loadDeployments();
      if (typeof VoyagerToast !== "undefined") VoyagerToast.success({ title: "Pushed to GitHub", message: repoFullName });
    } catch (err) {
      if (result) {
        result.className = "deploy-result error";
        result.textContent = err.message;
        result.style.display = "";
      }
      if (typeof VoyagerToast !== "undefined") VoyagerToast.error({ title: "Push failed", message: err.message });
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
    if (connectGithubBtn) connectGithubBtn.addEventListener("click", () => connectGithub());
    if (disconnectGithubBtn) disconnectGithubBtn.addEventListener("click", () => disconnectGithub());
    if (connectCloudflareBtn) connectCloudflareBtn.addEventListener("click", () => connectCloudflare());
    if (disconnectCloudflareBtn) disconnectCloudflareBtn.addEventListener("click", () => disconnectCloudflare());
    if (saveLlmConfigBtn) saveLlmConfigBtn.addEventListener("click", () => saveLlmConfig());
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
        const savedMode = localStorage.getItem("voyager_editor_mode");
        if (savedMode === "canvas" || savedMode === "deploy") {
          state.editorMode = savedMode;
        } else {
          state.editorMode = "chat";
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
      try {
        await refreshFlowList();
      } catch {
        state.apiAvailable = false;
        if (runStatus) {
          runStatus.textContent = "Static mode: API server unavailable. Using local browser storage.";
        }
      }
      flowNameInput.value = "Untitled Flow";
      createStarterFlow();
      if (state.apiAvailable) {
        ensureWs();
      }
      try {
        loadEditorChatAgents();
      } catch {
        // Optional API-backed editor chat list.
      }
      loadDeployments();
      if (runStatus && !runStatus.textContent) {
        runStatus.textContent = "Ready.";
      }
    } catch (error) {
      runStatus.textContent = `Boot error: ${error.message}`;
    }
  }

  boot();
})();
