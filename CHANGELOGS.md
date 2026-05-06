# Changelog

## 2026-05-06

- Optimized project list query & reduced unnecessary hydration/select overhead

- Added indexes for project and unread-count lookups then benchmarked endpoint performance using Autocannon

- Benchmark results show only minor latency improvement indicating the main bottleneck exists outside the core project query