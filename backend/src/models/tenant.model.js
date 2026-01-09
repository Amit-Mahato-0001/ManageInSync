const mongoose = require('mongoose')

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    plan: {
        type: String,
        enum: ["free", "pro"],
        default: "free"
    },
    features: {
        maxUsers: {type: Number, default: 5},
        maxProjects: {type: Number, default: 10},
        auditLogs: {type: Boolean, default: false}
    }
})

module.exports = mongoose.model("Tenant", tenantSchema)