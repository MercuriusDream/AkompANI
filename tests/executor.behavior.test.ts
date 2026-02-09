import { describe, expect, test } from "bun:test";

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

describe("executor run lifecycle events", () => {
  test("emits run_failed event on node error", async () => {
    const flow = makeFlow(
      "flow_run_failed",
      "Run Failed",
      makeLinearDrawflow("assert", {
        condition: "false",
        message: "nope",
      }),
    );

    const events: Array<{ type: string }> = [];
    await expect(
      executeFlowRun({
        flow,
        input: {},
        onEvent: (event) => {
          events.push({ type: event.type });
        },
      }),
    ).rejects.toThrow("Assertion failed");

    const lastEvent = events[events.length - 1];
    expect(lastEvent?.type).toBe("run_failed");
  });
});
