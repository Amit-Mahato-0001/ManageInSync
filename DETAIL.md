# Projects Not Updating "Realtime" (But Tasks Do)

## What is happening

This is **not true realtime** in either module (no WebSocket/SSE/pub-sub layer exists in the codebase).

What you are seeing:

- `Tasks` feels realtime because after create/delete it explicitly fetches fresh data (`loadTasks()`) when already on page 1.
- `Projects` does **not** refetch after create/delete; it only calls `setPage(1)`.

## Why Projects requires reload

In `Projects.jsx`:

- Data load effect runs on `[page]`.
- After create/delete, handler does `setPage(1)` only.
- If you are already on page 1, React ignores same-value state update, so effect does not run and list stays stale until manual reload.

## Why Tasks auto-updates

In `Tasks.jsx` handlers:

- If current page is 1 -> it directly calls `await loadTasks()`.
- Else -> it changes page to 1 so effect reloads tasks.

So tasks are refreshed immediately in UI after mutation.

## How to solve (no code applied here)

Use the same refresh pattern in Projects:

1. Extract `loadProjects` into a reusable function (similar to `loadTasks` with `useCallback`).
2. After create/delete:
   - If `page === 1`, call `await loadProjects()`.
   - Else set page to `1`.
3. For delete edge case (last item on page), optionally use the same logic as Tasks:
   - If deleting last row and `page > 1`, go to previous page.
   - Otherwise refetch current page.

## Optional: If you want actual cross-user realtime

Current app only refreshes in the tab where action occurred.  
For true realtime across all connected users, add backend event push (WebSocket/SSE) and subscribe in frontend for project create/update/delete events.
