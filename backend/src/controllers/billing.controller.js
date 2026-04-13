const {
    createInvoice,
    listInvoices,
    getInvoiceDetail,
    issueInvoice,
    createInvoicePayment,
    createInvoiceCheckoutOrder,
    verifyInvoiceCheckoutPayment
} = require("../services/billing.service")

const createInvoiceHandler = async (req, res, next) => {
    try {
        const invoice = await createInvoice({
            tenantId: req.tenantId,
            userId: req.user._id,
            data: req.body
        })

        return res.status(201).json({
            message: "Invoice created successfully",
            invoice
        })
    } catch (error) {
        next(error)
    }
}

const listInvoicesHandler = async (req, res, next) => {
    try {
        const invoices = await listInvoices({
            tenantId: req.tenantId,
            user: req.user,
            page: req.query.page,
            limit: req.query.limit,
            search: req.query.search,
            status: req.query.status
        })

        return res.status(200).json({
            invoices
        })
    } catch (error) {
        next(error)
    }
}

const getInvoiceDetailHandler = async (req, res, next) => {
    try {
        const invoice = await getInvoiceDetail({
            tenantId: req.tenantId,
            invoiceId: req.params.invoiceId,
            user: req.user
        })

        return res.status(200).json({
            invoice
        })
    } catch (error) {
        next(error)
    }
}

const issueInvoiceHandler = async (req, res, next) => {
    try {
        const invoice = await issueInvoice({
            tenantId: req.tenantId,
            invoiceId: req.params.invoiceId,
            user: req.user
        })

        return res.status(200).json({
            message: "Invoice issued successfully",
            invoice
        })
    } catch (error) {
        next(error)
    }
}

const createInvoiceCheckoutOrderHandler = async (req, res, next) => {
    try {
        const checkout = await createInvoiceCheckoutOrder({
            tenantId: req.tenantId,
            invoiceId: req.params.invoiceId,
            user: req.user
        })

        return res.status(200).json({
            checkout
        })
    } catch (error) {
        next(error)
    }
}

const verifyInvoiceCheckoutPaymentHandler = async (req, res, next) => {
    try {
        const result = await verifyInvoiceCheckoutPayment({
            tenantId: req.tenantId,
            invoiceId: req.params.invoiceId,
            user: req.user,
            data: req.body
        })

        return res.status(200).json({
            message: "Payment verified successfully",
            payment: result.payment,
            invoice: result.invoice
        })
    } catch (error) {
        next(error)
    }
}

const createInvoicePaymentHandler = async (req, res, next) => {
    try {
        const result = await createInvoicePayment({
            tenantId: req.tenantId,
            invoiceId: req.params.invoiceId,
            user: req.user,
            data: req.body
        })

        return res.status(201).json({
            message: "Payment recorded successfully",
            payment: result.payment,
            invoice: result.invoice
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    createInvoiceHandler,
    createInvoiceCheckoutOrderHandler,
    listInvoicesHandler,
    getInvoiceDetailHandler,
    issueInvoiceHandler,
    verifyInvoiceCheckoutPaymentHandler,
    createInvoicePaymentHandler
}
