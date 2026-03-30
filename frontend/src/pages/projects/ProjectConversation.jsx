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
import { useAuth } from "../../context/AuthContext"
import MessageComposer from "./MessageComposer"
import MessageList from "./MessageList"

const POLL_INTERVAL_MS = 6000

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.error || error?.response?.data?.message || fallback
}

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
    ? "rounded-lg bg-white px-4 py-2 text-sm font-medium border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500"
    : "px-4 py-2 text-sm font-medium"
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
  const [olderCursor, setOlderCursor] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editText, setEditText] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingMessageId, setDeletingMessageId] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const listRef = useRef(null)
  const bottomRef = useRef(null)
  const messagesRef = useRef([])
  const scrollBehaviorRef = useRef("")

  const currentUserId = user?.userId
  const canViewTasks = user?.role !== "client"
  const projectName = state?.projectName || "Project"
  const projectStatus = state?.projectStatus
  const projectRouteState = {
    projectName,
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
      return
    }

    try {
      setSubmitting(true)
      setError("")

      const response = await sendConversationMessage(projectId, safeText)
      const nextMessage = response.data?.data
      const mergedMessages = mergeMessages(messagesRef.current, nextMessage ? [nextMessage] : [])

      messagesRef.current = mergedMessages
      setMessages(mergedMessages)
      setComposerText("")
      setUnreadCount(0)
      scheduleScrollToBottom("smooth")
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to send message"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartEdit = (message) => {
    setEditingMessageId(message._id)
    setEditText(message.text)
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditText("")
  }

  const handleSubmitEdit = async (messageId) => {
    const safeText = editText.trim()

    if (!safeText) {
      setError("Message text is required")
      return
    }

    try {
      setSavingEdit(true)
      setError("")

      const response = await editConversationMessage(projectId, messageId, safeText)
      const updatedMessage = response.data?.data
      const mergedMessages = mergeMessages(
        messagesRef.current.filter((message) => message._id !== messageId),
        updatedMessage ? [updatedMessage] : []
      )

      messagesRef.current = mergedMessages
      setMessages(mergedMessages)
      handleCancelEdit()
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to edit message"))
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Delete this message?")) return

    try {
      setDeletingMessageId(messageId)
      setError("")

      await deleteConversationMessage(projectId, messageId)

      const remainingMessages = messagesRef.current.filter((message) => message._id !== messageId)

      messagesRef.current = remainingMessages
      setMessages(remainingMessages)

      if (editingMessageId === messageId) {
        handleCancelEdit()
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to delete message"))
    } finally {
      setDeletingMessageId(null)
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
          <ArrowLeft size={30} />
        </Link>

        <div>
          <h1 className="text-2xl font-semibold">{projectName}</h1>
          <p className="text-sm text-white/60">Collaborate, share updates, and stay aligned with your team</p>
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

        {unreadCount > 0 && (
          <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-300">
            {unreadCount} unread
          </span>
        )}
      </div>
    </div>

    {error && <p className="text-sm text-red-400">{error}</p>}

    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <MessageList
        messages={messages}
        loading={loading}
        currentUserId={currentUserId}
        editingMessageId={editingMessageId}
        editText={editText}
        setEditText={setEditText}
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
        onChange={setComposerText}
        onSubmit={handleSendMessage}
        disabled={loading}
        submitting={submitting}
      />
    </div>
  </div>
)
}

export default ProjectConversation
