import { promises as fs } from "node:fs";
import path from "node:path";

import {
    AuditLogRecord,
    AgentPolicy,
    AgentRecord,
    AgentReleaseRecord,
    ContextPackRecord,
    DeploymentRecord,
    EvalRunRecord,
    FlowRecord,
    RunEvent,
    RunRecord,
    RunStatus,
    ThreadMessageRecord,
    ThreadRecord,
    ThreadRole,
    ThreadStatus,
} from "./types";
import { makeId, nowIso } from "./utils";

interface FlowIndexEntry {
    id: string;
    name: string;
    updatedAt: string;
    createdAt: string;
}

type SaveTarget =
    | "flows"
    | "runs"
    | "agents"
    | "contextPacks"
    | "evals"
    | "deployments"
    | "threads"
    | "threadMessages"
    | "agentReleases"
    | "auditLogs";

interface ThreadMessageReservation {
    threadId: string;
    slots: number;
}

interface ThreadMessageReservationResult {
    granted: boolean;
    reservationId?: string;
    currentCount: number;
    reservedCount: number;
    projectedCount: number;
    maxThreadMessages: number;
}

const FLOWS_FILE = "flows.json";
const RUNS_FILE = "runs.json";
const AGENTS_FILE = "agents.json";
const CONTEXT_PACKS_FILE = "contextPacks.json";
const EVALS_FILE = "evalRuns.json";
const DEPLOYMENTS_FILE = "deployments.json";
const THREADS_FILE = "threads.json";
const THREAD_MESSAGES_FILE = "threadMessages.json";
const AGENT_RELEASES_FILE = "agentReleases.json";
const AUDIT_LOGS_FILE = "auditLogs.json";

const DEFAULT_AGENT_POLICY: AgentPolicy = {
    minEvalPassRate: 100,
    requireReleaseForChat: true,
    maxThreadMessages: 500,
};
const RUNS_SAVE_DEBOUNCE_MS = 250;

function normalizePolicy(policy?: Partial<AgentPolicy>): AgentPolicy {
    const minEvalPassRateRaw = Number(policy?.minEvalPassRate);
    const maxThreadMessagesRaw = Number(policy?.maxThreadMessages);

    return {
        minEvalPassRate:
            Number.isFinite(minEvalPassRateRaw) && minEvalPassRateRaw >= 0 && minEvalPassRateRaw <= 100
                ? minEvalPassRateRaw
                : DEFAULT_AGENT_POLICY.minEvalPassRate,
        requireReleaseForChat:
            typeof policy?.requireReleaseForChat === "boolean"
                ? policy.requireReleaseForChat
                : DEFAULT_AGENT_POLICY.requireReleaseForChat,
        maxThreadMessages:
            Number.isFinite(maxThreadMessagesRaw) && maxThreadMessagesRaw >= 10
                ? Math.floor(maxThreadMessagesRaw)
                : DEFAULT_AGENT_POLICY.maxThreadMessages,
    };
}

export class DataStore {
    private readonly dataDir: string;
    private flows: Record<string, FlowRecord> = {};
    private runs: Record<string, RunRecord> = {};
    private agents: Record<string, AgentRecord> = {};
    private contextPacks: Record<string, ContextPackRecord> = {};
    private evalRuns: Record<string, EvalRunRecord> = {};
    private deployments: Record<string, DeploymentRecord> = {};
    private threads: Record<string, ThreadRecord> = {};
    private threadMessages: Record<string, ThreadMessageRecord> = {};
    private threadMessageIdsByThread: Record<string, string[]> = {};
    private threadMessageReservationsById: Record<string, ThreadMessageReservation> = {};
    private threadMessageReservedCountByThread: Record<string, number> = {};
    private threadMessageLockChains: Record<string, Promise<void>> = {};
    private latestEvalRunByAgent: Record<string, EvalRunRecord> = {};
    private latestGeneratedDeploymentByAgent: Record<string, DeploymentRecord> = {};
    private agentReleases: Record<string, AgentReleaseRecord> = {};
    private auditLogs: AuditLogRecord[] = [];
    private saveChain: Promise<void> = Promise.resolve();
    private runsSaveTimer: NodeJS.Timeout | null = null;

