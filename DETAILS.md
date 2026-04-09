# Activity Feed Plan For AgencyOS

## Decision

AgencyOS me current `Audit Logs` page ko product-facing `Activity Feed` se replace karna better hoga.

Reason simple hai:

- Audit logs machine-oriented hote hain.
- Activity feed human-oriented hoti hai.
- Audit log ka purpose hota hai compliance, security trace, aur raw record keeping.
- Activity feed ka purpose hota hai user ko batana: "workspace me recently kya hua?"

Current repo me audit log implementation abhi itna useful nahi hai, kyunki UI me mostly raw action code aur timestamp hi dikh raha hai.

Examples:

- `PROJECT_CREATED`
- `TASK_UPDATED`
- `CLIENT_ASSIGN_TO_PROJECT`

Ye readable product experience nahi banata.

## Current Audit Log System Ki Problem

Current implementation:

- `backend/src/models/audit.model.js`
- `backend/src/services/audit.service.js`
- `backend/src/middleware/audit.middleware.js`
- `backend/src/controllers/audit.controller.js`
- `backend/src/routes/audit.route.js`
- `frontend/src/pages/AuditLogs.jsx`

Current limitations:

- Record me sirf `tenantId`, `actorId`, `action`, `meta` hai.
- `meta` me abhi sirf request `method` aur `path` save ho raha hai.
- Feed item me project name, task title, old status, new status, invited email jaisi useful cheezein nahi aa rahi.
- Frontend raw action string show karta hai, readable sentence nahi.
- Logging route-level middleware se ho rahi hai, isliye business context missing hai.
- Message-level events global log ko noisy bana sakte hain.

Bottom line:

- Current audit log ko rename karke activity feed banana enough nahi hoga.
- Data model aur event generation dono improve karne padenge.

## Activity Feed Ka Goal

Activity feed ko ye questions answer karne chahiye:

- Kisne kya kiya?
- Kis project ya task par kiya?
- Kab kiya?
- Kya change hua?
- Kya ye mere liye relevant hai?

Activity feed ko product feature ki tarah treat karo, backend trace ki tarah nahi.

## Activity Feed Me Kya Rehna Chahiye

### Must-Have V1 Events

Ye events global activity feed me honi chahiye:

| Category | Event Type | Include | Example UI Line |
| --- | --- | --- | --- |
| Project | `project.created` | Yes | `Amit created project "Website Revamp"` |
| Project | `project.deleted` | Yes | `Amit deleted project "Website Revamp"` |
| Project | `project.status_changed` | Yes | `Amit changed "Website Revamp" from Active to Completed` |
| Project | `project.members_assigned` | Yes | `Amit assigned 2 members to "Website Revamp"` |
| Project | `project.clients_assigned` | Yes | `Amit assigned 1 client to "Website Revamp"` |
| Task | `task.created` | Yes | `Amit created task "Homepage QA" in "Website Revamp"` |
| Task | `task.deleted` | Yes | `Amit deleted task "Homepage QA" from "Website Revamp"` |
| Task | `task.status_changed` | Yes | `Riya moved task "Homepage QA" from Todo to In Progress` |
| Task | `task.priority_changed` | Yes | `Riya changed task "Homepage QA" priority from Medium to High` |
| Team | `member.invited` | Yes | `Amit invited member riya@agency.com` |
| Team | `admin.invited` | Yes | `Owner invited admin admin@agency.com` |
| Team | `invite.accepted` | Yes | `Riya joined the workspace as Member` |
| Team | `member.removed` | Yes | `Amit removed member riya@agency.com` |
| Client | `client.invited` | Yes | `Amit invited client client@brand.com` |
| Client | `client.removed` | Yes | `Amit removed client client@brand.com` |

### Good Later, But Not Required In V1

Ye events useful ho sakte hain, but pehle release me optional rakho:

