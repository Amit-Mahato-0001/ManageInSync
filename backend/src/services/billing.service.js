const mongoose = require("mongoose")
const User = require("../models/user.model")
const Contact = require("../models/contact.model")
const Invoice = require("../models/invoice.model")
const InvoiceItem = require("../models/invoiceItem.model")
const Payment = require("../models/payment.model")
const {
    capturePayment,
    createOrder,
    fetchPayment,
    getRazorpayPublicConfig,
    verifyPaymentSignature
} = require("../utils/razorpay")

const createHttpError = (message, status = 400) => {
    const error = new Error(message)
    error.status = status
    return error
}

const normalizeText = (value) =>
    typeof value === "string" ? value.trim() : ""

const roundMoney = (value) =>
    Math.round((Number(value) + Number.EPSILON) * 100) / 100

const toCurrencySubunits = (value) =>
    Math.round((Number(value) + Number.EPSILON) * 100)

const getTodayKey = () => {
    const now = new Date()
    const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)

    return localTime.toISOString().slice(0, 10)
}

const getResolvedId = (value) => {
    const resolved = value?._id || value

    return resolved?.toString?.() || ""
}

const ensureObjectId = (value, fieldName) => {
    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
        throw createHttpError(`Invalid ${fieldName}`)
    }
}

const getPayableStatus = (dueDate, amountDue) => {
    if (amountDue <= 0) {
        return "paid"
    }

    return dueDate < getTodayKey() ? "overdue" : "unpaid"
}

const sanitizeContactSnapshot = ({
    client,
    contactName,
    contactEmail,
    contactPhone,
    companyName,
    address
}) => {
    const name = normalizeText(contactName)
    const email = normalizeText(contactEmail).toLowerCase() || client.email

    return {
        name,
        email,
        phone: normalizeText(contactPhone) || undefined,
        companyName: normalizeText(companyName) || undefined,
        address: normalizeText(address) || undefined
    }
}

const sanitizeLineItems = (items = []) =>
    items.map((item) => {
        const quantity = Number(item.quantity)
        const unitPrice = Number(item.unitPrice)
        const taxRate = Number(item.taxRate)
        const lineTotal = roundMoney(quantity * unitPrice)
        const taxAmount = roundMoney((lineTotal * taxRate) / 100)

        return {
            itemName: normalizeText(item.itemName),
            quantity,
            unitPrice,
            taxRate,
            lineTotal,
            taxAmount
        }
    })

const calculateInvoiceTotals = (items = []) => {
    const subtotal = roundMoney(
        items.reduce((total, item) => total + item.lineTotal, 0)
    )
    const taxTotal = roundMoney(
        items.reduce((total, item) => total + item.taxAmount, 0)
    )
    const total = roundMoney(subtotal + taxTotal)

    return {
        subtotal,
        taxTotal,
        total,
        amountPaid: 0,
        amountDue: total
    }
}

const generateInvoiceNumber = async (tenantId) => {
    const datePart = getTodayKey().replace(/-/g, "")

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const suffix = `${Math.floor(Math.random() * 100000)}`.padStart(5, "0")
        const invoiceNumber = `INV-${datePart}-${suffix}`
        const existing = await Invoice.exists({
            tenantId,
            invoiceNumber
        })

        if (!existing) {
            return invoiceNumber
        }
    }

    return `INV-${datePart}-${Date.now().toString().slice(-6)}`
}

const ensureBillingClient = async ({ tenantId, clientUserId }) => {
    ensureObjectId(clientUserId, "clientUserId")

    const client = await User.findOne({
        _id: clientUserId,
        tenantId,
        role: "client",
        status: { $in: ["active", "invited"] }
    })
        .select("_id email role status")
        .lean()

    if (!client) {
        throw createHttpError("Client not found", 404)
    }

    return client
}

const syncInvoiceStatuses = async ({ tenantId, invoiceId }) => {
    const filter = { tenantId }

    if (invoiceId) {
        filter._id = invoiceId
    }

    const today = getTodayKey()

    await Promise.all([
        Invoice.updateMany(
            {
                ...filter,
                status: { $ne: "draft" },
                amountDue: { $lte: 0 }
            },
            {
                $set: { status: "paid" }
            }
        ),
        Invoice.updateMany(
            {
                ...filter,
                status: { $in: ["unpaid", "overdue", "paid"] },
                amountDue: { $gt: 0 },
                dueDate: { $lt: today }
            },
            {
                $set: { status: "overdue" }
            }
        ),
        Invoice.updateMany(
            {
                ...filter,
                status: { $in: ["overdue", "paid"] },
                amountDue: { $gt: 0 },
                dueDate: { $gte: today }
            },
            {
                $set: { status: "unpaid" }
            }
        )
    ])
}

