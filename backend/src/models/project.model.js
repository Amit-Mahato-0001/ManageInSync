
const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        trim: true
    },

    targetDate: {
        type: String,
        trim: true
    },

    status: {
        type: String,
        enum: ["active", "completed", "on-hold"],
        default: "active"
    },

    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true
    },

    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    clients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    deletedAt: {
        type: Date,
        default: null
    }
}, 
{
    timestamps: true
}

)

projectSchema.index({ tenantId: 1, deletedAt: 1, createdAt: -1 })
projectSchema.index({ tenantId: 1, deletedAt: 1, status: 1, createdAt: -1 })
projectSchema.index({ tenantId: 1, deletedAt: 1, clients: 1, createdAt: -1 })
projectSchema.index({ tenantId: 1, deletedAt: 1, members: 1, createdAt: -1 })
projectSchema.index({ tenantId: 1, deletedAt: 1, clients: 1, status: 1, createdAt: -1 })
projectSchema.index({ tenantId: 1, deletedAt: 1, members: 1, status: 1, createdAt: -1 })

module.exports = mongoose.model("Project", projectSchema)
