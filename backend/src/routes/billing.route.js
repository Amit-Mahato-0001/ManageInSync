const express = require("express")
const requireRole = require("../middleware/rbac.middleware")
const validate = require("../middleware/validate.middleware")
const {
    createInvoiceHandler,
    listInvoicesHandler,
    getInvoiceDetailHandler,
    issueInvoiceHandler,
    createInvoicePaymentHandler
} = require("../controllers/billing.controller")
const {
    createInvoiceSchema,
    invoiceListQuerySchema,
    invoiceParamsSchema,
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
    "/invoices/:invoiceId/payments",
    requireRole(["owner", "client"]),
    validate(invoiceParamsSchema, "params"),
    validate(createInvoicePaymentSchema, "body"),
    createInvoicePaymentHandler
)

module.exports = router
