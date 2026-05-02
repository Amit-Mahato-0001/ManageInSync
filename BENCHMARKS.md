# Projects API Benchmark — Query Optimization (Autocannon)

## Endpoint
GET /api/projects?page=1&limit=20

## Environment
- Tool: autocannon
- Connections: 40
- Duration: 20s
- Pipelining: 1
- Dataset: 300 projects
- Database: MongoDB Atlas
- Auth: JWT

---

## BEFORE (Baseline)

Latency (ms)
| Metric | Value |
|------|------|
| Avg  | 2209.57 |
| p50  | 2022 |
| p99  | 3818 |
| Max  | 4384 |

Requests
| Metric | Value |
|------|------|
| Req/Sec (avg) | 17.11 |
| Total         | 342 |
| Sent          | 382 |

Throughput
| Metric | Value |
|------|------|
| Avg Bytes/sec | 128596.8 |

Errors
| Metric | Value |
|------|------|
| Errors | 0 |
| Timeouts | 0 |
| Non-2xx | 0 |

---

## AFTER (Query Optimized)

Latency (ms)
| Metric | Value |
|------|------|
| Avg  | 2181.88 |
| p50  | 2014 |
| p99  | 4018 |
| Max  | 4139 |

Requests
| Metric | Value |
|------|------|
| Req/Sec (avg) | 17.50 |
| Total         | 350 |
| Sent          | 390 |

Throughput
| Metric | Value |
|------|------|
| Avg Bytes/sec | 129829 |

Errors
| Metric | Value |
|------|------|
| Errors | 0 |
| Timeouts | 0 |
| Non-2xx | 0 |

---

## DELTA

| Metric | Before | After | Change |
|------|------:|------:|------:|
| Avg Latency | 2209.57 | 2181.88 | -1.25% |
| p50 Latency | 2022 | 2014 | -0.40% |
| p99 Latency | 3818 | 4018 | +5.24% |
| Max Latency | 4384 | 4139 | -5.59% |
| Req/Sec | 17.11 | 17.50 | +2.28% |
| Total Requests | 342 | 350 | +2.34% |
| Throughput | 128596.8 | 129829 | +0.96% |
| Errors | 0 | 0 | — |

---

## RESULT

- Small but measurable improvement in average latency and throughput
- No errors or failed requests
- High latency (~2s p50) indicates bottleneck beyond query hydration

---

## STATUS

Query overhead reduced (lean, select, controlled populate, exists)  
Further improvements require query design changes, indexing and caching