import { useEffect, useState } from "react"
import toast from "react-hot-toast"

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

  const isOpen = openClientDropdown === p._id

  useEffect(() => {

    if (isOpen) {
      setSelectedClients((prev) => ({
        ...prev,
        [p._id]: p.clients || [],
      }))
    }
    
  }, [isOpen, p._id, p.clients, setSelectedClients])

  if (!isOpen) return null

  return (

    <div className="absolute mt-3 w-72 rounded-lg bg-[#18181B] border border-white/10 p-3 z-10">

      <div className="max-h-40 overflow-y-auto space-y-2">

        {clients.map((c) => (

          <label key={c._id} className="flex gap-2 text-sm">

            <input
              type="checkbox"
              checked={selectedClients[p._id]?.includes(c._id) || false}

              onChange={() => {
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

        className="text-xs mt-3 w-full py-2 rounded-md border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={saving}
        onClick={async () => {
          const finalClients = selectedClients[p._id] || []

          if (hasSameSelection(p.clients || [], finalClients)) {

            setOpenClientDropdown(null)
            return

          }

          try {
            setSaving(true)

            await toast.promise(

              (async () => {

                await assignClient(p._id, finalClients)

                if (page === 1) {

                  await loadProjects({ showLoader: false, throwOnError: true })

                } else {

                  setPage(1)

                }

              })(),

              {
                loading: "Saving clients...",
                success: "Clients updated",
                error: (error) =>
                  error?.response?.data?.error || "Failed to update clients",
              }

            )

            setOpenClientDropdown(null)

          } catch {

            return

          } finally {

            setSaving(false)

          }
        }}
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  )
}

export default AssignClients
