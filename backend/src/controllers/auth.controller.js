const {
    signup,
    login,
    refreshSession,
    logout,
    logoutAll,
    acceptInvite
} = require("../services/auth.service")
const {
    ACTIVITY_CATEGORIES,
    ACTIVITY_VISIBILITY,
    buildActorSnapshot,
    buildTargetUserSnapshot,
    recordActivity
} = require("../services/activity.service")
const logAction = require("../services/audit.service")
const {
    clearRefreshCookie,
    getRefreshTokenFromRequest,
    setRefreshCookie
} = require("../utils/auth")

const formatLabel = (value = "") =>
    value
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")

const recordAuthAudit = async ({ user, action, meta }) => {
    if (!user?._id || !user?.tenantId) {
        return
    }

    try {
        await logAction({
            tenantId: user.tenantId,
            actorId: user._id,
            action,
            meta
        })
    } catch (error) {
        console.log(error.message)
    }
}

const signupHandler = async (req, res, next) => {
    try {
        const { agencyName, email, password } = req.body

        const result = await signup({ agencyName, email, password, req })

        setRefreshCookie(res, result.refreshToken)

        await recordAuthAudit({
            user: result.user,
            action: "auth.signup",
            meta: {
                email: result.user.email,
                role: result.user.role
            }
        })

        return res.status(201).json({
            message: "Signup successful",
            accessToken: result.accessToken,
            user: result.user
        })
    } catch (error) {
        next(error)
    }
}

const loginHandler = async (req, res, next) => {
    try {
        const { email, password } = req.body

        const result = await login({ email, password, req })

        setRefreshCookie(res, result.refreshToken)

        await recordAuthAudit({
            user: result.user,
            action: "auth.login",
            meta: {
                email: result.user.email,
                role: result.user.role
            }
        })

        return res.status(200).json({
            message: "Login successful",
            accessToken: result.accessToken,
            user: result.user
        })
    } catch (error) {
        next(error)
    }
}

const refreshHandler = async (req, res, next) => {
    try {
        const refreshToken = getRefreshTokenFromRequest(req)

        const result = await refreshSession({ refreshToken, req })

        setRefreshCookie(res, result.refreshToken)

        return res.status(200).json({
            message: "Session refreshed",
            accessToken: result.accessToken,
            user: result.user
        })
    } catch (error) {
        clearRefreshCookie(res)
        next(error)
    }
}

const logoutHandler = async (req, res, next) => {
    try {
        const refreshToken = getRefreshTokenFromRequest(req)

        await logout({ refreshToken })

        clearRefreshCookie(res)

        return res.status(200).json({
            message: "Logout successful"
        })
    } catch (error) {
        clearRefreshCookie(res)
        next(error)
    }
}

const logoutAllHandler = async (req, res, next) => {
    try {
        await logoutAll({ userId: req.user._id })

        clearRefreshCookie(res)

        await recordAuthAudit({
            user: req.user,
            action: "auth.logout_all",
            meta: {
                email: req.user.email
            }
        })

        return res.status(200).json({
            message: "Logged out from all devices"
        })
    } catch (error) {
        next(error)
    }
}

const acceptInviteHandler = async (req, res, next) => {
    try {
        const { token, password } = req.body

        const result = await acceptInvite({ token, password })

        if (result.user) {
            await recordActivity({
                tenantId: result.user.tenantId,
                type: "invite.accepted",
                category: result.user.role === "client" ? ACTIVITY_CATEGORIES.CLIENT : ACTIVITY_CATEGORIES.TEAM,
                summary: `${result.user.email} joined the workspace as ${formatLabel(result.user.role)}`,
                actor: buildActorSnapshot(result.user),
                targetUser: buildTargetUserSnapshot(result.user),
                visibility: result.user.role === "member"
                    ? ACTIVITY_VISIBILITY.TEAM
                    : ACTIVITY_VISIBILITY.ADMIN
            })
        }

        return res.status(200).json(result)
    } catch (error) {
        next(error)
    }
}

module.exports = {
    acceptInviteHandler,
    loginHandler,
    logoutAllHandler,
    logoutHandler,
    refreshHandler,
    signupHandler
}
