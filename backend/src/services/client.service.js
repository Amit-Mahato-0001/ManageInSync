const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const User = require('../models/user.model')
const Project = require('../models/project.model')

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

const deleteClient = async ({ clientId, tenantId }) => {

    if(!clientId || !tenantId){

        throw new Error("clientId & tenantId required")
    }

    if(!mongoose.Types.ObjectId.isValid(clientId)){

        throw new Error("Invalid clientId")
    }

    const client = await User.findOneAndDelete({
        _id: clientId,
        tenantId,
        role: "client"
    })

    if(!client){

        throw new Error("Client not found")
    }

    return { message: "Client deleted successfully"}
}

module.exports = { createClient, getClients, deleteClient }