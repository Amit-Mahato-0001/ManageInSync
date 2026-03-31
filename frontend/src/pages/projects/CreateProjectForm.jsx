import { useState } from "react"
import { Rocket, X } from "lucide-react"
import toast from "react-hot-toast"

const CreateProjectForm = ({ onSubmit }) => {
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleOpenCreateModal = () => {
    setName("")
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    if (submitting) return

    setName("")
    setIsCreateModalOpen(false)
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()

    const safeName = name.trim()

    //validation → toast
    if (!safeName) {
      toast.error("Project name is required")
      return
    }

    if (safeName.length < 3) {
      toast.error("Project name must be at least 3 characters")
      return
    }

    try {
      setSubmitting(true)

      //full async lifecycle handled by toast
      await toast.promise(onSubmit(safeName), {
        loading: "Creating project...",
        success: `Project "${safeName}" created successfully 🚀`,
        error: (err) =>
          err?.message || "Failed to create project. Try again.",
      })

      //reset + close
      setName("")
      setIsCreateModalOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpenCreateModal}
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-2 text-sm font-medium text-white"
      >
        Create Project
        <Rocket size={16} />
      </button>

      {/* Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-6">
            
            {/* Header */}
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

            {/* Form */}
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Project Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter project name..."
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