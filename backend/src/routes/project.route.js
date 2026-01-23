const express = require('express')
const { createProjectHandler, getProjectHandler, deleteProjectHandler, assignClientHandler } = require('../controllers/project.controller')
const requireRole = require('../middleware/rbac.middleware')
const auditLogger = require('../middleware/audit.middleware')

const router = express.Router()

//project create
//project get
//project delete

router.post(
    '/',
    requireRole(["owner", "admin", "member"]),
    auditLogger("PROJECT_CREATED"),
    createProjectHandler
)

router.get(
    '/',
    requireRole(["owner", "admin", "member", "client"]),
    getProjectHandler
)

router.delete(
    '/:projectId',
    requireRole(["owner", "admin" ]),
    auditLogger("PROJECT_DELETED"),
    deleteProjectHandler
)

router.put(
    '/:projectId/assign-client',
    requireRole(["owner", "admin"]),
    auditLogger("CLIENT_ASSIGN_TO_PROJECT"),
    assignClientHandler
)

module.exports = router