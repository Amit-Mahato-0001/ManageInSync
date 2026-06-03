const express = require("express")

const {
    createProjectUploadUrlHandler
} = require("../controllers/file.controller")
const requireRole = require("../middleware/rbac.middleware")
const validate = require("../middleware/validate.middleware")
const {
    createUploadUrlSchema,
    uploadUrlParamsSchema
} = require("../validators/file.validator")

const router = express.Router()

router.post(
    "/projects/:projectId/files/upload-url",
    requireRole(["owner", "admin", "member"]),
    validate(uploadUrlParamsSchema, "params"),
    validate(createUploadUrlSchema, "body"),
    createProjectUploadUrlHandler
)

module.exports = router
