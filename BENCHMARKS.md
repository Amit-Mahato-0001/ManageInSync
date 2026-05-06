# Projects API Benchmark - Query Optimization (Autocannon)

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
|------|------:|
| Avg  | 2209.57 |
| p50  | 2022 |
| p99  | 3818 |
| Max  | 4384 |

Requests
| Metric | Value |
|------|------:|
| Req/Sec (avg) | 17.11 |
| Total         | 342 |
| Sent          | 382 |

Throughput
| Metric | Value |
|------|------:|
| Avg Bytes/sec | 128596.8 |

Errors
| Metric | Value |
|------|------:|
| Errors | 0 |
| Timeouts | 0 |
| Non-2xx | 0 |

---

## AFTER (Query Optimized)

Latency (ms)
| Metric | Value |
|------|------:|
| Avg  | 2181.88 |
| p50  | 2014 |
| p99  | 4018 |
| Max  | 4139 |

Requests
| Metric | Value |
|------|------:|
| Req/Sec (avg) | 17.50 |
| Total         | 350 |
| Sent          | 390 |

Throughput
| Metric | Value |
|------|------:|
| Avg Bytes/sec | 129829 |

Errors
| Metric | Value |
|------|------:|
| Errors | 0 |
| Timeouts | 0 |
| Non-2xx | 0 |

---

## AFTER (Indexes Applied)

Latency (ms)
| Metric | Value |
|------|------:|
| Avg  | 2161.42 |
| p50  | 2012 |
| p99  | 3920 |
| Max  | 5872 |

Requests
| Metric | Value |
|------|------:|
| Req/Sec (avg) | 17.30 |
| Total         | 346 |
| Sent          | 386 |

Throughput
| Metric | Value |
|------|------:|
| Avg Bytes/sec | 128351.4 |

Errors
| Metric | Value |
|------|------:|
| Errors | 0 |
| Timeouts | 0 |
| Non-2xx | 0 |

---

## DELTA (Baseline -> Indexes Applied)

| Metric | Before | Indexed | Change |
|------|------:|------:|------:|
| Avg Latency | 2209.57 | 2161.42 | -2.18% |
| p50 Latency | 2022 | 2012 | -0.49% |
| p99 Latency | 3818 | 3920 | +2.67% |
| Max Latency | 4384 | 5872 | +33.94% |
| Req/Sec | 17.11 | 17.30 | +1.11% |
| Total Requests | 342 | 346 | +1.17% |
| Throughput | 128596.8 | 128351.4 | -0.19% |
| Errors | 0 | 0 | 0 |

---

## RUN NOTES

- Indexes were created in MongoDB Atlas before the latest run.
- First indexed run had 1 timeout, so the clean second run is recorded above.
- The clean indexed run still shows ~2s p50 latency, which means the main bottleneck is likely outside the project list query itself.

---

## RESULT

- Query hydration/select overhead was reduced earlier.
- Project and unread-count indexes are now applied.
- Latency did not materially improve after indexing, so the next investigation should profile middleware/auth/session/tenant DB lookups and the per-request Atlas round trips before changing more project query code.

---

## STATUS

Indexes applied and benchmarked. Further improvements require endpoint profiling beyond the Project query.
