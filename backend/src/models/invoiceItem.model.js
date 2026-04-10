const mongoose = require("mongoose")

const invoiceItemSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
            index: true
        },
        itemName: {
            type: String,
            required: true,
            trim: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        taxRate: {
            type: Number,
            required: true,
            min: 0
        },
        lineTotal: {
            type: Number,
            required: true,
            min: 0
        },
        taxAmount: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("InvoiceItem", invoiceItemSchema)
