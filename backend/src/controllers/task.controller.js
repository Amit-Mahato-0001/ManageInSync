const { createTask, getTasks, deleteTask, updateTask } = require("../services/task.service")

const createTaskHandler = async (req, res, next) => {

    try {
        const { projectId } = req.params
        
        const task = await createTask({
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

        const task = await deleteTask({
            
            tenantId: req.tenantId,
            projectId,
            taskId,
            user: req.user
        })

        return res.status(200).json({

            message: "Task deletion successful",
            task

        })

    } catch (error) {

        next(error)
        
    }
}

const updateTaskHandler = async(req, res, next) => {

    try{

        const {projectId, taskId} = req.params

        const task = await updateTask({

            tenantId: req.tenantId,
            projectId,
            taskId,
            user: req.user,
            status: req.body.status,
            priority: req.body.priority,
            description: req.body.description,
            targetDate: req.body.targetDate

        })

        return res.status(200).json({ message: "Task updated successfully", task })

    } catch(error) {

        next(error)
        
    }
}

module.exports = {createTaskHandler, getTasksHandler, deleteTaskHandler, updateTaskHandler}
