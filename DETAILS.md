# Project Module Validation and Toast Refactor

## Goal

The goal of this change was to make the project module feel more product-like and less noisy:

- Validation errors should stay near the field that caused them.
- Async request states should use React Hot Toast.
- Backend validation should remain the source of truth.
- Frontend code should not duplicate the same error-handling logic in every component.

This was applied only to the project module for now.

## What Was Changed

### 1. Backend validation response was upgraded

File:
`backend/src/middleware/validate.middleware.js`

Before:

- The backend returned only the first Zod validation message.
- Response shape was effectively:
  - `success: false`
  - `message: "some first error"`

Problem:

- Frontend could not know which exact field failed.
- Only one message could be shown at a time.
- Inline field mapping was not possible in a reliable way.

Now:

- The middleware still returns the first message for compatibility.
- It also returns:
  - `error`
  - `message`
  - `errors` as a field-to-message map
  - `issues` as the raw list of validation issues

Example shape:

```json
{
  "success": false,
  "error": "Project name must be at least 2 characters",
  "message": "Project name must be at least 2 characters",
  "errors": {
    "name": "Project name must be at least 2 characters"
  },
  "issues": [
    {
      "path": ["name"],
      "message": "Project name must be at least 2 characters"
    }
  ]
}
```

Why this matters:

- The frontend can now show validation exactly under the affected field.
- We do not need to guess field names on the frontend.
- The backend remains the authority for actual validation rules.

## 2. A shared project-module utility file was added

File:
`frontend/src/pages/projects/projectModuleUtils.js`

This file centralizes the common logic that was previously duplicated across pages.

It now provides:

- `getErrorMessage`
  - Extracts a safe fallback-friendly error message.

- `getValidationErrors`
  - Reads `response.data.errors` from backend validation responses.

- `isValidationError`
  - Detects whether an error is a backend validation error.

- `splitValidationErrors`
  - Separates field-level errors from generic form-level errors.

- `runAsyncToast`
  - Handles loading, success, and failure toast states.
  - Can suppress toast error UI when the error is actually a validation error.

Why this matters:

- Every project screen now follows the same behavior.
- Async toast behavior is consistent.
- Validation mapping is consistent.
- Future project-module forms can reuse the same pattern.

## 3. Create Project form was refactored

File:
`frontend/src/pages/projects/CreateProjectForm.jsx`

Before:

- A single `error` string was used.
- Validation was partly local and partly toast-based.
- Backend validation could not map field-wise.
- If there were multiple invalid fields, the UI could only show one generic message.

Now:

- Replaced the single `error` string with:
  - `fieldErrors`
  - `formError`
- Backend validation is mapped inline per field.
- Inputs use `aria-invalid` when a field has an error.
- Borders turn red for invalid fields.
- Error text is shown directly below the affected input.
- Toast is only used for:
  - `Creating project...`
  - `Project created`
  - real async failure that is not a validation error

Product reason:

- In a modal form, a toast is easy to miss.
- The user should not have to remember which field caused the error.
- Inline feedback reduces retry friction.

## 4. Projects page async handlers were normalized

File:
`frontend/src/pages/projects/index.jsx`

Before:

- `toast.promise` and local helper logic were mixed.
- Create, delete, and status update were handled in slightly different styles.

Now:

- The page imports shared helpers from `projectModuleUtils.js`.
- Create relies on the form to render validation inline.
- Delete and status update use the shared async toast wrapper.
- Toast is used only for async lifecycle:
  - deleting project
  - updating status

Why:

- This keeps page-level orchestration simple.
- The form owns validation display.
- The page owns async flow and data refresh.

## 5. Create Task modal was refactored

File:
`frontend/src/pages/projects/ProjectTasks.jsx`

Before:

- A single `formError` string was used for all task form problems.
- Validation errors and permission errors were mixed together.
- `toast.promise` handled create/delete.
- `toast.error` was used even for non-async guard states like "Not allowed".

Now:

- Added:
  - `fieldErrors`
  - `formError`
- Task create errors are shown inline for:
  - `title`
  - `description`
  - `targetDate`
  - `status`
  - `priority`
- Any backend validation on `assigneeId` is mapped to the form-level error.
- Permission/session/completed-project guard messages are shown inside the page/modal instead of toast.
- Async states use toast only for:
  - create task
  - delete task
  - update task status/priority

Product reason:

- Guard messages are not really toast-worthy because they are not transient request events.
- Validation should be anchored to the form.
- Status/priority updates are quick actions, so toast is appropriate for loading/success/failure.

## 6. Project conversation send/edit was refactored

Files:

- `frontend/src/pages/projects/ProjectConversation.jsx`
- `frontend/src/pages/projects/MessageComposer.jsx`
- `frontend/src/pages/projects/MessageList.jsx`
- `frontend/src/pages/projects/MessageItem.jsx`

