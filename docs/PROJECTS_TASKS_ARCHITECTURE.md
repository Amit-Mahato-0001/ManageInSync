# ManageInSync — Work Domain Architecture (Projects / Tasks / Members / Clients)

## Architecture Type
Relational Domain Modeling (Tenant-Scoped)

- Project-centric access control  
- Task-bound execution model  
- Role-driven visibility  
- Strict tenant isolation  

---

## Domain View

[Tenant]
   ├── Users (Members + Clients)
   ├── Projects
   │      ├── members[] (internal users)
   │      ├── clients[] (external users)
   │      └── Tasks
   │             ├── assignee (user)
   │             └── creator (user)
   └── Tasks (always scoped via project)

---

## Core Entities

- Tenant → organization boundary  
- User → role (owner/admin/member/client)  
- Project → access + container  
- Task → execution unit  

---

## Relationship Model

- Tenant (1) → (N) Users  
- Tenant (1) → (N) Projects  
- Tenant (1) → (N) Tasks  

- Project (M) ↔ (N) Members  
- Project (M) ↔ (N) Clients  

- Project (1) → (N) Tasks  

- Task (N) → (1) Assignee (User)  
- Task (N) → (1) Creator (User)  

---

## Data Flow

### Project Access

User → check membership  
→ if in members → internal access  
→ if in clients → external access  

---

### Task Creation Flow

User → create task  
→ validate tenantId  
→ validate projectId  
→ validate access (member/admin/owner)  
→ validate assignee (not client)  
→ create task  

---

### Visibility Rules

CLIENT:
- projects → where user ∈ project.clients  
- tasks → project allowed AND clientVisible = true  

MEMBER:
- projects → where user ∈ project.members  
- tasks → assigned OR project-based  

ADMIN / OWNER:
- full access  

---

## Data Structures

### Project

{
  _id,
  tenantId,
  name,
  description,
  status, // active | completed | on-hold
  members: [userId],
  clients: [userId],
  deletedAt,
  createdAt,
  updatedAt
}

---

### Task

{
  _id,
  tenantId,
  projectId, // REQUIRED
  title,
  description,
  assigneeId, // non-client only
  createdBy,
  status: "todo" | "in-progress" | "done",
  priority,   // low | medium | high
  dueDate,
  clientVisible,
  deletedAt,
  createdAt,
  updatedAt
}

---

## Business Rules

- All entities must share same tenantId  
- Task must always have projectId  
- Assignee must NOT be client  
- (optional strict) assignee ∈ project.members  
- members and clients must not overlap  

---

## Query Patterns

Projects:
{ tenantId, deletedAt: null }

User Projects:
{
  tenantId,
  deletedAt: null,
  $or: [
    { members: userId },
    { clients: userId }
  ]
}

Tasks by Project:
{ tenantId, projectId, deletedAt: null }

Client Tasks:
{
  tenantId,
  projectId: { $in: allowedProjects },
  clientVisible: true,
  deletedAt: null
}

---

## Index Strategy

Project:
{ tenantId: 1, deletedAt: 1, status: 1 }
{ tenantId: 1, members: 1 }
{ tenantId: 1, clients: 1 }

Task:
{ tenantId: 1, projectId: 1, deletedAt: 1 }
{ tenantId: 1, assigneeId: 1, status: 1, deletedAt: 1 }

---

## Data Integrity Rules

- No task without project  
- No cross-tenant linking  
- No client assignment  
- No orphaned references  
- Soft delete must cascade logically  

---

## System Principles

Project = Access Boundary  
Task = Execution Unit  
User = Actor  
Tenant = Security Boundary  
