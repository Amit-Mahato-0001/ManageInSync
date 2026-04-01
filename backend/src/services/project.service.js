const mongoose = require('mongoose')
const Project = require('../models/project.model')
const Task = require('../models/task.model')
const User = require('../models/user.model')
const Conversation = require("../models/conversation.model")
const Message = require("../models/message.model")

//CREATE PROJECT 

const createProject = async (data) => {

    const {name, tenantId} = data

    if(!tenantId){
        throw new Error("tenantId required")
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

const getProject = async ({ tenantId, user, page, limit, search, status }) => {

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

    if (search?.trim()) {
        query.name = { $regex: search.trim(), $options: "i" }
    }

    if (status) {
        query.status = status
    }

    //Role filtering

    if(user.role === "client"){

        query.clients = new mongoose.Types.ObjectId(user._id)
    }

    if(user.role === "member"){

        query.members = new mongoose.Types.ObjectId(user._id)
    }

    const skip = (page - 1) * limit

    const projects = await Project.find(query)
    .skip(skip)
    .limit(limit)
    .lean()

    const total = await Project.countDocuments(query)

    const projectIds = projects.map((project) => project._id)
    const unreadByProject = {}

    if (projectIds.length > 0) {
        const conversations = await Conversation.find({
            tenantId: new mongoose.Types.ObjectId(tenantId),
            projectId: { $in: projectIds },
            deletedAt: null
        })
            .select("_id projectId")
            .lean()

        const conversationIds = conversations.map((item) => item._id)

        if (conversationIds.length > 0) {
            const unreadCounts = await Message.aggregate([
                {
                    $match: {
                        tenantId: new mongoose.Types.ObjectId(tenantId),
                        projectId: { $in: projectIds },
                        conversationId: { $in: conversationIds },
                        deletedAt: null,
                        senderId: { $ne: new mongoose.Types.ObjectId(user._id) },
                        readBy: {
                            $not: {
                                $elemMatch: {
                                    userId: new mongoose.Types.ObjectId(user._id)
                                }
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: "$projectId",
                        unreadCount: { $sum: 1 }
                    }
                }
            ])

            unreadCounts.forEach((item) => {
                unreadByProject[item._id.toString()] = item.unreadCount
            })
        }
    }

    const projectsWithUnread = projects.map((project) => ({
        ...project,
        unreadCount: unreadByProject[project._id.toString()] || 0
    }))

    return {

        data: projectsWithUnread,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil( total / limit)
        }
    }
}

//DELETE PROJECT

const deleteProject = async (projectId, tenantId) => {

    if(!tenantId){
        throw new Error("tenantId required")
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

    await Task.updateMany(
        {
            tenantId: new mongoose.Types.ObjectId(tenantId),
            projectId: new mongoose.Types.ObjectId(projectId),
            deletedAt: null
        },
        {
            $set: { deletedAt: new Date() }
        }
    )

    return project
}

//ASSIGN CLIENT TO PROJECT

const assignClient = async ({projectId, clientIds, tenantId}) => {

    if(!tenantId){
        throw new Error("tenantId required")
    }

    if(
        !mongoose.Types.ObjectId.isValid(projectId)
    ){
        throw new Error("Invalid projectId");
    }

    const project = await Project.findOne({
        _id: projectId,
        tenantId,
        deletedAt: null
    })

    if(!project){
        throw new Error("Project not found")
    }

    const uniqueClientIds = [...new Set(clientIds.map(id => id.toString()))] //avoid duplicate Id's
    
    //empty array alloweed
    if(uniqueClientIds.length === 0) {

        project.clients = []
        await project.save()
        return await Project.findById(projectId)
    }

    const validClients = await User.find({

        _id: { $in: uniqueClientIds },
        tenantId,
        role: "client",
        status: "active"
    })

    if(validClients.length !== uniqueClientIds.length){

        throw new Error("Some client Id's are invalid")
    }

    const validClientIds = validClients.map(c => c._id)

    //replace old clients with final selected clients
    project.clients = validClientIds
    await project.save()
    
    //return updated project
    return await Project.findById(projectId)

}

//UPDATE PROJECT STATUS

const updateProjectStatus = async ({projectId, tenantId, user, status}) => {
    
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

// ASSIGN MEMBER

const assignMember = async({projectId, memberIds, tenantId}) => {

    if(!tenantId){

        throw new Error("tenantId required")

    }

    if(!mongoose.Types.ObjectId.isValid(projectId)){

        throw new Error("Invalid projectId or memberIds")
    }

    const project = await Project.findOne({

        _id: projectId,
        tenantId,
        deletedAt: null

    })

    if(!project){

        throw new Error("Project not found")

    }

    //avoid duplicate Id's
    const uniqueMemberIds = [...new Set(memberIds.map(id => id.toString()))]

    //empty array allowed
    if(uniqueMemberIds.length === 0){

        project.members = []
        await project.save()
        return await Project.findById(projectId)

    }

    const validMembers = await User.find({

        _id: { $in: uniqueMemberIds },
        tenantId,
        role: "member",
        status: "active"

    })

    if(validMembers.length !== uniqueMemberIds.length){

        throw new Error("Some memberIds are invalid")

    }

    const validMemberIds = validMembers.map(m => m._id)

    //replace full list
    project.members = validMemberIds
    await project.save()

    //return krdo updated project ko bus bus ;)
    return await Project.findById(projectId)
}

module.exports = {
    createProject,
    getProject,
    deleteProject,
    assignClient,
    updateProjectStatus,
    assignMember
}
