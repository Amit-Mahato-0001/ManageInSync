import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import {
  deleteMessage as deleteConversationMessage,
  editMessage as editConversationMessage,
  getConversation,
  getMessages,
  markConversationRead,
  sendMessage as sendConversationMessage
} from "../../api/conversations"
import { useAuth } from "../../context/useAuth"
import MessageComposer from "./MessageComposer"
import MessageList from "./MessageList"
import {
  getErrorMessage,
  isValidationError,
  runAsyncToast,
  splitValidationErrors
} from "./projectModuleUtils"

const POLL_INTERVAL_MS = 6000

const sortMessages = (messages) => {
  return [...messages].sort((firstMessage, secondMessage) => {
    return new Date(firstMessage.createdAt).getTime() - new Date(secondMessage.createdAt).getTime()
  })
}

const mergeMessages = (currentMessages, incomingMessages) => {
  const messageMap = new Map()

  ;[...currentMessages, ...incomingMessages].forEach((message) => {
    if (message?._id) {
      messageMap.set(message._id, message)
    }
  })

  return sortMessages(Array.from(messageMap.values()))
}

const getTabClassName = (active) => {
  return active
    ? "rounded-lg bg-white px-4 py-2 text-2xl font-medium border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500"
    : "px-4 py-2 text-2xl font-medium"
}

