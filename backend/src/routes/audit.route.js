const express = require('express')
const router = express.Router()
const requireRole = require('../middleware/rbac.middleware')
const validate = require("../middleware/validate.middleware")
const getAuditLogs = require("../controllers/audit.controller")
const { auditListQuerySchema } = require("../validators/audit.validator")

router.get(
    '/',
    requireRole(["owner", "admin"]),
    validate(auditListQuerySchema, "query"),
    getAuditLogs
)

module.exports = router
