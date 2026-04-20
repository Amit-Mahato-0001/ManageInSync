const MessageComposer = ({
  value,
  error,
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
      <div className="flex-1">
        <textarea
          rows={2}
          maxLength={2000}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Write a message..."
          disabled={disabled || submitting}
          aria-invalid={Boolean(error)}
          className={`min-h-[48px] w-full resize-none rounded-xl border bg-transparent px-4 py-3 text-2xl outline-none transition disabled:opacity-60 ${
            error
              ? "border-red-400/80 focus:border-red-400"
              : "border-white/10 focus:border-blue-500"
          }`}
        />

        {error && (
          <p className="mt-2 text-2xl text-red-400">
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={disabled || submitting || isEmpty}
        className="h-12 rounded-xl border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-5 text-2xl font-medium text-white disabled:opacity-60"
      >
        {submitting ? "Sending..." : "Send"}
      </button>
    </form>
  )
}

export default MessageComposer
