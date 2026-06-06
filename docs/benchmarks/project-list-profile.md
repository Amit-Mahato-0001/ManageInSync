## Performance Profiling Report

### Test Configuration

| Metric | Value |
|----------|----------|
| Endpoint | `GET /api/projects?page=1&limit=20` |
| Requests Analyzed | 349 |
| Profiling Date | 20 May 2026 |

---

## Overall Request Performance

| Metric | Value |
|----------|----------|
| Average Response Time | 2162.94 ms |
| Median (P50) | 2039.18 ms |
| P95 Latency | 2915.88 ms |
| P99 Latency | 2931.36 ms |
| Maximum Response Time | 5064.21 ms |

### Findings

- Average response time exceeded **2 seconds**, indicating significant backend latency.
- Most requests completed between **2.0–2.9 seconds**.
- A small number of requests experienced latency spikes above **5 seconds**.

---

## Database Activity

| Metric | Value |
|----------|----------|
| Average Mongo Queries per Request | 7 |
| Maximum Queries per Request | 8 |

### Findings

- Query count remained stable across requests.
- No evidence of an N+1 query issue.
- Performance bottlenecks are caused by query execution time rather than excessive query volume.

---

## Request Lifecycle Breakdown

| Execution Stage | Average Time |
|----------------|-------------|
| Session Lookup | 435.30 ms |
| User Lookup | 438.16 ms |
| Tenant Lookup | 460.63 ms |
| Project Fetch | 395.55 ms |
| Project Count | 391.98 ms |
| Conversation Lookup | 442.18 ms |
| Unread Count Aggregation | 405.14 ms |
| Assignment Normalization | 0.02 ms |
| Total Handler Execution | 1257.46 ms |

---

## Bottleneck Analysis

### Authentication Layer

Session and user lookups together consumed approximately:

```txt
435.30 ms + 438.16 ms
≈ 873 ms
```

### Tenant Resolution

Tenant lookup averaged:

```txt
460.63 ms
```

### Project Operations

Project retrieval and related operations consumed approximately:

```txt
395.55 ms
+ 391.98 ms
+ 442.18 ms
+ 405.14 ms
≈ 1635 ms
```

These operations were the primary contributors to endpoint latency.

---

## Optimization Opportunities

### High Priority

- Add indexes for:
  - `tenantId`
  - `projectId`
  - `assignedTo`
  - `conversationId`

- Reduce sequential database queries.
- Cache session and tenant information.
- Optimize aggregation pipelines.

### Medium Priority

- Reduce unread count aggregation cost.
- Avoid executing `countDocuments()` on every request.
- Consider cursor-based pagination.

### Low Priority

- Assignment normalization already averages only **0.02 ms** and requires no optimization.

---

## Key Takeaways

### Current Performance

- Average API latency: **2162.94 ms**
- P95 latency: **2915.88 ms**
- P99 latency: **2931.36 ms**

### Main Bottlenecks

1. Authentication lookups
2. Tenant resolution
3. Project-related database operations

### Expected Impact

Optimizing these areas could significantly reduce response times and improve scalability under concurrent load.

---

## Conclusion

Profiling revealed that the endpoint's latency is primarily driven by database operations rather than application logic. Query counts remained stable, indicating that optimization efforts should focus on indexing strategy, query efficiency, caching, and aggregation performance.