    constructor(baseDir: string) {
        this.dataDir = baseDir;
    }

    async init(): Promise<void> {
        await fs.mkdir(this.dataDir, { recursive: true });
        this.flows = await this.readJson<Record<string, FlowRecord>>(FLOWS_FILE, {});
        this.runs = await this.readJson<Record<string, RunRecord>>(RUNS_FILE, {});
        this.agents = await this.readJson<Record<string, AgentRecord>>(AGENTS_FILE, {});
        this.contextPacks = await this.readJson<Record<string, ContextPackRecord>>(CONTEXT_PACKS_FILE, {});
        this.evalRuns = await this.readJson<Record<string, EvalRunRecord>>(EVALS_FILE, {});
        this.deployments = await this.readJson<Record<string, DeploymentRecord>>(DEPLOYMENTS_FILE, {});
        this.threads = await this.readJson<Record<string, ThreadRecord>>(THREADS_FILE, {});
        this.threadMessages = await this.readJson<Record<string, ThreadMessageRecord>>(THREAD_MESSAGES_FILE, {});
        this.agentReleases = await this.readJson<Record<string, AgentReleaseRecord>>(AGENT_RELEASES_FILE, {});
        this.auditLogs = await this.readJson<AuditLogRecord[]>(AUDIT_LOGS_FILE, []);
        this.rebuildThreadMessageIndexes();
        this.rebuildLatestEvalRunCache();
        this.rebuildLatestGeneratedDeploymentCache();
    }

    listFlows(): FlowIndexEntry[] {
        return Object.values(this.flows)
            .map((flow) => ({
                id: flow.id,
                name: flow.name,
                updatedAt: flow.updatedAt,
                createdAt: flow.createdAt,
            }))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }

    getFlow(id: string): FlowRecord | undefined {
        return this.flows[id];
    }

    async createFlow(payload: Pick<FlowRecord, "name" | "drawflow">): Promise<FlowRecord> {
        const now = nowIso();
        const flow: FlowRecord = {
            id: makeId("flow"),
            name: payload.name,
            drawflow: payload.drawflow,
            createdAt: now,
            updatedAt: now,
        };

        this.flows[flow.id] = flow;
        await this.queueSave("flows");
        return flow;
    }

    async updateFlow(
        id: string,
        patch: Partial<Pick<FlowRecord, "name" | "drawflow">>,
    ): Promise<FlowRecord | undefined> {
        const existing = this.flows[id];
        if (!existing) return undefined;

        const updated: FlowRecord = {
            ...existing,
            name: patch.name ?? existing.name,
            drawflow: patch.drawflow ?? existing.drawflow,
            updatedAt: nowIso(),
        };

        this.flows[id] = updated;
        await this.queueSave("flows");
        return updated;
    }

    async deleteFlow(id: string): Promise<boolean> {
        if (!this.flows[id]) return false;
        delete this.flows[id];
        await this.queueSave("flows");
        return true;
    }

    async createRun(flowId: string, input: unknown, opts?: { agentId?: string }): Promise<RunRecord> {
        const run: RunRecord = {
            id: makeId("run"),
            flowId,
            agentId: opts?.agentId,
            status: "queued",
            input,
            startedAt: nowIso(),
            events: [],
        };

        this.runs[run.id] = run;
        await this.queueSave("runs");
        return run;
    }

    getRun(id: string): RunRecord | undefined {
        return this.runs[id];
    }

    getRunEvents(id: string, cursor = 0): { events: RunEvent[]; nextCursor: number } {
        const run = this.runs[id];
        if (!run) return { events: [], nextCursor: cursor };

        const safeCursor = Number.isFinite(cursor) && cursor >= 0 ? Math.floor(cursor) : 0;
        const events = run.events.slice(safeCursor);
        return { events, nextCursor: safeCursor + events.length };
    }

    async setRunStatus(id: string, status: RunStatus): Promise<void> {
        const run = this.runs[id];
        if (!run) return;
        run.status = status;
        if (status === "completed" || status === "failed") {
            run.finishedAt = nowIso();
        }
        await this.queueSave("runs");
    }

