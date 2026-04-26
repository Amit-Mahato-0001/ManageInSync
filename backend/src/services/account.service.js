const Session = require("../models/session.model")
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

    if (!user) {
        throw createHttpError("User not found", 404, "user_not_found")
    }

    return serializeAuthUser(user)
}

const updateProfile = async ({ userId, name, logoUrl }) => {
    const user = await User.findById(userId)

    if (!user) {
        throw createHttpError("User not found", 404, "user_not_found")
    }

    if (name !== undefined) {
        user.name = sanitizeOptionalString(name)
    }

    if (logoUrl !== undefined) {
        user.logoUrl = sanitizeOptionalString(logoUrl)
    }

    await user.save()

    return serializeAuthUser(user)
}

const listActiveSessions = async ({ userId, currentSessionId }) => {
    const sessions = await Session.find({
        userId,
        revokedAt: null,
        expiresAt: {
            $gt: new Date()
        }
    }).sort({
        lastUsedAt: -1,
        createdAt: -1
    })

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
