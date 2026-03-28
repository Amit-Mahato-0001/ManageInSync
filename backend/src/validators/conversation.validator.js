const { z } = require("zod")
const { objectId } = require("./common.validator")

const projectConversationParamsSchema = z.object({
    projectId: objectId("projectId")
})

const conversationMessageParamsSchema = z.object({
    projectId: objectId("projectId"),
    messageId: objectId("messageId")
})

const sendMessageSchema = z.object({
    text: z
        .string()
        .trim()
        .min(1, "Message text is required")
        .max(2000, "Message must be at most 2000 characters")
})

const updateMessageSchema = sendMessageSchema

const listMessagesQuerySchema = z.object({
    cursor: objectId("cursor").optional(),
    limit: z.coerce.number().int().min(1).max(50).optional()
})

module.exports = {
    projectConversationParamsSchema,
    conversationMessageParamsSchema,
    sendMessageSchema,
    updateMessageSchema,
    listMessagesQuerySchema
}
