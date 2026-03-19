const { createTask, getTasks, deleteTask } = require("../services/task.service")

const createTaskHandler = async (req, res, next) => {

    try {
        
        const task = await createTask({

        title: req.body.title,
        assigneeId: req.body.assigneeId,
        tenantId: req.tenantId,
        status: req.body.status,
        priority: req.body.priority,
        createdBy: req.user._id

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

        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        
        const tasks = await getTasks({

            tenantId: req.tenantId,
            user: req.user,
            page,
            limit
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
        
        const {taskId} = req.params

        const task = await deleteTask({
            
            tenantId: req.tenantId,
            taskId
        })

        return res.status(200).json({

            message: "Task deletion successful",
            task

        })

    } catch (error) {

        next(error)
        
    }
}

module.exports = {createTaskHandler, getTasksHandler, deleteTaskHandler}
