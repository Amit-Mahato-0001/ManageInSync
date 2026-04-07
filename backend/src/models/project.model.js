
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

module.exports = mongoose.model("Project", projectSchema)
