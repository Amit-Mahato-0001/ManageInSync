const mongoose = require('mongoose')
const Task = require('../models/task.model')

const createTask = async (data) => {

    const { title, assigneeId, tenantId, status, priority, createdBy } = data

    if(!title || !assigneeId || !tenantId || !status || !priority || !createdBy){

        throw new Error("Title, assigneeId, status, priority or createdBy is invalid")
    }

    if(!mongoose.Types.ObjectId.isValid(tenantId)){

        throw new Error("Invalid tenantId")
    }

    const newTask = await Task.create({

        title,
        assigneeId,
        tenantId,
        status,
        priority,
        createdBy
    })

    return newTask
}

const getTasks = async ({tenantId, assigneeId, user, page, limit}) => {

    if(!tenantId){
        
        throw new Error("TenantId required")
    }

    if(!mongoose.Types.ObjectId.isValid(tenantId)){

        throw new Error("Invalid tenantId")
    }

    const query = {

        tenantId,
        deletedAt : null
    }

    //role filtering

    if(user.role === "member"){

        query.assigneeId = new mongoose.Types.ObjectId(user._id)
    }

    if(assigneeId){

        query.assigneeId = new mongoose.Types.ObjectId(assigneeId)
    }

    const safePage = Math.max(1, Number(page) || 1)
    const safeLimit = Math.max(1, Number(limit) || 10)
    const skip = (safePage - 1) * safeLimit

    const tasks = await Task.find(query)
    .lean()
    .skip(skip)
    .limit(safeLimit)

    const total = await Task.countDocuments(query)

    return {

        data: tasks,

        pagination: {

            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.max(1, Math.ceil( total / safeLimit))
        }
    }
}

const deleteTask = async ({tenantId, taskId}) => {

    if(!tenantId || !taskId){

        throw new Error("tenantId or taskId required")

    }

    if(!mongoose.Types.ObjectId.isValid(taskId)){

        throw new Error("invalid taskId")

    }

    if(!mongoose.Types.ObjectId.isValid(tenantId)){

        throw new Error("invalid tenantId")

    }

    const task = await Task.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(taskId),
            tenantId: new mongoose.Types.ObjectId(tenantId),
            deletedAt: null
        },
        {deletedAt: new Date()},
        { new: true }
    )

    if(!task){
        throw new Error("Task not found")
    }

    return task
}

module.exports = {createTask, getTasks, deleteTask}
