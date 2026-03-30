import { Trash2, User2, Users } from "lucide-react"
import AssignClients from "./AssignClients"
import AssignMembers from "./AssignMembers"
import { useNavigate } from "react-router-dom"

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
  setPage
}) => {

  const navigate = useNavigate()
  const canViewTasks = user?.role !== "client"
  const projectRouteState = {
    projectName: p.name,
    projectStatus: p.status,
    unreadCount: p.unreadCount || 0
  }

  const handleCardClick = () => {
    navigate(canViewTasks ? `/projects/${p._id}/tasks` : `/projects/${p._id}/conversation`, {
      state: projectRouteState
    })
  }

  return (
    <div
      onClick={handleCardClick}
      className="relative cursor-pointer rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] space-y-4 hover:border-blue-500 transition"
    >

      {/* Top Section */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-medium">{p.name}</h2>
          <p className="text-xs text-white/40">No description</p>
        </div>

        {(user.role === "owner" || user.role === "admin") && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(p._id)
            }}
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        )}
      </div>

      {/* Status Dropdown */}
      <select
        value={p.status}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => handleStatusChange(p._id, e.target.value)}
        className="border border-white/10 text-xs px-2 py-1 rounded-md bg-transparent"
      >
        <option value="active">Active</option>
        <option value="on-hold">On Hold</option>
        <option value="completed">Completed</option>
      </select>

      {/* Clients */}
      {canAssign && (
        <div className="text-sm text-white/60 flex gap-2">
          <User2 className="w-4 h-4" />
          {p.clients?.length > 0
            ? p.clients
                .map(id => clients.find(x => x._id === id)?.email)
                .filter(Boolean)
                .join(", ")
            : "No clients"}
        </div>
      )}

      {/* Members */}
      {canAssign && (
        <div className="text-sm text-white/60 flex gap-2">
          <Users className="w-4 h-4" />
          {p.members?.length > 0
            ? p.members
                .map(id => members.find(x => x._id === id)?.email)
                .filter(Boolean)
                .join(", ")
            : "No members"}
        </div>
      )}

      {/* Assign Buttons */}
      {canAssign && (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setOpenClientDropdown(openClientDropdown === p._id ? null : p._id)
              setOpenMemberDropdown(null)
            }}
            className="text-xs px-3 py-1 rounded-md bg-white/10"
          >
            Clients
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setOpenMemberDropdown(openMemberDropdown === p._id ? null : p._id)
              setOpenClientDropdown(null)
            }}
            className="text-xs px-3 py-1 rounded-md bg-white/10"
          >
            Members
          </button>
        </div>
      )}

      {p.unreadCount > 0 && (
        <div className="flex justify-end">
          <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-300">
            {p.unreadCount} unread
          </span>
        </div>
      )}

      {/* Dropdowns */}
      <div onClick={(e) => e.stopPropagation()}>
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
            setPage
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
            setPage
          }}
        />
      </div>

    </div>
  )
}

export default ProjectCard
