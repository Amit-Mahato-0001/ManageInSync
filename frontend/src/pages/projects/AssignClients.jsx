import { useEffect } from "react"

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
                      ? arr.filter((i) => i !== c._id)
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

        className="text-xs mt-3 w-full py-2 rounded-md border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500"

        onClick={async () => {
          const finalClients = selectedClients[p._id] || []

          await assignClient(p._id, finalClients)

          setOpenClientDropdown(null)

          page === 1 ? await loadProjects() : setPage(1)
        }}
      >

        Save
      </button>

    </div>

  )

}

export default AssignClients