//input se agencyName, email, password lo
//ager input missing he toh error show
// signup krne bolo signup service ko
//success response
//error

const {signup, login, acceptInvite} = require('../services/auth.service')

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

        return res.status(200).json(result)

    } catch (error) {
        
        next(error)
    }
}


module.exports = {signupHandler, loginHandler, acceptInviteHandler}