const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema(
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
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        gateway: {
            type: String,
            required: true,
            trim: true
        },
        transactionId: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        status: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "paid"
        },
        paidAt: {
            type: Date
        },
        rawResponseJson: {
            type: mongoose.Schema.Types.Mixed
        }
    },
    {
        timestamps: true
    }
)

paymentSchema.index({ tenantId: 1, invoiceId: 1, createdAt: -1 })

module.exports = mongoose.model("Payment", paymentSchema)
