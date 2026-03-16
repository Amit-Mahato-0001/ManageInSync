const express = require("express");
const { inviteUserHandler } = require("../controllers/invite.controller");
const { acceptInviteHandler } = require('../controllers/auth.controller')
const auth = require("../middleware/auth.middleware");
const tenant = require("../middleware/tenant.middleware");
const requireRole = require("../middleware/rbac.middleware");
const validate = require("../middleware/validate.middleware");
const { acceptInviteSchema } = require("../validators/auth.validator");
const { inviteUserSchema } = require("../validators/invite.validator");

const router = express.Router()

router.post(
  "/client",
  auth,
  tenant,
  requireRole(["owner", "admin"]),
  validate(inviteUserSchema),
  inviteUserHandler("client")
)

router.post(
  "/member",
  auth,
  tenant,
  requireRole(["owner", "admin"]),
  validate(inviteUserSchema),
  inviteUserHandler("member")
)

router.post(
  "/admin",
  auth,
  tenant,
  requireRole(["owner"]),
  validate(inviteUserSchema),
  inviteUserHandler("admin")
);

router.post("/accept-invite", validate(acceptInviteSchema), acceptInviteHandler)

module.exports = router