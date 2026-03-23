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
  setPage,
}) => {
  if (openClientDropdown !== p._id) return null

  return (
    <div className="absolute mt-14 w-96 rounded text-gray-400 bg-white shadow p-3 z-10">
      <div className="max-h-40 overflow-y-auto space-y-2">
        {clients.map((c) => (
          <label key={c._id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={
                selectedClients[p._id]?.includes(c._id) ||
                p.clients?.includes(c._id)
              }
              onChange={() => {
                setSelectedClients((prev) => {
                  const arr = prev[p._id] || []
                  return {
                    ...prev,
                    [p._id]: arr.includes(c._id)
                      ? arr.filter((i) => i !== c._id)
                      : [...arr, c._id],
                  };
                });
              }}
            />
            {c.email}
          </label>
        ))}
      </div>

      <button

        className="mt-3 w-full bg-blue-500 text-white text-sm py-2 rounded-full hover:bg-blue-600 transition shadow-sm"

        onClick={async () => {

          const existing = p.clients || []
          const selected = selectedClients[p._id] || []
          const finalClients = [...new Set([...existing, ...selected])]

          if (finalClients.length === 0) return

          await assignClient(p._id, finalClients)

          setSelectedClients((prev) => ({ ...prev, [p._id]: [] }))
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
