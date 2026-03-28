const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema(

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

        conversationId: {

            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true
        },

        senderId: {

            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true

        },

        text: {

            type: String,
            required: true,
            trim: true,
            maxlength: 2000

        },

        editedAt: {

            type: Date,
            default: null

        },

        deletedAt: {

            type: Date,
            default: null

        },

        readBy: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true
                },
                seenAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    { timestamps: true }
)

messageSchema.index({ tenantId: 1, conversationId: 1, createdAt: -1 })
messageSchema.index({ tenantId: 1, projectId: 1, createdAt: -1 })

module.exports = mongoose.model("Message", messageSchema)
