# Billing Project — Structured MVP Scope

## 1) Invoice Core System

This is the core of the billing system.

### Required Features

* Create invoice
* Invoice list
* Invoice detail page
* Invoice status:

  * Draft
  * Unpaid
  * Paid
  * Overdue
* Line items
* Tax calculation
* Total and amount due
* PDF download
* Payment link / payment button

### Notes

* UI and flow should match the provided billing/invoice design/screens as closely as possible.

---

## 2) Minimal but Correct Database Schema

For a small-to-medium scale billing system (~500 users), a simple but properly structured schema is sufficient.

### Required Tables

#### `users`

* `id`
* `name`
* `email`
* `password_hash`
* `role`
* `created_at`

#### `contacts`

* `id`
* `user_id`
* `name`
* `email`
* `phone`
* `company_name`
* `address`
* `created_at`

#### `invoices`

* `id`
* `user_id`
* `contact_id`
* `invoice_number`
* `reference`
* `status` (`draft`, `unpaid`, `paid`, `overdue`)
* `issue_date`
* `due_date`
* `subtotal`
* `tax_total`
* `total`
* `amount_paid`
* `amount_due`
* `notes`
* `created_at`
* `updated_at`

#### `invoice_items`

* `id`
* `invoice_id`
* `item_name`
* `quantity`
* `unit_price`
* `tax_rate`
* `line_total`
* `tax_amount`

#### `payments`

* `id`
* `invoice_id`
* `user_id`
* `gateway`
* `transaction_id`
* `amount`
* `status`
* `paid_at`
* `raw_response_json`
* `created_at`

### Recommended Optional Table

#### `audit_logs`

Basic version:

* `id`
* `user_id`
* `action`
* `entity_type`
* `entity_id`
* `created_at`

### Use Case

Helpful for tracking:

* invoice created
* invoice updated
* payment received
* status changed

---

## 3) Security Requirements (Minimum Safe Standard)

Even for 500 users, billing data must be protected properly.

### Authentication

* Login-protected system
* Session-based auth or JWT
* All billing APIs must be protected

### Authorization

Each user should only access their own invoices and billing data.

#### Required Rule

```ts
invoice.user_id === currentUser.id
```

#### This must apply to:

* invoice list
* invoice detail
* invoice edit
* payment records
* PDF download
* payment links

### Input Validation

All invoice-related inputs should be validated.

#### Required validations

* `quantity > 0`
* `unit_price >= 0`
* valid email format
* valid `due_date`
* valid `issue_date`
* valid tax values

#### Recommended Libraries

* **Zod** (best for Next.js / React stack)

### Backend-Only Calculations

Never trust frontend totals.

All calculations must be done on the server:

* subtotal
* tax
* total
* amount due

This prevents:

* tampered invoice totals
* payment mismatches
* invalid billing records

### Webhook Verification

If using **Stripe** or **Razorpay**, webhook signatures must be verified.

#### Required for:

* payment success
* payment failure
* invoice status update

---

## 4) Payment Integration

Keep payment flow simple and production-safe.

### Recommended Gateway Option

#### Razorpay

Best for:

* India-focused billing
* local payment methods
* easier India-first setup

### Required Payment Flow

1. User opens invoice
2. Clicks **Pay Now**
3. Backend creates payment order / checkout session
4. User completes payment
5. Payment gateway webhook is triggered
6. Invoice status updates to **paid**
7. `amount_due = 0`
8. Payment record is saved

---

## 5) Billing Calculation Rules

These rules should be defined clearly from the beginning to avoid bugs.

### Formula Rules

```ts
line_total = quantity * unit_price
tax_amount = line_total * tax_rate
subtotal = sum(line totals)
tax_total = sum(tax amounts)
total = subtotal + tax_total
amount_due = total - amount_paid
```

### Supported in MVP

* Flat quantity
* Flat unit price
* Per-line tax

### Excluded from MVP

These can be added later if needed:

* complex tax slabs
* tax inclusive / exclusive dual modes
* stacked discounts
* invoice-level coupons
* advanced discount combinations

---

## 6) Frontend Scope

The frontend should focus only on the most useful billing screens.

### A) Invoice List Page

#### Required Features

* Search
* Status filter
* Reset button
* Table view
* Pagination
* View details action/button

#### Recommended Columns

* Invoice #
* Status
* Due Date
* Contact
* Total
* Amount Due

### B) Invoice Detail Page

#### Required Sections

* Invoice header
* Status badge
* Company info
* Bill To section
* Line items table
* Summary box
* Payment button
* PDF download button

### C) Create Invoice Page

#### Required Fields

* Customer select
* Issue date
* Due date
* Reference
* Notes

#### Line Items Fields

* Item name
* Quantity
* Unit price
* Tax %

#### Required Actions

* Add item
* Remove item

---

## 7) PDF Invoice

PDF invoice support should be included in MVP.

### PDF Should Include

* Company logo / company name
* Invoice number
* Issue date
* Due date
* Customer details
* Line items
* Tax breakdown
* Total
* Payment status

### Recommended Approach

**HTML template → PDF generation**

#### Why this is better

* easier to maintain design
* easier to match frontend layout
* easier print-friendly formatting

---

## 8) Email System (Basic Version)

A full email automation system is not necessary for MVP.

### Required Email Actions

* Send invoice email when invoice is created
* Resend invoice email manually

### Optional

* Payment received email

### Recommended Tools

* **Resend** → easiest DX

---

## 9) Performance Requirements (Enough for ~500 Users)

Heavy infra is not required at this stage, but a few basics should be implemented.

### Database Indexes

Add indexes on:

* `user_id`
* `invoice_number`
* `status`
* `due_date`
* `contact_id`

This will improve:

* invoice list performance
* filtering
* search
* invoice lookup

### Pagination

Use paginated APIs.

#### Example

```http
?page=1&limit=10
```

### Frontend Search Optimization

Use **debounced search** on invoice list.

#### Recommended debounce

* `300ms`

