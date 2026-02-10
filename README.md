# Agent Builder OSS

Static-first browser IDE for building and deploying flow-based agents.

## What It Is

- Visual flow editor at `/app`
- Prompt-to-flow generation using user-configured LLM providers (multi-provider BYOK)
- Direct browser deploy to Cloudflare Workers (API token)
- Direct browser deploy to Vercel (access token)
- Direct browser push deploy objects to GitHub repos (PAT/token)
- No project-owned backend API required for core IDE workflows
- Generated agent endpoint mode selector: `openai`, `chat`, or `both`

Note: the app itself has no internal `/api/*` runtime. The only `/api/index.ts` path is inside generated Vercel deploy artifacts.

## Tech Stack

- Frontend: Vanilla JS/HTML/CSS
- Build/dev server: Vite
- Persistence: browser storage (`localStorage` + `sessionStorage`)

## Quick Start

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

## Build

```bash
npm run build
npm run preview
```

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

## License

MIT (`LICENSE`)
