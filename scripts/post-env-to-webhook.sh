#!/usr/bin/env bash
set -euo pipefail

# Posts backend/.env.production.example to the DEPLOY_WEBHOOK_URL.
# Optional headers:
#   DEPLOY_WEBHOOK_AUTH_HEADER (e.g. "Authorization")
#   DEPLOY_WEBHOOK_AUTH_VALUE  (e.g. "Bearer <token>")

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/backend/.env.production.example"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

: "${DEPLOY_WEBHOOK_URL:?Please set DEPLOY_WEBHOOK_URL env var}"

CURL_OPTS=(--fail --show-error --silent --request POST "$DEPLOY_WEBHOOK_URL" -H "Content-Type: text/plain" --data-binary "@$ENV_FILE")

if [ -n "${DEPLOY_WEBHOOK_AUTH_HEADER:-}" ] && [ -n "${DEPLOY_WEBHOOK_AUTH_VALUE:-}" ]; then
  CURL_OPTS+=(-H "${DEPLOY_WEBHOOK_AUTH_HEADER}: ${DEPLOY_WEBHOOK_AUTH_VALUE}")
fi

echo "Posting env to webhook: $DEPLOY_WEBHOOK_URL"
curl "${CURL_OPTS[@]}"

echo "Posted successfully"
