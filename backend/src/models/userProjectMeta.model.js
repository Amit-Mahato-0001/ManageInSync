const mongoose = require("mongoose");

const userProjectMetaSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },
        unreadCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        lastReadAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

userProjectMetaSchema.index({ userId: 1, projectId: 1 }, { unique: true });

module.exports = mongoose.model("UserProjectMeta", userProjectMetaSchema);