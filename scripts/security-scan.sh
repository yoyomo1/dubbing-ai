#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PATTERN='AIza[0-9A-Za-z_-]{35}|sk_[A-Za-z0-9]{32,}|GOCSPX-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{36}|libsql://[^[:space:]]+\.turso\.io|eyJhbGciOi[A-Za-z0-9._-]{20,}'

echo "Running security scan (excluding .env* and build artifacts)..."

if rg -n --hidden --no-ignore \
  -g '!.git/*' \
  -g '!.next/*' \
  -g '!node_modules/*' \
  -g '!.env*' \
  "$PATTERN" .; then
  echo ""
  echo "Potential secrets were found in tracked sources."
  echo "Remove or rotate them before deploying."
  exit 1
fi

echo "Security scan passed."
