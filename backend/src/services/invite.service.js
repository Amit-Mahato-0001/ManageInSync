const crypto = require('crypto')
const User = require('../models/user.model')

const inviteClient = async ({email, tenantId}) => {

    if(!email || !tenantId){

        throw new Error("Email and tenantId required")
    }

    const inviteToken = crypto.randomBytes(32).toString("hex")
    const inviteTokenExpires = Date.now() + 24 * 60 * 60 * 1000 //24hrs

    let user = await User.findOne({ email, tenantId})

    if(user && user.status === "active"){

        throw new Error("Client already exists")
    }

    if(!user){

        user = await User.create({
            email,
            tenantId,
            role: "client",
            status: "invited",
            inviteToken,
            inviteTokenExpires
        })

    } else{

        user.inviteToken = inviteToken
        user.inviteTokenExpires = inviteTokenExpires
        await user.save()

    }

    return{

        email: user.email,
        inviteToken
    }
}

module.exports = { inviteClient }