# Project Listing Slowness Results

## Overview

Investigated slow `GET /api/projects?page=1&limit=20` endpoint.

Even after query optimization and indexes:

| Stage | Avg Latency |
|---|---:|
| Before | 2209 ms |
| After query optimization | 2181 ms |
| After indexes | 2161 ms |

Indexes improved latency by only ~2.18%.

---

## Main Finding

Problem is not only the project query.

Each request still performs multiple MongoDB round trips:

- Session lookup
- User lookup
- Tenant lookup
- Project query
- Project count
- Conversation lookup
- Unread aggregation
- Assignment normalization

Total: ~7-8 MongoDB operations/request.

---

## Profiling Added

Added request-level profiler using:

```env
PROJECT_LIST_PROFILE=true
```

Profiler measures:

- Full request time
- Mongo query count
- Middleware timings
- Aggregation timings

Files instrumented:

- `auth.middleware.js`
- `tenant.middleware.js`
- `project.controller.js`
- `project.service.js`
- `requestProfiler.js`

---

## Latest Profiled Result

| Metric | Value |
|---|---:|
| Avg latency | 2171 ms |
| p50 | 2043 ms |
| p99 | 2938 ms |
| Req/Sec | 17.45 |
| Avg Mongo ops | 7.03 |

Heavy steps:

| Step | Avg ms |
|---|---:|
| auth.session_lookup | 435 ms |
| auth.user_lookup | 438 ms |
| tenant.lookup | 460 ms |
| projects.find | 395 ms |
| projects.count | 391 ms |
| conversation lookup | 442 ms |
| unread aggregation | 405 ms |

---

## Root Cause

Main issue is request fan-out under concurrency.

Even optimized queries become expensive because every request performs many DB reads.

Unread aggregation using:

```js
readBy: {
  $not: {
    $elemMatch: {
      userId: userObjectId
    }
  }
}
```

may also reduce index efficiency.

---

## Recommended Fixes

Priority order:

1. Cache tenant lookup
2. Cache active session/user data
3. Remove exact `countDocuments` from hot path
4. Store unread counters instead of aggregation
5. Reduce conversation + unread queries into fewer reads