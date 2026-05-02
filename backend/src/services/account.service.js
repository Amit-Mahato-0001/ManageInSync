const Session = require("../models/session.model")
const Tenant = require("../models/tenant.model")
const User = require("../models/user.model")
const { serializeAuthUser } = require("../utils/authUser")
const createHttpError = require("../utils/httpError")

const sanitizeOptionalString = (value = "") => {
    if (typeof value !== "string") {
        return undefined
    }

    const trimmedValue = value.trim()

    return trimmedValue || undefined
}

const getProfile = async ({ userId }) => {
    const user = await User.findById(userId)
        .select("email name logoUrl role status tenantId")
        .lean()

    if (!user) {
        throw createHttpError("User not found", 404, "user_not_found")
    }

    return serializeAuthUser(user)
}

const serializeAccountTenant = (tenant) => {
    if (!tenant) {
        return null
    }

    return {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug || null,
        logoUrl: tenant.logoUrl || null,
        plan: tenant.plan
    }
}

const buildTenantNameLookup = ({ name, tenantId }) => ({
    _id: { $ne: tenantId },
    name: {
        $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i"
    }
})

const canManageWorkspaceProfile = (role) => ["owner", "admin"].includes(role)

const updateProfile = async ({ userId, tenantId, role, name, logoUrl }) => {
    const user = await User.findById(userId)

    if (!user) {
        throw createHttpError("User not found", 404, "user_not_found")
    }

    let tenant = null

    if (canManageWorkspaceProfile(role)) {
        tenant = await Tenant.findById(tenantId)

        if (!tenant) {
            throw createHttpError("Workspace not found", 404, "tenant_not_found")
        }

        if (name !== undefined) {
            const safeName = sanitizeOptionalString(name)

            if (!safeName) {
                throw createHttpError("Workspace name is required", 400, "tenant_name_required")
            }

            const existingTenant = await Tenant.exists(
                buildTenantNameLookup({
                    name: safeName,
                    tenantId: tenant._id
                })
            )

            if (existingTenant) {
                throw createHttpError("Workspace name already exists", 409, "tenant_exists")
            }

            tenant.name = safeName
        }

        if (logoUrl !== undefined) {
            tenant.logoUrl = sanitizeOptionalString(logoUrl)
        }

        await tenant.save()

        return {
            user: serializeAuthUser(user),
            tenant: serializeAccountTenant(tenant)
        }
    }

    if (name !== undefined) {
        user.name = sanitizeOptionalString(name)
    }

    if (logoUrl !== undefined) {
        user.logoUrl = sanitizeOptionalString(logoUrl)
    }

    await user.save()

    return {
        user: serializeAuthUser(user),
        tenant: null
    }
}

const listActiveSessions = async ({ userId, currentSessionId }) => {
    const sessions = await Session.find({
        userId,
        revokedAt: null,
        expiresAt: {
            $gt: new Date()
        }
    })
        .select("createdByIp lastUsedIp userAgent createdAt expiresAt lastUsedAt")
        .sort({
            lastUsedAt: -1,
            createdAt: -1
        })
        .lean()

    const currentSessionKey = currentSessionId?.toString() || ""

    return sessions.map((session) => ({
        id: session._id,
        ipAddress: session.lastUsedIp || session.createdByIp || "",
        locationLabel: null,
        userAgent: session.userAgent || "",
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        lastUsedAt: session.lastUsedAt || session.createdAt,
        isCurrent: session._id.toString() === currentSessionKey
    }))
}

module.exports = {
    getProfile,
    listActiveSessions,
    updateProfile
}
