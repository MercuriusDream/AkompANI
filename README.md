# AkompANI

> *`Akompani`: to accompany; attend; go hand in hand with.<sup>Esperanto</sup>*

<img width="1282" height="717" alt="image" src="https://github.com/user-attachments/assets/a66955cb-f947-4305-8e0d-d13fab7c9eb4" />

<https://akompani.cc>

## Mission

An *Artificial Narrow Intelligence* agent suite, for people who have not yet developed strong agentic usage patterns, while keeping generated runtime artifacts practical, readable, and production-oriented;

## What It Is

- Visual flow editor at `/app`
- Prompt-to-flow generation using user-configured LLM providers (multi-provider BYOK)
- Direct browser deploy to Cloudflare Workers (API token)
- Direct browser deploy to Vercel (access token)
- Direct browser push deploy objects to GitHub repos (PAT/token)
- No project-owned backend API required for core IDE workflows
- Generated agent endpoint mode selector: `openai`, `chat`, or `both`
- Bun + Elysia deploy artifacts as first-class targets
- Easy attachment of existing APIs and KV-style caching/state patterns in flows

## Design Guidelines

- See `docs/design-guidelines.md` for the current UI policy (`no-outline`, `no-drop-shadow`, static-shadow-only).

Note: the app itself has no internal `/api/*` runtime. The only `/api/index.ts` path is inside generated Vercel deploy artifacts.

## Tech Stack

- Frontend: Vanilla JS/HTML/CSS
- Build/dev server: Vite
- Persistence: browser storage (`localStorage` + `sessionStorage`)
- Package manager/runtime: Bun-first (`bun.lock`, `packageManager: bun@1.3.3`)

## Requirements

- Bun `1.3.3+`
- Node `20+`

## Quick Start

```bash
bun install
bun run dev
```

Open: `http://localhost:3000`

## Build

```bash
bun run build
bun run preview
```

## Tests

```bash
bun run test:unit
bun run test:e2e
```

One smoke E2E test is included (`tests/e2e/smoke.spec.js`) along with core runtime unit tests (`tests/unit/ide-runtime.test.js`).

## Public Release Check

```bash
bun run release:check
```

This runs build + test + dependency audit + tracked-secret checks in one command.

## GitHub Pages Auto-Deploy

- Workflow: `.github/workflows/deploy-pages.yml`
- Trigger: push to `main` or `master`
- Artifact: `dist/` (full static app)

Repository setting required once:

- GitHub `Settings -> Pages -> Source`: set to `GitHub Actions`.

## Routes

- `/` landing
- `/app` main IDE (Chat / Canvas / Deploy / Settings modes)
- `/chat` legacy alias that redirects into `/app/?mode=chat`
- `/ops` legacy alias that redirects into `/app/?mode=deploy`
- `/editor` legacy alias that redirects into `/app`
- `/settings` legacy alias that redirects into `/app/?mode=settings`

## Security Notes

- Tokens and API keys are session-scoped in browser storage by default.
- Cloudflare, Vercel, GitHub, and LLM calls are made directly from browser to provider APIs.
- Auth is scaffolded in generated agents; users configure secrets in their platform dashboards.
- If a provider blocks direct browser API calls (CORS/network), the IDE auto-falls back to deploy-object generation.
- Service worker uses conservative cache policy with stale-shell protections.

## Community

- Contributing guide: `CONTRIBUTING.md`
- Security policy: `SECURITY.md`
- Code of conduct: `CODE_OF_CONDUCT.md`

## Docs and Tutorials

- Docs index: `docs/README.md`
- 5-minute first-agent tutorial: `docs/tutorials/first-agent-5-minute.md`
- Demo video scripts: `docs/demo-videos.md`
- Release process: `docs/release-process.md`
- Changelog: `CHANGELOG.md`

## License

AGPL V3 (`LICENSE`)
