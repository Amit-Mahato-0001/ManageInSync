const {
    getProfile,
    listActiveSessions,
    updateProfile
} = require("../services/account.service")

const getAccountProfileHandler = async (req, res, next) => {
    try {
        const user = await getProfile({
            userId: req.user._id
        })

        return res.status(200).json({
            user
        })
    } catch (error) {
        next(error)
    }
}

const updateAccountProfileHandler = async (req, res, next) => {
    try {
        const user = await updateProfile({
            userId: req.user._id,
            name: req.body.name,
            logoUrl: req.body.logoUrl
        })

        return res.status(200).json({
            message: "Profile updated successfully",
            user
        })
    } catch (error) {
        next(error)
    }
}

const listActiveSessionsHandler = async (req, res, next) => {
    try {
        const sessions = await listActiveSessions({
            userId: req.user._id,
            currentSessionId: req.auth?.session?._id
        })

        return res.status(200).json({
            sessions
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getAccountProfileHandler,
    listActiveSessionsHandler,
    updateAccountProfileHandler
}
