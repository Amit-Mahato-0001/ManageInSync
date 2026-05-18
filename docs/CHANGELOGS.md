# Changelog

## 2026-05-18

- Removed extra database check from project listing.

- Earlier GET /api/projects was checking assigned clients/members from users collection every time.

- Now it only cleans/normalizes client/member IDs locally.

- Project create and assign APIs still validate clients/members properly, so safety is kept.

- Project listing MongoDB calls reduced from 8 to 7.

- Slow projects.assignment_cleanup step is gone.

- Backend tests passed.

- Profiler after change showed assignment step now takes almost 0 ms.
