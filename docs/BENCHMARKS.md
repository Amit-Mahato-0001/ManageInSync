# Projects API Benchmark - Query Optimization

## Endpoint

`GET /api/projects?page=1&limit=20`

## Environment

- Tool: autocannon
- Connections: 40
- Duration: 20s
- Dataset: 300 projects
- Database: MongoDB Atlas
- Auth: JWT

---

# BEFORE (Baseline)

## Latency

| Metric | Value |
|---|---:|
| Avg | 2209.57 ms |
| p50 | 2022 ms |
| p99 | 3818 ms |
| Max | 4384 ms |

## Requests

| Metric | Value |
|---|---:|
| Req/Sec | 17.11 |
| Total | 342 |

---

# AFTER (Query Optimized)

## Latency

| Metric | Value |
|---|---:|
| Avg | 2181.88 ms |
| p50 | 2014 ms |
| p99 | 4018 ms |
| Max | 4139 ms |

## Requests

| Metric | Value |
|---|---:|
| Req/Sec | 17.50 |
| Total | 350 |

---

# AFTER (Indexes Applied)

## Latency

| Metric | Value |
|---|---:|
| Avg | 2161.42 ms |
| p50 | 2012 ms |
| p99 | 3920 ms |
| Max | 5872 ms |

## Requests

| Metric | Value |
|---|---:|
| Req/Sec | 17.30 |
| Total | 346 |

---

# AFTER (Auth Middleware Optimized + Profiler)

## Fixture

- 300 projects
- 300 conversations
- 300 unread messages
- `PROJECT_LIST_PROFILE=true`

## Latency

| Metric | Value |
|---|---:|
| Avg | 2171.62 ms |
| p50 | 2043 ms |
| p99 | 2938 ms |
| Max | 5110 ms |

## Requests

| Metric | Value |
|---|---:|
| Req/Sec | 17.45 |
| Total | 349 |

---

# Profiler Summary

| Step | Avg ms |
|---|---:|
| auth.session_lookup | 435.30 |
| auth.user_lookup | 438.16 |
| tenant.lookup | 460.63 |
| projects.find | 395.55 |
| projects.count | 391.98 |
| conversation_lookup | 442.18 |
| unread_count_aggregation | 405.14 |

Important:

- Timings overlap because of `Promise.all`
- Nearly every MongoDB round trip becomes expensive under concurrency
- Endpoint still performs ~7 MongoDB operations/request

---

# Delta (Baseline → Indexed)

| Metric | Change |
|---|---:|
| Avg Latency | -2.18% |
| p50 | -0.49% |
| Req/Sec | +1.11% |
| Throughput | -0.19% |

Indexes gave minimal improvement.

---

# Main Finding

Indexes are not the main bottleneck.

The endpoint is slow mainly because of request fan-out:

- Session lookup
- User lookup
- Tenant lookup
- Project count
- Conversation lookup
- Unread aggregation

---

# Next Optimizations

1. Cache tenant/session/user lookups
2. Remove exact `countDocuments` from hot path
3. Store unread counters instead of aggregation
4. Reduce MongoDB round trips
5. Merge conversation + unread queries where possible

---

# Result

- Query optimization completed
- Indexes applied
- Auth hot path optimized
- Endpoint still averages ~2s latency under load
- Next optimization phase should focus on reducing DB round trips