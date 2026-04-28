## Fixed CI / Frontend Lint Issues

**File Updated:**  
`frontend/src/features/auth/context/AuthContext.jsx`

---

### What was changed

- Removed an unused `error` variable from a `catch` block  
- Wrapped auth helper functions with `useCallback` to avoid unnecessary re-renders  
- Added missing dependencies to `useEffect`  

---

### What was the problem

- CI was failing when running:
  ```
  npm run lint --prefix frontend
  ```
- ESLint errors found:
  - Unused variable (`error`)
  - Missing dependencies in `useEffect`

These errors were blocking the build.

---

### What is improved now

- Lint errors are fixed → CI will pass  
- React hooks behave correctly and predictably  
- Code is cleaner and easier to maintain  

---

### Verification

Commands used to verify the fix:

```
npm run lint --prefix frontend
npm test --prefix frontend
```

---

## Rule: Handling Credentials

### Store real credentials only in:
- `backend/.env`

### Never store credentials in:
- `.env.example`
- Frontend environment files
- Test files
- `docker-compose.yml`

---

### Reason

- Frontend code is publicly accessible  
- Storing secrets there can expose sensitive data  
- Once secrets are committed, they are hard to fully remove  

This rule helps prevent accidental security leaks