| Category | Event Type | Include Later | Why Later |
| --- | --- | --- | --- |
| Task | `task.target_date_changed` | Later | Useful hai, but current task update flow already busy hai |
| Task | `task.assignee_changed` | Later | Tab useful jab assignee changes UI me clear ho |
| Project | `project.target_date_changed` | Later | Abhi project edit flow full nahi hai |
| Conversation | `message.sent` | Later | Workspace feed ko noisy bana sakta hai |
| Conversation | `message.edited` | Later | End-user value kam hai |
| Conversation | `message.deleted` | Later | Mostly moderation/compliance type signal hai |
| Workspace | `workspace.created` | Later | Nice first event, but everyday feed ke liye required nahi |

### Activity Feed Me Kya Nahi Rehna Chahiye

Ye cheezein user-facing activity feed me nahi honi chahiye:

- raw request path like `/api/projects/123/tasks`
- HTTP method like `POST`, `PATCH`, `DELETE`
- validation failures
- login failures
- token generation
- page visits
- dashboard refresh
- `mark as read`
- focus events
- background polling events
- full invite tokens
- password-related changes
- every single message edit/delete in global feed

If future me real audit/compliance log chahiye, use alag internal system rakho. Activity feed aur audit trail same cheez nahi hain.

## Feed Item Me Kya Data Rehna Chahiye

Har activity item me minimum ye fields hone chahiye:

- `tenantId`
- `type`
- `summary`
- `actor`
- `createdAt`
- `visibility`
- `project` snapshot when relevant
- `task` snapshot when relevant
- `targetUser` snapshot when relevant
- `meta` for structured old/new values

Recommended shape:

```json
{
  "tenantId": "6650...",
  "type": "task.status_changed",
  "summary": "Riya moved task \"Homepage QA\" from Todo to In Progress",
  "actor": {
    "id": "6651...",
    "email": "riya@agency.com",
    "role": "member"
  },
  "project": {
    "id": "6652...",
    "name": "Website Revamp"
  },
  "task": {
    "id": "6653...",
    "title": "Homepage QA"
  },
  "targetUser": null,
  "visibility": ["owner", "admin", "member"],
  "meta": {
    "from": "todo",
    "to": "in-progress"
  },
  "createdAt": "2026-04-08T10:30:00.000Z"
}
```

## Important Recommendation: Snapshot Store Karo

Activity feed me sirf IDs store mat karo.

Snapshot bhi store karo:

- actor email
- actor role
- project name
- task title
- target user email

Why:

- Agar project delete ho jaye tab bhi feed readable rehni chahiye.
- Agar user ka role ya email later change ho jaye tab old activity context lose nahi hona chahiye.
- UI ko har row ke liye multiple joins nahi karne padenge.

## Visibility Rules

Activity feed me har event sabko dikhana sahi nahi hoga.

Recommended visibility rules:

- `owner`:
  - sab events dekh sakta hai
- `admin`:
  - sab operational events dekh sakta hai
- `member`:
  - sirf un projects/tasks ka feed jo uske relevant scope me hain
  - workspace team management events nahi
- `client`:
  - global workspace feed mat do in V1
  - future me project-level safe activity feed diya ja sakta hai

Practical V1 recommendation:

- sidebar `Activity Feed` page sirf `owner`, `admin`, `member` ke liye rakho
- member ke liye server-side filtering zaroor karo
- client ko abhi global feed mat do

## Current Audit Middleware Kyu Enough Nahi Hai

Current `backend/src/middleware/audit.middleware.js` route ke baad bas ye save karta hai:

- `action`
- `req.method`
- `req.originalUrl`

Is approach ki problem:

- create ke baad actual created project ka name available nahi hota unless explicitly pass karo
- update ke liye `from` aur `to` values missing rehti hain
- assignment actions me kaunse members ya clients assign hue ye missing rehta hai
- human-readable summary banana mushkil ho jata hai

## Recommended Backend Architecture

### Best Option

Activity record controller ya service me business action ke turant baad create karo.

Example:

- project create ho gaya
- created project object mil gaya
- tab `createActivity()` call karo

Ye approach current codebase ke liye best fit hai because:

- repo simple hai
- controllers/services direct hain
- rich context wahi available hota hai

### Avoid

Current style ka blind route middleware activity feed ke liye avoid karo.

### If You Still Want Middleware

Alternative pattern:

- controller `res.locals.activity = {...}` set kare
- middleware response finish par `res.locals.activity` persist kare

