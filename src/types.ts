export type Primitive = string | number | boolean | null;

export type NodeType =
  | "start"
  | "end"
  | "http"
  | "openai_structured"
  | "if"
  | "while"
  | "for_each"
  | "transform"
  | "set_var"
  | "log"
  | "delay"
  | "json_parse"
  | "json_stringify"
  | "array_push"
  | "template"
  | "assert"
  | "python_script"
  | "typescript_script";

export interface DrawflowExport {
  drawflow: Record<string, { data: Record<string, DrawflowNode> }>;
}

export interface DrawflowNode {
  id: number | string;
  name: string;
  data: Record<string, unknown>;
  inputs?: Record<string, { connections: Array<Record<string, string>> }>;
  outputs?: Record<string, { connections: Array<Record<string, string>> }>;
  pos_x?: number;
  pos_y?: number;
}

export interface FlowRecord {
  id: string;
  name: string;
  drawflow: DrawflowExport;
  createdAt: string;
  updatedAt: string;
}

export type PermissionAccess = "read" | "write" | "execute";

export interface AgentPermission {
  resource: string;
  access: PermissionAccess;
}

export interface AgentPolicy {
  minEvalPassRate: number;
  requireReleaseForChat: boolean;
  maxThreadMessages: number;
}

export interface AgentRecord {
  id: string;
  name: string;
  description: string;
  flowId: string;
  instruction: string;
  contextPackIds: string[];
  permissions: AgentPermission[];
  policy?: AgentPolicy;
  createdAt: string;
  updatedAt: string;
}

export type AgentReleaseStatus = "released" | "blocked";

export interface AgentReleaseRecord {
  id: string;
  agentId: string;
  flowId: string;
  status: AgentReleaseStatus;
  evalRunId?: string;
  deploymentId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContextPackRecord {
  id: string;
  name: string;
  description: string;
  values: Record<string, unknown>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CompiledNode {
  id: string;
  type: NodeType;
  config: Record<string, unknown>;
}

export interface CompiledEdge {
  sourceId: string;
  sourcePort: string;
  targetId: string;
}

export interface CompiledFlow {
  id: string;
  name: string;
  entryNodeId: string;
  nodes: Record<string, CompiledNode>;
  edges: CompiledEdge[];
}

export type RunStatus = "queued" | "running" | "completed" | "failed";

export interface RunEvent {
  idx: number;
  ts: string;
  type:
    | "run_started"
    | "node_started"
    | "node_completed"
    | "node_log"
    | "run_completed"
    | "run_failed";
  nodeId?: string;
  nodeType?: string;
  detail?: Record<string, unknown>;
}

export interface RunRecord {
  id: string;
  flowId: string;
  agentId?: string;
  status: RunStatus;
  input: unknown;
  output?: unknown;
  error?: string;
  startedAt: string;
  finishedAt?: string;
  events: RunEvent[];
}

export interface ExecutionContext {
  input: unknown;
  vars: Record<string, unknown>;
  last: unknown;
  output?: unknown;
}

export interface ExecuteNodeResult {
  port?: string;
  stop?: boolean;
  output?: unknown;
}

export interface EvalCase {
  name: string;
  input: unknown;
  expectExpr?: string;
  maxDurationMs?: number;
}

export interface EvalCaseResult {
  name: string;
  passed: boolean;
  durationMs: number;
  output?: unknown;
  error?: string;
  assertion?: {
    expression: string;
    value: unknown;
  };
}

export interface EvalRunRecord {
  id: string;
  flowId: string;
  agentId?: string;
  status: "completed" | "failed";
  startedAt: string;
  finishedAt: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  };
  cases: EvalCaseResult[];
}

export type DeploymentTarget = "cloudflare_workers" | "cloudflare_workers_elysia";

export interface CloudflareDeploymentConfig {
  workerName: string;
  flowId: string;
  agentId?: string;
  originUrl: string;
  outputDir: string;
  compatibilityDate: string;
  route?: string;
  waitForCompletion: boolean;
  requireWorkerToken: boolean;
  runtime?: "node" | "bun";
  framework?: "none" | "elysia";
  includeOpsConsole?: boolean;
}

export interface DeploymentRecord {
  id: string;
  flowId: string;
  agentId?: string;
  target: DeploymentTarget;
  status: "generated" | "failed";
  artifactPath: string;
  files: string[];
  config: CloudflareDeploymentConfig;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export type ThreadRole = "system" | "user" | "assistant";
export type ThreadStatus = "active" | "archived";

export interface ThreadRecord {
  id: string;
  agentId: string;
  title: string;
  status: ThreadStatus;
  releaseId?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

export interface ThreadMessageRecord {
  id: string;
  threadId: string;
  role: ThreadRole;
  content: string;
  runId?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogRecord {
  id: string;
  ts: string;
  actor: {
    source: string;
    id?: string;
    ip?: string;
  };
  action: string;
  entity: {
    type: string;
    id?: string;
  };
  outcome: "success" | "failure";
  detail?: Record<string, unknown>;
}
