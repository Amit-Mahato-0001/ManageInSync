import { useState } from "react"
import { Rocket, X } from "lucide-react"
import toast from "react-hot-toast"

const CreateProjectForm = ({ onSubmit }) => {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleOpenCreateModal = () => {
    setName("")
    setDescription("")
    setTargetDate("")
    setError("")
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    if (submitting) return

    setName("")
    setDescription("")
    setTargetDate("")
    setError("")
    setIsCreateModalOpen(false)
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()

    const safeName = name.trim()
    const safeDescription = description.trim()

    if (!safeName) {
      setError("Project name is required")
      return
    }

    if (safeName.length < 3) {
      setError("Project name must be at least 3 characters")
      return
    }

    if (safeDescription && safeDescription.length < 2) {
      setError("Description must be at least 2 characters")
      return
    }

    try {
      setSubmitting(true)
      setError("")

      await toast.promise(onSubmit({
        name: safeName,
        description: safeDescription || undefined,
        targetDate: targetDate || undefined
      }), {
        loading: "Creating project...",
        success: "Project created",
        error: (err) => err?.message || "Failed to create project. Try again.",
      })

      setName("")
      setDescription("")
      setTargetDate("")
      setError("")
      setIsCreateModalOpen(false)
    } catch {
      return
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpenCreateModal}
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-2 text-sm font-medium text-white"
      >
        Create Project
        <Rocket size={16} />
      </button>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Create Project
                </h2>
                <p className="mt-1 text-sm text-white/50">
                  Add a new project to plan and manage your work
                </p>
              </div>

              <button type="button" onClick={handleCloseCreateModal}>
                <X size={30} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4" noValidate>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Project Name
                </label>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)

                    if (error) {
                      setError("")
                    }
                  }}
                  placeholder="Enter project name..."
                  className="w-full rounded-lg border border-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />

                {error && (
                  <p className="mt-2 text-sm text-red-400">
                    {error}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)

                    if (error) {
                      setError("")
                    }
                  }}
                  placeholder="Write a short project description..."
                  rows={4}
                  className="w-full rounded-lg border border-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Target Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => {
                    setTargetDate(e.target.value)

                    if (error) {
                      setError("")
                    }
                  }}
                  className="w-full rounded-lg border border-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  <Rocket size={16} />
                  {submitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default CreateProjectForm
