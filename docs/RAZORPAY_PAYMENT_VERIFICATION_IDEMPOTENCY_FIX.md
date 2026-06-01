# Razorpay Payment Verification Idempotency Fix

## Problem in simple words

The Razorpay verification flow can double-count the same payment if two verify requests arrive at almost the same time.

The risky code is in:

- `backend/src/services/billing.service.js`
- Function: `verifyInvoiceCheckoutPayment`
- Main risky area: around lines `339` to `459`

Today the flow roughly does this:

1. Find a Razorpay payment row with `status: "pending"`.
2. Verify the Razorpay signature.
3. Fetch or capture the Razorpay payment.
4. Mark the payment row as `paid`.
5. Add the paid amount to `invoice.amountPaid`.
6. Recalculate `invoice.amountDue`.

The bug is between step 1 and step 5.

If two requests run together, both can read the same pending payment before either one saves it as paid. Then both requests can add the same amount to the invoice.

Example:

```text
Invoice total: 1000
Invoice amountPaid: 0

Request A sees pending payment of 1000
Request B sees pending payment of 1000

Request A marks payment paid and adds 1000
Request B also marks payment paid and adds 1000

Wrong result:
amountPaid = 2000
amountDue = 0
```

This is a money bug. Fix it before using real payments.

## Goal of the fix

The same Razorpay payment must affect the invoice only once.

That means verification must be:

- **Idempotent**: retrying the same successful verify request returns the existing paid payment instead of adding money again.
- **Transaction-safe**: the payment row update and invoice total update succeed together or fail together.
- **Atomic**: only one request can change a payment from `pending` to `paid`.

## Files to edit

### 1. `backend/src/services/billing.service.js`

This is the main file to fix.

You will change `verifyInvoiceCheckoutPayment`.

### 2. `backend/src/models/payment.model.js`

This file already has:

```js
transactionId: {
    type: String,
    required: true,
    trim: true,
    unique: true
}
```

That unique index is good and should stay.

You may optionally add a more specific index for Razorpay lookup speed:

```js
paymentSchema.index({
    tenantId: 1,
    invoiceId: 1,
    gateway: 1,
    status: 1,
    transactionId: 1
})
```

This index is not the main safety fix. The real safety fix is the atomic update in `billing.service.js`.

## Correct manual fix approach

Do not use this unsafe pattern:

```js
const pendingPayment = await Payment.findOne({ status: "pending" })

pendingPayment.status = "paid"
await pendingPayment.save()

invoice.amountPaid += paidAmount
await invoice.save()
```

Use this safer pattern instead:

1. Verify Razorpay signature.
2. Fetch or capture the payment from Razorpay.
3. Start a MongoDB session and transaction.
4. Atomically change the payment from `pending` to `paid`.
5. Only if that atomic update succeeds, increment the invoice.
6. Commit the transaction.
7. If the atomic update fails, return the already-paid payment instead of adding money again.

## Why the atomic update matters

The most important part is this filter:

```js
{
    tenantId,
    invoiceId,
    transactionId: razorpayOrderId,
    gateway: "razorpay",
    status: "pending"
}
```

And this update:

```js
{
    $set: {
        transactionId: razorpayPaymentId,
        status: "paid",
        paidAt: new Date(),
        gateway: paymentDetails.method
            ? `razorpay:${paymentDetails.method}`
            : "razorpay",
        amount: paidAmount,
        rawResponseJson: {
            ...
        }
    }
}
```

Use `findOneAndUpdate`.

Why?

Because MongoDB will only update the document if it is still `pending`.

If Request A changes it to `paid`, Request B cannot match `status: "pending"` anymore. Request B will get `null`, and it must not update the invoice.

## Suggested code shape

Inside `verifyInvoiceCheckoutPayment`, keep the existing Razorpay validation logic, but replace the final `pendingPayment.save()` plus `invoice.save()` section.

The current unsafe section starts around here:

```js
pendingPayment.transactionId = razorpayPaymentId
pendingPayment.status = "paid"
...
await pendingPayment.save()

invoice.amountPaid = roundMoney(invoice.amountPaid + paidAmount)
invoice.amountDue = roundMoney(Math.max(invoice.total - invoice.amountPaid, 0))
invoice.status = getPayableStatus(invoice.dueDate, invoice.amountDue)
await invoice.save()
```

Replace that idea with a transaction.

Example structure:

