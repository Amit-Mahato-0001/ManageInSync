# Why Projects Are Not Displaying

## Exact Problem

In [frontend/src/pages/Projects.jsx](frontend/src/pages/Projects.jsx), the projects list is loaded with:

```js
const res = await fetch(`/api/projects?page=${page}&limit=2`)
```

This is the core issue.

1. The app is running on Vite (`http://localhost:5173`) and `frontend/vite.config.js` has no `/api` proxy configured.
2. So `fetch('/api/projects')` does **not** hit the backend (`http://localhost:3000/api/projects`); it hits the frontend origin and fails (usually 404/HTML response).
3. Even if the request reached backend, this raw `fetch` does not attach the `Authorization: Bearer <token>` header.
4. Backend project routes are protected by global auth middleware in [backend/src/app.js](backend/src/app.js), so unauthenticated calls return `401 Unauthorized`.
5. Result: `data.projects` is missing (or JSON parse fails), `setProjects(...)` never gets valid data, and nothing is rendered.

## Correct Fix

Use the existing API client (`frontend/src/api/axios.js`) via `fetchProjects()` in `frontend/src/api/projects.js` for project loading, or call:

```js
api.get('/projects', { params: { page, limit: 2 } })
```

This ensures:
- correct backend base URL (`http://localhost:3000/api`)
- JWT auth header is attached by interceptor
- response shape matches `projects.data` and `projects.pagination`
