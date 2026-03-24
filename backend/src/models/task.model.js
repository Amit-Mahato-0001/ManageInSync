const mongoose = require("mongoose")

const taskSchema = new mongoose.Schema(

    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        assigneeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: ["todo", "in-progress", "done"],
            default: "todo"
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },

        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        deletedAt: {
            type: Date,
            default: null
        }

    },

    {timestamps: true}

)

taskSchema.index({ tenantId: 1, projectId: 1, deletedAt: 1 })
taskSchema.index({ tenantId: 1, assigneeId: 1, status: 1, deletedAt: 1 })

module.exports = mongoose.model("Task", taskSchema)
