const mongoose = require("mongoose")
const Task = require("../models/task.model")
const Project = require("../models/project.model")
const User = require("../models/user.model")

const isMemberOfProject = (project, userId) => {

    return project.members.some(

        (memberId) => memberId.toString() === userId.toString()

    )

}

const getProject = async ({ tenantId, projectId, user }) => {

    if (!tenantId || !projectId) {

        throw new Error("tenantId and projectId required")

    }

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {

        throw new Error("Invalid tenantId")

    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {

        throw new Error("Invalid projectId")
    }

    const project = await Project.findOne({

        _id: new mongoose.Types.ObjectId(projectId),
        tenantId: new mongoose.Types.ObjectId(tenantId),
        deletedAt: null

    })

    if (!project) {

        throw new Error("Project not found")

    }

    if (user.role === "member" && !isMemberOfProject(project, user._id)) {

        throw new Error("Access denied for this project")

    }

    if (user.role === "client") {

        throw new Error("Access denied for this project")

    }

    return project
}

const createTask = async (data) => {

    const {
        title,
        description,
        targetDate,
        assigneeId,
        status,
        priority,
        tenantId,
        projectId,
        createdBy,
        user
    } = data

    if (!title || !assigneeId || !tenantId || !projectId || !createdBy) {

        throw new Error("Title, assigneeId, tenantId, projectId and createdBy are required")

    }

    const project = await getProject({

        tenantId,
        projectId,
        user

    })

    if (project.status === "completed") {

        throw new Error("Cannot create task in completed project")

    }

    if (!mongoose.Types.ObjectId.isValid(assigneeId)) {

        throw new Error("Invalid assigneeId")

    }

    const assignee = await User.findOne({

        _id: new mongoose.Types.ObjectId(assigneeId),
        tenantId: new mongoose.Types.ObjectId(tenantId),
        status: "active",
        role: { $ne: "client" }

    }).select("_id role")

    if (!assignee) {

        throw new Error("Invalid assignee")

    }

    if (assignee.role === "member" && !isMemberOfProject(project, assignee._id)) {

        throw new Error("Assignee must be assigned to this project")

    }

    const newTask = await Task.create({

        title: title.trim(),
        description: description?.trim() || undefined,
        targetDate: targetDate || undefined,
        assigneeId,
        tenantId,
        projectId,
        status: status || "todo",
        priority: priority || "medium",
        createdBy

    })

    return newTask
}

const getTasks = async ({ tenantId, projectId, user, page, limit, assigneeId, status, priority }) => {

    await getProject({
        tenantId,
        projectId,
        user
    })

    const query = {

        tenantId: new mongoose.Types.ObjectId(tenantId),
        projectId: new mongoose.Types.ObjectId(projectId),
        deletedAt: null
    }

    if (assigneeId) {

        if (!mongoose.Types.ObjectId.isValid(assigneeId)) {

            throw new Error("Invalid assigneeId")

        }

        query.assigneeId = new mongoose.Types.ObjectId(assigneeId)

    }

    if (status) {

        query.status = status

    }

    if (priority) {

        query.priority = priority

    }

    const safePage = Math.max(1, Number(page) || 1)
    const safeLimit = Math.max(1, Number(limit) || 10)
    const skip = (safePage - 1) * safeLimit

    const tasks = await Task.find(query)
        .lean()
        .skip(skip)
        .limit(safeLimit)
        .sort({ createdAt: -1 })

    const total = await Task.countDocuments(query)

    return {

        data: tasks,
        pagination: {
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.max(1, Math.ceil(total / safeLimit))
        }

    }
}

const deleteTask = async ({ tenantId, projectId, taskId, user }) => {

    await getProject({

        tenantId,
        projectId,
        user
    })

    if (!taskId) {

        throw new Error("taskId required")

    }

    if (!mongoose.Types.ObjectId.isValid(taskId)) {

        throw new Error("Invalid taskId")

    }

    const task = await Task.findOneAndUpdate(

        {
            _id: new mongoose.Types.ObjectId(taskId),
            tenantId: new mongoose.Types.ObjectId(tenantId),
            projectId: new mongoose.Types.ObjectId(projectId),
            deletedAt: null
        },

        { deletedAt: new Date() },

        { new: true }
    )

    if (!task) {

        throw new Error("Task not found")
        
    }

    return task
}

const updateTask = async({ tenantId, projectId, taskId, user, status, priority, description, targetDate }) => {

    await getProject({tenantId, projectId, user })

    if(!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {

        throw new Error("Invalid taskId")

    }

    const updates = {}

    if(status !== undefined) updates.status = status
    if(priority !== undefined) updates.priority = priority
    if(description !== undefined) updates.description = description.trim()
    if(targetDate !== undefined) updates.targetDate = targetDate

    const task = await Task.findOneAndUpdate(

        {
            _id: new mongoose.Types.ObjectId(taskId),
            tenantId: new mongoose.Types.ObjectId(tenantId),
            projectId: new mongoose.Types.ObjectId(projectId),
            deletedAt: null
        },
        updates,
        {new: true}
    )

    if(!task) throw new Error("Task not found")

    return task

}

module.exports = { createTask, getTasks, deleteTask, updateTask }