Before:

- Empty composer/edit submissions just returned silently.
- Validation was not shown inline under the message textarea.
- Toast handled async states but validation feedback was weak.

Now:

- Added:
  - `composerError`
  - `editError`
- Composer validation is shown directly below the bottom textarea.
- Edit validation is shown directly below the inline edit textarea.
- Composer/edit errors clear as the user types.
- Async states use toast only for:
  - sending message
  - saving edited message
  - deleting message

Why:

- Messaging UX should feel immediate and obvious.
- If a message is invalid, the user should see the reason exactly where they typed.
- Toast is useful for async request state, not for telling the user that their textbox is empty.

## 7. Assign Client and Assign Member popovers were also aligned

Files:

- `frontend/src/pages/projects/AssignClients.jsx`
- `frontend/src/pages/projects/AssignMembers.jsx`

Before:

- Validation and failure were handled only through toast.
- Popover had no inline error space.

Now:

- Added local `formError` to each popover.
- Backend validation for `clientIds` or `memberIds` is displayed inline inside the dropdown.
- Toast is used only for:
  - saving clients
  - saving members
  - non-validation async failures

Why:

- If the interaction happens inside a popover, the error should stay inside that popover.
- This keeps the user mentally anchored to the action they are taking.

## Why This Approach Was Chosen

This approach was selected because it balances product UX, maintainability, and correctness.

### Backend is the real validation source

- Zod rules already exist in backend validators.
- If the frontend reimplements everything locally, rules drift over time.
- Mapping backend field errors inline is more reliable than duplicating every rule in the UI.

### Inline errors are better for forms

- A validation error is not a global event.
- It is tied to one field or one form.
- Toast disappears after a few seconds.
- Inline text stays visible until the user fixes the issue.

### Toast is best for async lifecycle

Toast works well for:

- loading
- success
- non-validation failure

Toast works poorly for:

- field-specific validation
- multiple field errors
- errors inside modals or popovers
- errors that require the user to scan a form and fix inputs

### Shared helpers reduce inconsistency

Without a shared helper:

- every screen would manually parse axios errors
- every screen would decide differently what counts as validation
- every screen would style errors differently

With shared helpers:

- behavior stays consistent
- code stays smaller
- future changes become easier

## Why Not Use "Normal Validation Like Others"

By "normal validation", the older pattern in the repo generally means one of these:

- run a few local checks with `if (!value) setError("...")`
- keep a single error string for the whole form
- show server validation in toast
- rely on the first backend message only

That pattern is acceptable for very small forms, but it is not ideal for the project module.

### Problems with the older pattern

- It scales poorly for multi-field forms.
- One error string cannot tell the user exactly where to look.
- Toast-based validation is noisy and easy to miss.
- Frontend rules can drift from backend Zod rules.
- Complex UI surfaces like modals, popovers, and inline editors need local visual feedback.

### Why project module needed a better pattern

The project module has more complex UX than a simple login form:

- create project modal
- create task modal
- task quick updates
- conversation composer
- inline message editing
- assignment popovers

Because of that, a stronger pattern was worth using here:

- backend validates
- frontend maps
- form shows inline
- toast handles async lifecycle

This is a more reusable and product-friendly approach.

## Important Product Design Decisions

These decisions were intentional:

- Validation errors remain visible until the user changes the field.
- Invalid fields get red border treatment for faster scanning.
- Form-level non-field errors still have a place with `formError`.
- Permission or guard-state messages on the task page stay in the page/modal, not toast.
- Async feedback remains fast and lightweight through toast.

This gives users:

- better clarity
- fewer surprise toasts
- less re-reading of the form
- faster correction loops

## Tradeoff

This approach is slightly more code than a single `error` string.

That tradeoff was accepted because:

- the module has enough complexity to justify it
- it improves UX noticeably
- it avoids validation duplication
- it creates a reusable pattern for future project features

## Verification Done

These checks were run for the touched project-module files:

```bash
npm.cmd exec eslint src/pages/projects/AssignClients.jsx src/pages/projects/AssignMembers.jsx src/pages/projects/CreateProjectForm.jsx src/pages/projects/index.jsx src/pages/projects/ProjectTasks.jsx src/pages/projects/ProjectConversation.jsx src/pages/projects/MessageComposer.jsx src/pages/projects/MessageList.jsx src/pages/projects/MessageItem.jsx src/pages/projects/projectModuleUtils.js
```

Backend middleware was also sanity-checked with:

```bash
node -e "require('./backend/src/middleware/validate.middleware.js'); console.log('validate middleware ok')"
```

## Summary

In short:

- backend now returns field-aware validation data
- project module maps validation inline
- toast is used only for async lifecycle states
- the UX is more predictable and less noisy
- the implementation is more reusable than the older single-error approach