Ye bhi kaam karega, but current codebase me direct service call simpler rahega.

## Recommended New Backend Structure

Recommended new files:

- `backend/src/models/activity.model.js`
- `backend/src/services/activity.service.js`
- `backend/src/controllers/activity.controller.js`
- `backend/src/routes/activity.route.js`

Recommended model outline:

```js
const mongoose = require("mongoose")

const activitySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      index: true
    },
    summary: {
      type: String,
      required: true,
      trim: true
    },
    actor: {
      id: mongoose.Schema.Types.ObjectId,
      email: String,
      role: String
    },
    project: {
      id: mongoose.Schema.Types.ObjectId,
      name: String
    },
    task: {
      id: mongoose.Schema.Types.ObjectId,
      title: String
    },
    targetUser: {
      id: mongoose.Schema.Types.ObjectId,
      email: String,
      role: String
    },
    visibility: [{
      type: String,
      enum: ["owner", "admin", "member", "client"]
    }],
    meta: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true }
)

activitySchema.index({ tenantId: 1, createdAt: -1 })
activitySchema.index({ tenantId: 1, type: 1, createdAt: -1 })
activitySchema.index({ tenantId: 1, "project.id": 1, createdAt: -1 })
```

Recommendation:

- `AuditLog` model ko directly mutate karne ke bajay new `Activity` model banao
- old audit code ko deprecate kar do
- agar future me real compliance logs chahiye hon, dono alag rakho

## Suggested Backend Service API

`backend/src/services/activity.service.js`

Recommended functions:

- `createActivity(payload)`
- `listActivityFeed({ tenantId, user, page, limit, type, projectId })`
- `buildActorSnapshot(user)`
- `buildProjectSnapshot(project)`
- `buildTaskSnapshot(task)`
- `buildTargetUserSnapshot(user)`

Helpful utility idea:

```js
const createActivity = async (payload) => {
  return Activity.create(payload)
}
```

## Event Generation Map For Current Repo

Current repo ke hisaab se yaha activity create karni chahiye:

### Projects

- `backend/src/controllers/project.controller.js`
  - after project create -> `project.created`
  - after project delete -> `project.deleted`
  - after status update -> `project.status_changed`
  - after member assign -> `project.members_assigned`
  - after client assign -> `project.clients_assigned`

### Tasks

- `backend/src/controllers/task.controller.js`
  - after task create -> `task.created`
  - after task delete -> `task.deleted`
  - after task update status -> `task.status_changed`
  - after task update priority -> `task.priority_changed`
  - later if target date edit supported -> `task.target_date_changed`

### Team / Invites

- `backend/src/controllers/invite.controller.js`
  - after member invite -> `member.invited`
  - after admin invite -> `admin.invited`
  - after client invite -> `client.invited`

- `backend/src/services/auth.service.js`
  - after invite accept -> `invite.accepted`

- `backend/src/controllers/member.controller.js`
  - after member delete -> `member.removed`

- `backend/src/controllers/client.controller.js`
  - after client delete -> `client.removed`

### Conversation

Optional in later phase:

- `backend/src/controllers/conversation.controller.js`
  - after message send -> `message.sent`

Recommendation:

- `message.edited` aur `message.deleted` ko global feed me mat lao in V1
- agar future me add karo to project-level feed me add karo, workspace feed me nahi

## Recommended API Design

### Workspace Feed

`GET /api/activity-feed?page=1&limit=20&type=project,task,team`

Response shape:

