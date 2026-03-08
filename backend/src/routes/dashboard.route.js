const express = require('express')
const requireRole = require('../middleware/rbac.middleware')
const dashboardHandler = require('../controllers/dashboard.controller')

const router = express.Router()

router.get(
    '/',
    requireRole(["owner", "admin", "member"]),
    dashboardHandler
)

module.exports = router
