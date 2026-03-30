import { useCallback, useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { ArrowLeft, Rocket, Trash2, X } from "lucide-react"
import toast from "react-hot-toast"
import { createTask, deleteTask, fetchTasks, updateTask } from "../../api/tasks"
import { useAuth } from "../../context/AuthContext"
import TasksPagination from "../../components/TasksPagination"

const getStatusStyle = (status) => {
  if (status === "todo") return "bg-yellow-500/10 text-yellow-400"
  if (status === "in-progress") return "bg-blue-500/10 text-blue-400"
  if (status === "done") return "bg-green-500/10 text-green-400"

  return "bg-white/10 text-white/60"
}

const getPriorityStyle = (priority) => {
  if (priority === "low") return "bg-gray-500/10 text-gray-400"
  if (priority === "medium") return "bg-orange-500/10 text-orange-400"
  if (priority === "high") return "bg-red-500/10 text-red-400"

  return "bg-white/10 text-white/60"
}

const getTabClassName = (active) => {
  return active
    ? "rounded-lg bg-white px-4 py-2 text-sm font-medium border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500"
    : "px-4 py-2 text-sm font-medium"
}

const ProjectTasks = () => {
  const { projectId } = useParams()
  const { state } = useLocation()
  const { user } = useAuth()

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [title, setTitle] = useState("")
  const [status, setStatus] = useState("todo")
  const [priority, setPriority] = useState("medium")
  const [submitting, setSubmitting] = useState(false)
  const [deletingTaskId, setDeletingTaskId] = useState(null)
  const [updatingTaskId, setUpdatingTaskId] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})

  const canCreateTasks = user?.role === "owner" || user?.role === "admin"
  const canUpdateTasks =
    user?.role === "owner" || user?.role === "admin" || user?.role === "member"
  const currentUserId = user?.userId
  const projectName = state?.projectName || "Project"
  const unreadCount = Number(state?.unreadCount) || 0
  const isCompletedProject = state?.projectStatus === "completed"
  const projectRouteState = {
    projectName,
    projectStatus: state?.projectStatus,
    unreadCount
  }

  const showError = (message) => {
    setError(message)
    toast.error(message)
  }

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const res = await fetchTasks(projectId, { page, limit: 5 })
      setTasks(res.data.tasks.data)
      setPagination(res.data.tasks.pagination)
    } catch (err) {
      showError(err?.response?.data?.error || "Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }, [projectId, page])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const handleOpenCreateModal = () => {
    if (!canCreateTasks) {
      showError("Only owner/admin can create tasks")
      return
    }

    if (isCompletedProject) {
      showError("Cannot create tasks in completed projects")
      return
    }

    setError("")
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    if (submitting) return

    setIsCreateModalOpen(false)
    setTitle("")
    setStatus("todo")
    setPriority("medium")
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()

    if (!canCreateTasks) {
      showError("Only owner/admin can create tasks")
      return
    }

    if (isCompletedProject) {
      showError("Cannot create tasks in completed projects")
      return
    }

    if (!currentUserId) {
      showError("Session expired")
      return
    }

    if (!title.trim()) {
      showError("Title required")
      return
    }

    try {
      setSubmitting(true)
      setError("")

      await createTask(projectId, {
        title: title.trim(),
        assigneeId: currentUserId,
        status,
        priority
      })

      setTitle("")
      setStatus("todo")
      setPriority("medium")
      setIsCreateModalOpen(false)

      if (page === 1) {
        await loadTasks()
      } else {
        setPage(1)
      }
    } catch (err) {
      showError(err?.response?.data?.error || "Failed to create task")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!canCreateTasks) {
      showError("Not allowed")
      return
    }

    if (!confirm("Delete this task?")) return

    try {
      setDeletingTaskId(taskId)
      setError("")

      await deleteTask(projectId, taskId)

      if (tasks.length === 1 && page > 1) {
        setPage((prev) => prev - 1)
      } else {
        await loadTasks()
      }
    } catch (err) {
      showError(err?.response?.data?.error || "Failed to delete task")
    } finally {
      setDeletingTaskId(null)
    }
  }

  const handleUpdateTask = async (task, updates) => {
    if (!canUpdateTasks) {
      showError("Not allowed")
      return
    }

    if (isCompletedProject) {
      showError("Cannot update tasks in completed projects")
      return
    }

    const [field] = Object.keys(updates)

    if (!field || task[field] === updates[field]) return

    try {
      setUpdatingTaskId(task._id)
      setError("")

      await updateTask(projectId, task._id, updates)
      await loadTasks()
    } catch (err) {
      showError(err?.response?.data?.error || "Failed to update task")
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const totalPages =
    Number.isFinite(pagination.totalPages) && pagination.totalPages > 0
      ? pagination.totalPages
      : 1

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2"
            >
              <ArrowLeft size={30} />
            </Link>

            <div>
              <h1 className="text-2xl font-semibold">{projectName}</h1>
              <p className="text-sm text-white/60">
                Track progress and manage project tasks
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/projects/${projectId}/tasks`}
                state={projectRouteState}
                className={getTabClassName(true)}
              >
                Tasks
              </Link>

              <Link
                to={`/projects/${projectId}/conversation`}
                state={projectRouteState}
                className={getTabClassName(false)}
              >
                Conversation
              </Link>

              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-300">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {canCreateTasks ? (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                disabled={isCompletedProject}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Create Task
                <Rocket size={16} />
              </button>
            ) : (
              <p className="text-sm text-white/40">
                Only owner/admin can create tasks. Members can update status and priority.
              </p>
            )}
          </div>
        </div>

        {error && <p className="hidden text-sm text-red-500">{error}</p>}

        <div className="space-y-3">
          {!loading && tasks.map((task) => (
            <div
              key={task._id}
              className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-xl p-5 border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B]"
            >
              <div className="space-y-2">
                <h2 className="font-medium">{task.title}</h2>
                <div className="flex gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-md ${getStatusStyle(task.status)}`}>
                    {task.status}
                  </span>
                  <span className={`px-2 py-1 rounded-md ${getPriorityStyle(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canUpdateTasks && (
                  <>
                    <select
                      value={task.status}
                      disabled={updatingTaskId === task._id || isCompletedProject}
                      onChange={(e) => handleUpdateTask(task, { status: e.target.value })}
                      className="border border-white/10 px-3 py-2 rounded-md text-sm bg-transparent"
                    >
                      <option value="todo">Todo</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>

                    <select
                      value={task.priority}
                      disabled={updatingTaskId === task._id || isCompletedProject}
                      onChange={(e) => handleUpdateTask(task, { priority: e.target.value })}
                      className="border border-white/10 px-3 py-2 rounded-md text-sm bg-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </>
                )}

                {canCreateTasks && (
                  <button
                    disabled={deletingTaskId === task._id || updatingTaskId === task._id}
                    onClick={() => handleDeleteTask(task._id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}

                {updatingTaskId === task._id && (
                  <span className="text-xs text-white/50">
                    Updating...
                  </span>
                )}
              </div>
            </div>
          ))}

          {!loading && tasks.length === 0 && (
            <p className="text-sm text-white/40">No tasks in this project</p>
          )}

          <TasksPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Create Task</h2>
                <p className="mt-1 text-sm text-white/50">
                  Add a new task for this project
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseCreateModal}
              >
                <X size={30} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Task Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title..."
                  className="w-full rounded-lg border border-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                >
                  <option value="todo" className="bg-[#0B0F19]">Todo</option>
                  <option value="in-progress" className="bg-[#0B0F19]">In Progress</option>
                  <option value="done" className="bg-[#0B0F19]">Done</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                >
                  <option value="low" className="bg-[#0B0F19]">Low</option>
                  <option value="medium" className="bg-[#0B0F19]">Medium</option>
                  <option value="high" className="bg-[#0B0F19]">High</option>
                </select>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting || isCompletedProject}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  <Rocket size={16} />
                  {submitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default ProjectTasks