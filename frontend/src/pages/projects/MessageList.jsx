import MessageItem from "./MessageItem"

const MessageList = ({
  messages,
  loading,
  currentUserId,
  editingMessageId,
  editText,
  editError,
  setEditText,
  savingEdit,
  deletingMessageId,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onDelete,
  hasMore,
  onLoadOlder,
  loadingOlder,
  listRef,
  bottomRef
}) => {
  return (
    <div
      ref={listRef}
      className="min-h-0 flex-1 space-y-3 overflow-y-auto no-scrollbar p-4"
    >
      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onLoadOlder}
            disabled={loadingOlder}
            className="text-2xl text-white/50 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingOlder ? "Loading..." : "Load older messages"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="px-4 py-8 text-center text-2xl text-white/50">
          Loading conversation...
        </div>
      ) : messages.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-2xl text-white/50">No messages yet</p>
        </div>
      ) : (
        messages.map((message) => {
          const senderId =
            typeof message.senderId === "object" ? message.senderId?._id : message.senderId

          return (
            <MessageItem
              key={message._id}
              message={message}
              isOwnMessage={senderId === currentUserId}
              isEditing={editingMessageId === message._id}
              editText={editText}
              editError={editError}
              setEditText={setEditText}
              savingEdit={savingEdit}
              deletingMessageId={deletingMessageId}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onSubmitEdit={onSubmitEdit}
              onDelete={onDelete}
            />
          )
        })
      )}

      <div ref={bottomRef} />
    </div>
  )
}

export default MessageList
