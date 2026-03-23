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
  setPage,
}) => {
  if (openMemberDropdown !== p._id) return null

  return (

    <div className="absolute mt-14 w-96 rounded text-gray-400 bg-white shadow p-3 z-10">

      <div className="max-h-40 overflow-y-auto space-y-2">

        {members.map((m) => (

          <label key={m._id} className="flex items-center gap-2 text-sm">

            <input
              type="checkbox"
              checked={
                selectedMembers[p._id]?.includes(m._id) ||
                p.members?.includes(m._id)
              }

              onChange={() => {
                setSelectedMembers((prev) => {
                  const arr = prev[p._id] || [];
                  return {
                    ...prev,
                    [p._id]: arr.includes(m._id)
                      ? arr.filter((i) => i !== m._id)
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

        className="mt-3 w-full bg-blue-500 text-white text-sm py-2 rounded-full hover:bg-blue-600 transition shadow-sm"
        onClick={async () => {

          const existing = p.members || []
          const selected = selectedMembers[p._id] || []
          const finalMembers = [...new Set([...existing, ...selected])]

          if (finalMembers.length === 0) return

          await assignMember(p._id, finalMembers)

          setSelectedMembers((prev) => ({ ...prev, [p._id]: [] }))
          setOpenMemberDropdown(null)

          page === 1 ? await loadProjects() : setPage(1)
        }}
      >
        Save
      </button>

    </div>

  )

}

export default AssignMembers
