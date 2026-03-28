const {
    getOrCreateProjectConversation,
    listProjectMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead
} = require("../services/conversation.service")

const canAccessProject = require("../utils/canAccessProject")

const getProjectConversationHandler = async (req, res, next) => {

    try {
        const { projectId } = req.params

        const result = await getOrCreateProjectConversation(

            projectId,
            req.user,
            req.tenantId

        )

        return res.status(200).json(result)

    } catch (error) {

        next(error)

    }
}

const getProjectMessagesHandler = async (req, res, next) => {

    try {

        const { projectId } = req.params
        const { limit, cursor } = req.query

        const { conversation } = await getOrCreateProjectConversation(

            projectId,
            req.user,
            req.tenantId
        )

        const messages = await listProjectMessages(

            conversation._id,
            req.tenantId,
            limit,
            cursor
        )

        return res.status(200).json({

            conversationId: conversation._id,
            messages
        })

    } catch (error) {

        next(error)

    }
}

const sendProjectMessageHandler = async (req, res, next) => {

    try {

        const { projectId } = req.params
        const { text } = req.body

        const { conversation } = await getOrCreateProjectConversation(

            projectId,
            req.user,
            req.tenantId

        )

        const message = await sendMessage(

            conversation._id,
            projectId,
            req.tenantId,
            req.user._id,
            text

        )

        return res.status(201).json({

            message: "Message sent",
            data: message
        })

    } catch (error) {

        next(error)

    }

}

const editProjectMessageHandler = async (req, res, next) => {

    try {

        const { projectId, messageId } = req.params
        const { text } = req.body

        await canAccessProject({

            projectId,
            userId: req.user._id,
            role: req.user.role,
            tenantId: req.tenantId
        })

        const message = await editMessage(

            messageId,
            req.user._id,
            text,
            projectId,
            req.tenantId

        )

        return res.status(200).json({

            message: "Message edited",
            data: message

        })

    } catch (error) {

        next(error)

    }

}

const deleteProjectMessageHandler = async (req, res, next) => {

    try {

        const { projectId, messageId } = req.params

        await canAccessProject({

            projectId,
            userId: req.user._id,
            role: req.user.role,
            tenantId: req.tenantId

        })

        const message = await deleteMessage(

            messageId,
            req.user,
            projectId,
            req.tenantId

        )

        return res.status(200).json({

            message: "Message deleted",
            data: message
        })

    } catch (error) {

        next(error)

    }

}

const markProjectConversationReadHandler = async (req, res, next) => {

    try {

        const { projectId } = req.params

        const { conversation } = await getOrCreateProjectConversation(

            projectId,
            req.user,
            req.tenantId

        )

        const result = await markAsRead(conversation._id, req.user._id, req.tenantId)

        return res.status(200).json({

            message: "Conversation marked as read",
            ...result
        })

    } catch (error) {

        next(error)

    }
}

module.exports = {

    getProjectConversationHandler,
    getProjectMessagesHandler,
    sendProjectMessageHandler,
    editProjectMessageHandler,
    deleteProjectMessageHandler,
    markProjectConversationReadHandler
}
