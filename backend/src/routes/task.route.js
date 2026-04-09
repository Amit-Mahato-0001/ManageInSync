const express = require("express")
const requireRole = require("../middleware/rbac.middleware")
const validate = require("../middleware/validate.middleware")
const { createTaskHandler, getTasksHandler, deleteTaskHandler, updateTaskHandler} = require("../controllers/task.controller")
const { createTaskSchema, deleteTaskSchema, updateTaskSchema } = require("../validators/task.validator")

const router = express.Router()

router.post('/projects/:projectId/tasks',
    requireRole(["owner", "admin"]),
    validate(createTaskSchema, "body"),
    createTaskHandler
)

router.get('/projects/:projectId/tasks',
    requireRole(["owner", "admin", "member"]),
    getTasksHandler
)

router.delete('/projects/:projectId/tasks/:taskId',
    requireRole(["owner", "admin"]),
    validate(deleteTaskSchema, "params"),
    deleteTaskHandler
)

router.patch('/projects/:projectId/tasks/:taskId',
    requireRole(["owner", "admin", "member"]),
    validate(updateTaskSchema, "body"),
    updateTaskHandler
)

module.exports = router
