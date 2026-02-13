#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Build"
bun run build

echo "==> Unit tests"
bun run test:unit

echo "==> E2E tests"
bun run test:e2e

echo "==> Dependency audit (production deps)"
npm audit --audit-level=moderate --omit=dev

echo "==> Secret exposure checks"
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "ERROR: .env is tracked. Remove it from git before release."
  exit 1
fi

echo "==> Internal docs exposure check"
for f in docs/release-process.md docs/demo-videos.md docs/frontier-oss-playbook.md docs/project-deep-dive.md; do
  if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    echo "ERROR: Internal doc '$f' is tracked. Run: git rm --cached $f"
    exit 1
  fi
done
if git ls-files --error-unmatch public/docs-content/ >/dev/null 2>&1; then
  echo "ERROR: public/docs-content/ is tracked. Run: git rm --cached -r public/docs-content/"
  exit 1
fi

tracked_files=()
while IFS= read -r file; do
  if [[ -n "$file" ]]; then
    tracked_files+=("$file")
  fi
done < <(git ls-files)
if ((${#tracked_files[@]} > 0)); then
  if rg -n --pcre2 \
    '(BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{80,}|sk-[A-Za-z0-9]{32,}|xox[baprs]-[A-Za-z0-9-]{10,})' \
    "${tracked_files[@]}"; then
    echo "ERROR: Potential secret material found in tracked files."
    exit 1
  fi
fi

echo "==> Public release checks passed."
