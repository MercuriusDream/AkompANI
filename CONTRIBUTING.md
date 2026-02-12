# Contributing to Akompani

Thanks for contributing.

## Development Setup

```bash
bun install
bun run dev
```

Open `http://localhost:3000`.

## Before Opening a PR

1. Keep the change scoped to one problem.
2. Update docs when behavior or commands change.
3. Run a production check:

```bash
bun run build
```

4. Add screenshots or short clips for UI changes.
5. If the change affects deploy/runtime behavior, include a brief test note in the PR description.

## Pull Request Guidelines

1. Use a clear title and describe what changed and why.
2. Link related issues.
3. Call out any follow-up work explicitly.

## Bug Reports

Open a GitHub issue with:
- reproduction steps
- expected behavior
- actual behavior
- environment (OS, browser, Bun version)

For security issues, do not open a public issue. Follow `SECURITY.md`.