```js
const session = await mongoose.startSession()

let paidPayment

try {
    await session.withTransaction(async () => {
        paidPayment = await Payment.findOneAndUpdate(
            {
                tenantId,
                invoiceId,
                transactionId: razorpayOrderId,
                gateway: "razorpay",
                status: "pending"
            },
            {
                $set: {
                    transactionId: razorpayPaymentId,
                    status: "paid",
                    paidAt: new Date(),
                    gateway: paymentDetails.method
                        ? `razorpay:${paymentDetails.method}`
                        : "razorpay",
                    amount: paidAmount,
                    rawResponseJson: {
                        ...(pendingPayment.rawResponseJson || {}),
                        verification: {
                            status: "verified",
                            orderId: razorpayOrderId,
                            paymentId: razorpayPaymentId,
                            signature: razorpaySignature
                        },
                        payment: paymentDetails
                    }
                }
            },
            {
                new: true,
                session
            }
        )

        if (!paidPayment) {
            return
        }

        const updatedInvoice = await Invoice.findOneAndUpdate(
            {
                _id: invoiceId,
                tenantId,
                amountDue: { $gte: paidAmount }
            },
            {
                $inc: {
                    amountPaid: paidAmount,
                    amountDue: -paidAmount
                }
            },
            {
                new: true,
                session
            }
        )

        if (!updatedInvoice) {
            throw createHttpError("Payment amount exceeds the current invoice due", 409)
        }

        updatedInvoice.amountPaid = roundMoney(updatedInvoice.amountPaid)
        updatedInvoice.amountDue = roundMoney(Math.max(updatedInvoice.amountDue, 0))
        updatedInvoice.status = getPayableStatus(
            updatedInvoice.dueDate,
            updatedInvoice.amountDue
        )

        await updatedInvoice.save({ session })
    })
} finally {
    await session.endSession()
}
```

After the transaction, handle the idempotent retry case:

```js
if (!paidPayment) {
    const alreadyPaidPayment = await getPaidRazorpayPayment({
        tenantId,
        invoiceId,
        paymentId: razorpayPaymentId
    })

    if (alreadyPaidPayment) {
        return {
            payment: alreadyPaidPayment,
            invoice: await getInvoiceDetail({
                tenantId,
                invoiceId,
                user
            })
        }
    }

    throw createHttpError("Payment was already processed or is no longer pending", 409)
}
```

Then return the successful result:

```js
return {
    payment: paidPayment.toObject(),
    invoice: await getInvoiceDetail({
        tenantId,
        invoiceId,
        user
    })
}
```

## Important detail about Razorpay API calls

Do not put Razorpay network calls inside the MongoDB transaction.

Keep these before the transaction:

```js
let paymentDetails = await fetchPayment(razorpayPaymentId)

if (paymentDetails.status === "authorized") {
    paymentDetails = await capturePayment({
        paymentId: razorpayPaymentId,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency || "INR"
    })
}
```

Reason:

MongoDB transactions should be short. A network call to Razorpay can be slow or fail. The database transaction should only protect your own local database changes.

## What to do with the earlier pending payment read

You still need to read the pending payment before calling Razorpay because you need:

- The original Razorpay order id.
- The expected amount.
- The existing `rawResponseJson`.

That is okay.

But do not trust that read for final safety.

The final safety check must be the atomic `findOneAndUpdate` with:

```js
status: "pending"
```

## Invalid signature handling

The current invalid signature code marks the pending payment as failed:

```js
pendingPayment.status = "failed"
await pendingPayment.save()
```

This can also be made safer with an atomic update:

```js
await Payment.findOneAndUpdate(
    {
        _id: pendingPayment._id,
        status: "pending"
    },
    {
        $set: {
            status: "failed",
            rawResponseJson: {
                ...(pendingPayment.rawResponseJson || {}),
                verification: {
                    status: "failed",
                    reason: "invalid_signature"
                }
            }
        }
    }
)
```

This is less dangerous than the paid path, but it is still cleaner.

## Testing the fix manually

After changing the code, test these cases.

### Case 1: Normal successful payment

1. Create an invoice.
2. Start Razorpay checkout.
3. Complete payment.
4. Verify that:
   - Payment becomes `paid`.
   - Invoice `amountPaid` increases once.
   - Invoice `amountDue` decreases once.
   - Invoice status becomes `paid` if fully paid.

### Case 2: Same verify request sent twice

Send the exact same verify request twice.

Expected result:

- First request marks payment as paid.
- Second request returns the existing paid payment.
- Invoice amount is not added twice.

### Case 3: Two verify requests at the same time

Send two verify requests concurrently.

Expected result:

- Only one request wins the `pending` to `paid` update.
- The other request returns the already-paid payment or a safe conflict response.
- Invoice `amountPaid` is correct.

### Case 4: Invalid signature

Send a wrong `razorpay_signature`.

Expected result:

- Payment is marked `failed` only if it is still pending.
- Invoice totals do not change.

## Quick checklist

- [ ] `verifyInvoiceCheckoutPayment` uses `mongoose.startSession()`.
- [ ] Payment update and invoice update happen inside one transaction.
- [ ] Payment is claimed with `findOneAndUpdate` and `status: "pending"`.
- [ ] Invoice is updated only if the payment claim succeeds.
- [ ] Duplicate verify requests return the already-paid payment.
- [ ] Razorpay `fetchPayment` and `capturePayment` stay outside the transaction.
- [ ] Invoice totals cannot be double-incremented.

## Short version

The fix is not just "check if payment is already paid".

The real fix is:

```text
Only one request may change payment status from pending to paid.
Only that winning request may increment the invoice.
Both local database changes must happen in one transaction.
```

