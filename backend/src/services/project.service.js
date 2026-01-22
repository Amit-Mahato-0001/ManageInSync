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

const getProject = async (tenantId) => {

    if(!tenantId){
        throw new Error("TenantId required")
    }

    if(!mongoose.Types.ObjectId.isValid(tenantId)){
        throw new Error("Invalid tenantId")
    }

    return Project.find({
        tenantId,
        deletedAt: null
    }).lean()//data fetch speed ke lia
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

//projectId url se, clientId body se, tenantId middleware se 
//check kro teeno he ya nhi 
//projectId, clientId check kro valid ya nhi
//project check kro same tenant ka he ki nhi
//client check
//client assign 

const assignClient = async ({projectId, clientId, tenantId}) => {

    if(!projectId || !clientId || !tenantId){
        throw new Error("projectId, clientId & tenantId required")
    }

    if(
        !mongoose.Types.ObjectId.isValid(projectId) ||
        !mongoose.Types.ObjectId.isValid(clientId)
    ){
        throw new Error("Invalid projectId or clientId");
    }

    const project = await Project.findOne({
        _id: projectId,
        tenantId,
        deleteAt: null
    })

    if(!project){
        throw new Error("Project not found")
    }

    const client = await User.findOne({
        _id: clientId,
        tenantId,
        role: "client",
        status: "active"
    })

    if(!client){
        throw new Error("Client user not found")
    }

    project.clientId = client._id
    await project.save()

    return project

}

module.exports = {
    createProject,
    getProject,
    deleteProject,
    assignClient
}
