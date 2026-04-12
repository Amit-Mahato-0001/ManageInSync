# Refresh Token / Session Lifecycle Security Plan

## Goal

Current auth flow me sirf ek long-lived access JWT use ho raha hai. Better security ke liye mujhe auth ko is direction me complete karna hai:

- access token short-lived hoga
- refresh token alag hoga
- refresh token browser cookie me rahega, `localStorage` me nahi
- har login ka server-side session record hoga
- logout, logout-all, revoke, rotation, reuse-detection supported hoga
- disabled user / role change / password reset ke baad session turant invalidate ki ja sakegi

Ye file implementation nahi hai. Ye exact roadmap hai ki codebase me kya kya change karna hai.

## Current State In Repo

Abhi jo flow code me dikh raha hai:

- `backend/src/services/auth.service.js`
  `signup` aur `login` dono sirf ek JWT return kar rahe hain.
- Access token `1d` expiry ke sath sign ho raha hai.
- `frontend/src/context/AuthContext.jsx`
  token `localStorage` me persist ho raha hai.
- `frontend/src/api/axios.js`
  har request me `Authorization: Bearer <token>` localStorage se attach ho raha hai.
- `backend/src/middleware/auth.middleware.js`
  JWT verify karke user load kar raha hai, lekin active server-side session check nahi kar raha.
- `backend/src/routes/auth.route.js`
  sirf `signup` aur `login` endpoints hain.
- `backend/src/app.js`
  CORS me `credentials: true` enable nahi hai.

## Current Security Gaps

- `localStorage` me token rakhna XSS ke case me risky hai.
- Single `1d` bearer token chori ho gaya to expiry tak reuse ho sakta hai.
- Refresh endpoint hi nahi hai, isliye safe session renewal possible nahi hai.
- Session store nahi hai, isliye device-level revoke possible nahi hai.
- Logout abhi sirf frontend token delete karta hai, backend session invalidate nahi hoti.
- Reuse detection nahi hai, to stolen refresh token ka signal miss ho jayega.
- Middleware disabled users aur revoked sessions ko consistently reject nahi karta.
- Frontend `decodeToken()` se role read karta hai, but real session validity server se bootstrap nahi hoti.
- Cookie-based auth use nahi ho raha, isliye secure refresh flow incomplete hai.

## Target Security Design

### 1. Token Strategy

- Access token:
  short-lived JWT, `10m` to `15m`.
- Refresh token:
  long-lived opaque random token, `7d` to `30d`.
- Access token frontend memory me rahega, `localStorage` me nahi.
- Refresh token `HttpOnly` cookie me rahega.
- Refresh token raw form me database me store nahi karna.
- Database me sirf refresh token ka hash store karna.

Reason:

- Access token short-lived hone se bearer token leak impact kam hota hai.
- Refresh token browser JS se hidden rahega.
- Hashed refresh token store karne se DB leak me token direct usable nahi rahega.

### 2. Session Model

Ek dedicated session collection add karni hogi, for example:

- `backend/src/models/session.model.js`

Session document me minimum ye fields honi chahiye:

- `userId`
- `tenantId`
- `refreshTokenHash`
- `expiresAt`
- `lastUsedAt`
- `revokedAt`
- `revokeReason`
- `createdByIp`
- `lastUsedIp`
- `userAgent`
- `rotatedFromSessionId` ya equivalent trace field

Optional useful fields:

- `deviceLabel`
- `passwordVersionAtIssue`
- `roleSnapshot`

Indexes:

- `expiresAt` TTL cleanup ke liye
- `userId + revokedAt`
- `tenantId`

## Lifecycle Jo Implement Karna Hai

### Login

`POST /api/auth/login`

- credentials validate honge
- user active status check hoga
- new session document create hoga
- random refresh token generate hoga
- uska hash session me store hoga
- refresh token `HttpOnly` cookie me set hoga
- short-lived access token response body me return hoga
- audit/activity log create hoga

Access token payload me minimum:

- `sub` or `userId`
- `tenantId`
- `role`
- `sid` session id
- `iat`
- `exp`

### Signup

`POST /api/auth/signup`

