const mongoose = require("mongoose")

const projectFileSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true
        },

        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },

        uploadedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        originalFileName: {
            type: String,
            required: true,
            trim: true
        },

        storedObjectKey: {
            type: String,
            required: true,
            unique: true
        },

        bucket: {
            type: String,
            required: true
        },

        mimeType: {
            type: String,
            required: true,
            trim: true
        },

        fileSize: {
            type: Number,
            required: true,
            min: 1
        },

        status: {
            type: String,
            enum: ["pending", "uploaded", "failed", "deleted"],
            default: "pending",
            index: true
        },

        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
)

projectFileSchema.index({ tenantId: 1, projectId: 1, deletedAt: 1, createdAt: -1 })
projectFileSchema.index({ tenantId: 1, projectId: 1, status: 1, createdAt: -1 })

module.exports = mongoose.model("ProjectFile", projectFileSchema)
