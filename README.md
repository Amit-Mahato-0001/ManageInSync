<div align="center">
  <img src="./frontend/public/Union.png" alt="ManageInSync" width="700" />
</div>

<p align="center">
  Everything your agency needs to operate — clients, projects, teams, invoices, and conversations — in one workspace that actually makes sense.
</p>

<p align="center">
  <a href="#-introduction"><strong>Introduction</strong></a> ·
  <a href="#-features"><strong>Features</strong></a> ·
  <a href="#-getting-started"><strong>Getting Started</strong></a> ·
  <a href="#-deployment"><strong>Deployment</strong></a> ·
  <a href="#-architecture"><strong>Architecture</strong></a> ·
  <a href="#-tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#-contributing"><strong>Contributing</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-BullMQ_DC382D?style=flat-square&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-orange?style=flat-square" />
</p>

<br />

---

# Introduction

The easiest part of running an agency is the actual work — the design, the code, the craft.

The hard part is everything else. Chasing invoices. Keeping clients in the loop. Tracking which tasks are blocking which projects. Figuring out which team member is underwater and which one has capacity. Managing all of this across four different tools that don't talk to each other.

**ManageInSync is the open-source agency operations platform built to fix that.**

It is not a starter kit. It is not a boilerplate. It is a production-grade, multi-tenant workspace where clients, projects, teams, invoices, and conversations all live together — with a proper security model, real role enforcement, and an audit trail for everything that matters.

Built for agencies that have outgrown their current setup. Built to be self-hosted, customized, and owned.

---

# Features

## Multi-Tenant Workspaces

Every agency is a tenant. Every client, project, invoice, and conversation is isolated inside that tenant — not filtered, not scoped by a query parameter, but enforced at the middleware level before any business logic runs.

Spin up one instance. Serve multiple teams. Data never bleeds across workspaces.

## Projects & Tasks

Full project lifecycle management with role-aware visibility baked in from the start.

- Create projects and assign them to members and clients
- Break projects into tasks with statuses and ownership
- Owners and admins see everything. Members see their assignments. Clients see what's shared with them.
- Soft deletion — nothing disappears permanently without a trace

## Client Portal

Stop pasting updates into email threads. Give clients their own authenticated space.

- Clients log in and see only their projects and files
- Per-project conversations with message history, read tracking, and unread counts
- Invoice visibility and payment status — all in one place
- Role-gated so clients never see internal team conversations or financials

## Conversations

Per-project messaging that works the way teams actually communicate.

- Message editing and deletion
- Read receipts and unread counts per user
- Rate limiting to prevent abuse
- Fully scoped to project and tenant — no cross-project leakage

## Invoicing & Billing

Billing built into the same platform as the work — not bolted on as an afterthought.

- Create and manage invoices per tenant
- Razorpay-backed checkout and payment flows
- Payment status tracking against each invoice

## Teams & Permissions

Four roles. Clear boundaries. No permission logic scattered across your codebase.

| Role | What they can do |
|---|---|
| `owner` | Full tenant control — billing, members, clients, projects, audit logs |
| `admin` | Operational management — members, clients, projects, activity |
| `member` | Their assigned projects, tasks, and internal conversations |
| `client` | Their projects, client portal, invoices, dashboard |

## Activity & Audit Logs

Every significant action in the workspace is logged. Owners and admins get a full audit trail — who did what, when, and on which resource. Not an afterthought. Baked into the service layer.

## Role-Specific Dashboards

No one sees a dashboard full of noise that doesn't apply to them.

- Owners and admins get workspace-wide metrics
- Members see their active workload
- Clients see their project status and billing

---

# Getting Started

ManageInSync has a **React frontend**, a **Node.js/Express backend**, **MongoDB** for application data, and **Redis** for production rate limiting and background email queues.

## Prerequisites

- Node.js `>= 20`
- MongoDB (local or Atlas)
- Redis (required in production; optional fallback for simple local development)
- npm

## 1 — Clone and install

```bash
git clone https://github.com/your-org/manageinsync.git
cd manageinsync
npm install
```

This installs dependencies for the root, backend, and frontend in one step.

## 2 — Configure your environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Open `backend/.env` and set these at minimum:

```env
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/manageinsync
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace-with-at-least-32-characters
ACCESS_TOKEN_SECRET=replace-with-at-least-32-characters
```

`REDIS_URL` powers shared API rate limiting and BullMQ email queues. For local development you can leave it empty to use the in-memory fallback, but production should always use Redis.

Open `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

## 3 — Set up database indexes

Run this once after configuring your environment:

```bash
npm --prefix backend run db:create-indexes
```

Covers: activity, audit, contacts, conversations, invoices, messages, payments, projects, sessions, tasks, tenants, users.

## 4 — Start development servers

```bash
# Terminal 1 — backend
npm run dev:backend

# Terminal 2 — frontend
npm run dev:frontend

# Terminal 3 — email worker, required when REDIS_URL is set
npm --prefix backend run worker:email
```

| Surface | URL |
|---|---|
| App | `http://localhost:5173` |
| API | `http://localhost:3000/api` |
| Health check | `http://localhost:3000/api/health` |

## Optional services

Some services have local fallbacks, but production should run all required infrastructure.

| Service | Variables needed |
|---|---|
| Redis — rate limiting, email queues | `REDIS_URL` |
| Email — invites, password reset | `EMAIL_HOST` `EMAIL_PORT` `EMAIL_USER` `EMAIL_PASS` |
| Payments — Razorpay | `RAZORPAY_KEY_ID` `RAZORPAY_KEY_SECRET` |

---

# Deployment

## One command with Docker

```bash
docker compose up --build
```

