Deployment Checklist
====================

Follow these steps when deploying the app to production. Commands assume you're using Docker Compose from the repository root.

1. Prepare environment

- Copy the production env example into place and set real secrets:

```bash
cp backend/.env.production.example backend/.env
# Edit backend/.env and replace placeholder values
```

- Ensure `REDIS_URL` is a plain value (no duplicate key prefix). Examples:

```text
# Using Docker Compose redis service
REDIS_URL=redis://redis:6379

# Or external Redis host
REDIS_URL=redis://10.0.0.5:6379
```

2. Start services

```bash
docker-compose up -d --build
```

3. Verify containers and health

- Redis health:

```bash
docker-compose exec redis redis-cli ping
# should print PONG
```

- App environment value (verifies `REDIS_URL` seen by the process):

```bash
docker-compose exec app node -e "console.log(process.env.REDIS_URL)"
```

- App health endpoint (includes Redis status):

```bash
curl -sS http://localhost:3000/api/health | jq .
```

4. Check logs for Redis connectivity errors

```bash
docker-compose logs -f --tail=200 app
```

Look for `Redis client error` logs. After the recent change the full error object will be printed which helps debugging.

5. Restart single service when changing env

If you update `backend/.env` on the host, restart the `app` service:

```bash
docker-compose up -d --no-deps --build app
```

6. Common troubleshooting

- If the app container shows `REDIS_URL=redis://redis:6379` but Redis is unreachable from the container, ensure network access and correct hostname (use `redis` for compose).
- If using an external Redis that requires authentication or TLS, update `REDIS_URL` with credentials and/or `rediss://` scheme and verify config.

7. Optional: health monitoring

- Poll `/api/health` from your monitoring system and alert if `services.redis.status` is not `up`.

Using the helper scripts

- Apply env and restart locally (run on the server where the repo is checked out):

```bash
./scripts/deploy.sh
```

- Deploy to a remote host (scp + restart). Example:

```bash
./scripts/deploy.sh user@yourserver.example.com:/var/www/agency-os
```

- Post env to a webhook with optional auth headers (set `DEPLOY_WEBHOOK_URL` and `DEPLOY_WEBHOOK_AUTH_HEADER`/`DEPLOY_WEBHOOK_AUTH_VALUE` as needed):

```bash
export DEPLOY_WEBHOOK_URL="https://deploy.example.com/hooks/app"
export DEPLOY_WEBHOOK_AUTH_HEADER="Authorization"
export DEPLOY_WEBHOOK_AUTH_VALUE="Bearer <token>"
./scripts/post-env-to-webhook.sh
```
