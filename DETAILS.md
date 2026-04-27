# Change Logs

## 1. Backend env cleanup
**File:** `backend/.env.example`

**What changed:**
- Replaced real-looking secrets with placeholders
- Replaced Gmail & Razorpay keys with dummy values
- Made SMTP configuration clearer
- Added clear instruction to use App Password

**Why:**
- This file is public/shareable → real credentials could have been leaked

---

## 2. Improved frontend env guidance
**File:** `frontend/.env.example`

**What changed:**
- Clarified that `VITE_API_URL` is optional
- Added local vs production examples
- Added warning not to store secrets in frontend

**Why:**
- Frontend env variables are visible in the browser → unsafe for secrets

---

## 3. Ignored frontend env files
**File:** `frontend/.gitignore`

**What changed:**
- Ignored `.env` and `.env.*` files
- Allowed `.env.example`

**Why:**
- Prevent accidental commit of real local configuration

---

## 4. Added root .gitignore
**File:** `.gitignore`

**What changed:**
- Added common ignores (`.env`, `node_modules`, `dist`)

**Why:**
- Helps keep secrets and unnecessary files out of the repo in future

---

## 5. Improved Docker compose documentation
**File:** `docker-compose.yml`

**What changed:**
- Mentioned that credentials are loaded from `.env`
- Advised not to put real credentials directly in the file

**Why:**
- Keeps configuration secure and clean

---

## 6. Fixed CI / backend tests
**Files:**
- `backend/test/helpers/testEnv.js`
- `backend/test/email.test.js`

**What changed:**
- Added fake email config for test environment
- Fixed secure settings for port 465 case

**Why:**
- CI does not have real credentials → tests were failing

---

## Rule

Real credentials should only be stored in:
- `backend/.env`

Never store credentials in:
- `.env.example`
- frontend env files
- test files
- `docker-compose.yml`

**Reason:**
- Prevents accidental exposure of secrets (especially in frontend)