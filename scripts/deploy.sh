#!/usr/bin/env bash
set -euo pipefail

# Simple deploy helper.
# Usage:
# 1) Local deploy (on server/repo): ./scripts/deploy.sh
#    - Copies backend/.env.production.example -> backend/.env
#    - Restarts the `app` service with docker-compose
#
# 2) Remote deploy: ./scripts/deploy.sh user@host:/path/to/repo
#    - Copies backend/.env.production.example to the remote repo path
#    - Runs `docker-compose up -d --no-deps --build app` on the remote host

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_EXAMPLE="$REPO_ROOT/backend/.env.production.example"

if [ ! -f "$ENV_EXAMPLE" ]; then
  echo "Missing $ENV_EXAMPLE" >&2
  exit 1
fi

if [ "$#" -eq 0 ]; then
  echo "Deploying locally: applying env and restarting app"
  cp "$ENV_EXAMPLE" "$REPO_ROOT/backend/.env"
  (cd "$REPO_ROOT" && docker-compose up -d --no-deps --build app)
  echo "Local deploy complete"
  exit 0
fi

REMOTE="$1"

echo "Deploying to remote: $REMOTE"

# Expect remote in form user@host:/absolute/path
scp "$ENV_EXAMPLE" "$REMOTE/backend/.env"

SSH_HOST=$(echo "$REMOTE" | sed -E 's@([^:]+):.*@\1@')
REMOTE_PATH=$(echo "$REMOTE" | sed -E 's@[^:]+:(.*)@\1@')

ssh "$SSH_HOST" "set -e; cd '$REMOTE_PATH' && docker-compose up -d --no-deps --build app"

echo "Remote deploy complete"
