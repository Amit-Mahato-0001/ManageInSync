const express = require("express")
const requireRole = require("../middleware/rbac.middleware")
const auditLogger = require("../middleware/audit.middleware")
const validate = require("../middleware/validate.middleware")
const { createTaskHandler, getTasksHandler, deleteTaskHandler} = require("../controllers/task.controller")
const { createTaskSchema, deleteTaskSchema } = require("../validators/task.validator")

const router = express.Router()

router.post('/',
    requireRole(["owner", "admin"]),
    validate(createTaskSchema, "body"),
    auditLogger("TASK_CREATED"),
    createTaskHandler
)

router.get('/',
    requireRole(["owner", "admin", "member"]),
    getTasksHandler
)

router.delete('/:taskId',
    requireRole(["owner", "admin"]),
    validate(deleteTaskSchema, "params"),
    auditLogger("TASK_DELETED"),
    deleteTaskHandler
)

module.exports = router
