const express = require('express')
const router = express.Router()
const requireRole = require('../middleware/rbac.middleware')
const getAuditLogs = require("../controllers/audit.controller")

router.get(
    '/',
    requireRole(["owner", "admin"]),
    getAuditLogs
)

module.exports = router