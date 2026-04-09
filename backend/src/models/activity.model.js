const mongoose = require("mongoose")

const userSnapshotSchema = new mongoose.Schema(
    {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        email: {
            type: String,
            trim: true
        },
        role: {
            type: String,
            enum: ["owner", "admin", "member", "client"]
        }
    },
    { _id: false }
)

const projectSnapshotSchema = new mongoose.Schema(
    {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project"
        },
        name: {
            type: String,
            trim: true
        }
    },
    { _id: false }
)

const taskSnapshotSchema = new mongoose.Schema(
    {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task"
        },
        title: {
            type: String,
            trim: true
        }
    },
    { _id: false }
)

const activitySchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },
        type: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        category: {
            type: String,
            required: true,
            enum: ["project", "task", "team", "client"],
            index: true
        },
        summary: {
            type: String,
            required: true,
            trim: true
        },
        actor: {
            type: userSnapshotSchema,
            required: true
        },
        project: {
            type: projectSnapshotSchema,
            default: undefined
        },
        task: {
            type: taskSnapshotSchema,
            default: undefined
        },
        targetUser: {
            type: userSnapshotSchema,
            default: undefined
        },
        visibility: [
            {
                type: String,
                enum: ["owner", "admin", "member", "client"]
            }
        ],
        memberIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        meta: {
            type: mongoose.Schema.Types.Mixed
        }
    },
    { timestamps: true }
)

activitySchema.index({ tenantId: 1, createdAt: -1 })
activitySchema.index({ tenantId: 1, category: 1, createdAt: -1 })
activitySchema.index({ tenantId: 1, memberIds: 1, createdAt: -1 })

module.exports = mongoose.model("Activity", activitySchema)