const ensureInvoiceAccess = (invoice, user) => {
    if (!invoice) {
        throw createHttpError("Invoice not found", 404)
    }

    if (user?.role === "owner") {
        return
    }

    const invoiceClientId = getResolvedId(invoice.clientUserId)
    const currentUserId = getResolvedId(user)

    if (user?.role === "client" && invoiceClientId === currentUserId) {
        return
    }

    throw createHttpError("Access denied", 403)
}

const buildInvoiceReceipt = (invoice) => {
    const invoiceId = getResolvedId(invoice).slice(-10)
    const timestamp = Date.now().toString().slice(-8)

    return `inv_${invoiceId}_${timestamp}`.slice(0, 40)
}

const getRazorpayPendingPayment = ({ tenantId, invoiceId, orderId }) =>
    Payment.findOne({
        tenantId,
        invoiceId,
        transactionId: orderId,
        gateway: "razorpay",
        status: "pending"
    })

const getPaidRazorpayPayment = ({ tenantId, invoiceId, paymentId }) =>
    Payment.findOne({
        tenantId,
        invoiceId,
        transactionId: paymentId,
        gateway: /^razorpay/,
        status: "paid"
    })

const createInvoiceCheckoutOrder = async ({ tenantId, invoiceId, user }) => {
    ensureObjectId(tenantId, "tenantId")
    ensureObjectId(invoiceId, "invoiceId")

    await syncInvoiceStatuses({
        tenantId,
        invoiceId
    })

    const invoice = await Invoice.findOne({
        _id: invoiceId,
        tenantId
    }).populate("clientUserId", "email")

    ensureInvoiceAccess(invoice, user)

    if (invoice.status === "draft") {
        throw createHttpError("Draft invoices cannot be paid")
    }

    if (invoice.amountDue <= 0) {
        throw createHttpError("Invoice is already fully paid")
    }

    await Payment.updateMany(
        {
            tenantId,
            invoiceId,
            gateway: "razorpay",
            status: "pending"
        },
        {
            $set: {
                status: "failed",
                rawResponseJson: {
                    reason: "superseded_by_new_order"
                }
            }
        }
    )

    const amountInSubunits = toCurrencySubunits(invoice.amountDue)

    const order = await createOrder({
        amount: amountInSubunits,
        currency: "INR",
        receipt: buildInvoiceReceipt(invoice),
        notes: {
            invoiceId: getResolvedId(invoice),
            invoiceNumber: invoice.invoiceNumber
        }
    })

    await Payment.create({
        tenantId,
        invoiceId,
        userId: user._id,
        gateway: "razorpay",
        transactionId: order.id,
        amount: roundMoney(invoice.amountDue),
        status: "pending",
        rawResponseJson: {
            orderId: order.id,
            amount: order.amount,
            amountDue: order.amount_due,
            currency: order.currency,
            receipt: order.receipt,
            orderStatus: order.status
        }
    })

    const { keyId } = getRazorpayPublicConfig()

    return {
        keyId,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency || "INR",
        name: invoice.contactSnapshot?.companyName || "Agency Workspace",
        description: `Invoice ${invoice.invoiceNumber}`,
        prefill: {
            name: invoice.contactSnapshot?.name || "",
            email: invoice.contactSnapshot?.email || invoice.clientUserId?.email || ""
        },
        notes: {
            invoiceNumber: invoice.invoiceNumber
        },
        invoice: serializeInvoice(invoice)
    }
}