The production image:
- Builds the React frontend
- Serves it as static files from the Express backend
- Exposes everything on port `3000`
- Runs a health check against `/api/health`
- Persists MongoDB data in a named Docker volume
- Starts Redis for shared rate limiting and BullMQ queue storage
- Starts a separate `email-worker` service for invite and password reset emails

App available at `http://localhost:3000`.

## Manual deployment

Build the frontend:

```bash
npm run build
```

Start the backend in production mode:

```bash
npm start
```

Start the email worker in a separate process:

```bash
npm --prefix backend run worker:email
```

The backend serves the compiled frontend from `frontend/dist` and handles all API routes under `/api`. In production, configure `REDIS_URL` for both the API process and the worker.

---

# Architecture

ManageInSync is a service-oriented monolith. One Express server. One React SPA. One MongoDB. Redis backs cross-process rate limiting and background email queues. Clean separation of concerns inside a small set of deployable processes.

### Request lifecycle

Every protected request passes through the full stack — no shortcuts:

```txt
React SPA
  └─▶  Express
         └─▶  Security headers · CORS · Redis-backed rate limiting
               └─▶  Auth — JWT access token verification
                     └─▶  Session validation — checked against MongoDB, not just token signature
                           └─▶  Tenant resolution — workspace scoped at middleware level
                                 └─▶  RBAC — role enforced before any controller runs
                                       └─▶  Zod validation — body, params, and query
                                             └─▶  Controller → Service → MongoDB
```

### Security model

| Concern | How it's handled |
|---|---|
| Access tokens | Short-lived JWTs with a dedicated signing secret |
| Refresh tokens | Opaque, stored in HttpOnly cookies, kept server-side as hashes only |
| Token rotation | Every refresh issues a new pair; reuse is treated as a compromised session |
| Session validation | Active session confirmed in MongoDB on every protected request |
| Tenant isolation | Enforced by middleware resolver — not scattered across query conditions |
| RBAC | Route-level, before controllers execute |
| Input validation | Zod schemas on every mutating endpoint |
| Rate limiting | Redis-backed counters in production, in-memory fallback for local/test runs |
| Email delivery | BullMQ queues backed by Redis, processed by a separate worker |
| Audit logging | Sensitive actions written to an immutable per-tenant audit log |

### API surface

All routes under `/api`.

| Route | Purpose |
|---|---|
| `/auth` | Signup · login · refresh · logout · password flows |
| `/me` | Authenticated user, session, and tenant context |
| `/projects` | Projects · assignments · tasks · conversations |
| `/clients` | Client management |
| `/members` | Member management |
| `/billing` | Invoices · Razorpay checkout · payments |
| `/dashboard` | Role-specific metrics |
| `/activity-feed` | Workspace activity stream |
| `/audit-logs` | Immutable audit trail — owner and admin only |
| `/tenants` | Tenant profile and settings |
| `/account` | User profile and session management |
| `/health` | Health and DB readiness |

---

# Tech Stack

## Frontend

**React 19** — component model, concurrent rendering, and the ecosystem that comes with it.

**Vite 7** — instant dev server, optimized production builds.

**React Router 7** — client-side routing with data loading patterns.

**Tailwind CSS 4** — utility-first styling. No CSS files to maintain.

**lucide-react** — consistent iconography across the UI.

## Backend

**Node.js 20+** — the runtime. Long-term stable, well-supported.

**Express 5** — routing, middleware composition, and async error handling.

**Mongoose 9** — schema modeling, validation, and query building on top of MongoDB.

**Zod** — runtime schema validation for every request boundary.

**Nodemailer** — email delivery for invites, password resets, and notifications.

**BullMQ** — Redis-backed background jobs for invite and password reset emails.

**Razorpay** — payment gateway for invoice checkout flows.

## Infrastructure

**MongoDB** — document store. Tenant-scoped collections, indexed for the query patterns that matter.

**Redis** — shared rate limit counters and BullMQ queue storage for background work.

**Docker + Docker Compose** — single-command production deployment. Frontend and backend in one container, MongoDB and Redis with persistent volumes, plus a separate email worker.

**JWT + HttpOnly cookies** — stateless access tokens, server-validated refresh tokens, rotation on every use.

---

# Testing

```bash
# Backend test suite
npm --prefix backend test

# Frontend utility tests
npm --prefix frontend test

# Lint
npm --prefix frontend run lint

# Production build check
npm run build
```

---

# Documentation

| Document | What it covers |
|---|---|
| `docs/ARCHITECTURE_V1.md` | Full system design and infrastructure direction |
| `docs/AUTH_ARCHITECTURE.md` | Token, session, and refresh model in depth |
| `docs/REDIS_RATE_LIMITING_AND_QUEUEING.md` | Redis rate limiting, BullMQ queues, worker setup |
| `docs/PROJECTS_TASKS_ARCHITECTURE.md` | Domain model — projects, tasks, members, clients |
| `docs/PROJECT_BRIEF.md` | Product vision, personas, and KPIs |
| `docs/BENCHMARKS.md` | Performance benchmark results |
| `docs/DETAILS.md` | Current engineering focus and known issues |
| `docs/CHANGELOGS.md` | Release history |

---

# Contributing

ManageInSync is open source and built to be extended. If something is broken, missing, or could be better — contributions are welcome.

- [Open an issue](../../issues) if you've found a bug or have a feature request
- [Submit a pull request](../../pulls) to contribute fixes or improvements
- If you're making a significant change, open an issue first to discuss the approach

---

<div align="center">
  <br />
  <p>Built for agencies that take their operations seriously.</p>
  <br />
  <p>
    <a href="./docs"><strong>Docs</strong></a> ·
    <a href="../../issues"><strong>Issues</strong></a> ·
    <a href="../../discussions"><strong>Discussions</strong></a>
  </p>
  <br />
</div>