    async appendRunEvent(id: string, event: Omit<RunEvent, "idx">): Promise<RunEvent | undefined> {
        const run = this.runs[id];
        if (!run) return undefined;

        const idx = run.events.length;
        const withIdx: RunEvent = { idx, ...event };
        run.events.push(withIdx);
        this.scheduleRunsSave();
        return withIdx;
    }

    async completeRun(id: string, output: unknown): Promise<void> {
        const run = this.runs[id];
        if (!run) return;
        run.output = output;
        run.status = "completed";
        run.finishedAt = nowIso();
        await this.queueSave("runs");
    }

    async failRun(id: string, error: string): Promise<void> {
        const run = this.runs[id];
        if (!run) return;
        run.error = error;
        run.status = "failed";
        run.finishedAt = nowIso();
        await this.queueSave("runs");
    }

    async flushRunsSave(): Promise<void> {
        await this.queueSave("runs");
    }

    listAgents(): AgentRecord[] {
        return Object.values(this.agents)
            .map((agent) => ({
                ...agent,
                policy: normalizePolicy(agent.policy),
            }))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }

    getAgent(id: string): AgentRecord | undefined {
        const agent = this.agents[id];
        if (!agent) return undefined;
        return {
            ...agent,
            policy: normalizePolicy(agent.policy),
        };
    }

    async createAgent(
        payload: Pick<
            AgentRecord,
            "name" | "description" | "flowId" | "instruction" | "contextPackIds" | "permissions" | "policy"
        >,
    ): Promise<AgentRecord> {
        const now = nowIso();
        const agent: AgentRecord = {
            id: makeId("agent"),
            name: payload.name,
            description: payload.description,
            flowId: payload.flowId,
            instruction: payload.instruction,
            contextPackIds: payload.contextPackIds,
            permissions: payload.permissions,
            policy: normalizePolicy(payload.policy),
            createdAt: now,
            updatedAt: now,
        };

        this.agents[agent.id] = agent;
        await this.queueSave("agents");
        return agent;
    }

    async updateAgent(
        id: string,
        patch: Partial<
            Pick<AgentRecord, "name" | "description" | "flowId" | "instruction" | "contextPackIds" | "permissions" | "policy">
        >,
    ): Promise<AgentRecord | undefined> {
        const existing = this.agents[id];
        if (!existing) return undefined;

        const updated: AgentRecord = {
            ...existing,
            name: patch.name ?? existing.name,
            description: patch.description ?? existing.description,
            flowId: patch.flowId ?? existing.flowId,
            instruction: patch.instruction ?? existing.instruction,
            contextPackIds: patch.contextPackIds ?? existing.contextPackIds,
            permissions: patch.permissions ?? existing.permissions,
            policy: normalizePolicy(patch.policy ?? existing.policy),
            updatedAt: nowIso(),
        };

        this.agents[id] = updated;
        await this.queueSave("agents");
        return updated;
    }

    async deleteAgent(id: string): Promise<boolean> {
        if (!this.agents[id]) return false;
        delete this.agents[id];
        await this.queueSave("agents");
        return true;
    }

    listContextPacks(): ContextPackRecord[] {
        return Object.values(this.contextPacks).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }

    getContextPack(id: string): ContextPackRecord | undefined {
        return this.contextPacks[id];
    }

    async createContextPack(
        payload: Pick<ContextPackRecord, "name" | "description" | "values" | "tags">,
    ): Promise<ContextPackRecord> {
        const now = nowIso();
        const pack: ContextPackRecord = {
            id: makeId("ctx"),
            name: payload.name,
            description: payload.description,
            values: payload.values,
            tags: payload.tags,
            createdAt: now,
            updatedAt: now,
        };

        this.contextPacks[pack.id] = pack;
        await this.queueSave("contextPacks");
        return pack;
    }