const verifyInvoiceCheckoutPayment = async ({
    tenantId,
    invoiceId,
    user,
    data
}) => {
    ensureObjectId(tenantId, "tenantId")
    ensureObjectId(invoiceId, "invoiceId")

    const razorpayOrderId = data.razorpay_order_id?.trim()
    const razorpayPaymentId = data.razorpay_payment_id?.trim()
    const razorpaySignature = data.razorpay_signature?.trim()

    const existingPayment = await getPaidRazorpayPayment({
        tenantId,
        invoiceId,
        paymentId: razorpayPaymentId
    })

    if (existingPayment) {
        return {
            payment: existingPayment.toObject(),
            invoice: await getInvoiceDetail({
                tenantId,
                invoiceId,
                user
            })
        }
    }

    const invoice = await Invoice.findOne({
        _id: invoiceId,
        tenantId
    }).populate("clientUserId", "email")

    ensureInvoiceAccess(invoice, user)

    const pendingPayment = await getRazorpayPendingPayment({
        tenantId,
        invoiceId,
        orderId: razorpayOrderId
    })

    if (!pendingPayment) {
        throw createHttpError("Payment session not found or expired", 400)
    }

    const isSignatureValid = verifyPaymentSignature({
        orderId: pendingPayment.transactionId,
        paymentId: razorpayPaymentId,
        razorpaySignature
    })

    if (!isSignatureValid) {
        pendingPayment.status = "failed"
        pendingPayment.rawResponseJson = {
            ...(pendingPayment.rawResponseJson || {}),
            verification: {
                status: "failed",
                reason: "invalid_signature"
            }
        }
        await pendingPayment.save()

        throw createHttpError("Payment signature verification failed", 400)
    }

    let paymentDetails = await fetchPayment(razorpayPaymentId)

    if (paymentDetails.order_id !== pendingPayment.transactionId) {
        throw createHttpError("Payment does not belong to the expected Razorpay order", 400)
    }

    if (paymentDetails.status === "authorized") {
        paymentDetails = await capturePayment({
            paymentId: razorpayPaymentId,
            amount: paymentDetails.amount,
            currency: paymentDetails.currency || "INR"
        })
    }

    if (paymentDetails.status !== "captured") {
        throw createHttpError("Payment was not captured by Razorpay", 400)
    }

    const paidAmount = roundMoney(paymentDetails.amount / 100)

    if (roundMoney(pendingPayment.amount) !== paidAmount) {
        throw createHttpError("Captured payment amount does not match invoice amount", 400)
    }

    if (paidAmount > roundMoney(invoice.amountDue)) {
        throw createHttpError("Payment amount exceeds the current invoice due", 409)
    }

    pendingPayment.transactionId = razorpayPaymentId
    pendingPayment.status = "paid"
    pendingPayment.paidAt = new Date()
    pendingPayment.gateway = paymentDetails.method
        ? `razorpay:${paymentDetails.method}`
        : "razorpay"
    pendingPayment.amount = paidAmount
    pendingPayment.rawResponseJson = {
        ...(pendingPayment.rawResponseJson || {}),
        verification: {
            status: "verified",
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
            signature: razorpaySignature
        },
        payment: paymentDetails
    }

    await pendingPayment.save()

    invoice.amountPaid = roundMoney(invoice.amountPaid + paidAmount)
    invoice.amountDue = roundMoney(Math.max(invoice.total - invoice.amountPaid, 0))
    invoice.status = getPayableStatus(invoice.dueDate, invoice.amountDue)
    await invoice.save()

    return {
        payment: pendingPayment.toObject(),
        invoice: await getInvoiceDetail({
            tenantId,
            invoiceId,
            user
        })
    }
}

const serializeInvoice = (invoice, { items, payments } = {}) => {
    const plainInvoice = invoice?.toObject ? invoice.toObject() : invoice
    const clientId = getResolvedId(plainInvoice?.clientUserId)
    const clientEmail =
        plainInvoice?.clientUserId?.email || plainInvoice?.contactSnapshot?.email

    return {
        ...plainInvoice,
        client: clientId
            ? {
                  _id: clientId,
                  email: clientEmail
              }
            : null,
        clientUserId: clientId || plainInvoice?.clientUserId,
        items: Array.isArray(items) ? items : undefined,
        payments: Array.isArray(payments) ? payments : undefined
    }
}

const createInvoice = async ({ tenantId, userId, data }) => {
    ensureObjectId(tenantId, "tenantId")
    ensureObjectId(userId, "userId")

    const client = await ensureBillingClient({
        tenantId,
        clientUserId: data.clientUserId
    })
    const contactSnapshot = sanitizeContactSnapshot({
        client,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        companyName: data.companyName,
        address: data.address
    })

    const contact = await Contact.findOneAndUpdate(
        {
            tenantId,
            clientUserId: client._id
        },
        {
            tenantId,
            ownerUserId: userId,
            clientUserId: client._id,
            ...contactSnapshot
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    )

    const lineItems = sanitizeLineItems(data.items)
    const totals = calculateInvoiceTotals(lineItems)
    const invoiceNumber = await generateInvoiceNumber(tenantId)

    const invoice = await Invoice.create({
        tenantId,
        userId,
        clientUserId: client._id,
        contactId: contact._id,
        invoiceNumber,
        reference: normalizeText(data.reference) || undefined,
        status: data.status || "draft",
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        amountPaid: totals.amountPaid,
        amountDue: totals.amountDue,
        notes: normalizeText(data.notes) || undefined,
        contactSnapshot
    })

    await InvoiceItem.insertMany(
        lineItems.map((item) => ({
            tenantId,
            invoiceId: invoice._id,
            ...item
        }))
    )

    await syncInvoiceStatuses({
        tenantId,
        invoiceId: invoice._id
    })

    return getInvoiceDetail({
        tenantId,
        invoiceId: invoice._id,
        user: {
            _id: userId,
            role: "owner"
        }
    })
}

const listInvoices = async ({ tenantId, user, page, limit, search, status }) => {
    ensureObjectId(tenantId, "tenantId")

    await syncInvoiceStatuses({ tenantId })

    const safePage = Math.max(1, Number(page) || 1)
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10))
    const skip = (safePage - 1) * safeLimit

    const query = {
        tenantId
    }

    if (user?.role === "client") {
        query.clientUserId = user._id
    }

    if (status) {
        query.status = status
    }

    const searchText = normalizeText(search)

    if (searchText) {
        query.$or = [
            { invoiceNumber: { $regex: searchText, $options: "i" } },
            { reference: { $regex: searchText, $options: "i" } },
            { "contactSnapshot.name": { $regex: searchText, $options: "i" } },
            { "contactSnapshot.email": { $regex: searchText, $options: "i" } },
            { "contactSnapshot.companyName": { $regex: searchText, $options: "i" } }
        ]
    }

    const [invoices, total] = await Promise.all([
        Invoice.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .populate("clientUserId", "email")
            .lean(),
        Invoice.countDocuments(query)
    ])

    return {
        data: invoices.map((invoice) => serializeInvoice(invoice)),
        pagination: {
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.max(1, Math.ceil(total / safeLimit))
        }
    }
}

