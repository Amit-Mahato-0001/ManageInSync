# What Should Be Done Next

## 1. Project listing is still too slow

`BENCHMARKS.md` shows that `GET /api/projects?page=1&limit=20` is still taking about 2 seconds even after query cleanup and indexes.

That means the slow part is probably not only the project query. The API may be doing too many small database calls before or after the project list is loaded.

What to do:

- Add timing logs around every step of the request.
- Measure auth middleware time.
- Measure tenant lookup time.
- Measure project query time.
- Measure unread count aggregation time.
- Measure assignment cleanup time.
- Count how many MongoDB calls happen for one project list request.

Done means:

- We know exactly which step takes the most time.
- We know how many database round trips happen per request.
- We stop guessing and fix the slowest part first.

## 2. Check auth middleware

Every protected API request runs `authenticate` first.

Right now auth does these things:

- Verifies the JWT.
- Loads the session from MongoDB.
- Loads the user from MongoDB.
- Sometimes updates session activity.

This can add extra database work before the project route even starts.

What to do:

- Make the session query use `.lean()` if the code does not need a full Mongoose document.
- Make the user query use `.lean()` if the code does not need a full Mongoose document.
- Check if session and user can be fetched in parallel after JWT verification.
- Avoid writing session activity too often.
- Consider caching valid session/user data for a short time.

Done means:

- Auth should be fast and predictable.
- Project listing should not spend most of its time just proving who the user is.

## 3. Check tenant lookup

After auth, `resolveTenant` loads the tenant from MongoDB on every protected request.

For project listing, this is another database call before the real work starts.

What to do:

- Measure how long `Tenant.findById()` takes.
- Check if the tenant data is already available from the auth step.
- Cache tenant data for a short time, for example 1 to 5 minutes.
- Only load the fields needed by the API.

Done means:

- The tenant lookup should not hit MongoDB every single time if the same tenant is making many requests.
- The route should still reject deleted or missing tenants correctly.

## 4. Check session lookup

The session lookup is important for security, but it may be adding latency on every API call.

What to do:

- Make sure there is an index on session `_id`, `userId`, `tenantId`, `revokedAt`, and `expiresAt` where useful.
- Use a lightweight query that only selects needed fields.
- Consider Redis caching for active sessions.
- Invalidate the cache when the user logs out, logs out all devices, or the account is disabled.

Done means:

- Active sessions are checked quickly.
- Revoked sessions are still blocked.
- Security is not weakened for speed.

## 5. Check unread count aggregation

Project listing also calculates unread message counts.

This can become expensive because it checks conversations and messages for the projects on the page.

What to do:

- Measure how much time the unread count aggregation takes.
- Run MongoDB `explain()` on the unread count aggregation.
- Check if `$not` with `$elemMatch` is using indexes poorly.
- Consider storing unread counts separately instead of calculating them every time.
- Example: keep a per-user unread counter when messages are created or marked as read.

Done means:

- Loading projects should not need to scan many message documents.
- Unread counts should still be correct for each user.

## 6. Reduce MongoDB round trips

One project list request currently does multiple database calls:

- Session lookup.
- User lookup.
- Tenant lookup.
- Project list query.
- Project count query.
- Conversation lookup.
- Message unread aggregation.
- User lookup for assignment cleanup.

Even if each query is small, many round trips to MongoDB Atlas can add up.

What to do:

- Log every MongoDB query during one project list request.
- Combine queries where it makes sense.
- Run independent queries in parallel with `Promise.all`.
- Cache repeated data like tenant, session, and user.
- Remove work that is not needed for the list screen.

Done means:

- A normal project list request uses fewer database calls.
- The endpoint should feel fast even when MongoDB Atlas network latency is not perfect.

## 7. Review assignment cleanup

After loading projects, the service cleans `clients` and `members` by loading users again.

This protects the response from showing deleted or inactive users, but it is another database call.

What to do:

- Check if this cleanup is needed on every project list request.
- If it is needed, keep it as one batched query.
- Consider storing only valid active assignments when projects are updated.
- Consider returning assignment IDs directly and loading full member/client details only when needed.

Done means:

- The list endpoint does not do extra cleanup work unless the UI really needs it.

## 8. Add endpoint profiling

Before changing more project query code, add simple profiling.

What to do:

- Add request timing for `/api/projects`.
- Log timings in development and benchmark mode.
- Include timings for middleware and service steps.
- Include request id, user role, tenant id, page, limit, and total query count.

Done means:

- `BENCHMARKS.md` can show which part improved.
- Future changes can be measured instead of guessed.

## 9. Replace in-memory rate limiting with Redis

The current rate limiters store request counts in memory.

That has problems:

- Limits reset when the server restarts.
- Limits do not work correctly if the app runs on multiple servers.
- Each server has its own separate limit counter.
- Memory can grow if many different IPs or users hit the API.

What to do:

- Add Redis configuration.
- Create a shared Redis client.
- Replace `backend/src/middleware/rateLimit.middleware.js` with a Redis-backed limiter.
- Replace `backend/src/middleware/messageRateLimit.middleware.js` with a Redis-backed limiter.
- Use keys like `rate:general:<ip>`, `rate:auth:<ip>`, and `rate:message:<tenantId>:<userId>`.
- Set Redis expiry equal to the rate limit window.
- Keep the same HTTP headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and `Retry-After`.
- Decide what happens if Redis is down.

Recommended Redis-down behavior:

- For auth and message sending, fail closed or use a very strict fallback.
- For general API requests, fail open for a short outage if user experience matters more.

Done means:

- Rate limits work across all app instances.
- Restarting the server does not wipe rate limit state.
- Message spam protection is shared and reliable.

## 10. Re-run benchmarks after each fix

Do not make all changes at once and then benchmark.

What to do:

- Benchmark after profiling is added.
- Benchmark after auth/session changes.
- Benchmark after tenant caching.
- Benchmark after unread count changes.
- Benchmark after Redis rate limiting.

Done means:

- `BENCHMARKS.md` shows which change actually improved latency.
- The target should be much lower than 2 seconds for `GET /api/projects?page=1&limit=20`.
