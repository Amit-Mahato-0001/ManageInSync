const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")

const createTenant = require("../services/tenant.service")
const createUser = require("../services/user.service")
const User = require("../models/user.model")
const Session = require("../models/session.model")
const createHttpError = require("../utils/httpError")
const { serializeAuthUser } = require("../utils/authUser")
const {
    generateRefreshToken,
    getAccessTokenSecret,
    getAccessTokenTtl,
    getClientIp,
    getRefreshExpiryDate,
    getUserAgent,
    hashToken
} = require("../utils/auth")

const makeAccessToken = ({ user, sessionId }) =>
    jwt.sign(
        {
            sub: user._id.toString(),
            userId: user._id,
            tenantId: user.tenantId,
            role: user.role,
            sid: sessionId.toString()
        },
        getAccessTokenSecret(),
        { expiresIn: getAccessTokenTtl() }
    )

const buildAuthResponse = ({ user, session, refreshToken }) => ({
    accessToken: makeAccessToken({ user, sessionId: session._id }),
    refreshToken,
    user: serializeAuthUser(user)
})

const createSessionRecord = async ({ user, req, rotatedFromSessionId }) => {
    const refreshToken = generateRefreshToken()

    const session = await Session.create({
        userId: user._id,
        tenantId: user.tenantId,
        refreshTokenHash: hashToken(refreshToken),
        expiresAt: getRefreshExpiryDate(),
        lastUsedAt: new Date(),
        createdByIp: getClientIp(req),
        lastUsedIp: getClientIp(req),
        userAgent: getUserAgent(req),
        rotatedFromSessionId
    })

    return { session, refreshToken }
}

const revokeSessionById = async (sessionId, reason) => {
    if (!sessionId) {
        return null
    }

    return Session.findOneAndUpdate(
        {
            _id: sessionId,
            revokedAt: null
        },
        {
            $set: {
                revokedAt: new Date(),
                revokeReason: reason
            }
        },
        {
            new: true
        }
    )
}

const revokeAllUserSessions = async ({ userId, reason }) => {
    if (!userId) {
        return
    }

    await Session.updateMany(
        {
            userId,
            revokedAt: null
        },
        {
            $set: {
                revokedAt: new Date(),
                revokeReason: reason
            }
        }
    )
}

const signup = async ({ agencyName, email, password, req }) => {
    const existingUser = await User.findOne({ email })

    if (existingUser) {
        throw createHttpError("Email already registered", 409, "email_already_registered")
    }

    const transactionSession = await mongoose.startSession()
    let user

    try {
        await transactionSession.withTransaction(async () => {
            const tenant = await createTenant(
                { name: agencyName },
                { session: transactionSession }
            )

            user = await createUser(
                {
                    email,
                    password,
                    tenantId: tenant._id,
                    role: "owner"
                },
                { session: transactionSession }
            )
        })
    } finally {
        await transactionSession.endSession()
    }

    if (!user) {
        throw createHttpError("Signup failed", 500, "signup_failed")
    }

    const { session, refreshToken } = await createSessionRecord({ user, req })

    return buildAuthResponse({ user, session, refreshToken })
}

const login = async ({ email, password, req }) => {
    const user = await User.findOne({ email }).select("+password")

    if (!user) {
        throw createHttpError("Invalid credentials", 401, "invalid_credentials")
    }

    if (user.status === "disabled") {
        throw createHttpError("Account disabled. Contact agency.", 401, "account_disabled")
    }

    if (user.status === "invalid") {
        throw createHttpError("Account is not active", 401, "auth_required")
    }

    if (!user.password) {
        throw createHttpError("Please accept invite and set password first", 400, "password_not_set")
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw createHttpError("Invalid credentials", 401, "invalid_credentials")
    }

    if (user.status === "invited" && user.role === "member") {
        user.status = "active"
        await user.save()
    }

    if (user.status !== "active") {
        throw createHttpError("Account is not active", 401, "auth_required")
    }

    const { session, refreshToken } = await createSessionRecord({ user, req })

    return buildAuthResponse({ user, session, refreshToken })
}

