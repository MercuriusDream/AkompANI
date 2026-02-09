import { afterEach, describe, expect, test } from "bun:test";

import { executeFlowRun } from "../src/executor";
import { DrawflowExport, FlowRecord } from "../src/types";

function makeFlow(id: string, name: string, drawflow: DrawflowExport): FlowRecord {
  const now = new Date().toISOString();
  return {
    id,
    name,
    drawflow,
    createdAt: now,
    updatedAt: now,
  };
}

function makeLinearDrawflow(node2Name: string, node2Data: Record<string, unknown>): DrawflowExport {
  return {
    drawflow: {
      Home: {
        data: {
          "1": {
            id: 1,
            name: "start",
            data: {},
            inputs: {},
            outputs: {
              output_1: {
                connections: [{ node: "2", output: "input_1" }],
              },
            },
          },
          "2": {
            id: 2,
            name: node2Name,
            data: node2Data,
            inputs: {
              input_1: {
                connections: [{ node: "1", input: "output_1" }],
              },
            },
            outputs: {
              output_1: {
                connections: [{ node: "3", output: "input_1" }],
              },
            },
          },
          "3": {
            id: 3,
            name: "end",
            data: { returnExpr: "last" },
            inputs: {
              input_1: {
                connections: [{ node: "2", input: "output_1" }],
              },
            },
            outputs: {},
          },
        },
      },
    },
  };
}

const originalAllowScripts = process.env.ALLOW_SCRIPT_NODES;
const originalAllowedHosts = process.env.HTTP_NODE_ALLOWED_HOSTS;
const originalAllowPrivateNet = process.env.HTTP_NODE_ALLOW_PRIVATE_NETWORK;
const originalFetch = globalThis.fetch;

afterEach(() => {
  if (originalAllowScripts === undefined) {
    delete process.env.ALLOW_SCRIPT_NODES;
  } else {
    process.env.ALLOW_SCRIPT_NODES = originalAllowScripts;
  }

  if (originalAllowedHosts === undefined) {
    delete process.env.HTTP_NODE_ALLOWED_HOSTS;
  } else {
    process.env.HTTP_NODE_ALLOWED_HOSTS = originalAllowedHosts;
  }

  if (originalAllowPrivateNet === undefined) {
    delete process.env.HTTP_NODE_ALLOW_PRIVATE_NETWORK;
  } else {
    process.env.HTTP_NODE_ALLOW_PRIVATE_NETWORK = originalAllowPrivateNet;
  }

  if (originalFetch) {
    globalThis.fetch = originalFetch;
  } else {
    delete (globalThis as { fetch?: typeof fetch }).fetch;
  }
});

describe("executor security defaults", () => {
  test("emits run_failed when execution errors", async () => {
    const events: string[] = [];

    const flow = makeFlow(
      "flow_assert_failure",
      "Assert Failure",
      makeLinearDrawflow("assert", {
        condition: "false",
        message: "boom",
      }),
    );

    await expect(
      executeFlowRun({
        flow,
        input: {},
        onEvent: (event) => {
          events.push(event.type);
        },
      }),
    ).rejects.toThrow("Assert node");

    expect(events).toContain("run_failed");
  });

  test("disables script nodes unless explicitly enabled", async () => {
    delete process.env.ALLOW_SCRIPT_NODES;

    const flow = makeFlow(
      "flow_script_disabled",
      "Script Disabled",
      makeLinearDrawflow("typescript_script", {
        code: "const result = 7;",
        timeout: 500,
      }),
    );

    await expect(
      executeFlowRun({
        flow,
        input: {},
        onEvent: () => undefined,
      }),
    ).rejects.toThrow("disabled by default");
  });

  test("blocks private host targets in http node by default", async () => {
    delete process.env.HTTP_NODE_ALLOWED_HOSTS;
    delete process.env.HTTP_NODE_ALLOW_PRIVATE_NETWORK;

    const flow = makeFlow(
      "flow_http_private_block",
      "HTTP Private Block",
      makeLinearDrawflow("http", {
        method: "GET",
        url: "http://127.0.0.1:8080/health",
        storeAs: "httpResult",
      }),
    );

    await expect(
      executeFlowRun({
        flow,
        input: {},
        onEvent: () => undefined,
      }),
    ).rejects.toThrow("blocked private host");
  });

  test("accepts allowlist entries that include schemes, ports, or paths", async () => {
    process.env.HTTP_NODE_ALLOWED_HOSTS =
      "https://api.example.com/v1,example.org:443,*.example.net/path";

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as typeof fetch;

    const flow = makeFlow(
      "flow_http_allowlist_normalization",
      "HTTP Allowlist Normalization",
      makeLinearDrawflow("http", {
        method: "GET",
        url: "https://api.example.com/v1/status",
        storeAs: "httpResult",
      }),
    );

    const result = await executeFlowRun({
      flow,
      input: {},
      onEvent: () => undefined,
    });

    expect(result).toMatchObject({
      status: 200,
      ok: true,
      data: { ok: true },
    });
  });

  test("allows wildcard allowlist entries without requiring exact host match", async () => {
    process.env.HTTP_NODE_ALLOWED_HOSTS = "*.example.com";
    delete process.env.HTTP_NODE_ALLOW_PRIVATE_NETWORK;

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as typeof fetch;

    const flow = makeFlow(
      "flow_http_wildcard_allow",
      "HTTP Wildcard Allow",
      makeLinearDrawflow("http", {
        method: "GET",
        url: "https://api.example.com/health",
        storeAs: "httpResult",
      }),
    );

    const result = await executeFlowRun({
      flow,
      input: {},
      onEvent: () => undefined,
    });

    expect(result).toMatchObject({
      status: 200,
      ok: true,
      data: { ok: true },
    });
  });

  test("honors allowlist entries that include ports", async () => {
    delete process.env.HTTP_NODE_ALLOW_PRIVATE_NETWORK;
    process.env.HTTP_NODE_ALLOWED_HOSTS = "127.0.0.1:8080";

    globalThis.fetch = (async () =>
      new Response("ok", {
        status: 200,
        headers: { "content-type": "text/plain" },
      })) as typeof fetch;

    const flow = makeFlow(
      "flow_http_allowlist_port",
      "HTTP Allowlist Port",
      makeLinearDrawflow("http", {
        method: "GET",
        url: "http://127.0.0.1:8080/health",
        storeAs: "httpResult",
      }),
    );

    const result = await executeFlowRun({
      flow,
      input: {},
      onEvent: () => undefined,
    });

    expect(result).toMatchObject({
      status: 200,
      ok: true,
      data: "ok",
    });
  });

  test("allows allowlist entries that include scheme or path", async () => {
    process.env.HTTP_NODE_ALLOWED_HOSTS = "https://api.example.com/path";
    delete process.env.HTTP_NODE_ALLOW_PRIVATE_NETWORK;

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ ok: "allowed" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as typeof fetch;

    const flow = makeFlow(
      "flow_http_allowlist_scheme",
      "HTTP Allowlist Scheme",
      makeLinearDrawflow("http", {
        method: "GET",
        url: "https://api.example.com/health",
        storeAs: "httpResult",
      }),
    );

    const result = await executeFlowRun({
      flow,
      input: {},
      onEvent: () => undefined,
    });

    expect(result).toMatchObject({
      status: 200,
      ok: true,
      data: { ok: "allowed" },
    });
  });
});
