const express = require("express")
const requireRole = require("../middleware/rbac.middleware")
const validate = require("../middleware/validate.middleware")
const { createRateLimiter } = require("../middleware/rateLimit.middleware")
const {
    createInvoiceHandler,
    createInvoiceCheckoutOrderHandler,
    listInvoicesHandler,
    getInvoiceDetailHandler,
    issueInvoiceHandler,
    verifyInvoiceCheckoutPaymentHandler,
    createInvoicePaymentHandler
} = require("../controllers/billing.controller")
const {
    createInvoiceSchema,
    invoiceListQuerySchema,
    invoiceParamsSchema,
    verifyRazorpayPaymentSchema,
    createInvoicePaymentSchema
} = require("../validators/billing.validator")

const router = express.Router()
const billingRateLimiter = createRateLimiter({
    windowMs: Number(process.env.BILLING_RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000,
    max: Number(process.env.BILLING_RATE_LIMIT_MAX) || 60,
    message: "Too many billing requests. Please try again later.",
    code: "billing_rate_limit_exceeded"
})

router.post(
    "/invoices",
    billingRateLimiter,
    requireRole(["owner"]),
    validate(createInvoiceSchema, "body"),
    createInvoiceHandler
)

router.get(
    "/invoices",
    requireRole(["owner", "client"]),
    validate(invoiceListQuerySchema, "query"),
    listInvoicesHandler
)

router.get(
    "/invoices/:invoiceId",
    requireRole(["owner", "client"]),
    validate(invoiceParamsSchema, "params"),
    getInvoiceDetailHandler
)

router.post(
    "/invoices/:invoiceId/issue",
    billingRateLimiter,
    requireRole(["owner"]),
    validate(invoiceParamsSchema, "params"),
    issueInvoiceHandler
)

router.post(
    "/invoices/:invoiceId/checkout-order",
    billingRateLimiter,
    requireRole(["owner", "client"]),
    validate(invoiceParamsSchema, "params"),
    createInvoiceCheckoutOrderHandler
)

router.post(
    "/invoices/:invoiceId/payments/verify",
    billingRateLimiter,
    requireRole(["owner", "client"]),
    validate(invoiceParamsSchema, "params"),
    validate(verifyRazorpayPaymentSchema, "body"),
    verifyInvoiceCheckoutPaymentHandler
)

router.post(
    "/invoices/:invoiceId/payments",
    billingRateLimiter,
    requireRole(["owner"]),
    validate(invoiceParamsSchema, "params"),
    validate(createInvoicePaymentSchema, "body"),
    createInvoicePaymentHandler
)

module.exports = router
