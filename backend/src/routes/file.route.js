const express = require("express")

const {
    createProjectUploadUrlHandler,
    completeProjectUploadHandler,
    deleteProjectFileHandler,
    listProjectFilesHandler,
    uploadProjectFileHandler,
    createProjectDownloadUrlHandler
} = require("../controllers/file.controller")

const requireRole = require("../middleware/rbac.middleware")
const validate = require("../middleware/validate.middleware")

const {
    createUploadUrlSchema,
    uploadUrlParamsSchema
} = require("../validators/file.validator")

const router = express.Router()

router.get(
    "/projects/:projectId/files",
    requireRole(["owner", "admin", "member"]),
    listProjectFilesHandler
)

router.post(
    "/projects/:projectId/files/upload-url",
    requireRole(["owner", "admin", "member"]),
    validate(uploadUrlParamsSchema, "params"),
    validate(createUploadUrlSchema, "body"),
    createProjectUploadUrlHandler
)

router.post(
    "/projects/:projectId/files/:fileId/complete",
    requireRole(["owner", "admin", "member"]),
    completeProjectUploadHandler
)

router.get(
    "/projects/:projectId/files/:fileId/download-url",
    requireRole(["owner", "admin", "member"]),
    createProjectDownloadUrlHandler
)

router.delete(
    "/projects/:projectId/files/:fileId",
    requireRole(["owner", "admin", "member"]),
    deleteProjectFileHandler
)

router.put(
    "/projects/:projectId/files/upload",
    requireRole(["owner", "admin", "member"]),
    express.raw({ type: "*/*", limit: "25mb" }),
    uploadProjectFileHandler
)

module.exports = router