# Razorpay Payment Implementation

Razorpay payment is now added on the client invoice side.

## What is done

- A client can open an invoice and click `Pay with Razorpay`.
- The backend creates a Razorpay order for the full pending invoice amount.
- Razorpay Checkout opens on the frontend.
- After payment, the frontend sends the payment details back to the backend.
- The backend verifies the Razorpay signature before marking the payment as successful.
- If the payment is only `authorized`, the backend tries to capture it.
- After a successful payment, the invoice amount paid, amount due, and status are updated.
- The payment is saved in the database with Razorpay details for record keeping.

## Backend changes

- Added a Razorpay utility to create orders, fetch payments, capture payments, and verify signatures.
- Added a route to create a checkout order.
- Added a route to verify the payment after checkout.
- Kept the old direct payment route for owner use only.
- Stopped client users from directly marking an invoice as paid without Razorpay verification.

## Frontend changes

- Added Razorpay Checkout loading on the invoice details page.
- Replaced the old client payment action with real Razorpay checkout.
- Added loading and error messages for checkout and payment verification.
- Updated the button text to `Pay with Razorpay`.

## Required env values

Add these in `backend/.env`:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

## Important note

- This implementation verifies the payment on the backend after checkout.
- Razorpay webhook support is not added yet.
- For stronger production safety, webhook-based payment confirmation can be added later.
