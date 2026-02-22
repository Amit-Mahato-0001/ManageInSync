const mongoose = require('mongoose')
const Project = require('../models/project.model')
const User = require('../models/user.model')

//CREATE PROJECT 

const createProject = async (data) => {

    const {name, tenantId} = data

    if(!name || !tenantId){
        throw new Error("Project name & tenantId required")
    }

    if(!mongoose.Types.ObjectId.isValid(tenantId)){
        throw new Error("Invalid tenantId")
    }

    return Project.create({
        ...data,
        name: name.trim()
    })
}

//GET PROJECT

const getProject = async ({tenantId, user}) => {

    if(!tenantId){
        throw new Error("TenantId required")
    }

    if(!mongoose.Types.ObjectId.isValid(tenantId)){
        throw new Error("Invalid tenantId")
    }

    const query = {
        tenantId,
        deletedAt: null
    }

    //Role filtering

    if(user.role === "client"){

        query.clients = new mongoose.Types.ObjectId(user._id)
    }

    if(user.role === "member"){

        query.members = new mongoose.Types.ObjectId(user._id)
    }

    return Project.find(query).lean()
}

//DELETE PROJECT

const deleteProject = async (projectId, tenantId) => {

    if(!projectId || !tenantId){
        throw new Error("ProjectId and tenantId required")
    }

    if(!mongoose.Types.ObjectId.isValid(projectId)){
        throw new Error("Invalid projectId")
    }

    const project = await Project.findOneAndUpdate(
        { _id: projectId, tenantId, deletedAt: null}, //filter (kya dhundna he)
        { deletedAt: new Date()}, //update (kya change krna h)
        { new: true} //option (update ke baad wala project return)
    )

    if(!project){
        throw new Error("Project not found")
    }

    return project
}

//ASSIGN CLIENT TO PROJECT

const assignClient = async ({projectId, clientIds, tenantId}) => {

    if(!projectId || !clientIds || !tenantId){
        throw new Error("projectId, clientIds & tenantId required")
    }

    if(
        !mongoose.Types.ObjectId.isValid(projectId)
    ){
        throw new Error("Invalid projectId or clientIds");
    }

    const project = await Project.findOne({
        _id: projectId,
        tenantId,
        deletedAt: null
    })

    if(!project){
        throw new Error("Project not found")
    }

    const validClients = await User.find({

        _id: { $in: clientIds },
        tenantId,
        role: "client",
        status: "active"
    })

    if(!validClients.length){
        throw new Error("No valid clients found")
    }

    const validClientIds = validClients.map(c => c._id)

    //using $addToSet to prevent duplicates
    await Project.updateOne(
        { _id: projectId },
        { $addToSet: { clients: { $each: validClientIds }}}
    )
    
    //return updated project
    return await Project.findById(projectId)

}

//UPDATE PROJECT STATUS

const updateProjectStatus = async ({projectId, tenantId, user, status}) => {

    const allowedStatuses = ["active", "on-hold", "completed"]

    if(!allowedStatuses.includes(status)){
        throw new Error("invalid status")
    }

    const project = await Project.findOne({
        _id: projectId,
        tenantId,
        deletedAt: null
    })

    if(!project){
        throw new Error("Project not found")
    }

    if(user.role === "member"){

        if(!project.members.includes(user._id)){

            throw new Error("Access denied")
        }
    }

    project.status = status
    await project.save()

    return project

}

module.exports = {
    createProject,
    getProject,
    deleteProject,
    assignClient,
    updateProjectStatus
}
