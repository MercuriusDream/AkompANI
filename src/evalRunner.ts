import { executeFlowRun } from "./executor";
import { EvalCase, EvalCaseResult, EvalRunRecord, FlowRecord } from "./types";
import { evaluateExpression, makeId, nowIso } from "./utils";

interface RunFlowEvalSuiteOptions {
  flow: FlowRecord;
  cases: EvalCase[];
  initialVars?: Record<string, unknown>;
  agentId?: string;
  agentInstruction?: string;
  maxSteps?: number;
}

function caseName(input: EvalCase, idx: number): string {
  const name = (input.name || "").trim();
  return name || `case_${idx + 1}`;
}

export async function runFlowEvalSuite(options: RunFlowEvalSuiteOptions): Promise<EvalRunRecord> {
  const startedAt = nowIso();
  const results: EvalCaseResult[] = [];

  let passedCount = 0;

  for (let idx = 0; idx < options.cases.length; idx += 1) {
    const item = options.cases[idx];
    const name = caseName(item, idx);
    const started = Date.now();

    try {
      const output = await executeFlowRun({
        flow: options.flow,
        input: item.input,
        initialVars: options.initialVars,
        agentInstruction: options.agentInstruction,
        maxSteps: options.maxSteps,
        onEvent: () => undefined,
      });

      const durationMs = Date.now() - started;
      let passed = true;
      let assertion: EvalCaseResult["assertion"];

      const expr = (item.expectExpr || "").trim();
      if (expr) {
        const value = evaluateExpression(expr, {
          input: item.input,
          vars: {
            ...(options.initialVars || {}),
          },
          last: output,
          output,
        });
        assertion = {
          expression: expr,
          value,
        };
        passed = Boolean(value);
      }

      if (typeof item.maxDurationMs === "number" && item.maxDurationMs > 0) {
        if (durationMs > item.maxDurationMs) {
          passed = false;
        }
      }

      if (passed) {
        passedCount += 1;
      }

      results.push({
        name,
        passed,
        durationMs,
        output,
        assertion,
      });
    } catch (error) {
      const durationMs = Date.now() - started;
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        name,
        passed: false,
        durationMs,
        error: message,
      });
    }
  }

  const total = results.length;
  const failed = total - passedCount;

  return {
    id: makeId("eval"),
    flowId: options.flow.id,
    agentId: options.agentId,
    status: "completed",
    startedAt,
    finishedAt: nowIso(),
    summary: {
      total,
      passed: passedCount,
      failed,
      passRate: total === 0 ? 0 : Number(((passedCount / total) * 100).toFixed(2)),
    },
    cases: results,
  };
}
