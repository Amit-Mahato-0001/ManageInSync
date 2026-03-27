# DETAIL - Full Docker + CI/CD Setup (Do It Yourself Guide)

This guide is written for your placement timeline.
Follow these steps in order, without skipping.

Important:
Your current `backend/.env` contains real secrets (Mongo URI, JWT secret, email password).
Do not commit real secrets to GitHub.
Rotate these credentials before production use.

## Goal

By the end of this guide you will have:

1. Docker setup for backend
2. Docker setup for frontend
3. `docker-compose.yml` for local full stack run
4. GitHub Actions CI workflow
5. GitHub Actions CD workflow (build + push Docker images)

---

## Part 0 - Prerequisites

Install these first:

1. Docker Desktop
2. Git
3. GitHub account
4. VS Code (or your IDE)

Verify installation:

```powershell
docker --version
docker compose version
git --version
```

---

## Part 1 - Create a safe working branch

```powershell
git checkout -b chore/docker-cicd
```

---

## Part 2 - Prepare code before Docker

### Step 2.1 - Make frontend API URL configurable

File: `frontend/src/api/axios.js`

Replace hardcoded base URL with env-based URL:

```js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  withCredentials: false
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default api
```

### Step 2.2 - Add backend start script

File: `backend/package.json`

Update scripts section to include start command:

```json
"scripts": {
  "start": "node server.js",
  "test": "echo \"No backend tests yet\" && exit 0"
}
```

You can keep more scripts later (dev, lint, etc.).

### Step 2.3 - Create env example files

Create `backend/.env.example`:

```env
PORT=3000
MONGO_URI=mongodb://mongo:27017/manageinsync
JWT_SECRET=replace_me
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=replace_me
EMAIL_PASS=replace_me
FRONTEND_URL=http://localhost:5173
```

Create `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## Part 3 - Dockerize backend

### Step 3.1 - Create backend Dockerfile

File: `backend/Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### Step 3.2 - Create backend dockerignore

File: `backend/.dockerignore`

```gitignore
node_modules
npm-debug.log
.env
.git
.gitignore
```

### Step 3.3 - Build backend image locally

```powershell
docker build -t agency-os-backend -f backend/Dockerfile backend
```

---

## Part 4 - Dockerize frontend

### Step 4.1 - Add nginx config for React Router

File: `frontend/nginx.conf`

```nginx
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri /index.html;
  }
}
```

### Step 4.2 - Create frontend Dockerfile

File: `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:3000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Step 4.3 - Create frontend dockerignore

File: `frontend/.dockerignore`

```gitignore
node_modules
dist
npm-debug.log
.env
.git
.gitignore
```

### Step 4.4 - Build frontend image locally

```powershell
docker build -t agency-os-frontend --build-arg VITE_API_BASE_URL=http://localhost:3000/api -f frontend/Dockerfile frontend
```

---

## Part 5 - Add docker-compose for full local run

### Step 5.1 - Create backend docker env file

File: `backend/.env.docker`

```env
PORT=3000
MONGO_URI=mongodb://mongo:27017/manageinsync
JWT_SECRET=replace_me_with_strong_value
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=replace_me
EMAIL_PASS=replace_me
FRONTEND_URL=http://localhost:5173
```

Do not commit real values.
Commit only safe placeholders or keep this file untracked.

### Step 5.2 - Create compose file in project root

File: `docker-compose.yml`

```yaml
services:
  mongo:
    image: mongo:7
    container_name: agencyos-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: agencyos-backend
    restart: unless-stopped
    env_file:
      - ./backend/.env.docker
    depends_on:
      - mongo
    ports:
      - "3000:3000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: http://localhost:3000/api
    container_name: agencyos-frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "5173:80"

volumes:
  mongo_data:
```

### Step 5.3 - Run full stack

```powershell
docker compose up -d --build
```

### Step 5.4 - Check logs

```powershell
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongo
```

### Step 5.5 - Stop stack

```powershell
docker compose down
```

If you want to remove DB volume too:

```powershell
docker compose down -v
```

---

## Part 6 - Add GitHub Actions CI workflow

### Step 6.1 - Create workflow folder

```powershell
New-Item -ItemType Directory -Force .github/workflows
```

### Step 6.2 - Create CI workflow file

File: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  backend-check:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: backend/package-lock.json

      - name: Install backend deps
        run: npm ci

      - name: Syntax check
        run: |
          node --check server.js
          node --check src/app.js

  frontend-check:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install frontend deps
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

  docker-build-check:
    runs-on: ubuntu-latest
    needs: [backend-check, frontend-check]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build backend image
        run: docker build -t agency-os-backend -f backend/Dockerfile backend

      - name: Build frontend image
        run: docker build -t agency-os-frontend --build-arg VITE_API_BASE_URL=http://localhost:3000/api -f frontend/Dockerfile frontend
```

