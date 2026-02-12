# Akompani Design Guidelines

## Core Policy

1. No outlines for interaction states.
2. No blur/drop-shadow effects.
3. Static shadows only (hard-offset, zero-blur) when elevation is needed.

## Visual System Rules

1. Prefer color and spacing for hierarchy before any elevation treatment.
2. Use surface tiers (`--bg`, `--bg-secondary`, `--bg-tertiary`, `--bg-hover`) consistently across views.
3. Keep right-side panels (chat/deploy/details) structurally consistent: same divider behavior, header rhythm, and card spacing.
4. Interaction feedback should use:
   - background-color changes
   - border-color changes
   - slight transform (optional)
   - static shadow tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) only

## Interaction States

1. Focus-visible states should not use `outline`; use background and border contrast.
2. Active tabs/buttons should not rely on blurred glow.
3. Hover states must remain subtle and preserve readability in light and dark themes.

## Panel Layout Consistency

1. Chat history panel and deploy history panel should share:
   - same left divider behavior
   - same header height/padding structure
   - same list item spacing cadence
2. Panel cards should use the same radius and spacing tokens for predictable scan behavior.

## Deployment + Runtime UX

1. OpenAI-style endpoints should be first-class:
   - `/v1/models`
   - `/v1/chat/completions`
2. Stream and tool-call compatible responses are required for custom ChatKit-style frontends.
3. Chat UIs should support optional `x-worker-token` when worker auth is enabled.
