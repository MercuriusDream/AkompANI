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
});

describe("executor security defaults", () => {
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
});
