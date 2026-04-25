## Content Security Policy

### What was done :

- Added a **Content Security Policy (CSP)** in the backend (only for production).
- Allowed only trusted sources:
  - App’s own resources (same-origin)
  - Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`)
  - Razorpay (`checkout.razorpay.com`, `api.razorpay.com`)
- Moved Google Fonts to `index.html` so it is clearly visible as an external dependency.
- Updated `styles.css` to only handle the font family (no external imports).
- Replaced the Razorpay URL in code with a **constant** (cleaner and easier to check).
- Updated tests to make sure **CSP and HSTS headers** work in production.

---

### Notes :

- The app is now using **Google Fonts** instead of local fonts.
- Styling remains the same (no UI change).
- Local fonts folder is not used anymore.
- In future, fonts can be self-hosted to make security even stronger.

---

### Summary

The app now has **basic security rules (CSP) in production**, uses **trusted sources only**, and the code is **clean and easier to manage**.