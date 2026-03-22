# Entity Relationship Structure (Projects, Tasks, Members, Clients)

This is the recommended structure for ManageInSync so access control and data flow stay clean.

## 1) Core Entities

- `Tenant`: one organization/workspace.
- `User`: one account in a tenant with role `owner | admin | member | client`.
- `Project`: work container inside a tenant.
- `Task`: actionable item that must belong to a project.

## 2) Relationship Map

- `Tenant (1) -> (N) Users`
- `Tenant (1) -> (N) Projects`
- `Tenant (1) -> (N) Tasks`
- `Project (M) <-> (N) Members` (via `project.members[]`)
- `Project (M) <-> (N) Clients` (via `project.clients[]`)
- `Project (1) -> (N) Tasks` (via `task.projectId`)
- `Task (N) -> (1) Assignee User` (via `task.assigneeId`)
- `Task (N) -> (1) Creator User` (via `task.createdBy`)

## 3) Suggested Data Shape

### Project

```js
{
  _id,
  tenantId,
  name,
  description,
  status, // active | completed | on-hold
  members: [userId], // role member/admin/owner
  clients: [userId], // role client
  deletedAt,
  createdAt,
  updatedAt
}
```

### Task

```js
{
  _id,
  tenantId,
  projectId, // required
  title,
  description,
  assigneeId, // required, non-client
  createdBy,  // owner/admin/member
  status,     // todo | in-progress | done
  priority,   // low | medium | high
  dueDate,
  clientVisible, // boolean (optional, default false)
  deletedAt,
  createdAt,
  updatedAt
}
```

## 4) Business Rules (Important)

- Every linked ID must belong to the same `tenantId`.
- Task creation must require `projectId`.
- `assigneeId` must be an active internal user (`owner/admin/member`), never `client`.
- If strict project control is needed: assignee must be in `project.members`.
- Client can only see projects where their user ID is in `project.clients`.
- Client can only see tasks from those projects (or only `clientVisible = true` tasks if you keep internal-only tasks).
- Soft delete project -> soft delete or hide all its tasks.

## 5) Role-Aware Access

- `owner/admin`: full CRUD on projects/tasks, assign members/clients.
- `member`: view assigned projects, update allowed project/task status, view own tasks.
- `client`: read-only project/task visibility only for assigned projects.

## 6) Minimum Backend Update Needed (Current Code Gap)

Your current code already supports:
- `Project.members[]`
- `Project.clients[]`
- `Task.assigneeId`

But tasks are not yet connected to projects. Add:
- `task.projectId` in model + validator
- pass `projectId` in create task API
- enforce tenant and role checks against the referenced project

## 7) Recommended Indexes

- `Project`: `{ tenantId: 1, deletedAt: 1, status: 1 }`
- `Project`: `{ tenantId: 1, members: 1 }` (multikey)
- `Project`: `{ tenantId: 1, clients: 1 }` (multikey)
- `Task`: `{ tenantId: 1, projectId: 1, deletedAt: 1 }`
- `Task`: `{ tenantId: 1, assigneeId: 1, status: 1, deletedAt: 1 }`
