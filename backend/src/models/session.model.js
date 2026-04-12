const mongoose = require("mongoose")

const sessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },
        refreshTokenHash: {
            type: String,
            required: true,
            unique: true
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true
        },
        lastUsedAt: {
            type: Date
        },
        revokedAt: {
            type: Date,
            index: true
        },
        revokeReason: {
            type: String
        },
        createdByIp: {
            type: String
        },
        lastUsedIp: {
            type: String
        },
        userAgent: {
            type: String
        },
        replacedBySessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session"
        },
        rotatedFromSessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session"
        },
        compromisedAt: {
            type: Date
        }
    },
    { timestamps: true }
)

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
sessionSchema.index({ userId: 1, revokedAt: 1 })
sessionSchema.index({ tenantId: 1 })

module.exports = mongoose.model("Session", sessionSchema)
