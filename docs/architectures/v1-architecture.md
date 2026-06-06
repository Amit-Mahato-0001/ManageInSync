# ManageInSync — Architecture V1

## Architecture Type
**Service-Oriented Modular Backend**

- Logical service separation  
- Single deployable runtime (V1)  
- Extractable to microservices if needed

---

# System View

```
[Client SPA - React]
        |
        | HTTPS (JWT)
        v
[Edge Layer]

  +--> Rate Limiter
  +--> Load Balancer (NGINX)
  +--> Static Assets (S3 + CloudFront)

        |
        v
[API Gateway + Middleware]

  +--> Auth Middleware (JWT + decrypt)
  +--> RBAC Middleware
  +--> Tenant Context Resolver
  +--> Request Validation (Zod)

        |
        v
[Application Services]

  |     |     |     |     |
  |     |     |     |     +--> Dashboard Service
  |     |     |     |
  |     |     |     +--> Audit Logs Service
  |     |     |
  |     |     +--> User / Member Service
  |     |
  |     +--> Project Service
  |
  +--> Auth Service

        |
        v
[Data Layer]

  +--> MongoDB (primary data store)
  +--> Redis (cache + rate limit)

        |
        v
[Async Processing]

  +--> Redis Queue
  +--> Worker Nodes
  +--> Email Service (Nodemailer)
```

---

# Application Services

| Service | Responsibilities |
|------|------|
| `auth` | login, signup, invites, token lifecycle |
| `projects` | project CRUD, project metadata |
| `members/client` | user profiles, organization membership, roles |
| `audit_logs` | system activity logs, security events |
| `dashboard` | aggregated system statistics |

---

# Middleware Stack

Execution order:

```
auth → rbac → tenant_context → validation → service_handler
```

| Middleware | Responsibility |
|------|------|
| `auth` | verify JWT, decrypt payload |
| `rbac` | permission validation |
| `tenant_context` | resolve tenant from request |
| `validation` | request schema validation |

---

# Multi-Tenant Strategy

**V1**

Shared database with tenant isolation.

```
tenant_id column on all business entities
```

Enforcement points:

- middleware tenant context
- service level validation
- database query filters

Future option:

- schema-per-tenant
- database-per-tenant

---

# Data Layer

| System | Purpose |
|------|------|
| `MongoDB` | primary persistence |
| `Redis` | cache, rate limiting |
| `Redis Queue` | background job dispatch |

---

# Background Processing

| Worker | Responsibilities |
|------|------|
| `email_worker` | invitation emails, notifications |
| `cleanup_worker` | expired sessions, cleanup tasks |

Job dispatch flow:

```
service → redis queue → worker → external provider
```

---

# Request Flow

### API Request

```
Client
 → Edge Layer
 → API Gateway
 → Middleware Chain
 → Service
 → Database / Cache
 → Response
```

---

### Invitation Email Flow

```
Auth Service
 → enqueue job
 → Redis Queue
 → Worker
 → Nodemailer
 → Email Provider
```

---

# Security Baseline

- JWT authentication
- RBAC authorization
- tenant scoped access
- rate limiting
- request validation (Zod)
- audit logging
- HTTPS only
- secrets via environment config

---

# API Conventions

| Rule | Value |
|------|------|
| Prefix | `/api/v1` |
| Format | JSON |
| IDs | UUID |
| Time | UTC |
| Errors | `{code,message,details}` |