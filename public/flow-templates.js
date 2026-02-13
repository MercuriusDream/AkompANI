/**
 * AkompANI — Flow Template Gallery
 * Pre-built agent flows users can one-click apply.
 */

window.FLOW_TEMPLATE_CATEGORIES = [
  { id: "all",             label: "All" },
  { id: "ai_agents",       label: "AI Agents" },
  { id: "api_webhooks",    label: "API & Webhooks" },
  { id: "data_processing", label: "Data Processing" },
];

window.FLOW_TEMPLATES = [
  /* ── 1. Customer Support Bot ── */
  {
    id: "tpl_customer_support",
    name: "Customer Support Bot",
    description: "Classify incoming support messages with an LLM and route negative sentiment to escalation.",
    category: "ai_agents",
    difficulty: "intermediate",
    nodeCount: 6,
    color: "#2da6be",
    drawflow: {
      drawflow: { Home: { data: {
        "1": {
          id: 1, name: "route_post", pos_x: 100, pos_y: 240,
          data: { path: "/api/support", requireAuth: "false", parseBody: "json" },
          inputs: {},
          outputs: { output_1: { connections: [{ node: "2", output: "input_1" }] } },
        },
        "2": {
          id: 2, name: "llm_chat", pos_x: 360, pos_y: 240,
          data: { model: "gpt-4.1-mini", systemPrompt: "You are a support agent. Analyse the customer message and respond helpfully. Start your reply with [POSITIVE] or [NEGATIVE] to indicate sentiment.", userPrompt: "{{json input.body}}", historyVar: "", maxTokens: 512, temperature: 0.4, storeAs: "reply" },
          inputs: { input_1: { connections: [{ node: "1", input: "output_1" }] } },
          outputs: { output_1: { connections: [{ node: "3", output: "input_1" }] } },
        },
        "3": {
          id: 3, name: "if", pos_x: 620, pos_y: 240,
          data: { condition: "vars.reply && vars.reply.startsWith('[NEGATIVE]')" },
          inputs: { input_1: { connections: [{ node: "2", input: "output_1" }] } },
          outputs: {
            output_1: { connections: [{ node: "4", output: "input_1" }] },
            output_2: { connections: [{ node: "5", output: "input_1" }] },
          },
        },
        "4": {
          id: 4, name: "http", pos_x: 880, pos_y: 140,
          data: { method: "POST", url: "https://hooks.example.com/escalate", headers: { "content-type": "application/json" }, body: "{{json vars.reply}}", storeAs: "escalation" },
          inputs: { input_1: { connections: [{ node: "3", input: "output_1" }] } },
          outputs: { output_1: { connections: [{ node: "6", output: "input_1" }] } },
        },
        "5": {
          id: 5, name: "respond_json", pos_x: 880, pos_y: 340,
          data: { statusCode: 200, bodyExpr: "({ message: vars.reply, sentiment: 'positive' })", headersExpr: "{}" },
          inputs: { input_1: { connections: [{ node: "3", input: "output_2" }] } },
          outputs: {},
        },
        "6": {
          id: 6, name: "respond_json", pos_x: 1140, pos_y: 140,
          data: { statusCode: 200, bodyExpr: "({ message: 'Escalated to support team', ticket: vars.escalation })", headersExpr: "{}" },
          inputs: { input_1: { connections: [{ node: "4", input: "output_1" }] } },
          outputs: {},
        },
      } } },
    },
  },

  /* ── 2. RAG Pipeline ── */
  {
    id: "tpl_rag_pipeline",
    name: "RAG Pipeline",
    description: "Embed a query, search a vector store, and generate a grounded answer with retrieved context.",
    category: "ai_agents",
    difficulty: "advanced",
    nodeCount: 5,
    color: "#6366f1",
    drawflow: {
      drawflow: { Home: { data: {
        "1": {
          id: 1, name: "route_post", pos_x: 100, pos_y: 240,
          data: { path: "/api/ask", requireAuth: "false", parseBody: "json" },
          inputs: {},
          outputs: { output_1: { connections: [{ node: "2", output: "input_1" }] } },
        },
        "2": {
          id: 2, name: "embeddings", pos_x: 360, pos_y: 240,
          data: { model: "text-embedding-3-small", inputExpr: "input.body.question", storeAs: "queryEmbedding" },
          inputs: { input_1: { connections: [{ node: "1", input: "output_1" }] } },
          outputs: { output_1: { connections: [{ node: "3", output: "input_1" }] } },
        },
        "3": {
          id: 3, name: "db_query", pos_x: 620, pos_y: 240,
          data: { driver: "postgres", connectionExpr: "vars.dbUrl", query: "SELECT content, similarity(embedding, $1) AS score FROM documents ORDER BY score DESC LIMIT 5", params: ["{{json vars.queryEmbedding}}"], storeAs: "context" },
          inputs: { input_1: { connections: [{ node: "2", input: "output_1" }] } },
          outputs: { output_1: { connections: [{ node: "4", output: "input_1" }] } },
        },
        "4": {
          id: 4, name: "llm_chat", pos_x: 880, pos_y: 240,
          data: { model: "gpt-4.1-mini", systemPrompt: "Answer the user question using ONLY the provided context. If the context does not contain the answer, say so.", userPrompt: "Context:\n{{json vars.context}}\n\nQuestion: {{input.body.question}}", historyVar: "", maxTokens: 1024, temperature: 0.3, storeAs: "answer" },
          inputs: { input_1: { connections: [{ node: "3", input: "output_1" }] } },
          outputs: { output_1: { connections: [{ node: "5", output: "input_1" }] } },
        },
        "5": {
          id: 5, name: "respond_json", pos_x: 1140, pos_y: 240,
          data: { statusCode: 200, bodyExpr: "({ answer: vars.answer, sources: vars.context })", headersExpr: "{}" },
          inputs: { input_1: { connections: [{ node: "4", input: "output_1" }] } },
          outputs: {},
        },
      } } },
    },
  },

  /* ── 3. Webhook Processor ── */
  {
    id: "tpl_webhook_processor",
    name: "Webhook Processor",
    description: "Receive a webhook, transform the payload, and conditionally forward it to an external API.",
    category: "api_webhooks",
    difficulty: "beginner",
    nodeCount: 5,
    color: "#0f8f67",
    drawflow: {
      drawflow: { Home: { data: {
        "1": {
          id: 1, name: "route_post", pos_x: 100, pos_y: 240,
          data: { path: "/webhook/inbound", requireAuth: "false", parseBody: "json" },
          inputs: {},
          outputs: { output_1: { connections: [{ node: "2", output: "input_1" }] } },
        },
        "2": {
          id: 2, name: "transform", pos_x: 360, pos_y: 240,
          data: { expression: "({ event: input.body.event, data: input.body.data, ts: Date.now() })", storeAs: "payload" },
          inputs: { input_1: { connections: [{ node: "1", input: "output_1" }] } },
          outputs: { output_1: { connections: [{ node: "3", output: "input_1" }] } },
        },
        "3": {
          id: 3, name: "if", pos_x: 620, pos_y: 240,
          data: { condition: "vars.payload.event !== 'ping'" },
          inputs: { input_1: { connections: [{ node: "2", input: "output_1" }] } },
          outputs: {
            output_1: { connections: [{ node: "4", output: "input_1" }] },
            output_2: { connections: [{ node: "5", output: "input_1" }] },
          },
        },
        "4": {
          id: 4, name: "http", pos_x: 880, pos_y: 160,
          data: { method: "POST", url: "https://api.example.com/events", headers: { "content-type": "application/json" }, body: "{{json vars.payload}}", storeAs: "forwardResult" },
          inputs: { input_1: { connections: [{ node: "3", input: "output_1" }] } },
          outputs: { output_1: { connections: [{ node: "5", output: "input_1" }] } },
        },
        "5": {
          id: 5, name: "respond_json", pos_x: 1140, pos_y: 240,
          data: { statusCode: 200, bodyExpr: "({ ok: true })", headersExpr: "{}" },
          inputs: { input_1: { connections: [{ node: "3", input: "output_2" }, { node: "4", input: "output_1" }] } },
          outputs: {},
        },
      } } },
    },
  },

  /* ── 4. Content Moderator ── */
  {
    id: "tpl_content_moderator",
    name: "Content Moderator",
    description: "Classify user-submitted text as safe, flagged, or blocked using an LLM classifier.",
    category: "ai_agents",
    difficulty: "intermediate",
    nodeCount: 4,
    color: "#ef476f",
    drawflow: {
      drawflow: { Home: { data: {
        "1": {
          id: 1, name: "route_post", pos_x: 100, pos_y: 240,
          data: { path: "/api/moderate", requireAuth: "false", parseBody: "json" },
          inputs: {},
          outputs: { output_1: { connections: [{ node: "2", output: "input_1" }] } },
        },
        "2": {
          id: 2, name: "classifier", pos_x: 360, pos_y: 240,
          data: { model: "gpt-4.1-mini", inputExpr: "input.body.text", labels: ["safe", "flagged", "blocked"], multiLabel: false, storeAs: "moderation" },
          inputs: { input_1: { connections: [{ node: "1", input: "output_1" }] } },
          outputs: { output_1: { connections: [{ node: "3", output: "input_1" }] } },
        },
        "3": {
          id: 3, name: "switch_case", pos_x: 620, pos_y: 240,
          data: { expression: "vars.moderation", cases: ["safe", "flagged"] },
          inputs: { input_1: { connections: [{ node: "2", input: "output_1" }] } },
          outputs: {
            output_1: { connections: [{ node: "4", output: "input_1" }] },
            output_2: { connections: [{ node: "5", output: "input_1" }] },
            output_3: { connections: [{ node: "6", output: "input_1" }] },
          },
        },
        "4": {
          id: 4, name: "respond_json", pos_x: 880, pos_y: 120,
          data: { statusCode: 200, bodyExpr: "({ status: 'approved', text: input.body.text })", headersExpr: "{}" },
          inputs: { input_1: { connections: [{ node: "3", input: "output_1" }] } },
          outputs: {},
        },
        "5": {
          id: 5, name: "respond_json", pos_x: 880, pos_y: 260,
          data: { statusCode: 200, bodyExpr: "({ status: 'review', text: input.body.text, reason: 'Content flagged for manual review' })", headersExpr: "{}" },
          inputs: { input_1: { connections: [{ node: "3", input: "output_2" }] } },
          outputs: {},
        },
        "6": {
          id: 6, name: "respond_json", pos_x: 880, pos_y: 400,
          data: { statusCode: 403, bodyExpr: "({ status: 'blocked', reason: 'Content violates policy' })", headersExpr: "{}" },
          inputs: { input_1: { connections: [{ node: "3", input: "output_3" }] } },
          outputs: {},
        },
      } } },
    },
  },

  /* ── 5. Data Sync Pipeline ── */
  {
    id: "tpl_data_sync",
    name: "Data Sync Pipeline",
    description: "Fetch data from an external API, transform it, and store the results in a database.",
    category: "data_processing",
    difficulty: "beginner",
    nodeCount: 5,
    color: "#bc7708",
    drawflow: {
      drawflow: { Home: { data: {
        "1": {
          id: 1, name: "start", pos_x: 100, pos_y: 240,
          data: {},
          inputs: {},
          outputs: { output_1: { connections: [{ node: "2", output: "input_1" }] } },
        },
        "2": {
          id: 2, name: "http", pos_x: 360, pos_y: 240,
          data: { method: "GET", url: "https://api.example.com/data", headers: {}, body: "", storeAs: "rawData" },
          inputs: { input_1: { connections: [{ node: "1", input: "output_1" }] } },
          outputs: { output_1: { connections: [{ node: "3", output: "input_1" }] } },
        },
        "3": {
          id: 3, name: "transform", pos_x: 620, pos_y: 240,
          data: { expression: "(vars.rawData.data || []).map(r => ({ id: r.id, name: r.name, updatedAt: new Date().toISOString() }))", storeAs: "rows" },
          inputs: { input_1: { connections: [{ node: "2", input: "output_1" }] } },
          outputs: { output_1: { connections: [{ node: "4", output: "input_1" }] } },
        },
        "4": {
          id: 4, name: "db_query", pos_x: 880, pos_y: 240,
          data: { driver: "postgres", connectionExpr: "vars.dbUrl", query: "INSERT INTO synced_data (id, name, updated_at) SELECT * FROM json_populate_recordset(null::synced_data, $1) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = EXCLUDED.updated_at", params: ["{{json vars.rows}}"], storeAs: "insertResult" },
          inputs: { input_1: { connections: [{ node: "3", input: "output_1" }] } },
          outputs: { output_1: { connections: [{ node: "5", output: "input_1" }] } },
        },
        "5": {
          id: 5, name: "end", pos_x: 1140, pos_y: 240,
          data: { returnExpr: "({ synced: vars.rows.length })" },
          inputs: { input_1: { connections: [{ node: "4", input: "output_1" }] } },
          outputs: {},
        },
      } } },
    },
  },

  /* ── 6. REST API Scaffold ── */
  {
    id: "tpl_rest_scaffold",
    name: "REST API Scaffold",
    description: "GET and POST endpoints with variable handling and JSON responses — a starting point for any API.",
    category: "api_webhooks",
    difficulty: "beginner",
    nodeCount: 6,
    color: "#ef476f",
    drawflow: {
      drawflow: { Home: { data: {
        "1": {
          id: 1, name: "route_get", pos_x: 100, pos_y: 140,
          data: { path: "/api/items", requireAuth: "false" },
          inputs: {},
          outputs: { output_1: { connections: [{ node: "3", output: "input_1" }] } },
        },
        "2": {
          id: 2, name: "route_post", pos_x: 100, pos_y: 380,
          data: { path: "/api/items", requireAuth: "false", parseBody: "json" },
          inputs: {},
          outputs: { output_1: { connections: [{ node: "4", output: "input_1" }] } },
        },
        "3": {
          id: 3, name: "set_var", pos_x: 360, pos_y: 140,
          data: { varName: "items", expression: "[{ id: 1, name: 'Example item' }]" },
          inputs: { input_1: { connections: [{ node: "1", input: "output_1" }] } },
          outputs: { output_1: { connections: [{ node: "5", output: "input_1" }] } },
        },
        "4": {
          id: 4, name: "set_var", pos_x: 360, pos_y: 380,
          data: { varName: "newItem", expression: "({ id: Date.now(), ...input.body })" },
          inputs: { input_1: { connections: [{ node: "2", input: "output_1" }] } },
          outputs: { output_1: { connections: [{ node: "6", output: "input_1" }] } },
        },
        "5": {
          id: 5, name: "respond_json", pos_x: 620, pos_y: 140,
          data: { statusCode: 200, bodyExpr: "({ items: vars.items })", headersExpr: "{}" },
          inputs: { input_1: { connections: [{ node: "3", input: "output_1" }] } },
          outputs: {},
        },
        "6": {
          id: 6, name: "respond_json", pos_x: 620, pos_y: 380,
          data: { statusCode: 201, bodyExpr: "({ created: vars.newItem })", headersExpr: "{}" },
          inputs: { input_1: { connections: [{ node: "4", input: "output_1" }] } },
          outputs: {},
        },
      } } },
    },
  },
];
