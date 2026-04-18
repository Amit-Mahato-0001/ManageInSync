## Updates

- App now checks required env variables (DB, auth, email, payment) at startup and fails if missing
- Restricted API access to allowed frontend domains and added basic security headers
- Limited request size to prevent large payload abuse
- Added global rate limit to protect entire API from spam/abuse
- Added stricter rate limits on login, invite, and payment endpoints
- Fixed auth cookies for proper cross-site usage (SameSite + domain support)
- Updated email setup with configurable sender and safer invite links
- Added timeout to Razorpay requests to avoid hanging payments
- Hid internal server errors in production for security
- Added tests for auth, security, email, payments, and env validation
- Updated env example files with all required production configs
- CI/CD now runs tests, lint, and build before creating Docker release