const ProjectConversation = () => {
  const { projectId } = useParams()
  const { state } = useLocation()
  const { user } = useAuth()

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [error, setError] = useState("")
  const [composerText, setComposerText] = useState("")
  const [composerError, setComposerError] = useState("")
  const [olderCursor, setOlderCursor] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editText, setEditText] = useState("")
  const [editError, setEditError] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingMessageId, setDeletingMessageId] = useState(null)
  const [_unreadCount, setUnreadCount] = useState(0)

  const listRef = useRef(null)
  const bottomRef = useRef(null)
  const messagesRef = useRef([])
  const scrollBehaviorRef = useRef("")

  const currentUserId = user?.userId
  const canViewTasks = user?.role !== "client"
  const projectName = state?.projectName || "Project"
  const projectDescription = state?.projectDescription || ""
  const projectTargetDate = state?.projectTargetDate || ""
  const projectStatus = state?.projectStatus
  const projectRouteState = {
    projectName,
    projectDescription,
    projectTargetDate,
    projectStatus,
    unreadCount: 0
  }

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const scheduleScrollToBottom = useCallback((behavior) => {
    scrollBehaviorRef.current = behavior
  }, [])

  useEffect(() => {
    if (!scrollBehaviorRef.current) return

    const nextBehavior = scrollBehaviorRef.current
    scrollBehaviorRef.current = ""

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: nextBehavior,
        block: "end"
      })
    })
  }, [messages])

  const isNearBottom = useCallback(() => {
    const element = listRef.current

    if (!element) {
      return true
    }

    return element.scrollHeight - element.scrollTop - element.clientHeight < 120
  }, [])

  const syncReadState = useCallback(async () => {
    try {
      await markConversationRead(projectId)
      setUnreadCount(0)
    } catch {
      return
    }
  }, [projectId])

  const loadInitialConversation = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      setEditingMessageId(null)
      setEditText("")
      setEditError("")
      setComposerError("")

      const [conversationResponse, messagesResponse] = await Promise.all([
        getConversation(projectId),
        getMessages(projectId, null, 20)
      ])

      const latestMessages = Array.isArray(messagesResponse.data?.messages?.data)
        ? messagesResponse.data.messages.data
        : []
      const sortedMessages = sortMessages(latestMessages)

      messagesRef.current = sortedMessages
      setMessages(sortedMessages)
      setOlderCursor(messagesResponse.data?.messages?.pagination?.nextCursor || null)
      setUnreadCount(conversationResponse.data?.unreadCount || 0)
      scheduleScrollToBottom("auto")

      await syncReadState()
    } catch (requestError) {
      messagesRef.current = []
      setMessages([])
      setOlderCursor(null)
      setError(getErrorMessage(requestError, "Failed to load conversation"))
    } finally {
      setLoading(false)
    }
  }, [projectId, scheduleScrollToBottom, syncReadState])

  const pollLatestMessages = useCallback(async () => {
    try {
      const response = await getMessages(projectId, null, 20)
      const latestMessages = Array.isArray(response.data?.messages?.data)
        ? response.data.messages.data
        : []

      const hasNewMessages = latestMessages.some((message) => {
        return !messagesRef.current.some((existingMessage) => existingMessage._id === message._id)
      })
      const shouldScroll = hasNewMessages && isNearBottom()
      const mergedMessages = mergeMessages(messagesRef.current, latestMessages)

      messagesRef.current = mergedMessages
      setMessages(mergedMessages)

      if (shouldScroll) {
        scheduleScrollToBottom("smooth")
      }

      await syncReadState()
    } catch (requestError) {
      if (!messagesRef.current.length) {
        setError(getErrorMessage(requestError, "Failed to refresh conversation"))
      }
    }
  }, [isNearBottom, projectId, scheduleScrollToBottom, syncReadState])

  useEffect(() => {
    loadInitialConversation()
  }, [loadInitialConversation])

  useEffect(() => {
    if (loading) return undefined

    const intervalId = window.setInterval(() => {
      pollLatestMessages()
    }, POLL_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [loading, pollLatestMessages])

  const handleLoadOlder = async () => {
    if (!olderCursor || loadingOlder) return

    try {
      setLoadingOlder(true)
      setError("")

      const listElement = listRef.current
      const previousScrollHeight = listElement?.scrollHeight || 0
      const previousScrollTop = listElement?.scrollTop || 0

      const response = await getMessages(projectId, olderCursor, 20)
      const olderMessages = Array.isArray(response.data?.messages?.data)
        ? response.data.messages.data
        : []
      const mergedMessages = mergeMessages(messagesRef.current, olderMessages)

      messagesRef.current = mergedMessages
      setMessages(mergedMessages)
      setOlderCursor(response.data?.messages?.pagination?.nextCursor || null)

      requestAnimationFrame(() => {
        if (!listElement) return

        const scrollDelta = listElement.scrollHeight - previousScrollHeight
        listElement.scrollTop = previousScrollTop + scrollDelta
      })
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load older messages"))
    } finally {
      setLoadingOlder(false)
    }
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()

    const safeText = composerText.trim()

    if (!safeText) {
      setComposerError("Message text is required")
      return
    }

    try {
      setSubmitting(true)
      setError("")
      setComposerError("")

      const response = await runAsyncToast(
        () => sendConversationMessage(projectId, safeText),
        {
          loadingMessage: "Sending message...",
          successMessage: "Message sent",
          fallbackError: "Failed to send message",
          suppressErrorToast: isValidationError
        }
      )
      const nextMessage = response.data?.data
      const mergedMessages = mergeMessages(messagesRef.current, nextMessage ? [nextMessage] : [])

      messagesRef.current = mergedMessages
      setMessages(mergedMessages)
      setComposerText("")
      setComposerError("")
      setUnreadCount(0)
      scheduleScrollToBottom("smooth")
    } catch (requestError) {
      if (isValidationError(requestError)) {
        const { fieldErrors, formError } = splitValidationErrors(requestError)

        setComposerError(fieldErrors.text || formError || "Message text is required")
      }

      return
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartEdit = (message) => {
    setEditingMessageId(message._id)
    setEditText(message.text)
    setEditError("")
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditText("")
    setEditError("")
  }

  const handleSubmitEdit = async (messageId) => {
    const safeText = editText.trim()

    if (!safeText) {
      setEditError("Message text is required")
      return
    }

    try {
      setSavingEdit(true)
      setError("")
      setEditError("")

      const response = await runAsyncToast(
        () => editConversationMessage(projectId, messageId, safeText),
        {
          loadingMessage: "Saving message...",
          successMessage: "Message updated",
          fallbackError: "Failed to edit message",
          suppressErrorToast: isValidationError
        }
      )
      const updatedMessage = response.data?.data
      const mergedMessages = mergeMessages(
        messagesRef.current.filter((message) => message._id !== messageId),
        updatedMessage ? [updatedMessage] : []
      )

      messagesRef.current = mergedMessages
      setMessages(mergedMessages)
      handleCancelEdit()
    } catch (requestError) {
      if (isValidationError(requestError)) {
        const { fieldErrors, formError } = splitValidationErrors(requestError)

        setEditError(fieldErrors.text || formError || "Message text is required")
      }

      return
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Delete this message?")) return

    try {
      setDeletingMessageId(messageId)
      setError("")

      await runAsyncToast(
        () => deleteConversationMessage(projectId, messageId),
        {
          loadingMessage: "Deleting message...",
          successMessage: "Message deleted",
          fallbackError: "Failed to delete message"
        }
      )

      const remainingMessages = messagesRef.current.filter((message) => message._id !== messageId)

      messagesRef.current = remainingMessages
      setMessages(remainingMessages)

      if (editingMessageId === messageId) {
        handleCancelEdit()
      }
    } catch {
      return
    } finally {
      setDeletingMessageId(null)
    }
  }

  const handleComposerChange = (value) => {
    setComposerText(value)

    if (composerError) {
      setComposerError("")
    }
  }

  const handleEditTextChange = (value) => {
    setEditText(value)

    if (editError) {
      setEditError("")
    }
  }

  return (
    <div className="flex h-[calc(100vh-9.5rem)] min-h-0 flex-col gap-6 overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 "
          >
            <ArrowLeft className="h-12 w-12" />
          </Link>

          <div>
            <h1 className="text-5xl font-semibold">{projectName}</h1>
            <p className="text-2xl text-white/60">Collaborate, share updates, and stay aligned with your team</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canViewTasks && (
            <Link
              to={`/projects/${projectId}/tasks`}
              state={projectRouteState}
              className={getTabClassName(false)}
            >
              Tasks
            </Link>
          )}

          <Link
            to={`/projects/${projectId}/conversation`}
            state={projectRouteState}
            className={getTabClassName(true)}
          >
            Conversation
          </Link>
        </div>
      </div>

      {error && <p className="text-2xl text-red-400">{error}</p>}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <MessageList
          messages={messages}
          loading={loading}
          currentUserId={currentUserId}
          editingMessageId={editingMessageId}
          editText={editText}
          editError={editError}
          setEditText={handleEditTextChange}
          savingEdit={savingEdit}
          deletingMessageId={deletingMessageId}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onSubmitEdit={handleSubmitEdit}
          onDelete={handleDeleteMessage}
          hasMore={Boolean(olderCursor)}
          onLoadOlder={handleLoadOlder}
          loadingOlder={loadingOlder}
          listRef={listRef}
          bottomRef={bottomRef}
        />

        <MessageComposer
          value={composerText}
          error={composerError}
          onChange={handleComposerChange}
          onSubmit={handleSendMessage}
          disabled={loading}
          submitting={submitting}
        />
      </div>
    </div>
  )
}

export default ProjectConversation
