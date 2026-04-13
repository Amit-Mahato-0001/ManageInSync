const express = require("express")
const requireRole = require("../middleware/rbac.middleware")
const validate = require("../middleware/validate.middleware")
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

router.post(
    "/invoices",
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
    requireRole(["owner"]),
    validate(invoiceParamsSchema, "params"),
    issueInvoiceHandler
)

router.post(
    "/invoices/:invoiceId/checkout-order",
    requireRole(["owner", "client"]),
    validate(invoiceParamsSchema, "params"),
    createInvoiceCheckoutOrderHandler
)

router.post(
    "/invoices/:invoiceId/payments/verify",
    requireRole(["owner", "client"]),
    validate(invoiceParamsSchema, "params"),
    validate(verifyRazorpayPaymentSchema, "body"),
    verifyInvoiceCheckoutPaymentHandler
)

router.post(
    "/invoices/:invoiceId/payments",
    requireRole(["owner"]),
    validate(invoiceParamsSchema, "params"),
    validate(createInvoicePaymentSchema, "body"),
    createInvoicePaymentHandler
)

module.exports = router
