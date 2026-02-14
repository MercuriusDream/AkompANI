# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning while still in `0.x`.

## [Unreleased]

### Added
- Bun-first CI workflow for GitHub Pages deploys.
- OSS community docs (`CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`).
- Launch readiness pack: first-agent tutorial, test harness, issue/PR templates, release process docs, and demo video scripts.

### Changed
- Deploy mode now generates local deploy packages with step-by-step CLI guides instead of direct browser-to-API deploys.
- Removed direct browser deploy to Cloudflare Workers API and Vercel API (blocked by CORS/Same-Origin Policy).
- Deploy packages include pre-filled `.env` files with current LLM config values.
- Enhanced deploy guide UX with numbered steps, copy-commands button, and file listing.

## [0.1.0] - 2026-02-12

### Added
- Static-first visual agent IDE with Chat / Canvas / Deploy / Settings modes.
- Prompt-to-flow generation and deploy object generation for Bun + Elysia targets.
- GitHub Pages deployment workflow.
