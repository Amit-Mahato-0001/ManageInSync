const MessageComposer = ({
  value,
  onChange,
  onSubmit,
  disabled,
  submitting
}) => {
  const isEmpty = !value.trim()

  return (
    <form
      onSubmit={onSubmit}
      className="flex items-end gap-3 border-white/10 p-4"
    >
      <textarea
        rows={2}
        maxLength={2000}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Write a message..."
        disabled={disabled || submitting}
        className="min-h-[48px] flex-1 resize-none rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-blue-500 disabled:opacity-60"
      />

      <button
        type="submit"
        disabled={disabled || submitting || isEmpty}
        className="h-12 rounded-xl border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-5 text-sm font-medium text-white disabled:opacity-60"
      >
        {submitting ? "Sending..." : "Send"}
      </button>
    </form>
  )
}

export default MessageComposer