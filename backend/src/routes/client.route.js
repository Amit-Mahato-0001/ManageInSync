const express = require('express')
const requireRole = require('../middleware/rbac.middleware')
const { createClientHandler, getClientsHandler, deleteClientHandler } = require('../controllers/client.controller')
const auditLogger = require('../middleware/audit.middleware')

const router = express.Router()

router.post(
    '/',
    requireRole(["owner", "admin"]),
    auditLogger("CLIENT_CREATED"),
    createClientHandler
)

router.get('/',
    requireRole(["owner", "admin"]),
    getClientsHandler
)

router.delete(
    "/:clientId",
    requireRole(["owner", "admin"]),
    auditLogger("CLIENT_DELETED"),
    deleteClientHandler
)

module.exports = router