    async updateContextPack(
        id: string,
        patch: Partial<Pick<ContextPackRecord, "name" | "description" | "values" | "tags">>,
    ): Promise<ContextPackRecord | undefined> {
        const existing = this.contextPacks[id];
        if (!existing) return undefined;

        const updated: ContextPackRecord = {
            ...existing,
            name: patch.name ?? existing.name,
            description: patch.description ?? existing.description,
            values: patch.values ?? existing.values,
            tags: patch.tags ?? existing.tags,
            updatedAt: nowIso(),
        };

        this.contextPacks[id] = updated;
        await this.queueSave("contextPacks");
        return updated;
    }

    async deleteContextPack(id: string): Promise<boolean> {
        if (!this.contextPacks[id]) return false;
        delete this.contextPacks[id];
        await this.queueSave("contextPacks");
        return true;
    }

    listEvalRuns(): EvalRunRecord[] {
        return Object.values(this.evalRuns).sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
    }

    getEvalRun(id: string): EvalRunRecord | undefined {
        return this.evalRuns[id];
    }

    getLatestEvalRunForAgent(agentId: string): EvalRunRecord | undefined {
        return this.latestEvalRunByAgent[agentId];
    }

    async saveEvalRun(run: EvalRunRecord): Promise<void> {
        const previous = this.evalRuns[run.id];
        this.evalRuns[run.id] = run;
        this.updateLatestEvalRunCache(run, previous);
        await this.queueSave("evals");
    }

    listDeployments(): DeploymentRecord[] {
        return Object.values(this.deployments).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }

    getDeployment(id: string): DeploymentRecord | undefined {
        return this.deployments[id];
    }

    getLatestGeneratedDeploymentForAgent(agentId: string): DeploymentRecord | undefined {
        return this.latestGeneratedDeploymentByAgent[agentId];
    }

    async saveDeployment(record: DeploymentRecord): Promise<void> {
        const previous = this.deployments[record.id];
        this.deployments[record.id] = record;
        this.updateLatestGeneratedDeploymentCache(record, previous);
        await this.queueSave("deployments");
    }

    listAgentReleases(agentId?: string): AgentReleaseRecord[] {
        const rows = Object.values(this.agentReleases).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        if (!agentId) return rows;
        return rows.filter((item) => item.agentId === agentId);
    }

    getAgentRelease(id: string): AgentReleaseRecord | undefined {
        return this.agentReleases[id];
    }

    getLatestAgentRelease(agentId: string): AgentReleaseRecord | undefined {
        return this.listAgentReleases(agentId)[0];
    }

    async saveAgentRelease(record: AgentReleaseRecord): Promise<void> {
        this.agentReleases[record.id] = record;
        await this.queueSave("agentReleases");
    }

    async createThread(payload: {
        agentId: string;
        title: string;
        status?: ThreadStatus;
        releaseId?: string;
    }): Promise<ThreadRecord> {
        const now = nowIso();
        const thread: ThreadRecord = {
            id: makeId("thread"),
            agentId: payload.agentId,
            title: payload.title,
            status: payload.status ?? "active",
            releaseId: payload.releaseId,
            createdAt: now,
            updatedAt: now,
            lastMessageAt: undefined,
        };

        this.threads[thread.id] = thread;
        this.threadMessageIdsByThread[thread.id] = this.threadMessageIdsByThread[thread.id] ?? [];
        this.threadMessageReservedCountByThread[thread.id] = this.threadMessageReservedCountByThread[thread.id] ?? 0;
        await this.queueSave("threads");
        return thread;
    }

    getThread(id: string): ThreadRecord | undefined {
        return this.threads[id];
    }

    listThreads(agentId?: string): ThreadRecord[] {
        let rows = Object.values(this.threads);
        if (agentId) {
            rows = rows.filter((item) => item.agentId === agentId);
        }
        return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }

    async updateThread(
        id: string,
        patch: Partial<Pick<ThreadRecord, "title" | "status" | "releaseId" | "updatedAt" | "lastMessageAt">>,
    ): Promise<ThreadRecord | undefined> {
        const existing = this.threads[id];
        if (!existing) return undefined;

        const updated: ThreadRecord = {
            ...existing,
            title: patch.title ?? existing.title,
            status: patch.status ?? existing.status,
            releaseId: patch.releaseId ?? existing.releaseId,
            lastMessageAt: patch.lastMessageAt ?? existing.lastMessageAt,
            updatedAt: patch.updatedAt ?? nowIso(),
        };
        this.threads[id] = updated;
        await this.queueSave("threads");
        return updated;
    }

