const express = require("express")

const {
    createProjectHandler,
    getProjectHandler,
    deleteProjectHandler,
    assignClientHandler,
    updateProjectStatusHandler,
    assignMemberHandler
} = require("../controllers/project.controller")

const {
    createTaskHandler,
    getTasksHandler,
    deleteTaskHandler
} = require("../controllers/task.controller")

const {
    getProjectConversationHandler,
    getProjectMessagesHandler,
    sendProjectMessageHandler,
    editProjectMessageHandler,
    deleteProjectMessageHandler,
    markProjectConversationReadHandler
} = require("../controllers/conversation.controller")

const requireRole = require("../middleware/rbac.middleware")
const buildMessageRateLimit = require("../middleware/messageRateLimit.middleware")
const validate = require("../middleware/validate.middleware")

const {
    createProjectSchema,
    projectIdParamsSchema,
    deleteProjectSchema,
    assignProjectSchema,
    updateProjectStatusSchema,
    assignMemberSchema
} = require("../validators/project.validator")

const {
    createTaskSchema,
    projectTaskParamsSchema,
    deleteTaskSchema
} = require("../validators/task.validator")

const {
    projectConversationParamsSchema,
    conversationMessageParamsSchema,
    sendMessageSchema,
    updateMessageSchema,
    listMessagesQuerySchema
} = require("../validators/conversation.validator")

const router = express.Router()
const messageRateLimit = buildMessageRateLimit({ windowMs: 60000, max: 20 })

router.post(
    "/",
    requireRole(["owner", "admin", "member"]),
    validate(createProjectSchema, "body"),
    createProjectHandler
)

router.get(
    "/",
    requireRole(["owner", "admin", "member", "client"]),
    getProjectHandler
)

router.delete(
    "/:projectId",
    requireRole(["owner", "admin"]),
    validate(deleteProjectSchema, "params"),
    deleteProjectHandler
)

router.put(
    "/:projectId/assign-client",
    requireRole(["owner", "admin"]),
    validate(projectIdParamsSchema, "params"),
    validate(assignProjectSchema, "body"),
    assignClientHandler
)

router.patch(
    "/:projectId/status",
    requireRole(["owner", "admin", "member"]),
    validate(projectIdParamsSchema, "params"),
    validate(updateProjectStatusSchema, "body"),
    updateProjectStatusHandler
)

router.put(
    "/:projectId/assign-member",
    requireRole(["owner", "admin"]),
    validate(projectIdParamsSchema, "params"),
    validate(assignMemberSchema, "body"),
    assignMemberHandler
)

router.post(
    "/:projectId/tasks",
    requireRole(["owner", "admin"]),
    validate(projectTaskParamsSchema, "params"),
    validate(createTaskSchema, "body"),
    createTaskHandler
)

router.get(
    "/:projectId/tasks",
    requireRole(["owner", "admin", "member"]),
    validate(projectTaskParamsSchema, "params"),
    getTasksHandler
)

router.delete(
    "/:projectId/tasks/:taskId",
    requireRole(["owner", "admin"]),
    validate(deleteTaskSchema, "params"),
    deleteTaskHandler
)

router.get(
    "/:projectId/conversation",
    requireRole(["owner", "admin", "member", "client"]),
    validate(projectConversationParamsSchema, "params"),
    getProjectConversationHandler
)

router.get(
    "/:projectId/conversation/messages",
    requireRole(["owner", "admin", "member", "client"]),
    validate(projectConversationParamsSchema, "params"),
    validate(listMessagesQuerySchema, "query"),
    getProjectMessagesHandler
)

router.post(
    "/:projectId/conversation/messages",
    requireRole(["owner", "admin", "member", "client"]),
    validate(projectConversationParamsSchema, "params"),
    validate(sendMessageSchema, "body"),
    messageRateLimit,
    sendProjectMessageHandler
)

router.patch(
    "/:projectId/conversation/messages/:messageId",
    requireRole(["owner", "admin", "member", "client"]),
    validate(conversationMessageParamsSchema, "params"),
    validate(updateMessageSchema, "body"),
    editProjectMessageHandler
)

router.delete(
    "/:projectId/conversation/messages/:messageId",
    requireRole(["owner", "admin", "member", "client"]),
    validate(conversationMessageParamsSchema, "params"),
    deleteProjectMessageHandler
)

router.post(
    "/:projectId/conversation/read",
    requireRole(["owner", "admin", "member", "client"]),
    validate(projectConversationParamsSchema, "params"),
    markProjectConversationReadHandler
)

module.exports = router
