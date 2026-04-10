const mongoose = require("mongoose")

const emailRegex = /^\S+@\S+\.\S+$/

const invoiceSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        clientUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        contactId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contact",
            required: true,
            index: true
        },
        invoiceNumber: {
            type: String,
            required: true,
            trim: true
        },
        reference: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: ["draft", "unpaid", "paid", "overdue"],
            default: "draft",
            index: true
        },
        issueDate: {
            type: String,
            required: true
        },
        dueDate: {
            type: String,
            required: true,
            index: true
        },
        subtotal: {
            type: Number,
            required: true,
            default: 0
        },
        taxTotal: {
            type: Number,
            required: true,
            default: 0
        },
        total: {
            type: Number,
            required: true,
            default: 0
        },
        amountPaid: {
            type: Number,
            required: true,
            default: 0
        },
        amountDue: {
            type: Number,
            required: true,
            default: 0
        },
        notes: {
            type: String,
            trim: true
        },
        contactSnapshot: {
            name: {
                type: String,
                required: true,
                trim: true
            },
            email: {
                type: String,
                required: true,
                lowercase: true,
                trim: true,
                match: [emailRegex, "Invalid email"]
            },
            phone: {
                type: String,
                trim: true
            },
            companyName: {
                type: String,
                trim: true
            },
            address: {
                type: String,
                trim: true
            }
        }
    },
    {
        timestamps: true
    }
)

invoiceSchema.index(
    { tenantId: 1, invoiceNumber: 1 },
    { unique: true }
)

invoiceSchema.index({ tenantId: 1, clientUserId: 1, status: 1 })
invoiceSchema.index({ tenantId: 1, contactId: 1 })

module.exports = mongoose.model("Invoice", invoiceSchema)
