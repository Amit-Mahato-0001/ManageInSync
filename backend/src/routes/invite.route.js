const express = require("express");
const { inviteClientHandler } = require("../controllers/invite.controller");
const { acceptInviteHandler } = require('../controllers/auth.controller')
const auth = require("../middleware/auth.middleware");
const tenant = require("../middleware/tenant.middleware");
const requireRole = require("../middleware/rbac.middleware");

const router = express.Router()

router.post(
  "/invite",
  auth,
  tenant,
  requireRole(["owner", "admin"]),
  inviteClientHandler
);

router.post("/accept-invite", acceptInviteHandler)

module.exports = router