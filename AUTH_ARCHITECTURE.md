Architecture Type

Hybrid Token + Stateful Session Architecture (Tenant-Scoped)

Short-lived JWT access tokens  
Rotating opaque refresh tokens  
Server-side session tracking (MongoDB)  
HttpOnly cookie-based refresh mechanism  
Tenant-aware authentication boundary  

Domain View

[Tenant]  
   ├── Users  
   │      └── Roles (owner/admin/member/client)  
   ├── Sessions  
   │      ├── refreshTokenHash  
   │      └── lifecycle metadata  
   └── Auth Flows  
          ├── Signup / Login  
          ├── Refresh  
          ├── Logout / Logout-All  
          └── Invite Acceptance  

Core Entities

Tenant → security boundary  
User → authenticated actor  
Session → authentication state container  
AccessToken → short-lived identity proof  
RefreshToken → session continuation mechanism  

Relationship Model

Tenant (1) → (N) Users  
Tenant (1) → (N) Sessions  
User (1) → (N) Sessions  
Session (1) → (1) User  
Session (1) → (1) Tenant  
AccessToken (N) → (1) Session  
RefreshToken (1) → (1) Session  

Token Model

Access Token (JWT)

Contains:  
userId  
tenantId  
role  
sid (sessionId)  

Expiry: 15 minutes  
Storage: frontend memory  
Purpose: request authentication  

Refresh Token (Opaque)

Random secure string  
Expiry: 7 days  

Storage:  
HttpOnly cookie (client)  
SHA256 hash (server DB)  

Purpose:  
session continuation  
token rotation  

Session Model

Session  
{
  userId,
  tenantId,
  refreshTokenHash,
  expiresAt,
  lastUsedAt,
  revokedAt,
  revokeReason,
  replacedBySessionId,
  rotatedFromSessionId,
  compromisedAt,
  createdByIp,
  lastUsedIp,
  userAgent
}

Data Flow

Signup Flow

User → signup  
→ validate input  
→ create tenant  
→ create owner user  
→ create session  
→ generate refresh token  
→ store hash in DB  
→ issue access token  
→ set cookie  

Login Flow

User → login  
→ validate credentials  
→ validate user status  
→ create session  
→ issue tokens  
→ set cookie  

Refresh Flow (Rotation-Based)

Client → send refresh cookie  
→ hash token  
→ find session  

IF valid:  
→ create new session  
→ revoke old session (rotated)  
→ link sessions  
→ issue new tokens  

IF reused:  
→ mark compromised  
→ revoke all sessions  
→ deny request  

Protected Request Flow

Client → send Authorization: Bearer accessToken  
→ verify JWT  
→ load session from DB  
→ validate session state  
→ validate user + tenant + role  
→ allow request  

Logout Flow

User → logout  
→ find session via refresh token  
→ mark session revoked  
→ clear cookie  

Logout-All Flow

User → logout-all  
→ revoke all user sessions  
→ clear cookie  

Invite Acceptance Flow

User → submit invite token  
→ validate token  
→ set password  
→ update status  

NOTE:

does NOT create session  
requires manual login  

Visibility & Access Rules

CLIENT  
no direct auth privileges beyond allowed scopes  
limited access via project visibility  

MEMBER  
authenticated access  
session-bound permissions  

ADMIN / OWNER  
full tenant access  
session override authority  

Data Structures

User (Auth Fields)

{
  email,
  password,
  role,
  tenantId,
  status,
  inviteToken,
  inviteTokenExpires
}

Session (Auth Store)

{
  userId,
  tenantId,
  refreshTokenHash,
  expiresAt,
  revokedAt,
  replacedBySessionId,
  compromisedAt
}

Business Rules

All sessions must belong to same tenant as user  
Refresh token must never be stored in raw form  
Access token must always map to valid session  
Session rotation required on every refresh  
Reused refresh token = full session compromise  
Disabled user → all sessions revoked  
Invite acceptance ≠ authentication  

Query Patterns

Session Lookup  
{ refreshTokenHash }  

Active Sessions by User  
{ userId, revokedAt: null }  

Tenant Sessions  
{ tenantId }  

Index Strategy

Session:

{ expiresAt } → TTL index  
{ userId, revokedAt }  
{ tenantId }  
{ refreshTokenHash }  

Data Integrity Rules

No session without valid user  
No cross-tenant session mapping  
No raw refresh token storage  
No active session after revoke  
Rotation must maintain chain integrity  

Security Model

HttpOnly cookie prevents XSS token theft  
Refresh token hashing prevents DB leakage misuse  
Rotation prevents replay attacks  
Reuse detection triggers global revoke  
Session validation adds layer beyond JWT  
Tenant + role validation prevents privilege drift  

System Principles

AccessToken = Identity Proof (short-lived)  
RefreshToken = Session Continuation  
Session = Source of Truth  
User = Actor  
Tenant = Security Boundary  

Final Summary

This system is not stateless JWT auth.

It is:

Stateful session-backed authentication  
Token-rotation secured lifecycle  
Database-validated request authorization  
Tenant-isolated identity system  

👉 In short:

JWT for speed + Session for control + Rotation for security