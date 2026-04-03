const mongoose = require("mongoose")
const Conversation = require("../models/conversation.model")
const Message = require("../models/message.model")
const canAccessProject = require("../utils/canAccessProject")

const makeError = (message, status = 400) => {
    const error = new Error(message)
    error.status = status
    return error
}

const toObjectId = (value, fieldName) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        throw makeError(`Invalid ${fieldName}`, 400)
    }

    return new mongoose.Types.ObjectId(value)
}

const sanitizeText = (text) => {
    
    const safeText = typeof text === "string" ? text.trim() : ""

    if (!safeText) {
        throw makeError("Message text is required", 400)
    }

    if (safeText.length > 2000) {
        throw makeError("Message text must be at most 2000 characters", 400)
    }

    return safeText
}

const getUnreadCount = async ({ conversationId, tenantId, userId }) => {

    return Message.countDocuments({

        conversationId: toObjectId(conversationId, "conversationId"),
        tenantId: toObjectId(tenantId, "tenantId"),
        deletedAt: null,
        senderId: { $ne: toObjectId(userId, "userId") },
        readBy: {
            $not: {
                $elemMatch: {
                    userId: toObjectId(userId, "userId")
                }
            }
        }
    })
}

const getOrCreateProjectConversation = async (projectId, user, tenantId) => {

    await canAccessProject({

        projectId,
        userId: user._id,
        role: user.role,
        tenantId

    })

    const tenantObjectId = toObjectId(tenantId, "tenantId")
    const projectObjectId = toObjectId(projectId, "projectId")

    let conversation = await Conversation.findOne({

        tenantId: tenantObjectId,
        projectId: projectObjectId,
        deletedAt: null

    })

    if (!conversation) {

        conversation = await Conversation.create({

            tenantId: tenantObjectId,
            projectId: projectObjectId,
            createdBy: user._id,
            lastMessageAt: new Date()

        })
    }

    const unreadCount = await getUnreadCount({

        conversationId: conversation._id,
        tenantId,
        userId: user._id

    })

    return { conversation, unreadCount }
}

const listProjectMessages = async (conversationId, tenantId, limit, cursor) => {

    const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50))
    const tenantObjectId = toObjectId(tenantId, "tenantId")
    const conversationObjectId = toObjectId(conversationId, "conversationId")

    const conversation = await Conversation.findOne({

        _id: conversationObjectId,
        tenantId: tenantObjectId,
        deletedAt: null

    }).select("_id")

    if (!conversation) {
        throw makeError("Conversation not found", 404)
    }

    const query = {

        tenantId: tenantObjectId,
        conversationId: conversationObjectId,
        deletedAt: null

    }

    if (cursor) {

        query._id = { $lt: toObjectId(cursor, "cursor") }

    }

    const messages = await Message.find(query)
        .sort({ _id: -1 })
        .limit(safeLimit)
        .populate("senderId", "email role")
        .lean()

    const nextCursor =
        messages.length === safeLimit ? messages[messages.length - 1]._id : null

    return {

        data: messages,

        pagination: {
            limit: safeLimit,
            nextCursor
        }

    }
}

const sendMessage = async (
    conversationId,
    projectId,
    tenantId,
    senderId,
    text
) => {
    const safeText = sanitizeText(text)
    const tenantObjectId = toObjectId(tenantId, "tenantId")
    const conversationObjectId = toObjectId(conversationId, "conversationId")
    const projectObjectId = toObjectId(projectId, "projectId")
    const senderObjectId = toObjectId(senderId, "senderId")
    const now = new Date()

    const conversation = await Conversation.findOne({
        _id: conversationObjectId,
        tenantId: tenantObjectId,
        projectId: projectObjectId,
        deletedAt: null
    })

    if (!conversation) {
        throw makeError("Conversation not found", 404)
    }

    const message = await Message.create({
        tenantId: tenantObjectId,
        projectId: projectObjectId,
        conversationId: conversationObjectId,
        senderId: senderObjectId,
        text: safeText,
        readBy: [{ userId: senderObjectId, seenAt: now }]
    })

    conversation.lastMessageAt = now
    await conversation.save()

    return Message.findById(message._id).populate("senderId", "email role")
}

const editMessage = async (messageId, senderId, text, projectId, tenantId) => {

    const safeText = sanitizeText(text)
    const messageObjectId = toObjectId(messageId, "messageId")
    const senderObjectId = toObjectId(senderId, "senderId")
    const projectObjectId = toObjectId(projectId, "projectId")
    const tenantObjectId = toObjectId(tenantId, "tenantId")

    const message = await Message.findOne({
        _id: messageObjectId,
        senderId: senderObjectId,
        projectId: projectObjectId,
        tenantId: tenantObjectId,
        deletedAt: null
    })

    if (!message) {
        throw makeError("Message not found or access denied", 404)
    }

    message.text = safeText
    message.editedAt = new Date()
    await message.save()

    return Message.findById(message._id).populate("senderId", "email role")
}

const deleteMessage = async (messageId, actor, projectId, tenantId) => {

    const messageObjectId = toObjectId(messageId, "messageId")
    const projectObjectId = toObjectId(projectId, "projectId")
    const tenantObjectId = toObjectId(tenantId, "tenantId")

    const message = await Message.findOne({
        _id: messageObjectId,
        projectId: projectObjectId,
        tenantId: tenantObjectId,
        deletedAt: null
    })

    if (!message) {
        throw makeError("Message not found", 404)
    }

    if (message.senderId.toString() !== actor._id.toString()) {
        throw makeError("Only sender can delete this message", 403)
    }

    message.deletedAt = new Date()
    await message.save()

    const latestMessage = await Message.findOne({
        tenantId: message.tenantId,
        conversationId: message.conversationId,
        deletedAt: null
    })
        .sort({ _id: -1 })
        .select("createdAt")

    const conversation = await Conversation.findOne({
        _id: message.conversationId,
        tenantId: message.tenantId,
        deletedAt: null
    })

    if (conversation) {
        conversation.lastMessageAt = latestMessage
            ? latestMessage.createdAt
            : conversation.createdAt
        await conversation.save()
    }

    return {
        _id: message._id,
        deletedAt: message.deletedAt
    }
}

const markAsRead = async (conversationId, userId, tenantId) => {

    const conversationObjectId = toObjectId(conversationId, "conversationId")
    const userObjectId = toObjectId(userId, "userId")
    const tenantObjectId = toObjectId(tenantId, "tenantId")

    const conversation = await Conversation.findOne({
        _id: conversationObjectId,
        tenantId: tenantObjectId,
        deletedAt: null
    }).select("_id")

    if (!conversation) {

        throw makeError("Conversation not found", 404)

    }

    const now = new Date()

    const result = await Message.updateMany(

        {
            conversationId: conversationObjectId,
            tenantId: tenantObjectId,
            deletedAt: null,
            senderId: { $ne: userObjectId },
            readBy: {
                $not: {
                    $elemMatch: {
                        userId: userObjectId
                    }
                }
            }
        },

        {
            $push: {
                readBy: {
                    userId: userObjectId,
                    seenAt: now
                }
            }
        }
    )

    return { updatedCount: result.modifiedCount || 0 }
}

module.exports = {
    getOrCreateProjectConversation,
    listProjectMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead
}