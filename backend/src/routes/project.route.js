const express = require('express')
const { createProjectHandler, getProjectHandler, deleteProjectHandler, assignClientHandler } = require('../controllers/project.controller')
const requireRole = require('../middleware/rbac.middleware')

const router = express.Router()

//project create
//project get
//project delete

router.post(
    '/',
    requireRole(["owner", "admin", "member"]),
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
    deleteProjectHandler
)

router.put(
    '/:projectId/assign-client',
    requireRole(["owner", "admin"]),
    assignClientHandler
)

module.exports = router