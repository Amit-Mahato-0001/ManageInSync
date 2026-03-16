const express = require('express')
const requireRole = require('../middleware/rbac.middleware')
const { createClientHandler, getClientsHandler, deleteClientHandler } = require('../controllers/client.controller')
const auditLogger = require('../middleware/audit.middleware')
const validate = require("../middleware/validate.middleware")
const { createClientSchema, deleteClientSchema } = require("../validators/client.validator")

const router = express.Router()

router.post(
    '/',
    requireRole(["owner", "admin"]),
    validate(createClientSchema, "body"),
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
    validate(deleteClientSchema, "params"),
    auditLogger("CLIENT_DELETED"),
    deleteClientHandler
)

module.exports = router