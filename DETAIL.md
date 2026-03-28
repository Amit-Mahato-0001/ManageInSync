# Add Project Conversations (Self implementation)

This feature lets people inside the same project talk in one place.
It is useful for updates, blockers, and quick decisions without leaving the app.

---

## 1) What users should be able to do

1. Open a project and see a Conversation tab.
2. Send messages in that project chat.
3. Read old messages (latest first or scroll history).
4. See who sent each message and when.
5. Edit or delete their own message.
6. See unread count for each project.

Simple MVP rule:
- One conversation per project is enough for now.
- Build group chat first, no direct 1:1 chat now.

---

## 2) Access and safety rules (very important)

Only users who belong to that project can read or send messages.
That means:
- Owner/Admin can access.
- Project members can access.
- Project clients can access only if they are assigned to that project.

Also enforce:
- Same tenant only.
- No cross-project message access.
- Soft delete messages (do not hard delete).

---

## 3) Backend changes

### 3.1 Create new models

Create `conversation.model.js`
- `tenantId`
- `projectId`
- `createdBy`
- `lastMessageAt`
- `deletedAt`
- timestamps

Create `message.model.js`
- `tenantId`
- `projectId`
- `conversationId`
- `senderId`
- `text` (max length e.g. 2000)
- `editedAt` (optional)
- `deletedAt` (optional)
- `readBy` (array of userId + seenAt, optional for MVP)
- timestamps

### 3.2 Add indexes

Conversation indexes:
- `{ tenantId: 1, projectId: 1, deletedAt: 1 }`
- `{ projectId: 1, lastMessageAt: -1 }`

Message indexes:
- `{ tenantId: 1, conversationId: 1, createdAt: -1 }`
- `{ tenantId: 1, projectId: 1, createdAt: -1 }`

### 3.3 Add validators

Create validators for:
- create conversation (for MVP auto-create is also fine)
- send message (`text` required, trimmed, max length)
- update message
- pagination query (`cursor`, `limit`)

### 3.4 Add service layer

Create `conversation.service.js`:
- `getOrCreateProjectConversation(projectId, user)`
- `listProjectMessages(conversationId, tenantId, limit, cursor)`
- `sendMessage(conversationId, projectId, tenantId, senderId, text)`
- `editMessage(messageId, senderId, text)`
- `deleteMessage(messageId, actor)`
- `markAsRead(conversationId, userId)` (optional in MVP)

### 3.5 Add controller + routes

Recommended routes:
- `GET /api/projects/:projectId/conversation`
- `GET /api/projects/:projectId/conversation/messages?cursor=...&limit=...`
- `POST /api/projects/:projectId/conversation/messages`
- `PATCH /api/projects/:projectId/conversation/messages/:messageId`
- `DELETE /api/projects/:projectId/conversation/messages/:messageId`
- `POST /api/projects/:projectId/conversation/read` (optional)

Use existing middleware chain:
- auth -> tenant resolver -> role check -> validator -> controller

### 3.6 Permission check helper

Create one reusable helper:
- `canAccessProject(projectId, userId, role, tenantId)`

Use this helper in conversation APIs so rules stay consistent everywhere.

### 3.7 Audit logs

Log these events:
- message sent
- message edited
- message deleted

This is great for interview discussion and admin visibility.

---

## 4) Frontend changes

### 4.1 API file

Create `frontend/src/api/conversations.js` with:
- `getConversation(projectId)`
- `getMessages(projectId, cursor, limit)`
- `sendMessage(projectId, text)`
- `editMessage(projectId, messageId, text)`
- `deleteMessage(projectId, messageId)`
- `markConversationRead(projectId)` (optional)

### 4.2 UI components

Create:
- `ProjectConversation.jsx` page
- `MessageList.jsx`
- `MessageComposer.jsx`
- `MessageItem.jsx`

Show in each message:
- sender name
- time
- edited label (if edited)
- actions (edit/delete only for own message)

### 4.3 Routing

Add route:
- `/projects/:projectId/conversation`

Add a tab/button in project area:
- Tasks
- Conversation

### 4.4 Live updates

Fast MVP choice:
- Poll every 5-8 seconds while tab is open.

Better after MVP:
- Socket.IO for real-time push.

For placement in limited time, polling is acceptable if stable.

### 4.5 UX details

Please include:
- loading state
- empty chat state ("Start the conversation")
- error toast/message
- disabled send button when message is empty
- auto-scroll to latest message

---

## 5) Security and quality checklist

- Trim and sanitize message text.
- Reject empty text after trim.
- Enforce max length.
- Rate limit message send endpoint.
- Never trust projectId/conversationId from client alone.
- Always verify tenant + project membership on backend.

---

## 6) Test checklist (must do)

Backend tests/manual checks:
- member can send message in own project
- non-member gets 403
- cross-tenant access blocked
- deleted message not shown in normal list
- pagination works

Frontend checks:
- send message and instant refresh
- edit own message works
- delete own message works
- unread badge clears when conversation is opened
- no crash on empty/error states

---

## 7) Suggested implementation order (practical)

1. DB models + indexes
2. Access helper (`canAccessProject`)
3. Send/list message APIs
4. Frontend chat screen with polling
5. Edit/delete message
6. Unread count
7. Audit logs + final cleanup

This order gives visible progress fast and keeps risk low.

---

## 8) Good interview explanation (simple words)

"I added project-level conversations so team members can discuss work where it happens.
I kept access strict using tenant + project membership checks.
I built message APIs with pagination, soft delete, and audit logs.
On the frontend I added a conversation tab inside each project with clear states for loading, error, and empty chat.
I first shipped a stable polling version, then planned Socket.IO as next improvement."

---

## 9) Nice upgrades later (not now)

- file attachments
- @mentions
- typing indicator
- reactions
- thread replies
- search inside conversation

Do these only after MVP is stable.
