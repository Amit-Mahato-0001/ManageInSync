const mongoose = require('mongoose')
const Project = require('../models/project.model')
const Task = require('../models/task.model')
const User = require('../models/user.model')
const Conversation = require("../models/conversation.model")
const Message = require("../models/message.model")

const normalizeObjectIds = (ids = []) => {

    if (!Array.isArray(ids)) {
        return []
    }

    const seenIds = new Set()

    return ids.reduce((result, id) => {

        const value = id?.toString?.()

        if (!value || !mongoose.Types.ObjectId.isValid(value) || seenIds.has(value)) {
            return result
        }

        seenIds.add(value)
        result.push(value)
        return result

    }, [])
}

const resolveActiveAssignmentIds = async ({ tenantId, role, ids }) => {

    const normalizedIds = normalizeObjectIds(ids)

    if (normalizedIds.length === 0) {
        return []
    }

    const users = await User.find({
        _id: { $in: normalizedIds },
        tenantId,
        role,
        status: "active"
    })
        .select("_id")
        .lean()

    const validIdSet = new Set(users.map((user) => user._id.toString()))

    return normalizedIds.filter((id) => validIdSet.has(id))
}

const sanitizeProjectAssignments = async (projects, tenantId) => {

    if (!Array.isArray(projects) || projects.length === 0) {
        return []
    }

    const allAssignmentIds = new Set()

    projects.forEach((project) => {
        normalizeObjectIds(project.clients).forEach((id) => allAssignmentIds.add(id))
        normalizeObjectIds(project.members).forEach((id) => allAssignmentIds.add(id))
    })

    if (allAssignmentIds.size === 0) {
        return projects.map((project) => ({
            ...project,
            clients: [],
            members: []
        }))
    }

    const users = await User.find({
        _id: { $in: Array.from(allAssignmentIds) },
        tenantId,
        role: { $in: ["client", "member"] },
        status: "active"
    })
        .select("_id role")
        .lean()

    const userRoleMap = new Map(users.map((user) => [user._id.toString(), user.role]))

    return projects.map((project) => ({
        ...project,
        clients: normalizeObjectIds(project.clients).filter((id) => userRoleMap.get(id) === "client"),
        members: normalizeObjectIds(project.members).filter((id) => userRoleMap.get(id) === "member")
    }))
}

//CREATE PROJECT 

const createProject = async (data) => {

    const {name, tenantId} = data

    if(!tenantId){
        throw new Error("tenantId required")
    }

    if(!mongoose.Types.ObjectId.isValid(tenantId)){
        throw new Error("Invalid tenantId")
    }

    const [clients, members] = await Promise.all([
        resolveActiveAssignmentIds({
            tenantId,
            role: "client",
            ids: data.clients
        }),
        resolveActiveAssignmentIds({
            tenantId,
            role: "member",
            ids: data.members
        })
    ])

    return Project.create({
        ...data,
        name: name.trim(),
        description: data.description?.trim() || undefined,
        targetDate: data.targetDate || undefined,
        clients,
        members
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

    const sanitizedProjects = await sanitizeProjectAssignments(projects, tenantId)

    const projectsWithUnread = sanitizedProjects.map((project) => ({
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

    const deletedAt = new Date()

    const project = await Project.findOneAndUpdate(
        { _id: projectId, tenantId, deletedAt: null}, //filter (kya dhundna he)
        { deletedAt }, //update (kya change krna h)
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
            $set: { deletedAt }
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

    const previousClientIds = normalizeObjectIds(project.clients)

    const validClientIds = await resolveActiveAssignmentIds({
        tenantId,
        role: "client",
        ids: clientIds
    })

    //replace old clients with final selected clients
    project.clients = validClientIds
    await project.save()
    
    //return updated project
    return {
        project: await Project.findById(projectId),
        previousClientIds
    }

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

    const previousStatus = project.status

    project.status = status
    await project.save()

    return {
        project,
        previousStatus
    }

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

    const previousMemberIds = normalizeObjectIds(project.members)

    const validMemberIds = await resolveActiveAssignmentIds({
        tenantId,
        role: "member",
        ids: memberIds
    })

    //replace full list
    project.members = validMemberIds
    await project.save()

    //return krdo updated project ko bus bus ;)
    return {
        project: await Project.findById(projectId),
        previousMemberIds
    }
}

module.exports = {
    createProject,
    getProject,
    deleteProject,
    assignClient,
    updateProjectStatus,
    assignMember
}
