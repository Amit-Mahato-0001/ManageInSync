const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({

    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true
    },

    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    action: {
        type: String,
        required: true
    },

    meta: {
        type: Object
    }

}, { timestamps: true} )

auditLogSchema.index({ tenantId: 1, createdAt: -1 })
auditLogSchema.index({ tenantId: 1, action: 1, createdAt: -1 })

module.exports = mongoose.model("AuditLog", auditLogSchema)
