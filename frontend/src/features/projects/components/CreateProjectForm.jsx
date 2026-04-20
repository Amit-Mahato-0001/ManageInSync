import { useState } from "react"
import { Plus, X } from "lucide-react"
import {
  isValidationError,
  runAsyncToast,
  splitValidationErrors
} from "../utils/projectModuleUtils"

const CreateProjectForm = ({ onSubmit }) => {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleOpenCreateModal = () => {
    setName("")
    setDescription("")
    setTargetDate("")
    setFieldErrors({})
    setFormError("")
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    if (submitting) return

    setName("")
    setDescription("")
    setTargetDate("")
    setFieldErrors({})
    setFormError("")
    setIsCreateModalOpen(false)
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setFieldErrors({})
      setFormError("")

      await runAsyncToast(
        () =>
          onSubmit({
            name: name.trim(),
            description: description.trim() || undefined,
            targetDate: targetDate || undefined
          }),
        {
          loadingMessage: "Creating project...",
          successMessage: "Project created",
          fallbackError: "Failed to create project. Try again.",
          suppressErrorToast: isValidationError
        }
      )

      setName("")
      setDescription("")
      setTargetDate("")
      setFieldErrors({})
      setFormError("")
      setIsCreateModalOpen(false)
    } catch (error) {
      if (isValidationError(error)) {
        const { fieldErrors: nextFieldErrors, formError: nextFormError } = splitValidationErrors(error)

        setFieldErrors(nextFieldErrors)
        setFormError(nextFormError)
      }

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
        className="inline-flex items-center gap-4 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-2 font-medium text-white"
      >
        Create Project
        <Plus className="h-6 w-6" />
      </button>

      {isCreateModalOpen && (
        <div className="h-full fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Create Project
                </h2>
                <p className="mt-1 text-2xl text-white/50">
                  Add a new project to plan and manage your work
                </p>
              </div>

              <button type="button" onClick={handleCloseCreateModal}>
                <X className="h-12 w-12" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4" noValidate>
              <div>
                <label className="mb-2 block text-2xl font-medium text-white/80">
                  Project Name
                </label>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setFieldErrors((prev) => ({ ...prev, name: "" }))
                    setFormError("")
                  }}
                  placeholder="Enter project name..."
                  aria-invalid={Boolean(fieldErrors.name)}
                  className={`w-full rounded-lg border px-4 py-3 text-2xl text-white outline-none transition bg-transparent ${
                    fieldErrors.name
                      ? "border-red-400/80 focus:border-red-400"
                      : "border-white/10 focus:border-blue-500"
                  }`}
                />

                {fieldErrors.name && (
                  <p className="mt-2 text-2xl text-red-400">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-2xl font-medium text-white/80">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    setFieldErrors((prev) => ({ ...prev, description: "" }))
                    setFormError("")
                  }}
                  placeholder="Write a short project description..."
                  rows={4}
                  aria-invalid={Boolean(fieldErrors.description)}
                  className={`w-full rounded-lg border px-4 py-3 text-2xl text-white outline-none transition bg-transparent ${
                    fieldErrors.description
                      ? "border-red-400/80 focus:border-red-400"
                      : "border-white/10 focus:border-blue-500"
                  }`}
                />

                {fieldErrors.description && (
                  <p className="mt-2 text-2xl text-red-400">
                    {fieldErrors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-2xl font-medium text-white/80">
                  Target Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => {
                    setTargetDate(e.target.value)
                    setFieldErrors((prev) => ({ ...prev, targetDate: "" }))
                    setFormError("")
                  }}
                  aria-invalid={Boolean(fieldErrors.targetDate)}
                  className={`w-full rounded-lg border px-4 py-3 text-2xl text-white outline-none transition bg-transparent ${
                    fieldErrors.targetDate
                      ? "border-red-400/80 focus:border-red-400"
                      : "border-white/10 focus:border-blue-500"
                  }`}
                />

                {fieldErrors.targetDate && (
                  <p className="mt-2 text-2xl text-red-400">
                    {fieldErrors.targetDate}
                  </p>
                )}
              </div>

              {formError && (
                <p className="text-2xl text-red-400">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-4 rounded-xl border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-2 text-2xl font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  <Plus className="h-6 w-6" />
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
