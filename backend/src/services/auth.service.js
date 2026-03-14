//user se agencyname, email, pass lo
//ager inputs invalid h toh error show 
//password length 8 chars hona chahiye
//create tenant 
//create user as owner
//token

const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
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

    //check duplicate email
    const existingUser = await User.findOne({ email })

    if(existingUser){

        throw new Error("Email already registered")
    }

    const session = await mongoose.startSession()
    let user

    try {

        await session.withTransaction(async () => {

            const tenant = await createTenant(
                { name: agencyName },
                { session }
            )

            const hashedPassword = await bcrypt.hash(password, 10)

            user = await createUser(
                {
                    email,
                    password: hashedPassword,
                    tenantId: tenant._id,
                    role: "owner"
                },
                { session }
            )
        })

    } catch(error){

        throw error

    } finally {

        await session.endSession()
    }

    if(!user){

        throw new Error("Signup failed")
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

    if(!user.password){
        throw new Error("Please accept invite and set password first")
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch){
        throw new Error("Invalid Password")
    }

    if(user.status === "invited" && user.role === "member"){
        user.status = "active"
        await user.save()
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

    const inviteToken = token?.trim()

    if(!inviteToken || !password){

        throw new Error("Invalid token or password")

    }

    if(password.length < 8){

        throw new Error("Password must be at least 8 characters ")
    }

    const user = await User.findOne({

        inviteToken
    })

    if(!user){

        throw new Error("Invalid or expired invite")
    }

    if(!user.inviteTokenExpires || user.inviteTokenExpires.getTime() < Date.now()){

        throw new Error("Invite expired")
    }

    if(user.status !== "invited"){

        throw new Error("Invite already used")
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    user.password = hashedPassword
    if(user.role !== "member"){
        user.status = "active"
    }
    user.inviteToken = undefined
    user.inviteTokenExpires = undefined

    await user.save()

    return{

        message: user.role === "member"
            ? "Password set. Login to activate account"
            : "Password set successfully. You can login now"

    }

}

module.exports = {signup, login, acceptInvite}