```json
{
  "activities": [
    {
      "_id": "6654...",
      "type": "project.created",
      "summary": "Amit created project \"Website Revamp\"",
      "actor": {
        "email": "amit@agency.com",
        "role": "owner"
      },
      "project": {
        "id": "6652...",
        "name": "Website Revamp"
      },
      "createdAt": "2026-04-08T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

### Future Project-Scoped Feed

`GET /api/projects/:projectId/activity?page=1&limit=20`

Ye later phase me useful hoga.

## Recommended Frontend Structure

Replace current audit log page with:

- `frontend/src/pages/ActivityFeed.jsx`
- `frontend/src/api/activity.js`

Also update:

- `frontend/src/layouts/AppLayout.jsx`
- `frontend/src/App.jsx`

### UI Ka Structure Kaisa Hona Chahiye

Simple aur useful rakho. Over-flashy bilkul nahi.

Recommended layout:

- page title: `Activity Feed`
- subtitle: `Recent updates across your workspace`
- optional filter chips:
  - `All`
  - `Projects`
  - `Tasks`
  - `Team`
  - `Clients`
- each row me:
  - small icon
  - summary text
  - secondary line with project/user context if needed
  - relative time or formatted time

### Feed Row Example

- `Amit created project "Website Revamp"`
- subline: `Project | Today at 2:10 PM`

- `Riya moved task "Homepage QA" from Todo to In Progress`
- subline: `Website Revamp | 10 minutes ago`

### UI Rules

- same design language as current app cards
- subtle border
- simple spacing
- no badge-heavy calendar style
- no glowing cards
- no giant gradients for each event type
- readable text first, decoration later

## Current Route / Sidebar Replacement

Current frontend me:

- `frontend/src/pages/AuditLogs.jsx`
- `/audit-logs`
- sidebar item `Audit Logs`

Recommended replacement:

- `frontend/src/pages/ActivityFeed.jsx`
- `/activity-feed`
- sidebar item `Activity Feed`

Suggested sidebar visibility:

- `owner`
- `admin`
- `member`

## Activity Feed Ka Summary Kaise Generate Karna Chahiye

Readable sentence generate karo. Raw enum directly mat dikhao.

Examples:

- `PROJECT_CREATED` ko UI me direct mat dikhao
- instead: `Amit created project "Website Revamp"`

- `TASK_UPDATED` generic mat dikhao
- instead:
  - `Riya changed task "Homepage QA" priority from Medium to High`
  - `Riya moved task "Homepage QA" from Todo to Done`

Best practice:

- `type` machine-readable rakho
- `summary` user-readable store karo

## Naming Convention

Uppercase audit constants se better dot notation use karo:

- `project.created`
- `project.deleted`
- `project.status_changed`
- `task.created`
- `task.status_changed`
- `member.invited`
- `invite.accepted`

Why:

- readable hai
- filter-friendly hai
- future analytics ke liye clean hai

## Member Filtering Important Hai

Agar member ko activity feed access dete ho, backend filtering zaroor karo.

Member ko ideally ye hi dikhna chahiye:

- us projects ke project events jahan wo assigned hai
- us projects ke task events jahan wo relevant hai

Member ko ye nahi dikhna chahiye:

- other teams ke clients invite hue
- admin invite hue
- unrelated members remove hue
- unrelated project deletion

## Client Visibility Ke Liye Recommendation

Client ko current global activity page mat do.

Reason:

- workspace-level feed me internal operations aa jayengi
- privacy aur noise dono issues banenge

Better future option:

- project conversation ya project overview ke andar lightweight project-only activity section

## Migration Strategy

Recommended rollout:

### Phase 1

- new `Activity` model banao
- new activity service/controller/route banao
- new page `ActivityFeed.jsx` banao
- sidebar aur route replace karo
- project/task/team/client core events write karo

### Phase 2

- dashboard me top 5 recent activities widget add karo
- member filtering add karo
- pagination add karo

### Phase 3

- project-specific activity endpoint add karo
- optional conversation activity add karo

### Phase 4

- old audit log route/page remove kar do
- optional backfill script likho if needed

## Backfill Karna Chahiye Ya Nahi

Short answer:

- optional

Reason:

- current audit records me enough context nahi hai
- old records se sirf generic items banenge
- future clean activities zyada valuable hongi

If backfill karna ho:

- sirf recent 30 to 60 days ka karo
- fallback summary use karo
- but low priority rakho

## Final Recommendation

AgencyOS ke liye best approach ye hai:

- audit logs ko direct UI feature mat rakho
- unko activity feed me evolve karo
- raw request-based logging ko replace karo with business-event logging
- human-readable summaries store karo
- snapshots store karo
- feed ko simple aur relevant rakho
- V1 me project, task, team, client events cover karo
- conversation events ko later phase me lao

One-line direction:

Build `Activity Feed` as a product feature, not as a renamed `Audit Logs` page.
