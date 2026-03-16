const express = require("express")
const requireRole = require("../middleware/rbac.middleware")
const validate = require("../middleware/validate.middleware")

const {
  getMembersHandler,
  deleteMemberHandler
} = require("../controllers/member.controller")

const { deleteMemberSchema } = require("../validators/member.validator")

const router = express.Router()

router.get(
  "/",
  requireRole(["owner", "admin"]),
  getMembersHandler
)

router.delete(
  "/:memberId",
  requireRole(["owner", "admin"]),
  validate(deleteMemberSchema, "params"),
  deleteMemberHandler
)

module.exports = router