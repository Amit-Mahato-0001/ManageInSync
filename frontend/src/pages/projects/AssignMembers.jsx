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

const AssignMembers = ({
  p,
  members,
  openMemberDropdown,
  setOpenMemberDropdown,
  selectedMembers,
  setSelectedMembers,
  assignMember,
  loadProjects,
  page,
  setPage
}) => {

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const isOpen = openMemberDropdown === p._id

  useEffect(() => {

    if (isOpen) {
      const validProjectMemberIds = getValidSelectedIds(p.members, members)

      setSelectedMembers((prev) => ({

        ...prev,
        [p._id]: validProjectMemberIds,

      }))

      setFormError("")

    }

  }, [isOpen, members, p._id, p.members, setSelectedMembers])

  if (!isOpen) return null

  return (

    <div className="absolute mt-3 w-72 rounded-lg bg-[#18181B] border border-white/10 p-3 z-10">

      <div className="max-h-40 overflow-y-auto space-y-2">

        {members.map((m) => (

          <label key={m._id} className="flex gap-2 text-sm">

            <input
              type="checkbox"
              checked={selectedMembers[p._id]?.includes(m._id) || false}

              onChange={() => {
                setFormError("")

                setSelectedMembers((prev) => {

                  const arr = prev[p._id] || []

                  return {

                    ...prev,
                    [p._id]: arr.includes(m._id)
                      ? arr.filter((id) => id !== m._id)
                      : [...arr, m._id],
                  }

                })

              }}

            />

            {m.email}

          </label>

        ))}

      </div>

      <button
      
        className="text-xs mt-3 w-full py-2 rounded-md border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={saving}
        onClick={async () => {
          const finalMembers = getValidSelectedIds(selectedMembers[p._id], members)

          if (hasSameSelection(p.members || [], finalMembers)) {
            setOpenMemberDropdown(null)
            return
          }

          try {
            setSaving(true)
            setFormError("")

            await runAsyncToast(
              async () => {
                await assignMember(p._id, finalMembers)

                if (page === 1) {
                  await loadProjects({ showLoader: false, throwOnError: true })
                } else {
                  setPage(1)
                }
              },
              {
                loadingMessage: "Saving members...",
                successMessage: "Members updated",
                fallbackError: "Failed to update members",
                suppressErrorToast: isValidationError
              }
            )

            setOpenMemberDropdown(null)
          } catch (error) {
            if (isValidationError(error)) {
              const { fieldErrors, formError: nextFormError } = splitValidationErrors(error)

              setFormError(fieldErrors.memberIds || nextFormError)
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
        <p className="mt-2 text-xs text-red-400">
          {formError}
        </p>
      )}
    </div>
  )
}

export default AssignMembers
