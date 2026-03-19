# Task Pagination Buttons Not Working - Root Cause Analysis

## Symptom
- In the Tasks page, pagination buttons appear non-functional (especially next page staying disabled or page changes not affecting task list).

## Problems Found

### 1) Frontend API call ignores pagination params
- File: `frontend/src/api/tasks.js` (line 3-5)
- Current code:
  - `fetchTasks` does not accept `params`.
  - It always calls `GET /tasks` without `page` or `limit`.
- Impact:
  - Clicking page buttons changes React state, but backend receives no page info, so data does not paginate correctly.

### 2) Task controller does not read query pagination values
- File: `backend/src/controllers/task.controller.js` (line 32-40)
- Current code:
  - `getTasksHandler` only sends `tenantId` and `user` to service.
  - `page` and `limit` are never parsed from `req.query`.
- Impact:
  - Service receives `page` and `limit` as `undefined`.

### 3) Task service pagination logic is broken with undefined values
- File: `backend/src/services/task.service.js` (line 61-67, 79)
- Current code issues:
  - `skip` is calculated from `page` and `limit` even when undefined.
  - `.limit()` is called with no argument (`.limit()` instead of `.limit(limit)`).
  - `totalPages` uses `Math.ceil(total / limit)` where `limit` can be undefined (results in `NaN`).
- Impact:
  - Pagination metadata becomes invalid (`NaN`), and task query is not actually limited per page.

### 4) UI fallback hides backend pagination failure and locks next button
- File: `frontend/src/pages/Tasks.jsx` (line 211)
- Current code:
  - `totalPages={pagination.totalPages || 1}`
- Impact:
  - If backend returns invalid `totalPages` (e.g., `NaN`), UI falls back to `1`, so `page === totalPages` on first page and next button stays disabled.

## Solutions

### Solution 1: Pass query params from frontend API
- Update `frontend/src/api/tasks.js`:
  - `export const fetchTasks = (params) => api.get("/tasks", { params });`

### Solution 2: Parse and forward `page`/`limit` in task controller
- Update `backend/src/controllers/task.controller.js`:
  - Parse:
    - `const page = parseInt(req.query.page) || 1`
    - `const limit = parseInt(req.query.limit) || 10`
  - Pass both to `getTasks(...)`.

### Solution 3: Fix task service pagination defaults and query
- Update `backend/src/services/task.service.js`:
  - Ensure numeric defaults inside service as a safety net.
  - Use:
    - `const safePage = Math.max(1, Number(page) || 1)`
    - `const safeLimit = Math.max(1, Number(limit) || 10)`
    - `const skip = (safePage - 1) * safeLimit`
  - Query with `.limit(safeLimit)` (not empty `.limit()`).
  - Return pagination using `safePage/safeLimit`.

### Solution 4: Make pagination UI defensive but not masking bugs
- Keep fallback, but prefer validating backend response.
- Example:
  - `const totalPages = Number.isFinite(pagination.totalPages) && pagination.totalPages > 0 ? pagination.totalPages : 1`
- This avoids silent behavior and makes debugging easier.

## Recommended Fix Order
1. Fix backend controller + service pagination first (source of invalid metadata).
2. Fix frontend `fetchTasks(params)` so page clicks actually change API request.
3. Add defensive `totalPages` handling in UI.

## Quick Verification Checklist
- Open Tasks page with more than 3 tasks.
- Click next page:
  - Request URL should include `?page=2&limit=3`.
  - Returned `tasks.pagination.page` should be `2`.
  - Returned `tasks.data` should differ from page 1.
- Confirm next button disables only on last page, not on first page by default.
