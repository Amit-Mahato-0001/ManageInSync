const express = require('express')
const { createProjectHandler, getProjectHandler, deleteProjectHandler, assignClientHandler, updateProjectStatusHandler, assignMemberHandler } = require('../controllers/project.controller')
const { createTaskHandler, getTasksHandler, deleteTaskHandler } = require("../controllers/task.controller")
const requireRole = require('../middleware/rbac.middleware')
const auditLogger = require('../middleware/audit.middleware')
const router = express.Router()
const validate = require("../middleware/validate.middleware")
const {
    createProjectSchema,
    projectIdParamsSchema,
    deleteProjectSchema,
    assignProjectSchema,
    updateProjectStatusSchema,
    assignMemberSchema
} = require('../validators/project.validator')

const {
    createTaskSchema,
    projectTaskParamsSchema,
    deleteTaskSchema
} = require("../validators/task.validator")

//CREATE PROJECT
router.post(
    '/',
    requireRole(["owner", "admin", "member"]),
    validate(createProjectSchema, "body"),
    auditLogger("PROJECT_CREATED"),
    createProjectHandler
)

//GET PROJECTS
router.get(
    '/',
    requireRole(["owner", "admin", "member", "client"]),
    getProjectHandler
)

//PROJECT DELETE
router.delete(
    '/:projectId',
    requireRole(["owner", "admin" ]),
    validate(deleteProjectSchema, "params"),
    auditLogger("PROJECT_DELETED"),
    deleteProjectHandler
)

//CLIENT ASSIGN
router.put(
    '/:projectId/assign-client',
    requireRole(["owner", "admin"]),
    validate(projectIdParamsSchema, "params"),
    validate(assignProjectSchema, "body"),
    auditLogger("CLIENT_ASSIGN_TO_PROJECT"),
    assignClientHandler
)

//STATUS UPDATE
router.patch(
    "/:projectId/status",
    requireRole(["owner", "admin", "member"]),
    validate(projectIdParamsSchema, "params"),
    validate(updateProjectStatusSchema, "body"),
    updateProjectStatusHandler
)

//ASSIGN MEMBER

router.put(
    '/:projectId/assign-member',
    requireRole(["owner", "admin"]),
    validate(projectIdParamsSchema, "params"),
    validate(assignMemberSchema, "body"),
    auditLogger("MEMBER_ASSIGN_TO_PROJECT"),
    assignMemberHandler
)

// CREATE TASK 
router.post(
    "/:projectId/tasks",
    requireRole(["owner", "admin"]),
    validate(projectTaskParamsSchema, "params"),
    validate(createTaskSchema, "body"),
    auditLogger("TASK_CREATED"),
    createTaskHandler
)

// GET PROJECT TASKS
router.get(
    "/:projectId/tasks",
    requireRole(["owner", "admin", "member"]),
    validate(projectTaskParamsSchema, "params"),
    getTasksHandler
)

// DELETE TASK
router.delete(
    "/:projectId/tasks/:taskId",
    requireRole(["owner", "admin"]),
    validate(deleteTaskSchema, "params"),
    auditLogger("TASK_DELETED"),
    deleteTaskHandler
)

module.exports = router