### Step 6.3 - Push and verify CI

```powershell
git add .
git commit -m "Add Docker + CI workflow"
git push -u origin chore/docker-cicd
```

Then open GitHub -> Actions tab -> check CI status.

---

## Part 7 - Add GitHub Actions CD workflow

This CD will:

1. Build Docker images
2. Push images to Docker Hub
3. Optional: trigger deploy hooks

### Step 7.1 - Create Docker Hub repositories

Create these repos in Docker Hub:

1. `agency-os-backend`
2. `agency-os-frontend`

### Step 7.2 - Add GitHub repository secrets

GitHub -> Repository -> Settings -> Secrets and variables -> Actions -> New repository secret

Add these secrets:

1. `DOCKERHUB_USERNAME`
2. `DOCKERHUB_TOKEN`
3. `DEPLOY_HOOK_BACKEND` (optional)
4. `DEPLOY_HOOK_FRONTEND` (optional)

### Step 7.3 - Create CD workflow file

File: `.github/workflows/cd.yml`

```yaml
name: CD

on:
  push:
    branches: [main]

jobs:
  publish-images:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push backend image
        uses: docker/build-push-action@v6
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/agency-os-backend:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/agency-os-backend:${{ github.sha }}

      - name: Build and push frontend image
        uses: docker/build-push-action@v6
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          push: true
          build-args: |
            VITE_API_BASE_URL=${{ vars.PROD_API_BASE_URL }}
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/agency-os-frontend:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/agency-os-frontend:${{ github.sha }}

  trigger-deploy:
    runs-on: ubuntu-latest
    needs: [publish-images]
    if: ${{ secrets.DEPLOY_HOOK_BACKEND != '' && secrets.DEPLOY_HOOK_FRONTEND != '' }}

    steps:
      - name: Trigger backend deploy
        run: curl -X POST "${{ secrets.DEPLOY_HOOK_BACKEND }}"

      - name: Trigger frontend deploy
        run: curl -X POST "${{ secrets.DEPLOY_HOOK_FRONTEND }}"
```

### Step 7.4 - Add repository variable for frontend build arg

GitHub -> Settings -> Secrets and variables -> Actions -> Variables

Add variable:

- `PROD_API_BASE_URL` = your production backend URL + `/api`

Example:

- `https://api.yourdomain.com/api`

### Step 7.5 - Push to main and verify CD

1. Merge your PR to `main`
2. Open Actions tab
3. Check `CD` workflow
4. Confirm new images in Docker Hub

---

## Part 8 - Deployment notes (important)

CD above pushes images.
Where to run those images is your deployment target (Render, VPS, EC2, etc.).

For placements, this is enough proof:

1. CI green
2. CD green
3. Images published
4. App live link working

---

## Part 9 - Quick placement demo flow

Use this demo in interviews:

1. Show architecture doc
2. Show Docker files and compose
3. Show GitHub Actions CI/CD pipelines
4. Show Docker Hub images with latest tags
5. Open live app and run one business flow

Flow suggestion:

1. Login as owner
2. Create project
3. Assign member
4. Create task
5. Update task status
6. Show audit log

---

## Part 10 - Common mistakes to avoid

1. Hardcoded API URLs in frontend
2. Committing `.env` with real secrets
3. Missing React Router fallback in nginx
4. Using `latest` tag only (also push SHA tag)
5. Not testing `docker compose up` before pushing
6. No rollback plan

---

## Part 11 - Done checklist

Mark done only when all are true:

- [ ] `backend/Dockerfile` works
- [ ] `frontend/Dockerfile` works
- [ ] `docker-compose.yml` runs full stack
- [ ] `ci.yml` passes on PR
- [ ] `cd.yml` pushes images on main
- [ ] secrets are not committed
- [ ] live link is accessible

If all checked, your deployment story is placement-ready.
