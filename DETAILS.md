# Deployment & Runtime Changes

## 1. Single Container Deployment (Frontend + Backend)

**What:**
- Docker multi-stage build added.
- Frontend is built inside container.
- Backend serves frontend static files.
- Both run in a single container on port 3000.

**Why:**
- Simplifies deployment (one service instead of two).
- Ensures consistent environment across systems.

---

## 2. Root Deployment Setup

**What:**
- Added root `package.json` with:
  - install, build, and start scripts
- Standardized entrypoint for deployment platforms.

**Why:**
- Makes project deployable without custom setup.

---

## 3. Docker Support

**What:**
- Added `Dockerfile` and `.dockerignore`.
- Production dependencies only included.
- Secrets excluded from image.

**Why:**
- Clean, secure, and reproducible builds.

---

## 4. Backend Serving Frontend

**What:**
- Backend serves `frontend/dist` as static files.
- SPA fallback route added (non-API routes → `index.html`).

**Why:**
- Supports React/Vite routing in production.
- Avoids 404 on page refresh.

---

## 5. API Routing Cleanup

**What:**
- Introduced `protectedApi` router.
- Separated public and authenticated routes.

**Why:**
- Prevents auth middleware from affecting frontend routes.
- Cleaner structure.

---

## 6. Frontend API URL Fix

**What:**
- Default API URL:
  - Dev → `http://localhost:3000/api`
  - Prod → `/api`

**Why:**
- Avoids hardcoded localhost in production.
- Supports same-origin deployment.

---

## Result

- Frontend + backend run in one container  
- Project is fully deployable with Docker  
- No environment-specific breakage  
