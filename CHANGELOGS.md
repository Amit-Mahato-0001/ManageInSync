# Changelog

## 2026-05-07

- Updated user uniqueness so the same email is blocked only inside the same tenant/workspace, while different tenants can reuse the email.

- Improved invite duplicate-key handling with clearer backend errors instead of a generic production internal server error.
