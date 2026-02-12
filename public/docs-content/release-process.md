# Release Process

This project ships fast in `0.x`, but each release must be reproducible and auditable.

## Release Cadence

- Patch (`0.x.y`): bug fixes, docs fixes, non-breaking UX updates.
- Minor (`0.y.0`): new deploy/runtime capabilities, new node/functionality.
- Major (`1.0.0+`): reserved for compatibility commitments.

## Release Checklist

1. Confirm local quality gates:
   - `bun run build`
   - `bun run test:unit`
   - `bun run test:e2e`
2. Ensure docs are aligned with runtime commands (`bun`, not `npm`).
3. Update `CHANGELOG.md`:
   - move items from `Unreleased` into new version section.
   - include release date in `YYYY-MM-DD`.
4. Bump version in `package.json`.
5. Commit with release message:
   - `chore(release): vX.Y.Z`
6. Tag release:
   - `git tag vX.Y.Z`
   - `git push origin main --tags`
7. Create GitHub Release notes from changelog.

## Rollback

1. Revert the release commit.
2. Push revert and redeploy Pages.
3. Document rollback cause in `CHANGELOG.md` under `Unreleased`.

## Quality Gates for This Project Mission

Given the mission of supporting users with low agentic maturity, each release should verify:
- onboarding clarity for first-time users,
- deploy artifact correctness for Bun + Elysia targets,
- ease of attaching existing APIs and KV-style state integrations.
