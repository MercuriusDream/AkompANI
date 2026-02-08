import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import { DataStore } from "../src/store";

async function withTempStore(run: (store: DataStore, dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), "voyager-store-test-"));
  const store = new DataStore(dir);
  try {
    await store.init();
    await run(store, dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("store concurrency and indexing", () => {
  test("enforces thread message cap under concurrent reservations", async () => {
    await withTempStore(async (store) => {
      const thread = await store.createThread({
        agentId: "agent_a",
        title: "Concurrent limit thread",
      });

      const [a, b] = await Promise.all([
        store.reserveThreadMessageSlots({
          threadId: thread.id,
          maxThreadMessages: 1,
          slots: 1,
        }),
        store.reserveThreadMessageSlots({
          threadId: thread.id,
          maxThreadMessages: 1,
          slots: 1,
        }),
      ]);

      const grantedCount = [a.granted, b.granted].filter(Boolean).length;
      expect(grantedCount).toBe(1);
    });
  });

  test("tracks message index, latest caches, and debounced run-event flush", async () => {
    await withTempStore(async (store, dir) => {
      const thread = await store.createThread({
        agentId: "agent_b",
        title: "Indexed thread",
      });

      const reservation = await store.reserveThreadMessageSlots({
        threadId: thread.id,
        maxThreadMessages: 2,
        slots: 2,
      });
      expect(reservation.granted).toBe(true);
      expect(reservation.reservationId).toBeTruthy();

      const first = await store.addThreadMessage({
        threadId: thread.id,
        role: "user",
        content: "hello",
        reservationId: reservation.reservationId,
      });
      const second = await store.addThreadMessage({
        threadId: thread.id,
        role: "assistant",
        content: "world",
        reservationId: reservation.reservationId,
      });

      expect(Boolean(first)).toBe(true);
      expect(Boolean(second)).toBe(true);
      expect(store.getThreadMessageCount(thread.id)).toBe(2);
      expect(store.listThreadMessages(thread.id).length).toBe(2);

      const over = await store.reserveThreadMessageSlots({
        threadId: thread.id,
        maxThreadMessages: 2,
        slots: 1,
      });
      expect(over.granted).toBe(false);

      const run = await store.createRun("flow_a", { ok: true });
      await store.appendRunEvent(run.id, {
        ts: "2026-01-01T00:00:00.000Z",
        type: "node_log",
        detail: { message: "event" },
      });
      await store.flushRunsSave();

      const runsRaw = JSON.parse(await readFile(path.join(dir, "runs.json"), "utf8"));
      expect(runsRaw[run.id].events.length).toBe(1);

      await store.saveEvalRun({
        id: "eval_old",
        flowId: "flow_a",
        agentId: "agent_eval",
        status: "completed",
        startedAt: "2026-01-01T00:00:00.000Z",
        finishedAt: "2026-01-01T00:00:01.000Z",
        summary: { total: 1, passed: 1, failed: 0, passRate: 100 },
        cases: [],
      });
      await store.saveEvalRun({
        id: "eval_new",
        flowId: "flow_a",
        agentId: "agent_eval",
        status: "completed",
        startedAt: "2026-01-02T00:00:00.000Z",
        finishedAt: "2026-01-02T00:00:01.000Z",
        summary: { total: 1, passed: 1, failed: 0, passRate: 100 },
        cases: [],
      });
      expect(store.getLatestEvalRunForAgent("agent_eval")?.id).toBe("eval_new");

      await store.saveDeployment({
        id: "deploy_failed",
        flowId: "flow_a",
        agentId: "agent_eval",
        target: "cloudflare_workers",
        status: "failed",
        artifactPath: "",
        files: [],
        config: {
          workerName: "w",
          flowId: "flow_a",
          agentId: "agent_eval",
          originUrl: "https://example.com",
          outputDir: dir,
          compatibilityDate: "2026-01-01",
          waitForCompletion: false,
          requireWorkerToken: true,
        },
        error: "failed",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:01.000Z",
      });
      await store.saveDeployment({
        id: "deploy_generated",
        flowId: "flow_a",
        agentId: "agent_eval",
        target: "cloudflare_workers",
        status: "generated",
        artifactPath: "/tmp/artifact",
        files: [],
        config: {
          workerName: "w",
          flowId: "flow_a",
          agentId: "agent_eval",
          originUrl: "https://example.com",
          outputDir: dir,
          compatibilityDate: "2026-01-02",
          waitForCompletion: false,
          requireWorkerToken: true,
        },
        createdAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:01.000Z",
      });
      expect(store.getLatestGeneratedDeploymentForAgent("agent_eval")?.id).toBe("deploy_generated");
    });
  });
});
