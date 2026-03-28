const mongoose = require("mongoose")
const Project = require("../models/project.model")

const makeError = (message, status = 400) => {
    const error = new Error(message)
    error.status = status
    return error
}

const containsUser = (users = [], userId) =>
    users.some((id) => id.toString() === userId.toString())

const canAccessProject = async ({ projectId, userId, role, tenantId }) => {

    if (!projectId || !userId || !role || !tenantId) {
        throw makeError("projectId, userId, role and tenantId are required", 400)
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw makeError("Invalid projectId", 400)
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw makeError("Invalid userId", 400)
    }

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
        throw makeError("Invalid tenantId", 400)
    }

    const project = await Project.findOne({
        _id: new mongoose.Types.ObjectId(projectId),
        tenantId: new mongoose.Types.ObjectId(tenantId),
        deletedAt: null
    })

    if (!project) {
        throw makeError("Project not found", 404)
    }

    if (role === "owner" || role === "admin") {
        return project
    }

    if (role === "member" && containsUser(project.members, userId)) {
        return project
    }

    if (role === "client" && containsUser(project.clients, userId)) {
        return project
    }

    throw makeError("Access denied for this project", 403)
    
}

module.exports = canAccessProject
