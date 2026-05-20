# Updates

## 2026-05-20

- Reran the authenticated project list benchmark after the auth middleware optimization.

- Stored raw benchmark artifacts in `docs/benchmark-results/`:
  - `project-list-profile-2026-05-20.autocannon.json`
  - `project-list-profile-2026-05-20.profiler-summary.json`

- Benchmark fixture used 300 projects, 300 conversations, and 300 unread messages under a benchmark-only tenant.

- Latest `GET /api/projects?page=1&limit=20` result: 2171.62 ms average latency, 2043 ms p50, 2938 ms p99, 17.45 req/sec, 0 errors, and 0 non-2xx responses.

- Profiler confirms the endpoint still performs about 7 MongoDB operations per request after the auth optimization.

- Next optimization target should be reducing per-request MongoDB round trips, especially repeated auth/session/user/tenant lookups and project-list companion reads.

