import { Trash2, User2, Users } from "lucide-react"
import AssignClients from "./AssignClients"
import AssignMembers from "./AssignMembers"

const ProjectCard = ({ p, user, canAssign, clients, members,
  openClientDropdown, setOpenClientDropdown,
  openMemberDropdown, setOpenMemberDropdown,
  selectedClients, setSelectedClients,
  selectedMembers, setSelectedMembers,
  handleDelete, handleStatusChange,
  assignClient, assignMember,
  loadProjects, page, setPage
}) => {

  return (
    <div className="relative rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] space-y-4">

      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-medium">{p.name}</h2>
          <p className="text-xs text-white/40">No description</p>
        </div>

        {(user.role === "owner" || user.role === "admin") && (
          <button onClick={() => handleDelete(p._id)}>
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        )}
      </div>

      <select
        value={p.status}
        onChange={(e) => handleStatusChange(p._id, e.target.value)}
        className="border border-white/10 text-xs px-2 py-1 rounded-md"
      >
        <option value="active">Active</option>
        <option value="on-hold">On Hold</option>
        <option value="completed">Completed</option>
      </select>

      {canAssign && (
        <div className="text-sm text-white/60 flex gap-2">
          <User2 className="w-4 h-4" />
          {p.clients?.length > 0
            ? p.clients.map(id => clients.find(x => x._id === id)?.email).filter(Boolean).join(", ")
            : "No clients"}
        </div>
      )}

      {canAssign && (
        <div className="text-sm text-white/60 flex gap-2">
          <Users className="w-4 h-4" />
          {p.members?.length > 0
            ? p.members.map(id => members.find(x => x._id === id)?.email).filter(Boolean).join(", ")
            : "No members"}
        </div>
      )}

      {canAssign && (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setOpenClientDropdown(openClientDropdown === p._id ? null : p._id)
              setOpenMemberDropdown(null)
            }}
            className="text-xs px-3 py-1 rounded-md bg-white/10"
          >
            Clients
          </button>

          <button
            onClick={() => {
              setOpenMemberDropdown(openMemberDropdown === p._id ? null : p._id)
              setOpenClientDropdown(null)
            }}
            className="text-xs px-3 py-1 rounded-md bg-white/10"
          >
            Members
          </button>
        </div>
      )}

      <AssignClients {...{
        p, clients, openClientDropdown, setOpenClientDropdown,
        selectedClients, setSelectedClients,
        assignClient, loadProjects, page, setPage
      }} />

      <AssignMembers {...{
        p, members, openMemberDropdown, setOpenMemberDropdown,
        selectedMembers, setSelectedMembers,
        assignMember, loadProjects, page, setPage
      }} />

    </div>
  )
}

export default ProjectCard