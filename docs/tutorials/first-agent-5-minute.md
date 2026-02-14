# First Agent in 5 Minutes

This walkthrough is built for first-time framework developers.

## Mission Context

Akompani is designed to help people who are not yet fluent in agentic workflows build an accompanying AI agent quickly, with practical Bun + Elysia deploy outputs and easy attachment of existing APIs.

## Outcome

By the end of this tutorial, you will:
- generate a first agent from plain English,
- inspect/edit its flow,
- generate a deploy package for Cloudflare Workers (`Elysia + Bun`).

## Prerequisites

- Bun `1.3.3+`
- one provider API key (for prompt-to-flow generation)
- local run:

```bash
bun install
bun run dev
```

Open `http://localhost:3000`.

## 0:00-0:40 Open the landing page

![Landing page](../assets/tutorials/first-agent/01-landing.png)

- Click `Get Started`.
- You should land on `/app/?mode=chat`.

## 0:40-2:10 Generate your first flow from text

![Chat mode prompt entry](../assets/tutorials/first-agent/02-chat-mode.png)

Suggested prompt:

```text
Build an accompanying AI agent for first-time users. It should explain concepts simply,
ask clarifying questions, call an external FAQ API, and cache common answers.
```

Optional clip slot (GIF):

![Chat to flow generation](../assets/tutorials/first-agent/02-chat-to-flow.gif)

## 2:10-3:20 Inspect and refine on Canvas

![Canvas mode](../assets/tutorials/first-agent/03-canvas-mode.png)

- Switch to `Canvas` mode.
- Confirm flow nodes are created.
- Make one practical refinement:
  - add a fallback instruction for unclear user requests,
  - or add KV/cache behavior for repeated queries.

## 3:20-4:40 Generate deploy package (Cloudflare Workers)

![Deploy mode](../assets/tutorials/first-agent/04-deploy-mode.png)

- Switch to `Deploy` mode.
- Select `Cloudflare Workers (Elysia + Wrangler + Bun)`.
- Click `Generate Deploy Package` and review included files:
  - `src/index.ts`
  - `wrangler.toml`
  - `package.json`
  - `.env` (pre-filled with your LLM config)
  - `README.md`
- Follow the step-by-step CLI guide or push to GitHub.

Optional clip slot (GIF):

![Deploy object generation](../assets/tutorials/first-agent/04-deploy-output.gif)

## 4:40-5:00 Recap

You now have a first agent that is:
- generated from plain language,
- editable as a flow,
- deployable as Bun + Elysia runtime artifacts (via CLI or GitHub push),
- ready to integrate existing APIs and KV-style state patterns.
