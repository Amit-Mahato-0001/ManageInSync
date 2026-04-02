import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
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

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.error || error?.response?.data?.message || fallback
}

const runAsyncToast = async (loadingMessage, action, fallbackError) => {
  const toastId = toast.loading(loadingMessage)

  try {
    const result = await action()
    toast.dismiss(toastId)
    return result
  } catch (error) {
    toast.error(getErrorMessage(error, fallbackError), { id: toastId })
    throw error
  }
}

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deletingProjectId, setDeletingProjectId] = useState(null)
  const [updatingProjectId, setUpdatingProjectId] = useState(null)
  const canAssign = user?.role === "owner" || user?.role === "admin"

  const loadProjects = useCallback(async ({ showLoader = true, throwOnError = false } = {}) => {
    try {
      if (showLoader) {
        setLoading(true)
      }

      const res = await fetchProjects({ page, limit: 4 })
      setProjects(res.data.projects.data)
      setPagination(res.data.projects.pagination)
      setError("")
    } catch (requestError) {
      console.error(requestError)
      setError(getErrorMessage(requestError, "Failed to load projects"))

      if (throwOnError) {
        throw requestError
      }
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }, [page])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    if (!canAssign) return

    let isMounted = true

    const loadAssignableEntities = async () => {
      try {
        const [clientsResponse, membersResponse] = await Promise.all([
          fetchClients(),
          fetchMembers()
        ])

        if (!isMounted) return

        setClients(clientsResponse.data.clients)
        setMembers(membersResponse.data.members)
      } catch (requestError) {
        console.error(requestError)
      }
    }

    loadAssignableEntities()

    return () => {
      isMounted = false
    }
  }, [canAssign])

  const handleCreate = async (name) => {
    const safeName = name.trim()

    try {
      await createProject({ name: safeName })

      if (page === 1) {
        await loadProjects({ showLoader: false, throwOnError: true })
      } else {
        setPage(1)
      }

      triggerDashboardRefresh()
    } catch (requestError) {
      throw new Error(getErrorMessage(requestError, "Failed to create project"))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Delete this project?")) return

    try {
      setDeletingProjectId(id)

      await toast.promise(
        (async () => {
          await deleteProject(id)

          if (projects.length === 1 && page > 1) {
            setPage((prevPage) => prevPage - 1)
          } else if (page === 1) {
            await loadProjects({ showLoader: false, throwOnError: true })
          } else {
            setPage(1)
          }

          triggerDashboardRefresh()
        })(),
        {
          loading: "Deleting project...",
          success: "Project deleted",
          error: (requestError) =>
            getErrorMessage(requestError, "Failed to delete project"),
        }
      )
    } catch {
      return
    } finally {
      setDeletingProjectId(null)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      setUpdatingProjectId(id)

      await runAsyncToast(
        "Updating project status...",
        async () => {
          await updateProjectStatus(id, status)

          setProjects((prev) =>
            prev.map((project) => (project._id === id ? { ...project, status } : project))
          )

          triggerDashboardRefresh()
        },
        "Failed to update project status"
      )
    } catch {
      return
    } finally {
      setUpdatingProjectId(null)
    }
  }

  if (loading) {
    return <p>Loading projects...</p>
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

      {error && <p className="text-sm text-red-500">{error}</p>}

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
            deletingProjectId={deletingProjectId}
            updatingProjectId={updatingProjectId}
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

      {!error && projects.length === 0 && (
        <p className="text-sm text-white/40">
          No projects found
        </p>
      )}

      <ProjectsPagination
        page={page}
        totalPages={pagination.totalPages || 1}
        onPageChange={setPage}
      />
    </div>
  )
}

export default Projects
