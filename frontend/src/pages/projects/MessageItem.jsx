const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit"
})

const formatTimestamp = (value) => {
  if (!value) return ""

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return timeFormatter.format(date)
}

const MessageItem = ({
  message,
  isOwnMessage,
  isEditing,
  editText,
  editError,
  setEditText,
  savingEdit,
  deletingMessageId,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onDelete
}) => {
  const senderEmail = message?.senderId?.email || "Unknown sender"

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`w-full max-w-2xl rounded-2xl border p-4 ${
          isOwnMessage
            ? "border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500"
            : "border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B]"
        }`}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-white">{senderEmail}</span>
              <span className="text-white/35">{formatTimestamp(message.createdAt)}</span>
              {message.editedAt && <span className="text-white/35">edited</span>}
            </div>

            {isOwnMessage && !isEditing && (
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => onStartEdit(message)}
                  className="text-white/60 transition hover:text-white"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(message._id)}
                  disabled={deletingMessageId === message._id}
                  className="text-white/60 transition hover:text-white disabled:opacity-60"
                >
                  {deletingMessageId === message._id ? "Deleting" : "Delete"}
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <textarea
                rows={3}
                maxLength={2000}
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                aria-invalid={Boolean(editError)}
                className={`w-full resize-none rounded-xl border bg-black/20 px-4 py-3 text-sm outline-none transition ${
                  editError
                    ? "border-red-400/80 focus:border-red-400"
                    : "border-white/10 focus:border-blue-500"
                }`}
              />

              {editError && (
                <p className="text-sm text-red-200">
                  {editError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="text-xs text-white/60 transition hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => onSubmitEdit(message._id)}
                    disabled={savingEdit || !editText.trim()}
                    className="text-xs text-white/60 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingEdit ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-white/85">
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageItem
