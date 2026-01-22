const express = require('express')
const requireRole = require('../middleware/rbac.middleware')
const { createClientHandler } = require('../controllers/client.controller')

const router = express.Router()

router.post(
    '/',
    requireRole(["owner", "admin"]),
    createClientHandler
)

module.exports = router