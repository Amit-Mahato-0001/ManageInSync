import { Trash2, User2, Users } from "lucide-react"
import AssignClients from "./AssignClients"
import AssignMembers from "./AssignMembers"

const ProjectCard = ({
  p,
  user,
  canAssign,
  clients,
  members,
  openClientDropdown,
  setOpenClientDropdown,
  openMemberDropdown,
  setOpenMemberDropdown,
  selectedClients,
  setSelectedClients,
  selectedMembers,
  setSelectedMembers,
  handleDelete,
  handleStatusChange,
  assignClient,
  assignMember,
  loadProjects,
  page,
  setPage,
}) => {

  return (

    <div className="p-4 rounded-lg shadow relative">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold">{p.name}</h2>

        {canAssign && (

          <div className="flex gap-3">

            <button

              onClick={() => {
                setOpenClientDropdown(openClientDropdown === p._id ? null : p._id)
                setOpenMemberDropdown(null)
              }}
              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition shadow-sm text-sm"
            >
              Assign Clients
            </button>

            <button

              onClick={() => {
                setOpenMemberDropdown(openMemberDropdown === p._id ? null : p._id);
                setOpenClientDropdown(null)
              }}
              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition shadow-sm text-sm"
            >
              Assign Members
            </button>

            {(user.role === "owner" || user.role === "admin") && (

              <button className="text-red-500 text-sm" onClick={() => handleDelete(p._id)}>

                <Trash2
                  size={34}
                  className="bg-red-200 p-1 text-red-500 rounded-full hover:bg-red-300 hover:text-red-600 transition shadow-sm"
                />

              </button>

            )}

          </div>

        )}

      </div>

      {/* Clients */}
      {canAssign && (

        <div className="flex mt-2 flex-wrap items-center gap-2">

          <User2 size={18} className="bg-blue-200 text-blue-600 rounded-full" />

          <span className="text-sm p-2 text-gray-400">

            {p.clients?.length > 0
              ? p.clients
                  .map((id) => {
                    const c = clients.find((x) => x._id === id);
                    return c?.email
                  })
                  .filter(Boolean)
                  .join(", ")
              : "No clients assigned"}
          </span>

        </div>

      )}

      {/* Members */}

      {canAssign && (

        <div className="flex mt-2 flex-wrap items-center gap-2">

          <Users size={18} className="bg-blue-200 text-blue-600 rounded-full" />

          <span className="text-sm p-2 text-gray-400">

            {p.members?.length > 0
              ? p.members
                  .map((id) => {
                    const m = members.find((x) => x._id === id)
                    return m?.email
                  })
                  .filter(Boolean)
                  .join(", ")
              : "No members assigned"}

          </span>

        </div>
      )}

      <AssignClients
        {...{
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
        }}
      />

      <AssignMembers
        {...{
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
        }}
      />

      {(user?.role === "owner" || user?.role === "admin" || user?.role === "member") && (

        <select
          value={p.status}
          onChange={(e) => handleStatusChange(p._id, e.target.value)}
          className="border border-gray-300 rounded-full px-2 py-1 text-sm text-gray-500 hover:border-blue-500 focus:border-blue-500 focus:outline-none"
        >
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>

      )}

    </div>
  )
}

export default ProjectCard;
