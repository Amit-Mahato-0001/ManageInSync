# Project Platform — Project Brief

## Working Name
**ManageInSync**

## Vision
Multi-tenant SaaS platform enabling organizations to **manage projects, teams, and internal operations in a structured and secure environment**.

Goal: provide a **centralized operational workspace** where projects, members, and activities are organized, traceable, and access-controlled.

## Target Market
Horizontal SaaS for organizations working in **project-based environments**:

- startups
- SMEs
- agencies
- product teams
- internal corporate teams

### Launch Wedge
Startups and small product teams (5–30 people) that need a **simple platform to organize projects, members, and operational activity**.

## Value Proposition
*"Centralize projects, tasks, clients, and team members in a secure multi-tenant platform."*

## Perceived Value

- 📊 Clear visibility on projects and activity
- 👥 Structured users and role management
- 🔐 Secure isolation between organizations
- 🧾 Traceability of system actions
- ⚡ Fast team onboarding and organization

## Primary Personas

| Persona | Description | Main Need |
|-------|-------------|-----------|
| Owner | Responsible for the organization | Global visibility and control |
| Admin | Manages users, permissions, and operational settings | Easy administration |
| Member | Works on projects and internal tasks | Simple access to project resources |
| Client | External stakeholder interacting with specific projects | Limited access to project information |

---

# MVP (V1) — Frozen Scope

### Included

- Simple multi-tenancy (`tenant_id`)
- JWT authentication (access + refresh tokens)
- RBAC (owner/admin/member/client)
- User management
- Email invitations for new users
- Project CRUD operations
- Project ↔ member associations
- Basic dashboard (stats + recent activity)
- Audit logs (sensitive actions)
- Request validation middleware
- API rate limiting
- Background jobs (emails, async tasks)

# Technical Stack

- **Frontend**: React SPA + JavaScript
- **Backend**: Node.js (Express)
- **Validation**: Zod schemas
- **Auth**: JWT (access + refresh)
- **Database**: MongoDB
- **Cache / Queue**: Redis
- **Async Workers**: background worker processes
- **Storage**: S3-compatible object storage
- **Email**: Nodemailer
- **Monitoring**: Sentry + structured logs
- **CI/CD**: GitHub Actions
- **Deployment**: cloud container hosting (Render / Fly / AWS)

---

# MVP KPIs (in future)

- % of organizations creating ≥ 1 project
- % of organizations inviting ≥ 2 members
- average number of projects per tenant
- onboarding time < 5 minutes
- tenant activation rate
- backend critical error rate