    async addThreadMessage(payload: {
        threadId: string;
        role: ThreadRole;
        content: string;
        runId?: string;
        metadata?: Record<string, unknown>;
        reservationId?: string;
    }): Promise<ThreadMessageRecord | undefined> {
        return this.withThreadMessageLock(payload.threadId, async () => {
            const thread = this.threads[payload.threadId];
            if (!thread) return undefined;

            if (payload.reservationId) {
                const consumed = this.consumeThreadMessageReservationSlotsUnsafe(payload.threadId, payload.reservationId, 1);
                if (!consumed) return undefined;
            }

            const message: ThreadMessageRecord = {
                id: makeId("msg"),
                threadId: payload.threadId,
                role: payload.role,
                content: payload.content,
                runId: payload.runId,
                createdAt: nowIso(),
                metadata: payload.metadata,
            };

            this.threadMessages[message.id] = message;
            this.insertThreadMessageIndex(message);
            await this.queueSave("threadMessages");

            await this.updateThread(thread.id, {
                lastMessageAt: message.createdAt,
                updatedAt: message.createdAt,
            });

            return message;
        });
    }

    listThreadMessages(threadId: string): ThreadMessageRecord[] {
        const ids = this.threadMessageIdsByThread[threadId];
        if (!ids || ids.length === 0) return [];
        const rows: ThreadMessageRecord[] = [];
        for (const id of ids) {
            const row = this.threadMessages[id];
            if (row) rows.push(row);
        }
        return rows;
    }

    getThreadMessageCount(threadId: string): number {
        return this.threadMessageIdsByThread[threadId]?.length ?? 0;
    }

    getThreadMessageProjectedCount(threadId: string): { persistedCount: number; reservedCount: number; projectedCount: number } {
        const persistedCount = this.getThreadMessageCount(threadId);
        const reservedCount = this.threadMessageReservedCountByThread[threadId] ?? 0;
        return {
            persistedCount,
            reservedCount,
            projectedCount: persistedCount + reservedCount,
        };
    }

    async reserveThreadMessageSlots(payload: {
        threadId: string;
        maxThreadMessages: number;
        slots?: number;
    }): Promise<ThreadMessageReservationResult> {
        const maxThreadMessagesRaw = Number(payload.maxThreadMessages);
        const maxThreadMessages = Number.isFinite(maxThreadMessagesRaw) && maxThreadMessagesRaw >= 1
            ? Math.floor(maxThreadMessagesRaw)
            : DEFAULT_AGENT_POLICY.maxThreadMessages;
        const slotsRaw = Number(payload.slots ?? 1);
        const slots = Number.isFinite(slotsRaw) && slotsRaw >= 1 ? Math.floor(slotsRaw) : 1;

        return this.withThreadMessageLock(payload.threadId, async () => {
            if (!this.threads[payload.threadId]) {
                return {
                    granted: false,
                    currentCount: 0,
                    reservedCount: 0,
                    projectedCount: slots,
                    maxThreadMessages,
                };
            }

            const currentCount = this.getThreadMessageCount(payload.threadId);
            const reservedCount = this.threadMessageReservedCountByThread[payload.threadId] ?? 0;
            const projectedCount = currentCount + reservedCount + slots;
            if (projectedCount > maxThreadMessages) {
                return {
                    granted: false,
                    currentCount,
                    reservedCount,
                    projectedCount,
                    maxThreadMessages,
                };
            }

            const reservationId = makeId("msgres");
            this.threadMessageReservationsById[reservationId] = {
                threadId: payload.threadId,
                slots,
            };
            this.threadMessageReservedCountByThread[payload.threadId] = reservedCount + slots;

            return {
                granted: true,
                reservationId,
                currentCount,
                reservedCount: reservedCount + slots,
                projectedCount,
                maxThreadMessages,
            };
        });
    }

