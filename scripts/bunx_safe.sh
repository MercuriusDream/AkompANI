#!/usr/bin/env bash
set -euo pipefail

TMPDIR="/tmp/agent-builder-bun"
BUN_TMPDIR="$TMPDIR"

mkdir -p "$TMPDIR"
export TMPDIR BUN_TMPDIR

exec bunx "$@"
