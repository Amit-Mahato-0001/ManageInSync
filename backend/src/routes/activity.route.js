const express = require("express")
const requireRole = require("../middleware/rbac.middleware")
const { getActivityFeedHandler } = require("../controllers/activity.controller")

const router = express.Router()

router.get(
    "/",
    requireRole(["owner", "admin", "member"]),
    getActivityFeedHandler
)

module.exports = router