    async releaseThreadMessageReservation(threadId: string, reservationId: string): Promise<boolean> {
        return this.withThreadMessageLock(threadId, async () => {
            return this.consumeThreadMessageReservationSlotsUnsafe(threadId, reservationId, Number.POSITIVE_INFINITY);
        });
    }

    async deleteThread(id: string): Promise<boolean> {
        return this.withThreadMessageLock(id, async () => {
            if (!this.threads[id]) return false;

            delete this.threads[id];
            await this.queueSave("threads");

            const messageIds = this.threadMessageIdsByThread[id] ?? [];
            if (messageIds.length > 0) {
                for (const messageId of messageIds) {
                    delete this.threadMessages[messageId];
                }
                await this.queueSave("threadMessages");
            }

            delete this.threadMessageIdsByThread[id];
            this.clearThreadMessageReservationsUnsafe(id);
            return true;
        });
    }

    listAuditLogs(filters?: {
        action?: string;
        entityType?: string;
        outcome?: "success" | "failure";
        limit?: number;
    }): AuditLogRecord[] {
        let rows = [...this.auditLogs];

        if (filters?.action) {
            rows = rows.filter((item) => item.action === filters.action);
        }
        if (filters?.entityType) {
            rows = rows.filter((item) => item.entity.type === filters.entityType);
        }
        if (filters?.outcome) {
            rows = rows.filter((item) => item.outcome === filters.outcome);
        }

        rows.sort((a, b) => b.ts.localeCompare(a.ts));

        const limit = Number(filters?.limit || 0);
        if (Number.isFinite(limit) && limit > 0) {
            return rows.slice(0, Math.floor(limit));
        }
        return rows;
    }

    async appendAuditLog(log: AuditLogRecord): Promise<void> {
        this.auditLogs.push(log);
        if (this.auditLogs.length > 10000) {
            this.auditLogs.splice(0, this.auditLogs.length - 10000);
        }
        await this.queueSave("auditLogs");
    }

    private scheduleRunsSave(): void {
        if (this.runsSaveTimer) return;
        this.runsSaveTimer = setTimeout(() => {
            this.runsSaveTimer = null;
            void this.queueSave("runs").catch((error) => {
                console.error("DataStore: debounced runs save failed", error);
            });
        }, RUNS_SAVE_DEBOUNCE_MS);
    }

    private rebuildThreadMessageIndexes(): void {
        this.threadMessageIdsByThread = {};
        this.threadMessageReservationsById = {};
        this.threadMessageReservedCountByThread = {};
        this.threadMessageLockChains = {};

        for (const threadId of Object.keys(this.threads)) {
            this.threadMessageIdsByThread[threadId] = [];
        }

        const rows = Object.values(this.threadMessages).sort((a, b) => {
            const byCreatedAt = a.createdAt.localeCompare(b.createdAt);
            if (byCreatedAt !== 0) return byCreatedAt;
            return a.id.localeCompare(b.id);
        });

        for (const message of rows) {
            if (!this.threadMessageIdsByThread[message.threadId]) {
                this.threadMessageIdsByThread[message.threadId] = [];
            }
            this.threadMessageIdsByThread[message.threadId].push(message.id);
        }
    }

    private insertThreadMessageIndex(message: ThreadMessageRecord): void {
        const ids = this.threadMessageIdsByThread[message.threadId] ?? (this.threadMessageIdsByThread[message.threadId] = []);
        const lastId = ids[ids.length - 1];
        if (!lastId) {
            ids.push(message.id);
            return;
        }

        const last = this.threadMessages[lastId];
        if (!last || last.createdAt <= message.createdAt) {
            ids.push(message.id);
            return;
        }

        for (let idx = ids.length - 1; idx >= 0; idx -= 1) {
            const candidate = this.threadMessages[ids[idx]];
            if (!candidate || candidate.createdAt <= message.createdAt) {
                ids.splice(idx + 1, 0, message.id);
                return;
            }
        }
        ids.unshift(message.id);
    }

    private clearThreadMessageReservationsUnsafe(threadId: string): void {
        for (const [reservationId, reservation] of Object.entries(this.threadMessageReservationsById)) {
            if (reservation.threadId === threadId) {
                delete this.threadMessageReservationsById[reservationId];
            }
        }
        delete this.threadMessageReservedCountByThread[threadId];
    }

