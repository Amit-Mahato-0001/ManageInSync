# FIX: "Invite expired or invalid"

## What is wrong

### 1) Frontend hides the real backend error
- File: `frontend/src/pages/AcceptInvite.jsx`
- Current behavior:
  - In `catch`, it always does `setError("Invite expired or invalid")`.
- Impact:
  - Even when backend returns specific errors (`Invite already used`, `Invite expired`, `Password must be at least 8 characters`, `Invalid token or password`), user always sees the same generic message.
  - This makes debugging look like token issue even when it is not.

### 2) Token is not validated in UI before API call
- File: `frontend/src/pages/AcceptInvite.jsx`
- Current behavior:
  - `token` is read from query param and sent directly.
  - No check for empty/missing token.
- Impact:
  - Broken link like `/accept-invite` (without `?token=...`) still calls API and then shows generic error.

### 3) Password rule not validated on UI
- File: `frontend/src/pages/AcceptInvite.jsx`
- Current behavior:
  - Backend requires password length >= 8.
  - UI does not validate before submit.
- Impact:
  - User submits short password, backend rejects, but UI still shows generic "expired or invalid".

### 4) Token normalization is missing in backend (edge case)
- File: `backend/src/services/auth.service.js` (`acceptInvite`)
- Current behavior:
  - Uses `inviteToken: token` directly in `User.findOne`.
- Impact:
  - If token has accidental spaces, lookup fails and returns invalid/expired.

## Backend logic that is correct (expected failure cases)

In `backend/src/services/auth.service.js`, `acceptInvite` correctly rejects when:
- token/password missing
- invite token not found
- invite expired (`inviteTokenExpires < now`)
- invite already used (`status !== "invited"`)

So the main confusion is mostly **error visibility in frontend**, not core invite logic.

## How to fix (manual changes to apply)

### A) Update frontend error handling
File: `frontend/src/pages/AcceptInvite.jsx`

1. Replace hardcoded catch message with backend message:
- From:
  - `setError("Invite expired or invalid")`
- To:
  - `setError(error.response?.data?.message || "Failed to accept invite")`

2. Before API call, validate token exists:
- If token is empty/null, show:
  - `"Invite link is invalid. Please request a new invite."`

3. Before API call, validate password length:
- If password length < 8, show:
  - `"Password must be at least 8 characters"`

4. Add `minLength={8}` to password input for basic client-side validation.

### B) Harden backend token handling
File: `backend/src/services/auth.service.js`

1. Normalize token:
- `const inviteToken = token?.trim()`
- Use `inviteToken` for DB query.

2. (Optional but safer) guard expiry check:
- If `inviteTokenExpires` missing, treat as expired.

## Quick verification checklist after applying fixes

1. Valid invite + valid password (>=8):
- Expected: success message and redirect to login.

2. Valid invite + short password:
- Expected: `Password must be at least 8 characters` (not expired/invalid).

3. Reuse same invite after success:
- Expected: `Invite already used`.

4. Expired invite (after 24h):
- Expected: `Invite expired`.

5. Missing token URL (`/accept-invite`):
- Expected: `Invite link is invalid. Please request a new invite.`

## Notes

- Invite expiry is intentionally 24 hours from creation:
  - `backend/src/services/invite.service.js` sets:
  - `inviteTokenExpires = Date.now() + 24 * 60 * 60 * 1000`
- If user is re-invited, old invite token becomes invalid (expected behavior).
