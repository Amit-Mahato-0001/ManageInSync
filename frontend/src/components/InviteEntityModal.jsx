import { useState } from "react"
import { Rocket, X } from "lucide-react"

const InviteEntityModal = ({
  entityLabel,
  description,
  placeholder,
  onSubmit
}) => {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {

    setError("")
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {

    if (submitting) return

    setError("")
    setEmail("")
    setIsModalOpen(false)
  }

  const handleSubmit = async (e) => {

    e.preventDefault()

    const safeEmail = email.trim()

    if (!safeEmail) {
      setError(`${entityLabel} email required`)
      return
    }

    try {

      setSubmitting(true)
      setError("")

      await onSubmit(safeEmail)

      setEmail("")
      setIsModalOpen(false)

    } catch (submitError) {

      setError(submitError?.message || `Failed to Add ${entityLabel.toLowerCase()}`)

    } finally {

      setSubmitting(false)

    }

  }

  return (

    <>

      <button
        type="button"
        onClick={handleOpenModal}
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-2 text-sm font-medium text-white"
      >
        {`Add ${entityLabel}`}
        <Rocket size={16} />
      </button>

      {isModalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{`Add ${entityLabel}`}</h2>
                <p className="mt-1 text-sm text-white/50">{description}</p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
              >
                <X size={30} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>

                <label className="mb-2 block text-sm font-medium text-white/80">
                  {`${entityLabel} Email`}
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)

                    if (error) {
                      setError("")
                    }
                  }}
                  placeholder={placeholder}
                  autoFocus
                  className="w-full rounded-lg border border-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />

              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex items-center justify-end pt-2">

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  <Rocket size={16} />
                  {submitting ? "Adding..." : `Add ${entityLabel}`}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </>

  )
  
}

export default InviteEntityModal