    private consumeThreadMessageReservationSlotsUnsafe(threadId: string, reservationId: string, slots: number): boolean {
        const reservation = this.threadMessageReservationsById[reservationId];
        if (!reservation || reservation.threadId !== threadId) {
            return false;
        }

        const requestedSlots = Number.isFinite(slots) ? Math.floor(slots) : reservation.slots;
        const releaseSlots = Math.min(reservation.slots, Math.max(0, requestedSlots));
        if (releaseSlots === 0) {
            return false;
        }

        reservation.slots -= releaseSlots;
        if (reservation.slots <= 0) {
            delete this.threadMessageReservationsById[reservationId];
        }

        const currentReserved = this.threadMessageReservedCountByThread[threadId] ?? 0;
        const nextReserved = Math.max(0, currentReserved - releaseSlots);
        if (nextReserved > 0) {
            this.threadMessageReservedCountByThread[threadId] = nextReserved;
        } else {
            delete this.threadMessageReservedCountByThread[threadId];
        }
        return true;
    }

    private async withThreadMessageLock<T>(threadId: string, task: () => Promise<T>): Promise<T> {
        const previous = this.threadMessageLockChains[threadId] ?? Promise.resolve();
        const safePrevious = previous.catch((error) => {
            console.error("DataStore: thread message lock chain failure", error);
        });
        let release: () => void = () => undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        const current = safePrevious.then(() => gate);
        this.threadMessageLockChains[threadId] = current;

        await safePrevious;

        try {
            return await task();
        } finally {
            release();
            if (this.threadMessageLockChains[threadId] === current) {
                delete this.threadMessageLockChains[threadId];
            }
        }
    }

    private rebuildLatestEvalRunCache(): void {
        this.latestEvalRunByAgent = {};
        for (const row of Object.values(this.evalRuns)) {
            if (!row.agentId) continue;
            const current = this.latestEvalRunByAgent[row.agentId];
            if (!current || this.compareEvalRuns(row, current) > 0) {
                this.latestEvalRunByAgent[row.agentId] = row;
            }
        }
    }

    private compareEvalRuns(a: EvalRunRecord, b: EvalRunRecord): number {
        const byFinishedAt = a.finishedAt.localeCompare(b.finishedAt);
        if (byFinishedAt !== 0) return byFinishedAt;
        return a.id.localeCompare(b.id);
    }

    private recomputeLatestEvalRunForAgent(agentId: string): void {
        let latest: EvalRunRecord | undefined;
        for (const row of Object.values(this.evalRuns)) {
            if (row.agentId !== agentId) continue;
            if (!latest || this.compareEvalRuns(row, latest) > 0) {
                latest = row;
            }
        }
        if (latest) {
            this.latestEvalRunByAgent[agentId] = latest;
        } else {
            delete this.latestEvalRunByAgent[agentId];
        }
    }

    private updateLatestEvalRunCache(next: EvalRunRecord, previous?: EvalRunRecord): void {
        if (previous?.agentId && previous.agentId !== next.agentId) {
            this.recomputeLatestEvalRunForAgent(previous.agentId);
        }
        if (!next.agentId) return;

        const current = this.latestEvalRunByAgent[next.agentId];
        if (current?.id === next.id) {
            this.recomputeLatestEvalRunForAgent(next.agentId);
            return;
        }
        if (!current || this.compareEvalRuns(next, current) > 0) {
            this.latestEvalRunByAgent[next.agentId] = next;
        }
    }

    private rebuildLatestGeneratedDeploymentCache(): void {
        this.latestGeneratedDeploymentByAgent = {};
        for (const row of Object.values(this.deployments)) {
            if (!row.agentId || row.status !== "generated") continue;
            const current = this.latestGeneratedDeploymentByAgent[row.agentId];
            if (!current || this.compareDeployments(row, current) > 0) {
                this.latestGeneratedDeploymentByAgent[row.agentId] = row;
            }
        }
    }

