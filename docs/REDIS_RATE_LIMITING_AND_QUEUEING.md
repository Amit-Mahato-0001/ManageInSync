# Redis Rate Limiting and Queueing Changes

This document explains the Redis-related changes added to the project and why each one was introduced.

## Redis Runtime Configuration

### Added `backend/src/config/redis.js`

This file centralizes Redis connection handling.

Why:

- Keeps Redis setup in one place instead of creating Redis clients throughout the app.
- Provides one Redis client for rate limiting and one Redis connection for BullMQ queues.
- Avoids connecting to Redis when `REDIS_URL` is not configured, which keeps tests and local non-Redis development working.
- Adds shared cleanup support through `closeRedisConnections`.

## Environment Validation

### Updated `backend/src/config/env.js`

The backend now validates `REDIS_URL`.

Why:

- Redis is required in production because production rate limiting and queueing depend on it.
- Invalid Redis URLs are caught during startup instead of failing later during requests or worker execution.
- `redis://` and `rediss://` are accepted.
- `ALLOW_REDIS_DISABLED=true` exists only as an explicit escape hatch for production-like tests.

### Updated `backend/.env.example`

Added:

```env
REDIS_URL=redis://localhost:6379
```

Why:

- Makes the new required Redis setting visible to anyone configuring the backend.
- Documents that Redis is used for cache-style infrastructure, rate limiting, and queues.

## Redis Rate Limiting

### Updated `backend/src/middleware/rateLimit.middleware.js`

The shared rate limiter now uses Redis when `REDIS_URL` is configured.

Why:

- In-memory rate limiting only works per Node process.
- Redis-backed counters work across multiple app instances and containers.
- The implementation uses Redis `INCR` and `PEXPIRE` to maintain fixed-window counters.
- Rate limit headers are preserved:
  - `RateLimit-Limit`
  - `RateLimit-Remaining`
  - `RateLimit-Reset`
  - `Retry-After`
- The old in-memory behavior remains as a fallback for tests and local runs without Redis.

### Updated `backend/src/middleware/messageRateLimit.middleware.js`

The message-specific limiter now delegates to the shared rate limiter.

Why:

- Removes duplicate in-memory rate limit logic.
- Makes project message limits Redis-backed too.
- Keeps the same user-facing behavior: users still get a `429` response when sending too many messages.

## Redis Queueing

### Added `backend/src/queues/email.queue.js`

This file defines the email queue.

Why:

- Invite emails and password reset emails are external SMTP work and should not block API requests.
- BullMQ gives retries, exponential backoff, and completed/failed job cleanup.
- If Redis is not configured, it falls back to direct email sending so tests and simple local runs still work.

Queued jobs:

- `invite`
- `password-reset`

### Added `backend/src/workers/email.worker.js`

This worker consumes jobs from the email queue.

Why:

- Keeps slow or unreliable email delivery outside the request lifecycle.
- Allows the API container and email worker container to scale separately.
- Handles failed jobs through BullMQ retry behavior.
- Supports configurable concurrency through `EMAIL_WORKER_CONCURRENCY`.

## Service Changes

### Updated `backend/src/services/invite.service.js`

Invite emails now call `enqueueInviteEmail`.

Why:

- Creating or resending an invite should not wait on SMTP delivery.
- The invite token is still created and saved before the email job is queued.

### Updated `backend/src/services/auth.service.js`

Password reset emails now call `enqueuePasswordResetEmail`.

Why:

- Forgot-password requests should return quickly and consistently.
- Email delivery failures can retry in the background instead of making the API request depend directly on SMTP availability.

## Docker Changes

### Updated `docker-compose.yml`

Added a Redis service:

```yaml
redis:
  image: redis:7-alpine
```

Why:

- Provides Redis for local Docker and production-like Compose runs.
- Adds a Redis healthcheck before dependent services start.
- Persists Redis data using a named volume.

Added an `email-worker` service.

Why:

- Runs the BullMQ worker separately from the API server.
- Lets the app container handle HTTP traffic while the worker handles background email jobs.
- Uses the same built image but runs:

```bash
node backend/src/workers/email.worker.js
```

