# Agent-Builder Frontier OSS Playbook (On-Prem + Cloudflare Edge)

This document defines how Agent-Builder should become a production-grade, open alternative to closed enterprise agent platforms.

## 1) Business Context Layer

### Scope
- Shared enterprise context packs as reusable semantic memory.
- Context versioning, provenance, and least-privilege linking at agent level.

### Bug Checks
- Verify missing context pack IDs are surfaced in run and finalize responses.
- Verify context merge precedence is deterministic (`pack order` then `runtime vars`).
- Verify context packs can be updated without corrupting existing agent links.

### Design Checks
- Keep context packs portable (`JSON`) for on-prem storage and export/import.
- Keep context reads explicit in API responses (`missingContextPackIds`).
- Enforce compatibility with mixed data systems by avoiding provider-specific schema lock-in.

### Comparison (vs closed stack)
- Better: local JSON-native portability and no platform lock-in for context layer.
- Gap: no built-in semantic indexing service yet (vector index integration needed).
- Neutral: runtime context injection model is comparable for deterministic flows.

## 2) Agent Execution Layer

### Scope
- Flow-based execution engine with deterministic nodes + optional LLM node.
- Agent identity, instruction, permissions, and runtime policy.

### Bug Checks
- Ensure `requireReleaseForChat=true` blocks runs until `release.status === "released"`.
- Ensure max thread message policy blocks overflow with clear error.
- Ensure run events remain ordered and resumable via pull cursor.

### Design Checks
- Keep execution deterministic for non-LLM nodes.
- Keep policy defaults safe (`requireReleaseForChat=true`, capped thread length).
- Keep prompt-invoked run APIs equivalent to direct run APIs.

### Comparison (vs closed stack)
- Better: transparent event logs and local inspectability of each node transition.
- Better: portable runtime with Bun-first operation.
- Gap: no built-in distributed scheduler/queue cluster yet.

## 3) Eval and Optimization Layer

### Scope
- Agent/flow eval suites with pass-rate summary and assertion expressions.
- Release gating based on eval thresholds.

### Bug Checks
- Verify blocked releases when pass rate is below `requirePassRate`.
- Verify eval artifacts are persisted and linked to release records.
- Verify finalize path and prompt finalize path produce consistent outcomes.

### Design Checks
- Default eval must be minimal but non-empty.
- Eval input and assertions must be reproducible in CI.
- Release decision must be explainable (`evalRunId`, threshold, pass rate).

### Comparison (vs closed stack)
- Better: straightforward, inspectable eval artifacts in local data store.
- Gap: advanced auto-tuning and policy learning loops still manual.
- Neutral: pass/fail gate mechanism is equivalent in core behavior.

## 4) Governance and Audit Layer

### Scope
- Agent permissions, action/outcome audit logs, NDJSON export.
- Production traceability for agent, thread, deployment actions.

### Bug Checks
- Verify audit events for success/failure on finalize, auto-run, deployment.
- Verify actor metadata is always present (source and IP where available).
- Verify log export endpoint streams parseable NDJSON.

### Design Checks
- Keep audit schema stable and append-only.
- Keep filters practical for incident response (`action`, `entityType`, `outcome`).
- Keep governance controls independent from UI.

### Comparison (vs closed stack)
- Better: raw audit export ownership by customer.
- Gap: no built-in SIEM connectors yet (Splunk/Datadog/ELK adapters needed).
- Neutral: policy and guardrail concepts are equivalent.

## 5) Threaded App Layer (ChatGPT-like)

### Scope
- OpenAI-like thread and message model with auto-run assistant replies.
- Finalized-agent-first console UX.

### Bug Checks
- Verify thread creation/rename/archive/delete lifecycle.
- Verify user message creates assistant output or explicit error message.
- Verify thread title auto-derivation and release linkage updates.

### Design Checks
- Keep thread model API-first and UI-agnostic.
- Keep error visibility explicit in-message for operator triage.
- Keep thread state consistent after finalize/deploy transitions.

### Comparison (vs closed stack)
- Better: open API and self-hostable UI.
- Gap: enterprise inbox/routing ergonomics can be expanded.
- Neutral: conversation + agent handoff pattern is equivalent.

## 6) Cloudflare Workers Deployment Layer

### Scope
- Artifact generation for:
  - `cloudflare_workers`
  - `cloudflare_workers_elysia` (Bun + Wrangler + Elysia + optional ops console)

### Bug Checks
- Verify generated artifact includes `wrangler.toml`, `src/index.ts`, and expected assets.
- Verify deployment records are created for both success and failure cases.
- Verify generated runtime metadata (`runtime`, `framework`) is accurate.

### Design Checks
- Keep one-command Bun workflow in generated artifacts.
- Keep origin forwarding strict and header sanitation enabled.
- Keep worker auth optional but secure-by-default for production.

### Comparison (vs closed stack)
- Better: generated source code is fully owned and editable.
- Better: edge deployment strategy is transparent and provider-visible.
- Gap: one-click managed rollout orchestration (canary/traffic split UI) not yet included.

## 7) On-Prem / Self-Hosted Production Track

### Scope
- Local-first control plane deployable in private network.
- Cloudflare edge optional, not mandatory.

### Bug Checks
- Verify complete run/eval/thread/finalize flow with no external managed control plane.
- Verify backup/restore from data directory snapshots.
- Verify webhook auth works when exposed behind private gateway.

### Design Checks
- Keep data path configurable (`DATA_DIR`, `DEPLOYMENTS_DIR`).
- Keep dependency graph minimal for restricted environments.
- Keep API compatibility stable for future database backends.

### Comparison (vs closed stack)
- Better: sovereign deployment posture and data residency control.
- Better: no vendor lock for orchestration layer.
- Gap: managed SSO/SCIM and tenancy isolation need dedicated modules for large enterprises.

## 8) Immediate Roadmap to Reach/Exceed Frontier-Class Maturity

### Next Build Items
- Add Postgres backend option with migration tooling while preserving file-store mode.
- Add OIDC SSO + role-based access control for org/team/project scopes.
- Add regression test suite for release gate invariants and prompt-execution parity.
- Add packaged observability adapters (OpenTelemetry + SIEM sinks).
- Add deployment strategies (staged/canary/rollback manifests).

### Release Readiness Gate (must pass each release)
- Bug checks: all API smoke tests pass (`thread`, `finalize`, `deploy`, `audit`).
- Design checks: release policy semantics unchanged and documented.
- Comparison checks: no regression against “open ownership, self-hostability, Bun-first edge path”.