    private compareDeployments(a: DeploymentRecord, b: DeploymentRecord): number {
        const byUpdatedAt = a.updatedAt.localeCompare(b.updatedAt);
        if (byUpdatedAt !== 0) return byUpdatedAt;
        const byCreatedAt = a.createdAt.localeCompare(b.createdAt);
        if (byCreatedAt !== 0) return byCreatedAt;
        return a.id.localeCompare(b.id);
    }

    private recomputeLatestGeneratedDeploymentForAgent(agentId: string): void {
        let latest: DeploymentRecord | undefined;
        for (const row of Object.values(this.deployments)) {
            if (row.agentId !== agentId || row.status !== "generated") continue;
            if (!latest || this.compareDeployments(row, latest) > 0) {
                latest = row;
            }
        }
        if (latest) {
            this.latestGeneratedDeploymentByAgent[agentId] = latest;
        } else {
            delete this.latestGeneratedDeploymentByAgent[agentId];
        }
    }

    private updateLatestGeneratedDeploymentCache(next: DeploymentRecord, previous?: DeploymentRecord): void {
        if (
            previous?.agentId &&
            previous.status === "generated" &&
            (previous.agentId !== next.agentId || next.status !== "generated")
        ) {
            this.recomputeLatestGeneratedDeploymentForAgent(previous.agentId);
        }
        if (!next.agentId) return;

        if (next.status !== "generated") {
            const current = this.latestGeneratedDeploymentByAgent[next.agentId];
            if (current?.id === next.id) {
                this.recomputeLatestGeneratedDeploymentForAgent(next.agentId);
            }
            return;
        }

        const current = this.latestGeneratedDeploymentByAgent[next.agentId];
        if (current?.id === next.id) {
            this.recomputeLatestGeneratedDeploymentForAgent(next.agentId);
            return;
        }
        if (!current || this.compareDeployments(next, current) > 0) {
            this.latestGeneratedDeploymentByAgent[next.agentId] = next;
        }
    }

    private async readJson<T>(fileName: string, fallback: T): Promise<T> {
        const target = path.join(this.dataDir, fileName);
        try {
            const raw = await fs.readFile(target, "utf8");
            return JSON.parse(raw) as T;
        } catch (error) {
            const maybe = error as NodeJS.ErrnoException;
            if (maybe.code === "ENOENT") {
                return fallback;
            }
            throw error;
        }
    }

    private async queueSave(target: SaveTarget): Promise<void> {
        if (target === "runs" && this.runsSaveTimer) {
            clearTimeout(this.runsSaveTimer);
            this.runsSaveTimer = null;
        }
        const guardedChain = this.saveChain.catch((error) => {
            console.error("DataStore: previous save failed", error);
        });
        this.saveChain = guardedChain.then(async () => {
            if (target === "flows") {
                await this.writeJson(FLOWS_FILE, this.flows);
                return;
            }
            if (target === "runs") {
                await this.writeJson(RUNS_FILE, this.runs);
                return;
            }
            if (target === "agents") {
                await this.writeJson(AGENTS_FILE, this.agents);
                return;
            }
            if (target === "contextPacks") {
                await this.writeJson(CONTEXT_PACKS_FILE, this.contextPacks);
                return;
            }
            if (target === "evals") {
                await this.writeJson(EVALS_FILE, this.evalRuns);
                return;
            }
            if (target === "deployments") {
                await this.writeJson(DEPLOYMENTS_FILE, this.deployments);
                return;
            }
            if (target === "threads") {
                await this.writeJson(THREADS_FILE, this.threads);
                return;
            }
            if (target === "threadMessages") {
                await this.writeJson(THREAD_MESSAGES_FILE, this.threadMessages);
                return;
            }
            if (target === "agentReleases") {
                await this.writeJson(AGENT_RELEASES_FILE, this.agentReleases);
                return;
            }
            await this.writeJson(AUDIT_LOGS_FILE, this.auditLogs);
        });
        await this.saveChain;
    }

    private async writeJson(fileName: string, data: unknown): Promise<void> {
        const target = path.join(this.dataDir, fileName);
        const tmp = `${target}.tmp`;
        await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
        await fs.rename(tmp, target);
    }
}