- signup ke baad same login lifecycle follow hoga
- direct long-lived bearer token return nahi karna
- new session create karke refresh cookie + access token issue karna

### Refresh

`POST /api/auth/refresh`

- request cookie se refresh token read hoga
- raw token ka hash niklega
- active session lookup hoga
- session revoked / expired / missing hua to reject
- user active status dobara check hoga
- refresh token rotate hoga
- old refresh token immediately invalid hoga
- new refresh cookie set hogi
- new access token return hoga
- `lastUsedAt`, IP, userAgent update honge

Important:

- har refresh par rotation mandatory hogi
- same refresh token dobara use hone par reuse-detection trigger hoga

### Refresh Token Reuse Detection

Agar rotated refresh token dobara aata hai:

- us session ko compromised treat karna hai
- current session revoke karni hai
- optionally user ki saari active sessions revoke karni hain
- security audit log create karna hai
- client ko forced re-login dena hai

Ye step security ke liye bahut important hai. Sirf refresh endpoint banana enough nahi hoga.

### Logout

`POST /api/auth/logout`

- current session identify hogi using access token `sid` ya refresh cookie lookup
- server-side session revoke hogi
- refresh cookie clear hogi
- frontend in-memory access token clear karega

### Logout All Devices

`POST /api/auth/logout-all`

- current user ki sab active sessions revoke hongi
- current browser ki refresh cookie clear hogi
- password change / suspicious activity ke baad ye endpoint useful rahega

### Session Bootstrap On App Load

Frontend app reload ke baad direct `localStorage` token trust nahi karega.

New flow:

- app mount par silent refresh try karega
- agar valid refresh cookie hai to naya access token milega
- uske baad `/api/me` call hoga
- agar refresh fail hota hai to user anonymous state me chala jayega

Isse stale token UI state aur actual server auth state sync me rahegi.

## Backend Changes Planned

### New / Updated Auth Routes

`backend/src/routes/auth.route.js` me ye routes add/update karne honge:

- `POST /signup`
- `POST /login`
- `POST /refresh`
- `POST /logout`
- `POST /logout-all`
- optional `GET /session` ya existing `/api/me` ko bootstrap ke liye use karna

### Auth Service Split

`backend/src/services/auth.service.js` ko sirf credential check tak limited rakhna better hoga. Session-specific helper functions alag karne honge, for example:

- `createSession`
- `rotateSession`
- `revokeSession`
- `revokeAllUserSessions`
- `issueAccessToken`
- `setRefreshCookie`
- `clearRefreshCookie`

Isse auth flow readable aur testable rahega.

### Middleware Hardening

`backend/src/middleware/auth.middleware.js` me ye checks add karne honge:

- access token verify using dedicated access secret
- `sid` required hoga
- session active honi chahiye
- user exist aur `status === "active"` hona chahiye
- tenant consistency validate karni hogi
- revoked/expired session par clear `401` error code dena hoga

Current middleware sirf JWT signature + user existence check karta hai. Better security ke liye server-side session validation mandatory hai.

### Cookie / CORS Changes

`backend/src/app.js` me:

- `credentials: true`
- fixed trusted origin list
- wildcard origin avoid karna

Refresh cookie config:

- `httpOnly: true`
- `secure: true` in production
- `sameSite: "strict"` preferred if frontend/backend same-site deployment me hain
- `sameSite: "none"` sirf tab jab truly cross-site deployment required ho
- narrow `path`, preferably `/api/auth`

### Error Codes

Frontend ko predictable behavior dene ke liye plain message ke sath error codes bhi dene honge:

- `access_token_expired`
- `session_revoked`
- `refresh_token_invalid`
- `refresh_token_reused`
- `account_disabled`
- `auth_required`

Isse axios interceptor correct logout vs retry behavior decide kar sakega.

### Audit Logging

Existing audit/activity infrastructure ko auth events ke liye extend karna hai:

- login success
- login failure threshold
- refresh success
- refresh denied
- refresh reuse detected
- logout
- logout all
- account disabled forced revoke

## Frontend Changes Planned

### Auth State Strategy

`frontend/src/context/AuthContext.jsx` ko localStorage-based token store se memory-based auth state me move karna hai.

New auth state:

