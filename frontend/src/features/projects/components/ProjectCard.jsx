import { useNavigate } from "react-router-dom"
import { Trash2, User2, Users } from "lucide-react"
import AssignClients from "./AssignClients"
import AssignMembers from "./AssignMembers"
import { formatDate } from "@/shared/utils/formatDate"

const formatResolvedAssignments = (ids = [], items = [], fallbackLabel) => {
  const labels = ids
    .map((id) => items.find((item) => item._id === id)?.email)
    .filter(Boolean)

  return labels.length > 0 ? labels.join(", ") : fallbackLabel
}

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
  deletingProjectId,
  updatingProjectId,
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
  const formattedTargetDate = formatDate(p.targetDate)

  const projectRouteState = {
    projectName: p.name,
    projectDescription: p.description || "",
    projectTargetDate: p.targetDate || "",
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
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <h2 className="font-medium text-white text-2xl truncate">{p.name}</h2>
          <p className="text-2xl text-white/40 line-clamp-2">
            {p.description || "No description"}
          </p>

          {formattedTargetDate && (
            <p className="pt-1 text-2xl text-white/60">
              Target Date: {formattedTargetDate}
            </p>
          )}
        </div>

        {(user.role === "owner" || user.role === "admin") && (
          <button
            disabled={deletingProjectId === p._id}
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(p._id)
            }}
            className="disabled:cursor-not-allowed disabled:opacity-60 shrink-0"
          >
            <div className="p-2 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-red-500">
              <Trash2 className="h-6 w-6" />
            </div>
          </button>
        )}
      </div>

      <select
        value={p.status}
        disabled={updatingProjectId === p._id}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => handleStatusChange(p._id, e.target.value)}
        className="border border-white/10 text-2xl px-2 py-1 rounded-md bg-transparent disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="active">Active</option>
        <option value="on-hold">On Hold</option>
        <option value="completed">Completed</option>
      </select>

      {updatingProjectId === p._id && (
        <p className="text-2xl text-white/40">
          Updating status...
        </p>
      )}

      {canAssign && (
        <div className="text-white/60 flex items-center gap-4">
          <User2 className="h-6 w-6" />
          {formatResolvedAssignments(p.clients, clients, "No clients")}
        </div>
      )}

      {canAssign && (
        <div className="text-white/60 flex items-center gap-4">
          <Users className="h-6 w-6" />
          {formatResolvedAssignments(p.members, members, "No members")}
        </div>
      )}

      {canAssign && (
        <div className="flex gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setOpenClientDropdown(openClientDropdown === p._id ? null : p._id)
              setOpenMemberDropdown(null)
            }}
            className="text-2xl px-3 py-1 rounded-md border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500"
          >
            Clients
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setOpenMemberDropdown(openMemberDropdown === p._id ? null : p._id)
              setOpenClientDropdown(null)
            }}
            className="text-2xl px-3 py-1 rounded-md border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500"
          >
            Members
          </button>
        </div>
      )}

      {p.unreadCount > 0 && (
        <div className="flex justify-end">
          <span className="rounded-lg bg-gradient-to-br from-[#18181B] to-green-500 px-2 py-1 text-2xl font-medium">
            {p.unreadCount} unread
          </span>
        </div>
      )}

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