const refreshSession = async ({ refreshToken, req }) => {
    if (!refreshToken) {
        throw createHttpError("Refresh token missing", 401, "refresh_token_invalid")
    }

    const session = await Session.findOne({
        refreshTokenHash: hashToken(refreshToken)
    })

    if (!session) {
        throw createHttpError("Invalid refresh token", 401, "refresh_token_invalid")
    }

    if (session.revokedAt) {
        if (session.revokeReason === "rotated") {
            await Session.findByIdAndUpdate(session._id, {
                $set: {
                    compromisedAt: new Date()
                }
            })

            await revokeAllUserSessions({
                userId: session.userId,
                reason: "refresh_token_reused"
            })

            throw createHttpError("Refresh token reuse detected", 401, "refresh_token_reused")
        }

        throw createHttpError("Session revoked", 401, "session_revoked")
    }

    if (session.expiresAt.getTime() <= Date.now()) {
        await revokeSessionById(session._id, "expired")
        throw createHttpError("Refresh token expired", 401, "refresh_token_invalid")
    }

    const user = await User.findById(session.userId)

    if (!user) {
        await revokeSessionById(session._id, "user_missing")
        throw createHttpError("User not found", 401, "auth_required")
    }

    if (user.status !== "active") {
        await revokeAllUserSessions({
            userId: user._id,
            reason: user.status === "disabled" ? "account_disabled" : "user_inactive"
        })

        throw createHttpError(
            user.status === "disabled"
                ? "Account disabled. Contact agency."
                : "Account is not active",
            401,
            user.status === "disabled" ? "account_disabled" : "auth_required"
        )
    }

    if (session.tenantId.toString() !== user.tenantId.toString()) {
        await revokeAllUserSessions({
            userId: user._id,
            reason: "tenant_mismatch"
        })

        throw createHttpError("Session revoked", 401, "session_revoked")
    }

    const { session: nextSession, refreshToken: nextRefreshToken } =
        await createSessionRecord({
            user,
            req,
            rotatedFromSessionId: session._id
        })

    session.revokedAt = new Date()
    session.revokeReason = "rotated"
    session.replacedBySessionId = nextSession._id
    session.lastUsedAt = new Date()
    session.lastUsedIp = getClientIp(req)
    session.userAgent = getUserAgent(req)

    await session.save()

    return buildAuthResponse({
        user,
        session: nextSession,
        refreshToken: nextRefreshToken
    })
}

const logout = async ({ refreshToken }) => {
    if (!refreshToken) {
        return { success: true }
    }

    const session = await Session.findOne({
        refreshTokenHash: hashToken(refreshToken)
    })

    if (!session || session.revokedAt) {
        return { success: true }
    }

    await revokeSessionById(session._id, "logout")

    return { success: true }
}

const logoutAll = async ({ userId }) => {
    await revokeAllUserSessions({
        userId,
        reason: "logout_all"
    })

    return { success: true }
}

const acceptInvite = async ({ token, password }) => {
    const inviteToken = token?.trim()

    const user = await User.findOne({
        inviteToken
    })

    if (!user) {
        throw createHttpError("Invalid or expired invite", 400, "invite_invalid")
    }

    if (!user.inviteTokenExpires || user.inviteTokenExpires.getTime() < Date.now()) {
        throw createHttpError("Invite expired", 400, "invite_expired")
    }

    if (user.status !== "invited") {
        throw createHttpError("Invite already used", 400, "invite_already_used")
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    user.password = hashedPassword

    if (user.role !== "member") {
        user.status = "active"
    }

    user.inviteToken = undefined
    user.inviteTokenExpires = undefined

    await user.save()

    return {
        message:
            user.role === "member"
                ? "Password set. Login to activate account"
                : "Password set successfully. You can login now",
        user: serializeAuthUser(user)
    }
}

module.exports = {
    acceptInvite,
    login,
    logout,
    logoutAll,
    refreshSession,
    revokeAllUserSessions,
    signup
}