## Package Changes

### Updated `backend/package.json`

Added dependencies:

- `bullmq`
- `ioredis`

Why:

- `bullmq` provides Redis-backed queues and workers.
- `ioredis` provides the Redis client used by both BullMQ and the rate limiter.

Added script:

```json
"worker:email": "node src/workers/email.worker.js"
```

Why:

- Gives a simple command for running the email worker outside Docker.

### Updated `backend/package-lock.json`

Why:

- Locks the exact dependency versions so installs are reproducible.

## Test Support

### Updated `backend/test/helpers/testEnv.js`

Added test defaults for Redis-related config.

Why:

- Existing tests should not require a live Redis server.
- Tests can still run against the in-memory fallback.

### Updated `backend/test/env.test.js`

Added validation checks for `REDIS_URL`.

Why:

- Confirms production config requires Redis.
- Confirms invalid Redis URL protocols are rejected.

## Verification

The following checks were run successfully:

```bash
npm.cmd test
npm.cmd run build
```

## Important Notes

- In production, configure `REDIS_URL`.
- Run the API server and email worker together.
- In Docker Compose, this is already handled by the `app`, `redis`, and `email-worker` services.
- For local non-Docker development, start Redis manually or leave `REDIS_URL` empty to use the non-production fallback.

## Your Side: What Is Left To Do

These are the things you still need to configure or decide before using Redis rate limiting and queueing properly.

### 1. Add Redis URL

In `backend/.env`, add:

```env
REDIS_URL=redis://localhost:6379
```

Use this for local Redis running on your machine.

If you are using Docker Compose, the app already uses:

```env
REDIS_URL=redis://redis:6379
```

If you deploy to a cloud Redis provider, replace it with that provider's Redis URL, for example:

```env
REDIS_URL=rediss://username:password@host:port
```

Use `rediss://` when your Redis provider requires TLS.

### 2. Make Sure Redis Is Running

For Docker Compose:

```bash
docker compose up --build
```

This starts:

- `app`
- `mongo`
- `redis`
- `email-worker`

For local development without Docker, install/start Redis separately, then run the backend normally.

### 3. Keep Email Credentials Configured

Queueing does not replace SMTP credentials. The worker still needs these values in `backend/.env`:

```env
EMAIL_HOST=
EMAIL_PORT=
EMAIL_SECURE=
EMAIL_REQUIRE_TLS=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
```

Why:

- The API now queues the email job.
- The worker still sends the actual email through Nodemailer.
- If these values are wrong, jobs will retry and then fail.

### 4. Run The Email Worker

If using Docker Compose, this is already configured as `email-worker`.

If running locally without Docker, start the worker in a separate terminal:

```bash
cd backend
npm run worker:email
```

Keep this running alongside the backend server.

### 5. Do Not Disable Redis In Production

Do not set this in real production:

```env
ALLOW_REDIS_DISABLED=true
```

That setting is only for production-like tests where Redis is intentionally not running.

### 6. Optional Queue Tuning

You can add these to `backend/.env` if you want to tune email job behavior:

```env
EMAIL_QUEUE_ATTEMPTS=3
EMAIL_QUEUE_BACKOFF_MS=5000
EMAIL_QUEUE_COMPLETED_TTL_SECONDS=3600
EMAIL_QUEUE_FAILED_TTL_SECONDS=604800
EMAIL_WORKER_CONCURRENCY=5
```

Defaults already exist in code, so these are optional.

### 7. Production Checklist

Before deployment, confirm:

- `REDIS_URL` points to your production Redis instance.
- Redis allows connections from your backend and worker.
- SMTP credentials are available to both the API server and worker.
- The worker process is deployed and running continuously.
- Your deployment platform restarts the worker if it crashes.
- Redis data persistence/eviction policy is acceptable for rate limits and queues.

### 8. Quick Manual Test

After setup:

1. Start Redis.
2. Start the backend.
3. Start the email worker.
4. Trigger an invite or password reset.
5. Confirm the API responds quickly.
6. Confirm the worker logs email job completion.
7. Hit an auth route repeatedly and confirm rate limiting returns `429`.
