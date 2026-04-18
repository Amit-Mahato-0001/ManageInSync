const express = require("express");
const { inviteUserHandler } = require("../controllers/invite.controller");
const { acceptInviteHandler } = require('../controllers/auth.controller')
const auth = require("../middleware/auth.middleware");
const tenant = require("../middleware/tenant.middleware");
const requireRole = require("../middleware/rbac.middleware");
const validate = require("../middleware/validate.middleware");
const { createRateLimiter } = require("../middleware/rateLimit.middleware");
const { acceptInviteSchema } = require("../validators/auth.validator");
const { inviteUserSchema } = require("../validators/invite.validator");

const router = express.Router()
const inviteRateLimiter = createRateLimiter({
  windowMs: Number(process.env.INVITE_RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000,
  max: Number(process.env.INVITE_RATE_LIMIT_MAX) || 20,
  message: "Too many invite requests. Please try again later.",
  code: "invite_rate_limit_exceeded"
})

router.post(
  "/client",
  inviteRateLimiter,
  auth,
  tenant,
  requireRole(["owner", "admin"]),
  validate(inviteUserSchema),
  inviteUserHandler("client")
)

router.post(
  "/member",
  inviteRateLimiter,
  auth,
  tenant,
  requireRole(["owner", "admin"]),
  validate(inviteUserSchema),
  inviteUserHandler("member")
)

router.post(
  "/admin",
  inviteRateLimiter,
  auth,
  tenant,
  requireRole(["owner"]),
  validate(inviteUserSchema),
  inviteUserHandler("admin")
);

router.post(
  "/accept-invite",
  inviteRateLimiter,
  validate(acceptInviteSchema),
  acceptInviteHandler
)

module.exports = router
