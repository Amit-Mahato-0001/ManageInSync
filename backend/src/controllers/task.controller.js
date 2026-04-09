const { createTask, getTasks, deleteTask, updateTask } = require("../services/task.service")
const {
    ACTIVITY_CATEGORIES,
    ACTIVITY_VISIBILITY,
    buildActorSnapshot,
    buildProjectSnapshot,
    buildTaskSnapshot,
    recordActivity
} = require("../services/activity.service")

const getActorLabel = (user) => user?.email || "Someone"
const formatLabel = (value = "") =>
    value
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")

const createTaskHandler = async (req, res, next) => {

    try {
        const { projectId } = req.params
        
        const result = await createTask({
            title: req.body.title,
            description: req.body.description,
            targetDate: req.body.targetDate,
            assigneeId: req.body.assigneeId,
            status: req.body.status,
            priority: req.body.priority,
            tenantId: req.tenantId,
            projectId,
            createdBy: req.user._id,
            user: req.user
        })

        const task = result.task

        await recordActivity({
            tenantId: req.tenantId,
            type: "task.created",
            category: ACTIVITY_CATEGORIES.TASK,
            summary: `${getActorLabel(req.user)} created task "${task.title}" in "${result.project.name}"`,
            actor: buildActorSnapshot(req.user),
            project: buildProjectSnapshot(result.project),
            task: buildTaskSnapshot(task),
            visibility: ACTIVITY_VISIBILITY.TEAM,
            memberIds: result.project.members,
            meta: {
                status: task.status,
                priority: task.priority,
                targetDate: task.targetDate || null
            }
        })

        return res.status(200).json(
            {
                message: "Task created successfully",
                task
            }
        )

    } catch (error) {

        next(error)
        
    }
}

const getTasksHandler = async (req, res, next) => {

    try {
        const { projectId } = req.params

        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        
        const tasks = await getTasks({
            tenantId: req.tenantId,
            projectId,
            user: req.user,
            page,
            limit,
            assigneeId: req.query.assigneeId,
            status: req.query.status,
            priority: req.query.priority
        })

        return res.status(200).json({

            tasks
        })

    } catch (error) {
        
        next(error)

    }
}

const deleteTaskHandler = async (req, res, next) => {

    try {
        
        const { projectId, taskId } = req.params

        const result = await deleteTask({
            
            tenantId: req.tenantId,
            projectId,
            taskId,
            user: req.user
        })

        await recordActivity({
            tenantId: req.tenantId,
            type: "task.deleted",
            category: ACTIVITY_CATEGORIES.TASK,
            summary: `${getActorLabel(req.user)} deleted task "${result.task.title}" from "${result.project.name}"`,
            actor: buildActorSnapshot(req.user),
            project: buildProjectSnapshot(result.project),
            task: buildTaskSnapshot(result.task),
            visibility: ACTIVITY_VISIBILITY.TEAM,
            memberIds: result.project.members
        })

        return res.status(200).json({

            message: "Task deletion successful",
            task: result.task

        })

    } catch (error) {

        next(error)
        
    }
}

const updateTaskHandler = async(req, res, next) => {

    try{

        const {projectId, taskId} = req.params

        const result = await updateTask({

            tenantId: req.tenantId,
            projectId,
            taskId,
            user: req.user,
            status: req.body.status,
            priority: req.body.priority,
            description: req.body.description,
            targetDate: req.body.targetDate

        })

        const activityWrites = []

        if (result.previousTask.status !== result.task.status) {
            activityWrites.push(
                recordActivity({
                    tenantId: req.tenantId,
                    type: "task.status_changed",
                    category: ACTIVITY_CATEGORIES.TASK,
                    summary: `${getActorLabel(req.user)} moved task "${result.task.title}" from ${formatLabel(result.previousTask.status)} to ${formatLabel(result.task.status)}`,
                    actor: buildActorSnapshot(req.user),
                    project: buildProjectSnapshot(result.project),
                    task: buildTaskSnapshot(result.task),
                    visibility: ACTIVITY_VISIBILITY.TEAM,
                    memberIds: result.project.members,
                    meta: {
                        from: result.previousTask.status,
                        to: result.task.status
                    }
                })
            )
        }

        if (result.previousTask.priority !== result.task.priority) {
            activityWrites.push(
                recordActivity({
                    tenantId: req.tenantId,
                    type: "task.priority_changed",
                    category: ACTIVITY_CATEGORIES.TASK,
                    summary: `${getActorLabel(req.user)} changed task "${result.task.title}" priority from ${formatLabel(result.previousTask.priority)} to ${formatLabel(result.task.priority)}`,
                    actor: buildActorSnapshot(req.user),
                    project: buildProjectSnapshot(result.project),
                    task: buildTaskSnapshot(result.task),
                    visibility: ACTIVITY_VISIBILITY.TEAM,
                    memberIds: result.project.members,
                    meta: {
                        from: result.previousTask.priority,
                        to: result.task.priority
                    }
                })
            )
        }

        if (activityWrites.length > 0) {
            await Promise.all(activityWrites)
        }

        return res.status(200).json({ message: "Task updated successfully", task: result.task })

    } catch(error) {

        next(error)
        
    }
}

module.exports = {createTaskHandler, getTasksHandler, deleteTaskHandler, updateTaskHandler}
