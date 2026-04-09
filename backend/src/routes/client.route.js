const express = require('express')
const requireRole = require('../middleware/rbac.middleware')
const { createClientHandler, getClientsHandler, deleteClientHandler } = require('../controllers/client.controller')
const validate = require("../middleware/validate.middleware")
const { createClientSchema, deleteClientSchema } = require("../validators/client.validator")

const router = express.Router()

router.post(
    '/',
    requireRole(["owner", "admin"]),
    validate(createClientSchema, "body"),
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
    deleteClientHandler
)

module.exports = router
