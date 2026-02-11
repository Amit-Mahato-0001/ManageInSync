//user se agencyname, email, pass lo
//ager inputs invalid h toh error show 
//password length 8 chars hona chahiye
//create tenant 
//create user as owner
//token

const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const createTenant = require('../services/tenant.service')
const createUser = require('../services/user.service')
const User = require('../models/user.model')

const signup = async ({agencyName, email, password}) => {
    if(!agencyName || !email || !password){
        throw new Error("All fields required");
        
    }

    if(password.length < 8){
        throw new Error("Password must be of atleast 8 characters");
        
    }

    const tenant = await createTenant({
        name: agencyName
    })

    const user = await createUser({
        email,
        password,
        tenantId: tenant._id,
        role: "owner"
    })

    const token = jwt.sign({
        userId: user._id,
        tenantId: user.tenantId,
        role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d'}
)

return { token }
}

//user se email, pass lo
//user find kro email se ager nhi mila toh error show
//password compare kro user inputed pass se ager match kiya toh thik warna error show
//token create kro

const login = async ({ email, password }) => {

    const user = await User.findOne({email}).select("+password")
    if(!user){
        throw new Error("Invalid Email")
    }

    if(user.status === "disabled"){
        throw new Error("Account disabled. Contact agency.")
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch){
        throw new Error("Invalid Password")
    }

    const token = jwt.sign({
        userId: user._id,
        tenantId: user.tenantId,
        role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d'}
)

return { token }

}

const acceptInvite = async ({ token, password }) => {

    if(!token || !password){

        throw new Error("Invalid token or password")

    }

    if(password.length < 8){

        throw new Error("Password must be at least 8 characters ")
    }

    const user = await User.findOne({

        inviteToken: token,
        inviteTokenExpires: { $gt: Date.now() },
        status: "invited"
    })

    if(!user){

        throw new Error("Invalid or expired invite")
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    user.password = hashedPassword
    user.status = "active"
    user.inviteToken = undefined
    user.inviteTokenExpires = undefined

    await user.save()

    return{

        message: "Password set successfully. You can login now"

    }

}

module.exports = {signup, login, acceptInvite}