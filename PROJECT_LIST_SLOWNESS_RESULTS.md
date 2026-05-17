# Project Listing Slowness Results

## Task Covered

This file covers item 1 from `DETAILS.md`:

`Project listing is still too slow`

Main endpoint checked:

`GET /api/projects?page=1&limit=20`

## Benchmark Result From `BENCHMARKS.md`

The project listing endpoint is still slow even after query optimization and indexes.

| Stage | Avg Latency | p50 | p99 | Max | Req/Sec |
|---|---:|---:|---:|---:|---:|
| Before | 2209.57 ms | 2022 ms | 3818 ms | 4384 ms | 17.11 |
| After query optimization | 2181.88 ms | 2014 ms | 4018 ms | 4139 ms | 17.50 |
| After indexes | 2161.42 ms | 2012 ms | 3920 ms | 5872 ms | 17.30 |

Important result:

Indexes improved average latency by only `2.18%`.

That is too small. It means the project query itself is probably not the only bottleneck.

## What Was Done

I added request-level profiling for only the project list endpoint.

The profiler is off by default.

Enable it with:

`PROJECT_LIST_PROFILE=true`

When enabled, the backend logs one summary for every:

`GET /api/projects`

The log name is:

`[project-list-profile]`

## Files Changed

Profiling utility added:

- `backend/src/utils/requestProfiler.js`

Existing files instrumented:

- `backend/src/app.js`
- `backend/src/middleware/auth.middleware.js`
- `backend/src/middleware/tenant.middleware.js`
- `backend/src/controllers/project.controller.js`
- `backend/src/services/project.service.js`

## What The Profiler Measures

The profiler now measures:

- Full request time.
- Response status code.
- MongoDB query count.
- MongoDB operation names.
- Auth session lookup time.
- Auth user lookup time.
- Tenant lookup time.
- Project list query time.
- Project count query time.
- Conversation lookup time.
- Unread count aggregation time.
- Assignment cleanup time.

## Current Request Flow

One project list request currently goes through these steps:

1. API rate limiter runs.
2. Auth middleware verifies the JWT.
3. Auth middleware loads the session from MongoDB.
4. Auth middleware loads the user from MongoDB.
5. Tenant middleware loads the tenant from MongoDB.
6. Project service loads the project page.
7. Project service counts total projects.
8. Project service loads conversations for projects on the page.
9. Project service aggregates unread message counts.
10. Project service checks assigned clients and members.
11. Controller sends the response.

## MongoDB Round Trip Result

A normal project list request can require up to 8 MongoDB operations:

| Step | MongoDB Operation |
|---|---|
| Session check | `sessions.findOne` |
| User check | `users.findOne` |
| Tenant lookup | `tenants.findOne` |
| Project list | `projects.find` |
| Project total | `projects.countDocuments` |
| Conversation lookup | `conversations.find` |
| Unread count | `messages.aggregate` |
| Assignment cleanup | `users.find` |

There can also be an extra session write:

`sessions.updateOne`

That happens when session activity needs to be refreshed.

## Important Finding

The project list API is not just doing one project query.

Even if the project indexes are correct, the endpoint still spends time on:

- Auth/session database lookup.
- User database lookup.
- Tenant database lookup.
- Conversation lookup.
- Message unread aggregation.
- Assignment cleanup.

This explains why project indexes did not noticeably fix the 2 second latency.

## Index Review Result

Project indexes already cover the main list patterns:

- Tenant + deleted status + created date.
- Tenant + deleted status + project status.
- Tenant + deleted status + client assignment.
- Tenant + deleted status + member assignment.

Conversation indexes also cover:

- Tenant + project + deleted status.
- Unique active conversation per tenant/project.

Message indexes cover:

- Tenant + conversation + created date.
- Tenant + project + created date.
- Tenant + project + conversation + deleted status.

Possible concern:

Unread count uses this condition:

```js
readBy: {
  $not: {
    $elemMatch: {
      userId: userObjectId
    }
  }
}
```

That condition may not use indexes well because it asks MongoDB to find messages where the current user is not inside an array.

## How To Run The Profiler

From the backend folder:

```powershell
$env:PROJECT_LIST_PROFILE="true"
npm.cmd run dev
```

Then call:

```text
GET /api/projects?page=1&limit=20
```

The backend console will print a result like:

```js
[project-list-profile] {
  requestId: "example-id",
  method: "GET",
  path: "/api/projects?page=1&limit=20",
  statusCode: 200,
  totalMs: 2161.42,
  mongoQueryCount: 8,
  mongoQueries: [
    "sessions.findOne",
    "users.findOne",
    "tenants.findOne",
    "projects.find",
    "projects.countDocuments",
    "conversations.find",
    "messages.aggregate",
    "users.find"
  ],
  steps: [
    { name: "auth.session_lookup", durationMs: 0 },
    { name: "auth.user_lookup", durationMs: 0 },
    { name: "tenant.lookup", durationMs: 0 },
    { name: "projects.find", durationMs: 0 },
    { name: "projects.count", durationMs: 0 },
    { name: "projects.page_loaded", durationMs: 0, projectCount: 20, total: 300 },
    { name: "projects.conversation_lookup", durationMs: 0 },
    { name: "projects.unread_count_aggregation", durationMs: 0 },
    { name: "projects.assignment_cleanup", durationMs: 0 },
    { name: "projects.handler_total", durationMs: 0 }
  ]
}
```

The `0` values above are placeholders. The real run will print real timings.

## How To Read The Result

If these are slow:

- `auth.session_lookup`
- `auth.user_lookup`
- `tenant.lookup`

Then the main problem is middleware and repeated database lookups before the project query.

If this is slow:

- `projects.unread_count_aggregation`

Then the main problem is unread message counting.

If this is slow:

- `projects.assignment_cleanup`

Then the API is spending too much time validating clients/members on every list request.

If this number is high:

- `mongoQueryCount`

Then the endpoint is slow because it makes too many MongoDB Atlas round trips.

## What We Know Now

Confirmed:

- The benchmark still shows around 2 seconds latency.
- Project indexes alone did not fix the issue.
- The endpoint has multiple database calls outside the project query.
- Auth, tenant lookup, unread counts, and assignment cleanup are now measurable.
- The project list request can now be profiled step by step instead of guessed.

Not confirmed yet:

- The exact slowest step in a real authenticated benchmark run.

Reason:

- A real `/api/projects` benchmark needs a running server, MongoDB Atlas connection, and a valid JWT.
- The code now prints the exact timings when that benchmark is run.

## Verification

Backend tests were run after adding profiling:

```powershell
npm.cmd test
```

Result:

All backend tests passed.

The test output included expected rate-limit and payload-size messages:

- `Too many authentication requests. Please try again later.`
- `request entity too large`

These messages came from existing tests and did not fail the suite.

## Recommended Next Fixes

After running the profiler with a real auth token, fix the slowest measured step first.

Most likely fixes:

1. Cache tenant lookup for a short time.
2. Cache active session/user data carefully.
3. Replace unread count aggregation with stored unread counters.
4. Remove assignment cleanup from every list request if the UI does not need it.
5. Reduce total MongoDB round trips for the project list screen.

## Final Result For Item 1

Item 1 is now done at the investigation/profiling level.

The endpoint now has timing logs for each important step, and this file records the current findings clearly.

The next step is to run the endpoint with:

`PROJECT_LIST_PROFILE=true`

Then use the logged slowest step to decide the first real optimization.
