import { useEffect } from "react"

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

  const isOpen = openMemberDropdown === p._id

  useEffect(() => {

    if (isOpen) {

      setSelectedMembers((prev) => ({

        ...prev,
        [p._id]: p.members || [],

      }))

    }

  }, [isOpen, p._id, p.members, setSelectedMembers])

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
                
                setSelectedMembers((prev) => {

                  const arr = prev[p._id] || []

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

        className="text-xs mt-3 w-full py-2 rounded-md border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500"

        onClick={async () => {

          const finalMembers = selectedMembers[p._id] || []

          await assignMember(p._id, finalMembers)

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