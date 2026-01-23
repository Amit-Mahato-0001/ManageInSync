const express = require('express')
const requireRole = require('../middleware/rbac.middleware')
const { createClientHandler } = require('../controllers/client.controller')
const auditLogger = require('../middleware/audit.middleware')

const router = express.Router()

router.post(
    '/',
    requireRole(["owner", "admin"]),
    auditLogger("CLIENT_CREATED"),
    createClientHandler
)

module.exports = router