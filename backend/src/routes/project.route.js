const express = require('express')
const { createProjectHandler, getProjectHandler, deleteProjectHandler, assignClientHandler, updateProjectStatusHandler } = require('../controllers/project.controller')
const requireRole = require('../middleware/rbac.middleware')
const auditLogger = require('../middleware/audit.middleware')
const router = express.Router()

//CREATE PROJECT
router.post(
    '/',
    requireRole(["owner", "admin", "member"]),
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
    auditLogger("PROJECT_DELETED"),
    deleteProjectHandler
)

//CLIENT ASSIGN
router.put(
    '/:projectId/assign-client',
    requireRole(["owner", "admin"]),
    auditLogger("CLIENT_ASSIGN_TO_PROJECT"),
    assignClientHandler
)

//STATUS UPDATE
router.patch(
    "/:projectId/status",
    requireRole(["owner", "admin", "member"]),
    updateProjectStatusHandler
)

module.exports = router