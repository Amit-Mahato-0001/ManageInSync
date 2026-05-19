# Changelog

## 2026-05-19

- Optimized auth middleware hot path for protected requests.

- Session and user lookups now use `.lean()` so Mongoose does not hydrate full documents on every API request.

- Session and user lookups now run in parallel after JWT verification.

- Session activity refresh now uses a targeted `Session.updateOne()` instead of mutating and saving a hydrated session document.

- Security checks are still kept: revoked/expired session, session user match, disabled account revocation, active user status, tenant match, and role drift detection.

- Backend tests passed.