import { useCallback, useEffect, useState } from "react"
import {
  fetchProjects,
  createProject,
  deleteProject,
  assignClient,
  assignMember,
  updateProjectStatus,
} from "../../api/projects"
import { useAuth } from "../../context/AuthContext"
import { fetchClients } from "../../api/clients"
import { fetchMembers } from "../../api/members"
import { triggerDashboardRefresh } from "../../utils/dashboardRefresh"
import ProjectsPagination from "../../components/ProjectsPagination"

import CreateProjectForm from "./CreateProjectForm"
import ProjectCard from "./ProjectCard"

const Projects = () => {
  const { user } = useAuth()

  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [members, setMembers] = useState([])

  const [openClientDropdown, setOpenClientDropdown] = useState(null)
  const [openMemberDropdown, setOpenMemberDropdown] = useState(null)
  const [selectedClients, setSelectedClients] = useState({})
  const [selectedMembers, setSelectedMembers] = useState({})

  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const canAssign = user?.role === "owner" || user?.role === "admin"

  const loadProjects = useCallback(async () => {

    const res = await fetchProjects({ page, limit: 4 })
    setProjects(res.data.projects.data)
    setPagination(res.data.projects.pagination)
    
  }, [page])

  useEffect(() => {

    loadProjects()

  }, [loadProjects])

  useEffect(() => {

    if (!canAssign) return

    fetchClients().then((res) => setClients(res.data.clients))
    fetchMembers().then((res) => setMembers(res.data.members))

  }, [canAssign])

  const handleCreate = async (name) => {

    const safeName = name.trim()

    if (!safeName) {

      throw new Error("Project name required")

    }

    try {

      await createProject({ name: safeName })

      page === 1 ? await loadProjects() : setPage(1)

      triggerDashboardRefresh()

    } catch (error) {

      throw new Error(error?.response?.data?.error || "Failed to create project")

    }

  }

  const handleDelete = async (id) => {

    if (!confirm("Delete this project?")) return

    await deleteProject(id)

    if (projects.length === 1 && page > 1) {

      setPage((p) => p - 1)

    } else {

      setPage(1)

    }

  }

  const handleStatusChange = async (id, status) => {

    await updateProjectStatus(id, status)

    setProjects((prev) =>

      prev.map((p) => (p._id === id ? { ...p, status } : p))

    )

    triggerDashboardRefresh()

  }

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-2xl font-semibold">Projects</h1>

        <p className="text-sm text-white/60">
          Manage and track your projects
        </p>

      </div>

      {user?.role !== "client" && (

        <CreateProjectForm
          onSubmit={handleCreate}
        />

      )}

      <div className="grid md:grid-cols-2 gap-4">

        {projects.map((p) => (

          <ProjectCard
            key={p._id}
            p={p}
            user={user}
            canAssign={canAssign}
            clients={clients}
            members={members}
            openClientDropdown={openClientDropdown}
            setOpenClientDropdown={setOpenClientDropdown}
            openMemberDropdown={openMemberDropdown}
            setOpenMemberDropdown={setOpenMemberDropdown}
            selectedClients={selectedClients}
            setSelectedClients={setSelectedClients}
            selectedMembers={selectedMembers}
            setSelectedMembers={setSelectedMembers}
            handleDelete={handleDelete}
            handleStatusChange={handleStatusChange}
            assignClient={assignClient}
            assignMember={assignMember}
            loadProjects={loadProjects}
            page={page}
            setPage={setPage}
          />

        ))}

      </div>

      <ProjectsPagination
        page={page}
        totalPages={pagination.totalPages || 1}
        onPageChange={setPage}
      />

    </div>
  )
}

export default Projects