const getInvoiceDetail = async ({ tenantId, invoiceId, user }) => {
    ensureObjectId(tenantId, "tenantId")
    ensureObjectId(invoiceId, "invoiceId")

    await syncInvoiceStatuses({
        tenantId,
        invoiceId
    })

    const invoice = await Invoice.findOne({
        _id: invoiceId,
        tenantId
    }).populate("clientUserId", "email")

    ensureInvoiceAccess(invoice, user)

    const [items, payments] = await Promise.all([
        InvoiceItem.find({
            tenantId,
            invoiceId
        })
            .sort({ createdAt: 1 })
            .lean(),
        Payment.find({
            tenantId,
            invoiceId
        })
            .sort({ paidAt: -1, createdAt: -1 })
            .lean()
    ])

    return serializeInvoice(invoice, { items, payments })
}

const issueInvoice = async ({ tenantId, invoiceId, user }) => {
    ensureObjectId(tenantId, "tenantId")
    ensureObjectId(invoiceId, "invoiceId")

    const invoice = await Invoice.findOne({
        _id: invoiceId,
        tenantId
    })

    ensureInvoiceAccess(invoice, user)

    if (invoice.status !== "draft") {
        throw createHttpError("Only draft invoices can be issued")
    }

    invoice.status = getPayableStatus(invoice.dueDate, invoice.amountDue)
    await invoice.save()

    return getInvoiceDetail({
        tenantId,
        invoiceId,
        user
    })
}

const createInvoicePayment = async ({ tenantId, invoiceId, user, data }) => {
    ensureObjectId(tenantId, "tenantId")
    ensureObjectId(invoiceId, "invoiceId")

    await syncInvoiceStatuses({
        tenantId,
        invoiceId
    })

    const invoice = await Invoice.findOne({
        _id: invoiceId,
        tenantId
    }).populate("clientUserId", "email")

    ensureInvoiceAccess(invoice, user)

    if (invoice.status === "draft") {
        throw createHttpError("Draft invoices cannot be paid")
    }

    if (invoice.amountDue <= 0) {
        throw createHttpError("Invoice is already fully paid")
    }

    const amount = roundMoney(
        data.amount !== undefined ? Number(data.amount) : invoice.amountDue
    )

    if (amount <= 0) {
        throw createHttpError("Payment amount must be greater than 0")
    }

    if (amount > invoice.amountDue) {
        throw createHttpError("Payment amount cannot exceed amount due")
    }

    const gateway =
        normalizeText(data.gateway) ||
        (user.role === "client" ? "demo-checkout" : "manual")

    const payment = await Payment.create({
        tenantId,
        invoiceId,
        userId: user._id,
        gateway,
        transactionId: `PAY-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        amount,
        status: "paid",
        paidAt: new Date(),
        rawResponseJson: {
            actorRole: user.role,
            invoiceNumber: invoice.invoiceNumber,
            amount
        }
    })

    invoice.amountPaid = roundMoney(invoice.amountPaid + amount)
    invoice.amountDue = roundMoney(Math.max(invoice.total - invoice.amountPaid, 0))
    invoice.status = getPayableStatus(invoice.dueDate, invoice.amountDue)
    await invoice.save()

    return {
        payment: payment.toObject(),
        invoice: await getInvoiceDetail({
            tenantId,
            invoiceId,
            user
        })
    }
}

module.exports = {
    createInvoice,
    createInvoiceCheckoutOrder,
    listInvoices,
    getInvoiceDetail,
    issueInvoice,
    createInvoicePayment,
    verifyInvoiceCheckoutPayment
}
