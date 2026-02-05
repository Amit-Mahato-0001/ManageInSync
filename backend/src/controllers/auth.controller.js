//input se agencyName, email, password lo
//ager input missing he toh error show
// signup krne bolo signup service ko
//success response
//error

const {signup, login, acceptInvite} = require('../services/auth.service')

const signupHandler = async (req, res) => {

    try {
        const {agencyName, email, password} = req.body

        if(!agencyName || !email || !password){
            return res.status(400).json({
                message: "Please fill all required fields"
            })
        }

        const result = await signup({ agencyName, email, password})

        return res.status(201).json({
            message: "Signup successful",
            token: result.token
        })

    } catch (error) {
        return res.status(400).json({
            message: error.message
        })
    }
}

const loginHandler = async (req, res) => {

    try {
        const {email, password} = req.body

        if(!email || !password){
            return res.status(400).json({
                message: "Invalid credentials"
            })
        }

        const result = await login({email, password})

        return res.status(201).json({
            message: "Login successful",
            token: result.token
        })

    } catch (error) {
        return res.status(400).json({
            message: error.message
        })
    }
}

const acceptInviteHandler = async (req, res) => {

    try {
        
        const { token, password } = req.body

        const result = await acceptInvite({ token, password })

        return res.status(200).json(result)

    } catch (error) {
        
        return res.status(400).json({

            message: error.message

        })
    }
}


module.exports = {signupHandler, loginHandler, acceptInviteHandler}