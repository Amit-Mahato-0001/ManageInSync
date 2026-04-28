import { useCallback, useEffect, useState } from "react"
import {
  fetchProjects,
  createProject,
  deleteProject,
  assignClient,
  assignMember,
  updateProjectStatus,
} from "../api/projects"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { fetchClients } from "@/features/clients/api/clients"
import { fetchMembers } from "@/features/members/api/members"
import { triggerDashboardRefresh } from "@/shared/utils/dashboardRefresh"
import InfiniteScrollSentinel from "@/shared/components/InfiniteScrollSentinel"

import CreateProjectForm from "../components/CreateProjectForm"
import ProjectCard from "../components/ProjectCard"
import { getErrorMessage, runAsyncToast } from "../utils/projectModuleUtils"

const Projects = () => {
  const { user } = useAuth()

  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [members, setMembers] = useState([])

  const [openClientDropdown, setOpenClientDropdown] = useState(null)
  const [openMemberDropdown, setOpenMemberDropdown] = useState(null)
  const [selectedClients, setSelectedClients] = useState({})
  const [selectedMembers, setSelectedMembers] = useState({})

  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [deletingProjectId, setDeletingProjectId] = useState(null)
  const [updatingProjectId, setUpdatingProjectId] = useState(null)
  const canAssign = user?.role === "owner" || user?.role === "admin"

  const loadProjects = useCallback(async ({
    pageToLoad = 1,
    append = false,
    showLoader = true,
    throwOnError = false
  } = {}) => {
    try {
      if (showLoader) {
        setLoading(true)
      }

      const res = await fetchProjects({ page: pageToLoad, limit: 10 })
      const nextProjects = res.data.projects.data

      setProjects((prev) => (append ? [...prev, ...nextProjects] : nextProjects))
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
  }, [])

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

  const handleCreate = async ({ name, description, targetDate }) => {
    await createProject({
      name: name.trim(),
      description,
      targetDate
    })

    await loadProjects({ pageToLoad: 1, showLoader: false, throwOnError: true })

    triggerDashboardRefresh()
  }

  const handleDelete = async (id) => {
    if (!confirm("Delete this project?")) return

    try {
      setDeletingProjectId(id)

      await runAsyncToast(
        async () => {
          await deleteProject(id)

          await loadProjects({ pageToLoad: 1, showLoader: false, throwOnError: true })

          triggerDashboardRefresh()
        },
        {
          loadingMessage: "Deleting project...",
          successMessage: "Project deleted",
          fallbackError: "Failed to delete project"
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
        async () => {
          await updateProjectStatus(id, status)

          setProjects((prev) =>
            prev.map((project) => (project._id === id ? { ...project, status } : project))
          )

          triggerDashboardRefresh()
        },
        {
          loadingMessage: "Updating project status...",
          successMessage: "Project status updated",
          fallbackError: "Failed to update project status"
        }
      )
    } catch {
      return
    } finally {
      setUpdatingProjectId(null)
    }
  }

  const handleLoadMore = useCallback(async () => {
    const nextPage = (pagination.page || 1) + 1

    if (loadingMore || nextPage > (pagination.totalPages || 1)) {
      return
    }

    try {
      setLoadingMore(true)
      await loadProjects({
        pageToLoad: nextPage,
        append: true,
        showLoader: false,
        throwOnError: true
      })
    } catch {
      return
    } finally {
      setLoadingMore(false)
    }
  }, [loadProjects, loadingMore, pagination.page, pagination.totalPages])

  if (loading) {
    return <p>Loading projects...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-5xl font-semibold">Projects</h1>

          <p className="text-2xl text-white/60">
            Manage and track your projects
          </p>
        </div>

        {user?.role !== "client" && (
          <CreateProjectForm
            onSubmit={handleCreate}
          />
        )}
      </div>

      {error && <p className="text-2xl text-red-500">{error}</p>}

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
          />
        ))}
      </div>

      {!error && projects.length === 0 && (
        <p className="text-2xl text-white/40">
          No projects found
        </p>
      )}

      <InfiniteScrollSentinel
        hasMore={(pagination.page || 1) < (pagination.totalPages || 1)}
        loading={loadingMore}
        onLoadMore={handleLoadMore}
      />
    </div>
  )
}

export default Projects
