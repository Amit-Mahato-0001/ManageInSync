const crypto = require('crypto')
const User = require('../models/user.model')
const { sendInviteEmail } = require('../utils/email')

const inviteUser = async ({email, tenantId, role, invitedByRole}) => {

    if(!tenantId || !role || !invitedByRole){

        throw new Error("tenantId and role and inviter role required")
    }

    const allowedRoles = ["client", "member", "admin"]

    if(!allowedRoles.includes(role)){
        throw new Error("Invalid role")
    }

    const invitePermissions = {

        owner: ["client", "member", "admin"],
        admin: ["client", "member"]
    }

    const canInvite = invitePermissions[invitedByRole] || [] //inviter's role permissions get 

    if(!canInvite.includes(role)){

        throw new Error("You are not allowed to invite this role")
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
            role,
            status: "invited",
            inviteToken,
            inviteTokenExpires
        })

    } else{

        user.role = role
        user.inviteToken = inviteToken
        user.inviteTokenExpires = inviteTokenExpires
        user.status = "invited"

        await user.save()

    }

    await sendInviteEmail({
        to: email,
        inviteToken
    })

    return{

        email: user.email,
        role: user.role
    }
}

module.exports = { inviteUser }