const crypto = require('crypto')
const User = require('../models/user.model')
const Tenant = require("../models/tenant.model")
const { sendInviteEmail } = require('../utils/email')
const { normalizeWorkspaceInput } = require("../utils/workspace")
const createHttpError = require("../utils/httpError")

const normalizeEmail = (value = "") =>
    typeof value === "string" ? value.trim().toLowerCase() : ""

const inviteUser = async ({email, tenantId, role, invitedByRole}) => {
    const safeEmail = normalizeEmail(email)

    if(!tenantId || !role || !invitedByRole || !safeEmail){

        throw createHttpError("tenantId and role and inviter role required", 400, "invalid_invite_request")
    }

    const allowedRoles = ["client", "member", "admin"]

    if(!allowedRoles.includes(role)){
        throw createHttpError("Invalid role", 400, "invalid_role")
    }

    const invitePermissions = {

        owner: ["client", "member", "admin"],
        admin: ["client", "member"]
    }

    const canInvite = invitePermissions[invitedByRole] || [] //inviter's role permissions get 

    if(!canInvite.includes(role)){

        throw createHttpError("You are not allowed to invite this role", 403, "invite_forbidden")
    }

    const inviteToken = crypto.randomBytes(32).toString("hex")
    const inviteTokenExpires = Date.now() + 24 * 60 * 60 * 1000 //24hrs
    const tenant = await Tenant.findById(tenantId).select("name slug")

    if (!tenant) {
        throw createHttpError("Tenant not found", 404, "tenant_not_found")
    }

    let user = await User.findOne({ email: safeEmail, tenantId})

    if(user){
        if (user.status === "invited") {
            if (user.role !== role) {
                throw createHttpError(
                    `This email already has a pending ${user.role} invite`,
                    400,
                    "invite_already_pending"
                )
            }

            user.inviteToken = inviteToken
            user.inviteTokenExpires = inviteTokenExpires
            await user.save()

            await sendInviteEmail({
                to: safeEmail,
                inviteToken,
                workspace: tenant.slug || normalizeWorkspaceInput(tenant.name)
            })

            return {
                _id: user._id,
                email: user.email,
                role: user.role,
                resent: true
            }
        }

        throw createHttpError(
            "This email is already added to the workspace",
            400,
            "user_already_exists"
        )
    }

    user = await User.create({
        email: safeEmail,
        tenantId,
        role,
        status: "invited",
        inviteToken,
        inviteTokenExpires
    })

    await sendInviteEmail({
        to: safeEmail,
        inviteToken,
        workspace: tenant.slug || normalizeWorkspaceInput(tenant.name)
    })

    return{

        _id: user._id,
        email: user.email,
        role: user.role
    }
}

module.exports = { inviteUser }
