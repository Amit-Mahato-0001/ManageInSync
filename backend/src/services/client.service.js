const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const User = require('../models/user.model')

//email, name, tenantId body se
//email, tenantId check valid or not?
//tenantId valid or not??
//same tenant me duplicate email check
//client create

const createClient = async ({ email, name, tenantId}) => {

    if(!email || !tenantId){
        throw new Error("Email and tenantId required")
    }

    if(!mongoose.Types.ObjectId.isValid(tenantId)){
        throw new Error("Invalid tenantId")
    }

    const existingUser = await User.findOne({ email, tenantId})
    if(existingUser){
        throw new Error("Client already exists")
    }

    const password = Math.random().toString(36).slice(-8)

    const hashedPassword = await bcrypt.hash(password, 10)

    const client = await User.create({
        email,
        name,
        password: hashedPassword,
        role: "client",
        tenantId,
        status: "active"
    })

    return client
}

const getClients = (tenantId) => {

    if(!tenantId){
        throw new Error("tenantId required")
    }

    const clients = User.find({
        tenantId,
        role: "client",
        status: "active"
    }).select("email name")

    return clients
}

module.exports = { createClient, getClients }