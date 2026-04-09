//input se agencyName, email, password lo
//ager input missing he toh error show
// signup krne bolo signup service ko
//success response
//error

const {signup, login, acceptInvite} = require('../services/auth.service')
const {
    ACTIVITY_CATEGORIES,
    ACTIVITY_VISIBILITY,
    buildActorSnapshot,
    buildTargetUserSnapshot,
    recordActivity
} = require("../services/activity.service")

const formatLabel = (value = "") =>
    value
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")

const signupHandler = async (req, res, next) => {

    try {
        const {agencyName, email, password} = req.body

        const result = await signup({ agencyName, email, password})

        return res.status(201).json({
            message: "Signup successful",
            token: result.token
        })

    } catch (error) {

        next(error)
    }
}

const loginHandler = async (req, res, next) => {

    try {
        const {email, password} = req.body

        const result = await login({email, password})

        return res.status(200).json({
            message: "Login successful",
            token: result.token
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


module.exports = {signupHandler, loginHandler, acceptInviteHandler}
