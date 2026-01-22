const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false
    },
    role: {
        type: String,
        enum: ["owner", "admin", "member", "client"],
        default: "member"
    },
    tenantId: { //user kis tenant ka he
        type: mongoose.Schema.Types.ObjectId, //us company ka unique mongodb id
        ref: "Tenant", //har user kisi company se linked ho compulsory
        required: true,
        index: true
    },
    status:{
        type: String,
        enum: ["active", "invalid"],
        default: "active"
    }

}, {timestamps: true}

)

/**
 * same email allowed in different tenants,
 * but not twice in same tenant
 */

userSchema.index(
    {email: 1, tenantId: 1},
    {unique: true}
)

module.exports = mongoose.model("User", userSchema)