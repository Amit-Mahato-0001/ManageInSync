# Updates

## 2026-06-01

- Fixed a refresh-token rotation race condition in `backend/src/services/auth.service.js`.

- Added a MongoDB transaction and atomic refresh-session claim to ensure a refresh token can only be used once.

- Prevented concurrent refresh requests from generating multiple valid replacement sessions.

- Requests that attempt to reuse an already-claimed refresh token are now rejected as token reuse.