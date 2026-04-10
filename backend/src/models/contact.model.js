const mongoose = require("mongoose")

const emailRegex = /^\S+@\S+\.\S+$/

const contactSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },
        ownerUserId: {
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
    },
    {
        timestamps: true
    }
)

contactSchema.index(
    { tenantId: 1, clientUserId: 1 },
    { unique: true }
)

module.exports = mongoose.model("Contact", contactSchema)
