#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/vercel-env-sync.sh https://your-project.vercel.app
#
# Prerequisites:
#   1) vercel CLI installed and logged in
#   2) project linked (`vercel link`)
#   3) .env.local exists in repo root

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ $# -lt 1 ]]; then
  echo "Usage: bash scripts/vercel-env-sync.sh https://your-project.vercel.app"
  exit 1
fi

NEXTAUTH_URL_VALUE="$1"
ENV_FILE=".env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "vercel CLI is not installed. Install with: npm i -g vercel"
  exit 1
fi

# Load local env values.
set -a
source "$ENV_FILE"
set +a

required_keys=(
  "NEXTAUTH_SECRET"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "TURSO_DATABASE_URL"
  "TURSO_AUTH_TOKEN"
  "OWNER_EMAILS"
  "ALLOWLIST_EMAILS"
  "ELEVENLABS_API_KEY"
  "GEMINI_API_KEY"
)

optional_keys=(
  "ELEVENLABS_VOICE_EN"
  "ELEVENLABS_VOICE_DE"
  "ELEVENLABS_VOICE_ES"
  "ELEVENLABS_VOICE_PL"
  "ELEVENLABS_VOICE_PT"
  "ELEVENLABS_VOICE_IT"
  "ELEVENLABS_VOICE_FR"
  "ELEVENLABS_VOICE_KO"
  "ELEVENLABS_VOICE_DA"
)

targets=("production" "development")
preview_branch="${PREVIEW_GIT_BRANCH:-}"

if [[ -n "$preview_branch" ]]; then
  targets+=("preview")
fi

upsert_key() {
  local key="$1"
  local value="$2"
  local target="$3"

  if [[ "$target" == "preview" ]]; then
    # In non-interactive mode, preview may require an explicit git branch.
    vercel env rm "$key" "$target" "$preview_branch" --yes >/dev/null 2>&1 || true
    vercel env add "$key" "$target" "$preview_branch" --value "$value" --yes --force
  else
    vercel env rm "$key" "$target" --yes >/dev/null 2>&1 || true
    vercel env add "$key" "$target" --value "$value" --yes --force
  fi
  echo "Set $key ($target)"
}

# NEXTAUTH_URL comes from function arg so production URL can be explicit.
for target in "${targets[@]}"; do
  upsert_key "NEXTAUTH_URL" "$NEXTAUTH_URL_VALUE" "$target"
done

# Required keys must be non-empty.
for key in "${required_keys[@]}"; do
  value="${!key:-}"
  if [[ -z "$value" ]]; then
    echo "Missing required value in .env.local: $key"
    exit 1
  fi

  for target in "${targets[@]}"; do
    upsert_key "$key" "$value" "$target"
  done
done

# Optional keys are only set when provided.
for key in "${optional_keys[@]}"; do
  value="${!key:-}"
  if [[ -z "$value" ]]; then
    continue
  fi

  for target in "${targets[@]}"; do
    upsert_key "$key" "$value" "$target"
  done
done

echo ""
echo "Vercel env sync completed."
if [[ -z "$preview_branch" ]]; then
  echo "Preview env was skipped. To include preview, run with:"
  echo "PREVIEW_GIT_BRANCH=<feature-branch> bash scripts/vercel-env-sync.sh ${NEXTAUTH_URL_VALUE}"
fi
echo "Next step: verify Google OAuth redirect URI includes:"
echo "${NEXTAUTH_URL_VALUE}/api/auth/callback/google"
