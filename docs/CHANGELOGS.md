# Updates

## 2026-06-03

- Fixed frontend API base URL to use local /api in development.
- Added Vite proxy for /api → http://localhost:3000.
- Removed production VITE_API_URL override from local frontend env.
- Resolved cross-origin cookie/auth issues using same-origin proxy setup.
- Verified axios withCredentials: true configuration for auth requests.
- Diagnosed and validated S3 presigned upload flow locally.
- Identified S3 bucket CORS requirements for browser uploads.
- Confirmed signup/login and file upload working in local setup.