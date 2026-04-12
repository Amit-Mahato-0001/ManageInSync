const jwt = require("jsonwebtoken")

const User = require("../models/user.model")
const Session = require("../models/session.model")
const createHttpError = require("../utils/httpError")
const { getAccessTokenSecret } = require("../utils/auth")

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(createHttpError("Authentication required", 401, "auth_required"))
    }

    const token = authHeader.split(" ")[1]?.trim()

    if (!token) {
        return next(createHttpError("Authentication required", 401, "auth_required"))
    }

    let decoded

    try {
        decoded = jwt.verify(token, getAccessTokenSecret())
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return next(createHttpError("Access token expired", 401, "access_token_expired"))
        }

        return next(createHttpError("Invalid access token", 401, "auth_required"))
    }

    const userId = decoded.userId || decoded.sub
    const sessionId = decoded.sid

    if (!userId || !sessionId) {
        return next(createHttpError("Invalid access token", 401, "auth_required"))
    }

    try {
        const session = await Session.findById(sessionId)

        if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
            return next(createHttpError("Session revoked", 401, "session_revoked"))
        }

        if (session.userId.toString() !== userId.toString()) {
            return next(createHttpError("Session revoked", 401, "session_revoked"))
        }

        const user = await User.findById(userId)

        if (!user) {
            return next(createHttpError("User not found", 401, "auth_required"))
        }

        if (user.status === "disabled") {
            await Session.updateMany(
                {
                    userId: user._id,
                    revokedAt: null
                },
                {
                    $set: {
                        revokedAt: new Date(),
                        revokeReason: "account_disabled"
                    }
                }
            )

            return next(createHttpError("Account disabled. Contact agency.", 401, "account_disabled"))
        }

        if (user.status !== "active") {
            return next(createHttpError("Authentication required", 401, "auth_required"))
        }

        if (decoded.tenantId?.toString() !== user.tenantId.toString()) {
            return next(createHttpError("Session revoked", 401, "session_revoked"))
        }

        if (decoded.role && decoded.role !== user.role) {
            return next(createHttpError("Access token expired", 401, "access_token_expired"))
        }

        req.user = user
        req.auth = {
            token: decoded,
            session
        }

        next()
    } catch (error) {
        next(error)
    }
}

module.exports = authenticate