- `accessToken`
- `user`
- `status` = `loading | authenticated | anonymous`
- `login()`
- `logout()`
- `refreshSession()`

Important:

- access token page reload ke baad memory se chala jayega
- refresh cookie silent refresh ke through new access token laayegi

### Axios Strategy

`frontend/src/api/axios.js` me:

- `withCredentials: true`
- request interceptor memory token use karega
- response interceptor `401` par single refresh attempt karega
- refresh in-flight dedupe hoga, taaki parallel 401 requests multiple refresh calls na karein
- refresh fail hua to clean logout hoga

### Route Protection

`frontend/src/components/ProtectedRoute.jsx` abhi sirf token presence check karta hai.

Isko update karna hoga taaki:

- app bootstrap complete hone tak loading state dikhe
- anonymous state me hi redirect ho
- role check server-synced user object par ho

### Login / Signup Pages

`frontend/src/pages/Login.jsx` aur `frontend/src/pages/Signup.jsx` me:

- response se direct `localStorage` write nahi hoga
- login helper new access token ko memory me set karega
- refresh cookie backend set karega

### Logout UX

`frontend/src/layouts/AppLayout.jsx`

- current local logout ko API-backed logout me convert karna hoga
- backend revoke ke baad hi local auth state clear karni hogi

## Additional Security Decisions

### Separate Secrets

Access tokens ke liye alag secret use karna hai:

- `ACCESS_TOKEN_SECRET`

Agar refresh token JWT-based rakhte to alag `REFRESH_TOKEN_SECRET` chahiye hota, lekin recommended design opaque refresh token ka hai.

### Session Revocation Triggers

In cases me active sessions revoke karne honge:

- user disabled
- password changed
- suspicious token reuse
- manual logout-all
- role downgrade jahan immediate permission shrink required ho

### Invite Flow

Invite flow primary auth lifecycle ka part nahi hai, lekin better security ke liye later phase me:

- invite token plaintext store karne ke bajay hash store karna
- one-time consumption strict rakhna

Ye refresh/session work ke baad karna sahi rahega.

### Rate Limit

Auth endpoints par stronger rate limit add karni hogi:

- `/api/auth/login`
- `/api/auth/refresh`
- `/api/auth/logout`

Refresh endpoint ko unlimited nahi chhodna chahiye.

### CSRF Consideration

Kyuki refresh token cookie me hoga, cookie-auth endpoints ke liye CSRF precautions chahiye:

- `SameSite=Strict` preferred
- trusted `Origin` validation
- only `POST` for refresh/logout/logout-all
- agar deployment cross-site hua to CSRF token strategy add karni padegi

## Suggested API Contract

### Login Success

Response body:

- `accessToken`
- `user`

Cookie:

- refresh token

### Refresh Success

Response body:

- `accessToken`

Cookie:

- rotated refresh token

### Logout Success

Response body:

- success message only

Cookie:

- refresh cookie cleared

## Rollout Order

Implementation mujhe is order me karni chahiye:

1. Session model + token utilities
2. cookie helpers + auth config
3. login/signup response refactor
4. refresh endpoint with rotation
5. logout + logout-all
6. middleware session validation
7. frontend memory auth context
8. axios refresh interceptor
9. protected route bootstrap flow
10. audit logs + cleanup polish

## Acceptance Checklist

Kaam complete tab maana jayega jab:

- login ke baad refresh cookie set ho
- access token `localStorage` me na ho
- page reload ke baad user silent refresh se restore ho
- expired access token ke baad first API call auto-refresh kar sake
- revoked session refresh na kar sake
- logout current device ko invalidate kare
- logout-all sab devices ko invalidate kare
- disabled user active session continue na kar sake
- reused refresh token detect ho aur forced re-login ho
- `/api/me` stale client state ke against consistent result de

## Final Direction

Best secure direction is:

- short-lived JWT access token
- opaque hashed refresh token
- HttpOnly refresh cookie
- DB-backed session store
- rotation on every refresh
- reuse detection
- API-backed logout
- frontend memory auth state

Isi approach par implementation karunga, kyuki ye current codebase ke structure ke sath fit bhi hota hai aur security bhi significantly improve karta hai.
