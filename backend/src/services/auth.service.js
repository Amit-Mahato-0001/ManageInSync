const crypto = require("crypto")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")

const createTenant = require("../services/tenant.service")
const createUser = require("../services/user.service")
const Tenant = require("../models/tenant.model")
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
const { sendPasswordResetEmail } = require("../utils/email")
const { buildWorkspaceLookupQuery } = require("../utils/workspace")

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000

const normalizeEmail = (value = "") =>
    typeof value === "string" ? value.trim().toLowerCase() : ""

const serializeTenant = (tenant) => {
    if (!tenant) {
        return null
    }

    return {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug || null,
        plan: tenant.plan
    }
}

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

const buildAuthResponse = ({ user, session, refreshToken, tenant }) => ({
    accessToken: makeAccessToken({ user, sessionId: session._id }),
    refreshToken,
    user: serializeAuthUser(user),
    tenant: serializeTenant(tenant)
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

const findTenantByWorkspace = async (workspace) => {
    const query = buildWorkspaceLookupQuery(workspace)

    if (!query) {
        return null
    }

    return Tenant.findOne(query).select("_id name slug plan")
}

const getTenantById = async (tenantId) =>
    Tenant.findById(tenantId).select("_id name slug plan")

const createPasswordResetToken = () =>
    crypto.randomBytes(32).toString("hex")

const getPasswordResetExpiryDate = () =>
    new Date(Date.now() + PASSWORD_RESET_TTL_MS)

const signup = async ({ agencyName, email, password, req }) => {
    const safeEmail = normalizeEmail(email)
    const transactionSession = await mongoose.startSession()
    let user
    let tenant

    try {
        await transactionSession.withTransaction(async () => {
            tenant = await createTenant(
                { name: agencyName },
                { session: transactionSession }
            )

            user = await createUser(
                {
                    email: safeEmail,
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

    if (!user || !tenant) {
        throw createHttpError("Signup failed", 500, "signup_failed")
    }

    const { session, refreshToken } = await createSessionRecord({ user, req })

    return buildAuthResponse({ user, session, refreshToken, tenant })
}

const login = async ({ workspace, email, password, req }) => {
    const safeEmail = normalizeEmail(email)
    const tenant = await findTenantByWorkspace(workspace)

    if (!tenant) {
        throw createHttpError("Invalid credentials", 401, "invalid_credentials")
    }

    const user = await User.findOne({
        email: safeEmail,
        tenantId: tenant._id
    }).select("+password")

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

    return buildAuthResponse({ user, session, refreshToken, tenant })
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

    const tenant = await getTenantById(user.tenantId)

    return buildAuthResponse({
        user,
        session: nextSession,
        refreshToken: nextRefreshToken,
        tenant
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

const requestPasswordReset = async ({ workspace, email }) => {
    const safeEmail = normalizeEmail(email)
    const tenant = await findTenantByWorkspace(workspace)

    if (!tenant) {
        return { success: true }
    }

    const user = await User.findOne({
        email: safeEmail,
        tenantId: tenant._id,
        status: { $ne: "disabled" }
    }).select("+password")

    if (!user || !user.password) {
        return { success: true }
    }

    const resetToken = createPasswordResetToken()

    user.passwordResetTokenHash = hashToken(resetToken)
    user.passwordResetTokenExpiresAt = getPasswordResetExpiryDate()
    await user.save()

    await sendPasswordResetEmail({
        to: user.email,
        resetToken,
        workspace: tenant.slug || tenant.name
    })

    return { success: true }
}

const resetPassword = async ({ token, password }) => {
    const resetToken = token?.trim()

    if (!resetToken) {
        throw createHttpError("Invalid or expired reset link", 400, "reset_token_invalid")
    }

    const user = await User.findOne({
        passwordResetTokenHash: hashToken(resetToken),
        passwordResetTokenExpiresAt: {
            $gt: new Date()
        }
    }).select("+password")

    if (!user || user.status === "disabled") {
        throw createHttpError("Invalid or expired reset link", 400, "reset_token_invalid")
    }

    user.password = await bcrypt.hash(password, 12)
    user.passwordResetTokenHash = undefined
    user.passwordResetTokenExpiresAt = undefined
    await user.save()

    await revokeAllUserSessions({
        userId: user._id,
        reason: "password_reset"
    })

    const tenant = await getTenantById(user.tenantId)

    return {
        message: "Password reset successful. Please log in again.",
        workspace: serializeTenant(tenant),
        user: serializeAuthUser(user)
    }
}

const changePassword = async ({ userId, currentPassword, newPassword }) => {
    const user = await User.findById(userId).select("+password")

    if (!user || !user.password) {
        throw createHttpError("Authentication required", 401, "auth_required")
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)

    if (!isMatch) {
        throw createHttpError("Current password is incorrect", 400, "invalid_current_password")
    }

    user.password = await bcrypt.hash(newPassword, 12)
    user.passwordResetTokenHash = undefined
    user.passwordResetTokenExpiresAt = undefined
    await user.save()

    await revokeAllUserSessions({
        userId: user._id,
        reason: "password_changed"
    })

    const tenant = await getTenantById(user.tenantId)

    return {
        message: "Password changed successfully. Please log in again.",
        workspace: serializeTenant(tenant),
        user: serializeAuthUser(user)
    }
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

    user.password = await bcrypt.hash(password, 10)

    user.status = "active"

    user.inviteToken = undefined
    user.inviteTokenExpires = undefined

    await user.save()

    const tenant = await getTenantById(user.tenantId)

    return {
        message: "Password set successfully. You can login now",
        user: serializeAuthUser(user),
        workspace: serializeTenant(tenant)
    }
}

module.exports = {
    acceptInvite,
    changePassword,
    login,
    logout,
    logoutAll,
    refreshSession,
    requestPasswordReset,
    resetPassword,
    revokeAllUserSessions,
    signup
}
