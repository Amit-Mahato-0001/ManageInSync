const mongoose = require("mongoose")

const conversationSchema = new mongoose.Schema(

    {
        tenantId: {
            
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },

        projectId: {

            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true
        },

        createdBy: {

            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        lastMessageAt: {

            type: Date,
            default: Date.now
        },

        deletedAt: {

            type: Date,
            default: null
        }

    }, {timestamps: true}
)

conversationSchema.index({ tenantId: 1, projectId: 1, deletedAt: 1 })
conversationSchema.index({ projectId: 1, lastMessageAt: -1 })

conversationSchema.index(
    { tenantId: 1, projectId: 1 },
    { unique: true, partialFilterExpression: { deletedAt: null } }
)

module.exports = mongoose.model("Conversation", conversationSchema)
