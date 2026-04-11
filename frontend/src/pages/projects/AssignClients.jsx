import { useEffect, useState } from "react"
import {
  isValidationError,
  runAsyncToast,
  splitValidationErrors
} from "./projectModuleUtils"

const getValidSelectedIds = (selectedIds = [], items = []) => {
  const validIdSet = new Set(items.map((item) => item._id))
  const seenIds = new Set()

  return (selectedIds || []).filter((id) => {
    if (!validIdSet.has(id) || seenIds.has(id)) {
      return false
    }

    seenIds.add(id)
    return true
  })
}

const hasSameSelection = (currentValues = [], nextValues = []) => {
  if (currentValues.length !== nextValues.length) {
    return false
  }

  const sortedCurrentValues = [...currentValues].sort()
  const sortedNextValues = [...nextValues].sort()

  return sortedCurrentValues.every((value, index) => value === sortedNextValues[index])
}

const AssignClients = ({
  p,
  clients,
  openClientDropdown,
  setOpenClientDropdown,
  selectedClients,
  setSelectedClients,
  assignClient,
  loadProjects,
  page,
  setPage
}) => {

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const isOpen = openClientDropdown === p._id

  useEffect(() => {

    if (isOpen) {
      const validProjectClientIds = getValidSelectedIds(p.clients, clients)

      setSelectedClients((prev) => ({
        ...prev,
        [p._id]: validProjectClientIds,
      }))

      setFormError("")
    }
    
  }, [clients, isOpen, p._id, p.clients, setSelectedClients])

  if (!isOpen) return null

  return (

    <div className="absolute mt-3 w-[calc(100vw-2rem)] max-w-[28rem] rounded-lg bg-[#18181B] border border-white/10 p-3 z-10">

      <div className="max-h-40 overflow-y-auto no-scrollbar space-y-2">

        {clients.map((c) => (

          <label key={c._id} className="flex gap-2 text-2xl">

            <input
              type="checkbox"
              checked={selectedClients[p._id]?.includes(c._id) || false}

              onChange={() => {
                setFormError("")

                setSelectedClients((prev) => {
                  const arr = prev[p._id] || []

                  return {

                    ...prev,
                    [p._id]: arr.includes(c._id)
                      ? arr.filter((id) => id !== c._id)
                      : [...arr, c._id],
                  }

                })

              }}

            />

            {c.email}

          </label>

        ))}

      </div>

      <button

        className="text-2xl mt-3 w-full py-2 rounded-md border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={saving}
        onClick={async () => {
          const finalClients = getValidSelectedIds(selectedClients[p._id], clients)

          if (hasSameSelection(p.clients || [], finalClients)) {

            setOpenClientDropdown(null)
            return

          }

          try {
            setSaving(true)
            setFormError("")

            await runAsyncToast(
              async () => {
                await assignClient(p._id, finalClients)

                if (page === 1) {
                  await loadProjects({ showLoader: false, throwOnError: true })
                } else {
                  setPage(1)
                }
              },
              {
                loadingMessage: "Saving clients...",
                successMessage: "Clients updated",
                fallbackError: "Failed to update clients",
                suppressErrorToast: isValidationError
              }
            )

            setOpenClientDropdown(null)

          } catch (error) {
            if (isValidationError(error)) {
              const { fieldErrors, formError: nextFormError } = splitValidationErrors(error)

              setFormError(fieldErrors.clientIds || nextFormError)
            }

            return

          } finally {

            setSaving(false)

          }
        }}
      >
        {saving ? "Saving..." : "Save"}
      </button>

      {formError && (
        <p className="mt-2 text-2xl text-red-400">
          {formError}
        </p>
      )}
    </div>
  )
}

export default AssignClients
